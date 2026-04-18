const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const { initDb, saveDb, all } = require('./db');
const seed = require('./db/seed');
const { errorHandler } = require('./middleware/errorHandler');
const importRoutes = require('./routes/import');
const importDataRoutes = require('./routes/import-data');
const homeworkRoutes = require('./routes/homework');
const authRoutes = require('./routes/auth');
const teacherRoutes = require('./routes/teacher');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');

// 初始化数据库（异步，启动前完成）
(async () => {
  await initDb();
  await seed();
  console.log('[App] 数据库就绪');
})();

const app = express();

// 安全头
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// 中间件
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

// 静态文件
app.use('/static', express.static(path.join(__dirname, '..', 'static')));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));
app.use(express.static(path.join(__dirname, '..'), { index: 'index.html' }));

// 每次写请求后自动保存数据库
app.use((req, res, next) => {
  const origEnd = res.end.bind(res);
  res.end = function(...args) {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      try { saveDb(); } catch (e) { /* 忽略 */ }
    }
    return origEnd(...args);
  };
  next();
});

// ==================== 公开接口 ====================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok', name: '效园通后端服务', version: '1.0.0',
    uptime: process.uptime(), timestamp: new Date().toISOString(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), unit: 'MB'
    }
  });
});

// 排行榜
app.get('/api/ranking', (req, res) => {
  const rankings = all(`
    SELECT u.real_name as name,
      ROUND(CAST(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 1) as rate
    FROM users u JOIN attendance a ON u.id = a.student_id
    WHERE u.role = 'student' GROUP BY u.id ORDER BY rate DESC LIMIT 20
  `);
  res.json({ success: true, data: rankings.map((r, i) => ({ rank: i + 1, name: r.name, value: r.rate, unit: '%' })) });
});

// 校园公告
app.get('/api/notices', (req, res) => {
  const notices = all(`
    SELECT n.*, u.real_name as author_name FROM notices n JOIN users u ON n.author_id = u.id
    WHERE n.scope = 'school' ORDER BY n.created_at DESC LIMIT 30
  `);
  res.json({
    success: true,
    data: notices.map(n => ({
      id: n.id, title: n.title, type: n.scope === 'school' ? '通知' : '课程',
      date: n.created_at ? n.created_at.slice(0, 10) : '', important: !!n.important
    }))
  });
});

// ==================== 路由挂载 ====================

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/import', importRoutes);
app.use('/api/import-data', importDataRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '接口不存在' } });
});

// 错误处理
app.use(errorHandler);

// ==================== 启动 ====================

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║       效园通 API 服务已启动           ║');
  console.log(`║       http://localhost:${config.port}           ║`);
  console.log('╚══════════════════════════════════════╝\n');
  console.log('接口列表：');
  console.log('  POST /api/auth/login      登录');
  console.log('  POST /api/auth/register   注册');
  console.log('  GET  /api/student/*        学生端');
  console.log('  GET  /api/homework         作业');
  console.log('  GET  /api/notices          公告');
  console.log('  GET  /api/teacher/*        教师端');
  console.log('  GET  /api/admin/*          管理端');
  console.log('  POST /api/import/preview   教务导入');
  console.log('\n页面：');
  console.log(`  http://localhost:${config.port}/`);
  console.log(`  http://localhost:${config.port}/admin/teacher/index.html`);
  console.log(`  http://localhost:${config.port}/admin/school/index.html`);
});

// 优雅关闭
process.on('SIGTERM', () => { console.log('SIGTERM...'); saveDb(); server.close(() => process.exit(0)); });
process.on('SIGINT', () => { console.log('SIGINT...'); saveDb(); server.close(() => process.exit(0)); });

module.exports = app;
