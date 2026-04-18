<template>
	<view class="batch-page">
		<view class="batch-header">
			<text class="batch-title">批量导入</text>
			<text class="batch-desc">通过文本格式批量添加课程</text>
		</view>

		<!-- 格式说明 -->
		<view class="format-section">
			<text class="format-title">输入格式</text>
			<view class="format-example">
				<text class="format-line">课程名|教师|教室|星期(0-6)|开始节|结束节|开始时间|结束时间</text>
				<text class="format-line">高等数学|王教授|教学楼A-301|0|1|2|08:00|09:40</text>
				<text class="format-line">大学英语|李老师|教学楼B-205|0|3|4|10:00|11:40</text>
			</view>
			<view class="format-tips">
				<text class="tip-item">* 每行一门课程</text>
				<text class="tip-item">* 用 | 分隔各字段</text>
				<text class="tip-item">* 星期：0=周一, 1=周二, ..., 6=周日</text>
				<text class="tip-item">* 节次：1-12节</text>
			</view>
		</view>

		<!-- 文本输入 -->
		<view class="input-section">
			<textarea
				class="batch-textarea"
				v-model="batchText"
				placeholder="请输入课程信息，每行一门课程..."
				:maxlength="-1"
			/>
		</view>

		<!-- 解析预览 -->
		<view class="preview-section" v-if="parsedCourses.length > 0">
			<view class="section-header">
				<text class="section-title">解析结果 ({{parsedCourses.length}}门课程)</text>
				<text class="clear-btn" @tap="clearParsed">清除</text>
			</view>
			<view class="preview-list">
				<view class="preview-item" v-for="(course, index) in parsedCourses" :key="index">
					<view class="preview-color" :style="{background: course.color}"></view>
					<view class="preview-info">
						<text class="preview-name">{{course.name}}</text>
						<text class="preview-detail">{{course.teacher}} · {{course.location}}</text>
						<text class="preview-time">{{getWeekDayText(course.weekDay)}} 第{{course.startSection}}-{{course.endSection}}节 {{course.startTime}}-{{course.endTime}}</text>
					</view>
					<text class="preview-delete" @tap="removeParsed(index)">&#x2715;</text>
				</view>
			</view>
		</view>

		<!-- 错误信息 -->
		<view class="error-section" v-if="parseErrors.length > 0">
			<text class="error-title">解析错误</text>
			<view class="error-list">
				<text class="error-item" v-for="(err, index) in parseErrors" :key="index">第{{err.line}}行: {{err.msg}}</text>
			</view>
		</view>

		<!-- 操作按钮 -->
		<view class="btn-group">
			<button class="btn-parse" @tap="parseText">解析文本</button>
			<button class="btn-import" @tap="importCourses" :disabled="parsedCourses.length === 0">
				导入课程 ({{parsedCourses.length}})
			</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			batchText: '',
			parsedCourses: [],
			parseErrors: [],
			colors: ['#4361ee', '#764ba2', '#43e97b', '#f5576c', '#fa709a', '#fee140', '#38f9d7', '#667eea', '#ff9800', '#e91e63']
		}
	},
	methods: {
		getWeekDayText(day) {
			var days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
			return days[day] || ''
		},
		parseText() {
			if (!this.batchText.trim()) {
				uni.showToast({ title: '请输入课程信息', icon: 'none' })
				return
			}

			var lines = this.batchText.trim().split('\n')
			var courses = []
			var errors = []

			lines.forEach((line, index) => {
				line = line.trim()
				if (!line) return

				var parts = line.split('|')
				if (parts.length < 4) {
					errors.push({ line: index + 1, msg: '字段不足，至少需要：课程名|教师|教室|星期' })
					return
				}

				var name = parts[0].trim()
				var teacher = parts[1] ? parts[1].trim() : ''
				var location = parts[2] ? parts[2].trim() : ''
				var weekDay = parseInt(parts[3])
				var startSection = parts[4] ? parseInt(parts[4]) : 1
				var endSection = parts[5] ? parseInt(parts[5]) : startSection + 1
				var startTime = parts[6] ? parts[6].trim() : ''
				var endTime = parts[7] ? parts[7].trim() : ''

				if (!name) {
					errors.push({ line: index + 1, msg: '课程名不能为空' })
					return
				}
				if (isNaN(weekDay) || weekDay < 0 || weekDay > 6) {
					errors.push({ line: index + 1, msg: '星期格式错误，应为0-6' })
					return
				}

				courses.push({
					name,
					teacher,
					location,
					weekDay,
					startSection: startSection || 1,
					endSection: endSection || startSection + 1,
					startTime: startTime || '',
					endTime: endTime || '',
					startWeek: 1,
					endWeek: 16,
					color: this.colors[courses.length % this.colors.length],
					remark: ''
				})
			})

			this.parsedCourses = courses
			this.parseErrors = errors

			if (courses.length > 0) {
				uni.showToast({ title: '解析完成', icon: 'success' })
			}
		},
		removeParsed(index) {
			this.parsedCourses.splice(index, 1)
		},
		clearParsed() {
			this.parsedCourses = []
			this.parseErrors = []
		},
		importCourses() {
			if (this.parsedCourses.length === 0) {
				uni.showToast({ title: '没有可导入的课程', icon: 'none' })
				return
			}

			var courses = []
			try {
				var data = uni.getStorageSync('campus_courses')
				if (data) courses = JSON.parse(data)
			} catch (e) {}

			courses = courses.concat(this.parsedCourses)
			uni.setStorageSync('campus_courses', JSON.stringify(courses))

			uni.showToast({
				title: '成功导入 ' + this.parsedCourses.length + ' 门课程',
				icon: 'success'
			})

			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
		}
	}
}
</script>

<style>
.batch-page {
	min-height: 100vh;
	background: linear-gradient(180deg, #4361ee 0%, #6b83f5 12%, #d4daff 28%, #e8ecff 50%, #f0f2ff 70%, #f5f6fa 100%);
	padding-bottom: 40rpx;
}

.batch-header {
	padding: 40rpx 32rpx 32rpx;
	background: linear-gradient(135deg, #4361ee 0%, #5a78f0 50%, #7b8cff 100%);
	position: relative;
	overflow: hidden;
}
.batch-header::after {
	content: '';
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 1rpx;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
}
.batch-title {
	font-size: 44rpx;
	font-weight: bold;
	color: #ffffff;
	display: block;
	margin-bottom: 12rpx;
	text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.12);
}
.batch-desc {
	font-size: 26rpx;
	color: rgba(255,255,255,0.85);
}

/* 格式说明 */
.format-section {
	margin: 32rpx;
	background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.88) 100%);
	border-radius: 28rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.7);
	box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.06), 0 1rpx 0 rgba(255, 255, 255, 0.9) inset;
	padding: 28rpx;
	position: relative;
	overflow: hidden;
}
.format-section::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
	pointer-events: none;
}
.format-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #1a1a2e;
	display: block;
	margin-bottom: 16rpx;
}
.format-example {
	background: linear-gradient(180deg, rgba(232,236,255,0.6) 0%, rgba(240,242,255,0.5) 100%);
	border: 1rpx solid rgba(67, 97, 238, 0.1);
	border-radius: 16rpx;
	padding: 20rpx;
	margin-bottom: 16rpx;
}
.format-line {
	font-size: 22rpx;
	color: #555;
	display: block;
	font-family: monospace;
	margin-bottom: 8rpx;
}
.format-line:last-child {
	margin-bottom: 0;
}
.format-tips {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}
.tip-item {
	font-size: 22rpx;
	color: #777;
}

/* 输入区域 */
.input-section {
	margin: 0 32rpx 32rpx;
}
.batch-textarea {
	background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.88) 100%);
	border: 1rpx solid rgba(255, 255, 255, 0.7);
	border-radius: 28rpx;
	padding: 28rpx;
	font-size: 26rpx;
	color: #1a1a2e;
	min-height: 300rpx;
	box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.06), 0 1rpx 0 rgba(255, 255, 255, 0.9) inset;
	box-sizing: border-box;
	width: 100%;
}
.batch-textarea::placeholder {
	color: #aaa;
}

/* 预览 */
.preview-section {
	margin: 0 32rpx 32rpx;
}
.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16rpx;
}
.section-title {
	font-size: 28rpx;
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
.preview-list {
	background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.88) 100%);
	border-radius: 28rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.7);
	box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.06), 0 1rpx 0 rgba(255, 255, 255, 0.9) inset;
	padding: 24rpx;
	position: relative;
	overflow: hidden;
}
.preview-list::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
	pointer-events: none;
}
.preview-item {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 16rpx 0;
	border-bottom: 1rpx solid rgba(67, 97, 238, 0.08);
}
.preview-item:last-child {
	border-bottom: none;
}
.preview-color {
	width: 8rpx;
	height: 64rpx;
	border-radius: 4rpx;
	flex-shrink: 0;
}
.preview-info {
	flex: 1;
}
.preview-name {
	font-size: 26rpx;
	font-weight: bold;
	color: #1a1a2e;
	display: block;
	margin-bottom: 4rpx;
}
.preview-detail {
	font-size: 20rpx;
	color: #555;
	display: block;
	margin-bottom: 2rpx;
}
.preview-time {
	font-size: 18rpx;
	color: #999;
}
.preview-delete {
	font-size: 28rpx;
	color: #f44336;
	padding: 8rpx;
	transition: all 0.2s ease;
}
.preview-delete:active {
	opacity: 0.6;
	transform: scale(0.9);
}

/* 错误 */
.error-section {
	margin: 0 32rpx 32rpx;
	background: linear-gradient(180deg, rgba(255,235,238,0.95) 0%, rgba(255,220,225,0.88) 100%);
	border: 1rpx solid rgba(244, 67, 54, 0.15);
	border-radius: 28rpx;
	padding: 24rpx;
	position: relative;
	overflow: hidden;
	box-shadow: 0 4rpx 16rpx rgba(244, 67, 54, 0.08), 0 1rpx 0 rgba(255,255,255,0.6) inset;
}
.error-title {
	font-size: 26rpx;
	font-weight: bold;
	color: #f44336;
	display: block;
	margin-bottom: 12rpx;
}
.error-list {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}
.error-item {
	font-size: 22rpx;
	color: #c62828;
}

/* 按钮 */
.btn-group {
	display: flex;
	gap: 20rpx;
	padding: 0 32rpx;
}
.btn-parse, .btn-import {
	flex: 1;
	height: 88rpx;
	border-radius: 44rpx;
	font-size: 30rpx;
	font-weight: bold;
	border: none;
	transition: all 0.2s ease;
}
.btn-parse:active, .btn-import:active {
	transform: scale(0.97);
	opacity: 0.85;
}
.btn-parse {
	background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(240,242,255,0.88) 100%);
	color: #555;
	border: 1rpx solid rgba(0,0,0,0.08);
	box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}
.btn-import {
	background: linear-gradient(135deg, #4361ee 0%, #5a78f0 50%, #7b8cff 100%);
	color: #ffffff;
	box-shadow: 0 4rpx 20rpx rgba(67, 97, 238, 0.35);
}
.btn-import[disabled] {
	opacity: 0.5;
	box-shadow: none;
}
</style>
