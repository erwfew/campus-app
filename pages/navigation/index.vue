<template>
	<view class="nav-page">
		<!-- 地图区域 -->
		<view class="map-wrapper">
			<!-- 状态栏占位 -->
			<cover-view class="nav-status-bar"></cover-view>
			<map
				class="campus-map"
				:class="{ 'nav-map': isNavigating }"
				:style="{ width: mapWidth + 'px', height: mapHeight + 'px' }"
				:latitude="centerLat"
				:longitude="centerLng"
				:scale="mapScale"
				:rotate="mapRotate"
				:skew="mapSkew"
				:markers="markers"
				:polyline="polyline"
				:show-location="true"
				@markertap="onMarkerTap"
				@regionchange="onRegionChange"
				id="campusMap"
				ref="mapCtx"
			></map>

			<!-- 定位按钮 -->
			<cover-view class="map-btn my-location" @tap="moveToMyLocation" v-if="!isNavigating">
				<cover-view class="btn-icon">📍</cover-view>
			</cover-view>

			<!-- 导航时的指南针按钮 -->
			<cover-view class="map-btn compass-btn" @tap="resetNavHeading" v-if="isNavigating">
				<cover-view class="btn-icon">⬆</cover-view>
			</cover-view>

			<!-- 导航时回到自己位置按钮 -->
			<cover-view class="map-btn nav-locate-btn" @tap="moveToMyLocation" v-if="isNavigating">
				<cover-view class="btn-icon">📍</cover-view>
			</cover-view>

			<!-- 定位状态提示 -->
			<view class="location-toast" v-if="locationLoading">
				<text>正在获取位置...</text>
			</view>
		</view>

		<!-- 导航状态栏 -->
		<view class="nav-bar" v-if="isNavigating">
			<view class="nav-bar-left">
				<text class="nav-bar-dest">前往 {{ endPointName }}</text>
				<text class="nav-bar-distance">
					剩余约 {{ routeDistance }} 米 · 约 {{ routeTime }} 分钟
				</text>
			</view>
			<view class="nav-bar-actions">
				<view class="nav-bar-voice" @tap="toggleVoice">
					<text>{{ voiceEnabled ? '🔊' : '🔇' }}</text>
				</view>
				<view class="nav-bar-stop" @tap="stopNavigation">
					<text>结束导航</text>
				</view>
			</view>
		</view>

		<!-- 导航底部指引面板 -->
		<view class="nav-bottom" v-if="isNavigating">
			<view class="nav-direction">
				<text class="nav-dir-icon">{{ navDirIcon }}</text>
				<text class="nav-dir-text">{{ navDirText }}</text>
			</view>
			<!-- 有路段信息时显示下一转弯提示 -->
			<view class="nav-next-info" v-if="routeSteps.length > 0 && _nextAction">
				<text class="nav-next-label">前方约{{ Math.round(_distToTurn) }}米{{ _nextAction }}</text>
				<text class="nav-next-detail" v-if="_nextInstruction">{{ _nextInstruction }}</text>
			</view>
			<view class="nav-next-info" v-else-if="directionHint">
				<text class="nav-next-label">朝{{ directionHint }}方向</text>
				<text class="nav-next-detail">前往 {{ endPointName }}</text>
			</view>
		</view>

		<!-- 快速定位 -->
		<view class="card" v-if="!isNavigating">
			<view class="card-header">
				<text class="card-title">快速定位</text>
				<text class="school-label" v-if="verifiedSchoolName">{{ verifiedSchoolName }}</text>
			</view>
			<view class="location-tags">
				<text
					class="loc-tag"
					v-for="(item, index) in locationTypes"
					:key="index"
					@tap="quickLocate(item)"
				>{{ item.name }}</text>
			</view>
		</view>

		<!-- 路线规划 -->
		<view class="card" v-if="!isNavigating">
			<text class="card-title">路线规划</text>
			<view class="route-modes">
				<text
					class="route-mode"
					:class="{ active: travelMode === 'walk' }"
					@tap="switchMode('walk')"
				>步行</text>
				<text
					class="route-mode"
					:class="{ active: travelMode === 'cycle' }"
					@tap="switchMode('cycle')"
				>骑行</text>
			</view>
			<view class="route-card" @tap="selectStartPoint">
				<view class="route-row">
					<view class="route-dot start-dot"></view>
					<text class="route-text">{{ startPointName }}</text>
				</view>
				<view class="route-line-v"></view>
				<!-- 途经点列表 -->
				<view
					class="route-row waypoint-row"
					v-for="(wp, wpIdx) in waypoints"
					:key="'wp-' + wpIdx"
				>
					<view class="route-dot waypoint-dot"></view>
					<text class="route-text" @tap.stop="selectWaypoint(wpIdx)">{{ wp.name }}</text>
					<text class="waypoint-remove" @tap.stop="removeWaypoint(wpIdx)">✕</text>
				</view>
				<view class="route-line-v" v-if="waypoints.length > 0"></view>
				<!-- 添加途经点按钮 -->
				<view class="add-waypoint-btn" @tap.stop="selectWaypointTarget = -1; showPlacePicker = true; pickerTitle = '选择途经点'; pickerTarget = 'waypoint'">
					<text class="add-waypoint-icon">+</text>
					<text class="add-waypoint-text">添加途经点</text>
				</view>
				<view class="route-line-v"></view>
				<view class="route-card" @tap.stop="selectEndPoint" style="background: transparent; padding: 0; margin: 0;">
					<view class="route-row">
						<view class="route-dot end-dot"></view>
						<text class="route-text">{{ endPointName }}</text>
					</view>
				</view>
			</view>
			<view class="route-result" v-if="routeDistance > 0">
				<text class="route-result-text">
					{{ travelMode === 'walk' ? '步行' : '骑行' }} 约 {{ routeTime }} 分钟 · {{ routeDistance }}米
				</text>
				<text class="route-source" v-if="routeFromAPI">路线来自高德地图</text>
			</view>
			<view class="route-btn" v-if="endPoint" @tap="startNavigation">
				<text class="route-btn-text">开始导航</text>
			</view>
		</view>

		<!-- 地点详情弹窗 -->
		<view class="detail-mask" v-if="showDetail && !isNavigating" @tap="closeDetail">
			<view class="detail-panel" @tap.stop>
				<view class="detail-handle"></view>
				<view class="detail-header">
					<text class="detail-name">{{ selectedPlace.name }}</text>
					<text class="detail-type">{{ selectedPlace.typeName }}</text>
				</view>
				<view class="detail-info">
					<text class="detail-row">🕐 {{ selectedPlace.openTime }}</text>
					<text class="detail-row" v-if="selectedPlace.desc">📝 {{ selectedPlace.desc }}</text>
				</view>
				<view class="detail-actions">
					<view class="detail-btn secondary" @tap="setAsStart">
						<text>设为起点</text>
					</view>
					<view class="detail-btn primary" @tap="setAsEnd">
						<text>去这里</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 地点选择弹窗 -->
		<view class="detail-mask" v-if="showPlacePicker && !isNavigating" @tap="showPlacePicker = false">
			<view class="picker-panel" @tap.stop>
				<view class="picker-handle"></view>
				<text class="picker-title">{{ pickerTitle }}</text>
				<scroll-view scroll-y class="picker-list">
					<!-- "我的位置"选项（仅在选择起点时显示） -->
					<view
						class="picker-item"
						v-if="pickerTarget === 'start' && hasRealLocation"
						@tap="pickMyLocation"
					>
						<text class="picker-item-icon">📍</text>
						<text class="picker-item-name">我的位置</text>
					</view>
					<view
						class="picker-item"
						v-for="place in campusLocations"
						:key="place.id"
						@tap="pickPlace(place)"
					>
						<text class="picker-item-icon">📌</text>
						<text class="picker-item-name">{{ place.name }}</text>
					</view>
				</scroll-view>
			</view>
		</view>
	</view>

  <!-- 自定义底部导航 -->
  <bottom-nav activeTab="/pages/navigation/index" />
</template>

<script>
import BottomNav from '../../components/bottom-nav/bottom-nav.vue'
import { TENCENT_MAP_KEY, AMAP_KEY } from '../../common/map-config.js'
import { getSchoolLocations, getDefaultLocations } from '../../common/school-locations.js'

export default {
  components: { BottomNav },
	data() {
		return {
			// 地图中心（校园中心坐标 - 杭州某高校）
			centerLat: 30.2570,
			centerLng: 120.1290,
			mapScale: 16,

			// 真实定位
			myLatitude: null,
			myLongitude: null,
			locationLoading: false,
			hasRealLocation: false,

			// 已认证学校名称
			verifiedSchoolName: '',

			// 校园建筑数据（模拟坐标）
			campusLocations: [
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

			// 快速定位分类
			locationTypes: [
				{ name: '教学楼', type: 'teach' },
				{ name: '图书馆', type: 'library' },
				{ name: '食堂', type: 'food' },
				{ name: '宿舍', type: 'dorm' },
				{ name: '操场', type: 'playground' },
				{ name: '体育馆', type: 'gym' }
			],

			// 路线规划
			travelMode: 'walk',
			startPoint: null,
			startPointName: '当前位置',
			endPoint: null,
			endPointName: '选择目的地',
			waypoints: [],
			polyline: [],
			routeDistance: 0,
			routeFromAPI: false,
			routeSteps: [],       // 高德API返回的路段分段数据
			currentStepIndex: 0,  // 当前所在路段索引

			// 语音导航
			voiceEnabled: true,
			lastVoiceDir: '',
			voiceCooldown: false,
			_ttsEngine: null,
			_ttsReady: false,

			// 弹窗控制
			showDetail: false,
			selectedPlace: {},
			showPlacePicker: false,
			pickerTitle: '',
			pickerTarget: '',

			// 地图尺寸（动态获取屏幕宽度）
			mapWidth: 350,
			mapHeight: 250,

			// 地图上下文
			mapCtx: null,

			// 内置导航状态
			isNavigating: false,
			navStartTime: null,
			navTimer: null,

			// 导航朝向（指南针）
			userHeading: 0,
			lastBearing: 0,
			compassListening: false,

			// 地图旋转/倾斜
			mapRotate: 0,
			mapSkew: 0,

			// 导航方向指引
			navDirIcon: '⬆',
			navDirText: '直行'
		}
	},
	computed: {
		// 生成地图标记点（使用内置图标 + callout）
		markers() {
			const list = this.campusLocations.map(place => {
				return {
					id: place.id,
					latitude: place.latitude,
					longitude: place.longitude,
					title: place.name,
					iconPath: '/static/marker-' + place.type + '.png',
					width: 30,
					height: 30,
					callout: {
						content: place.name,
						color: '#333',
						fontSize: 12,
						borderRadius: 6,
						padding: 6,
						display: 'BYCLICK',
						bgColor: '#ffffff'
					}
				}
			})

			// 如果有真实定位，添加"我的位置"蓝色标记
			if (this.hasRealLocation) {
				list.push({
					id: 999,
					latitude: this.myLatitude,
					longitude: this.myLongitude,
					iconPath: '/static/marker-mylocation.png',
					width: 36,
					height: 36,
					callout: {
						content: '我的位置',
						color: '#4361ee',
						fontSize: 12,
						borderRadius: 6,
						padding: 6,
						display: 'ALWAYS',
						bgColor: '#eef0ff'
					}
				})
			}

			return list
		},
		// 预估时间
		routeTime() {
			if (this.routeDistance <= 0) return 0
			const speed = this.travelMode === 'walk' ? 80 : 250
			return Math.ceil(this.routeDistance / speed)
		},
		// 方向提示
		directionHint() {
			if (!this.hasRealLocation || !this.endPoint) return ''
			const dLat = this.endPoint.latitude - this.myLatitude
			const dLng = this.endPoint.longitude - this.myLongitude
			const angle = Math.atan2(dLng, dLat) * 180 / Math.PI
			const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
			const idx = Math.round(((angle + 360) % 360) / 45) % 8
			return dirs[idx]
		},
		// 目地方位角
		targetBearing() {
			if (!this.hasRealLocation || !this.endPoint) return 0
			const dLat = this.endPoint.latitude - this.myLatitude
			const dLng = this.endPoint.longitude - this.myLongitude
			return Math.atan2(dLng, dLat) * 180 / Math.PI
		}
	},
	onLoad() {
		// 动态获取屏幕尺寸，设置地图精确宽度（解决地图右侧缺失问题）
		const sysInfo = uni.getSystemInfoSync()
		this.mapWidth = sysInfo.windowWidth
		this.mapHeight = Math.round(sysInfo.windowWidth * 0.65) + (sysInfo.statusBarHeight || 0)
		// 获取地图上下文
		this.mapCtx = uni.createMapContext('campusMap', this)
		// 加载学校认证数据，设置校园建筑
		this.loadSchoolData()
		// 页面加载时获取真实位置
		this.getMyLocation()
	},
	onShow() {
		// 从认证页面返回时重新加载学校数据
		this.loadSchoolData()
	},
	methods: {
		// ==================== 学校数据加载 ====================
		loadSchoolData() {
			try {
				const verifyData = uni.getStorageSync('campus_school_verify')
				if (verifyData) {
					const data = JSON.parse(verifyData)
					if (data.verified && data.schoolName) {
						this.verifiedSchoolName = data.schoolName
						const schoolData = getSchoolLocations(data.schoolName)
						if (schoolData) {
							this.campusLocations = schoolData.locations
							this.locationTypes = schoolData.locationTypes
							this.centerLat = schoolData.center.lat
							this.centerLng = schoolData.center.lng
							uni.showToast({
								title: '已加载「' + data.schoolName + '」校园数据',
								icon: 'none'
							})
							return
						}
					}
				}
			} catch (e) {
				console.log('加载学校数据失败:', e)
			}
			// 未认证或未找到学校数据，使用默认数据
			this.verifiedSchoolName = ''
			const defaultData = getDefaultLocations()
			this.campusLocations = defaultData.locations
			this.locationTypes = defaultData.locationTypes
			this.centerLat = defaultData.center.lat
			this.centerLng = defaultData.center.lng
		},

		// ==================== 功能1: 真实GPS定位 ====================
		getMyLocation() {
			this.locationLoading = true
			uni.getLocation({
				type: 'wgs84',
				success: (res) => {
					// wgs84 转 gcj02
					const gcj = this.wgs84ToGcj02(res.latitude, res.longitude)
					this.myLatitude = gcj.lat
					this.myLongitude = gcj.lng
					this.hasRealLocation = true
					this.locationLoading = false
					console.log('定位成功:', this.myLatitude, this.myLongitude)
				},
				fail: (err) => {
					console.log('定位失败:', JSON.stringify(err))
					this.locationLoading = false
					uni.showToast({
						title: '定位失败，请检查权限和GPS',
						icon: 'none'
					})
				}
			})
		},

		// WGS84 转 GCJ02 坐标系
		wgs84ToGcj02(lat, lng) {
			const pi = 3.14159265358979324
			const a = 6378245.0
			const ee = 0.00669342162296594323
			let dLat = this._transformLat(lng - 105.0, lat - 35.0)
			let dLng = this._transformLng(lng - 105.0, lat - 35.0)
			const radLat = lat / 180.0 * pi
			let magic = Math.sin(radLat)
			magic = 1 - ee * magic * magic
			const sqrtMagic = Math.sqrt(magic)
			dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi)
			dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi)
			return { lat: lat + dLat, lng: lng + dLng }
		},
		_transformLat(x, y) {
			const pi = 3.14159265358979324
			let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
			ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0
			ret += (20.0 * Math.sin(y * pi) + 40.0 * Math.sin(y / 3.0 * pi)) * 2.0 / 3.0
			ret += (160.0 * Math.sin(y / 12.0 * pi) + 320.0 * Math.sin(y * pi / 30.0)) * 2.0 / 3.0
			return ret
		},
		_transformLng(x, y) {
			const pi = 3.14159265358979324
			let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
			ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0
			ret += (20.0 * Math.sin(x * pi) + 40.0 * Math.sin(x / 3.0 * pi)) * 2.0 / 3.0
			ret += (150.0 * Math.sin(x / 12.0 * pi) + 300.0 * Math.sin(x / 30.0 * pi)) * 2.0 / 3.0
			return ret
		},

		// 移动到我的位置
		moveToMyLocation() {
			if (this.hasRealLocation) {
				this.centerLat = this.myLatitude
				this.centerLng = this.myLongitude
				this.mapScale = 17
				// 移动地图到我的位置
				this.mapCtx.moveToLocation({
					latitude: this.myLatitude,
					longitude: this.myLongitude,
					success: () => {
						uni.showToast({ title: '已定位到当前位置', icon: 'none' })
					}
				})
			} else {
				// 没有真实定位时，回到校园中心并重新尝试获取
				this.mapScale = 16
				uni.showToast({ title: '正在重新获取位置...', icon: 'none' })
				this.getMyLocation()
			}
		},

		// 选择"我的位置"作为起点
		pickMyLocation() {
			if (!this.hasRealLocation) return
			this.startPoint = {
				latitude: this.myLatitude,
				longitude: this.myLongitude,
				name: '我的位置'
			}
			this.startPointName = '我的位置'
			this.showPlacePicker = false
			this.calculateRoute()
		},

		// ==================== 功能2: 腾讯地图路线规划 ====================
		async calculateRoute() {
			if (!this.startPoint || !this.endPoint) {
				this.polyline = []
				this.routeDistance = 0
				this.routeFromAPI = false
				return
			}

			const startLat = this.startPoint.latitude
			const startLng = this.startPoint.longitude
			const endLat = this.endPoint.latitude
			const endLng = this.endPoint.longitude

			// 优先尝试高德地图 API，再尝试腾讯地图 API，最后使用本地模拟
			let apiSuccess = await this.fetchAmapRoute(startLat, startLng, endLat, endLng)
			if (!apiSuccess) {
				apiSuccess = await this.fetchTencentRoute(startLat, startLng, endLat, endLng)
			}

			if (!apiSuccess || !this.routeFromAPI) {
				// API 失败或未返回有效路线时使用本地模拟
				this.routeFromAPI = false
				this.routeDistance = this.calcDistance(startLat, startLng, endLat, endLng)
				const points = this.generateRoutePoints(startLat, startLng, endLat, endLng)
				const color = this.travelMode === 'walk' ? '#4361ee' : '#ff9800'
				const colorLight = this.travelMode === 'walk' ? 'rgba(67,97,238,0.25)' : 'rgba(255,152,0,0.25)'
				this.polyline = [
					{ points: points, color: colorLight, width: 8, arrowLine: false },
					{ points: points, color: color, width: 3, arrowLine: true }
				]
				this.fitRouteView(points)
			} else if (this.polyline.length > 0 && this.polyline[0].points) {
				// API 成功时也调整视图
				this.fitRouteView(this.polyline[0].points)
			}
		},

		// 处理腾讯地图 API 响应（统一解析逻辑）
		_handleTencentRouteResponse(res, startLat, startLng, endLat, endLng) {
			if (res && res.status === 0 && res.result) {
				const routes = res.result.routes
				if (routes && routes.length > 0) {
					const route = routes[0]
					const points = []
					const polylines = []

					if (route.steps && route.steps.length > 0) {
						route.steps.forEach((step) => {
							if (step.polyline) {
								polylines.push(step.polyline)
							}
						})
					}
					if (polylines.length === 0 && route.polyline) {
						polylines.push(route.polyline)
					}

					polylines.forEach(poly => {
						const decoded = this.parsePolyline(poly)
						decoded.forEach(p => {
							points.push({ latitude: p.lat, longitude: p.lng })
						})
					})

					if (points.length > 0) {
						// 验证路线终点是否接近目标点
						const lastPt = points[points.length - 1]
						const endpointDist = this.calcDistance(lastPt.latitude, lastPt.longitude, endLat, endLng)
						if (endpointDist > 500) {
							console.warn('API路线终点远离目标（' + Math.round(endpointDist) + '米），使用本地路线')
							return false
						}
						const color = this.travelMode === 'walk' ? '#4361ee' : '#ff9800'
						const colorLight = this.travelMode === 'walk' ? 'rgba(67,97,238,0.25)' : 'rgba(255,152,0,0.25)'
						this.polyline = [
							{ points: points, color: colorLight, width: 8, arrowLine: false },
							{ points: points, color: color, width: 3, arrowLine: true }
						]
						this.routeDistance = route.distance || this.calcDistance(startLat, startLng, endLat, endLng)
						this.routeFromAPI = true
						this.fitRouteView(points)
						return true
					} else {
						// polyline 解析后无有效点
					}
				}
			}
			return false
		},

		// 调用高德地图步行路线规划 API（优先使用）
		fetchAmapRoute(startLat, startLng, endLat, endLng) {
			return new Promise((resolve) => {
				if (!AMAP_KEY) {
					resolve(false)
					return
				}
				// 高德 API 坐标系为 gcj02，与我们的坐标一致
				let url = `https://restapi.amap.com/v3/direction/walking?origin=${startLng},${startLat}&destination=${endLng},${endLat}&key=${AMAP_KEY}&extensions=all&strategy=2`
				// 添加途经点（高德格式：经度,纬度;经度,纬度）
				if (this.waypoints.length > 0) {
					const wpStr = this.waypoints.map(wp => `${wp.longitude},${wp.latitude}`).join('|')
					url += `&waypoints=${encodeURIComponent(wpStr)}`
				}

				uni.request({
					url: url,
					method: 'GET',
					success: (res) => {
						try {
							const data = res.data
							if (data.status === '1' && data.route && data.route.paths && data.route.paths.length > 0) {
								const path = data.route.paths[0]
								const points = []
								// 保存路段分段数据用于导航指引
								const steps = []
								if (path.steps) {
									path.steps.forEach(step => {
										const stepPoints = []
										if (step.polyline) {
											const decoded = this.parseAmapPolyline(step.polyline)
											decoded.forEach(p => {
												points.push({ latitude: p.lat, longitude: p.lng })
												stepPoints.push({ latitude: p.lat, longitude: p.lng })
											})
										}
										steps.push({
											instruction: step.instruction || '',
											action: step.action || '',
											orientation: step.orientation || '',
											distance: parseInt(step.distance) || 0,
											points: stepPoints
										})
									})
								}
								this.routeSteps = steps
								this.currentStepIndex = 0
								if (points.length > 0) {
									// 验证终点
									const lastPt = points[points.length - 1]
									const endpointDist = this.calcDistance(lastPt.latitude, lastPt.longitude, endLat, endLng)
									if (endpointDist > 500) {
										resolve(false)
										return
									}
									const color = this.travelMode === 'walk' ? '#4361ee' : '#ff9800'
									const colorLight = this.travelMode === 'walk' ? 'rgba(67,97,238,0.25)' : 'rgba(255,152,0,0.25)'
									this.polyline = [
										{ points: points, color: colorLight, width: 8, arrowLine: false },
										{ points: points, color: color, width: 3, arrowLine: true }
									]
									this.routeDistance = parseInt(path.distance) || this.calcDistance(startLat, startLng, endLat, endLng)
									this.routeFromAPI = true
									this.fitRouteView(points)
									resolve(true)
									return
								}
							}
						} catch (e) {
							console.log('高德API解析失败:', e)
						}
						resolve(false)
					},
					fail: () => {
						resolve(false)
					}
				})
			})
		},

		// 调用腾讯地图路线规划 API（米级精度）
		// H5 平台使用 JSONP 避免 CORS，App/小程序使用 uni.request
		fetchTencentRoute(startLat, startLng, endLat, endLng) {
			return new Promise((resolve) => {
				if (!TENCENT_MAP_KEY || TENCENT_MAP_KEY === 'YOUR_TENCENT_MAP_KEY') {
					console.log('未配置腾讯地图API Key，使用本地模拟路线')
					resolve(false)
					return
				}

				// 优先使用驾车 API 获取路线（polyline 数据更可靠），步行/骑行共用
				const baseUrl = `https://apis.map.qq.com/ws/direction/v1/driving/?from=${startLat},${startLng}&to=${endLat},${endLng}&key=${TENCENT_MAP_KEY}&output=json&get_polyline=1`
				const sysInfo = uni.getSystemInfoSync()
				const isH5 = sysInfo.platform === 'h5'

				if (isH5 && typeof document !== 'undefined') {
					// H5 平台：使用 JSONP 避免 CORS
					const cbName = '_tencentCb_' + Date.now()
					const url = baseUrl + '&callback=' + cbName

					const script = document.createElement('script')
					script.type = 'text/javascript'
					script.charset = 'utf-8'

					const timer = setTimeout(() => {
						cleanup()
						resolve(false)
					}, 8000)

					const cleanup = () => {
						clearTimeout(timer)
						delete window[cbName]
						if (script.parentNode) script.parentNode.removeChild(script)
					}

					window[cbName] = (res) => {
						const ok = this._handleTencentRouteResponse(res, startLat, startLng, endLat, endLng)
						cleanup()
						resolve(ok)
					}

					script.onerror = () => {
						cleanup()
						resolve(false)
					}

					script.src = url
					document.head.appendChild(script)
				} else {
					// App / 小程序平台：直接使用 uni.request
					const url = baseUrl
					uni.request({
						url: url,
						method: 'GET',
						success: (res) => {
							const ok = this._handleTencentRouteResponse(res.data || {}, startLat, startLng, endLat, endLng)
							resolve(ok)
						},
						fail: () => {
							resolve(false)
						}
					})
				}
			})
		},

		// 统一解析 polyline（支持多种格式）
		parsePolyline(poly) {
			if (!poly) return []
			// 格式1：数组
			if (Array.isArray(poly)) {
				// 子格式1a：对象数组 [{lat, lng}, ...] 或 [{latitude, longitude}, ...]
				if (poly.length > 0 && typeof poly[0] === 'object') {
					return poly.map(p => ({
						lat: p.lat || p.latitude,
						lng: p.lng || p.longitude
					}))
				}
				// 子格式1b：差分编码的数字数组 [startLat, startLng, dLat1, dLng1, ...]
				if (poly.length >= 4 && typeof poly[0] === 'number') {
					const points = []
					let lat = poly[0]
					let lng = poly[1]
					points.push({ lat, lng })
					for (let i = 2; i < poly.length - 1; i += 2) {
						lat += poly[i] / 100000
						lng += poly[i + 1] / 100000
						points.push({ lat, lng })
					}
					return points
				}
				// 子格式1c：字符串数组 ["lat,lng;lat,lng", ...]
				if (poly.length > 0 && typeof poly[0] === 'string') {
					const points = []
					poly.forEach(str => {
						const parsed = this.parsePolyline(str)
						points.push(...parsed)
					})
					return points
				}
				return []
			}
			// 格式2：字符串 — 分号分隔的坐标对 "lat,lng;lat,lng;..."
			if (typeof poly === 'string') {
				// 去除首尾空白
				const trimmed = poly.trim()
				if (trimmed.length === 0) return []
				// 检查是否包含逗号（坐标分隔符）
				if (trimmed.includes(',')) {
					const points = []
					const pairs = trimmed.split(';')
					pairs.forEach(pair => {
						const parts = pair.split(',')
						if (parts.length >= 2) {
							const lat = parseFloat(parts[0])
							const lng = parseFloat(parts[1])
							if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
								points.push({ lat, lng })
							}
						}
					})
					if (points.length > 0) {
						return points
					}
				}
				// Google Polyline 编码字符串
				return this.decodeGooglePolyline(trimmed)
			}
			return []
		},

		// 解析高德地图 polyline（格式：经度,纬度;经度,纬度;...）
		parseAmapPolyline(poly) {
			if (!poly) return []
			if (typeof poly === 'string') {
				const trimmed = poly.trim()
				if (trimmed.length === 0) return []
				const points = []
				// 高德 polyline 可能用 ";" 或 "|" 分隔多个段
				const segments = trimmed.split('|')
				segments.forEach(seg => {
					const pairs = seg.split(';')
					pairs.forEach(pair => {
						const parts = pair.split(',')
						if (parts.length >= 2) {
							// 高德格式：经度在前，纬度在后
							const lng = parseFloat(parts[0])
							const lat = parseFloat(parts[1])
							if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
								points.push({ lat, lng })
							}
						}
					})
				})
				return points
			}
			// 如果是数组，按通用格式解析
			return this.parsePolyline(poly)
		},

		// 解码 Google Polyline Algorithm 编码
		decodeGooglePolyline(encoded) {
			const points = []
			let index = 0
			let lat = 0
			let lng = 0

			while (index < encoded.length) {
				let shift = 0
				let result = 0
				let b
				do {
					b = encoded.charCodeAt(index++) - 63
					result |= (b & 0x1f) << shift
					shift += 5
				} while (b >= 0x20)
				const dlat = (result & 1) ? ~(result >> 1) : (result >> 1)
				lat += dlat

				shift = 0
				result = 0
				do {
					b = encoded.charCodeAt(index++) - 63
					result |= (b & 0x1f) << shift
					shift += 5
				} while (b >= 0x20)
				const dlng = (result & 1) ? ~(result >> 1) : (result >> 1)
				lng += dlng

				points.push({ lat: lat / 1e5, lng: lng / 1e5 })
			}

			return points
		},

		// 切换出行方式时重新计算路线
		switchMode(mode) {
			this.travelMode = mode
			if (this.startPoint && this.endPoint) {
				this.calculateRoute()
			}
		},

		// ==================== 功能3: 标记图标生成 ====================
		// 生成标记图标（运行时 canvas 生成，无需外部 PNG 文件）
		generateMarkerIcons() {
			// uni-app 的 map 组件需要 iconPath 指向有效的图片路径
			// 在 App 端，我们使用 plus.io 写入本地文件
			// 在 H5 端，使用 canvas 生成 data URL
			// 这里提供一个降级方案：如果 PNG 文件不存在，map 组件会使用默认红色图标
			// 建议在项目构建时运行 static/gen_markers.py 生成图标文件
		},

		// ==================== 原有功能 ====================
		onMarkerTap(e) {
			const markerId = e.detail.markerId
			const place = this.campusLocations.find(p => p.id === markerId)
			if (place) {
				this.selectedPlace = place
				this.showDetail = true
			}
		},

		onRegionChange(e) {},

		quickLocate(item) {
			const place = this.campusLocations.find(p => p.type === item.type)
			if (place) {
				this.mapCtx.moveToLocation({
					latitude: place.latitude,
					longitude: place.longitude,
					success: () => {
						this.mapScale = 17
					}
				})
			}
		},

		closeDetail() {
			this.showDetail = false
		},

		setAsStart() {
			this.startPoint = this.selectedPlace
			this.startPointName = this.selectedPlace.name
			this.showDetail = false
			this.calculateRoute()
		},

		setAsEnd() {
			this.endPoint = this.selectedPlace
			this.endPointName = this.selectedPlace.name
			this.showDetail = false
			this.calculateRoute()
		},

		selectStartPoint() {
			this.pickerTitle = '选择起点'
			this.pickerTarget = 'start'
			this.showPlacePicker = true
		},

		selectEndPoint() {
			this.pickerTitle = '选择目的地'
			this.pickerTarget = 'end'
			this.showPlacePicker = true
		},

		pickPlace(place) {
			if (this.pickerTarget === 'start') {
				this.startPoint = place
				this.startPointName = place.name
			} else if (this.pickerTarget === 'waypoint') {
				this.waypoints.push({ name: place.name, latitude: place.latitude, longitude: place.longitude })
			} else {
				this.endPoint = place
				this.endPointName = place.name
			}
			this.showPlacePicker = false
			this.calculateRoute()
		},

		selectWaypoint(idx) {
			this.selectWaypointTarget = idx
			this.pickerTitle = '选择途经点'
			this.pickerTarget = 'waypoint'
			this.showPlacePicker = true
		},

		removeWaypoint(idx) {
			this.waypoints.splice(idx, 1)
			this.calculateRoute()
		},

		// 本地模拟路线（绕开建筑，模拟真实道路）
		generateRoutePoints(startLat, startLng, endLat, endLng) {
			const dLat = endLat - startLat
			const dLng = endLng - startLng
			const totalDist = Math.sqrt(dLat * dLat + dLng * dLng)

			if (totalDist < 0.00001) {
				return [{ latitude: startLat, longitude: startLng }, { latitude: endLat, longitude: endLng }]
			}

			// 确定性伪随机（坐标不变则路线不变）
			const hash = Math.sin(startLat * 127.1 + startLng * 311.7 + endLat * 74.7 + endLng * 157.3) * 43758.5453
			const seed = hash - Math.floor(hash)

			// 生成初始平滑曲线（从起点到终点的自然弧线）
			const numCtrlPts = 5
			const ctrlPts = []
			// 弧度随距离自适应：短距离小弧度，长距离适当大弧度
			const maxArcOffset = Math.min(totalDist * 0.12, 0.00025)
			for (let i = 0; i < numCtrlPts; i++) {
				const t = i / (numCtrlPts - 1)
				let lat = startLat + dLat * t
				let lng = startLng + dLng * t
				// 添加垂直方向的弧度偏移
				const perpMag = Math.sin(t * Math.PI) * maxArcOffset
				const side = (seed > 0.5 ? 1 : -1)
				lat += (-dLng / totalDist) * perpMag * side
				lng += (dLat / totalDist) * perpMag * side
				ctrlPts.push({ lat, lng })
			}

			// 用 Catmull-Rom 样条生成初始路径点
			const rawPts = []
			for (let seg = 0; seg < ctrlPts.length - 1; seg++) {
				const p0 = ctrlPts[Math.max(0, seg - 1)]
				const p1 = ctrlPts[seg]
				const p2 = ctrlPts[seg + 1]
				const p3 = ctrlPts[Math.min(ctrlPts.length - 1, seg + 2)]
				const steps = 12
				for (let i = 0; i <= steps; i++) {
					const t = i / steps
					const t2 = t * t, t3 = t2 * t
					rawPts.push({
						lat: 0.5 * ((2 * p1.lat) + (-p0.lat + p2.lat) * t + (2 * p0.lat - 5 * p1.lat + 4 * p2.lat - p3.lat) * t2 + (-p0.lat + 3 * p1.lat - 3 * p2.lat + p3.lat) * t3),
						lng: 0.5 * ((2 * p1.lng) + (-p0.lng + p2.lng) * t + (2 * p0.lng - 5 * p1.lng + 4 * p2.lng - p3.lng) * t2 + (-p0.lng + 3 * p1.lng - 3 * p2.lng + p3.lng) * t3)
					})
				}
			}
			rawPts.push({ lat: endLat, lng: endLng })

			// 建筑物避让：将穿过建筑的路径点推到建筑外侧
			const buildingSafeRadius = 0.00018  // 约 20 米安全距离
			const pushDistance = 0.00022  // 推开距离约 25 米

			for (let iter = 0; iter < 3; iter++) {
				for (let i = 1; i < rawPts.length - 1; i++) {
					let repX = 0, repY = 0
					for (const b of this.campusLocations) {
						const dx = rawPts[i].lat - b.latitude
						const dy = rawPts[i].lng - b.longitude
						const dist = Math.sqrt(dx * dx + dy * dy)
						if (dist < buildingSafeRadius && dist > 0.000001) {
							const force = Math.pow((buildingSafeRadius - dist) / buildingSafeRadius, 2)
							repX += (dx / dist) * force
							repY += (dy / dist) * force
						}
					}
					const repMag = Math.sqrt(repX * repX + repY * repY)
					if (repMag > 0.01) {
						rawPts[i].lat += (repX / repMag) * pushDistance
						rawPts[i].lng += (repY / repMag) * pushDistance
					}
				}
				// 每次推完后稍微平滑，防止路径锯齿
				for (let i = 1; i < rawPts.length - 1; i++) {
					rawPts[i].lat = rawPts[i].lat * 0.7 + (rawPts[i - 1].lat + rawPts[i + 1].lat) * 0.15
					rawPts[i].lng = rawPts[i].lng * 0.7 + (rawPts[i - 1].lng + rawPts[i + 1].lng) * 0.15
				}
			}

			// 固定起点和终点
			rawPts[0] = { lat: startLat, lng: startLng }
			rawPts[rawPts.length - 1] = { lat: endLat, lng: endLng }

			return rawPts.map(p => ({ latitude: p.lat, longitude: p.lng }))
		},

		calcDistance(lat1, lng1, lat2, lng2) {
			const R = 6371000
			const dLat = (lat2 - lat1) * Math.PI / 180
			const dLng = (lng2 - lng1) * Math.PI / 180
			const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
				Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
				Math.sin(dLng / 2) * Math.sin(dLng / 2)
			const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
			return Math.round(R * c)
		},

		fitRouteView(points) {
			if (!points || points.length === 0) return
			let minLat = points[0].latitude, maxLat = points[0].latitude
			let minLng = points[0].longitude, maxLng = points[0].longitude
			points.forEach(p => {
				if (p.latitude < minLat) minLat = p.latitude
				if (p.latitude > maxLat) maxLat = p.latitude
				if (p.longitude < minLng) minLng = p.longitude
				if (p.longitude > maxLng) maxLng = p.longitude
			})
			this.centerLat = (minLat + maxLat) / 2
			this.centerLng = (minLng + maxLng) / 2
			// 根据跨度计算合适的缩放级别
			const latSpan = maxLat - minLat
			const lngSpan = maxLng - minLng
			const maxSpan = Math.max(latSpan, lngSpan)
			const spanInMeters = maxSpan * 111000
			let scale = 19 - Math.log2(spanInMeters / 800)
			this.mapScale = Math.max(3, Math.min(19, Math.round(scale)))
		},

		async startNavigation() {
			if (!this.endPoint) return
			// 确定起点
			let startLat, startLng
			if (this.hasRealLocation) {
				startLat = this.myLatitude
				startLng = this.myLongitude
			} else if (this.startPoint) {
				startLat = this.startPoint.latitude
				startLng = this.startPoint.longitude
			} else {
				startLat = this.centerLat
				startLng = this.centerLng
			}

			// 优先尝试腾讯地图 API 获取米级精度路线
			let apiSuccess = await this.fetchAmapRoute(startLat, startLng, this.endPoint.latitude, this.endPoint.longitude)
			if (!apiSuccess) {
				apiSuccess = await this.fetchTencentRoute(startLat, startLng, this.endPoint.latitude, this.endPoint.longitude)
			}

			if (!apiSuccess || !this.routeFromAPI) {
				// API 失败时使用本地模拟路线
				const points = this.generateRoutePoints(startLat, startLng, this.endPoint.latitude, this.endPoint.longitude)
				this.polyline = [
					{ points: points, color: 'rgba(67,97,238,0.25)', width: 8, arrowLine: false },
					{ points: points, color: '#4361ee', width: 3, arrowLine: true }
				]
			}
			// 导航模式下，地图以起点（用户位置）为中心
			this.centerLat = startLat
			this.centerLng = startLng
			// 根据路线距离设置合适的缩放级别
			const distToDest = this.calcDistance(startLat, startLng, this.endPoint.latitude, this.endPoint.longitude)
			if (distToDest > 3000) this.mapScale = 14
			else if (distToDest > 1000) this.mapScale = 15
			else if (distToDest > 500) this.mapScale = 16
			else if (distToDest > 200) this.mapScale = 17
			else this.mapScale = 18
			// 计算初始距离
			if (this.hasRealLocation) {
				this.routeDistance = this.calcDistance(startLat, startLng, this.endPoint.latitude, this.endPoint.longitude)
			}
			// 开启内置导航模式
			this.isNavigating = true
			this.navStartTime = Date.now()
			this.lastVoiceDir = ''
			this.currentStepIndex = 0
			this._distToTurn = 0
			this._nextAction = ''
			this._nextInstruction = ''
			this._spokenSteps = ''
			// 设置地图倾斜效果（模拟3D导航视角）
			this.mapSkew = 40
			// 更新导航指引
			this.updateNavDirection()
			// 延迟开启指南针，先让用户看到正确的路线方向
			setTimeout(() => {
				this.startCompass()
			}, 1500)
			this.navTimer = setInterval(async () => {
				if (this.hasRealLocation && this.endPoint) {
					// 实时计算剩余距离
					this.routeDistance = this.calcDistance(
						this.myLatitude, this.myLongitude,
						this.endPoint.latitude, this.endPoint.longitude
					)
					// 非 API 路线时，重新生成本地模拟路线
					if (!this.routeFromAPI) {
						const newPoints = this.generateRoutePoints(this.myLatitude, this.myLongitude, this.endPoint.latitude, this.endPoint.longitude)
						this.polyline = [
							{ points: newPoints, color: 'rgba(67,97,238,0.25)', width: 8, arrowLine: false },
							{ points: newPoints, color: '#4361ee', width: 3, arrowLine: true }
						]
					}
					// 移动地图到当前位置
					this.centerLat = this.myLatitude
					this.centerLng = this.myLongitude
					this.mapScale = 17
					// 更新导航方向指引
					this.updateNavDirection()
					// 跟踪当前路段
					this.updateCurrentStep()
					// 到达目的地（50米内）
					if (this.routeDistance < 50) {
						this.stopNavigation()
						this.speak('已到达目的地')
						uni.showToast({ title: '已到达目的地！', icon: 'success' })
					}
				}
			}, 3000)
			uni.showToast({ title: '导航已开始', icon: 'none' })
			// 语音播报开始导航
			this.speak(`导航开始，前方约${Math.round(this.routeDistance)}米到达${this.endPointName}`)
		},

		stopNavigation() {
			this.isNavigating = false
			this.routeDistance = 0
			this.routeSteps = []
			this.currentStepIndex = 0
			this.polyline = []
			// 恢复地图视角
			this.mapSkew = 0
			this.mapRotate = 0
			// 停止指南针
			this.stopCompass()
			if (this.navTimer) {
				clearInterval(this.navTimer)
				this.navTimer = null
			}
		},

		// ==================== 指南针与导航方向 ====================
		startCompass() {
			if (this.compassListening) return
			this.compassListening = true
			uni.onCompassChange((res) => {
				if (!this.isNavigating) return
				this.userHeading = res.direction
				// 地图朝向跟随手机朝向
				this.mapRotate = -res.direction
				// 更新导航方向指引图标
				this.updateNavDirection()
			})
		},

		stopCompass() {
			this.compassListening = false
			uni.stopCompass()
		},

		resetNavHeading() {
			// 重置地图朝向为正北
			this.mapRotate = 0
			if (this.hasRealLocation) {
				this.centerLat = this.myLatitude
				this.centerLng = this.myLongitude
			}
		},

		updateNavDirection() {
			if (!this.hasRealLocation || !this.endPoint) return
			// 计算目标方位角（相对手机朝向）
			const bearing = this.targetBearing
			const relativeAngle = ((bearing - this.userHeading) + 360) % 360

			// 根据相对角度选择方向图标和文字
			if (relativeAngle >= 337.5 || relativeAngle < 22.5) {
				this.navDirIcon = '⬆'
				this.navDirText = '直行'
			} else if (relativeAngle >= 22.5 && relativeAngle < 67.5) {
				this.navDirIcon = '↗'
				this.navDirText = '右前方'
			} else if (relativeAngle >= 67.5 && relativeAngle < 112.5) {
				this.navDirIcon = '➡'
				this.navDirText = '右转'
			} else if (relativeAngle >= 112.5 && relativeAngle < 157.5) {
				this.navDirIcon = '↘'
				this.navDirText = '右后方'
			} else if (relativeAngle >= 157.5 && relativeAngle < 202.5) {
				this.navDirIcon = '⬇'
				this.navDirText = '掉头'
			} else if (relativeAngle >= 202.5 && relativeAngle < 247.5) {
				this.navDirIcon = '↙'
				this.navDirText = '左后方'
			} else if (relativeAngle >= 247.5 && relativeAngle < 292.5) {
				this.navDirIcon = '⬅'
				this.navDirText = '左转'
			} else {
				this.navDirIcon = '↖'
				this.navDirText = '左前方'
			}
			// 方向变化时语音播报
			this.speakNavDirection()
		},

		// ==================== 语音导航 ====================
		toggleVoice() {
			this.voiceEnabled = !this.voiceEnabled
			if (this.voiceEnabled) {
				this.speak('导航已开启')
			}
		},

		// 初始化 TTS（通过 webview 使用浏览器 Web Speech API）
		_initTTS() {
			if (this._ttsWebViewId) return
			try {
				const wv = plus.webview.create('', 'tts_webview', { dock: 'bottom', height: '1', width: '1' })
				wv.hide()
				const sc = 'script'
				const html = '<html><head><meta charset="utf-8"></head><body><' + sc + '>' +
					'var r=window.speechSynthesis;' +
					'window.addEventListener("message",function(e){' +
					'  if(!r)return;' +
					'  if(e.data&&e.data.type==="speak"){' +
					'    r.cancel();' +
					'    var u=new SpeechSynthesisUtterance(e.data.text);' +
					'    u.lang="zh-CN";u.rate=1.1;' +
					'    r.speak(u);' +
					'  }' +
					'});' +
					'</' + sc + '></body></html>'
				wv.loadData(html)
				this._ttsWebViewId = 'tts_webview'
				console.log('TTS webview 已创建')
			} catch (e) {
				console.log('TTS webview 创建失败:', e)
			}
		},

		speak(text) {
			if (!this.voiceEnabled || this.voiceCooldown) return
			this.voiceCooldown = true
			setTimeout(() => { this.voiceCooldown = false }, 5000)
			try {
				// APP 端：Android 原生 TTS（用 invoke 调用方法）
				if (typeof plus !== 'undefined' && plus.android) {
					const invoke = plus.android.invoke
					if (!this._ttsEngine) {
						const self = this
						try {
							const ctx = plus.android.runtimeMainActivity().getApplicationContext()
							// 不传回调，避免阻塞初始化
							this._ttsEngine = plus.android.newObject('android.speech.tts.TextToSpeech', ctx, null)
							console.log('TTS 引擎对象已创建')
						} catch (e1) {
							console.log('TTS 创建失败:', e1)
						}
						// 轮询 + invoke(setLanguage) 判断就绪
						if (this._ttsEngine) {
							const Locale = plus.android.importClass('java.util.Locale')
							let count = 0
							const check = setInterval(function() {
								count++
								try {
									// 先检查语言可用性
									const avail = invoke(self._ttsEngine, 'isLanguageAvailable', Locale.getDefault())
									console.log('TTS isLanguageAvailable:', avail, '第' + count + '次')
									// 再设置语言
									const r = invoke(self._ttsEngine, 'setLanguage', Locale.getDefault())
									console.log('TTS setLanguage result:', r)
									if (r >= 0 || avail >= 0) {
										clearInterval(check)
										self._ttsReady = true
										console.log('TTS 就绪! 开始播报:', text)
										invoke(self._ttsEngine, 'speak', text, 0, null)
									} else if (count >= 5) {
										clearInterval(check)
										console.log('TTS 语言不支持! 你的TTS引擎( Accessibility Engine)可能不兼容标准API')
										uni.showToast({ title: '当前TTS引擎不兼容，请安装Google TTS或讯飞语讯', icon: 'none', duration: 5000 })
									}
								} catch (e2) {
									console.log('TTS setLanguage 异常:', e2)
									if (count >= 5) clearInterval(check)
								}
							}, 500)
						}
						return
					}
					if (this._ttsReady) {
						console.log('TTS 直接播报:', text)
						invoke(this._ttsEngine, 'speak', text, 0, null)
						return
					}
					console.log('TTS 引擎尚未就绪')
				}
				// H5 端
				if (typeof window !== 'undefined' && window.speechSynthesis) {
					window.speechSynthesis.cancel()
					const u = new SpeechSynthesisUtterance(text)
					u.lang = 'zh-CN'
					u.rate = 1.1
					window.speechSynthesis.speak(u)
					return
				}
				console.log('语音播报（文字）:', text)
			} catch (e) {
				console.log('语音播报失败:', e)
			}
		},

		// 跟踪当前路段，计算到下一转弯点的距离
		updateCurrentStep() {
			if (!this.routeSteps || this.routeSteps.length === 0) return
			const lat = this.myLatitude
			const lng = this.myLongitude
			// 找到用户当前所在的路段
			for (let i = this.currentStepIndex; i < this.routeSteps.length; i++) {
				const step = this.routeSteps[i]
				if (!step.points || step.points.length === 0) continue
				// 检查用户是否已经通过了这个路段的终点
				const lastPt = step.points[step.points.length - 1]
				const distToEnd = this.calcDistance(lat, lng, lastPt.latitude, lastPt.longitude)
				// 如果离当前路段终点很近（30米内），切换到下一路段
				if (distToEnd < 30 && i < this.routeSteps.length - 1) {
					this.currentStepIndex = i + 1
					continue
				}
				// 用户在当前路段中，计算到路段终点的距离
				this.currentStepIndex = i
				// 计算到当前路段终点（即下一个转弯点）的距离
				let distToTurn = 0
				for (let j = i; j < this.routeSteps.length; j++) {
					const s = this.routeSteps[j]
					if (!s.points || s.points.length === 0) continue
					const endPt = s.points[s.points.length - 1]
					distToTurn += this.calcDistance(
						j === i ? lat : s.points[0].latitude,
						j === i ? lng : s.points[0].longitude,
						endPt.latitude, endPt.longitude
					)
				}
				// 如果不是最后一个路段，distToTurn 就是到下一个转弯的距离
				// 如果是最后一个路段，就是到目的地的距离
				if (i < this.routeSteps.length - 1) {
					// 到当前路段终点的距离 = 到下一个转弯点的距离
					const endPt = step.points[step.points.length - 1]
					this._distToTurn = this.calcDistance(lat, lng, endPt.latitude, endPt.longitude)
					this._nextAction = this.routeSteps[i + 1].action || ''
					this._nextInstruction = this.routeSteps[i + 1].instruction || ''
				} else {
					this._distToTurn = distToTurn
					this._nextAction = ''
					this._nextInstruction = ''
				}
				break
			}
		},

		speakNavDirection() {
			if (!this.voiceEnabled || !this.hasRealLocation || !this.endPoint) return
			// 优先使用路段信息
			if (this.routeSteps && this.routeSteps.length > 0) {
				const dist = this._distToTurn || this.routeDistance
				const nextAction = this._nextAction || ''
				const step = this.routeSteps[this.currentStepIndex]
				const curAction = step ? (step.action || '') : ''
				// 生成播报文字
				let text = ''
				if (dist < 50) {
					if (nextAction) {
						text = `即将${nextAction}`
					} else {
						text = '即将到达目的地'
					}
				} else if (dist < 200 && nextAction) {
					text = `前方${Math.round(dist)}米${nextAction}`
				} else if (curAction && curAction !== '直行') {
					// 当前路段有转向动作时播报
					const key = 'step_' + this.currentStepIndex
					if (this._spokenSteps !== key) {
						this._spokenSteps = key
						text = step.instruction || `${curAction}，前方${Math.round(step.distance)}米`
					}
				} else if (this.navDirText !== this.lastVoiceDir) {
					// 没有路段信息时回退到方位角
					const dir = this.navDirText
					this.lastVoiceDir = dir
					if (dir === '直行') {
						text = `前方${Math.round(dist)}米直行`
					} else {
						text = `${dir}，前方${Math.round(dist)}米`
					}
				}
				if (text) this.speak(text)
				return
			}
			// 回退：使用方位角
			const dir = this.navDirText
			if (dir === this.lastVoiceDir) return
			this.lastVoiceDir = dir
			const dist = this.routeDistance
			let text = ''
			if (dist < 50) {
				text = '即将到达目的地'
			} else if (dir === '直行') {
				text = `前方${Math.round(dist)}米直行`
			} else {
				text = `${dir}，前方${Math.round(dist)}米`
			}
			this.speak(text)
		}
	}
}
</script>

<style>
.nav-page {
	padding: 0 0 20rpx 0;
	margin: 0;
	position: relative;
	background: linear-gradient(180deg, #e8ecff 0%, #f0f2fa 30%, #f5f6fa 100%);
	min-height: 100vh;
}

/* 地图容器 */
.map-wrapper {
	position: relative;
	width: 100%;
	overflow: visible;
}

/* 状态栏占位 */
.nav-status-bar {
	height: var(--status-bar-height);
	width: 100%;
	position: absolute;
	top: 0;
	left: 0;
	z-index: 100;
	background: transparent;
}

/* 地图 - 宽高由 JS 动态设置 */
.campus-map {
	display: block;
}
.nav-map {
	transition: none;
}

/* 定位按钮 - cover-view 不支持 backdrop-filter，保持实色 */
.map-btn {
	position: absolute;
	right: 32rpx;
	background: rgba(255, 255, 255, 0.9);
	border-radius: 50%;
	width: 80rpx;
	height: 80rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.12);
	z-index: 100;
	border: 1rpx solid rgba(255, 255, 255, 0.6);
}
.my-location {
	bottom: 20rpx;
	right: 32rpx;
}
.btn-icon {
	font-size: 36rpx;
}

/* 定位提示 */
.location-toast {
	position: absolute;
	top: 16rpx;
	left: 50%;
	transform: translateX(-50%);
	background: rgba(26, 26, 46, 0.8);
	color: #ffffff;
	padding: 12rpx 32rpx;
	border-radius: 40rpx;
	font-size: 24rpx;
	z-index: 10;
	white-space: nowrap;
	border: 1rpx solid rgba(255, 255, 255, 0.15);
}

/* 导航状态栏 - 精致渐变 */
.nav-bar {
	margin: 20rpx 32rpx;
	background: linear-gradient(135deg, #5a7bff, #8b9fff);
	border-radius: 24rpx;
	padding: 28rpx 32rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	box-shadow: 0 8rpx 32rpx rgba(90, 123, 255, 0.3), inset 0 1rpx 0 rgba(255, 255, 255, 0.2);
	position: relative;
	overflow: hidden;
}
.nav-bar::before {
	content: '';
	position: absolute;
	top: -50%;
	right: -10%;
	width: 160rpx;
	height: 160rpx;
	background: rgba(255, 255, 255, 0.08);
	border-radius: 50%;
}
.nav-bar-left {
	flex: 1;
	position: relative;
	z-index: 1;
}
.nav-bar-dest {
	font-size: 30rpx;
	font-weight: bold;
	color: #ffffff;
	display: block;
	margin-bottom: 8rpx;
}
.nav-bar-distance {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.85);
}
.nav-bar-stop {
	background: rgba(255, 255, 255, 0.2);
	border-radius: 40rpx;
	padding: 16rpx 32rpx;
	flex-shrink: 0;
	border: 1rpx solid rgba(255, 255, 255, 0.15);
	position: relative;
	z-index: 1;
}
.nav-bar-stop text {
	color: #ffffff;
	font-size: 26rpx;
	font-weight: bold;
}
.nav-bar-actions {
	display: flex;
	align-items: center;
	gap: 16rpx;
	flex-shrink: 0;
	position: relative;
	z-index: 1;
}
.nav-bar-voice {
	background: rgba(255, 255, 255, 0.2);
	border-radius: 50%;
	width: 64rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 32rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.15);
}

/* 导航底部指引面板 - 磨砂玻璃 */
.nav-bottom {
	margin: 0 32rpx 20rpx;
	background: rgba(255, 255, 255, 0.85);
	border-radius: 24rpx;
	padding: 28rpx 32rpx;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
	border: 1rpx solid rgba(255, 255, 255, 0.4);
	display: flex;
	align-items: center;
	justify-content: space-between;
}
.nav-direction {
	display: flex;
	align-items: center;
	gap: 16rpx;
}
.nav-dir-icon {
	font-size: 56rpx;
	line-height: 1;
}
.nav-dir-text {
	font-size: 36rpx;
	font-weight: bold;
	color: #1a1a2e;
}
.nav-next-info {
	text-align: right;
}
.nav-next-label {
	font-size: 26rpx;
	color: #5a7bff;
	display: block;
	margin-bottom: 4rpx;
	font-weight: 500;
}
.nav-next-detail {
	font-size: 24rpx;
	color: #999;
}

/* 指南针按钮 */
.compass-btn {
	bottom: 20rpx;
	right: 32rpx;
}
.compass-btn .btn-icon {
	font-size: 32rpx;
	display: inline-block;
	transition: transform 0.3s ease;
}

/* 导航时回到自己位置按钮 */
.nav-locate-btn {
	bottom: 110rpx;
	right: 32rpx;
}

/* 卡片 - 磨砂玻璃 */
.card {
	margin: 20rpx 32rpx 32rpx;
	background: rgba(255, 255, 255, 0.85);
	border-radius: 24rpx;
	padding: 32rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.4);
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
}
.card-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #1a1a2e;
	display: block;
	margin-bottom: 24rpx;
}
.card-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24rpx;
}
.card-header .card-title {
	margin-bottom: 0;
}
.school-label {
	font-size: 22rpx;
	color: #5a7bff;
	background: rgba(238, 240, 255, 0.8);
	padding: 4rpx 16rpx;
	border-radius: 20rpx;
	font-weight: 500;
}

.location-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}
.loc-tag {
	padding: 16rpx 32rpx;
	background: rgba(240, 242, 255, 0.8);
	color: #5a7bff;
	border-radius: 40rpx;
	font-size: 26rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.3);
	transition: all 0.2s ease;
}
.loc-tag:active {
	background: rgba(90, 123, 255, 0.9);
	color: #ffffff;
	transform: scale(0.95);
}

/* 路线 */
.route-modes {
	display: flex;
	gap: 16rpx;
	margin-bottom: 24rpx;
}
.route-mode {
	padding: 12rpx 32rpx;
	border-radius: 40rpx;
	font-size: 26rpx;
	background: rgba(245, 246, 250, 0.6);
	color: #666;
	border: 1rpx solid rgba(255, 255, 255, 0.3);
	transition: all 0.2s ease;
}
.route-mode.active {
	background: linear-gradient(135deg, #5a7bff, #8b9fff);
	color: #ffffff;
	border-color: transparent;
	box-shadow: 0 4rpx 16rpx rgba(90, 123, 255, 0.3);
}
.route-card {
	background: rgba(245, 246, 250, 0.75);
	border-radius: 16rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	border: none;
}
.route-row {
	display: flex;
	align-items: center;
	gap: 16rpx;
}
.route-dot {
	width: 20rpx;
	height: 20rpx;
	border-radius: 50%;
	flex-shrink: 0;
}
.start-dot { background: #4caf50; }
.end-dot { background: #f44336; }
.waypoint-dot { background: #ff9800; }
.waypoint-row {
	position: relative;
}
.waypoint-remove {
	margin-left: auto;
	font-size: 24rpx;
	color: #999;
	padding: 8rpx 12rpx;
}
.add-waypoint-btn {
	display: flex;
	align-items: center;
	gap: 12rpx;
	padding: 12rpx 0 12rpx 36rpx;
}
.add-waypoint-icon {
	width: 36rpx;
	height: 36rpx;
	border-radius: 50%;
	border: 2rpx dashed #ccc;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24rpx;
	color: #999;
}
.add-waypoint-text {
	font-size: 24rpx;
	color: #999;
}
.route-text {
	font-size: 28rpx;
	color: #1a1a2e;
}
.route-line-v {
	width: 2rpx;
	height: 30rpx;
	background: rgba(0, 0, 0, 0.1);
	margin-left: 9rpx;
	margin: 8rpx 0 8rpx 9rpx;
}
.route-result {
	background: rgba(232, 245, 233, 0.85);
	border-radius: 12rpx;
	padding: 20rpx;
	text-align: center;
	margin-bottom: 20rpx;
	border: 1rpx solid rgba(76, 175, 80, 0.15);
}
.route-result-text {
	font-size: 28rpx;
	color: #4caf50;
	font-weight: bold;
	display: block;
}
.route-source {
	font-size: 20rpx;
	color: #999;
	display: block;
	margin-top: 8rpx;
}
.route-btn {
	background: linear-gradient(135deg, #5a7bff, #8b9fff);
	border-radius: 16rpx;
	padding: 24rpx;
	text-align: center;
	box-shadow: 0 6rpx 24rpx rgba(90, 123, 255, 0.3);
	transition: transform 0.2s ease;
}
.route-btn:active {
	transform: scale(0.97);
}
.route-btn-text {
	color: #ffffff;
	font-size: 30rpx;
	font-weight: bold;
}

/* 详情弹窗 - 磨砂玻璃 */
.detail-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.45);
	z-index: 999;
	display: flex;
	align-items: flex-end;
}
.detail-panel {
	background: rgba(255, 255, 255, 0.95);
	border-radius: 32rpx 32rpx 0 0;
	width: 100%;
	padding: 24rpx 40rpx calc(60rpx + var(--safe-area-inset-bottom));
	animation: slideUp 0.3s ease;
	border-top: 1rpx solid rgba(255, 255, 255, 0.5);
}
.picker-panel {
	background: rgba(255, 255, 255, 0.95);
	border-radius: 32rpx 32rpx 0 0;
	width: 100%;
	max-height: 60vh;
	padding: 24rpx 40rpx calc(60rpx + var(--safe-area-inset-bottom));
	animation: slideUp 0.3s ease;
	border-top: 1rpx solid rgba(255, 255, 255, 0.5);
}
@keyframes slideUp {
	from { transform: translateY(100%); }
	to { transform: translateY(0); }
}
.detail-handle, .picker-handle {
	width: 80rpx;
	height: 8rpx;
	background: rgba(0, 0, 0, 0.12);
	border-radius: 4rpx;
	margin: 0 auto 24rpx;
}
.detail-header {
	margin-bottom: 24rpx;
}
.detail-name {
	font-size: 36rpx;
	font-weight: bold;
	color: #1a1a2e;
	display: block;
	margin-bottom: 8rpx;
}
.detail-type {
	font-size: 24rpx;
	color: #5a7bff;
	background: rgba(238, 240, 255, 0.8);
	padding: 4rpx 16rpx;
	border-radius: 8rpx;
	font-weight: 500;
}
.detail-info {
	margin-bottom: 32rpx;
}
.detail-row {
	font-size: 28rpx;
	color: #555;
	display: block;
	margin-bottom: 12rpx;
}
.detail-actions {
	display: flex;
	gap: 20rpx;
}
.detail-btn {
	flex: 1;
	text-align: center;
	padding: 24rpx 0;
	border-radius: 16rpx;
	font-size: 30rpx;
	font-weight: bold;
	transition: transform 0.2s ease;
}
.detail-btn:active {
	transform: scale(0.97);
}
.detail-btn.primary {
	background: linear-gradient(135deg, #5a7bff, #8b9fff);
	color: #ffffff;
	box-shadow: 0 6rpx 24rpx rgba(90, 123, 255, 0.3);
}
.detail-btn.secondary {
	background: rgba(245, 246, 250, 0.8);
	color: #666;
}

/* 地点选择弹窗 */
.picker-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #1a1a2e;
	display: block;
	margin-bottom: 24rpx;
	text-align: center;
}
.picker-list {
	max-height: 400rpx;
}
.picker-item {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 24rpx 0;
	border-bottom: 1rpx solid rgba(0, 0, 0, 0.06);
	transition: background 0.2s ease;
	border-radius: 12rpx;
	padding-left: 8rpx;
	padding-right: 8rpx;
}
.picker-item:active {
	background: rgba(240, 242, 255, 0.5);
}
.picker-item:last-child {
	border-bottom: none;
}
.picker-item-icon {
	font-size: 32rpx;
}
.picker-item-name {
	font-size: 28rpx;
	color: #1a1a2e;
}
</style>
