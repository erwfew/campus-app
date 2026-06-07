/**
 * 数据库初始化模块
 * 使用 better-sqlite3（持久化 SQLite，性能优于 sql.js）
 * 
 * 特点：
 * - 同步 API，无需 async/await
 * - WAL 模式，支持并发读写
 * - 自动持久化，无需手动 save/load
 */
const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '..', 'data', 'campus.db');

let db = null;

/**
 * 初始化数据库
 */
function initDb() {
  if (db) return db;

  const fs = require('fs');
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(DB_PATH);

  // WAL 模式：提升并发读写性能
  db.pragma('journal_mode = WAL');
  // 启用外键约束
  db.pragma('foreign_keys = ON');

  console.log('[DB] 数据库已连接');

  // 建表
  db.exec(`
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
      verified INTEGER DEFAULT 0,
      school_name TEXT DEFAULT '',
      verify_date TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 迁移：给旧表补 verified 相关字段（如果缺失）
  try {
    const cols = db.pragma('table_info(users)');
    const colNames = cols.map(r => r.name);
    if (!colNames.includes('verified')) db.exec('ALTER TABLE users ADD COLUMN verified INTEGER DEFAULT 0');
    if (!colNames.includes('school_name')) db.exec('ALTER TABLE users ADD COLUMN school_name TEXT DEFAULT ""');
    if (!colNames.includes('verify_date')) db.exec('ALTER TABLE users ADD COLUMN verify_date TEXT DEFAULT ""');
  } catch (e) { /* 新库不需要迁移 */ }

  db.exec(`
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

  db.exec(`
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

  db.exec(`
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

  db.exec(`
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

  db.exec(`
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

  db.exec(`
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

  db.exec(`
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
  db.exec('CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(teacher_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_attendance_course_date ON attendance(course_id, date)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_homework_course ON homework(course_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_submissions_homework ON submissions(homework_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_grades_course ON grades(course_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_notices_scope ON notices(scope)');

  console.log('[DB] 数据库初始化完成');
  return db;
}

/**
 * 关闭数据库连接
 */
function closeDb() {
  if (db) {
    db.close();
    db = null;
    console.log('[DB] 数据库已关闭');
  }
}

/**
 * 执行查询并返回结果数组
 */
function all(sql, params = []) {
  return db.prepare(sql).all(...params);
}

/**
 * 执行查询返回单行
 */
function get(sql, params = []) {
  return db.prepare(sql).get(...params) || null;
}

/**
 * 执行查询返回行数
 */
function count(sql, params = []) {
  const result = db.prepare(sql).get(...params);
  return result ? Object.values(result)[0] : 0;
}

/**
 * 执行 INSERT/UPDATE/DELETE
 */
function run(sql, params = []) {
  const stmt = db.prepare(sql);
  const info = stmt.run(...params);
  return { lastInsertRowid: info.lastInsertRowid, changes: info.changes };
}

/**
 * 事务包装器
 */
function transaction(fn) {
  return db.transaction(fn)();
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

module.exports = { initDb, closeDb, all, get, count, run, transaction, hashPassword, verifyPassword };
