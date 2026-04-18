const zhengfang = require('./systems/zhengfang');
const qingguo = require('./systems/qingguo');
const jinzhi = require('./systems/jinzhi');
const { AppError } = require('../middleware/errorHandler');

const systems = { zhengfang, qingguo, jinzhi };

/**
 * 解析课程数据
 * @param {string} systemType - 系统类型: zhengfang | qingguo | jinzhi
 * @param {axios.AxiosInstance} client - 已登录的 HTTP 客户端
 * @param {string} school - 学校名称
 * @param {string} semester - 学期，如 "2025-1"
 * @returns {Promise<Array>} 课程列表
 */
async function parseCourses(systemType, client, school, semester) {
  const system = systems[systemType];
  if (!system) {
    throw new AppError('UNSUPPORTED_SYSTEM', `不支持的教务系统类型: ${systemType}`, 400);
  }
  return system.parseCourses(client, school, semester);
}

module.exports = { parseCourses };
