const { all, get, run } = require('../db');

/**
 * 获取教师的作业列表
 * @param {number} teacherId
 * @param {number|null} courseId - 可选筛选
 */
async function getHomeworkList(teacherId, courseId) {
  let sql = `
    SELECT h.*, c.name as course_name,
      (SELECT COUNT(*) FROM submissions WHERE homework_id = h.id) as submitted_count,
      (SELECT COUNT(*) FROM enrollments WHERE course_id = h.course_id) as total_count
    FROM homework h
    JOIN courses c ON h.course_id = c.id
    WHERE c.teacher_id = ?
  `;
  const params = [teacherId];

  if (courseId) {
    sql += ' AND h.course_id = ?';
    params.push(courseId);
  }
  sql += ' ORDER BY h.created_at DESC';

  const homeworks = await all(sql, params);

  return homeworks.map(h => ({
    id: h.id, title: h.title, course: h.course_name, courseId: h.course_id,
    description: h.description, deadline: h.deadline,
    submitted: h.submitted_count, total: h.total_count, status: h.status
  }));
}

/**
 * 发布作业
 * @param {number} courseId
 * @param {string} title
 * @param {string} description
 * @param {string|null} deadline
 * @param {number} createdBy
 */
async function createHomework(courseId, title, description, deadline, createdBy) {
  const result = await run(
    'INSERT INTO homework (course_id, title, description, deadline, created_by) VALUES (?, ?, ?, ?, ?)',
    [courseId, title, description || '', deadline || null, createdBy]
  );
  return { id: result.lastInsertRowid, message: '作业已发布' };
}

/**
 * 获取作业的提交列表
 * @param {number} homeworkId
 * @param {number} teacherId - 用于权限校验
 */
async function getSubmissions(homeworkId, teacherId) {
  const homework = await get(`
    SELECT h.* FROM homework h
    JOIN courses c ON h.course_id = c.id
    WHERE h.id = ? AND c.teacher_id = ?
  `, [homeworkId, teacherId]);

  if (!homework) return null;

  const submissions = await all(`
    SELECT s.*, u.real_name, u.student_id
    FROM submissions s
    JOIN users u ON s.student_id = u.id
    WHERE s.homework_id = ?
    ORDER BY s.submitted_at DESC
  `, [homeworkId]);

  return submissions.map(s => ({
    id: s.id, studentName: s.real_name, studentId: s.student_id,
    content: s.content, fileUrl: s.file_url, score: s.score,
    feedback: s.feedback, submittedAt: s.submitted_at, gradedAt: s.graded_at
  }));
}

/**
 * 获取学生的作业列表（学生端）
 * @param {number} studentId
 * @param {number|null} courseId - 可选筛选
 * @param {string|null} status - pending / expired / null(全部)
 */
async function getStudentHomeworkList(studentId, courseId, status) {
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
  const params = [studentId, studentId, studentId];

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

  const homeworks = await all(sql, params);
  return homeworks.map(h => ({
    id: h.id,
    name: h.title,
    courseName: h.course_name,
    teacher: h.teacher_name,
    dueDate: h.deadline ? h.deadline.slice(0, 16) : '',
    description: h.description,
    submitted: h.has_submitted > 0,
    score: h.my_score
  }));
}

/**
 * 获取作业详情（学生端）
 * @param {number} homeworkId
 * @param {number} studentId
 * @returns {object|null}
 */
async function getStudentHomeworkDetail(homeworkId, studentId) {
  const hw = await get(`
    SELECT h.*, c.name as course_name, u.real_name as teacher_name
    FROM homework h
    JOIN courses c ON h.course_id = c.id
    JOIN users u ON c.teacher_id = u.id
    WHERE h.id = ?
  `, [homeworkId]);

  if (!hw) return null;

  const submission = await get(
    'SELECT * FROM submissions WHERE homework_id = ? AND student_id = ?',
    [homeworkId, studentId]
  );

  return {
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
  };
}

/**
 * 提交作业（学生端，支持新建和更新）
 * @param {number} homeworkId
 * @param {number} studentId
 * @param {string} content
 * @param {string|null} fileUrl
 * @returns {{ message: string }}
 */
async function submitHomework(homeworkId, studentId, content, fileUrl) {
  const hw = await get(
    'SELECT * FROM homework WHERE id = ? AND status = ?',
    [homeworkId, 'active']
  );
  if (!hw) return null;

  const existing = await get(
    'SELECT id FROM submissions WHERE homework_id = ? AND student_id = ?',
    [homeworkId, studentId]
  );

  if (existing) {
    await run(
      'UPDATE submissions SET content = ?, file_url = ?, submitted_at = CURRENT_TIMESTAMP WHERE homework_id = ? AND student_id = ?',
      [content || '', fileUrl || '', homeworkId, studentId]
    );
  } else {
    await run(
      'INSERT INTO submissions (homework_id, student_id, content, file_url) VALUES (?, ?, ?, ?)',
      [homeworkId, studentId, content || '', fileUrl || '']
    );
  }

  return { message: '作业提交成功' };
}

/**
 * 批改作业
 * @param {number} homeworkId
 * @param {number} studentId
 * @param {number} score
 * @param {string} feedback
 */
async function gradeHomework(homeworkId, studentId, score, feedback) {
  await run(
    'UPDATE submissions SET score = ?, feedback = ?, graded_at = CURRENT_TIMESTAMP WHERE homework_id = ? AND student_id = ?',
    [score, feedback || '', homeworkId, studentId]
  );
  return { message: '评分已保存' };
}

module.exports = {
  getHomeworkList, createHomework, getSubmissions, gradeHomework,
  getStudentHomeworkList, getStudentHomeworkDetail, submitHomework
};
