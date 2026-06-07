/**
 * 输入验证中间件
 * 使用 express-validator 进行参数校验
 */

/**
 * 注册参数验证
 */
const validateRegister = [
  (req, res, next) => {
    const { username, password, realName } = req.body;
    const errors = [];

    // 用户名验证
    if (!username || typeof username !== 'string') {
      errors.push('用户名不能为空');
    } else {
      const trimmed = username.trim();
      if (trimmed.length < 3 || trimmed.length > 30) {
        errors.push('用户名长度应在 3-30 个字符之间');
      }
      if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(trimmed)) {
        errors.push('用户名只能包含字母、数字、下划线和中文');
      }
    }

    // 密码验证
    if (!password || typeof password !== 'string') {
      errors.push('密码不能为空');
    } else {
      if (password.length < 6 || password.length > 50) {
        errors.push('密码长度应在 6-50 个字符之间');
      }
    }

    // 真实姓名验证
    if (!realName || typeof realName !== 'string') {
      errors.push('真实姓名不能为空');
    } else {
      const trimmed = realName.trim();
      if (trimmed.length < 2 || trimmed.length > 20) {
        errors.push('姓名长度应在 2-20 个字符之间');
      }
    }

    // 学号验证（可选）
    if (req.body.studentId && typeof req.body.studentId === 'string') {
      const sid = req.body.studentId.trim();
      if (sid.length > 0 && (sid.length < 4 || sid.length > 20)) {
        errors.push('学号长度应在 4-20 个字符之间');
      }
    }

    // 学院验证（可选）
    if (req.body.college && typeof req.body.college === 'string') {
      const college = req.body.college.trim();
      if (college.length > 50) {
        errors.push('学院名称不能超过 50 个字符');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: errors[0] }
      });
    }

    // 清理输入
    req.body.username = req.body.username.trim();
    req.body.realName = req.body.realName.trim();
    if (req.body.studentId) req.body.studentId = req.body.studentId.trim();
    if (req.body.college) req.body.college = req.body.college.trim();

    next();
  }
];

/**
 * 登录参数验证
 */
const validateLogin = [
  (req, res, next) => {
    const { username, password } = req.body;
    
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: '请输入用户名' }
      });
    }
    
    if (!password || typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: '请输入密码' }
      });
    }

    req.body.username = username.trim();
    next();
  }
];

/**
 * 修改密码参数验证
 */
const validateChangePassword = [
  (req, res, next) => {
    const { oldPassword, newPassword } = req.body;
    const errors = [];

    if (!oldPassword || typeof oldPassword !== 'string') {
      errors.push('请输入旧密码');
    }

    if (!newPassword || typeof newPassword !== 'string') {
      errors.push('请输入新密码');
    } else {
      if (newPassword.length < 6 || newPassword.length > 50) {
        errors.push('新密码长度应在 6-50 个字符之间');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: errors[0] }
      });
    }

    next();
  }
];

/**
 * 课程参数验证
 */
const validateCourse = [
  (req, res, next) => {
    const { name } = req.body;
    const errors = [];

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push('课程名称不能为空');
    } else if (name.trim().length > 50) {
      errors.push('课程名称不能超过 50 个字符');
    }

    if (req.body.location && req.body.location.length > 100) {
      errors.push('上课地点不能超过 100 个字符');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: errors[0] }
      });
    }

    if (req.body.name) req.body.name = req.body.name.trim();
    if (req.body.location) req.body.location = req.body.location.trim();

    next();
  }
];

/**
 * 公告参数验证
 */
const validateNotice = [
  (req, res, next) => {
    const { title, content } = req.body;
    const errors = [];

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      errors.push('公告标题不能为空');
    } else if (title.trim().length > 100) {
      errors.push('公告标题不能超过 100 个字符');
    }

    if (content && content.length > 5000) {
      errors.push('公告内容不能超过 5000 个字符');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: errors[0] }
      });
    }

    req.body.title = req.body.title.trim();
    if (req.body.content) req.body.content = req.body.content.trim();

    next();
  }
];

/**
 * 认证参数验证
 */
const validateVerify = [
  (req, res, next) => {
    const { schoolName } = req.body;

    if (!schoolName || typeof schoolName !== 'string' || schoolName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: '请输入学校名称' }
      });
    }

    if (schoolName.trim().length > 50) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: '学校名称不能超过 50 个字符' }
      });
    }

    req.body.schoolName = schoolName.trim();
    if (req.body.studentId) req.body.studentId = req.body.studentId.trim();

    next();
  }
];

module.exports = {
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateCourse,
  validateNotice,
  validateVerify
};
