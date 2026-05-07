/**
 * 应用配置
 * 优先读取环境变量，其次使用默认值
 * 敏感配置通过 .env 文件加载（需要 dotenv）
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpires: process.env.JWT_EXPIRES || '7d',
  requestTimeout: 15000,
  maxRedirects: 5,
  rateLimit: {
    windowMs: 5 * 60 * 1000, // 5分钟
    maxAttempts: 5
  },
  // 数据库写入防抖间隔（毫秒）
  dbSaveDebounceMs: 2000,
  // 支持的教务系统类型
  supportedSystems: ['zhengfang', 'qingguo', 'jinzhi'],
  // 学期范围限制
  minSemesterYear: 2020,
  maxSemesterYear: 2030
};
