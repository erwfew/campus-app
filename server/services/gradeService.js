const { all, get, run } = require('../db');

/**
 * 获取课程成绩列表（若无成绩记录则返回学生默认成绩）
 * @param {number} courseId
 * @param {number} teacherId
 */
async function getGrades(courseId, teacherId) {
  const grades = await all(`
    SELECT g.*, u.real_name, u.student_id, u.college
    FROM grades g
    JOIN users u ON g.student_id = u.id
    WHERE g.course_id = ?
    ORDER BY u.student_id
  `, [courseId]);

  if (grades.length === 0) {
    const students = await all(`
      SELECT u.id, u.real_name, u.student_id, u.college
      FROM users u
      JOIN enrollments e ON u.id = e.student_id
      WHERE e.course_id = ?
      ORDER BY u.student_id
    `, [courseId]);

    return students.map(s => ({
      id: s.id, name: s.real_name, studentId: s.student_id, college: s.college,
      usual: 0, midterm: 0, final: 0, total: 0
    }));
  }

  return grades.map(g => ({
    id: g.id, name: g.real_name, studentId: g.student_id, college: g.college,
    usual: g.usual_score, midterm: g.midterm_score, final: g.final_score, total: g.total_score
  }));
}

/**
 * 提交成绩（自动计算总评 = 平时30% + 期中30% + 期末40%）
 * @param {number} courseId
 * @param {Array} grades - [{ studentId, usual, midterm, final }]
 */
async function submitGrades(courseId, grades) {
  for (const g of grades) {
    const total = Math.round((g.usual || 0) * 0.3 + (g.midterm || 0) * 0.3 + (g.final || 0) * 0.4);
    await run(
      'INSERT OR REPLACE INTO grades (course_id, student_id, usual_score, midterm_score, final_score, total_score, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [courseId, g.studentId, g.usual || 0, g.midterm || 0, g.final || 0, total]
    );
  }
  return { message: '成绩已提交', count: grades.length };
}

module.exports = { getGrades, submitGrades };
