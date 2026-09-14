const { all, get, run } = require('../db');

const VALID_STATUS = ['present', 'absent', 'late', 'leave'];

/**
 * 提交考勤记录
 * @param {number} courseId
 * @param {string} date
 * @param {Array} records - [{ studentId, status, remark }]
 */
async function submitAttendance(courseId, date, records) {
  let saved = 0;
  for (const record of records) {
    // 校验状态合法
    if (!VALID_STATUS.includes(record.status)) continue;
    // 校验学生已选该课
    const enrolled = get(
      'SELECT id FROM enrollments WHERE course_id = ? AND student_id = ?',
      [courseId, record.studentId]
    );
    if (!enrolled) continue;

    await run(
      'INSERT OR REPLACE INTO attendance (course_id, student_id, date, status, remark) VALUES (?, ?, ?, ?, ?)',
      [courseId, record.studentId, date, record.status, record.remark || '']
    );
    saved++;
  }
  return { message: '考勤已保存', count: saved };
}

module.exports = { submitAttendance };
