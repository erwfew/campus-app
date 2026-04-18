/**
 * 数据库初始化 + 种子数据
 * 
 * 运行: node db/seed.js
 */
const { initDb, getDb, all, get, count, run, saveDb, hashPassword } = require('./index');

async function seed() {
  await initDb();
  
  console.log('[Seed] 开始填充种子数据...');

  // 检查是否已有数据
  const userCount = count('SELECT COUNT(*) as count FROM users');
  if (userCount > 0) {
    console.log('[Seed] 数据库已有数据，跳过填充');
    return;
  }

  // 创建管理员
  const adminPwd = hashPassword('admin123');
  run('INSERT INTO users (username, password_hash, salt, real_name, role, college) VALUES (?, ?, ?, ?, ?, ?)',
    ['admin', adminPwd.hash, adminPwd.salt, '系统管理员', 'admin', '教务处']);

  // 创建教师
  const teachers = [
    { username: 'teacher1', name: '王教授', college: '信息工程学院' },
    { username: 'teacher2', name: '李老师', college: '机电工程学院' },
    { username: 'teacher3', name: '张教授', college: '经济管理学院' },
    { username: 'teacher4', name: '陈老师', college: '外国语学院' },
  ];

  const teacherPwd = hashPassword('teacher123');
  const teacherIds = [];
  for (const t of teachers) {
    const result = run('INSERT INTO users (username, password_hash, salt, real_name, role, college) VALUES (?, ?, ?, ?, ?, ?)',
      [t.username, teacherPwd.hash, teacherPwd.salt, t.name, 'teacher', t.college]);
    teacherIds.push(result.lastInsertRowid);
  }

  // 创建学生
  const surnames = ['张','李','王','刘','陈','杨','赵','黄','周','吴','徐','孙','胡','朱','高','林','何','郭','马','罗'];
  const names = ['伟','芳','娜','秀英','敏','静','丽','强','磊','军','洋','勇','艳','杰','娟','涛','明','超','秀兰','霞'];
  const colleges = ['信息工程学院','机电工程学院','经济管理学院','外国语学院','艺术设计学院','建筑工程学院'];
  
  const studentPwd = hashPassword('student123');
  const studentIds = [];
  
  for (let i = 0; i < 100; i++) {
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    const college = colleges[Math.floor(Math.random() * colleges.length)];
    const studentId = '2023' + String(i + 1).padStart(4, '0');
    const username = 'stu' + studentId;
    
    const result = run('INSERT INTO users (username, password_hash, salt, real_name, role, student_id, college) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, studentPwd.hash, studentPwd.salt, surname + name, 'student', studentId, college]);
    studentIds.push(result.lastInsertRowid);
  }

  // 创建课程
  const courseData = [
    { name: '高等数学A', teacher: 0, location: '教学楼A-301', weekDay: 0, startSec: 1, endSec: 2, startT: '08:00', endT: '09:40', type: '必修', college: '信息工程学院' },
    { name: '数据结构', teacher: 0, location: '实验楼C-102', weekDay: 1, startSec: 1, endSec: 2, startT: '08:00', endT: '09:40', type: '必修', college: '信息工程学院' },
    { name: 'C语言程序设计', teacher: 1, location: '实验楼D-305', weekDay: 2, startSec: 3, endSec: 4, startT: '10:00', endT: '11:40', type: '必修', college: '机电工程学院' },
    { name: '算法设计与分析', teacher: 0, location: '教学楼B-205', weekDay: 3, startSec: 5, endSec: 6, startT: '14:00', endT: '15:40', type: '选修', college: '信息工程学院' },
    { name: '微观经济学', teacher: 2, location: '教学楼C-101', weekDay: 0, startSec: 3, endSec: 4, startT: '10:00', endT: '11:40', type: '必修', college: '经济管理学院' },
    { name: '大学英语III', teacher: 3, location: '外语楼A-201', weekDay: 4, startSec: 1, endSec: 2, startT: '08:00', endT: '09:40', type: '必修', college: '外国语学院' },
    { name: '机械设计基础', teacher: 1, location: '实验楼A-101', weekDay: 2, startSec: 5, endSec: 6, startT: '14:00', endT: '15:40', type: '必修', college: '机电工程学院' },
    { name: 'Python程序设计', teacher: 0, location: '实验楼C-203', weekDay: 4, startSec: 3, endSec: 4, startT: '10:00', endT: '11:40', type: '选修', college: '信息工程学院' },
  ];

  const colors = ['#4A90D9','#E74C3C','#27AE60','#F39C12','#8E44AD','#1ABC9C','#E67E22','#3498DB'];
  const courseIds = [];
  for (let i = 0; i < courseData.length; i++) {
    const c = courseData[i];
    const result = run(
      'INSERT INTO courses (name, teacher_id, location, week_day, start_section, end_section, start_time, end_time, type, semester, college, start_week, end_week, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [c.name, teacherIds[c.teacher], c.location, c.weekDay, c.startSec, c.endSec, c.startT, c.endT, c.type, '2025-1', c.college, 1, 16, colors[i % 8]]
    );
    courseIds.push(result.lastInsertRowid);
  }

  // 选课
  for (const courseId of courseIds) {
    const count_ = Math.floor(Math.random() * 30) + 20;
    const shuffled = [...studentIds].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(count_, shuffled.length); i++) {
      run('INSERT OR IGNORE INTO enrollments (course_id, student_id) VALUES (?, ?)', [courseId, shuffled[i]]);
    }
  }

  // 创建作业
  const homeworkData = [
    { course: 0, title: '第三章课后习题', desc: '定积分计算，第1-15题', days: 3 },
    { course: 1, title: '树的遍历实验', desc: '实现二叉树的前序、中序、后序遍历', days: 5 },
    { course: 2, title: '指针练习', desc: '指针基础操作5道题', days: 7 },
    { course: 0, title: '第四章练习题', desc: '微分方程求解', days: 10 },
    { course: 3, title: '动态规划作业', desc: '实现最长公共子序列算法', days: 8 },
  ];

  for (const h of homeworkData) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + h.days);
    run('INSERT INTO homework (course_id, title, description, deadline, created_by) VALUES (?, ?, ?, ?, ?)',
      [courseIds[h.course], h.title, h.desc, deadline.toISOString(), teacherIds[courseData[h.course].teacher]]);
  }

  // 考勤记录（过去一周）
  for (let day = 1; day <= 5; day++) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    const dateStr = date.toISOString().slice(0, 10);
    
    for (let ci = 0; ci < 4; ci++) {
      const courseId = courseIds[ci];
      const enrolled = all('SELECT student_id FROM enrollments WHERE course_id = ?', [courseId]);
      for (const e of enrolled) {
        const rand = Math.random();
        const status = rand < 0.85 ? 'present' : rand < 0.92 ? 'absent' : rand < 0.96 ? 'late' : 'leave';
        run('INSERT OR IGNORE INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)',
          [courseId, e.student_id, dateStr, status]);
      }
    }
  }

  // 公告
  run('INSERT INTO notices (title, content, course_id, author_id, scope, important) VALUES (?, ?, ?, ?, ?, ?)',
    ['下周一期中考试，请带好学生证', '考试范围：第一至第四章。请携带学生证和身份证。', courseIds[0], teacherIds[0], 'course', 1]);

  run('INSERT INTO notices (title, content, course_id, author_id, scope, important) VALUES (?, ?, ?, ?, ?, ?)',
    ['本周实验课调至周四下午', '原周三实验课调整至周四下午，地点不变。', courseIds[1], teacherIds[0], 'course', 0]);

  const adminId = get('SELECT id FROM users WHERE role = ?', ['admin']);
  run('INSERT INTO notices (title, content, author_id, scope, important) VALUES (?, ?, ?, ?, ?)',
    ['五一放假通知', '5月1日至5月5日放假，5月6日正常上课。请各学院做好假期安全工作。', adminId.id, 'school', 1]);

  saveDb();

  console.log('[Seed] 种子数据填充完成！');
  console.log('[Seed] ━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[Seed] 管理员: admin / admin123');
  console.log('[Seed] 教师: teacher1~4 / teacher123');
  console.log('[Seed] 学生: stu20230001~stu20230100 / student123');
  console.log('[Seed] ━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// 直接运行时执行
if (require.main === module) {
  seed().then(() => process.exit(0));
}

module.exports = seed;
