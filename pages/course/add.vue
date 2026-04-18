<template>
	<view class="add-page">
		<!-- 课程名称 -->
		<view class="form-group">
			<text class="form-label">课程名称 *</text>
			<input class="form-input" v-model="form.name" placeholder="请输入课程名称" />
		</view>

		<!-- 教师 -->
		<view class="form-group">
			<text class="form-label">授课教师</text>
			<input class="form-input" v-model="form.teacher" placeholder="请输入教师姓名" />
		</view>

		<!-- 教室 -->
		<view class="form-group">
			<text class="form-label">上课地点</text>
			<input class="form-input" v-model="form.location" placeholder="如：教学楼A-301" />
		</view>

		<!-- 星期 -->
		<view class="form-group">
			<text class="form-label">上课星期 *</text>
			<picker :range="weekDays" :value="form.weekDay" @change="onWeekDayChange">
				<view class="picker-display">
					<text class="picker-text" :class="{placeholder: form.weekDay === -1}">
						{{form.weekDay === -1 ? '请选择星期' : weekDays[form.weekDay]}}
					</text>
					<text class="picker-arrow">&#x25BC;</text>
				</view>
			</picker>
		</view>

		<!-- 节次 -->
		<view class="form-group">
			<text class="form-label">上课节次 *</text>
			<view class="section-row">
				<picker :range="sections" :value="form.startSection - 1" @change="onStartSectionChange">
					<view class="picker-display small">
						<text class="picker-text">第{{form.startSection}}节</text>
						<text class="picker-arrow">&#x25BC;</text>
					</view>
				</picker>
				<text class="section-sep">至</text>
				<picker :range="sections" :value="form.endSection - 1" @change="onEndSectionChange">
					<view class="picker-display small">
						<text class="picker-text">第{{form.endSection}}节</text>
						<text class="picker-arrow">&#x25BC;</text>
					</view>
				</picker>
			</view>
		</view>

		<!-- 上课时间 -->
		<view class="form-group">
			<text class="form-label">上课时间</text>
			<view class="time-row">
				<picker mode="time" :value="form.startTime" @change="onStartTimeChange">
					<view class="picker-display small">
						<text class="picker-text">{{form.startTime || '开始时间'}}</text>
						<text class="picker-arrow">&#x25BC;</text>
					</view>
				</picker>
				<text class="section-sep">至</text>
				<picker mode="time" :value="form.endTime" @change="onEndTimeChange">
					<view class="picker-display small">
						<text class="picker-text">{{form.endTime || '结束时间'}}</text>
						<text class="picker-arrow">&#x25BC;</text>
					</view>
				</picker>
			</view>
		</view>

		<!-- 周数范围 -->
		<view class="form-group">
			<text class="form-label">上课周数</text>
			<view class="week-range">
				<picker :range="weekOptions" :value="form.startWeek - 1" @change="onStartWeekChange">
					<view class="picker-display small">
						<text class="picker-text">第{{form.startWeek}}周</text>
						<text class="picker-arrow">&#x25BC;</text>
					</view>
				</picker>
				<text class="section-sep">至</text>
				<picker :range="weekOptions" :value="form.endWeek - 1" @change="onEndWeekChange">
					<view class="picker-display small">
						<text class="picker-text">第{{form.endWeek}}周</text>
						<text class="picker-arrow">&#x25BC;</text>
					</view>
				</picker>
			</view>
		</view>

		<!-- 课程颜色 -->
		<view class="form-group">
			<text class="form-label">课程颜色</text>
			<view class="color-picker">
				<view
					class="color-option"
					v-for="(color, index) in colors"
					:key="index"
					:style="{background: color}"
					:class="{selected: form.color === color}"
					@tap="selectColor(color)"
				></view>
			</view>
		</view>

		<!-- 备注 -->
		<view class="form-group">
			<text class="form-label">备注</text>
			<textarea class="form-textarea" v-model="form.remark" placeholder="选填，如：单周上课、需要带电脑等" />
		</view>

		<!-- 提交按钮 -->
		<view class="btn-group">
			<button class="btn-cancel" @tap="goBack">取消</button>
			<button class="btn-save" @tap="saveCourse">保存</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			editIndex: -1,
			weekDays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
			sections: ['第1节', '第2节', '第3节', '第4节', '第5节', '第6节', '第7节', '第8节', '第9节', '第10节', '第11节', '第12节'],
			weekOptions: Array.from({length: 20}, (_, i) => '第' + (i + 1) + '周'),
			colors: ['#4361ee', '#764ba2', '#43e97b', '#f5576c', '#fa709a', '#fee140', '#38f9d7', '#667eea', '#ff9800', '#e91e63'],
			form: {
				name: '',
				teacher: '',
				location: '',
				weekDay: -1,
				startSection: 1,
				endSection: 2,
				startTime: '',
				endTime: '',
				startWeek: 1,
				endWeek: 16,
				color: '#4361ee',
				remark: ''
			}
		}
	},
	onLoad(options) {
		if (options.index !== undefined) {
			this.editIndex = parseInt(options.index)
		}
		if (options.data) {
			try {
				var course = JSON.parse(decodeURIComponent(options.data))
				this.form = { ...this.form, ...course }
			} catch (e) {}
		}
	},
	methods: {
		onWeekDayChange(e) {
			this.form.weekDay = parseInt(e.detail.value)
		},
		onStartSectionChange(e) {
			this.form.startSection = parseInt(e.detail.value) + 1
			if (this.form.endSection < this.form.startSection) {
				this.form.endSection = this.form.startSection
			}
		},
		onEndSectionChange(e) {
			var val = parseInt(e.detail.value) + 1
			if (val < this.form.startSection) {
				uni.showToast({ title: '结束节次不能小于开始节次', icon: 'none' })
				return
			}
			this.form.endSection = val
		},
		onStartTimeChange(e) {
			this.form.startTime = e.detail.value
		},
		onEndTimeChange(e) {
			this.form.endTime = e.detail.value
		},
		onStartWeekChange(e) {
			this.form.startWeek = parseInt(e.detail.value) + 1
			if (this.form.endWeek < this.form.startWeek) {
				this.form.endWeek = this.form.startWeek
			}
		},
		onEndWeekChange(e) {
			var val = parseInt(e.detail.value) + 1
			if (val < this.form.startWeek) {
				uni.showToast({ title: '结束周不能小于开始周', icon: 'none' })
				return
			}
			this.form.endWeek = val
		},
		selectColor(color) {
			this.form.color = color
		},
		saveCourse() {
			if (!this.form.name.trim()) {
				uni.showToast({ title: '请输入课程名称', icon: 'none' })
				return
			}
			if (this.form.weekDay === -1) {
				uni.showToast({ title: '请选择上课星期', icon: 'none' })
				return
			}

			var courses = []
			try {
				var data = uni.getStorageSync('campus_courses')
				if (data) courses = JSON.parse(data)
			} catch (e) {}

			var courseData = JSON.parse(JSON.stringify(this.form))

			if (this.editIndex >= 0) {
				courses[this.editIndex] = courseData
			} else {
				courses.push(courseData)
			}

			uni.setStorageSync('campus_courses', JSON.stringify(courses))
			uni.showToast({
				title: this.editIndex >= 0 ? '已更新' : '已添加',
				icon: 'success'
			})
			setTimeout(() => {
				uni.navigateBack()
			}, 800)
		},
		goBack() {
			uni.navigateBack()
		}
	}
}
</script>

<style>
.add-page {
	min-height: 100vh;
	background: linear-gradient(180deg, #4361ee 0%, #6b83f5 12%, #d4daff 28%, #e8ecff 50%, #f0f2ff 70%, #f5f6fa 100%);
	padding: 32rpx;
	padding-bottom: 60rpx;
}

.form-group {
	background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.88) 100%);
	border-radius: 28rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.7);
	box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.06), 0 1rpx 0 rgba(255, 255, 255, 0.9) inset;
	padding: 28rpx 32rpx;
	margin-bottom: 24rpx;
	position: relative;
	overflow: hidden;
}
.form-group::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
	pointer-events: none;
}
.form-label {
	font-size: 26rpx;
	color: #555;
	display: block;
	margin-bottom: 16rpx;
	font-weight: bold;
}
.form-input {
	font-size: 30rpx;
	color: #1a1a2e;
	padding: 16rpx 0;
	border-bottom: 1rpx solid rgba(67, 97, 238, 0.15);
}
.form-input::placeholder {
	color: #aaa;
}
.form-textarea {
	font-size: 28rpx;
	color: #1a1a2e;
	padding: 16rpx;
	background: linear-gradient(180deg, rgba(232,236,255,0.5) 0%, rgba(240,242,255,0.5) 100%);
	border: 1rpx solid rgba(67, 97, 238, 0.12);
	border-radius: 16rpx;
	min-height: 120rpx;
	margin-top: 8rpx;
}
.form-textarea::placeholder {
	color: #aaa;
}

/* Picker */
.picker-display {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 24rpx;
	background: linear-gradient(180deg, rgba(232,236,255,0.5) 0%, rgba(240,242,255,0.5) 100%);
	border: 1rpx solid rgba(67, 97, 238, 0.12);
	border-radius: 16rpx;
	transition: all 0.2s ease;
}
.picker-display:active {
	transform: scale(0.98);
	opacity: 0.85;
}
.picker-display.small {
	padding: 16rpx 20rpx;
	min-width: 200rpx;
}
.picker-text {
	font-size: 28rpx;
	color: #1a1a2e;
}
.picker-text.placeholder {
	color: #aaa;
}
.picker-arrow {
	font-size: 20rpx;
	color: #999;
}

/* Section row */
.section-row, .week-range, .time-row {
	display: flex;
	align-items: center;
	gap: 20rpx;
}
.section-sep {
	font-size: 28rpx;
	color: #555;
}

/* Color picker */
.color-picker {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}
.color-option {
	width: 56rpx;
	height: 56rpx;
	border-radius: 50%;
	border: 4rpx solid transparent;
	transition: all 0.2s;
	box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
}
.color-option.selected {
	border-color: #1a1a2e;
	transform: scale(1.15);
	box-shadow: 0 4rpx 16rpx rgba(67, 97, 238, 0.35);
}
.color-option:active {
	transform: scale(0.92);
}

/* Buttons */
.btn-group {
	display: flex;
	gap: 24rpx;
	margin-top: 40rpx;
}
.btn-cancel, .btn-save {
	flex: 1;
	height: 88rpx;
	border-radius: 44rpx;
	font-size: 32rpx;
	font-weight: bold;
	display: flex;
	align-items: center;
	justify-content: center;
	border: none;
	transition: all 0.2s ease;
}
.btn-cancel:active, .btn-save:active {
	transform: scale(0.97);
	opacity: 0.85;
}
.btn-cancel {
	background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(240,242,255,0.88) 100%);
	color: #555;
	border: 1rpx solid rgba(0,0,0,0.08);
	box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}
.btn-save {
	background: linear-gradient(135deg, #4361ee 0%, #5a78f0 50%, #7b8cff 100%);
	color: #ffffff;
	box-shadow: 0 4rpx 20rpx rgba(67, 97, 238, 0.35);
}
</style>
