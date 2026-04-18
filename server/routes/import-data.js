const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const bcrypt = require('bcrypt');
const { run, get, all } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.use(requireRole('admin'));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// POST /api/import/:type  type: teachers | students | courses
router.post('/:type', upload.single('file'), async (req, res) => {
  try {
    const type = req.params.type;
    if (!['teachers', 'students', 'courses'].includes(type)) {
      return res.status(400).json({ success: false, error: { message: '不支持的导入类型' } });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: { message: '请上传 Excel 文件' } });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'Excel 文件为空' } });
    }

    let result;
    if (type === 'teachers') result = await importTeachers(rows);
    else if (type === 'students') result = await importStudents(rows);
    else if (type === 'courses') result = await importCourses(rows);

    res.json({ success: true, data: result });
  } catch (e) {
    console.error('Import error:', e);
    res.status(500).json({ success: false, error: { message: '导入失败: ' + e.message } });
  }
});

// GET /api/import/template/:type
router.get('/template/:type', (req, res) => {
  const type = req.params.type;
  let headers, sample;

  if (type === 'teachers') {
    headers = ['用户名', '姓名', '密码', '学院', '电话'];
    sample = ['teacher001', '张老师', 'teacher123', '计算机学院', '13800138000'];
  } else if (type === 'students') {
    headers = ['学号', '姓名', '用户名', '密码', '学院', '专业', '年级'];
    sample = ['stu20240001', '李同学', 'li001', 'student123', '计算机学院', '软件工程', '2024'];
  } else if (type === 'courses') {
    headers = ['课程名称', '教师用户名', '上课时间', '开始节次', '结束节次', '教室', '课程类型', '学生学号(逗号分隔)'];
    sample = ['高等数学', 'teacher1', '1', '1', '2', 'A101', '必修', 'stu20230001,stu20230002,stu20230003'];
  } else {
    return res.status(400).json({ success: false, error: { message: '不支持的类型' } });
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
  XLSX.utils.book_append_sheet(wb, ws, type);
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=' + type + '_template.xlsx');
  res.send(buf);
});

async function importTeachers(rows) {
  let success = 0, skipped = 0, errors = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const username = r['用户名'] || r['username'];
    const realName = r['姓名'] || r['realName'] || '';
    const password = r['密码'] || r['password'] || 'teacher123';
    const college = r['学院'] || r['college'] || '';
    const phone = r['电话'] || r['phone'] || '';

    if (!username) { errors.push('第' + (i+2) + '行: 用户名为空'); continue; }

    const existing = get('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) { skipped++; continue; }

    const hashed = bcrypt.hashSync(password, 10);
    run('INSERT INTO users (username, password, real_name, role, college, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashed, realName, 'teacher', college, phone]);
    success++;
  }
  return { success, skipped, errors, total: rows.length };
}

async function importStudents(rows) {
  let success = 0, skipped = 0, errors = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const studentId = String(r['学号'] || r['studentId'] || '');
    const realName = r['姓名'] || r['realName'] || '';
    const username = r['用户名'] || r['username'] || studentId;
    const password = r['密码'] || r['password'] || 'student123';
    const college = r['学院'] || r['college'] || '';
    const major = r['专业'] || r['major'] || '';
    const grade = String(r['年级'] || r['grade'] || '');

    if (!studentId) { errors.push('第' + (i+2) + '行: 学号为空'); continue; }

    const existing = get('SELECT id FROM users WHERE student_id = ?', [studentId]);
    if (existing) { skipped++; continue; }

    const existingUsername = get('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUsername) { skipped++; continue; }

    const hashed = bcrypt.hashSync(password, 10);
    run('INSERT INTO users (username, password, real_name, role, student_id, college, major, grade) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [username, hashed, realName, 'student', studentId, college, major, grade]);
    success++;
  }
  return { success, skipped, errors, total: rows.length };
}

async function importCourses(rows) {
  let success = 0, skipped = 0, errors = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const name = r['课程名称'] || r['name'] || '';
    const teacherUsername = r['教师用户名'] || r['teacher'] || '';
    const weekDay = parseInt(r['上课时间'] || r['weekDay'] || 1);
    const startSection = parseInt(r['开始节次'] || r['startSection'] || 1);
    const endSection = parseInt(r['结束节次'] || r['endSection'] || 2);
    const location = r['教室'] || r['location'] || '';
    const type = r['课程类型'] || r['type'] || '必修';
    const studentIds = String(r['学生学号'] || r['students'] || '').split(/[,，]/).filter(Boolean);

    if (!name) { errors.push('第' + (i+2) + '行: 课程名称为空'); continue; }

    const teacher = get('SELECT id FROM users WHERE username = ? AND role = ?', [teacherUsername, 'teacher']);
    if (!teacher) { errors.push('第' + (i+2) + '行: 教师 ' + teacherUsername + ' 不存在'); continue; }

    run('INSERT INTO courses (name, teacher_id, week_day, start_section, end_section, location, type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, teacher.id, weekDay, startSection, endSection, location, type, 'active']);
    const courseId = get('SELECT last_insert_rowid() as id').id;

    for (const sid of studentIds) {
      const student = get('SELECT id FROM users WHERE student_id = ? AND role = ?', [sid.trim(), 'student']);
      if (student) {
        run('INSERT OR IGNORE INTO enrollments (course_id, student_id) VALUES (?, ?)', [courseId, student.id]);
      }
    }
    success++;
  }
  return { success, skipped, errors, total: rows.length };
}

module.exports = router;
