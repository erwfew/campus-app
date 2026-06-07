const { all, get } = require('../index');

const CourseQueries = {
  findByStudent(studentId, status = 'active') {
    return all(`
      SELECT c.*, u.real_name as teacher_name
      FROM courses c
      JOIN users u ON c.teacher_id = u.id
      JOIN enrollments e ON e.course_id = c.id
      WHERE e.student_id = ? AND c.status = ?
      ORDER BY c.week_day, c.start_section
    `, [studentId, status]);
  },

  findTodayByStudent(studentId, weekDay) {
    return all(`
      SELECT c.*, u.real_name as teacher_name
      FROM courses c
      JOIN users u ON c.teacher_id = u.id
      JOIN enrollments e ON e.course_id = c.id
      WHERE e.student_id = ? AND c.week_day = ? AND c.status = 'active'
      ORDER BY c.start_section
    `, [studentId, weekDay]);
  },

  findByTeacher(teacherId) {
    return all(`
      SELECT c.*, u.real_name as teacher_name
      FROM courses c
      JOIN users u ON c.teacher_id = u.id
      WHERE c.teacher_id = ?
      ORDER BY c.week_day, c.start_section
    `, [teacherId]);
  },

  findById(id) {
    return get('SELECT * FROM courses WHERE id = ?', [id]);
  },

  create(courseData) {
    const { run } = require('../index');
    return run(
      `INSERT INTO courses (name, teacher_id, college, location, week_day, start_section, end_section,
        start_time, end_time, start_week, end_week, type, color, semester, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        courseData.name, courseData.teacherId, courseData.college || '',
        courseData.location || '', courseData.weekDay, courseData.startSection, courseData.endSection,
        courseData.startTime || '', courseData.endTime || '', courseData.startWeek || 1, courseData.endWeek || 16,
        courseData.type || '必修', courseData.color || '', courseData.semester || '', courseData.status || 'active'
      ]
    );
  },

  getCourseStatus(startSection, endSection) {
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
};

module.exports = CourseQueries;
