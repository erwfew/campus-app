const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const WebSocket = require('ws');
const config = require('./config');
const { initDb, closeDb, all } = require('./db');
const seed = require('./db/seed');
const { errorHandler } = require('./middleware/errorHandler');
const { cacheMiddleware } = require('./middleware/cache');
const rateLimit = require('./middleware/rateLimit');
const importRoutes = require('./routes/import');
const importDataRoutes = require('./routes/import-data');
const homeworkRoutes = require('./routes/homework');
const authRoutes = require('./routes/auth');
const teacherRoutes = require('./routes/teacher');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');

const app = express();

// 安全头
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// gzip 压缩
app.use(compression());

// CORS 配置
const corsOptions = {
  origin: config.corsOrigin === '*'
    ? '*'
    : config.corsOrigin.split(',').filter(Boolean).map(s => s.trim()),
  credentials: true
};
if (config.corsOrigin) {
  app.use(cors(corsOptions));
}
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 全局输入清理：防止 XSS 和格式化攻击
function sanitize(obj) {
  if (typeof obj === 'string') {
    return obj.replace(/<[^>]*>/g, '').trim();
  }
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (obj && typeof obj === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string') clean[k] = v.replace(/<[^>]*>/g, '').trim();
      else clean[k] = v;
    }
    return clean;
  }
  return obj;
}
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') req.body = sanitize(req.body);
  if (req.query && typeof req.query === 'object') req.query = sanitize(req.query);
  if (req.params && typeof req.params === 'object') req.params = sanitize(req.params);
  next();
});

// 请求日志
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'WARN' : 'INFO';
    console.log(`[${level}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  res.setHeader('X-Response-Time', (Date.now() - start) + 'ms');
  next();
});

// 静态文件
app.use('/static', express.static(path.join(__dirname, '..', 'static')));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));
app.use(express.static(path.join(__dirname, '..'), { index: 'index.html' }));

// better-sqlite3 自动持久化，无需手动 save

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
app.get('/api/ranking', cacheMiddleware(120000), (req, res) => {
  const rankings = all(`
    SELECT u.real_name as name,
      ROUND(CAST(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 1) as rate
    FROM users u JOIN attendance a ON u.id = a.student_id
    WHERE u.role = 'student' GROUP BY u.id ORDER BY rate DESC LIMIT 20
  `);
  res.json({ success: true, data: rankings.map((r, i) => ({ rank: i + 1, name: r.name, value: r.rate, unit: '%' })) });
});

// 校园公告
app.get('/api/notices', cacheMiddleware(60000), (req, res) => {
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

// 登录/注册接口挂载限流（防暴力破解）
app.use('/api/auth/login', rateLimit());
app.use('/api/auth/register', rateLimit());

// 写操作接口限流
app.use('/api/teacher', rateLimit(config.writeRateLimit.windowMs, config.writeRateLimit.maxAttempts));
app.use('/api/admin', rateLimit(config.writeRateLimit.windowMs, config.writeRateLimit.maxAttempts));
app.use('/api/import', rateLimit(config.writeRateLimit.windowMs, config.writeRateLimit.maxAttempts));
app.use('/api/import-data', rateLimit(config.writeRateLimit.windowMs, config.writeRateLimit.maxAttempts));

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

// ==================== WebSocket ====================

const wss = new WebSocket.Server({ noServer: true })
const wsClients = new Set()

wss.on('connection', (ws) => {
  wsClients.add(ws)
  ws._channel = ''
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw)
      if (msg.type === 'subscribe' && msg.channel) {
        ws._channel = msg.channel
        ws.send(JSON.stringify({ type: 'subscribed', channel: msg.channel }))
      }
    } catch (e) {}
  })
  ws.on('close', () => wsClients.delete(ws))
  ws.send(JSON.stringify({ type: 'connected', message: '效园通 WebSocket 已连接' }))
})

/**
 * 向指定频道广播消息
 * @param {string} channel - 频道名（空字符串=全部）
 * @param {object} data - 消息数据
 */
function broadcast(channel, data) {
  const payload = JSON.stringify({ channel, data, timestamp: Date.now() })
  for (const ws of wsClients) {
    if (ws.readyState === WebSocket.OPEN) {
      if (!ws._channel || !channel || ws._channel === channel) {
        ws.send(payload)
      }
    }
  }
}

// ==================== 启动（先初始化数据库，再监听端口）====================

async function start() {
  try {
    await initDb();
    await seed();
    console.log('[App] 数据库就绪');

    const server = http.createServer(app)

    // WebSocket 升级
    server.on('upgrade', (request, socket, head) => {
      if (request.url === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request)
        })
      } else {
        socket.destroy()
      }
    })

    server.listen(config.port, '0.0.0.0', () => {
      console.log('\n════════════════════════════════════════');
      console.log('║      效园通 API 服务已启动!          ║');
      console.log(`║      http://localhost:${config.port}           ║`);
      console.log('════════════════════════════════════════\n');
      console.log('接口列表:');
      console.log('  POST /api/auth/login      登录（已限流）');
      console.log('  POST /api/auth/register   注册（已限流）');
      console.log('  GET  /api/student/*        学生端');
      console.log('  GET  /api/homework         作业');
      console.log('  GET  /api/notices          公告');
      console.log('  GET  /api/teacher/*        教师端（已限流）');
      console.log('  GET  /api/admin/*          管理端（已限流）');
      console.log('  POST /api/import/preview   教务导入（已限流）');
      console.log('\n页面:');
      console.log(`  http://localhost:${config.port}/`);
      console.log(`  http://localhost:${config.port}/admin/teacher/index.html`);
      console.log(`  http://localhost:${config.port}/admin/school/index.html`);
      console.log(`\n  WebSocket: ws://localhost:${config.port}/ws`);
    });

    // 优雅关闭
    function shutdown(signal) {
      console.log(`\n[App] 收到 ${signal}，正在关闭...`);
      closeDb();
      server.close(() => {
        console.log('[App] 服务已关闭');
        process.exit(0);
      });
      setTimeout(() => { process.exit(1); }, 5000);
    }
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (err) {
    console.error('[App] 启动失败:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
