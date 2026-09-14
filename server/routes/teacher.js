const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const { validateCourse, validateNotice } = require('../middleware/validate');

const courseService = require('../services/courseService');
const attendanceService = require('../services/attendanceService');
const homeworkService = require('../services/homeworkService');
const gradeService = require('../services/gradeService');
const noticeService = require('../services/noticeService');
const { broadcast } = require('../utils/broadcast');

// Express 4.x 不自动捕获 async 路由的 rejected promise，需要包装转发到 error handler
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// 所有教师接口都需要登录
router.use(authenticate);
router.use(requireRole('teacher', 'admin'));

/**
 * GET /api/teacher/dashboard
 * 工作台统计数据
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const data = await courseService.getDashboardStats(req.user.id);
  res.json({ success: true, data });
}));

/**
 * GET /api/teacher/courses
 * 我的课程列表
 */
router.get('/courses', asyncHandler(async (req, res) => {
  const data = await courseService.getCourses(req.user.id);
  res.json({ success: true, data });
}));

/**
 * GET /api/teacher/courses/:id/students
 * 课程学生名单
 */
router.get('/courses/:id/students', asyncHandler(async (req, res) => {
  const data = await courseService.getCourseStudents(req.params.id, req.user.id);
  if (!data) throw new AppError('NOT_FOUND', '课程不存在', 404);
  res.json({ success: true, data });
}));

/**
 * GET /api/teacher/today-courses
 * 今日课程
 */
router.get('/today-courses', asyncHandler(async (req, res) => {
  const data = await courseService.getTodayCourses(req.user.id);
  res.json({ success: true, data });
}));

/**
 * POST /api/teacher/attendance
 * 提交考勤
 */
router.post('/attendance', asyncHandler(async (req, res) => {
  const { courseId, date, records } = req.body;
  if (!courseId || !date || !records || !Array.isArray(records)) {
    throw new AppError('INVALID_PARAMS', '参数不完整', 400);
  }

  const course = await courseService.verifyCourseOwnership(courseId, req.user.id);
  if (!course) throw new AppError('NOT_FOUND', '课程不存在', 404);

  const data = await attendanceService.submitAttendance(courseId, date, records);
  res.json({ success: true, data });
}));

/**
 * GET /api/teacher/homework
 * 作业列表
 */
router.get('/homework', asyncHandler(async (req, res) => {
  const { courseId } = req.query;
  const data = await homeworkService.getHomeworkList(req.user.id, courseId);
  res.json({ success: true, data });
}));

/**
 * POST /api/teacher/homework
 * 发布作业
 */
router.post('/homework', asyncHandler(async (req, res) => {
  const { courseId, title, description, deadline } = req.body;
  if (!courseId || !title) throw new AppError('INVALID_PARAMS', '请填写作业标题', 400);

  const course = await courseService.verifyCourseOwnership(courseId, req.user.id);
  if (!course) throw new AppError('NOT_FOUND', '课程不存在', 404);

  const data = await homeworkService.createHomework(courseId, title, description, deadline, req.user.id);
  res.json({ success: true, data });
}));

/**
 * GET /api/teacher/homework/:id/submissions
 * 作业提交列表
 */
router.get('/homework/:id/submissions', asyncHandler(async (req, res) => {
  const data = await homeworkService.getSubmissions(req.params.id, req.user.id);
  if (!data) throw new AppError('NOT_FOUND', '作业不存在', 404);
  res.json({ success: true, data });
}));

/**
 * PUT /api/teacher/homework/:id/grade
 * 批改作业
 */
router.put('/homework/:id/grade', asyncHandler(async (req, res) => {
  const { studentId, score, feedback } = req.body;
  if (!studentId || score === undefined) throw new AppError('INVALID_PARAMS', '请填写评分', 400);

  // 校验作业归属当前教师
  const homework = await homeworkService.getSubmissions(req.params.id, req.user.id);
  if (!homework) throw new AppError('NOT_FOUND', '作业不存在', 404);

  const data = await homeworkService.gradeHomework(req.params.id, studentId, score, feedback);
  res.json({ success: true, data });
}));

/**
 * GET /api/teacher/grades
 * 成绩列表
 */
router.get('/grades', asyncHandler(async (req, res) => {
  const { courseId } = req.query;
  if (!courseId) throw new AppError('INVALID_PARAMS', '请选择课程', 400);

  const course = await courseService.verifyCourseOwnership(courseId, req.user.id);
  if (!course) throw new AppError('NOT_FOUND', '课程不存在', 404);

  const data = await gradeService.getGrades(courseId, req.user.id);
  res.json({ success: true, data });
}));

/**
 * POST /api/teacher/grades
 * 提交成绩
 */
router.post('/grades', asyncHandler(async (req, res) => {
  const { courseId, grades } = req.body;
  if (!courseId || !grades || !Array.isArray(grades)) throw new AppError('INVALID_PARAMS', '参数不完整', 400);

  const course = await courseService.verifyCourseOwnership(courseId, req.user.id);
  if (!course) throw new AppError('NOT_FOUND', '课程不存在', 404);

  const data = await gradeService.submitGrades(courseId, grades);
  res.json({ success: true, data });
}));

/**
 * GET /api/teacher/notices
 * 课程公告列表
 */
router.get('/notices', asyncHandler(async (req, res) => {
  const data = await noticeService.getNotices(req.user.id);
  res.json({ success: true, data });
}));

/**
 * POST /api/teacher/notices
 * 发布课程公告
 */
router.post('/notices', asyncHandler(async (req, res) => {
  const { courseId, title, content, important } = req.body;
  if (!title) throw new AppError('INVALID_PARAMS', '请填写公告标题', 400);

  const data = await noticeService.createNotice(title, content, courseId, req.user.id, important);
  broadcast('notices', { type: 'course_notice', notice: { id: data.id, title, courseId } });
  res.json({ success: true, data });
}));

module.exports = router;
