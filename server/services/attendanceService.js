const { all, get, run } = require('../db');

/**
 * 提交考勤记录
 * @param {number} courseId
 * @param {string} date
 * @param {Array} records - [{ studentId, status, remark }]
 */
async function submitAttendance(courseId, date, records) {
  for (const record of records) {
    await run(
      'INSERT OR REPLACE INTO attendance (course_id, student_id, date, status, remark) VALUES (?, ?, ?, ?, ?)',
      [courseId, record.studentId, date, record.status, record.remark || '']
    );
  }
  return { message: '考勤已保存', count: records.length };
}

module.exports = { submitAttendance };
