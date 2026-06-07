const { all, get, count, run, hashPassword } = require('../db');

/**
 * 管理员工作台统计
 */
async function getDashboardStats() {
  const stats = {
    teachers: count("SELECT COUNT(*) as count FROM users WHERE role = 'teacher'"),
    students: count("SELECT COUNT(*) as count FROM users WHERE role = 'student'"),
    courses: count("SELECT COUNT(*) as count FROM courses WHERE status = 'active'"),
    activeNotices: count("SELECT COUNT(*) as count FROM notices WHERE scope = 'school'")
  };

  const attendanceStats = all(`
    SELECT date,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
      SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
      SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leave
    FROM attendance
    WHERE date >= date('now', '-7 days')
    GROUP BY date
    ORDER BY date
  `);

  const collegeStats = all(`
    SELECT college, COUNT(*) as count
    FROM courses
    WHERE status = 'active' AND college != ''
    GROUP BY college
    ORDER BY count DESC
    LIMIT 10
  `);

  return { stats, attendanceStats, collegeStats };
}

/**
 * 用户列表（支持角色/关键词筛选、分页）
 */
async function getUsers({ role, keyword, page = 1, pageSize = 20 }) {
  let where = '1=1';
  const params = [];

  if (role) {
    where += ' AND role = ?';
    params.push(role);
  }
  if (keyword) {
    where += ' AND (real_name LIKE ? OR username LIKE ? OR student_id LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const total = count(`SELECT COUNT(*) as count FROM users WHERE ${where}`, params);
  const users = all(
    `SELECT * FROM users WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize)]
  );

  const list = users.map(u => ({
    id: u.id,
    username: u.username,
    realName: u.real_name,
    role: u.role,
    college: u.college,
    studentId: u.student_id,
    phone: u.phone,
    email: u.email,
    createdAt: u.created_at
  }));

  return { list, total, page: parseInt(page), pageSize: parseInt(pageSize) };
}

/**
 * 创建用户（教师/管理员/学生）
 */
async function createUser({ username, password, realName, role, college, phone, email, studentId }) {
  const existing = get('SELECT id FROM users WHERE username = ?', [username]);
  if (existing) {
    const err = new Error('该用户名已存在');
    err.code = 'USER_EXISTS';
    err.statusCode = 409;
    throw err;
  }

  const { hash, salt } = hashPassword(password);
  const result = run(
    'INSERT INTO users (username, password_hash, salt, real_name, role, college, phone, email, student_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [username, hash, salt, realName, role, college || '', phone || '', email || '', studentId || '']
  );

  return { id: result.lastInsertRowid, message: '用户创建成功' };
}

/**
 * 修改用户信息
 */
async function updateUser(id, { realName, role, college, phone, email, password }) {
  const user = get('SELECT * FROM users WHERE id = ?', [id]);
  if (!user) {
    const err = new Error('用户不存在');
    err.code = 'NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  if (password) {
    const { hash, salt } = hashPassword(password);
    run('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?', [hash, salt, id]);
  }

  run(`UPDATE users SET
    real_name = COALESCE(?, real_name), role = COALESCE(?, role),
    college = COALESCE(?, college), phone = COALESCE(?, phone),
    email = COALESCE(?, email), updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`, [realName, role, college, phone, email, id]);

  return { message: '用户信息已更新' };
}

/**
 * 删除用户
 */
async function deleteUser(id, currentUserId) {
  if (parseInt(id) === currentUserId) {
    const err = new Error('不能删除自己');
    err.code = 'INVALID_OPERATION';
    err.statusCode = 400;
    throw err;
  }
  run('DELETE FROM users WHERE id = ?', [id]);
  return { message: '用户已删除' };
}

/**
 * 所有课程列表（支持教师/关键词筛选）
 */
async function getCourses({ teacherId, keyword }) {
  let sql = `
    SELECT c.*, u.real_name as teacher_name,
      (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrolled_count
    FROM courses c JOIN users u ON c.teacher_id = u.id WHERE 1=1
  `;
  const params = [];
  if (teacherId) {
    sql += ' AND c.teacher_id = ?';
    params.push(teacherId);
  }
  if (keyword) {
    sql += ' AND (c.name LIKE ? OR u.real_name LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  sql += ' ORDER BY c.created_at DESC';

  return all(sql, params).map(c => ({
    id: c.id,
    name: c.name,
    teacherName: c.teacher_name,
    teacherId: c.teacher_id,
    location: c.location,
    type: c.type,
    studentCount: c.enrolled_count,
    semester: c.semester,
    college: c.college,
    status: c.status
  }));
}

/**
 * 创建课程
 */
async function createCourse({ name, teacherId, location, weekDay, startSection, endSection, startTime, endTime, type, semester, college }) {
  const result = run(
    'INSERT INTO courses (name, teacher_id, location, week_day, start_section, end_section, start_time, end_time, type, semester, college) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, teacherId, location || '', weekDay || 0, startSection || 1, endSection || 2, startTime || '', endTime || '', type || '必修', semester || '', college || '']
  );
  return { id: result.lastInsertRowid, message: '课程创建成功' };
}

/**
 * 修改课程
 */
async function updateCourse(id, { name, teacherId, location, status }) {
  run(`UPDATE courses SET name = COALESCE(?, name), teacher_id = COALESCE(?, teacher_id),
    location = COALESCE(?, location), status = COALESCE(?, status), updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`, [name, teacherId, location, status, id]);
  return { message: '课程已更新' };
}

/**
 * 归档课程（删除）
 */
async function archiveCourse(id) {
  run("UPDATE courses SET status = 'archived' WHERE id = ?", [id]);
  return { message: '课程已归档' };
}

/**
 * 批量选课
 */
async function batchEnroll({ courseId, studentIds }) {
  for (const sid of studentIds) {
    run('INSERT OR IGNORE INTO enrollments (course_id, student_id) VALUES (?, ?)', [courseId, sid]);
  }

  const cnt = count('SELECT COUNT(*) as count FROM enrollments WHERE course_id = ?', [courseId]);
  run('UPDATE courses SET student_count = ? WHERE id = ?', [cnt, courseId]);

  return { message: '选课成功', count: studentIds.length };
}

/**
 * 全校公告列表
 */
async function getSchoolNotices() {
  const notices = all(`
    SELECT n.*, u.real_name as author_name
    FROM notices n JOIN users u ON n.author_id = u.id
    WHERE n.scope = ?
    ORDER BY n.created_at DESC LIMIT 50
  `, ['school']);

  return notices.map(n => ({
    id: n.id,
    title: n.title,
    content: n.content,
    author: n.author_name,
    date: n.created_at ? n.created_at.slice(0, 10) : '',
    important: !!n.important
  }));
}

/**
 * 发布全校公告
 */
async function createNotice({ title, content, important }, authorId) {
  const result = run('INSERT INTO notices (title, content, author_id, scope, important) VALUES (?, ?, ?, ?, ?)',
    [title, content || '', authorId, 'school', important ? 1 : 0]);
  return { id: result.lastInsertRowid, message: '公告已发布' };
}

/**
 * 删除公告
 */
async function deleteNotice(id) {
  run('DELETE FROM notices WHERE id = ?', [id]);
  return { message: '公告已删除' };
}

module.exports = {
  getDashboardStats,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getCourses,
  createCourse,
  updateCourse,
  archiveCourse,
  batchEnroll,
  getSchoolNotices,
  createNotice,
  deleteNotice
};
