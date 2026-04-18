module.exports = {
  port: process.env.PORT || 3000,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  requestTimeout: 15000,
  maxRedirects: 5,
  rateLimit: {
    windowMs: 5 * 60 * 1000, // 5分钟
    maxAttempts: 5
  },
  // 支持的教务系统类型
  supportedSystems: ['zhengfang', 'qingguo', 'jinzhi'],
  // 学期范围限制
  minSemesterYear: 2020,
  maxSemesterYear: 2030
};
