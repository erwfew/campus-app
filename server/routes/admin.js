const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const adminService = require('../services/adminService');
const { broadcast } = require('../app');

// 学校管理接口仅允许 admin 角色
router.use(authenticate);
router.use(requireRole('admin'));

/**
 * GET /api/admin/dashboard
 * 管理员工作台统计
 */
router.get('/dashboard', async (req, res) => {
  const data = await adminService.getDashboardStats();
  res.json({ success: true, data });
});

/**
 * GET /api/admin/users
 * 用户列表
 */
router.get('/users', async (req, res) => {
  const { role, keyword, page = 1, pageSize = 20 } = req.query;
  const data = await adminService.getUsers({ role, keyword, page, pageSize });
  res.json({ success: true, data });
});

/**
 * POST /api/admin/users
 * 创建用户（教师/管理员）
 */
router.post('/users', async (req, res) => {
  const { username, password, realName, role, college, phone, email, studentId } = req.body;
  if (!username || !password || !realName || !role) throw new AppError('INVALID_PARAMS', '请填写完整的用户信息', 400);
  if (!['admin', 'teacher', 'student'].includes(role)) throw new AppError('INVALID_PARAMS', '无效的角色类型', 400);

  const data = await adminService.createUser({ username, password, realName, role, college, phone, email, studentId });
  res.json({ success: true, data });
});

/**
 * PUT /api/admin/users/:id
 * 修改用户
 */
router.put('/users/:id', async (req, res) => {
  const { realName, role, college, phone, email, password } = req.body;
  const data = await adminService.updateUser(req.params.id, { realName, role, college, phone, email, password });
  res.json({ success: true, data });
});

/**
 * DELETE /api/admin/users/:id
 * 删除用户
 */
router.delete('/users/:id', async (req, res) => {
  const data = await adminService.deleteUser(req.params.id, req.user.id);
  res.json({ success: true, data });
});

/**
 * GET /api/admin/courses
 * 所有课程列表
 */
router.get('/courses', async (req, res) => {
  const { teacherId, keyword } = req.query;
  const list = await adminService.getCourses({ teacherId, keyword });
  res.json({ success: true, data: list });
});

/**
 * POST /api/admin/courses
 * 创建课程
 */
router.post('/courses', async (req, res) => {
  const { name, teacherId, location, weekDay, startSection, endSection, startTime, endTime, type, semester, college } = req.body;
  if (!name || !teacherId) throw new AppError('INVALID_PARAMS', '请填写课程名称和授课教师', 400);

  const data = await adminService.createCourse({ name, teacherId, location, weekDay, startSection, endSection, startTime, endTime, type, semester, college });
  res.json({ success: true, data });
});

/**
 * PUT /api/admin/courses/:id
 * 修改课程
 */
router.put('/courses/:id', async (req, res) => {
  const { name, teacherId, location, status } = req.body;
  const data = await adminService.updateCourse(req.params.id, { name, teacherId, location, status });
  res.json({ success: true, data });
});

/**
 * DELETE /api/admin/courses/:id
 * 删除课程（归档）
 */
router.delete('/courses/:id', async (req, res) => {
  const data = await adminService.archiveCourse(req.params.id);
  res.json({ success: true, data });
});

/**
 * POST /api/admin/enrollments
 * 批量选课
 */
router.post('/enrollments', async (req, res) => {
  const { courseId, studentIds } = req.body;
  if (!courseId || !studentIds || !Array.isArray(studentIds)) throw new AppError('INVALID_PARAMS', '参数不完整', 400);

  const data = await adminService.batchEnroll({ courseId, studentIds });
  res.json({ success: true, data });
});

/**
 * GET /api/admin/notices
 * 全校公告列表
 */
router.get('/notices', async (req, res) => {
  const list = await adminService.getSchoolNotices();
  res.json({ success: true, data: list });
});

/**
 * POST /api/admin/notices
 * 发布全校公告
 */
router.post('/notices', async (req, res) => {
  const { title, content, important } = req.body;
  if (!title) throw new AppError('INVALID_PARAMS', '请填写公告标题', 400);

  const data = await adminService.createNotice({ title, content, important }, req.user.id);
  broadcast('notices', { type: 'notice_created', notice: { id: data.id, title } });
  res.json({ success: true, data });
});

/**
 * DELETE /api/admin/notices/:id
 * 删除公告
 */
router.delete('/notices/:id', async (req, res) => {
  const data = await adminService.deleteNotice(req.params.id);
  res.json({ success: true, data });
});

module.exports = router;
