/**
 * 应用配置
 * 优先读取环境变量，其次使用默认值
 * 敏感配置通过 .env 文件加载（需要 dotenv）
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// JWT 密钥必须配置，不允许使用默认值
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.error('[Config] 错误: 未配置 JWT_SECRET 环境变量，请在 .env 文件中设置。');
  process.exit(1);
}

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  corsOrigin: process.env.CORS_ORIGIN || (isProd ? '' : '*'),
  jwtSecret,
  jwtExpires: process.env.JWT_EXPIRES || '7d',
  amapKey: process.env.AMAP_KEY || '',
  requestTimeout: 15000,
  maxRedirects: 5,
  rateLimit: {
    windowMs: 5 * 60 * 1000, // 5 分钟窗口
    maxAttempts: 5
  },
  writeRateLimit: {
    windowMs: 1 * 60 * 1000, // 1 分钟窗口
    maxAttempts: 30
  },

  supportedSystems: ['zhengfang', 'qingguo', 'jinzhi'],
  minSemesterYear: 2020,
  maxSemesterYear: 2030
};
