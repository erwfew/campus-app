const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const WebSocket = require('ws');
const { addClient, removeClient, broadcast } = require('./utils/broadcast');
const config = require('./config');
const { initDb, closeDb, all } = require('./db');
const seed = require('./db/seed');
const { errorHandler } = require('./middleware/errorHandler');
const { cacheMiddleware } = require('./middleware/cache');
const rateLimit = require('./middleware/rateLimit');
const { authenticate } = require('./middleware/auth');
const jwt = require('jsonwebtoken');
const importRoutes = require('./routes/import');
const importDataRoutes = require('./routes/import-data');
const homeworkRoutes = require('./routes/homework');
const authRoutes = require('./routes/auth');
const teacherRoutes = require('./routes/teacher');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');
const mapRoutes = require('./routes/map');

const app = express();

// 反向代理后正确获取客户端 IP（Render/Nginx 等）
app.set('trust proxy', 1);

// 安全头
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// gzip 压缩
app.use(compression());

// CORS 配置
// 注意: origin 为 '*' 时不能带 credentials（浏览器规范禁止）
const corsOptions = {
  origin: config.corsOrigin === '*'
    ? '*'
    : config.corsOrigin.split(',').filter(Boolean).map(s => s.trim()),
  credentials: config.corsOrigin !== '*'
};
if (config.corsOrigin) {
  app.use(cors(corsOptions));
}
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 全局输入清理：防止 XSS（只剥离危险标签，保留正常文本中的 < > 符号）
function sanitizeStr(s) {
  // 剥离 script/style/iframe 等危险标签及其内容
  let out = s.replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
  // 剥离自闭合危险标签
  out = out.replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*\/?\s*>/gi, '');
  // 剥离 on* 事件属性
  out = out.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  // 剥离 javascript: 协议
  out = out.replace(/javascript\s*:/gi, '');
  return out.trim();
}
function sanitize(obj) {
  if (typeof obj === 'string') return sanitizeStr(obj);
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (obj && typeof obj === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string') clean[k] = sanitizeStr(v);
      else if (Array.isArray(v)) clean[k] = v.map(item => (typeof item === 'string' ? sanitizeStr(item) : sanitize(item)));
      else if (v && typeof v === 'object') clean[k] = sanitize(v);
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

// 静态文件（只挂需要公开的目录，不暴露源码）
app.use('/static', express.static(path.join(__dirname, '..', 'static')));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));
// 只提供入口页面和样式，不遍历项目根目录（防止源码/.env 泄露）
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));
app.get('/style.css', (req, res) => res.sendFile(path.join(__dirname, '..', 'style.css')));

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
app.use('/api/map', mapRoutes);

// 排行榜（需登录，不暴露真实姓名）
app.get('/api/ranking', authenticate, cacheMiddleware(120000), (req, res) => {
  const rankings = all(`
    SELECT u.real_name as name,
      ROUND(CAST(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 1) as rate
    FROM users u JOIN attendance a ON u.id = a.student_id
    WHERE u.role = 'student' GROUP BY u.id ORDER BY rate DESC LIMIT 20
  `);
  // 只返回姓名首字 + 学号后缀，保护隐私
  res.json({ success: true, data: rankings.map((r, i) => ({
    rank: i + 1,
    name: r.name ? r.name.charAt(0) + '**' : '匿名',
    value: r.rate, unit: '%'
  })) });
});

// 校园公告（需登录）
app.get('/api/notices', authenticate, cacheMiddleware(60000), (req, res) => {
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

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '接口不存在' } });
});

// 错误处理
app.use(errorHandler);

// ==================== WebSocket ====================

const wss = new WebSocket.Server({ noServer: true })

wss.on('connection', (ws) => {
  addClient(ws)
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
  ws.on('close', () => removeClient(ws))
  ws.send(JSON.stringify({ type: 'connected', message: '效园通 WebSocket 已连接' }))
})

// ==================== 启动（先初始化数据库，再监听端口）====================

async function start() {
  try {
    await initDb();
    await seed();
    console.log('[App] 数据库就绪');

    const server = http.createServer(app)

    // WebSocket 升级（需携带有效 JWT：ws://host/ws?token=xxx）
    server.on('upgrade', (request, socket, head) => {
      if (request.url === '/ws' || request.url.startsWith('/ws?')) {
        try {
          const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
          const token = url.searchParams.get('token');
          if (!token) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
          }
          jwt.verify(token, config.jwtSecret);
        } catch (e) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request)
        })
      } else {
        socket.destroy()
      }
    })

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[App] 端口 ${config.port} 已被占用，请更换 PORT 或关闭占用进程`);
      } else {
        console.error('[App] 服务器错误:', err.message);
      }
      closeDb();
      process.exit(1);
    });

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
