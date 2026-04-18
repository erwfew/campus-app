/**
 * 节次号 → 开始时间映射
 */
const SECTION_TIMES = {
  1: '08:00', 2: '08:50', 3: '09:50', 4: '10:40',
  5: '14:00', 6: '14:50', 7: '15:50', 8: '16:40',
  9: '19:00', 10: '19:50', 11: '20:40', 12: '21:30'
};

/**
 * 节次号 → 结束时间映射
 */
const SECTION_END_TIMES = {
  1: '08:45', 2: '09:35', 3: '10:35', 4: '11:25',
  5: '14:45', 6: '15:35', 7: '16:35', 8: '17:25',
  9: '19:45', 10: '20:35', 11: '21:25', 12: '22:15'
};

/**
 * 节次号 → 开始时间
 */
function sectionToTime(section) {
  return SECTION_TIMES[section] || '';
}

/**
 * 节次号 → 结束时间
 */
function sectionToEndTime(section) {
  return SECTION_END_TIMES[section] || '';
}

/**
 * 解析周数字符串
 * "1-8周" → { startWeek: 1, endWeek: 8 }
 * "1,3,5-8周" → { startWeek: 1, endWeek: 8 } (简化处理)
 * "单1-8周" → { startWeek: 1, endWeek: 8, weekType: 'odd' }
 */
function parseWeeks(weekStr) {
  if (!weekStr) return { startWeek: 1, endWeek: 20 };

  // 匹配 "1-8周" 或 "1～8周"
  const rangeMatch = weekStr.match(/(\d+)[-～—](\d+)\s*周/);
  if (rangeMatch) {
    return {
      startWeek: parseInt(rangeMatch[1]),
      endWeek: parseInt(rangeMatch[2])
    };
  }

  // 匹配单周 "单1-8周"
  const oddMatch = weekStr.match(/单\s*(\d+)[-～—](\d+)\s*周/);
  if (oddMatch) {
    return {
      startWeek: parseInt(oddMatch[1]),
      endWeek: parseInt(oddMatch[2]),
      weekType: 'odd'
    };
  }

  // 匹配双周 "双1-8周"
  const evenMatch = weekStr.match(/双\s*(\d+)[-～—](\d+)\s*周/);
  if (evenMatch) {
    return {
      startWeek: parseInt(evenMatch[1]),
      endWeek: parseInt(evenMatch[2]),
      weekType: 'even'
    };
  }

  // 匹配单周 "第1-8周"
  const diMatch = weekStr.match(/第?\s*(\d+)[-～—](\d+)\s*周/);
  if (diMatch) {
    return {
      startWeek: parseInt(diMatch[1]),
      endWeek: parseInt(diMatch[2])
    };
  }

  // 匹配单个周 "第8周"
  const singleMatch = weekStr.match(/(\d+)\s*周/);
  if (singleMatch) {
    const w = parseInt(singleMatch[1]);
    return { startWeek: w, endWeek: w };
  }

  return { startWeek: 1, endWeek: 20 };
}

/**
 * 根据课程名生成确定性颜色
 */
function generateColor(name) {
  const colors = [
    '#4A90D9', '#E74C3C', '#27AE60', '#F39C12',
    '#8E44AD', '#1ABC9C', '#E67E22', '#3498DB',
    '#E91E63', '#00BCD4', '#FF5722', '#607D8B'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

module.exports = {
  sectionToTime,
  sectionToEndTime,
  parseWeeks,
  generateColor
};
