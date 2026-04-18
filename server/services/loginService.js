const zhengfang = require('./systems/zhengfang');
const qingguo = require('./systems/qingguo');
const jinzhi = require('./systems/jinzhi');
const { AppError } = require('../middleware/errorHandler');

const systems = { zhengfang, qingguo, jinzhi };

/**
 * 登录教务系统
 * @param {string} systemType - 系统类型: zhengfang | qingguo | jinzhi
 * @param {string} school - 学校名称
 * @param {string} username - 用户名/学号
 * @param {string} password - 密码
 * @returns {Promise<axios.AxiosInstance>} 带 session 的 HTTP 客户端
 */
async function login(systemType, eduUrl, username, password) {
  const system = systems[systemType];
  if (!system) {
    throw new AppError('UNSUPPORTED_SYSTEM', `不支持的教务系统类型: ${systemType}`, 400);
  }
  return system.login(eduUrl, username, password);
}

module.exports = { login };
