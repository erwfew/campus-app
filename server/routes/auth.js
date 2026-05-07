const express = require('express');
const router = express.Router();
const { get, run, hashPassword, verifyPassword } = require('../db');
const { generateToken } = require('../middleware/auth');
const { AppError, AuthError } = require('../middleware/errorHandler');

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new AppError('INVALID_PARAMS', '请输入用户名和密码', 400);
    }

    const user = get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      throw new AuthError('用户名或密码错误');
    }

    if (!verifyPassword(password, user.password_hash, user.salt)) {
      throw new AuthError('用户名或密码错误');
    }

    const token = generateToken(user);
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          realName: user.real_name,
          role: user.role,
          avatar: user.avatar,
          college: user.college
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/register
 * 用户注册（仅允许学生注册，教师/管理员由后台创建）
 */
router.post('/register', (req, res, next) => {
  try {
    const { username, password, realName, studentId, college } = req.body;
    if (!username || !password || !realName) {
      throw new AppError('INVALID_PARAMS', '请填写完整的注册信息', 400);
    }
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      throw new AppError('INVALID_PARAMS', '密码至少8位且包含字母和数字', 400);
    }

    const existing = get('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
      throw new AppError('USER_EXISTS', '该用户名已存在', 409);
    }

    const { hash, salt } = hashPassword(password);
    const result = run(
      'INSERT INTO users (username, password_hash, salt, real_name, role, student_id, college) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, hash, salt, realName, 'student', studentId || '', college || '']
    );

    const token = generateToken({
      id: result.lastInsertRowid,
      username,
      role: 'student'
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: result.lastInsertRowid,
          username,
          realName,
          role: 'student',
          college: college || ''
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', (req, res, next) => {
  try {
    const { authenticate } = require('../middleware/auth');
    authenticate(req, res, () => {
      const user = get('SELECT id, username, real_name, role, avatar, college, phone, email, student_id FROM users WHERE id = ?', [req.user.id]);
      if (!user) {
        throw new AppError('USER_NOT_FOUND', '用户不存在', 404);
      }
      res.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          realName: user.real_name,
          role: user.role,
          avatar: user.avatar,
          college: user.college,
          phone: user.phone,
          email: user.email,
          studentId: user.student_id
        }
      });
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/verify
 * 获取认证状态
 */
router.get('/verify', (req, res, next) => {
  try {
    const { authenticate } = require('../middleware/auth');
    authenticate(req, res, () => {
      const user = get('SELECT verified, school_name, verify_date FROM users WHERE id = ?', [req.user.id]);
      res.json({
        success: true,
        data: {
          verified: !!(user && user.verified),
          schoolName: user ? user.school_name || '' : '',
          verifyDate: user ? user.verify_date || '' : ''
        }
      });
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/verify
 * 提交认证
 */
router.post('/verify', (req, res, next) => {
  try {
    const { authenticate } = require('../middleware/auth');
    authenticate(req, res, () => {
      const { schoolName, studentId } = req.body;
      if (!schoolName) {
        throw new AppError('INVALID_PARAMS', '请输入学校名称', 400);
      }
      const dateStr = new Date().toISOString().slice(0, 10);
      run(
        'UPDATE users SET verified = 1, school_name = ?, student_id = COALESCE(NULLIF(?, \'\'), student_id), verify_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [schoolName, studentId || '', dateStr, req.user.id]
      );
      res.json({
        success: true,
        data: { verified: true, schoolName, verifyDate: dateStr }
      });
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/auth/verify
 * 解除认证
 */
router.delete('/verify', (req, res, next) => {
  try {
    const { authenticate } = require('../middleware/auth');
    authenticate(req, res, () => {
      run(
        'UPDATE users SET verified = 0, school_name = \'\', verify_date = \'\', updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [req.user.id]
      );
      res.json({ success: true, data: { verified: false } });
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/auth/password
 * 修改密码
 */
router.put('/password', (req, res, next) => {
  try {
    const { authenticate } = require('../middleware/auth');
    authenticate(req, res, () => {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        throw new AppError('INVALID_PARAMS', '请输入旧密码和新密码', 400);
      }
      if (newPassword.length < 6) {
        throw new AppError('INVALID_PARAMS', '新密码长度不能少于6位', 400);
      }

      const user = get('SELECT * FROM users WHERE id = ?', [req.user.id]);
      if (!verifyPassword(oldPassword, user.password_hash, user.salt)) {
        throw new AuthError('旧密码错误');
      }

      const { hash, salt } = hashPassword(newPassword);
      run('UPDATE users SET password_hash = ?, salt = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hash, salt, req.user.id]);

      res.json({ success: true, data: { message: '密码修改成功' } });
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
