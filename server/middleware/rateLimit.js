const config = require('../config');

const attempts = new Map();

// 定期清理过期记录，防止内存泄漏
const CLEANUP_INTERVAL = 60 * 1000; // 每分钟清理一次
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of attempts) {
    if (now - record.start > config.rateLimit.windowMs * 2) {
      attempts.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

/**
 * 简单的内存级频率限制中间件
 * @param {number} windowMs - 时间窗口（毫秒），默认5分钟
 * @param {number} maxAttempts - 最大尝试次数，默认5次
 */
function rateLimit(windowMs, maxAttempts) {
  windowMs = windowMs || config.rateLimit.windowMs;
  maxAttempts = maxAttempts || config.rateLimit.maxAttempts;

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const record = attempts.get(key) || { count: 0, start: now };

    // 时间窗口过期，重置计数
    if (now - record.start > windowMs) {
      record.count = 0;
      record.start = now;
    }

    record.count++;
    attempts.set(key, record);

    if (record.count > maxAttempts) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: '请求过于频繁，请5分钟后再试'
        }
      });
    }

    // 设置响应头
    res.set('X-RateLimit-Limit', String(maxAttempts));
    res.set('X-RateLimit-Remaining', String(Math.max(0, maxAttempts - record.count)));

    next();
  };
}

module.exports = rateLimit;
