const express = require('express');
const router = express.Router();
const { all, get } = require('../db');
const { authenticate } = require('../middleware/auth');

/**
 * 判断课程当前状态
 */
function getCourseStatus(startSection, endSection) {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const sectionTimes = {
    1: 480, 2: 530, 3: 590, 4: 640,
    5: 840, 6: 890, 7: 950, 8: 1000,
    9: 1140, 10: 1190, 11: 1240, 12: 1290
  };
  const start = sectionTimes[startSection] || 480;
  const end = (sectionTimes[endSection] || 640) + 45;
  if (currentTime < start) return 'upcoming';
  if (currentTime >= start && currentTime <= end) return 'ongoing';
  return 'finished';
}

// 所有学生接口需登录
router.use(authenticate);

/**
 * GET /api/student/courses — 学生课程表
 */
router.get('/courses', (req, res) => {
  const courses = all(`
    SELECT c.*, u.real_name as teacher_name
    FROM courses c
    JOIN users u ON c.teacher_id = u.id
    JOIN enrollments e ON e.course_id = c.id
    WHERE e.student_id = ? AND c.status = 'active'
    ORDER BY c.week_day, c.start_section
  `, [req.user.id]);

  res.json({
    success: true,
    data: courses.map(c => ({
      id: c.id, name: c.name, teacher: c.teacher_name, location: c.location,
      weekDay: c.week_day, startSection: c.start_section, endSection: c.end_section,
      startTime: c.start_time, endTime: c.end_time,
      startWeek: c.start_week, endWeek: c.end_week,
      type: c.type, color: c.color, semester: c.semester
    }))
  });
});

/**
 * GET /api/student/today-courses — 今日课程
 */
router.get('/today-courses', (req, res) => {
  const today = new Date().getDay();
  const weekDay = today === 0 ? 6 : today - 1;

  const courses = all(`
    SELECT c.*, u.real_name as teacher_name
    FROM courses c
    JOIN users u ON c.teacher_id = u.id
    JOIN enrollments e ON e.course_id = c.id
    WHERE e.student_id = ? AND c.week_day = ? AND c.status = 'active'
    ORDER BY c.start_section
  `, [req.user.id, weekDay]);

  res.json({
    success: true,
    data: courses.map(c => ({
      id: c.id, name: c.name, teacher: c.teacher_name, location: c.location,
      time: c.start_time + ' - ' + c.end_time,
      status: getCourseStatus(c.start_section, c.end_section)
    }))
  });
});

/**
 * GET /api/student/attendance — 考勤统计
 */
router.get('/attendance', (req, res) => {
  const userId = req.user.id;
  const total = get('SELECT COUNT(*) as count FROM attendance WHERE student_id = ?', [userId]);
  const present = get("SELECT COUNT(*) as count FROM attendance WHERE student_id = ? AND status = 'present'", [userId]);
  const absent = get("SELECT COUNT(*) as count FROM attendance WHERE student_id = ? AND status = 'absent'", [userId]);
  const late = get("SELECT COUNT(*) as count FROM attendance WHERE student_id = ? AND status = 'late'", [userId]);
  const leave = get("SELECT COUNT(*) as count FROM attendance WHERE student_id = ? AND status = 'leave'", [userId]);

  const totalCount = total?.count || 0;
  const presentCount = present?.count || 0;
  const rate = totalCount > 0 ? Math.round(presentCount / totalCount * 100) : 100;

  res.json({
    success: true,
    data: { total: totalCount, present: presentCount, absent: absent?.count || 0, late: late?.count || 0, leave: leave?.count || 0, rate }
  });
});

/**
 * GET /api/student/profile — 个人资料
 */
router.get('/profile', (req, res) => {
  const user = get('SELECT id, username, real_name, role, avatar, college, phone, email, student_id FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '用户不存在' } });
  res.json({
    success: true,
    data: { id: user.id, username: user.username, realName: user.real_name, role: user.role, avatar: user.avatar, college: user.college, phone: user.phone, email: user.email, studentId: user.student_id }
  });
});

/**
 * GET /api/student/grades — 成绩
 */
router.get('/grades', (req, res) => {
  const grades = all(`
    SELECT g.*, c.name as course_name, c.type as course_type, u.real_name as teacher_name
    FROM grades g
    JOIN courses c ON g.course_id = c.id
    JOIN users u ON c.teacher_id = u.id
    JOIN enrollments e ON e.course_id = c.id AND e.student_id = g.student_id
    WHERE g.student_id = ?
    ORDER BY c.name
  `, [req.user.id]);

  res.json({
    success: true,
    data: grades.map(g => ({
      id: g.id, course: g.course_name, type: g.course_type, teacher: g.teacher_name,
      usual: g.usual_score, midterm: g.midterm_score, final: g.final_score, total: g.total_score
    }))
  });
});

module.exports = router;
