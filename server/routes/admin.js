const express = require('express');
const router = express.Router();
const { all, get, count, run, hashPassword } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

// 学校管理接口仅允许 admin 角色
router.use(authenticate);
router.use(requireRole('admin'));

/**
 * GET /api/admin/dashboard
 * 管理员工作台统计
 */
router.get('/dashboard', (req, res) => {
  const stats = {
    teachers: count("SELECT COUNT(*) as count FROM users WHERE role = 'teacher'"),
    students: count("SELECT COUNT(*) as count FROM users WHERE role = 'student'"),
    courses: count("SELECT COUNT(*) as count FROM courses WHERE status = 'active'"),
    activeNotices: count("SELECT COUNT(*) as count FROM notices WHERE scope = 'school'")
  };

  const attendanceStats = all(`
    SELECT date, 
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
      SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
      SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leave
    FROM attendance
    WHERE date >= date('now', '-7 days')
    GROUP BY date
    ORDER BY date
  `);

  const collegeStats = all(`
    SELECT college, COUNT(*) as count 
    FROM courses 
    WHERE status = 'active' AND college != ''
    GROUP BY college 
    ORDER BY count DESC 
    LIMIT 10
  `);

  res.json({ success: true, data: { stats, attendanceStats, collegeStats } });
});

/**
 * GET /api/admin/users
 * 用户列表
 */
router.get('/users', (req, res) => {
  const { role, keyword, page = 1, pageSize = 20 } = req.query;

  let where = '1=1';
  const params = [];

  if (role) { where += ' AND role = ?'; params.push(role); }
  if (keyword) {
    where += ' AND (real_name LIKE ? OR username LIKE ? OR student_id LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const total = count(`SELECT COUNT(*) as count FROM users WHERE ${where}`, params);
  const users = all(
    `SELECT * FROM users WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize)]
  );

  res.json({
    success: true,
    data: {
      list: users.map(u => ({
        id: u.id, username: u.username, realName: u.real_name, role: u.role,
        college: u.college, studentId: u.student_id, phone: u.phone, email: u.email,
        createdAt: u.created_at
      })),
      total, page: parseInt(page), pageSize: parseInt(pageSize)
    }
  });
});

/**
 * POST /api/admin/users
 * 创建用户（教师/管理员）
 */
router.post('/users', (req, res) => {
  const { username, password, realName, role, college, phone, email, studentId } = req.body;
  if (!username || !password || !realName || !role) throw new AppError('INVALID_PARAMS', '请填写完整的用户信息', 400);
  if (!['admin', 'teacher', 'student'].includes(role)) throw new AppError('INVALID_PARAMS', '无效的角色类型', 400);

  const existing = get('SELECT id FROM users WHERE username = ?', [username]);
  if (existing) throw new AppError('USER_EXISTS', '该用户名已存在', 409);

  const { hash, salt } = hashPassword(password);
  const result = run(
    'INSERT INTO users (username, password_hash, salt, real_name, role, college, phone, email, student_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [username, hash, salt, realName, role, college || '', phone || '', email || '', studentId || '']
  );

  res.json({ success: true, data: { id: result.lastInsertRowid, message: '用户创建成功' } });
});

/**
 * PUT /api/admin/users/:id
 * 修改用户
 */
router.put('/users/:id', (req, res) => {
  const { realName, role, college, phone, email, password } = req.body;
  const user = get('SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (!user) throw new AppError('NOT_FOUND', '用户不存在', 404);

  if (password) {
    const { hash, salt } = hashPassword(password);
    run('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?', [hash, salt, req.params.id]);
  }

  run(`UPDATE users SET 
    real_name = COALESCE(?, real_name), role = COALESCE(?, role),
    college = COALESCE(?, college), phone = COALESCE(?, phone),
    email = COALESCE(?, email), updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`, [realName, role, college, phone, email, req.params.id]);

  res.json({ success: true, data: { message: '用户信息已更新' } });
});

/**
 * DELETE /api/admin/users/:id
 * 删除用户
 */
router.delete('/users/:id', (req, res) => {
  if (parseInt(req.params.id) === req.user.id) throw new AppError('INVALID_OPERATION', '不能删除自己', 400);
  run('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ success: true, data: { message: '用户已删除' } });
});

/**
 * GET /api/admin/courses
 * 所有课程列表
 */
router.get('/courses', (req, res) => {
  const { teacherId, keyword } = req.query;
  let sql = `
    SELECT c.*, u.real_name as teacher_name,
      (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrolled_count
    FROM courses c JOIN users u ON c.teacher_id = u.id WHERE 1=1
  `;
  const params = [];
  if (teacherId) { sql += ' AND c.teacher_id = ?'; params.push(teacherId); }
  if (keyword) { sql += ' AND (c.name LIKE ? OR u.real_name LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
  sql += ' ORDER BY c.created_at DESC';

  res.json({
    success: true,
    data: all(sql, params).map(c => ({
      id: c.id, name: c.name, teacherName: c.teacher_name, teacherId: c.teacher_id,
      location: c.location, type: c.type, studentCount: c.enrolled_count,
      semester: c.semester, college: c.college, status: c.status
    }))
  });
});

/**
 * POST /api/admin/courses
 * 创建课程
 */
router.post('/courses', (req, res) => {
  const { name, teacherId, location, weekDay, startSection, endSection, startTime, endTime, type, semester, college } = req.body;
  if (!name || !teacherId) throw new AppError('INVALID_PARAMS', '请填写课程名称和授课教师', 400);

  const result = run(
    'INSERT INTO courses (name, teacher_id, location, week_day, start_section, end_section, start_time, end_time, type, semester, college) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, teacherId, location || '', weekDay || 0, startSection || 1, endSection || 2, startTime || '', endTime || '', type || '必修', semester || '', college || '']
  );

  res.json({ success: true, data: { id: result.lastInsertRowid, message: '课程创建成功' } });
});

/**
 * PUT /api/admin/courses/:id
 * 修改课程
 */
router.put('/courses/:id', (req, res) => {
  const { name, teacherId, location, status } = req.body;
  run(`UPDATE courses SET name = COALESCE(?, name), teacher_id = COALESCE(?, teacher_id),
    location = COALESCE(?, location), status = COALESCE(?, status), updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`, [name, teacherId, location, status, req.params.id]);
  res.json({ success: true, data: { message: '课程已更新' } });
});

/**
 * DELETE /api/admin/courses/:id
 * 删除课程（归档）
 */
router.delete('/courses/:id', (req, res) => {
  run("UPDATE courses SET status = 'archived' WHERE id = ?", [req.params.id]);
  res.json({ success: true, data: { message: '课程已归档' } });
});

/**
 * POST /api/admin/enrollments
 * 批量选课
 */
router.post('/enrollments', (req, res) => {
  const { courseId, studentIds } = req.body;
  if (!courseId || !studentIds || !Array.isArray(studentIds)) throw new AppError('INVALID_PARAMS', '参数不完整', 400);

  for (const sid of studentIds) {
    run('INSERT OR IGNORE INTO enrollments (course_id, student_id) VALUES (?, ?)', [courseId, sid]);
  }

  const cnt = count('SELECT COUNT(*) as count FROM enrollments WHERE course_id = ?', [courseId]);
  run('UPDATE courses SET student_count = ? WHERE id = ?', [cnt, courseId]);

  res.json({ success: true, data: { message: '选课成功', count: studentIds.length } });
});

/**
 * GET /api/admin/notices
 * 全校公告列表
 */
router.get('/notices', (req, res) => {
  const notices = all(`
    SELECT n.*, u.real_name as author_name
    FROM notices n JOIN users u ON n.author_id = u.id
    WHERE n.scope = ?
    ORDER BY n.created_at DESC LIMIT 50
  `, ['school']);

  res.json({
    success: true,
    data: notices.map(n => ({
      id: n.id, title: n.title, content: n.content, author: n.author_name,
      date: n.created_at ? n.created_at.slice(0, 10) : '', important: !!n.important
    }))
  });
});

/**
 * POST /api/admin/notices
 * 发布全校公告
 */
router.post('/notices', (req, res) => {
  const { title, content, important } = req.body;
  if (!title) throw new AppError('INVALID_PARAMS', '请填写公告标题', 400);

  const result = run('INSERT INTO notices (title, content, author_id, scope, important) VALUES (?, ?, ?, ?, ?)',
    [title, content || '', req.user.id, 'school', important ? 1 : 0]);

  res.json({ success: true, data: { id: result.lastInsertRowid, message: '公告已发布' } });
});

/**
 * DELETE /api/admin/notices/:id
 * 删除公告
 */
router.delete('/notices/:id', (req, res) => {
  run('DELETE FROM notices WHERE id = ?', [req.params.id]);
  res.json({ success: true, data: { message: '公告已删除' } });
});

module.exports = router;
