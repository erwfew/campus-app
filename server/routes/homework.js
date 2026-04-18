const express = require('express');
const router = express.Router();
const { all, get } = require('../db');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/homework
 * 获取当前学生的作业列表（需登录）
 */
router.get('/', authenticate, (req, res) => {
  const userId = req.user.id;
  const { courseId, status } = req.query;

  let sql = `
    SELECT h.*, c.name as course_name, u.real_name as teacher_name,
      (SELECT COUNT(*) FROM submissions WHERE homework_id = h.id AND student_id = ?) as has_submitted,
      (SELECT score FROM submissions WHERE homework_id = h.id AND student_id = ?) as my_score
    FROM homework h
    JOIN courses c ON h.course_id = c.id
    JOIN users u ON c.teacher_id = u.id
    JOIN enrollments e ON e.course_id = c.id AND e.student_id = ?
    WHERE h.status = 'active'
  `;
  const params = [userId, userId, userId];

  if (courseId) {
    sql += ' AND h.course_id = ?';
    params.push(courseId);
  }

  if (status === 'pending') {
    sql += ' AND h.deadline >= datetime("now")';
  } else if (status === 'expired') {
    sql += ' AND h.deadline < datetime("now")';
  }

  sql += ' ORDER BY h.deadline ASC';

  const homeworks = all(sql, params);

  res.json({
    success: true,
    data: {
      homeworks: homeworks.map(h => ({
        id: h.id,
        name: h.title,
        courseName: h.course_name,
        teacher: h.teacher_name,
        dueDate: h.deadline ? h.deadline.slice(0, 16) : '',
        description: h.description,
        submitted: h.has_submitted > 0,
        score: h.my_score
      }))
    }
  });
});

/**
 * GET /api/homework/:id
 * 作业详情
 */
router.get('/:id', authenticate, (req, res) => {
  const hw = get(`
    SELECT h.*, c.name as course_name, u.real_name as teacher_name
    FROM homework h
    JOIN courses c ON h.course_id = c.id
    JOIN users u ON c.teacher_id = u.id
    WHERE h.id = ?
  `, [req.params.id]);

  if (!hw) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '作业不存在' } });
  }

  const submission = get('SELECT * FROM submissions WHERE homework_id = ? AND student_id = ?',
    [req.params.id, req.user.id]);

  res.json({
    success: true,
    data: {
      id: hw.id,
      name: hw.title,
      courseName: hw.course_name,
      teacher: hw.teacher_name,
      dueDate: hw.deadline ? hw.deadline.slice(0, 16) : '',
      description: hw.description,
      submission: submission ? {
        content: submission.content,
        score: submission.score,
        feedback: submission.feedback,
        submittedAt: submission.submitted_at
      } : null
    }
  });
});

/**
 * POST /api/homework/:id/submit
 * 提交作业
 */
router.post('/:id/submit', authenticate, (req, res) => {
  const { content, fileUrl } = req.body;
  if (!content && !fileUrl) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_PARAMS', message: '请填写作业内容或上传文件' } });
  }

  const hw = get('SELECT * FROM homework WHERE id = ? AND status = ?', [req.params.id, 'active']);
  if (!hw) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '作业不存在' } });
  }

  // 检查是否已提交
  const existing = get('SELECT id FROM submissions WHERE homework_id = ? AND student_id = ?',
    [req.params.id, req.user.id]);

  if (existing) {
    // 更新提交
    const { run } = require('../db');
    run('UPDATE submissions SET content = ?, file_url = ?, submitted_at = CURRENT_TIMESTAMP WHERE homework_id = ? AND student_id = ?',
      [content || '', fileUrl || '', req.params.id, req.user.id]);
  } else {
    // 新提交
    const { run } = require('../db');
    run('INSERT INTO submissions (homework_id, student_id, content, file_url) VALUES (?, ?, ?, ?)',
      [req.params.id, req.user.id, content || '', fileUrl || '']);
  }

  res.json({ success: true, data: { message: '作业提交成功' } });
});

module.exports = router;
