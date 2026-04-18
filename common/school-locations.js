/**
 * 学校校园建筑坐标数据库
 * key: 学校名称（需与学信网认证返回的名称匹配）
 * value: { center, locations, locationTypes }
 *
 * 说明：
 * - center: 校园中心坐标（用于地图初始定位）
 * - locations: 校园建筑列表
 * - locationTypes: 快速定位分类标签
 *
 * 注意：坐标为模拟数据，实际使用时需替换为真实坐标
 * 可通过腾讯地图拾取坐标：https://lbs.qq.com/get/demo.html
 */

// 通用建筑分类标签（供未认证学校或导航页使用）
const COMMON_LOCATION_TYPES = [
	{ name: '教学楼', type: 'teach' },
	{ name: '图书馆', type: 'library' },
	{ name: '食堂', type: 'food' },
	{ name: '宿舍', type: 'dorm' },
	{ name: '操场', type: 'playground' },
	{ name: '体育馆', type: 'gym' },
	{ name: '实验楼', type: 'lab' },
	{ name: '行政楼', type: 'admin' },
	{ name: '活动中心', type: 'activity' }
]

const schoolLocationsDB = {
	'浙江大学': {
		center: { lat: 30.2590, lng: 120.1290 },
		locations: [
			{ id: 1, name: '紫金港校区东教学楼', latitude: 30.2605, longitude: 120.1270, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '计算机学院、信息学院' },
			{ id: 2, name: '紫金港校区西教学楼', latitude: 30.2595, longitude: 120.1260, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '理学院、工学部' },
			{ id: 3, name: '基础交叉学科楼', latitude: 30.2610, longitude: 120.1280, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '前沿交叉学科研究院' },
			{ id: 4, name: '浙江大学图书馆', latitude: 30.2585, longitude: 120.1290, type: 'library', typeName: '图书馆', openTime: '8:00 - 22:30', desc: '藏书800万册，设有研讨间' },
			{ id: 5, name: '银泉餐厅', latitude: 30.2570, longitude: 120.1275, type: 'food', typeName: '食堂', openTime: '6:30 - 21:00', desc: '风味餐厅，各地特色小吃' },
			{ id: 6, name: '大食堂', latitude: 30.2575, longitude: 120.1265, type: 'food', typeName: '食堂', openTime: '6:30 - 21:00', desc: '大众菜、清真窗口' },
			{ id: 7, name: '蓝田学园', latitude: 30.2620, longitude: 120.1260, type: 'dorm', typeName: '宿舍', openTime: '全天', desc: '本科生宿舍区' },
			{ id: 8, name: '丹青学园', latitude: 30.2625, longitude: 120.1275, type: 'dorm', typeName: '宿舍', openTime: '全天', desc: '本科生宿舍区' },
			{ id: 9, name: '紫云学园', latitude: 30.2615, longitude: 120.1250, type: 'dorm', typeName: '宿舍', openTime: '全天', desc: '研究生宿舍区' },
			{ id: 10, name: '东田径场', latitude: 30.2555, longitude: 120.1310, type: 'playground', typeName: '运动场地', openTime: '6:00 - 22:00', desc: '400米标准跑道' },
			{ id: 11, name: '风雨操场', latitude: 30.2545, longitude: 120.1300, type: 'gym', typeName: '体育馆', openTime: '7:00 - 22:00', desc: '篮球场、羽毛球馆、游泳馆' },
			{ id: 12, name: '纳米楼', latitude: 30.2560, longitude: 120.1295, type: 'lab', typeName: '实验楼', openTime: '8:00 - 22:00', desc: '材料科学、纳米技术实验室' },
			{ id: 13, name: '行政服务大厅', latitude: 30.2580, longitude: 120.1280, type: 'admin', typeName: '行政楼', openTime: '8:30 - 17:30', desc: '教务处、学生处、财务处' },
			{ id: 14, name: '学生活动中心', latitude: 30.2565, longitude: 120.1285, type: 'activity', typeName: '活动中心', openTime: '8:00 - 22:00', desc: '社团活动、文艺演出、报告厅' }
		],
		locationTypes: [
			{ name: '教学楼', type: 'teach' },
			{ name: '图书馆', type: 'library' },
			{ name: '食堂', type: 'food' },
			{ name: '宿舍', type: 'dorm' },
			{ name: '操场', type: 'playground' },
			{ name: '体育馆', type: 'gym' },
			{ name: '实验楼', type: 'lab' },
			{ name: '活动中心', type: 'activity' }
		]
	},

	'清华大学': {
		center: { lat: 40.0000, lng: 116.3265 },
		locations: [
			{ id: 1, name: '第六教学楼', latitude: 40.0020, longitude: 116.3280, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '计算机系、电子系' },
			{ id: 2, name: '第三教学楼', latitude: 40.0010, longitude: 116.3270, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '理学院、数学系' },
			{ id: 3, name: '逸夫馆', latitude: 40.0005, longitude: 116.3290, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '人文社科学院' },
			{ id: 4, name: '清华大学图书馆', latitude: 39.9995, longitude: 116.3275, type: 'library', typeName: '图书馆', openTime: '8:00 - 22:00', desc: '藏书600万册，设有研讨间' },
			{ id: 5, name: '紫荆园餐厅', latitude: 39.9980, longitude: 116.3260, type: 'food', typeName: '食堂', openTime: '6:30 - 21:00', desc: '各地风味，自助餐' },
			{ id: 6, name: '听涛园餐厅', latitude: 39.9985, longitude: 116.3250, type: 'food', typeName: '食堂', openTime: '6:30 - 21:00', desc: '大众菜、清真窗口' },
			{ id: 7, name: '紫荆公寓', latitude: 40.0030, longitude: 116.3250, type: 'dorm', typeName: '宿舍', openTime: '全天', desc: '本科生宿舍区' },
			{ id: 8, name: '老楼宿舍区', latitude: 40.0025, longitude: 116.3265, type: 'dorm', typeName: '宿舍', openTime: '全天', desc: '研究生宿舍区' },
			{ id: 9, name: '西操场', latitude: 39.9970, longitude: 116.3280, type: 'playground', typeName: '运动场地', openTime: '6:00 - 22:00', desc: '400米标准跑道、足球场' },
			{ id: 10, name: '综合体育馆', latitude: 39.9960, longitude: 116.3270, type: 'gym', typeName: '体育馆', openTime: '7:00 - 22:00', desc: '篮球场、游泳馆、健身房' },
			{ id: 11, name: '理科楼群', latitude: 39.9990, longitude: 116.3295, type: 'lab', typeName: '实验楼', openTime: '8:00 - 22:00', desc: '物理、化学、生物实验室' },
			{ id: 12, name: '主楼', latitude: 40.0000, longitude: 116.3265, type: 'admin', typeName: '行政楼', openTime: '8:30 - 17:30', desc: '校办、教务处' },
			{ id: 13, name: '学生服务中心', latitude: 39.9995, longitude: 116.3255, type: 'activity', typeName: '活动中心', openTime: '8:00 - 22:00', desc: '社团活动、文艺演出' }
		],
		locationTypes: [
			{ name: '教学楼', type: 'teach' },
			{ name: '图书馆', type: 'library' },
			{ name: '食堂', type: 'food' },
			{ name: '宿舍', type: 'dorm' },
			{ name: '操场', type: 'playground' },
			{ name: '体育馆', type: 'gym' },
			{ name: '实验楼', type: 'lab' }
		]
	},

	'北京大学': {
		center: { lat: 39.9929, lng: 116.3069 },
		locations: [
			{ id: 1, name: '理科教学楼', latitude: 39.9935, longitude: 116.3080, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '数学院、物理学院' },
			{ id: 2, name: '文史楼', latitude: 39.9940, longitude: 116.3070, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '中文系、历史系' },
			{ id: 3, name: '第二教学楼', latitude: 39.9930, longitude: 116.3090, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '经管学院、法学院' },
			{ id: 4, name: '北京大学图书馆', latitude: 39.9925, longitude: 116.3075, type: 'library', typeName: '图书馆', openTime: '8:00 - 22:00', desc: '亚洲最大高校图书馆之一' },
			{ id: 5, name: '农园食堂', latitude: 39.9910, longitude: 116.3060, type: 'food', typeName: '食堂', openTime: '6:30 - 21:00', desc: '自助餐、各地小吃' },
			{ id: 6, name: '学五食堂', latitude: 39.9915, longitude: 116.3055, type: 'food', typeName: '食堂', openTime: '6:30 - 21:00', desc: '大众菜、经济实惠' },
			{ id: 7, name: '畅春园宿舍', latitude: 39.9945, longitude: 116.3050, type: 'dorm', typeName: '宿舍', openTime: '全天', desc: '研究生宿舍区' },
			{ id: 8, name: '万柳公寓', latitude: 39.9950, longitude: 116.3060, type: 'dorm', typeName: '宿舍', openTime: '全天', desc: '留学生公寓' },
			{ id: 9, name: '五四操场', latitude: 39.9900, longitude: 116.3080, type: 'playground', typeName: '运动场地', openTime: '6:00 - 22:00', desc: '400米跑道、足球场' },
			{ id: 10, name: '五四体育馆', latitude: 39.9895, longitude: 116.3070, type: 'gym', typeName: '体育馆', openTime: '7:00 - 22:00', desc: '篮球、排球、游泳' },
			{ id: 11, name: '化学楼', latitude: 39.9920, longitude: 116.3095, type: 'lab', typeName: '实验楼', openTime: '8:00 - 22:00', desc: '化学、材料实验室' },
			{ id: 12, name: '百周年纪念讲堂', latitude: 39.9930, longitude: 116.3065, type: 'activity', typeName: '活动中心', openTime: '8:00 - 22:00', desc: '文艺演出、学术报告' }
		],
		locationTypes: [
			{ name: '教学楼', type: 'teach' },
			{ name: '图书馆', type: 'library' },
			{ name: '食堂', type: 'food' },
			{ name: '宿舍', type: 'dorm' },
			{ name: '操场', type: 'playground' },
			{ name: '体育馆', type: 'gym' }
		]
	},

	'复旦大学': {
		center: { lat: 31.2990, lng: 121.5000 },
		locations: [
			{ id: 1, name: '光华楼', latitude: 31.2995, longitude: 121.5010, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '文科教学楼群' },
			{ id: 2, name: '第三教学楼', latitude: 31.2985, longitude: 121.5005, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '理科教学楼' },
			{ id: 3, name: '第四教学楼', latitude: 31.2980, longitude: 121.4995, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '通识教育课程' },
			{ id: 4, name: '复旦大学图书馆', latitude: 31.2990, longitude: 121.5000, type: 'library', typeName: '图书馆', openTime: '8:00 - 22:00', desc: '文科馆、理科馆、医科馆' },
			{ id: 5, name: '南区食堂', latitude: 31.2970, longitude: 121.4990, type: 'food', typeName: '食堂', openTime: '6:30 - 21:00', desc: '各地风味小吃' },
			{ id: 6, name: '北区食堂', latitude: 31.3005, longitude: 121.5005, type: 'food', typeName: '食堂', openTime: '6:30 - 21:00', desc: '大众菜、清真窗口' },
			{ id: 7, name: '南区学生公寓', latitude: 31.2965, longitude: 121.4995, type: 'dorm', typeName: '宿舍', openTime: '全天', desc: '本科生宿舍区' },
			{ id: 8, name: '北区学生公寓', latitude: 31.3010, longitude: 121.5010, type: 'dorm', typeName: '宿舍', openTime: '全天', desc: '研究生宿舍区' },
			{ id: 9, name: '南区运动场', latitude: 31.2960, longitude: 121.5010, type: 'playground', typeName: '运动场地', openTime: '6:00 - 22:00', desc: '400米跑道' },
			{ id: 10, name: '正大体育馆', latitude: 31.2955, longitude: 121.5000, type: 'gym', typeName: '体育馆', openTime: '7:00 - 22:00', desc: '篮球场、游泳馆' },
			{ id: 11, name: '实验中心', latitude: 31.2975, longitude: 121.5015, type: 'lab', typeName: '实验楼', openTime: '8:00 - 22:00', desc: '物理、化学、生物实验中心' },
			{ id: 12, name: '相辉堂', latitude: 31.2985, longitude: 121.4990, type: 'activity', typeName: '活动中心', openTime: '8:00 - 22:00', desc: '校史馆、学术报告厅' }
		],
		locationTypes: [
			{ name: '教学楼', type: 'teach' },
			{ name: '图书馆', type: 'library' },
			{ name: '食堂', type: 'food' },
			{ name: '宿舍', type: 'dorm' },
			{ name: '操场', type: 'playground' },
			{ name: '体育馆', type: 'gym' }
		]
	},

	'上海交通大学': {
		center: { lat: 31.0250, lng: 121.4380 },
		locations: [
			{ id: 1, name: '东上院', latitude: 31.0260, longitude: 121.4390, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '电院、机动学院' },
			{ id: 2, name: '东中院', latitude: 31.0255, longitude: 121.4385, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '船建学院、材料学院' },
			{ id: 3, name: '东下院', latitude: 31.0250, longitude: 121.4395, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '安泰经管学院' },
			{ id: 4, name: '包玉刚图书馆', latitude: 31.0245, longitude: 121.4380, type: 'library', typeName: '图书馆', openTime: '8:00 - 22:00', desc: '藏书400万册' },
			{ id: 5, name: '第一餐饮大楼', latitude: 31.0230, longitude: 121.4370, type: 'food', typeName: '食堂', openTime: '6:30 - 21:00', desc: '各地风味' },
			{ id: 6, name: '第二餐饮大楼', latitude: 31.0235, longitude: 121.4365, type: 'food', typeName: '食堂', openTime: '6:30 - 21:00', desc: '清真餐厅、西式快餐' },
			{ id: 7, name: '东区宿舍', latitude: 31.0270, longitude: 121.4370, type: 'dorm', typeName: '宿舍', openTime: '全天', desc: '本科生宿舍区' },
			{ id: 8, name: '研究生公寓', latitude: 31.0275, longitude: 121.4385, type: 'dorm', typeName: '宿舍', openTime: '全天', desc: '研究生宿舍区' },
			{ id: 9, name: '光彪操场', latitude: 31.0220, longitude: 121.4390, type: 'playground', typeName: '运动场地', openTime: '6:00 - 22:00', desc: '400米跑道、足球场' },
			{ id: 10, name: '霍英东体育中心', latitude: 31.0215, longitude: 121.4380, type: 'gym', typeName: '体育馆', openTime: '7:00 - 22:00', desc: '篮球场、游泳馆、健身房' },
			{ id: 11, name: '化学化工楼', latitude: 31.0240, longitude: 121.4400, type: 'lab', typeName: '实验楼', openTime: '8:00 - 22:00', desc: '化学、化工实验室' },
			{ id: 12, name: '新行政楼', latitude: 31.0250, longitude: 121.4370, type: 'admin', typeName: '行政楼', openTime: '8:30 - 17:30', desc: '校办、教务处、学生处' }
		],
		locationTypes: [
			{ name: '教学楼', type: 'teach' },
			{ name: '图书馆', type: 'library' },
			{ name: '食堂', type: 'food' },
			{ name: '宿舍', type: 'dorm' },
			{ name: '操场', type: 'playground' },
			{ name: '体育馆', type: 'gym' }
		]
	},

	'南京大学': {
		center: { lat: 32.0550, lng: 118.7790 },
		locations: [
			{ id: 1, name: '教学楼甲', latitude: 32.0560, longitude: 118.7800, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '文学院、历史学院' },
			{ id: 2, name: '教学楼乙', latitude: 32.0555, longitude: 118.7795, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '物理学院、化学化工学院' },
			{ id: 3, name: '教学楼丙', latitude: 32.0550, longitude: 118.7805, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '计算机系、电子科学学院' },
			{ id: 4, name: '杜厦图书馆', latitude: 32.0545, longitude: 118.7790, type: 'library', typeName: '图书馆', openTime: '8:00 - 22:00', desc: '仙林校区主图书馆' },
			{ id: 5, name: '四食堂', latitude: 32.0530, longitude: 118.7780, type: 'food', typeName: '食堂', openTime: '6:30 - 21:00', desc: '各地风味小吃' },
			{ id: 6, name: '五食堂', latitude: 32.0535, longitude: 118.7775, type: 'food', typeName: '食堂', openTime: '6:30 - 21:00', desc: '大众菜、清真窗口' },
			{ id: 7, name: '仙林校区宿舍区', latitude: 32.0570, longitude: 118.7780, type: 'dorm', typeName: '宿舍', openTime: '全天', desc: '本科生宿舍区' },
			{ id: 8, name: '研究生公寓', latitude: 32.0575, longitude: 118.7795, type: 'dorm', typeName: '宿舍', openTime: '全天', desc: '研究生宿舍区' },
			{ id: 9, name: '仙林体育场', latitude: 32.0520, longitude: 118.7800, type: 'playground', typeName: '运动场地', openTime: '6:00 - 22:00', desc: '400米跑道、足球场' },
			{ id: 10, name: '体育馆', latitude: 32.0515, longitude: 118.7790, type: 'gym', typeName: '体育馆', openTime: '7:00 - 22:00', desc: '篮球场、游泳馆' },
			{ id: 11, name: '实验楼群', latitude: 32.0540, longitude: 118.7810, type: 'lab', typeName: '实验楼', openTime: '8:00 - 22:00', desc: '物理、化学、生物实验室' },
			{ id: 12, name: '行政南楼', latitude: 32.0550, longitude: 118.7775, type: 'admin', typeName: '行政楼', openTime: '8:30 - 17:30', desc: '校办、教务处' }
		],
		locationTypes: [
			{ name: '教学楼', type: 'teach' },
			{ name: '图书馆', type: 'library' },
			{ name: '食堂', type: 'food' },
			{ name: '宿舍', type: 'dorm' },
			{ name: '操场', type: 'playground' },
			{ name: '体育馆', type: 'gym' }
		]
	},

	'武汉大学': {
		center: { lat: 30.5430, lng: 114.3570 },
		locations: [
			{ id: 1, name: '教一楼', latitude: 30.5440, longitude: 114.3580, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '文学院、历史学院' },
			{ id: 2, name: '教二楼', latitude: 30.5435, longitude: 114.3575, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '计算机学院、遥感学院' },
			{ id: 3, name: '教三楼', latitude: 30.5430, longitude: 114.3585, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '经管学院、法学院' },
			{ id: 4, name: '武汉大学图书馆', latitude: 30.5425, longitude: 114.3570, type: 'library', typeName: '图书馆', openTime: '8:00 - 22:00', desc: '总馆、工学分馆、信息分馆' },
			{ id: 5, name: '梅园食堂', latitude: 30.5410, longitude: 114.3560, type: 'food', typeName: '食堂', openTime: '6:30 - 21:00', desc: '各地风味' },
			{ id: 6, name: '桂园食堂', latitude: 30.5415, longitude: 114.3555, type: 'food', typeName: '食堂', openTime: '6:30 - 21:00', desc: '大众菜、特色小吃' },
			{ id: 7, name: '梅园宿舍', latitude: 30.5450, longitude: 114.3560, type: 'dorm', typeName: '宿舍', openTime: '全天', desc: '本科生宿舍区' },
			{ id: 8, name: '湖滨宿舍', latitude: 30.5455, longitude: 114.3575, type: 'dorm', typeName: '宿舍', openTime: '全天', desc: '研究生宿舍区' },
			{ id: 9, name: '梅园操场', latitude: 30.5400, longitude: 114.3580, type: 'playground', typeName: '运动场地', openTime: '6:00 - 22:00', desc: '400米跑道、足球场' },
			{ id: 10, name: '卓尔体育馆', latitude: 30.5395, longitude: 114.3570, type: 'gym', typeName: '体育馆', openTime: '7:00 - 22:00', desc: '篮球场、游泳馆' },
			{ id: 11, name: '工学部实验楼', latitude: 30.5420, longitude: 114.3590, type: 'lab', typeName: '实验楼', openTime: '8:00 - 22:00', desc: '计算机、电子、遥感实验室' },
			{ id: 12, name: '行政楼', latitude: 30.5430, longitude: 114.3555, type: 'admin', typeName: '行政楼', openTime: '8:30 - 17:30', desc: '校办、教务处、学生处' }
		],
		locationTypes: [
			{ name: '教学楼', type: 'teach' },
			{ name: '图书馆', type: 'library' },
			{ name: '食堂', type: 'food' },
			{ name: '宿舍', type: 'dorm' },
			{ name: '操场', type: 'playground' },
			{ name: '体育馆', type: 'gym' }
		]
	},

	'华中科技大学': {
		center: { lat: 30.5130, lng: 114.4130 },
		locations: [
			{ id: 1, name: '西九教学楼', latitude: 30.5140, longitude: 114.4140, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '机械学院、材料学院' },
			{ id: 2, name: '东九教学楼', latitude: 30.5135, longitude: 114.4135, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '电信学院、计算机学院' },
			{ id: 3, name: '南三楼', latitude: 30.5130, longitude: 114.4145, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '电气学院、能源学院' },
			{ id: 4, name: '图书馆', latitude: 30.5125, longitude: 114.4130, type: 'library', typeName: '图书馆', openTime: '8:00 - 22:00', desc: '主馆、东区分馆' },
			{ id: 5, name: '西一食堂', latitude: 30.5110, longitude: 114.4120, type: 'food', typeName: '食堂', openTime: '6:30 - 21:00', desc: '各地风味小吃' },
			{ id: 6, name: '东三食堂', latitude: 30.5115, longitude: 114.4115, type: 'food', typeName: '食堂', openTime: '6:30 - 21:00', desc: '大众菜、清真窗口' },
			{ id: 7, name: '西区学生公寓', latitude: 30.5150, longitude: 114.4120, type: 'dorm', typeName: '宿舍', openTime: '全天', desc: '本科生宿舍区' },
			{ id: 8, name: '东区学生公寓', latitude: 30.5155, longitude: 114.4140, type: 'dorm', typeName: '宿舍', openTime: '全天', desc: '研究生宿舍区' },
			{ id: 9, name: '西操场', latitude: 30.5100, longitude: 114.4140, type: 'playground', typeName: '运动场地', openTime: '6:00 - 22:00', desc: '400米跑道、足球场' },
			{ id: 10, name: '光谷体育馆', latitude: 30.5095, longitude: 114.4130, type: 'gym', typeName: '体育馆', openTime: '7:00 - 22:00', desc: '篮球场、游泳馆、健身房' },
			{ id: 11, name: '国家光电实验室', latitude: 30.5120, longitude: 114.4150, type: 'lab', typeName: '实验楼', openTime: '8:00 - 22:00', desc: '光电、物理实验室' },
			{ id: 12, name: '南大门行政楼', latitude: 30.5130, longitude: 114.4115, type: 'admin', typeName: '行政楼', openTime: '8:30 - 17:30', desc: '校办、教务处' }
		],
		locationTypes: [
			{ name: '教学楼', type: 'teach' },
			{ name: '图书馆', type: 'library' },
			{ name: '食堂', type: 'food' },
			{ name: '宿舍', type: 'dorm' },
			{ name: '操场', type: 'playground' },
			{ name: '体育馆', type: 'gym' }
		]
	},

	'杭州万向职业技术学院': {
		center: { lat: 30.2950, lng: 120.0580 },
		locations: [
			{ id: 1, name: '1号教学楼', latitude: 30.2955, longitude: 120.0590, type: 'teach', typeName: '教学楼', openTime: '7:30 - 21:30', desc: '机电工程系、汽车技术系' },
			{ id: 2, name: '2号教学楼', latitude: 30.2948, longitude: 120.0575, type: 'teach', typeName: '教学楼', openTime: '7:30 - 21:30', desc: '经济管理系、护理康复系' },
			{ id: 3, name: '3号实训楼', latitude: 30.2942, longitude: 120.0595, type: 'teach', typeName: '教学楼', openTime: '8:00 - 21:00', desc: '实训教学中心' },
			{ id: 4, name: '图书馆', latitude: 30.2950, longitude: 120.0580, type: 'library', typeName: '图书馆', openTime: '8:00 - 21:30', desc: '纸质藏书30万册，电子阅览室' },
			{ id: 5, name: '第一食堂', latitude: 30.2935, longitude: 120.0570, type: 'food', typeName: '食堂', openTime: '6:30 - 20:30', desc: '大众餐、特色窗口' },
			{ id: 6, name: '第二食堂', latitude: 30.2960, longitude: 120.0565, type: 'food', typeName: '食堂', openTime: '6:30 - 20:30', desc: '风味小吃、清真窗口' },
			{ id: 7, name: '学生公寓A区', latitude: 30.2965, longitude: 120.0560, type: 'dorm', typeName: '宿舍', openTime: '全天', desc: '男生宿舍区' },
			{ id: 8, name: '学生公寓B区', latitude: 30.2968, longitude: 120.0575, type: 'dorm', typeName: '宿舍', openTime: '全天', desc: '女生宿舍区' },
			{ id: 9, name: '田径运动场', latitude: 30.2930, longitude: 120.0590, type: 'playground', typeName: '运动场地', openTime: '6:00 - 22:00', desc: '400米标准跑道、足球场' },
			{ id: 10, name: '体育馆', latitude: 30.2925, longitude: 120.0580, type: 'gym', typeName: '体育馆', openTime: '7:00 - 22:00', desc: '篮球场、羽毛球场、乒乓球室' },
			{ id: 11, name: '实训中心', latitude: 30.2945, longitude: 120.0600, type: 'lab', typeName: '实验楼', openTime: '8:00 - 21:00', desc: '汽车维修、数控加工、护理实训' },
			{ id: 12, name: '行政楼', latitude: 30.2952, longitude: 120.0570, type: 'admin', typeName: '行政楼', openTime: '8:30 - 17:00', desc: '校办、教务处、学生处' },
			{ id: 13, name: '学生活动中心', latitude: 30.2938, longitude: 120.0585, type: 'activity', typeName: '活动中心', openTime: '8:00 - 22:00', desc: '社团活动、多功能报告厅' }
		],
		locationTypes: [
			{ name: '教学楼', type: 'teach' },
			{ name: '图书馆', type: 'library' },
			{ name: '食堂', type: 'food' },
			{ name: '宿舍', type: 'dorm' },
			{ name: '操场', type: 'playground' },
			{ name: '体育馆', type: 'gym' },
			{ name: '实训中心', type: 'lab' }
		]
	}
}

/**
 * 根据学校名称获取校园建筑数据
 * @param {string} schoolName - 学校名称
 * @returns {object|null} 校园数据或null
 */
function getSchoolLocations(schoolName) {
	if (!schoolName) return null
	// 精确匹配
	if (schoolLocationsDB[schoolName]) {
		return schoolLocationsDB[schoolName]
	}
	// 模糊匹配：包含关键词
	for (const key of Object.keys(schoolLocationsDB)) {
		if (schoolName.includes(key) || key.includes(schoolName)) {
			return schoolLocationsDB[key]
		}
	}
	return null
}

/**
 * 获取默认校园数据（未认证或未找到学校时使用）
 * @returns {object}
 */
function getDefaultLocations() {
	return {
		center: { lat: 30.2570, lng: 120.1290 },
		locations: [
			{ id: 1, name: '教学楼A', latitude: 30.2580, longitude: 120.1280, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '计算机学院、数学学院所在地' },
			{ id: 2, name: '教学楼B', latitude: 30.2590, longitude: 120.1300, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '外语学院、经管学院所在地' },
			{ id: 3, name: '教学楼C', latitude: 30.2565, longitude: 120.1310, type: 'teach', typeName: '教学楼', openTime: '7:00 - 22:00', desc: '文学院、法学院所在地' },
			{ id: 4, name: '图书馆', latitude: 30.2570, longitude: 120.1290, type: 'library', typeName: '图书馆', openTime: '8:00 - 22:00', desc: '藏书120万册，自习室24小时开放' },
			{ id: 5, name: '第一食堂', latitude: 30.2560, longitude: 120.1270, type: 'food', typeName: '食堂', openTime: '6:30 - 21:00', desc: '一楼大众餐，二楼特色小吃' },
			{ id: 6, name: '第二食堂', latitude: 30.2585, longitude: 120.1265, type: 'food', typeName: '食堂', openTime: '6:30 - 21:00', desc: '清真窗口、西式快餐' },
			{ id: 7, name: '宿舍A栋', latitude: 30.2600, longitude: 120.1260, type: 'dorm', typeName: '宿舍', openTime: '全天', desc: '男生宿舍' },
			{ id: 8, name: '宿舍B栋', latitude: 30.2605, longitude: 120.1275, type: 'dorm', typeName: '宿舍', openTime: '全天', desc: '女生宿舍' },
			{ id: 9, name: '宿舍C栋', latitude: 30.2602, longitude: 120.1250, type: 'dorm', typeName: '宿舍', openTime: '全天', desc: '研究生宿舍' },
			{ id: 10, name: '操场', latitude: 30.2550, longitude: 120.1310, type: 'playground', typeName: '运动场地', openTime: '6:00 - 22:00', desc: '400米标准跑道，足球场' },
			{ id: 11, name: '体育馆', latitude: 30.2540, longitude: 120.1300, type: 'gym', typeName: '体育馆', openTime: '7:00 - 22:00', desc: '篮球场、羽毛球场、游泳馆' },
			{ id: 12, name: '实验楼', latitude: 30.2555, longitude: 120.1295, type: 'lab', typeName: '实验楼', openTime: '8:00 - 21:00', desc: '物理、化学、生物实验室' },
			{ id: 13, name: '行政楼', latitude: 30.2575, longitude: 120.1270, type: 'admin', typeName: '行政楼', openTime: '8:30 - 17:30', desc: '教务处、学生处、财务处' },
			{ id: 14, name: '大学生活动中心', latitude: 30.2558, longitude: 120.1285, type: 'activity', typeName: '活动中心', openTime: '8:00 - 22:00', desc: '社团活动、文艺演出' }
		],
		locationTypes: [
			{ name: '教学楼', type: 'teach' },
			{ name: '图书馆', type: 'library' },
			{ name: '食堂', type: 'food' },
			{ name: '宿舍', type: 'dorm' },
			{ name: '操场', type: 'playground' },
			{ name: '体育馆', type: 'gym' }
		]
	}
}

export { getSchoolLocations, getDefaultLocations }
