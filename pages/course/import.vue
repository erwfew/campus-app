<template>
	<view class="import-page">
		<!-- 顶部说明 -->
		<view class="import-header">
			<text class="import-title">导入课程</text>
			<text class="import-desc">选择一种方式导入你的课程表</text>
		</view>

		<!-- 导入方式选择 -->
		<view class="import-options">
			<view class="import-card" @tap="goManualAdd">
				<view class="card-icon manual-icon">
					<text class="icon-emoji">&#x270F;&#xFE0F;</text>
				</view>
				<view class="card-content">
					<text class="card-title">手动添加</text>
					<text class="card-desc">逐个添加课程信息，适合少量课程</text>
				</view>
				<text class="card-arrow">&#x2192;</text>
			</view>

			<view class="import-card" @tap="goEduImport">
				<view class="card-icon edu-icon">
					<text class="icon-emoji">&#x1F3EB;</text>
				</view>
				<view class="card-content">
					<text class="card-title">教务系统导入</text>
					<text class="card-desc">登录学校教务系统自动获取课程</text>
				</view>
				<text class="card-arrow">&#x2192;</text>
			</view>

			<view class="import-card" @tap="goBatchImport">
				<view class="card-icon batch-icon">
					<text class="icon-emoji">&#x1F4CB;</text>
				</view>
				<view class="card-content">
					<text class="card-title">批量导入</text>
					<text class="card-desc">通过文本或表格批量导入课程</text>
				</view>
				<text class="card-arrow">&#x2192;</text>
			</view>
		</view>

		<!-- 已有课程列表 -->
		<view class="existing-courses" v-if="courses.length > 0">
			<view class="section-header">
				<text class="section-title">已有课程 ({{courses.length}})</text>
				<text class="clear-btn" @tap="clearAllCourses">清空全部</text>
			</view>
			<view class="course-list">
				<view class="course-item" v-for="(course, index) in courses" :key="index">
					<view class="course-color" :style="{background: course.color || '#4361ee'}"></view>
					<view class="course-info">
						<text class="course-name">{{course.name}}</text>
						<text class="course-detail">{{course.teacher}} · {{course.location}}</text>
						<text class="course-time">{{getWeekDayText(course.weekDay)}} 第{{course.startSection}}-{{course.endSection}}节</text>
					</view>
					<view class="course-actions">
						<text class="action-btn edit" @tap="editCourse(index)">编辑</text>
						<text class="action-btn delete" @tap="deleteCourse(index)">删除</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty-state" v-else>
			<text class="empty-icon">&#x1F4DA;</text>
			<text class="empty-text">还没有课程</text>
			<text class="empty-desc">点击上方按钮开始添加课程</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			courses: []
		}
	},
	onShow() {
		this.loadCourses()
	},
	methods: {
		loadCourses() {
			try {
				var data = uni.getStorageSync('campus_courses')
				if (data) {
					this.courses = JSON.parse(data)
				}
			} catch (e) {
				this.courses = []
			}
		},
		saveCourses() {
			uni.setStorageSync('campus_courses', JSON.stringify(this.courses))
		},
		goManualAdd() {
			uni.navigateTo({ url: '/pages/course/add' })
		},
		goEduImport() {
			uni.navigateTo({ url: '/pages/course/edu-import' })
		},
		goBatchImport() {
			uni.navigateTo({ url: '/pages/course/batch-import' })
		},
		editCourse(index) {
			var course = this.courses[index]
			uni.navigateTo({
				url: '/pages/course/add?index=' + index + '&data=' + encodeURIComponent(JSON.stringify(course))
			})
		},
		deleteCourse(index) {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除 "' + this.courses[index].name + '" 吗？',
				success: (res) => {
					if (res.confirm) {
						this.courses.splice(index, 1)
						this.saveCourses()
						uni.showToast({ title: '已删除', icon: 'success' })
					}
				}
			})
		},
		clearAllCourses() {
			uni.showModal({
				title: '确认清空',
				content: '确定要清空所有课程吗？此操作不可恢复。',
				success: (res) => {
					if (res.confirm) {
						this.courses = []
						this.saveCourses()
						uni.showToast({ title: '已清空', icon: 'success' })
					}
				}
			})
		},
		getWeekDayText(day) {
			var days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
			return days[day] || ''
		}
	}
}
</script>

<style>
.import-page {
	min-height: 100vh;
	background: linear-gradient(180deg, #4361ee 0%, #6b83f5 12%, #d4daff 28%, #e8ecff 50%, #f0f2ff 70%, #f5f6fa 100%);
	padding-bottom: 40rpx;
}

.import-header {
	padding: 40rpx 32rpx 32rpx;
	background: linear-gradient(135deg, #4361ee 0%, #5a78f0 50%, #7b8cff 100%);
	position: relative;
	overflow: hidden;
}
.import-header::after {
	content: '';
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 1rpx;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
}
.import-title {
	font-size: 44rpx;
	font-weight: bold;
	color: #ffffff;
	display: block;
	margin-bottom: 12rpx;
	text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.12);
}
.import-desc {
	font-size: 26rpx;
	color: rgba(255,255,255,0.85);
}

.import-options {
	padding: 32rpx;
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}
.import-card {
	display: flex;
	align-items: center;
	gap: 24rpx;
	background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.88) 100%);
	border-radius: 28rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.7);
	box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.06), 0 1rpx 0 rgba(255, 255, 255, 0.9) inset;
	padding: 32rpx;
	position: relative;
	overflow: hidden;
	transition: all 0.2s ease;
}
.import-card::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
	pointer-events: none;
}
.import-card:active {
	transform: scale(0.98);
	opacity: 0.85;
}
.card-icon {
	width: 96rpx;
	height: 96rpx;
	border-radius: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.icon-emoji {
	font-size: 48rpx;
}
.manual-icon { background: linear-gradient(135deg, #667eea, #764ba2); }
.edu-icon { background: linear-gradient(135deg, #43e97b, #38f9d7); }
.batch-icon { background: linear-gradient(135deg, #fa709a, #fee140); }

.card-content {
	flex: 1;
}
.card-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #1a1a2e;
	display: block;
	margin-bottom: 8rpx;
}
.card-desc {
	font-size: 24rpx;
	color: #555;
}
.card-arrow {
	font-size: 36rpx;
	color: #ccc;
}

/* 已有课程 */
.existing-courses {
	margin: 0 32rpx;
	background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.88) 100%);
	border-radius: 28rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.7);
	box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.06), 0 1rpx 0 rgba(255, 255, 255, 0.9) inset;
	padding: 32rpx;
	position: relative;
	overflow: hidden;
}
.existing-courses::before {
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
	margin-bottom: 24rpx;
}
.section-title {
	font-size: 30rpx;
	font-weight: bold;
	color: #1a1a2e;
}
.clear-btn {
	font-size: 24rpx;
	color: #f44336;
	transition: all 0.2s ease;
}
.clear-btn:active {
	opacity: 0.7;
}

.course-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}
.course-item {
	display: flex;
	align-items: center;
	gap: 20rpx;
	padding: 20rpx;
	background: linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(240,242,255,0.6) 100%);
	border-radius: 20rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.5);
	box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04), 0 1rpx 0 rgba(255,255,255,0.8) inset;
	transition: all 0.2s ease;
}
.course-item:active {
	transform: scale(0.98);
	opacity: 0.9;
}
.course-color {
	width: 8rpx;
	height: 80rpx;
	border-radius: 4rpx;
	flex-shrink: 0;
}
.course-info {
	flex: 1;
}
.course-name {
	font-size: 28rpx;
	font-weight: bold;
	color: #1a1a2e;
	display: block;
	margin-bottom: 6rpx;
}
.course-detail {
	font-size: 22rpx;
	color: #555;
	display: block;
	margin-bottom: 4rpx;
}
.course-time {
	font-size: 20rpx;
	color: #999;
}
.course-actions {
	display: flex;
	gap: 16rpx;
}
.action-btn {
	font-size: 22rpx;
	padding: 8rpx 16rpx;
	border-radius: 8rpx;
	transition: all 0.2s ease;
}
.action-btn:active {
	transform: scale(0.95);
	opacity: 0.8;
}
.action-btn.edit {
	color: #4361ee;
	background: linear-gradient(135deg, #eef0ff, #e4e8ff);
}
.action-btn.delete {
	color: #f44336;
	background: linear-gradient(135deg, #ffebee, #ffd6d6);
}

/* 空状态 */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 120rpx 0;
}
.empty-icon {
	font-size: 120rpx;
	margin-bottom: 24rpx;
}
.empty-text {
	font-size: 32rpx;
	color: #1a1a2e;
	font-weight: bold;
	margin-bottom: 12rpx;
}
.empty-desc {
	font-size: 26rpx;
	color: #555;
}
</style>
