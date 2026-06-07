<template>
	<view class="nav-page">
		<!-- 鍦板浘鍖哄煙 -->
		<view class="map-wrapper">
			<!-- 鐘舵€佹爮鍗犱綅 -->
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

			<!-- 瀹氫綅鎸夐挳 -->
			<cover-view class="map-btn my-location" @tap="moveToMyLocation" v-if="!isNavigating">
				<cover-view class="btn-icon">馃搷</cover-view>
			</cover-view>

			<!-- 瀵艰埅鏃剁殑鎸囧崡閽堟寜閽?-->
			<cover-view class="map-btn compass-btn" @tap="resetNavHeading" v-if="isNavigating">
				<cover-view class="btn-icon">猬?/cover-view>
			</cover-view>

			<!-- 瀵艰埅鏃跺洖鍒拌嚜宸变綅缃寜閽?-->
			<cover-view class="map-btn nav-locate-btn" @tap="moveToMyLocation" v-if="isNavigating">
				<cover-view class="btn-icon">馃搷</cover-view>
			</cover-view>

			<!-- 瀹氫綅鐘舵€佹彁绀?-->
			<view class="location-toast" v-if="locationLoading">
				<text>姝ｅ湪鑾峰彇浣嶇疆...</text>
			</view>
		</view>

		<!-- 瀵艰埅鐘舵€佹爮 -->
		<view class="nav-bar" v-if="isNavigating">
			<view class="nav-bar-left">
				<text class="nav-bar-dest">鍓嶅線 {{ endPointName }}</text>
				<text class="nav-bar-distance">
					鍓╀綑绾?{{ routeDistance }} 绫?路 绾?{{ routeTime }} 鍒嗛挓
				</text>
			</view>
			<view class="nav-bar-actions">
				<view class="nav-bar-voice" @tap="toggleVoice">
					<text>{{ voiceEnabled ? '馃攰' : '馃攪' }}</text>
				</view>
				<view class="nav-bar-stop" @tap="stopNavigation">
					<text>缁撴潫瀵艰埅</text>
				</view>
			</view>
		</view>

		<!-- 瀵艰埅搴曢儴鎸囧紩闈㈡澘 -->
		<view class="nav-bottom" v-if="isNavigating">
			<view class="nav-direction">
				<text class="nav-dir-icon">{{ navDirIcon }}</text>
				<text class="nav-dir-text">{{ navDirText }}</text>
			</view>
			<!-- 鏈夎矾娈典俊鎭椂鏄剧ず涓嬩竴杞集鎻愮ず -->
			<view class="nav-next-info" v-if="routeSteps.length > 0 && _nextAction">
				<text class="nav-next-label">鍓嶆柟绾{ Math.round(_distToTurn) }}绫硔{ _nextAction }}</text>
				<text class="nav-next-detail" v-if="_nextInstruction">{{ _nextInstruction }}</text>
			</view>
			<view class="nav-next-info" v-else-if="directionHint">
				<text class="nav-next-label">鏈漿{ directionHint }}鏂瑰悜</text>
				<text class="nav-next-detail">鍓嶅線 {{ endPointName }}</text>
			</view>
		</view>

		<!-- 蹇€熷畾浣?-->
		<view class="card" v-if="!isNavigating">
			<view class="card-header">
				<text class="card-title">蹇€熷畾浣?/text>
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

		<!-- 璺嚎瑙勫垝 -->
		<view class="card" v-if="!isNavigating">
			<text class="card-title">璺嚎瑙勫垝</text>
			<view class="route-modes">
				<text
					class="route-mode"
					:class="{ active: travelMode === 'walk' }"
					@tap="switchMode('walk')"
				>姝ヨ</text>
				<text
					class="route-mode"
					:class="{ active: travelMode === 'cycle' }"
					@tap="switchMode('cycle')"
				>楠戣</text>
			</view>
			<view class="route-card" @tap="selectStartPoint">
				<view class="route-row">
					<view class="route-dot start-dot"></view>
					<text class="route-text">{{ startPointName }}</text>
				</view>
				<view class="route-line-v"></view>
				<!-- 閫旂粡鐐瑰垪琛?-->
				<view
					class="route-row waypoint-row"
					v-for="(wp, wpIdx) in waypoints"
					:key="'wp-' + wpIdx"
				>
					<view class="route-dot waypoint-dot"></view>
					<text class="route-text" @tap.stop="selectWaypoint(wpIdx)">{{ wp.name }}</text>
					<text class="waypoint-remove" @tap.stop="removeWaypoint(wpIdx)">鉁?/text>
				</view>
				<view class="route-line-v" v-if="waypoints.length > 0"></view>
				<!-- 娣诲姞閫旂粡鐐规寜閽?-->
				<view class="add-waypoint-btn" @tap.stop="selectWaypointTarget = -1; showPlacePicker = true; pickerTitle = '閫夋嫨閫旂粡鐐?; pickerTarget = 'waypoint'">
					<text class="add-waypoint-icon">+</text>
					<text class="add-waypoint-text">娣诲姞閫旂粡鐐?/text>
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
					{{ travelMode === 'walk' ? '姝ヨ' : '楠戣' }} 绾?{{ routeTime }} 鍒嗛挓 路 {{ routeDistance }}绫?				</text>
				<text class="route-source" v-if="routeFromAPI">璺嚎鏉ヨ嚜楂樺痉鍦板浘</text>
			</view>
			<view class="route-btn" v-if="endPoint" @tap="startNavigation">
				<text class="route-btn-text">寮€濮嬪鑸?/text>
			</view>
		</view>

		<!-- 鍦扮偣璇︽儏寮圭獥 -->
		<view class="detail-mask" v-if="showDetail && !isNavigating" @tap="closeDetail">
			<view class="detail-panel" @tap.stop>
				<view class="detail-handle"></view>
				<view class="detail-header">
					<text class="detail-name">{{ selectedPlace.name }}</text>
					<text class="detail-type">{{ selectedPlace.typeName }}</text>
				</view>
				<view class="detail-info">
					<text class="detail-row">馃晲 {{ selectedPlace.openTime }}</text>
					<text class="detail-row" v-if="selectedPlace.desc">馃摑 {{ selectedPlace.desc }}</text>
				</view>
				<view class="detail-actions">
					<view class="detail-btn secondary" @tap="setAsStart">
						<text>璁句负璧风偣</text>
					</view>
					<view class="detail-btn primary" @tap="setAsEnd">
						<text>鍘昏繖閲?/text>
					</view>
				</view>
			</view>
		</view>

		<!-- 鍦扮偣閫夋嫨寮圭獥 -->
		<view class="detail-mask" v-if="showPlacePicker && !isNavigating" @tap="showPlacePicker = false">
			<view class="picker-panel" @tap.stop>
				<view class="picker-handle"></view>
				<text class="picker-title">{{ pickerTitle }}</text>
				<scroll-view scroll-y class="picker-list">
					<!-- "鎴戠殑浣嶇疆"閫夐」锛堜粎鍦ㄩ€夋嫨璧风偣鏃舵樉绀猴級 -->
					<view
						class="picker-item"
						v-if="pickerTarget === 'start' && hasRealLocation"
						@tap="pickMyLocation"
					>
						<text class="picker-item-icon">馃搷</text>
						<text class="picker-item-name">鎴戠殑浣嶇疆</text>
					</view>
					<view
						class="picker-item"
						v-for="place in campusLocations"
						:key="place.id"
						@tap="pickPlace(place)"
					>
						<text class="picker-item-icon">馃搶</text>
						<text class="picker-item-name">{{ place.name }}</text>
					</view>
				</scroll-view>
			</view>
		</view>
	</view>

  <!-- 鑷畾涔夊簳閮ㄥ鑸?-->
  <bottom-nav activeTab="/pages/navigation/index" />
</template>

<script>
import BottomNav from '../../components/bottom-nav/bottom-nav.vue'
import RoutePlanner from '../../components/navigation/route-planner.vue'
import LocationDetail from '../../components/navigation/location-detail.vue'
import PlacePicker from '../../components/navigation/place-picker.vue'
import { TENCENT_MAP_KEY, AMAP_KEY } from '../../common/map-config.js'
import { getSchoolLocations, getDefaultLocations } from '../../common/school-locations.js'
import { useUserStore } from '@/store/pinia'

export default {
  components: { BottomNav, RoutePlanner, LocationDetail, PlacePicker },
	data() {
		return {
			// 鏂扮被鍨嬧啋宸叉湁marker鍥剧墖鐨勬槧灏?			markerIconMap: {
				teaching: 'teach',
				canteen: 'food',
				dormitory: 'dorm',
				sports: 'gym',
				office: 'admin',
				'teacher-apt': 'dorm',
				shop: 'food',
				hotel: 'activity',
				'school-gate': 'activity',
			},
			centerLat: 30.2570,
			centerLng: 120.1290,
			mapScale: 16,

			// 鐪熷疄瀹氫綅
			myLatitude: null,
			myLongitude: null,
			locationLoading: false,
			hasRealLocation: false,

			// 宸茶璇佸鏍″悕绉?			verifiedSchoolName: '',

			// 鏍″洯寤虹瓚鏁版嵁锛堟ā鎷熷潗鏍囷級
			campusLocations: [
				{ id: 1, name: '鏁欏妤糀', latitude: 30.2580, longitude: 120.1280, type: 'teaching', typeName: '鏁欏妤?, openTime: '7:00 - 22:00', desc: '璁＄畻鏈哄闄€佹暟瀛﹀闄㈡墍鍦ㄥ湴' },
				{ id: 2, name: '鏁欏妤糂', latitude: 30.2590, longitude: 120.1300, type: 'teaching', typeName: '鏁欏妤?, openTime: '7:00 - 22:00', desc: '澶栬瀛﹂櫌銆佺粡绠″闄㈡墍鍦ㄥ湴' },
				{ id: 3, name: '鏁欏妤糃', latitude: 30.2565, longitude: 120.1310, type: 'teaching', typeName: '鏁欏妤?, openTime: '7:00 - 22:00', desc: '鏂囧闄€佹硶瀛﹂櫌鎵€鍦ㄥ湴' },
				{ id: 4, name: '鍥句功棣?, latitude: 30.2570, longitude: 120.1290, type: 'library', typeName: '鍥句功棣?, openTime: '8:00 - 22:00', desc: '钘忎功120涓囧唽锛岃嚜涔犲24灏忔椂寮€鏀? },
				{ id: 5, name: '绗竴椋熷爞', latitude: 30.2560, longitude: 120.1270, type: 'canteen', typeName: '椋熷爞', openTime: '6:30 - 21:00', desc: '涓€妤煎ぇ浼楅锛屼簩妤肩壒鑹插皬鍚? },
				{ id: 6, name: '绗簩椋熷爞', latitude: 30.2585, longitude: 120.1265, type: 'canteen', typeName: '椋熷爞', openTime: '6:30 - 21:00', desc: '娓呯湡绐楀彛銆佽タ寮忓揩椁? },
				{ id: 7, name: '瀹胯垗A鏍?, latitude: 30.2600, longitude: 120.1260, type: 'dormitory', typeName: '瀹胯垗', openTime: '鍏ㄥぉ', desc: '鐢风敓瀹胯垗' },
				{ id: 8, name: '瀹胯垗B鏍?, latitude: 30.2605, longitude: 120.1275, type: 'dormitory', typeName: '瀹胯垗', openTime: '鍏ㄥぉ', desc: '濂崇敓瀹胯垗' },
				{ id: 9, name: '瀹胯垗C鏍?, latitude: 30.2602, longitude: 120.1250, type: 'dormitory', typeName: '瀹胯垗', openTime: '鍏ㄥぉ', desc: '鐮旂┒鐢熷鑸? },
				{ id: 10, name: '鎿嶅満', latitude: 30.2550, longitude: 120.1310, type: 'playground', typeName: '杩愬姩鍦哄湴', openTime: '6:00 - 22:00', desc: '400绫虫爣鍑嗚窇閬擄紝瓒崇悆鍦? },
				{ id: 11, name: '浣撹偛棣?, latitude: 30.2540, longitude: 120.1300, type: 'sports', typeName: '浣撹偛棣?, openTime: '7:00 - 22:00', desc: '绡悆鍦恒€佺窘姣涚悆鍦恒€佹父娉抽' },
				{ id: 12, name: '瀹為獙妤?, latitude: 30.2555, longitude: 120.1295, type: 'lab', typeName: '瀹為獙妤?, openTime: '8:00 - 21:00', desc: '鐗╃悊銆佸寲瀛︺€佺敓鐗╁疄楠屽' },
				{ id: 13, name: '琛屾斂妤?, latitude: 30.2575, longitude: 120.1270, type: 'office', typeName: '琛屾斂妤?, openTime: '8:30 - 17:30', desc: '鏁欏姟澶勩€佸鐢熷銆佽储鍔″' },
				{ id: 14, name: '澶у鐢熸椿鍔ㄤ腑蹇?, latitude: 30.2558, longitude: 120.1285, type: 'activity', typeName: '娲诲姩涓績', openTime: '8:00 - 22:00', desc: '绀惧洟娲诲姩銆佹枃鑹烘紨鍑? }
			],

			// 蹇€熷畾浣嶅垎绫?			locationTypes: [
				{ name: '鏁欏妤?, type: 'teaching' },
				{ name: '鍥句功棣?, type: 'library' },
				{ name: '椋熷爞', type: 'canteen' },
				{ name: '瀹胯垗', type: 'dormitory' },
				{ name: '鎿嶅満', type: 'playground' },
				{ name: '浣撹偛棣?, type: 'sports' }
			],

			// 璺嚎瑙勫垝
			travelMode: 'walk',
			startPoint: null,
			startPointName: '褰撳墠浣嶇疆',
			endPoint: null,
			endPointName: '閫夋嫨鐩殑鍦?,
			waypoints: [],
			polyline: [],
			routeDistance: 0,
			routeFromAPI: false,
			routeSteps: [],       // 楂樺痉API杩斿洖鐨勮矾娈靛垎娈垫暟鎹?			currentStepIndex: 0,  // 褰撳墠鎵€鍦ㄨ矾娈电储寮?
			// 璇煶瀵艰埅
			voiceEnabled: true,
			lastVoiceDir: '',
			voiceCooldown: false,
			_ttsEngine: null,
			_ttsReady: false,

			// 寮圭獥鎺у埗
			showDetail: false,
			selectedPlace: {},
			showPlacePicker: false,
			pickerTitle: '',
			pickerTarget: '',

			// 鍦板浘灏哄锛堝姩鎬佽幏鍙栧睆骞曞搴︼級
			mapWidth: 350,
			mapHeight: 250,

			// 鍦板浘涓婁笅鏂?			mapCtx: null,

			// 鍐呯疆瀵艰埅鐘舵€?			isNavigating: false,
			navStartTime: null,
			navTimer: null,

			// 瀵艰埅鏈濆悜锛堟寚鍗楅拡锛?			userHeading: 0,
			lastBearing: 0,
			compassListening: false,

			// 鍦板浘鏃嬭浆/鍊炬枩
			mapRotate: 0,
			mapSkew: 0,

			// 瀵艰埅鏂瑰悜鎸囧紩
			navDirIcon: '猬?,
			navDirText: '鐩磋'
		}
	},
	computed: {
		// 鐢熸垚鍦板浘鏍囪鐐癸紙浣跨敤鍐呯疆鍥炬爣 + callout锛?		markers() {
			const list = this.campusLocations.map(place => {
				return {
					id: place.id,
					latitude: place.latitude,
					longitude: place.longitude,
					title: place.name,
					iconPath: '/static/marker-' + (this.markerIconMap[place.type] || place.type) + '.png',
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

			// 濡傛灉鏈夌湡瀹炲畾浣嶏紝娣诲姞"鎴戠殑浣嶇疆"钃濊壊鏍囪
			if (this.hasRealLocation) {
				list.push({
					id: 999,
					latitude: this.myLatitude,
					longitude: this.myLongitude,
					iconPath: '/static/marker-mylocation.png',
					width: 36,
					height: 36,
					callout: {
						content: '鎴戠殑浣嶇疆',
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
		// 棰勪及鏃堕棿
		routeTime() {
			if (this.routeDistance <= 0) return 0
			const speed = this.travelMode === 'walk' ? 80 : 250
			return Math.ceil(this.routeDistance / speed)
		},
		// 鏂瑰悜鎻愮ず
		directionHint() {
			if (!this.hasRealLocation || !this.endPoint) return ''
			const dLat = this.endPoint.latitude - this.myLatitude
			const dLng = this.endPoint.longitude - this.myLongitude
			const angle = Math.atan2(dLng, dLat) * 180 / Math.PI
			const dirs = ['鍖?, '涓滃寳', '涓?, '涓滃崡', '鍗?, '瑗垮崡', '瑗?, '瑗垮寳']
			const idx = Math.round(((angle + 360) % 360) / 45) % 8
			return dirs[idx]
		},
		// 鐩湴鏂逛綅瑙?		targetBearing() {
			if (!this.hasRealLocation || !this.endPoint) return 0
			const dLat = this.endPoint.latitude - this.myLatitude
			const dLng = this.endPoint.longitude - this.myLongitude
			return Math.atan2(dLng, dLat) * 180 / Math.PI
		}
	},
	onLoad() {
		// 鍔ㄦ€佽幏鍙栧睆骞曞昂瀵革紝璁剧疆鍦板浘绮剧‘瀹藉害锛堣В鍐冲湴鍥惧彸渚х己澶遍棶棰橈級
		const sysInfo = uni.getSystemInfoSync()
		this.mapWidth = sysInfo.windowWidth
		this.mapHeight = Math.round(sysInfo.windowWidth * 0.65) + (sysInfo.statusBarHeight || 0)
		// 鑾峰彇鍦板浘涓婁笅鏂?		this.mapCtx = uni.createMapContext('campusMap', this)
		// 鍔犺浇瀛︽牎璁よ瘉鏁版嵁锛岃缃牎鍥缓绛?		this.loadSchoolData()
		// 椤甸潰鍔犺浇鏃惰幏鍙栫湡瀹炰綅缃?		this.getMyLocation()
	},
	onShow() {
		// 浠庤璇侀〉闈㈣繑鍥炴椂閲嶆柊鍔犺浇瀛︽牎鏁版嵁
		this.loadSchoolData()
	},
	methods: {
		// ==================== 瀛︽牎鏁版嵁鍔犺浇 ====================
		loadSchoolData() {
			try {
				const userStore = useUserStore()
				userStore.initFromStorage()
				if (userStore.verified) {
					// data already parsed in userStore
					if (userStore.schoolName) {
						this.verifiedSchoolName = userStore.schoolName
						const schoolData = getSchoolLocations(userStore.schoolName)
						if (schoolData) {
							this.campusLocations = schoolData.locations
							this.locationTypes = schoolData.locationTypes
							this.centerLat = schoolData.center.lat
							this.centerLng = schoolData.center.lng
							uni.showToast({
								title: '宸插姞杞姐€? + userStore.schoolName + '銆嶆牎鍥暟鎹?,
								icon: 'none'
							})
							return
						}
					}
				}
			} catch (e) {
				console.log('鍔犺浇瀛︽牎鏁版嵁澶辫触:', e)
			}
			// 鏈璇佹垨鏈壘鍒板鏍℃暟鎹紝浣跨敤榛樿鏁版嵁
			this.verifiedSchoolName = ''
			const defaultData = getDefaultLocations()
			this.campusLocations = defaultData.locations
			this.locationTypes = defaultData.locationTypes
			this.centerLat = defaultData.center.lat
			this.centerLng = defaultData.center.lng
		},

		// ==================== 鍔熻兘1: 鐪熷疄GPS瀹氫綅 ====================
		getMyLocation() {
			this.locationLoading = true
			uni.getLocation({
				type: 'gcj02',
				success: (res) => {
					this.myLatitude = res.latitude
					this.myLongitude = res.longitude
					this.hasRealLocation = true
					this.locationLoading = false
					console.log('瀹氫綅鎴愬姛(gcj02):', this.myLatitude, this.myLongitude)
				},
				fail: (err) => {
					console.log('瀹氫綅澶辫触:', JSON.stringify(err))
					this.locationLoading = false
					uni.showToast({
						title: '瀹氫綅澶辫触锛岃妫€鏌ユ潈闄愬拰GPS',
						icon: 'none'
					})
				}
			})
		},

		// WGS84 杞?GCJ02 鍧愭爣绯?		wgs84ToGcj02(lat, lng) {
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

		// 绉诲姩鍒版垜鐨勪綅缃?		moveToMyLocation() {
			if (this.hasRealLocation) {
				this.centerLat = this.myLatitude
				this.centerLng = this.myLongitude
				this.mapScale = 17
				// 绉诲姩鍦板浘鍒版垜鐨勪綅缃?				this.mapCtx.moveToLocation({
					latitude: this.myLatitude,
					longitude: this.myLongitude,
					success: () => {
						uni.showToast({ title: '宸插畾浣嶅埌褰撳墠浣嶇疆', icon: 'none' })
					}
				})
			} else {
				// 娌℃湁鐪熷疄瀹氫綅鏃讹紝鍥炲埌鏍″洯涓績骞堕噸鏂板皾璇曡幏鍙?				this.mapScale = 16
				uni.showToast({ title: '姝ｅ湪閲嶆柊鑾峰彇浣嶇疆...', icon: 'none' })
				this.getMyLocation()
			}
		},

		// 閫夋嫨"鎴戠殑浣嶇疆"浣滀负璧风偣
		pickMyLocation() {
			if (!this.hasRealLocation) return
			this.startPoint = {
				latitude: this.myLatitude,
				longitude: this.myLongitude,
				name: '鎴戠殑浣嶇疆'
			}
			this.startPointName = '鎴戠殑浣嶇疆'
			this.showPlacePicker = false
			this.calculateRoute()
		},

		// ==================== 鍔熻兘2: 鑵捐鍦板浘璺嚎瑙勫垝 ====================
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

			// 浼樺厛灏濊瘯楂樺痉鍦板浘 API锛屽啀灏濊瘯鑵捐鍦板浘 API锛屾渶鍚庝娇鐢ㄦ湰鍦版ā鎷?			let apiSuccess = await this.fetchAmapRoute(startLat, startLng, endLat, endLng)
			if (!apiSuccess) {
				apiSuccess = await this.fetchTencentRoute(startLat, startLng, endLat, endLng)
			}

			if (!apiSuccess || !this.routeFromAPI) {
				// API 澶辫触鎴栨湭杩斿洖鏈夋晥璺嚎鏃朵娇鐢ㄦ湰鍦版ā鎷?				this.routeFromAPI = false
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
				// API 鎴愬姛鏃朵篃璋冩暣瑙嗗浘
				this.fitRouteView(this.polyline[0].points)
			}
		},

		// 澶勭悊鑵捐鍦板浘 API 鍝嶅簲锛堢粺涓€瑙ｆ瀽閫昏緫锛?		_handleTencentRouteResponse(res, startLat, startLng, endLat, endLng) {
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
						// 楠岃瘉璺嚎缁堢偣鏄惁鎺ヨ繎鐩爣鐐?						const lastPt = points[points.length - 1]
						const endpointDist = this.calcDistance(lastPt.latitude, lastPt.longitude, endLat, endLng)
						if (endpointDist > 500) {
							console.warn('API璺嚎缁堢偣杩滅鐩爣锛? + Math.round(endpointDist) + '绫筹級锛屼娇鐢ㄦ湰鍦拌矾绾?)
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
						// polyline 瑙ｆ瀽鍚庢棤鏈夋晥鐐?					}
				}
			}
			return false
		},

		// 璋冪敤楂樺痉鍦板浘姝ヨ璺嚎瑙勫垝 API锛堜紭鍏堜娇鐢級
		fetchAmapRoute(startLat, startLng, endLat, endLng) {
			return new Promise((resolve) => {
				if (!AMAP_KEY) {
					resolve(false)
					return
				}
				// 楂樺痉 API 鍧愭爣绯讳负 gcj02锛屼笌鎴戜滑鐨勫潗鏍囦竴鑷?				let url = `https://restapi.amap.com/v3/direction/walking?origin=${startLng},${startLat}&destination=${endLng},${endLat}&key=${AMAP_KEY}&extensions=all&strategy=2`
				// 娣诲姞閫旂粡鐐癸紙楂樺痉鏍煎紡锛氱粡搴?绾害;缁忓害,绾害锛?				if (this.waypoints.length > 0) {
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
								// 淇濆瓨璺鍒嗘鏁版嵁鐢ㄤ簬瀵艰埅鎸囧紩
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
									// 楠岃瘉缁堢偣
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
							console.log('楂樺痉API瑙ｆ瀽澶辫触:', e)
						}
						resolve(false)
					},
					fail: () => {
						resolve(false)
					}
				})
			})
		},

		// 璋冪敤鑵捐鍦板浘璺嚎瑙勫垝 API锛堢背绾х簿搴︼級
		// H5 骞冲彴浣跨敤 JSONP 閬垮厤 CORS锛孉pp/灏忕▼搴忎娇鐢?uni.request
		fetchTencentRoute(startLat, startLng, endLat, endLng) {
			return new Promise((resolve) => {
				if (!TENCENT_MAP_KEY || TENCENT_MAP_KEY === 'YOUR_TENCENT_MAP_KEY') {
					console.log('鏈厤缃吘璁湴鍥続PI Key锛屼娇鐢ㄦ湰鍦版ā鎷熻矾绾?)
					resolve(false)
					return
				}

				// 浼樺厛浣跨敤椹捐溅 API 鑾峰彇璺嚎锛坧olyline 鏁版嵁鏇村彲闈狅級锛屾琛?楠戣鍏辩敤
				const baseUrl = `https://apis.map.qq.com/ws/direction/v1/driving/?from=${startLat},${startLng}&to=${endLat},${endLng}&key=${TENCENT_MAP_KEY}&output=json&get_polyline=1`
				const sysInfo = uni.getSystemInfoSync()
				const isH5 = sysInfo.platform === 'h5'

				if (isH5 && typeof document !== 'undefined') {
					// H5 骞冲彴锛氫娇鐢?JSONP 閬垮厤 CORS
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
					// App / 灏忕▼搴忓钩鍙帮細鐩存帴浣跨敤 uni.request
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

		// 缁熶竴瑙ｆ瀽 polyline锛堟敮鎸佸绉嶆牸寮忥級
		parsePolyline(poly) {
			if (!poly) return []
			// 鏍煎紡1锛氭暟缁?			if (Array.isArray(poly)) {
				// 瀛愭牸寮?a锛氬璞℃暟缁?[{lat, lng}, ...] 鎴?[{latitude, longitude}, ...]
				if (poly.length > 0 && typeof poly[0] === 'object') {
					return poly.map(p => ({
						lat: p.lat || p.latitude,
						lng: p.lng || p.longitude
					}))
				}
				// 瀛愭牸寮?b锛氬樊鍒嗙紪鐮佺殑鏁板瓧鏁扮粍 [startLat, startLng, dLat1, dLng1, ...]
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
				// 瀛愭牸寮?c锛氬瓧绗︿覆鏁扮粍 ["lat,lng;lat,lng", ...]
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
			// 鏍煎紡2锛氬瓧绗︿覆 鈥?鍒嗗彿鍒嗛殧鐨勫潗鏍囧 "lat,lng;lat,lng;..."
			if (typeof poly === 'string') {
				// 鍘婚櫎棣栧熬绌虹櫧
				const trimmed = poly.trim()
				if (trimmed.length === 0) return []
				// 妫€鏌ユ槸鍚﹀寘鍚€楀彿锛堝潗鏍囧垎闅旂锛?				if (trimmed.includes(',')) {
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
				// Google Polyline 缂栫爜瀛楃涓?				return this.decodeGooglePolyline(trimmed)
			}
			return []
		},

		// 瑙ｆ瀽楂樺痉鍦板浘 polyline锛堟牸寮忥細缁忓害,绾害;缁忓害,绾害;...锛?		parseAmapPolyline(poly) {
			if (!poly) return []
			if (typeof poly === 'string') {
				const trimmed = poly.trim()
				if (trimmed.length === 0) return []
				const points = []
				// 楂樺痉 polyline 鍙兘鐢?";" 鎴?"|" 鍒嗛殧澶氫釜娈?				const segments = trimmed.split('|')
				segments.forEach(seg => {
					const pairs = seg.split(';')
					pairs.forEach(pair => {
						const parts = pair.split(',')
						if (parts.length >= 2) {
							// 楂樺痉鏍煎紡锛氱粡搴﹀湪鍓嶏紝绾害鍦ㄥ悗
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
			// 濡傛灉鏄暟缁勶紝鎸夐€氱敤鏍煎紡瑙ｆ瀽
			return this.parsePolyline(poly)
		},

		// 瑙ｇ爜 Google Polyline Algorithm 缂栫爜
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

		// 鍒囨崲鍑鸿鏂瑰紡鏃堕噸鏂拌绠楄矾绾?		switchMode(mode) {
			this.travelMode = mode
			if (this.startPoint && this.endPoint) {
				this.calculateRoute()
			}
		},

		// ==================== 鍔熻兘3: 鏍囪鍥炬爣鐢熸垚 ====================
		// 鐢熸垚鏍囪鍥炬爣锛堣繍琛屾椂 canvas 鐢熸垚锛屾棤闇€澶栭儴 PNG 鏂囦欢锛?		generateMarkerIcons() {
			// uni-app 鐨?map 缁勪欢闇€瑕?iconPath 鎸囧悜鏈夋晥鐨勫浘鐗囪矾寰?			// 鍦?App 绔紝鎴戜滑浣跨敤 plus.io 鍐欏叆鏈湴鏂囦欢
			// 鍦?H5 绔紝浣跨敤 canvas 鐢熸垚 data URL
			// 杩欓噷鎻愪緵涓€涓檷绾ф柟妗堬細濡傛灉 PNG 鏂囦欢涓嶅瓨鍦紝map 缁勪欢浼氫娇鐢ㄩ粯璁ょ孩鑹插浘鏍?			// 寤鸿鍦ㄩ」鐩瀯寤烘椂杩愯 static/gen_markers.py 鐢熸垚鍥炬爣鏂囦欢
		},

		// ==================== 鍘熸湁鍔熻兘 ====================
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
			this.pickerTitle = '閫夋嫨璧风偣'
			this.pickerTarget = 'start'
			this.showPlacePicker = true
		},

		selectEndPoint() {
			this.pickerTitle = '閫夋嫨鐩殑鍦?
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
			this.pickerTitle = '閫夋嫨閫旂粡鐐?
			this.pickerTarget = 'waypoint'
			this.showPlacePicker = true
		},

		removeWaypoint(idx) {
			this.waypoints.splice(idx, 1)
			this.calculateRoute()
		},

		// 鏈湴妯℃嫙璺嚎锛堢粫寮€寤虹瓚锛屾ā鎷熺湡瀹為亾璺級
		generateRoutePoints(startLat, startLng, endLat, endLng) {
			const dLat = endLat - startLat
			const dLng = endLng - startLng
			const totalDist = Math.sqrt(dLat * dLat + dLng * dLng)

			if (totalDist < 0.00001) {
				return [{ latitude: startLat, longitude: startLng }, { latitude: endLat, longitude: endLng }]
			}

			// 纭畾鎬т吉闅忔満锛堝潗鏍囦笉鍙樺垯璺嚎涓嶅彉锛?			const hash = Math.sin(startLat * 127.1 + startLng * 311.7 + endLat * 74.7 + endLng * 157.3) * 43758.5453
			const seed = hash - Math.floor(hash)

			// 鐢熸垚鍒濆骞虫粦鏇茬嚎锛堜粠璧风偣鍒扮粓鐐圭殑鑷劧寮х嚎锛?			const numCtrlPts = 5
			const ctrlPts = []
			// 寮у害闅忚窛绂昏嚜閫傚簲锛氱煭璺濈灏忓姬搴︼紝闀胯窛绂婚€傚綋澶у姬搴?			const maxArcOffset = Math.min(totalDist * 0.12, 0.00025)
			for (let i = 0; i < numCtrlPts; i++) {
				const t = i / (numCtrlPts - 1)
				let lat = startLat + dLat * t
				let lng = startLng + dLng * t
				// 娣诲姞鍨傜洿鏂瑰悜鐨勫姬搴﹀亸绉?				const perpMag = Math.sin(t * Math.PI) * maxArcOffset
				const side = (seed > 0.5 ? 1 : -1)
				lat += (-dLng / totalDist) * perpMag * side
				lng += (dLat / totalDist) * perpMag * side
				ctrlPts.push({ lat, lng })
			}

			// 鐢?Catmull-Rom 鏍锋潯鐢熸垚鍒濆璺緞鐐?			const rawPts = []
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

			// 寤虹瓚鐗╅伩璁╋細灏嗙┛杩囧缓绛戠殑璺緞鐐规帹鍒板缓绛戝渚?			const buildingSafeRadius = 0.00018  // 绾?20 绫冲畨鍏ㄨ窛绂?			const pushDistance = 0.00022  // 鎺ㄥ紑璺濈绾?25 绫?
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
				// 姣忔鎺ㄥ畬鍚庣◢寰钩婊戯紝闃叉璺緞閿娇
				for (let i = 1; i < rawPts.length - 1; i++) {
					rawPts[i].lat = rawPts[i].lat * 0.7 + (rawPts[i - 1].lat + rawPts[i + 1].lat) * 0.15
					rawPts[i].lng = rawPts[i].lng * 0.7 + (rawPts[i - 1].lng + rawPts[i + 1].lng) * 0.15
				}
			}

			// 鍥哄畾璧风偣鍜岀粓鐐?			rawPts[0] = { lat: startLat, lng: startLng }
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
			// 鏍规嵁璺ㄥ害璁＄畻鍚堥€傜殑缂╂斁绾у埆
			const latSpan = maxLat - minLat
			const lngSpan = maxLng - minLng
			const maxSpan = Math.max(latSpan, lngSpan)
			const spanInMeters = maxSpan * 111000
			let scale = 19 - Math.log2(spanInMeters / 800)
			this.mapScale = Math.max(3, Math.min(19, Math.round(scale)))
		},

		async startNavigation() {
			if (!this.endPoint) return
			// 纭畾璧风偣
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

			// 浼樺厛灏濊瘯鑵捐鍦板浘 API 鑾峰彇绫崇骇绮惧害璺嚎
			let apiSuccess = await this.fetchAmapRoute(startLat, startLng, this.endPoint.latitude, this.endPoint.longitude)
			if (!apiSuccess) {
				apiSuccess = await this.fetchTencentRoute(startLat, startLng, this.endPoint.latitude, this.endPoint.longitude)
			}

			if (!apiSuccess || !this.routeFromAPI) {
				// API 澶辫触鏃朵娇鐢ㄦ湰鍦版ā鎷熻矾绾?				const points = this.generateRoutePoints(startLat, startLng, this.endPoint.latitude, this.endPoint.longitude)
				this.polyline = [
					{ points: points, color: 'rgba(67,97,238,0.25)', width: 8, arrowLine: false },
					{ points: points, color: '#4361ee', width: 3, arrowLine: true }
				]
			}
			// 瀵艰埅妯″紡涓嬶紝鍦板浘浠ヨ捣鐐癸紙鐢ㄦ埛浣嶇疆锛変负涓績
			this.centerLat = startLat
			this.centerLng = startLng
			// 鏍规嵁璺嚎璺濈璁剧疆鍚堥€傜殑缂╂斁绾у埆
			const distToDest = this.calcDistance(startLat, startLng, this.endPoint.latitude, this.endPoint.longitude)
			if (distToDest > 3000) this.mapScale = 14
			else if (distToDest > 1000) this.mapScale = 15
			else if (distToDest > 500) this.mapScale = 16
			else if (distToDest > 200) this.mapScale = 17
			else this.mapScale = 18
			// 璁＄畻鍒濆璺濈
			if (this.hasRealLocation) {
				this.routeDistance = this.calcDistance(startLat, startLng, this.endPoint.latitude, this.endPoint.longitude)
			}
			// 寮€鍚唴缃鑸ā寮?			this.isNavigating = true
			this.navStartTime = Date.now()
			this.lastVoiceDir = ''
			this.currentStepIndex = 0
			this._distToTurn = 0
			this._nextAction = ''
			this._nextInstruction = ''
			this._spokenSteps = ''
			// 璁剧疆鍦板浘鍊炬枩鏁堟灉锛堟ā鎷?D瀵艰埅瑙嗚锛?			this.mapSkew = 40
			// 鏇存柊瀵艰埅鎸囧紩
			this.updateNavDirection()
			// 寤惰繜寮€鍚寚鍗楅拡锛屽厛璁╃敤鎴风湅鍒版纭殑璺嚎鏂瑰悜
			setTimeout(() => {
				this.startCompass()
			}, 1500)
			this.navTimer = setInterval(async () => {
				if (this.hasRealLocation && this.endPoint) {
					// 瀹炴椂璁＄畻鍓╀綑璺濈
					this.routeDistance = this.calcDistance(
						this.myLatitude, this.myLongitude,
						this.endPoint.latitude, this.endPoint.longitude
					)
					// 闈?API 璺嚎鏃讹紝閲嶆柊鐢熸垚鏈湴妯℃嫙璺嚎
					if (!this.routeFromAPI) {
						const newPoints = this.generateRoutePoints(this.myLatitude, this.myLongitude, this.endPoint.latitude, this.endPoint.longitude)
						this.polyline = [
							{ points: newPoints, color: 'rgba(67,97,238,0.25)', width: 8, arrowLine: false },
							{ points: newPoints, color: '#4361ee', width: 3, arrowLine: true }
						]
					}
					// 绉诲姩鍦板浘鍒板綋鍓嶄綅缃?					this.centerLat = this.myLatitude
					this.centerLng = this.myLongitude
					this.mapScale = 17
					// 鏇存柊瀵艰埅鏂瑰悜鎸囧紩
					this.updateNavDirection()
					// 璺熻釜褰撳墠璺
					this.updateCurrentStep()
					// 鍒拌揪鐩殑鍦帮紙50绫冲唴锛?					if (this.routeDistance < 50) {
						this.stopNavigation()
						this.speak('宸插埌杈剧洰鐨勫湴')
						uni.showToast({ title: '宸插埌杈剧洰鐨勫湴锛?, icon: 'success' })
					}
				}
			}, 3000)
			uni.showToast({ title: '瀵艰埅宸插紑濮?, icon: 'none' })
			// 璇煶鎾姤寮€濮嬪鑸?			this.speak(`瀵艰埅寮€濮嬶紝鍓嶆柟绾?{Math.round(this.routeDistance)}绫冲埌杈?{this.endPointName}`)
		},

		stopNavigation() {
			this.isNavigating = false
			this.routeDistance = 0
			this.routeSteps = []
			this.currentStepIndex = 0
			this.polyline = []
			// 鎭㈠鍦板浘瑙嗚
			this.mapSkew = 0
			this.mapRotate = 0
			// 鍋滄鎸囧崡閽?			this.stopCompass()
			if (this.navTimer) {
				clearInterval(this.navTimer)
				this.navTimer = null
			}
		},

		// ==================== 鎸囧崡閽堜笌瀵艰埅鏂瑰悜 ====================
		startCompass() {
			if (this.compassListening) return
			this.compassListening = true
			uni.onCompassChange((res) => {
				if (!this.isNavigating) return
				this.userHeading = res.direction
				// 鍦板浘鏈濆悜璺熼殢鎵嬫満鏈濆悜
				this.mapRotate = -res.direction
				// 鏇存柊瀵艰埅鏂瑰悜鎸囧紩鍥炬爣
				this.updateNavDirection()
			})
		},

		stopCompass() {
			this.compassListening = false
			uni.stopCompass()
		},

		resetNavHeading() {
			// 閲嶇疆鍦板浘鏈濆悜涓烘鍖?			this.mapRotate = 0
			if (this.hasRealLocation) {
				this.centerLat = this.myLatitude
				this.centerLng = this.myLongitude
			}
		},

		updateNavDirection() {
			if (!this.hasRealLocation || !this.endPoint) return
			// 璁＄畻鐩爣鏂逛綅瑙掞紙鐩稿鎵嬫満鏈濆悜锛?			const bearing = this.targetBearing
			const relativeAngle = ((bearing - this.userHeading) + 360) % 360

			// 鏍规嵁鐩稿瑙掑害閫夋嫨鏂瑰悜鍥炬爣鍜屾枃瀛?			if (relativeAngle >= 337.5 || relativeAngle < 22.5) {
				this.navDirIcon = '猬?
				this.navDirText = '鐩磋'
			} else if (relativeAngle >= 22.5 && relativeAngle < 67.5) {
				this.navDirIcon = '鈫?
				this.navDirText = '鍙冲墠鏂?
			} else if (relativeAngle >= 67.5 && relativeAngle < 112.5) {
				this.navDirIcon = '鉃?
				this.navDirText = '鍙宠浆'
			} else if (relativeAngle >= 112.5 && relativeAngle < 157.5) {
				this.navDirIcon = '鈫?
				this.navDirText = '鍙冲悗鏂?
			} else if (relativeAngle >= 157.5 && relativeAngle < 202.5) {
				this.navDirIcon = '猬?
				this.navDirText = '鎺夊ご'
			} else if (relativeAngle >= 202.5 && relativeAngle < 247.5) {
				this.navDirIcon = '鈫?
				this.navDirText = '宸﹀悗鏂?
			} else if (relativeAngle >= 247.5 && relativeAngle < 292.5) {
				this.navDirIcon = '猬?
				this.navDirText = '宸﹁浆'
			} else {
				this.navDirIcon = '鈫?
				this.navDirText = '宸﹀墠鏂?
			}
			// 鏂瑰悜鍙樺寲鏃惰闊虫挱鎶?			this.speakNavDirection()
		},

		// ==================== 璇煶瀵艰埅 ====================
		toggleVoice() {
			this.voiceEnabled = !this.voiceEnabled
			if (this.voiceEnabled) {
				this.speak('瀵艰埅宸插紑鍚?)
			}
		},

		// 鍒濆鍖?TTS锛堥€氳繃 webview 浣跨敤娴忚鍣?Web Speech API锛?		_initTTS() {
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
				console.log('TTS webview 宸插垱寤?)
			} catch (e) {
				console.log('TTS webview 鍒涘缓澶辫触:', e)
			}
		},

		speak(text) {
			if (!this.voiceEnabled || this.voiceCooldown) return
			this.voiceCooldown = true
			setTimeout(() => { this.voiceCooldown = false }, 5000)
			try {
				// APP 绔細Android 鍘熺敓 TTS锛堢敤 invoke 璋冪敤鏂规硶锛?				if (typeof plus !== 'undefined' && plus.android) {
					const invoke = plus.android.invoke
					if (!this._ttsEngine) {
						const self = this
						try {
							const ctx = plus.android.runtimeMainActivity().getApplicationContext()
							// 涓嶄紶鍥炶皟锛岄伩鍏嶉樆濉炲垵濮嬪寲
							this._ttsEngine = plus.android.newObject('android.speech.tts.TextToSpeech', ctx, null)
							console.log('TTS 寮曟搸瀵硅薄宸插垱寤?)
						} catch (e1) {
							console.log('TTS 鍒涘缓澶辫触:', e1)
						}
						// 杞 + invoke(setLanguage) 鍒ゆ柇灏辩华
						if (this._ttsEngine) {
							const Locale = plus.android.importClass('java.util.Locale')
							let count = 0
							const check = setInterval(function() {
								count++
								try {
									// 鍏堟鏌ヨ瑷€鍙敤鎬?									const avail = invoke(self._ttsEngine, 'isLanguageAvailable', Locale.getDefault())
									console.log('TTS isLanguageAvailable:', avail, '绗? + count + '娆?)
									// 鍐嶈缃瑷€
									const r = invoke(self._ttsEngine, 'setLanguage', Locale.getDefault())
									console.log('TTS setLanguage result:', r)
									if (r >= 0 || avail >= 0) {
										clearInterval(check)
										self._ttsReady = true
										console.log('TTS 灏辩华! 寮€濮嬫挱鎶?', text)
										invoke(self._ttsEngine, 'speak', text, 0, null)
									} else if (count >= 5) {
										clearInterval(check)
										console.log('TTS 璇█涓嶆敮鎸? 浣犵殑TTS寮曟搸( Accessibility Engine)鍙兘涓嶅吋瀹规爣鍑咥PI')
										uni.showToast({ title: '褰撳墠TTS寮曟搸涓嶅吋瀹癸紝璇峰畨瑁匞oogle TTS鎴栬椋炶璁?, icon: 'none', duration: 5000 })
									}
								} catch (e2) {
									console.log('TTS setLanguage 寮傚父:', e2)
									if (count >= 5) clearInterval(check)
								}
							}, 500)
						}
						return
					}
					if (this._ttsReady) {
						console.log('TTS 鐩存帴鎾姤:', text)
						invoke(this._ttsEngine, 'speak', text, 0, null)
						return
					}
					console.log('TTS 寮曟搸灏氭湭灏辩华')
				}
				// H5 绔?				if (typeof window !== 'undefined' && window.speechSynthesis) {
					window.speechSynthesis.cancel()
					const u = new SpeechSynthesisUtterance(text)
					u.lang = 'zh-CN'
					u.rate = 1.1
					window.speechSynthesis.speak(u)
					return
				}
				console.log('璇煶鎾姤锛堟枃瀛楋級:', text)
			} catch (e) {
				console.log('璇煶鎾姤澶辫触:', e)
			}
		},

		// 璺熻釜褰撳墠璺锛岃绠楀埌涓嬩竴杞集鐐圭殑璺濈
		updateCurrentStep() {
			if (!this.routeSteps || this.routeSteps.length === 0) return
			const lat = this.myLatitude
			const lng = this.myLongitude
			// 鎵惧埌鐢ㄦ埛褰撳墠鎵€鍦ㄧ殑璺
			for (let i = this.currentStepIndex; i < this.routeSteps.length; i++) {
				const step = this.routeSteps[i]
				if (!step.points || step.points.length === 0) continue
				// 妫€鏌ョ敤鎴锋槸鍚﹀凡缁忛€氳繃浜嗚繖涓矾娈电殑缁堢偣
				const lastPt = step.points[step.points.length - 1]
				const distToEnd = this.calcDistance(lat, lng, lastPt.latitude, lastPt.longitude)
				// 濡傛灉绂诲綋鍓嶈矾娈电粓鐐瑰緢杩戯紙30绫冲唴锛夛紝鍒囨崲鍒颁笅涓€璺
				if (distToEnd < 30 && i < this.routeSteps.length - 1) {
					this.currentStepIndex = i + 1
					continue
				}
				// 鐢ㄦ埛鍦ㄥ綋鍓嶈矾娈典腑锛岃绠楀埌璺缁堢偣鐨勮窛绂?				this.currentStepIndex = i
				// 璁＄畻鍒板綋鍓嶈矾娈电粓鐐癸紙鍗充笅涓€涓浆寮偣锛夌殑璺濈
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
				// 濡傛灉涓嶆槸鏈€鍚庝竴涓矾娈碉紝distToTurn 灏辨槸鍒颁笅涓€涓浆寮殑璺濈
				// 濡傛灉鏄渶鍚庝竴涓矾娈碉紝灏辨槸鍒扮洰鐨勫湴鐨勮窛绂?				if (i < this.routeSteps.length - 1) {
					// 鍒板綋鍓嶈矾娈电粓鐐圭殑璺濈 = 鍒颁笅涓€涓浆寮偣鐨勮窛绂?					const endPt = step.points[step.points.length - 1]
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
			// 浼樺厛浣跨敤璺淇℃伅
			if (this.routeSteps && this.routeSteps.length > 0) {
				const dist = this._distToTurn || this.routeDistance
				const nextAction = this._nextAction || ''
				const step = this.routeSteps[this.currentStepIndex]
				const curAction = step ? (step.action || '') : ''
				// 鐢熸垚鎾姤鏂囧瓧
				let text = ''
				if (dist < 50) {
					if (nextAction) {
						text = `鍗冲皢${nextAction}`
					} else {
						text = '鍗冲皢鍒拌揪鐩殑鍦?
					}
				} else if (dist < 200 && nextAction) {
					text = `鍓嶆柟${Math.round(dist)}绫?{nextAction}`
				} else if (curAction && curAction !== '鐩磋') {
					// 褰撳墠璺鏈夎浆鍚戝姩浣滄椂鎾姤
					const key = 'step_' + this.currentStepIndex
					if (this._spokenSteps !== key) {
						this._spokenSteps = key
						text = step.instruction || `${curAction}锛屽墠鏂?{Math.round(step.distance)}绫砢
					}
				} else if (this.navDirText !== this.lastVoiceDir) {
					// 娌℃湁璺淇℃伅鏃跺洖閫€鍒版柟浣嶈
					const dir = this.navDirText
					this.lastVoiceDir = dir
					if (dir === '鐩磋') {
						text = `鍓嶆柟${Math.round(dist)}绫崇洿琛宍
					} else {
						text = `${dir}锛屽墠鏂?{Math.round(dist)}绫砢
					}
				}
				if (text) this.speak(text)
				return
			}
			// 鍥為€€锛氫娇鐢ㄦ柟浣嶈
			const dir = this.navDirText
			if (dir === this.lastVoiceDir) return
			this.lastVoiceDir = dir
			const dist = this.routeDistance
			let text = ''
			if (dist < 50) {
				text = '鍗冲皢鍒拌揪鐩殑鍦?
			} else if (dir === '鐩磋') {
				text = `鍓嶆柟${Math.round(dist)}绫崇洿琛宍
			} else {
				text = `${dir}锛屽墠鏂?{Math.round(dist)}绫砢
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

/* 鍦板浘瀹瑰櫒 */
.map-wrapper {
	position: relative;
	width: 100%;
	overflow: visible;
}

/* 鐘舵€佹爮鍗犱綅 */
.nav-status-bar {
	height: var(--status-bar-height);
	width: 100%;
	position: absolute;
	top: 0;
	left: 0;
	z-index: 100;
	background: transparent;
}

/* 鍦板浘 - 瀹介珮鐢?JS 鍔ㄦ€佽缃?*/
.campus-map {
	display: block;
}
.nav-map {
	transition: none;
}

/* 瀹氫綅鎸夐挳 - cover-view 涓嶆敮鎸?backdrop-filter锛屼繚鎸佸疄鑹?*/
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

/* 瀹氫綅鎻愮ず */
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

/* 瀵艰埅鐘舵€佹爮 - 绮捐嚧娓愬彉 */
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

/* 瀵艰埅搴曢儴鎸囧紩闈㈡澘 - 纾ㄧ爞鐜荤拑 */
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

/* 鎸囧崡閽堟寜閽?*/
.compass-btn {
	bottom: 20rpx;
	right: 32rpx;
}
.compass-btn .btn-icon {
	font-size: 32rpx;
	display: inline-block;
	transition: transform 0.3s ease;
}

/* 瀵艰埅鏃跺洖鍒拌嚜宸变綅缃寜閽?*/
.nav-locate-btn {
	bottom: 110rpx;
	right: 32rpx;
}

/* 鍗＄墖 - 纾ㄧ爞鐜荤拑 */
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

/* 璺嚎 */
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

/* 璇︽儏寮圭獥 - 纾ㄧ爞鐜荤拑 */
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

/* 鍦扮偣閫夋嫨寮圭獥 */
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

