const { all, get } = require('../db');
const { UserQueries, CourseQueries } = require('../db/queries');

/**
 * 获取学生课程表
 * @param {number} studentId
 * @returns {Array} 课程列表
 */
function getStudentCourses(studentId) {
  const courses = CourseQueries.findByStudent(studentId);
  return courses.map(c => ({
    id: c.id, name: c.name, teacher: c.teacher_name, location: c.location,
    weekDay: c.week_day, startSection: c.start_section, endSection: c.end_section,
    startTime: c.start_time, endTime: c.end_time,
    startWeek: c.start_week, endWeek: c.end_week,
    type: c.type, color: c.color, semester: c.semester
  }));
}

/**
 * 获取学生今日课程
 * @param {number} studentId
 * @returns {Array} 今日课程列表
 */
function getStudentTodayCourses(studentId) {
  const today = new Date().getDay();
  const weekDay = today === 0 ? 6 : today - 1;

  const courses = CourseQueries.findTodayByStudent(studentId, weekDay);
  return courses.map(c => ({
    id: c.id, name: c.name, teacher: c.teacher_name, location: c.location,
    time: c.start_time + ' - ' + c.end_time,
    status: CourseQueries.getCourseStatus(c.start_section, c.end_section)
  }));
}

/**
 * 获取学生考勤统计
 * @param {number} studentId
 * @returns {object} 考勤统计数据
 */
function getAttendanceStats(studentId) {
  const total = get('SELECT COUNT(*) as count FROM attendance WHERE student_id = ?', [studentId]);
  const present = get("SELECT COUNT(*) as count FROM attendance WHERE student_id = ? AND status = 'present'", [studentId]);
  const absent = get("SELECT COUNT(*) as count FROM attendance WHERE student_id = ? AND status = 'absent'", [studentId]);
  const late = get("SELECT COUNT(*) as count FROM attendance WHERE student_id = ? AND status = 'late'", [studentId]);
  const leave = get("SELECT COUNT(*) as count FROM attendance WHERE student_id = ? AND status = 'leave'", [studentId]);

  const totalCount = total?.count || 0;
  const presentCount = present?.count || 0;
  const rate = totalCount > 0 ? Math.round(presentCount / totalCount * 100) : 100;

  return {
    total: totalCount,
    present: presentCount,
    absent: absent?.count || 0,
    late: late?.count || 0,
    leave: leave?.count || 0,
    rate
  };
}

/**
 * 获取学生个人资料
 * @param {number} studentId
 * @returns {object|null} 用户资料，不存在返回 null
 */
function getStudentProfile(studentId) {
  const user = UserQueries.findById(studentId);
  if (!user) return null;
  return {
    id: user.id, username: user.username, realName: user.real_name,
    role: user.role, avatar: user.avatar, college: user.college,
    phone: user.phone, email: user.email, studentId: user.student_id
  };
}

/**
 * 获取学生成绩
 * @param {number} studentId
 * @returns {Array} 成绩列表
 */
function getStudentGrades(studentId) {
  const grades = all(`
    SELECT g.*, c.name as course_name, c.type as course_type, u.real_name as teacher_name
    FROM grades g
    JOIN courses c ON g.course_id = c.id
    JOIN users u ON c.teacher_id = u.id
    JOIN enrollments e ON e.course_id = c.id AND e.student_id = g.student_id
    WHERE g.student_id = ?
    ORDER BY c.name
  `, [studentId]);

  return grades.map(g => ({
    id: g.id, course: g.course_name, type: g.course_type, teacher: g.teacher_name,
    usual: g.usual_score, midterm: g.midterm_score, final: g.final_score, total: g.total_score
  }));
}

module.exports = {
  getStudentCourses,
  getStudentTodayCourses,
  getAttendanceStats,
  getStudentProfile,
  getStudentGrades
};
