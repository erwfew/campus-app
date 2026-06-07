const express = require('express');
const router = express.Router();
const { hashPassword, verifyPassword } = require('../db');
const { generateToken, authenticate } = require('../middleware/auth');
const { AppError, AuthError } = require('../middleware/errorHandler');
const { validateRegister, validateLogin, validateChangePassword, validateVerify } = require('../middleware/validate');
const { UserQueries } = require('../db/queries');

// POST /api/auth/login
router.post('/login', validateLogin, (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = UserQueries.findByUsername(username);
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

// POST /api/auth/register
router.post('/register', validateRegister, (req, res, next) => {
  try {
    const { username, password, realName, studentId, college } = req.body;

    const existing = UserQueries.findByUsername(username);
    if (existing) {
      throw new AppError('USER_EXISTS', '该用户名已存在', 409);
    }

    const { hash, salt } = hashPassword(password);
    const result = UserQueries.create({ username, hash, salt, realName, studentId, college });

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

// GET /api/auth/me
router.get('/me', authenticate, (req, res, next) => {
  try {
    const user = UserQueries.findById(req.user.id);
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
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/verify
router.get('/verify', authenticate, (req, res, next) => {
  try {
    const user = UserQueries.getVerifyStatus(req.user.id);
    res.json({
      success: true,
      data: {
        verified: !!(user && user.verified),
        schoolName: user ? user.school_name || '' : '',
        verifyDate: user ? user.verify_date || '' : ''
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify
router.post('/verify', authenticate, validateVerify, (req, res, next) => {
  try {
    const { schoolName, studentId } = req.body;
    const dateStr = new Date().toISOString().slice(0, 10);
    UserQueries.setVerified(req.user.id, { verified: true, schoolName, studentId, dateStr });
    res.json({
      success: true,
      data: { verified: true, schoolName, verifyDate: dateStr }
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/auth/verify
router.delete('/verify', authenticate, (req, res, next) => {
  try {
    UserQueries.setVerified(req.user.id, { verified: false });
    res.json({ success: true, data: { verified: false } });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/password
router.put('/password', authenticate, validateChangePassword, (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = UserQueries.findByIdFull(req.user.id);
    if (!verifyPassword(oldPassword, user.password_hash, user.salt)) {
      throw new AuthError('旧密码错误');
    }

    const { hash, salt } = hashPassword(newPassword);
    UserQueries.updatePassword(req.user.id, hash, salt);

    res.json({ success: true, data: { message: '密码修改成功' } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
