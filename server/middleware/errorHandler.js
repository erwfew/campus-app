/**
 * 自定义应用错误类
 */
class AppError extends Error {
  constructor(code, message, statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

class AuthError extends AppError {
  constructor(message) {
    super('INVALID_CREDENTIALS', message || '用户名或密码错误', 401);
  }
}

/**
 * 统一错误处理中间件
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  // 生产环境隐藏内部错误详情
  const message = statusCode === 500 ? '服务器内部错误' : err.message;

  console.error(`[Error] ${code}: ${err.message}`);
  if (statusCode === 500) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: { code, message }
  });
}

module.exports = { AppError, AuthError, errorHandler };
