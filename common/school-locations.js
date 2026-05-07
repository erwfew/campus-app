// school-locations.js
// 校园位置配置 —— 按校区/区域分组
// 坐标来源：高德地图 API + 学校平面图相对位置推算

// ========== 统一缩放：原始数据中的数字代表"校区内部编号"而非真实经纬度，
// 通过 SCALE / CENTER 将其映射到真实世界坐标 ==========
const SCALE = { x: 0.0005, y: 0.0005 }   // 每个编号单位 ≈ 55m

// 每个校区的GPS参考点（已知锚点的中心）
// 1号校区：南门(120.074260,30.253663)=(8,0), 3号教师公寓(120.074935,30.254384)=(11,7)
//          学生公寓(120.075003,30.254150)=(10,5) → 中心约(9,7)
// 2号校区：中心约(120.076538, 30.258425)，对应内部坐标(6,6)
const CAMPUS_GPS = {
  '1号校区': { refLng: 120.0748, refLat: 30.2543, refX: 9, refY: 7 },
  '2号校区': { refLng: 120.076538, refLat: 30.258425, refX: 6, refY: 6 },
}

// 类型名称映射
const TYPE_NAMES = {
  'teaching': '教学楼',
  'lab': '实验楼',
  'library': '图书馆',
  'canteen': '食堂',
  'dormitory': '宿舍',
  'teacher-apt': '教师公寓',
  'playground': '运动场地',
  'sports': '体育馆',
  'shop': '商店',
  'office': '行政楼',
  'activity': '活动中心',
  'hotel': '酒店',
  'school-gate': '校门',
}

// 内部坐标转真实GPS
function xyToGps(campusName, x, y) {
  const gps = CAMPUS_GPS[campusName]
  if (!gps) return { lng: 120.0753, lat: 30.2560 }
  return {
    lng: gps.refLng + (x - gps.refX) * SCALE.x,
    lat: gps.refLat + (y - gps.refY) * SCALE.y,   // y轴：大=北=lat增大
  }
}

const SCHOOLS = {
  '杭州万向职业技术学院': {
    center: { x: 10, y: 8 },
    anchor: { lng: 120.0753, lat: 30.2560 },
    campuses: [
      {
        name: '1号校区',
        bounds: { minLng: 120.0720, maxLng: 120.0770, minLat: 30.2510, maxLat: 30.2565 },
        icon: '🏫',
        color: '#3F51B5',
        points: [
          { name: '1号校区南门', x: 8, y: 0, type: 'school-gate', icon: '🚪' },
          { name: '现代农业实训中心', x: 2, y: 2, type: 'lab', icon: '🌿' },
          { name: '第2教学楼', x: 7, y: 3, type: 'teaching', icon: '🏛️' },
          { name: '第1教学楼', x: 9, y: 3, type: 'teaching', icon: '🏛️' },
          { name: '实验大楼', x: 7, y: 5, type: 'lab', icon: '🔬' },
          { name: '篮球馆', x: 5, y: 5, type: 'sports', icon: '🏀' },
          { name: '田径场', x: 3, y: 6, type: 'playground', icon: '🏃' },
          { name: '篮球场', x: 8, y: 7, type: 'sports', icon: '🏀' },
          { name: '学生食堂（东区）', x: 9, y: 8, type: 'canteen', icon: '🍜' },
          { name: '学生食堂（西区）', x: 7, y: 9, type: 'canteen', icon: '🍜' },
          { name: '超市', x: 8, y: 10, type: 'shop', icon: '🛒' },
          { name: '快递站', x: 10, y: 10, type: 'shop', icon: '📦' },
          { name: '2幢学生公寓', x: 2, y: 12, type: 'dormitory', icon: '🏢' },
          { name: '1幢学生公寓', x: 4, y: 12, type: 'dormitory', icon: '🏢' },
          { name: '4幢学生公寓', x: 2, y: 10, type: 'dormitory', icon: '🏢' },
          { name: '3幢学生公寓', x: 4, y: 10, type: 'dormitory', icon: '🏢' },
          { name: '5幢学生公寓', x: 2, y: 8, type: 'dormitory', icon: '🏢' },
          { name: '6幢学生公寓', x: 4, y: 8, type: 'dormitory', icon: '🏢' },
          { name: '1幢教师公寓', x: 7, y: 12, type: 'teacher-apt', icon: '🏠' },
          { name: '2幢教师公寓', x: 11, y: 12, type: 'teacher-apt', icon: '🏠' },
          { name: '12幢学生宿舍', x: 11, y: 10, type: 'dormitory', icon: '🏢' },
          { name: '11幢学生宿舍', x: 11, y: 9, type: 'dormitory', icon: '🏢' },
          { name: '10幢学生宿舍', x: 11, y: 8, type: 'dormitory', icon: '🏢' },
          { name: '9幢学生宿舍', x: 11, y: 7, type: 'dormitory', icon: '🏢' },
          { name: '7幢学生宿舍', x: 10, y: 6, type: 'dormitory', icon: '🏢' },
          { name: '1区北门', x: 8, y: 14, type: 'school-gate', icon: '🚪' },
        ],
      },
      {
        name: '2号校区',
        bounds: { minLng: 120.0745, maxLng: 120.0790, minLat: 30.2565, maxLat: 30.2605 },
        icon: '🏫',
        color: '#00695C',
        points: [
          { name: '实训中心（9#）', x: 2, y: 12, type: 'lab', icon: '🔧' },
          { name: '实验酒店（纳德润泽园）（8#）', x: 10, y: 12, type: 'hotel', icon: '🏨' },
          { name: '教工食堂', x: 10, y: 10, type: 'canteen', icon: '🍜' },
          { name: '教学楼（7#）', x: 3, y: 8, type: 'teaching', icon: '🏛️' },
          { name: '实训楼（6#）', x: 6, y: 8, type: 'lab', icon: '🔧' },
          { name: '行政办公', x: 6, y: 6, type: 'office', icon: '🏢' },
          { name: '图书馆（5#）', x: 4, y: 6, type: 'library', icon: '📚' },
          { name: '教师办公', x: 7, y: 5, type: 'office', icon: '🏢' },
          { name: '实训楼（4#）', x: 3, y: 3, type: 'lab', icon: '🔧' },
          { name: '实训楼（3#）', x: 6, y: 3, type: 'lab', icon: '🔧' },
          { name: '2#学生公寓', x: 2, y: 1, type: 'dormitory', icon: '🏢' },
          { name: '学生活动中心', x: 6, y: 1, type: 'activity', icon: '🎭' },
          { name: '1#学生公寓', x: 10, y: 1, type: 'dormitory', icon: '🏢' },
          { name: '主入口', x: 12, y: 6, type: 'school-gate', icon: '🚪' },
          { name: '南入口（步行）', x: 6, y: 0, type: 'school-gate', icon: '🚪' },
        ],
      },
    ],
  },
}

// ========== 导出函数（导航页使用）==========

/**
 * 根据学校名称返回 { locations, locationTypes, center }
 * locations: [{ id, name, latitude, longitude, type, typeName, openTime, desc }]
 */
function getSchoolLocations(schoolName) {
  const school = SCHOOLS[schoolName]
  if (!school) return null

  const locations = []
  let id = 1
  for (const campus of school.campuses) {
    for (const pt of campus.points) {
      const gps = xyToGps(campus.name, pt.x, pt.y)
      locations.push({
        id: id++,
        name: pt.name,
        latitude: gps.lat,
        longitude: gps.lng,
        type: pt.type,
        typeName: TYPE_NAMES[pt.type] || pt.type,
        openTime: pt.type === 'dormitory' || pt.type === 'teacher-apt' ? '全天' :
                  pt.type === 'school-gate' ? '全天' :
                  pt.type === 'canteen' ? '6:30 - 20:30' :
                  pt.type === 'library' ? '8:00 - 21:30' :
                  pt.type === 'teaching' ? '7:30 - 21:30' :
                  pt.type === 'lab' ? '8:00 - 21:00' :
                  pt.type === 'office' ? '8:30 - 17:00' :
                  pt.type === 'sports' || pt.type === 'playground' ? '6:00 - 22:00' :
                  '8:00 - 22:00',
        desc: campus.name + ' - ' + pt.name,
      })
    }
  }

  // 提取不重复的类型列表
  const typeSet = new Set(locations.map(l => l.type))
  const locationTypes = [...typeSet].map(t => ({
    name: TYPE_NAMES[t] || t,
    type: t,
  }))

  return {
    locations,
    locationTypes,
    center: school.anchor,
  }
}

/**
 * 返回默认校园数据（未认证时使用）
 */
function getDefaultLocations() {
  // 返回一个通用的默认数据
  return {
    locations: [
      { id: 1, name: '图书馆', latitude: 30.2560, longitude: 120.0753, type: 'library', typeName: '图书馆', openTime: '8:00 - 21:30', desc: '图书馆' },
      { id: 2, name: '食堂', latitude: 30.2555, longitude: 120.0750, type: 'canteen', typeName: '食堂', openTime: '6:30 - 20:30', desc: '食堂' },
      { id: 3, name: '教学楼', latitude: 30.2550, longitude: 120.0745, type: 'teaching', typeName: '教学楼', openTime: '7:30 - 21:30', desc: '教学楼' },
    ],
    locationTypes: [
      { name: '教学楼', type: 'teaching' },
      { name: '图书馆', type: 'library' },
      { name: '食堂', type: 'canteen' },
    ],
    center: { lat: 30.2560, lng: 120.0753 },
  }
}

export { SCALE, SCHOOLS, getSchoolLocations, getDefaultLocations }
