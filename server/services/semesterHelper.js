/**
 * 学期格式转换工具
 *
 * 前端传入格式: "2025-1" 表示 2024-2025 学年第一学期
 * 各教务系统需要不同的学期格式
 */

/**
 * 转换为正方系统学期格式
 * "2025-1" → "2024-2025-1"
 * "2025-2" → "2024-2025-2"
 */
function toZhengfangSemester(semester) {
  const parts = semester.split('-');
  if (parts.length !== 2) return semester;
  const year = parseInt(parts[0]);
  const term = parts[1];
  return `${year - 1}-${year}-${term}`;
}

/**
 * 转换为青果系统学期格式
 * "2025-1" → "202420251" 或保持原样
 */
function toQingguoSemester(semester) {
  const parts = semester.split('-');
  if (parts.length !== 2) return semester;
  const year = parseInt(parts[0]);
  const term = parts[1];
  return `${year - 1}${year}${term}`;
}

/**
 * 转换为金智系统学期格式
 * "2025-1" → "202420251"
 */
function toJinzhiSemester(semester) {
  const parts = semester.split('-');
  if (parts.length !== 2) return semester;
  const year = parseInt(parts[0]);
  const term = parts[1];
  return `${year - 1}${year}${term}`;
}

/**
 * 根据系统类型转换学期格式
 */
function convertSemester(systemType, semester) {
  switch (systemType) {
    case 'zhengfang':
      return toZhengfangSemester(semester);
    case 'qingguo':
      return toQingguoSemester(semester);
    case 'jinzhi':
      return toJinzhiSemester(semester);
    default:
      return semester;
  }
}

module.exports = {
  toZhengfangSemester,
  toQingguoSemester,
  toJinzhiSemester,
  convertSemester
};
