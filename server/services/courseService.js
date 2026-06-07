const { all, get } = require('../db');

/**
 * 获取教师的工作台统计数据
 * @param {number} teacherId
 */
async function getDashboardStats(teacherId) {
  const courses = await get('SELECT COUNT(*) as count FROM courses WHERE teacher_id = ?', [teacherId]);
  const students = await get('SELECT COUNT(DISTINCT e.student_id) as count FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE c.teacher_id = ?', [teacherId]);
  const pendingHomework = await get('SELECT COUNT(*) as count FROM homework h JOIN courses c ON h.course_id = c.id WHERE c.teacher_id = ? AND h.status = ?', [teacherId, 'active']);

  const today = new Date().getDay();
  const weekDay = today === 0 ? 6 : today - 1;
  const todayCourses = await get('SELECT COUNT(*) as count FROM courses WHERE teacher_id = ? AND week_day = ? AND status = ?', [teacherId, weekDay, 'active']);

  const pendingGrading = await get('SELECT COUNT(*) as count FROM submissions s JOIN homework h ON s.homework_id = h.id JOIN courses c ON h.course_id = c.id WHERE c.teacher_id = ? AND s.score IS NULL', [teacherId]);

  return {
    courseCount: courses?.count || 0,
    studentCount: students?.count || 0,
    todayClasses: todayCourses?.count || 0,
    pendingHomework: pendingHomework?.count || 0,
    pendingGrading: pendingGrading?.count || 0
  };
}

/**
 * 获取教师的课程列表
 * @param {number} teacherId
 */
async function getCourses(teacherId) {
  const courses = await all(`
    SELECT c.*,
      (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrolled_count
    FROM courses c
    WHERE c.teacher_id = ? AND c.status = ?
    ORDER BY c.week_day, c.start_section
  `, [teacherId, 'active']);

  return courses.map(c => ({
    id: c.id, name: c.name, location: c.location,
    weekDay: c.week_day, startSection: c.start_section, endSection: c.end_section,
    startTime: c.start_time, endTime: c.end_time,
    startWeek: c.start_week, endWeek: c.end_week,
    type: c.type, studentCount: c.enrolled_count,
    college: c.college, semester: c.semester, color: c.color
  }));
}

/**
 * 获取课程的学生名单（含考勤率）
 * @param {number} courseId
 * @param {number} teacherId
 */
async function getCourseStudents(courseId, teacherId) {
  const course = await get('SELECT * FROM courses WHERE id = ? AND teacher_id = ?', [courseId, teacherId]);
  if (!course) return null;

  const students = await all(`
    SELECT u.id, u.username, u.real_name, u.student_id, u.college,
      (SELECT COUNT(*) FROM attendance WHERE course_id = ? AND student_id = u.id AND status = 'present') as attend_count,
      (SELECT COUNT(*) FROM attendance WHERE course_id = ? AND student_id = u.id) as total_attend
    FROM users u
    JOIN enrollments e ON u.id = e.student_id
    WHERE e.course_id = ?
    ORDER BY u.student_id
  `, [courseId, courseId, courseId]);

  return students.map(s => ({
    id: s.id, name: s.real_name, studentId: s.student_id, college: s.college,
    attendance: s.total_attend > 0 ? Math.round(s.attend_count / s.total_attend * 100) : 100
  }));
}

/**
 * 获取教师今日课程
 * @param {number} teacherId
 */
async function getTodayCourses(teacherId) {
  const today = new Date().getDay();
  const weekDay = today === 0 ? 6 : today - 1;

  const courses = await all(`
    SELECT c.*,
      (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrolled_count
    FROM courses c
    WHERE c.teacher_id = ? AND c.week_day = ? AND c.status = ?
    ORDER BY c.start_section
  `, [teacherId, weekDay, 'active']);

  return courses.map(c => ({
    id: c.id, name: c.name, location: c.location,
    time: c.start_time + '-' + c.end_time, studentCount: c.enrolled_count
  }));
}

/**
 * 验证课程归属
 * @param {number} courseId
 * @param {number} teacherId
 * @returns {object|null} 课程对象，不存在则返回 null
 */
async function verifyCourseOwnership(courseId, teacherId) {
  return await get('SELECT * FROM courses WHERE id = ? AND teacher_id = ?', [courseId, teacherId]);
}

module.exports = {
  getDashboardStats,
  getCourses,
  getCourseStudents,
  getTodayCourses,
  verifyCourseOwnership
};
