/**
 * JWT 认证中间件
 * 
 * 使用 jsonwebtoken 进行 token 签发和验证
 * 前端在请求头携带: Authorization: Bearer <token>
 */
const jwt = require('jsonwebtoken');
const config = require('../config');

const JWT_SECRET = process.env.JWT_SECRET || 'campus-app-secret-change-in-production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

if (!process.env.JWT_SECRET) {
  console.warn('[Auth] 警告: 使用默认 JWT 密钥，生产环境请设置 JWT_SECRET 环境变量');
}

/**
 * 生成 JWT token
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

/**
 * 验证 token 中间件
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: '请先登录' }
    });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { code: 'TOKEN_EXPIRED', message: '登录已过期，请重新登录' }
    });
  }
}

/**
 * 角色检查中间件
 * @param  {...string} roles - 允许的角色列表
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: '请先登录' }
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: '权限不足' }
      });
    }
    next();
  };
}

module.exports = { generateToken, authenticate, requireRole, JWT_SECRET };
