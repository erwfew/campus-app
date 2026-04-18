<template>
	<view class="sport-page">
		<!-- 自定义导航栏 -->
		<view class="custom-nav">
			<view class="nav-status-bar"></view>
			<view class="nav-title-bar">
				<text class="nav-title">校园运动</text>
			</view>
		</view>

		<!-- 运动数据概览 -->
		<view class="sport-overview">
			<view class="stat-card">
				<text class="stat-value blue">{{totalDistance}}</text>
				<text class="stat-label">总公里</text>
			</view>
			<view class="stat-card">
				<text class="stat-value green">{{totalRuns}}</text>
				<text class="stat-label">总次数</text>
			</view>
			<view class="stat-card">
				<text class="stat-value orange">{{totalCalories}}</text>
				<text class="stat-label">总卡路里</text>
			</view>
		</view>

		<!-- 跑步地图 -->
		<view class="map-wrapper" v-if="running || routePoints.length > 0">
			<map
				class="run-map"
				:style="{ width: mapWidth + 'px', height: mapHeight + 'px' }"
				:latitude="mapCenterLat"
				:longitude="mapCenterLng"
				:scale="mapScale"
				:markers="runMarkers"
				:polyline="runPolyline"
				:show-location="true"
				id="runMap"
				ref="runMap"
			></map>
			<!-- 回到自己位置按钮 -->
			<cover-view class="run-locate-btn" @tap="moveToMyLocation">
				<cover-view class="locate-icon">📍</cover-view>
			</cover-view>
		</view>

		<!-- 跑步计时器 -->
		<view class="timer-card">
			<text class="timer-value">{{formatTime}}</text>
			<text class="timer-label">运动时间</text>

			<view class="run-metrics">
				<view class="metric">
					<text class="metric-val blue">{{distance}}</text>
					<text class="metric-lbl">公里</text>
				</view>
				<view class="metric">
					<text class="metric-val green">{{pace}}</text>
					<text class="metric-lbl">配速</text>
				</view>
				<view class="metric">
					<text class="metric-val orange">{{calories}}</text>
					<text class="metric-lbl">卡路里</text>
				</view>
			</view>

			<view class="run-btns">
				<view v-if="!running && !paused" class="run-btn start-btn" @tap="startRun">
					<text class="btn-text">&#x25B6; 开始跑步</text>
				</view>
				<template v-if="running">
					<view class="run-btn pause-btn" @tap="pauseRun">
						<text class="btn-text">&#x23F8; 暂停</text>
					</view>
					<view class="run-btn stop-btn" @tap="stopRun">
						<text class="btn-text">&#x25A0; 结束</text>
					</view>

				<template v-if="paused">
					<view class="run-btn resume-btn" @tap="resumeRun">
						<text class="btn-text">&#x25B6; 继续</text>
					</view>
					<view class="run-btn stop-btn" @tap="stopRun">
						<text class="btn-text">&#x25A0; 结束</text>
					</view>
				</template>
			</view>
		</view>

		<!-- 跑步记录 -->
		<view class="card">
			<text class="card-title">跑步记录</text>
			<view class="history-list" v-if="runHistory.length > 0">
				<view class="history-item" v-for="(item, index) in runHistory" :key="index">
					<view class="history-date-col">
						<text class="hd-day">{{item.day}}</text>
						<text class="hd-month">{{item.monthStr}}</text>
					</view>
					<view class="history-info">
						<text class="hi-name">{{item.name}}</text>
						<text class="hi-detail">{{item.distance}}km · {{item.duration}}</text>
					</view>
					<text class="hi-cal">{{item.calories}}卡</text>
				</view>
			</view>
			<view v-else class="empty-history">
				<text class="empty-text">还没有跑步记录，开始你的第一次校园跑吧！</text>
			</view>
		</view>

		<!-- 跑步结束弹窗 -->
		<view class="detail-mask" v-if="showSummary" @tap="showSummary = false">
			<view class="summary-panel" @tap.stop>
				<view class="summary-handle"></view>
				<text class="summary-title">跑步完成！</text>
				<view class="summary-stats">
					<view class="summary-item">
						<text class="summary-val blue">{{summaryData.distance}}</text>
						<text class="summary-lbl">公里</text>
					</view>
					<view class="summary-item">
						<text class="summary-val green">{{summaryData.duration}}</text>
						<text class="summary-lbl">用时</text>
					</view>
					<view class="summary-item">
						<text class="summary-val orange">{{summaryData.calories}}</text>
						<text class="summary-lbl">卡路里</text>
					</view>
				</view>
				<view class="summary-pace" v-if="summaryData.pace">
					<text>平均配速 {{summaryData.pace}} /公里</text>
				</view>
				<view class="summary-btn" @tap="showSummary = false">
					<text class="summary-btn-text">好的</text>
				</view>
			</view>
		</view>
	<bottom-nav activeTab="/pages/sport/index" />
	</view>
</template>

<script>
import BottomNav from '../../components/bottom-nav/bottom-nav.vue'
export default {
components: { BottomNav },
	data() {
		return {
			// 跑步状态
			running: false,
			paused: false,
			seconds: 0,
			timer: null,

			// 实时数据
			distance: '0.0',
			pace: '0:00',
			calories: '0',

			// GPS 追踪
			lastLat: null,
			lastLng: null,
			routePoints: [],
			totalMeters: 0,
			locationTimer: null,

			// 地图
			mapWidth: 350,
			mapHeight: 300,
			mapCenterLat: 30.2570,
			mapCenterLng: 120.1290,
			mapScale: 17,
			mapCtx: null,

			// 历史记录
			runHistory: [],
			totalDistance: '0.0',
			totalRuns: '0',
			totalCalories: '0',

			// 结算弹窗
			showSummary: false,
			summaryData: {
				distance: '0.0',
				duration: '0:00',
				calories: '0',
				pace: ''
			}
		}
	},
	computed: {
		formatTime() {
			var h = Math.floor(this.seconds / 3600)
			var m = Math.floor((this.seconds % 3600) / 60)
			var s = this.seconds % 60
			if (h > 0) {
				return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s)
			}
			return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s)
		},
		runMarkers() {
			var markers = []
			if (this.routePoints.length > 0) {
				// 起点标记
				markers.push({
					id: 0,
					latitude: this.routePoints[0].latitude,
					longitude: this.routePoints[0].longitude,
					iconPath: '',
					width: 0,
					height: 0,
					callout: {
						content: '起点',
						color: '#ffffff',
						fontSize: 12,
						borderRadius: 6,
						padding: 4,
						display: 'ALWAYS',
						bgColor: '#4caf50'
					}
				})
			}
			return markers
		},
		runPolyline() {
			if (this.routePoints.length < 2) return []
			return [{
				points: this.routePoints,
				color: '#4361ee',
				width: 6,
				arrowLine: true
			}]
		}
	},
	onLoad() {
		// 动态获取屏幕尺寸
		var sysInfo = uni.getSystemInfoSync()
		this.mapWidth = sysInfo.windowWidth
		this.mapHeight = Math.round(sysInfo.windowWidth * 0.6)

		// 获取地图上下文
		this.mapCtx = uni.createMapContext('runMap', this)

		// 加载历史记录
		this.loadHistory()
	},
	methods: {
// ==================== 坐标转换 ====================
		wgs84ToGcj02(lat, lng) {
			var pi = 3.14159265358979324
			var a = 6378245.0
			var ee = 0.00669342162296594323
			var dLat = this._transformLat(lng - 105.0, lat - 35.0)
			var dLng = this._transformLng(lng - 105.0, lat - 35.0)
			var radLat = lat / 180.0 * pi
			var magic = Math.sin(radLat)
			magic = 1 - ee * magic * magic
			var sqrtMagic = Math.sqrt(magic)
			dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi)
			dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi)
			return { lat: lat + dLat, lng: lng + dLng }
		},
		_transformLat(x, y) {
			var pi = 3.14159265358979324
			var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
			ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0
			ret += (20.0 * Math.sin(y * pi) + 40.0 * Math.sin(y / 3.0 * pi)) * 2.0 / 3.0
			ret += (160.0 * Math.sin(y / 12.0 * pi) + 320.0 * Math.sin(y * pi / 30.0)) * 2.0 / 3.0
			return ret
		},
		_transformLng(x, y) {
			var pi = 3.14159265358979324
			var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
			ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0
			ret += (20.0 * Math.sin(x * pi) + 40.0 * Math.sin(x / 3.0 * pi)) * 2.0 / 3.0
			ret += (150.0 * Math.sin(x / 12.0 * pi) + 300.0 * Math.sin(x / 30.0 * pi)) * 2.0 / 3.0
			return ret
		},

		// ==================== 回到自己位置 ====================
		moveToMyLocation() {
			if (this.mapCtx) {
				this.mapCtx.moveToLocation({
					success: () => {
						uni.showToast({ title: '已定位到当前位置', icon: 'none' })
					},
					fail: () => {
						uni.showToast({ title: '定位失败，请检查GPS权限', icon: 'none' })
					}
				})
			}
		},

		// ==================== 距离计算（Haversine公式）====================
		calcDistance(lat1, lng1, lat2, lng2) {
			var R = 6371000
			var dLat = (lat2 - lat1) * Math.PI / 180
			var dLng = (lng2 - lng1) * Math.PI / 180
			var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
				Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
				Math.sin(dLng / 2) * Math.sin(dLng / 2)
			var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
			return R * c
		},

		// ==================== GPS 定位追踪 ====================
		startLocationTracking() {
			this.locationTimer = setInterval(function() {
				uni.getLocation({
					type: 'wgs84',
					success: (res) => {
						var gcj = this.wgs84ToGcj02(res.latitude, res.longitude)
						this.handleNewLocation(gcj.lat, gcj.lng)
					},
					fail: () => {
						console.log('跑步定位获取失败')
					}
				})
			}.bind(this), 3000) // 每3秒获取一次位置
		},

		stopLocationTracking() {
			if (this.locationTimer) {
				clearInterval(this.locationTimer)
				this.locationTimer = null
			}
		},

		handleNewLocation(lat, lng) {
			// 更新地图中心
			this.mapCenterLat = lat
			this.mapCenterLng = lng

			if (this.lastLat !== null && this.lastLng !== null) {
				var meters = this.calcDistance(this.lastLat, this.lastLng, lat, lng)
				// 过滤掉异常大的位移（GPS漂移，>50m/3s不合理）
				if (meters < 50) {
					this.totalMeters += meters
					this.routePoints.push({ latitude: lat, longitude: lng })
				}
			} else {
				// 首次定位，添加起点
				this.routePoints.push({ latitude: lat, longitude: lng })
			}

			this.lastLat = lat
			this.lastLng = lng

			// 更新距离显示
			var km = (this.totalMeters / 1000).toFixed(1)
			this.distance = km

			// 更新配速
			if (parseFloat(km) > 0 && this.seconds > 0) {
				var paceMin = Math.floor(this.seconds / 60 / parseFloat(km))
				var paceSec = Math.floor((this.seconds / 60 / parseFloat(km) - paceMin) * 60)
				this.pace = paceMin + ':' + (paceSec < 10 ? '0' + paceSec : paceSec)
			}

			// 更新卡路里（跑步约 60卡/公里）
			this.calories = Math.round(parseFloat(km) * 60).toString()
		},

		// ==================== 跑步控制 ====================
		startRun() {
			// 重置状态
			this.running = true
			this.paused = false
			this.seconds = 0
			this.distance = '0.0'
			this.pace = '0:00'
			this.calories = '0'
			this.totalMeters = 0
			this.lastLat = null
			this.lastLng = null
			this.routePoints = []

			// 计时器
			this.timer = setInterval(function() {
				this.seconds++
				// 如果GPS没拿到数据，用时间估算距离作为降级
				if (this.totalMeters === 0 && this.seconds > 5) {
					var estKmNum = this.seconds * 0.003
					this.distance = estKmNum.toFixed(2)
					if (estKmNum > 0) {
						var paceMin = Math.floor(this.seconds / 60 / estKmNum)
						var paceSec = Math.floor((this.seconds / 60 / estKmNum - paceMin) * 60)
						this.pace = paceMin + ':' + (paceSec < 10 ? '0' + paceSec : paceSec)
					}
					this.calories = Math.round(estKmNum * 60).toString()
				}
			}.bind(this), 1000)

			// 开始GPS追踪
			this.startLocationTracking()

			uni.showToast({ title: '开始跑步', icon: 'none' })
		},

		pauseRun() {
			this.running = false
			this.paused = true
			clearInterval(this.timer)
			this.stopLocationTracking()
		},

		resumeRun() {
			this.running = true
			this.paused = false
			this.timer = setInterval(function() {
				this.seconds++
			}.bind(this), 1000)
			this.startLocationTracking()
		},

		stopRun() {
			var _this = this
			uni.showModal({
				title: '结束跑步',
				content: '确定要结束本次跑步吗？',
				success: function(res) {
					if (res.confirm) {
						_this.finishRun()
					}
				}
			})
		},

		finishRun() {
			this.running = false
			this.paused = false
			clearInterval(this.timer)
			this.stopLocationTracking()

			var km = parseFloat(this.distance)
			if (km < 0.01) {
				uni.showToast({ title: '跑步距离太短，不记录', icon: 'none' })
				this.seconds = 0
				this.distance = '0.0'
				this.routePoints = []
				return
			}

			// 计算用时
			var h = Math.floor(this.seconds / 3600)
			var m = Math.floor((this.seconds % 3600) / 60)
			var s = this.seconds % 60
			var durationStr = ''
			if (h > 0) {
				durationStr = h + '小时' + m + '分'
			} else {
				durationStr = m + '分' + s + '秒'
			}

			// 判断时段
			var hour = new Date().getHours()
			var runName = (hour >= 5 && hour < 10) ? '晨跑' : (hour >= 17 || hour < 5) ? '夜跑' : '日间跑'

			// 构建记录
			var now = new Date()
			var record = {
				name: runName,
				distance: km.toFixed(1),
				duration: durationStr,
				seconds: this.seconds,
				calories: this.calories,
				pace: this.pace,
				day: now.getDate(),
				month: now.getMonth() + 1,
				monthStr: (now.getMonth() + 1) + '月',
				timestamp: now.getTime(),
				points: this.routePoints.length
			}

			// 保存到历史
			this.runHistory.unshift(record)
			if (this.runHistory.length > 50) this.runHistory = this.runHistory.slice(0, 50)
			this.saveHistory()
			this.updateOverview()

			// 显示结算弹窗
			this.summaryData = {
				distance: km.toFixed(1),
				duration: this.formatTime,
				calories: this.calories,
				pace: this.pace !== '0:00' ? this.pace : ''
			}
			this.showSummary = true

			// 重置当前跑步状态
			this.seconds = 0
			this.distance = '0.0'
			this.pace = '0:00'
			this.calories = '0'
			this.totalMeters = 0
			this.lastLat = null
			this.lastLng = null
			this.routePoints = []
		},

		// ==================== 数据持久化 ====================
		saveHistory() {
			uni.setStorageSync('campus_run_history', JSON.stringify(this.runHistory))
		},

		loadHistory() {
			try {
				var data = uni.getStorageSync('campus_run_history')
				if (data) {
					this.runHistory = JSON.parse(data)
				}
			} catch (e) {
				this.runHistory = []
			}
			this.updateOverview()
		},

		updateOverview() {
			var totalKm = 0
			var totalCal = 0
			this.runHistory.forEach(function(item) {
				totalKm += parseFloat(item.distance) || 0
				totalCal += parseInt(item.calories) || 0
			})
			this.totalDistance = totalKm.toFixed(1)
			this.totalRuns = this.runHistory.length.toString()
			this.totalCalories = totalCal.toString()
		}
	},
	onUnload() {
		if (this.timer) clearInterval(this.timer)
		this.stopLocationTracking()
	}
}
</script>

<style>
/* ==================== 页面背景 ==================== */
/* 自定义导航栏 */
.custom-nav {
	background: linear-gradient(180deg, #4361ee, #5a7bff);
}
.nav-status-bar {
	height: var(--status-bar-height);
}
.nav-title-bar {
	padding: 16rpx 32rpx 24rpx;
}
.nav-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #ffffff;
}

.sport-page {
	min-height: 100vh;
	background: linear-gradient(180deg, #4361ee 0%, #6b83f5 12%, #d4daff 28%, #e8ecff 50%, #f0f2ff 70%, #f5f6fa 100%);
	padding-bottom: calc(40rpx + var(--safe-area-inset-bottom));
}

/* ==================== 毛玻璃卡片通用 ==================== */
/* 颜色变量 */
page {
	--text-primary: #1a1a2e;
	--text-secondary: #555;
}

/* ==================== 数据概览 ==================== */
.sport-overview {
	display: flex;
	justify-content: space-between;
	margin: 24rpx 32rpx 20rpx;
}
.stat-card {
	position: relative;
	overflow: hidden;
	flex: 1;
	background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.88) 100%);
	border-radius: 28rpx;
	padding: 36rpx 16rpx;
	text-align: center;
	margin-right: 16rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.7);
	box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.06), 0 1rpx 0 rgba(255, 255, 255, 0.9) inset;
	transition: all 0.2s ease;
}
.stat-card:active {
	transform: scale(0.98);
	opacity: 0.85;
}
.stat-card::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
	pointer-events: none;
}
.stat-card:last-child { margin-right: 0; }
.stat-value {
	font-size: 48rpx;
	font-weight: bold;
	display: block;
}
.stat-value.blue { color: #4361ee; }
.stat-value.green { color: #2e9e3e; }
.stat-value.orange { color: #f59e0b; }
.stat-label {
	font-size: 22rpx;
	color: var(--text-secondary);
	display: block;
	margin-top: 8rpx;
}

/* ==================== 跑步地图 ==================== */
.map-wrapper {
	position: relative;
	margin: 0 32rpx 24rpx;
	background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.88) 100%);
	border-radius: 28rpx;
	padding: 16rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.7);
	box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.06), 0 1rpx 0 rgba(255, 255, 255, 0.9) inset;
	position: relative;
	overflow: hidden;
}
.map-wrapper::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
	pointer-events: none;
	z-index: 1;
}
.run-map {
	display: block;
	border-radius: 16rpx;
}

/* 回到自己位置按钮 */
.run-locate-btn {
	position: absolute;
	right: 40rpx;
	bottom: 40rpx;
	width: 72rpx;
	height: 72rpx;
	background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.88) 100%);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1rpx solid rgba(255, 255, 255, 0.7);
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.12);
	z-index: 100;
	transition: all 0.2s ease;
}
.run-locate-btn:active {
	transform: scale(0.92);
	opacity: 0.8;
}
.locate-icon {
	font-size: 32rpx;
}

/* ==================== 计时器 ==================== */
.timer-card {
	position: relative;
	overflow: hidden;
	margin: 0 32rpx 32rpx;
	background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.88) 100%);
	border-radius: 28rpx;
	padding: 48rpx 32rpx;
	text-align: center;
	border: 1rpx solid rgba(255, 255, 255, 0.7);
	box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.06), 0 1rpx 0 rgba(255, 255, 255, 0.9) inset;
}
.timer-card::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
	pointer-events: none;
}
.timer-value {
	font-size: 88rpx;
	font-weight: bold;
	color: var(--text-primary);
	display: block;
	font-variant-numeric: tabular-nums;
	letter-spacing: 2rpx;
}
.timer-label {
	font-size: 26rpx;
	color: var(--text-secondary);
	display: block;
	margin-top: 8rpx;
	margin-bottom: 40rpx;
}
.run-metrics {
	display: flex;
	justify-content: space-around;
	margin-bottom: 40rpx;
}
.metric {
	text-align: center;
}
.metric-val {
	font-size: 40rpx;
	font-weight: bold;
	display: block;
}
.metric-val.blue { color: #4361ee; }
.metric-val.green { color: #2e9e3e; }
.metric-val.orange { color: #f59e0b; }
.metric-lbl {
	font-size: 22rpx;
	color: var(--text-secondary);
	display: block;
	margin-top: 4rpx;
}

/* ==================== 跑步按钮 ==================== */
.run-btns {
	display: flex;
	justify-content: center;
	gap: 24rpx;
}
.run-btn {
	padding: 24rpx 80rpx;
	border-radius: 50rpx;
	transition: all 0.2s ease;
}
.run-btn:active {
	transform: scale(0.96);
	opacity: 0.85;
}
.start-btn {
	background: linear-gradient(135deg, #43a047, #66bb6a);
	box-shadow: 0 6rpx 24rpx rgba(76,175,80,0.35);
}
.resume-btn {
	background: linear-gradient(135deg, #43a047, #66bb6a);
	box-shadow: 0 6rpx 24rpx rgba(76,175,80,0.35);
}
.pause-btn {
	background: linear-gradient(135deg, #ef6c00, #ffa726);
	box-shadow: 0 6rpx 24rpx rgba(255,152,0,0.35);
}
.stop-btn {
	background: linear-gradient(135deg, #c62828, #ef5350);
	box-shadow: 0 6rpx 24rpx rgba(244,67,54,0.35);
}
.btn-text {
	color: #ffffff;
	font-size: 30rpx;
	font-weight: bold;
}

/* ==================== 卡片 (跑步记录) ==================== */
.card {
	position: relative;
	overflow: hidden;
	margin: 0 32rpx 32rpx;
	background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.88) 100%);
	border-radius: 28rpx;
	padding: 32rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.7);
	box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.06), 0 1rpx 0 rgba(255, 255, 255, 0.9) inset;
}
.card::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
	pointer-events: none;
}
.card-title {
	font-size: 32rpx;
	font-weight: bold;
	color: var(--text-primary);
	display: block;
	margin-bottom: 24rpx;
}

/* ==================== 历史记录 ==================== */
.history-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}
.history-item {
	display: flex;
	align-items: center;
	gap: 24rpx;
	padding: 24rpx;
	background: linear-gradient(180deg, rgba(237,240,255,0.65) 0%, rgba(242,244,255,0.5) 100%);
	border-radius: 20rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.5);
	transition: all 0.2s ease;
}
.history-item:active {
	transform: scale(0.98);
	opacity: 0.85;
}
.history-date-col {
	width: 80rpx;
	text-align: center;
	flex-shrink: 0;
}
.hd-day {
	font-size: 36rpx;
	font-weight: bold;
	color: #4361ee;
	display: block;
}
.hd-month {
	font-size: 22rpx;
	color: var(--text-secondary);
}
.history-info {
	flex: 1;
}
.hi-name {
	font-size: 28rpx;
	font-weight: bold;
	color: var(--text-primary);
	display: block;
	margin-bottom: 4rpx;
}
.hi-detail {
	font-size: 24rpx;
	color: var(--text-secondary);
}
.hi-cal {
	font-size: 26rpx;
	color: #2e9e3e;
	font-weight: bold;
}

/* ==================== 空状态 ==================== */
.empty-history {
	padding: 40rpx 0;
	text-align: center;
}
.empty-text {
	font-size: 26rpx;
	color: #aaa;
}

/* ==================== 结算弹窗 ==================== */
.detail-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(10,10,30,0.55);
	z-index: 999;
	display: flex;
	align-items: center;
	justify-content: center;
}
.summary-panel {
	position: relative;
	overflow: hidden;
	background: linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(248,250,255,0.92) 100%);
	border-radius: 32rpx;
	width: 620rpx;
	padding: 48rpx 40rpx 60rpx;
	text-align: center;
	border: 1rpx solid rgba(255, 255, 255, 0.7);
	box-shadow: 0 16rpx 48rpx rgba(0,0,0,0.12), 0 1rpx 0 rgba(255, 255, 255, 0.9) inset;
	animation: popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.summary-panel::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
	pointer-events: none;
}
@keyframes popIn {
	from { transform: scale(0.85); opacity: 0; }
	to { transform: scale(1); opacity: 1; }
}
.summary-handle {
	width: 80rpx;
	height: 8rpx;
	background: rgba(0,0,0,0.1);
	border-radius: 4rpx;
	margin: 0 auto 32rpx;
}
.summary-title {
	font-size: 40rpx;
	font-weight: bold;
	color: var(--text-primary);
	display: block;
	margin-bottom: 40rpx;
}
.summary-stats {
	display: flex;
	justify-content: space-around;
	margin-bottom: 32rpx;
}
.summary-item {
	text-align: center;
}
.summary-val {
	font-size: 48rpx;
	font-weight: bold;
	display: block;
}
.summary-val.blue { color: #4361ee; }
.summary-val.green { color: #2e9e3e; }
.summary-val.orange { color: #f59e0b; }
.summary-lbl {
	font-size: 22rpx;
	color: var(--text-secondary);
	display: block;
	margin-top: 8rpx;
}
.summary-pace {
	font-size: 26rpx;
	color: #666;
	margin-bottom: 40rpx;
}
.summary-btn {
	background: linear-gradient(135deg, #4361ee, #7b8cff);
	border-radius: 50rpx;
	padding: 24rpx 0;
	margin: 0 40rpx;
	box-shadow: 0 6rpx 24rpx rgba(67,97,238,0.3);
	transition: all 0.2s ease;
}
.summary-btn:active {
	transform: scale(0.96);
	opacity: 0.85;
}
.summary-btn-text {
	color: #ffffff;
	font-size: 30rpx;
	font-weight: bold;
}

/* 自定义底部导航 */
</style>


