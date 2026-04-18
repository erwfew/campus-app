const express = require('express');
const router = express.Router();
const { all, get, run } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

// 所有教师接口都需要登录
router.use(authenticate);
router.use(requireRole('teacher', 'admin'));

/**
 * GET /api/teacher/dashboard
 * 工作台统计数据
 */
router.get('/dashboard', (req, res) => {
  const teacherId = req.user.id;

  const courses = get('SELECT COUNT(*) as count FROM courses WHERE teacher_id = ?', [teacherId]);
  const students = get('SELECT COUNT(DISTINCT e.student_id) as count FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE c.teacher_id = ?', [teacherId]);
  const pendingHomework = get('SELECT COUNT(*) as count FROM homework h JOIN courses c ON h.course_id = c.id WHERE c.teacher_id = ? AND h.status = ?', [teacherId, 'active']);

  const today = new Date().getDay();
  const weekDay = today === 0 ? 6 : today - 1;
  const todayCourses = get('SELECT COUNT(*) as count FROM courses WHERE teacher_id = ? AND week_day = ? AND status = ?', [teacherId, weekDay, 'active']);

  const pendingGrading = get('SELECT COUNT(*) as count FROM submissions s JOIN homework h ON s.homework_id = h.id JOIN courses c ON h.course_id = c.id WHERE c.teacher_id = ? AND s.score IS NULL', [teacherId]);

  res.json({
    success: true,
    data: {
      courseCount: courses?.count || 0,
      studentCount: students?.count || 0,
      todayClasses: todayCourses?.count || 0,
      pendingHomework: pendingHomework?.count || 0,
      pendingGrading: pendingGrading?.count || 0
    }
  });
});

/**
 * GET /api/teacher/courses
 * 我的课程列表
 */
router.get('/courses', (req, res) => {
  const courses = all(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrolled_count
    FROM courses c 
    WHERE c.teacher_id = ? AND c.status = ?
    ORDER BY c.week_day, c.start_section
  `, [req.user.id, 'active']);

  res.json({
    success: true,
    data: courses.map(c => ({
      id: c.id, name: c.name, location: c.location,
      weekDay: c.week_day, startSection: c.start_section, endSection: c.end_section,
      startTime: c.start_time, endTime: c.end_time,
      startWeek: c.start_week, endWeek: c.end_week,
      type: c.type, studentCount: c.enrolled_count,
      college: c.college, semester: c.semester, color: c.color
    }))
  });
});

/**
 * GET /api/teacher/courses/:id/students
 * 课程学生名单
 */
router.get('/courses/:id/students', (req, res) => {
  const course = get('SELECT * FROM courses WHERE id = ? AND teacher_id = ?', [req.params.id, req.user.id]);
  if (!course) throw new AppError('NOT_FOUND', '课程不存在', 404);

  const students = all(`
    SELECT u.id, u.username, u.real_name, u.student_id, u.college,
      (SELECT COUNT(*) FROM attendance WHERE course_id = ? AND student_id = u.id AND status = 'present') as attend_count,
      (SELECT COUNT(*) FROM attendance WHERE course_id = ? AND student_id = u.id) as total_attend
    FROM users u
    JOIN enrollments e ON u.id = e.student_id
    WHERE e.course_id = ?
    ORDER BY u.student_id
  `, [req.params.id, req.params.id, req.params.id]);

  res.json({
    success: true,
    data: students.map(s => ({
      id: s.id, name: s.real_name, studentId: s.student_id, college: s.college,
      attendance: s.total_attend > 0 ? Math.round(s.attend_count / s.total_attend * 100) : 100
    }))
  });
});

/**
 * GET /api/teacher/today-courses
 * 今日课程
 */
router.get('/today-courses', (req, res) => {
  const today = new Date().getDay();
  const weekDay = today === 0 ? 6 : today - 1;

  const courses = all(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrolled_count
    FROM courses c 
    WHERE c.teacher_id = ? AND c.week_day = ? AND c.status = ?
    ORDER BY c.start_section
  `, [req.user.id, weekDay, 'active']);

  res.json({
    success: true,
    data: courses.map(c => ({
      id: c.id, name: c.name, location: c.location,
      time: c.start_time + '-' + c.end_time, studentCount: c.enrolled_count
    }))
  });
});

/**
 * POST /api/teacher/attendance
 * 提交考勤
 */
router.post('/attendance', (req, res) => {
  const { courseId, date, records } = req.body;
  if (!courseId || !date || !records || !Array.isArray(records)) {
    throw new AppError('INVALID_PARAMS', '参数不完整', 400);
  }

  const course = get('SELECT * FROM courses WHERE id = ? AND teacher_id = ?', [courseId, req.user.id]);
  if (!course) throw new AppError('NOT_FOUND', '课程不存在', 404);

  for (const record of records) {
    run('INSERT OR REPLACE INTO attendance (course_id, student_id, date, status, remark) VALUES (?, ?, ?, ?, ?)',
      [courseId, record.studentId, date, record.status, record.remark || '']);
  }

  res.json({
    success: true,
    data: { message: '考勤已保存', count: records.length }
  });
});

/**
 * GET /api/teacher/homework
 * 作业列表
 */
router.get('/homework', (req, res) => {
  const { courseId } = req.query;

  let sql = `
    SELECT h.*, c.name as course_name,
      (SELECT COUNT(*) FROM submissions WHERE homework_id = h.id) as submitted_count,
      (SELECT COUNT(*) FROM enrollments WHERE course_id = h.course_id) as total_count
    FROM homework h
    JOIN courses c ON h.course_id = c.id
    WHERE c.teacher_id = ?
  `;
  const params = [req.user.id];

  if (courseId) {
    sql += ' AND h.course_id = ?';
    params.push(courseId);
  }
  sql += ' ORDER BY h.created_at DESC';

  const homeworks = all(sql, params);

  res.json({
    success: true,
    data: homeworks.map(h => ({
      id: h.id, title: h.title, course: h.course_name, courseId: h.course_id,
      description: h.description, deadline: h.deadline,
      submitted: h.submitted_count, total: h.total_count, status: h.status
    }))
  });
});

/**
 * POST /api/teacher/homework
 * 发布作业
 */
router.post('/homework', (req, res) => {
  const { courseId, title, description, deadline } = req.body;
  if (!courseId || !title) throw new AppError('INVALID_PARAMS', '请填写作业标题', 400);

  const course = get('SELECT * FROM courses WHERE id = ? AND teacher_id = ?', [courseId, req.user.id]);
  if (!course) throw new AppError('NOT_FOUND', '课程不存在', 404);

  const result = run('INSERT INTO homework (course_id, title, description, deadline, created_by) VALUES (?, ?, ?, ?, ?)',
    [courseId, title, description || '', deadline || null, req.user.id]);

  res.json({ success: true, data: { id: result.lastInsertRowid, message: '作业已发布' } });
});

/**
 * GET /api/teacher/homework/:id/submissions
 * 作业提交列表
 */
router.get('/homework/:id/submissions', (req, res) => {
  const homework = get(`
    SELECT h.* FROM homework h
    JOIN courses c ON h.course_id = c.id
    WHERE h.id = ? AND c.teacher_id = ?
  `, [req.params.id, req.user.id]);

  if (!homework) throw new AppError('NOT_FOUND', '作业不存在', 404);

  const submissions = all(`
    SELECT s.*, u.real_name, u.student_id
    FROM submissions s
    JOIN users u ON s.student_id = u.id
    WHERE s.homework_id = ?
    ORDER BY s.submitted_at DESC
  `, [req.params.id]);

  res.json({
    success: true,
    data: submissions.map(s => ({
      id: s.id, studentName: s.real_name, studentId: s.student_id,
      content: s.content, fileUrl: s.file_url, score: s.score,
      feedback: s.feedback, submittedAt: s.submitted_at, gradedAt: s.graded_at
    }))
  });
});

/**
 * PUT /api/teacher/homework/:id/grade
 * 批改作业
 */
router.put('/homework/:id/grade', (req, res) => {
  const { studentId, score, feedback } = req.body;
  if (!studentId || score === undefined) throw new AppError('INVALID_PARAMS', '请填写评分', 400);

  run('UPDATE submissions SET score = ?, feedback = ?, graded_at = CURRENT_TIMESTAMP WHERE homework_id = ? AND student_id = ?',
    [score, feedback || '', req.params.id, studentId]);

  res.json({ success: true, data: { message: '评分已保存' } });
});

/**
 * GET /api/teacher/grades
 * 成绩列表
 */
router.get('/grades', (req, res) => {
  const { courseId } = req.query;
  if (!courseId) throw new AppError('INVALID_PARAMS', '请选择课程', 400);

  const course = get('SELECT * FROM courses WHERE id = ? AND teacher_id = ?', [courseId, req.user.id]);
  if (!course) throw new AppError('NOT_FOUND', '课程不存在', 404);

  const grades = all(`
    SELECT g.*, u.real_name, u.student_id, u.college
    FROM grades g
    JOIN users u ON g.student_id = u.id
    WHERE g.course_id = ?
    ORDER BY u.student_id
  `, [courseId]);

  if (grades.length === 0) {
    const students = all(`
      SELECT u.id, u.real_name, u.student_id, u.college
      FROM users u
      JOIN enrollments e ON u.id = e.student_id
      WHERE e.course_id = ?
      ORDER BY u.student_id
    `, [courseId]);

    return res.json({
      success: true,
      data: students.map(s => ({
        id: s.id, name: s.real_name, studentId: s.student_id, college: s.college,
        usual: 0, midterm: 0, final: 0, total: 0
      }))
    });
  }

  res.json({
    success: true,
    data: grades.map(g => ({
      id: g.id, name: g.real_name, studentId: g.student_id, college: g.college,
      usual: g.usual_score, midterm: g.midterm_score, final: g.final_score, total: g.total_score
    }))
  });
});

/**
 * POST /api/teacher/grades
 * 提交成绩
 */
router.post('/grades', (req, res) => {
  const { courseId, grades } = req.body;
  if (!courseId || !grades || !Array.isArray(grades)) throw new AppError('INVALID_PARAMS', '参数不完整', 400);

  const course = get('SELECT * FROM courses WHERE id = ? AND teacher_id = ?', [courseId, req.user.id]);
  if (!course) throw new AppError('NOT_FOUND', '课程不存在', 404);

  for (const g of grades) {
    const total = Math.round((g.usual || 0) * 0.3 + (g.midterm || 0) * 0.3 + (g.final || 0) * 0.4);
    run('INSERT OR REPLACE INTO grades (course_id, student_id, usual_score, midterm_score, final_score, total_score, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [courseId, g.studentId, g.usual || 0, g.midterm || 0, g.final || 0, total]);
  }

  res.json({ success: true, data: { message: '成绩已提交', count: grades.length } });
});

/**
 * GET /api/teacher/notices
 * 课程公告列表
 */
router.get('/notices', (req, res) => {
  const notices = all(`
    SELECT n.*, c.name as course_name
    FROM notices n
    LEFT JOIN courses c ON n.course_id = c.id
    WHERE n.author_id = ? AND n.scope = ?
    ORDER BY n.created_at DESC
    LIMIT 50
  `, [req.user.id, 'course']);

  res.json({
    success: true,
    data: notices.map(n => ({
      id: n.id, title: n.title, content: n.content,
      course: n.course_name || '全部课程',
      date: n.created_at ? n.created_at.slice(0, 10) : '',
      important: !!n.important
    }))
  });
});

/**
 * POST /api/teacher/notices
 * 发布课程公告
 */
router.post('/notices', (req, res) => {
  const { courseId, title, content, important } = req.body;
  if (!title) throw new AppError('INVALID_PARAMS', '请填写公告标题', 400);

  const result = run('INSERT INTO notices (title, content, course_id, author_id, scope, important) VALUES (?, ?, ?, ?, ?, ?)',
    [title, content || '', courseId || null, req.user.id, 'course', important ? 1 : 0]);

  res.json({ success: true, data: { id: result.lastInsertRowid, message: '公告已发布' } });
});

module.exports = router;
