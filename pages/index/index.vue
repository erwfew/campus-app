<template>
	<view class="home-page">
		<!-- 自定义导航栏 -->
		<view class="custom-nav">
			<view class="nav-status-bar"></view>
			<view class="nav-title-bar">
				<text class="nav-title">效园通</text>
			</view>
		</view>

		<!-- 搜索栏 -->
		<view class="search-bar">
			<text class="search-icon">&#x1F50D;</text>
			<input class="search-input" placeholder="搜索地点、课程、功能..." />
		</view>

		<!-- 欢迎卡片 -->
		<view class="welcome-card">
			<view class="welcome-text">
				<text class="welcome-title">你好，同学 &#x1F44B;</text>
				<text class="welcome-desc">{{greeting}}</text>
			</view>
			<view class="mascot-area" @tap="onMascotTap">
				<view class="speech-bubble" v-if="showBubble">
					<text class="bubble-text">{{bubbleText}}</text>
				</view>
				<text class="mascot-mini" :class="{ 'mascot-tap': mascotAnimating }">{{mascotEmoji}}</text>
				<text class="mascot-label">{{mascotName}} Lv.{{mascotLevel}}</text>
			</view>
		</view>

		<!-- 快捷功能 -->
		<view class="quick-functions">
			<view class="function-item" @tap="goNav">
				<view class="function-icon nav-icon">
					<text class="func-emoji">&#x1F4CD;</text>
				</view>
				<text class="func-label">校园导航</text>
			</view>
			<view class="function-item" @tap="goStudy">
				<view class="function-icon study-icon">
					<text class="func-emoji">&#x1F4DA;</text>
				</view>
				<text class="func-label">课程表</text>
			</view>
			<view class="function-item" @tap="goSport">
				<view class="function-icon sport-icon">
					<text class="func-emoji">&#x1F3C3;</text>
				</view>
				<text class="func-label">校园跑</text>
			</view>
			<view class="function-item" @tap="goCreative">
				<view class="function-icon creative-icon">
					<text class="func-emoji">&#x1F3A8;</text>
				</view>
				<text class="func-label">文创</text>
			</view>
		</view>

		<!-- 今日课程 -->
		<view class="section">
			<view class="section-header">
				<text class="section-title">今日课程</text>
				<text class="section-more" @tap="goStudy">查看全部</text>
			</view>
			<view class="course-list" v-if="todayCourses.length > 0">
				<view
					class="course-card"
					v-for="(course, index) in todayCourses"
					:key="index"
					:class="getCourseStatusClass(course)"
				>
					<view class="course-time-col">
						<text class="course-time-text">{{course.startTime || ('第' + course.startSection + '节')}}</text>
						<text class="course-time-text">{{course.endTime || ('第' + course.endSection + '节')}}</text>
					</view>
					<view class="course-info">
						<text class="course-name" :style="{color: course.color}">{{course.name}}</text>
						<text class="course-loc">{{course.location}} · {{course.teacher}}</text>
						<text class="course-status" :class="getCourseStatus(course)">{{getCourseStatusText(course)}}</text>
					</view>
				</view>
			</view>
			<view class="empty-course" v-else>
				<text class="empty-text">今天没有课程，快去导入课程吧</text>
				<text class="empty-link" @tap="goImport">去导入</text>
			</view>
		</view>

		<!-- 校园公告 -->
		<view class="section">
			<view class="section-header">
				<text class="section-title">校园公告</text>
				<text class="section-more" @tap="goNoticeList">更多</text>
			</view>
			<view class="notice-list" v-if="noticeList.length > 0">
				<view
					class="notice-item"
					v-for="(notice, index) in noticeList"
					:key="notice.id || index"
					@tap="goNoticeDetail(notice)"
				>
					<text class="notice-tag" :class="notice.tagType">{{notice.tag}}</text>
					<text class="notice-text">{{notice.title}}</text>
				</view>
			</view>
			<view class="empty-notice" v-else>
				<text class="empty-text">暂无公告</text>
			</view>
		</view>

		<!-- 自定义底部导航 -->
		<bottom-nav activeTab="/pages/index/index" />
	</view>
</template>

<script>
import BottomNav from '../../components/bottom-nav/bottom-nav.vue'

export default {
	components: { BottomNav },
	data() {
		return {
			mascotEmoji: '\u{1F431}',
			mascotName: '小喵',
			mascotLevel: 5,
			greeting: '今天有3节课，别忘了带课本哦',
			showBubble: false,
			bubbleText: '',
			mascotAnimating: false,
			bubbleTimer: null,
			todayCourses: [],
			todayIndex: 0,
			noticeList: []
		}
	},
	onShow() {
		this.loadMascotData()
		this.updateGreeting()
		this.loadTodayCourses()
		this.loadNotices()
	},
	methods: {
		loadMascotData() {
			try {
				const data = uni.getStorageSync('campus_mascot')
				if (data) {
					const m = JSON.parse(data)
					if (m.emoji) this.mascotEmoji = m.emoji
					if (m.name) this.mascotName = m.name
					if (m.level) this.mascotLevel = m.level
				}
			} catch (e) {}
		},
		loadTodayCourses() {
			this.todayIndex = (new Date().getDay() + 6) % 7 // 周日=0转为6
			try {
				const data = uni.getStorageSync('campus_courses')
				if (data) {
					const courses = JSON.parse(data)
					this.todayCourses = courses
						.filter(c => c.weekDay === this.todayIndex)
						.sort((a, b) => a.startSection - b.startSection)
				} else {
					this.todayCourses = []
				}
			} catch (e) {
				this.todayCourses = []
			}
		},
		_parseTime(timeStr) {
			if (!timeStr) return null
			const parts = timeStr.split(':')
			if (parts.length < 2) return null
			return parseInt(parts[0]) * 60 + parseInt(parts[1])
		},
		getCourseStatus(course) {
			const now = new Date()
			const nowMin = now.getHours() * 60 + now.getMinutes()
			const startMin = this._parseTime(course.startTime)
			const endMin = this._parseTime(course.endTime)
			if (startMin !== null && endMin !== null) {
				if (nowMin >= endMin) return 'done'
				if (nowMin >= startMin && nowMin < endMin) return 'going'
				return 'wait'
			}
			// 无时间数据时用节次估算（每节45分钟，8:00开始）
			const startEst = course.startSection ? (8 * 60 + (course.startSection - 1) * 45) : 0
			const endEst = course.endSection ? (8 * 60 + course.endSection * 45) : startEst + 45
			if (nowMin >= endEst) return 'done'
			if (nowMin >= startEst) return 'going'
			return 'wait'
		},
		getCourseStatusClass(course) {
			const status = this.getCourseStatus(course)
			if (status === 'done') return 'completed'
			if (status === 'going') return 'current'
			return 'upcoming'
		},
		getCourseStatusText(course) {
			const status = this.getCourseStatus(course)
			if (status === 'done') return '已上课'
			if (status === 'going') return '上课中'
			return '待上课'
		},
		updateGreeting() {
			const hour = new Date().getHours()
			const msgs = hour < 6
				? ['夜深了，早点休息哦', '还在熬夜吗？注意身体', '喵~我也困了']
				: hour < 9
					? ['早上好！新的一天开始啦', '早餐吃了吗？要吃饱哦', '今天也要加油喵~']
					: hour < 12
						? ['上午的课好好听哦', '别忘了带课本', '学习使我快乐喵']
						: hour < 14
							? ['午饭时间到！', '吃饱了才有力气学习', '午休一下也不错喵']
							: hour < 18
								? ['下午也要认真听课哦', '下课后去运动吧', '坚持就是胜利喵']
								: hour < 21
									? ['晚上去操场跑跑步吧', '今天辛苦了！', '放松一下喵~']
									: ['该复习今天的功课了', '早点休息明天才有精神', '晚安喵~']
			this.greeting = msgs[Math.floor(Math.random() * msgs.length)]
		},
		onMascotTap() {
			// 动画
			this.mascotAnimating = true
			setTimeout(() => { this.mascotAnimating = false }, 300)

			// 随机对话
			const talks = [
				'喵~ 你好呀！',
				'今天也要加油哦！',
				'一起去跑步吧！',
				'想我了吗？喵~',
				'我饿了，要小鱼干！',
				'摸摸头~ 喵！',
				'一起去图书馆？',
				'你今天跑了多少公里？',
				'喵呜~ 开心！',
				'别忘了喝水哦！'
			]
			this.bubbleText = talks[Math.floor(Math.random() * talks.length)]
			this.showBubble = true

			// 清除之前的定时器
			if (this.bubbleTimer) clearTimeout(this.bubbleTimer)
			this.bubbleTimer = setTimeout(() => { this.showBubble = false }, 2500)
		},
		goNav() { uni.switchTab({ url: '/pages/navigation/index' }) },
		goStudy() { uni.switchTab({ url: '/pages/study/index' }) },
		goSport() { uni.switchTab({ url: '/pages/sport/index' }) },
		goCreative() { uni.navigateTo({ url: '/pages/creative/index' }) },
		goImport() { uni.navigateTo({ url: '/pages/course/import' }) },
		loadNotices() {
			try {
				const cached = uni.getStorageSync('campus_notices')
				if (cached) {
					this.noticeList = JSON.parse(cached)
					return
				}
			} catch (e) {}
			// 本地默认数据
			this.noticeList = [
				{ id: 1, tag: '热门', tagType: 'hot', title: '图书馆本周六举办读书分享会', content: '图书馆将于本周六下午2点在三楼报告厅举办读书分享会，欢迎同学们踊跃参加。本次活动主题为"经典重读"，届时将有学长学姐分享读书心得。', date: '2026-03-28', author: '图书馆' },
				{ id: 2, tag: '新', tagType: 'new', title: '下周一全校停课一天通知', content: '接上级通知，因校园设施维护需要，下周一（3月30日）全校停课一天，请各学院做好教学调整安排。', date: '2026-03-27', author: '教务处' },
				{ id: 3, tag: '通知', tagType: 'info', title: '食堂新增窗口投票开始啦', content: '为了丰富同学们的用餐选择，食堂计划新增两个窗口，现面向全校同学征集意见。投票截止日期为4月5日，快来为你喜欢的美食投票吧！', date: '2026-03-26', author: '后勤处' }
			]
		},
		goNoticeList() {
			uni.navigateTo({ url: '/pages/notice/list' })
		},
		goNoticeDetail(notice) {
			uni.navigateTo({ url: '/pages/notice/detail?id=' + notice.id })
		}
	}
}
</script>

<style>
.home-page {
	padding-bottom: calc(20rpx + var(--safe-area-inset-bottom));
	background: linear-gradient(180deg, #4361ee 0%, #6b83f5 12%, #d4daff 28%, #e8ecff 50%, #f0f2ff 70%, #f5f6fa 100%);
	min-height: 100vh;
}

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

/* 搜索栏 - 磨砂玻璃模拟 */
.search-bar {
	display: flex;
	align-items: center;
	background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(245,248,255,0.9) 100%);
	margin: 20rpx 32rpx;
	padding: 22rpx 32rpx;
	border-radius: 50rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.8);
	box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.08), 0 1rpx 0 rgba(255, 255, 255, 0.9) inset;
	position: relative;
	overflow: hidden;
}
.search-bar::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 50%;
	background: linear-gradient(180deg, rgba(255,255,255,0.6), transparent);
	border-radius: 50rpx 50rpx 0 0;
	pointer-events: none;
}
.search-icon {
	font-size: 36rpx;
	margin-right: 16rpx;
}
.search-input {
	flex: 1;
	font-size: 28rpx;
	color: #1a1a2e;
	background: transparent;
	border: none;
	outline: none;
}
.search-input::placeholder {
	color: #999;
}

/* 欢迎卡片 - 精致渐变 */
.welcome-card {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin: 0 32rpx 32rpx;
	padding: 40rpx;
	background: linear-gradient(135deg, #4361ee, #6b83f5, #99aaff);
	border-radius: 28rpx;
	color: #ffffff;
	box-shadow: 0 16rpx 48rpx rgba(67, 97, 238, 0.4), inset 0 2rpx 0 rgba(255, 255, 255, 0.35);
	position: relative;
	overflow: hidden;
}
.welcome-card::before {
	content: '';
	position: absolute;
	top: -60%;
	right: -30%;
	width: 280rpx;
	height: 280rpx;
	background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
	border-radius: 50%;
}
.welcome-card::after {
	content: '';
	position: absolute;
	bottom: -50%;
	left: -20%;
	width: 200rpx;
	height: 200rpx;
	background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
	border-radius: 50%;
}
.welcome-title {
	font-size: 40rpx;
	font-weight: bold;
	display: block;
	margin-bottom: 10rpx;
}
.welcome-desc {
	font-size: 26rpx;
	opacity: 0.9;
}
/* 吉祥物区域 */
.mascot-area {
	display: flex;
	flex-direction: column;
	align-items: center;
	position: relative;
	z-index: 1;
}
.mascot-mini {
	font-size: 96rpx;
	animation: bounce 2s ease infinite;
	transition: transform 0.15s;
}
.mascot-tap {
	animation: tapBounce 0.3s ease !important;
}
@keyframes bounce {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-20rpx); }
}
@keyframes tapBounce {
	0% { transform: scale(1); }
	40% { transform: scale(1.3); }
	100% { transform: scale(1); }
}
.mascot-label {
	font-size: 20rpx;
	color: rgba(255, 255, 255, 0.7);
	margin-top: 4rpx;
}

/* 气泡 - 磨砂玻璃模拟 */
.speech-bubble {
	position: absolute;
	top: -60rpx;
	right: -20rpx;
	background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,255,0.92));
	border-radius: 16rpx;
	padding: 10rpx 20rpx;
	box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.1), 0 1rpx 0 rgba(255,255,255,0.9) inset;
	border: 1rpx solid rgba(200, 210, 255, 0.3);
	animation: bubbleIn 0.25s ease;
	z-index: 5;
	white-space: nowrap;
}
.speech-bubble::after {
	content: '';
	position: absolute;
	bottom: -10rpx;
	right: 30rpx;
	width: 0;
	height: 0;
	border-left: 10rpx solid transparent;
	border-right: 10rpx solid transparent;
	border-top: 10rpx solid rgba(255, 255, 255, 0.85);
}
.bubble-text {
	font-size: 22rpx;
	color: #1a1a2e;
}
@keyframes bubbleIn {
	from { transform: scale(0.5); opacity: 0; }
	to { transform: scale(1); opacity: 1; }
}

/* 快捷功能 */
.quick-functions {
	display: flex;
	justify-content: space-between;
	margin: 0 32rpx 40rpx;
}
.function-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12rpx;
	transition: transform 0.2s ease;
}
.function-item:active {
	transform: scale(0.92);
}
.function-icon {
	width: 104rpx;
	height: 104rpx;
	border-radius: 32rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15), inset 0 2rpx 0 rgba(255,255,255,0.3);
	position: relative;
	overflow: hidden;
}
.function-icon::after {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 50%;
	background: linear-gradient(180deg, rgba(255, 255, 255, 0.25), transparent);
	border-radius: 32rpx 32rpx 0 0;
}
.func-emoji {
	font-size: 48rpx;
	position: relative;
	z-index: 1;
}
.func-label {
	font-size: 24rpx;
	color: #555;
	font-weight: 500;
}
.nav-icon { background: linear-gradient(135deg, #43e97b, #38f9d7); }
.study-icon { background: linear-gradient(135deg, #667eea, #764ba2); }
.sport-icon { background: linear-gradient(135deg, #f093fb, #f5576c); }
.creative-icon { background: linear-gradient(135deg, #fa709a, #fee140); }

/* 区块 - 磨砂玻璃模拟 */
.section {
	margin: 0 32rpx 32rpx;
	background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.88) 100%);
	border-radius: 28rpx;
	padding: 32rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.7);
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06), 0 1rpx 0 rgba(255, 255, 255, 0.9) inset;
	position: relative;
	overflow: hidden;
}
.section::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
	pointer-events: none;
}
.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 28rpx;
}
.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #1a1a2e;
}
.section-more {
	font-size: 26rpx;
	color: #5a7bff;
	font-weight: 500;
}

/* 课程卡片 */
.course-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}
.course-card {
	display: flex;
	gap: 28rpx;
	padding: 28rpx;
	border-radius: 20rpx;
	background: linear-gradient(180deg, #f8f9ff, #f0f2ff);
	border-left: 6rpx solid #e0e0e0;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
	transition: transform 0.2s ease, background 0.2s ease;
}
.course-card:active {
	transform: scale(0.98);
}
.course-card.completed {
	border-left-color: #4caf50;
	opacity: 0.7;
}
.course-card.current {
	border-left-color: #4361ee;
	background: linear-gradient(180deg, #eef0ff, #e4e8ff);
	box-shadow: 0 4rpx 16rpx rgba(67, 97, 238, 0.12);
}
.course-card.upcoming {
	border-left-color: #ff9800;
}
.course-time-col {
	min-width: 100rpx;
	display: flex;
	flex-direction: column;
	gap: 4rpx;
}
.course-time-text {
	font-size: 24rpx;
	color: #999;
	text-align: center;
}
.course-info {
	flex: 1;
}
.course-name {
	font-size: 30rpx;
	font-weight: bold;
	color: #1a1a2e;
	display: block;
	margin-bottom: 8rpx;
}
.course-loc {
	font-size: 24rpx;
	color: #666;
	display: block;
	margin-bottom: 12rpx;
}
.course-status {
	font-size: 22rpx;
	padding: 4rpx 20rpx;
	border-radius: 20rpx;
	display: inline-block;
}
.course-status.done { background: #e8f5e9; color: #4caf50; }
.course-status.going { background: #e3f2fd; color: #4361ee; }
.course-status.wait { background: #fff3e0; color: #ff9800; }

/* 空状态 */
.empty-course {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 40rpx 0;
}
.empty-text {
	font-size: 26rpx;
	color: #999;
	margin-bottom: 16rpx;
}
.empty-link {
	font-size: 28rpx;
	color: #5a7bff;
	font-weight: bold;
}

/* 公告 */
.notice-list {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}
.notice-item {
	display: flex;
	align-items: center;
	gap: 20rpx;
	padding: 20rpx 12rpx;
	border-bottom: 1rpx solid rgba(0, 0, 0, 0.04);
	transition: opacity 0.2s ease, transform 0.2s ease;
	border-radius: 16rpx;
}
.notice-item:active {
	background: rgba(67, 97, 238, 0.06);
	opacity: 0.7;
	transform: scale(0.98);
}
.notice-item:last-child {
	border-bottom: none;
}
.notice-tag {
	font-size: 22rpx;
	padding: 4rpx 16rpx;
	border-radius: 8rpx;
	flex-shrink: 0;
	font-weight: 500;
}
.notice-tag.hot { background: #ffebee; color: #f44336; }
.notice-tag.new { background: #e3f2fd; color: #5a7bff; }
.notice-tag.info { background: #e8f5e9; color: #4caf50; }
.notice-text {
	font-size: 28rpx;
	color: #555;
}
</style>
