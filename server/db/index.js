/**
 * 数据库初始化模块
 * 使用 sql.js（纯 JavaScript SQLite，无需原生编译）
 * 
 * 注意：sql.js 是内存数据库，每次启动从文件加载，写入后保存到文件
 */
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '..', 'data', 'campus.db');

let db = null;
let SQL = null;

async function getDb() {
  if (!db) {
    await initDb();
  }
  return db;
}

async function initDb() {
  if (db) return db;

  SQL = await initSqlJs();

  // 确保 data 目录存在
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 如果数据库文件存在，加载它；否则创建新的
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    console.log('[DB] 数据库已加载');
  } else {
    db = new SQL.Database();
    console.log('[DB] 新数据库已创建');
  }

  // 启用外键
  db.run('PRAGMA foreign_keys = ON');

  // 建表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      real_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'teacher', 'student')),
      avatar TEXT DEFAULT '',
      college TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      student_id TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      teacher_id INTEGER NOT NULL,
      college TEXT DEFAULT '',
      location TEXT DEFAULT '',
      week_day INTEGER DEFAULT 0,
      start_section INTEGER DEFAULT 1,
      end_section INTEGER DEFAULT 2,
      start_time TEXT DEFAULT '',
      end_time TEXT DEFAULT '',
      start_week INTEGER DEFAULT 1,
      end_week INTEGER DEFAULT 16,
      type TEXT DEFAULT '必修',
      student_count INTEGER DEFAULT 0,
      semester TEXT DEFAULT '',
      color TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(course_id, student_id),
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (student_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('present', 'absent', 'late', 'leave')),
      remark TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(course_id, student_id, date),
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (student_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS homework (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      deadline DATETIME,
      created_by INTEGER NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      homework_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      content TEXT DEFAULT '',
      file_url TEXT DEFAULT '',
      score INTEGER,
      feedback TEXT DEFAULT '',
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      graded_at DATETIME,
      UNIQUE(homework_id, student_id),
      FOREIGN KEY (homework_id) REFERENCES homework(id),
      FOREIGN KEY (student_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      usual_score INTEGER DEFAULT 0,
      midterm_score INTEGER DEFAULT 0,
      final_score INTEGER DEFAULT 0,
      total_score INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(course_id, student_id),
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (student_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      course_id INTEGER,
      author_id INTEGER NOT NULL,
      scope TEXT DEFAULT 'course',
      important INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (author_id) REFERENCES users(id)
    )
  `);

  // 索引
  db.run('CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(teacher_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_attendance_course_date ON attendance(course_id, date)');
  db.run('CREATE INDEX IF NOT EXISTS idx_homework_course ON homework(course_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_submissions_homework ON submissions(homework_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_grades_course ON grades(course_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_notices_scope ON notices(scope)');

  console.log('[DB] 数据库初始化完成');
  return db;
}

/**
 * 保存数据库到文件
 */
function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

/**
 * 执行查询并返回结果数组
 */
function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

/**
 * 执行查询返回单行
 */
function get(sql, params = []) {
  const results = all(sql, params);
  return results[0] || null;
}

/**
 * 执行查询返回行数
 */
function count(sql, params = []) {
  const result = get(sql, params);
  return result ? Object.values(result)[0] : 0;
}

/**
 * 执行 INSERT/UPDATE/DELETE
 */
function run(sql, params = []) {
  db.run(sql, params);
  // 返回 lastInsertRowid 和 changes
  const info = db.exec('SELECT last_insert_rowid() as id, changes() as changes');
  const id = info.length > 0 && info[0].values.length > 0 ? info[0].values[0][0] : 0;
  const changes_ = info.length > 0 && info[0].values.length > 0 ? info[0].values[0][1] : 0;
  return { lastInsertRowid: id, changes: changes_ };
}

/**
 * 密码哈希工具
 */
function hashPassword(password, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const computed = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return computed === hash;
}

module.exports = { getDb, initDb, saveDb, all, get, count, run, hashPassword, verifyPassword };
