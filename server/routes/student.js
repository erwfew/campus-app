const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getStudentCourses,
  getStudentTodayCourses,
  getAttendanceStats,
  getStudentProfile,
  getStudentGrades
} = require('../services/studentService');

// 所有学生接口需登录
router.use(authenticate);

// GET /api/student/courses — 学生课程表
router.get('/courses', (req, res) => {
  const data = getStudentCourses(req.user.id);
  res.json({ success: true, data });
});

// GET /api/student/today-courses — 今日课程
router.get('/today-courses', (req, res) => {
  const data = getStudentTodayCourses(req.user.id);
  res.json({ success: true, data });
});

// GET /api/student/attendance — 考勤统计
router.get('/attendance', (req, res) => {
  const data = getAttendanceStats(req.user.id);
  res.json({ success: true, data });
});

// GET /api/student/profile — 个人资料
router.get('/profile', (req, res) => {
  const data = getStudentProfile(req.user.id);
  if (!data) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '用户不存在' } });
  res.json({ success: true, data });
});

// GET /api/student/grades — 成绩
router.get('/grades', (req, res) => {
  const data = getStudentGrades(req.user.id);
  res.json({ success: true, data });
});

module.exports = router;
