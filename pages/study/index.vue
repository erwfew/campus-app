<template>
  <view class="study-page">
    <view class="custom-nav">
      <view class="nav-status-bar"></view>
      <view class="nav-title-bar">
        <text class="nav-title">学习</text>
      </view>
    </view>

    <view class="view-toggle">
      <view class="toggle-btn" :class="{active: viewMode === 'table'}" @click="viewMode = 'table'">
        <text class="toggle-text">表</text>
      </view>
      <view class="toggle-btn" :class="{active: viewMode === 'week'}" @click="viewMode = 'week'">
        <text class="toggle-text">周</text>
      </view>
      <view class="toggle-btn" :class="{active: viewMode === 'day'}" @click="viewMode = 'day'">
        <text class="toggle-text">日</text>
      </view>
    </view>

    <view class="import-bar" @click="goImport">
      <text class="import-icon">📥</text>
      <text class="import-text">导入课程</text>
      <text class="import-arrow">›</text>
    </view>

    <view class="reminder-card" v-if="nextCourse">
      <text class="reminder-icon">🔔</text>
      <view class="reminder-info">
        <text class="reminder-title">下一节课</text>
        <text class="reminder-desc">{{nextCourse.name}}</text>
        <text class="reminder-time">{{nextCourse.startTime || ''}}</text>
      </view>
    </view>

    <view class="week-selector" v-if="viewMode !== 'table'">
      <scroll-view class="week-scroll" scroll-x>
        <view class="week-chips">
          <view class="week-chip" :class="{active: selectedWeek === 0}" @click="selectedWeek = 0">
            <text class="week-chip-text">全部</text>
          </view>
          <view v-for="i in totalWeeks" :key="i" class="week-chip" :class="{active: selectedWeek === i, 'current-week': currentWeek === i}" @click="selectedWeek = i">
            <text class="week-chip-text">第{{i}}周</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view v-if="viewMode === 'table'">
      <view class="table-card">
        <view class="table-title-row">
          <text class="table-title">课程表</text>
          <view class="table-settings-btn" @click="openSettings">
            <text class="settings-icon">⚙️</text>
            <text class="settings-label">设置</text>
          </view>
        </view>
        <text class="table-week-info">当前是第 <text class="current-week-badge">{{currentWeek}}</text> 周</text>
        <view class="table-scroll">
          <view class="table-grid">
            <view class="table-row">
              <view class="table-cell table-header table-time-header">
                <text class="th-text"></text>
              </view>
              <view v-for="(day, di) in tableDays" :key="di" class="table-cell table-header table-day-header" :class="{today: di === todayIndex}">
                <text class="th-text" :class="{today: di === todayIndex}">{{day}}</text>
              </view>
            </view>
            <view v-if="morningSections.length > 0">
              <view class="table-row table-period-sep">
                <view class="table-cell table-period-label"><text class="period-text">上午</text></view>
                <view v-for="d in tableDays" :key="'ms'+d" class="table-cell"></view>
              </view>
              <view v-for="sec in morningSections" :key="'m'+sec" class="table-row">
                <view class="table-cell table-time-cell">
                  <text class="time-text">第{{sec}}节</text>
                  <text class="time-sub">{{sectionTime[sec] ? sectionTime[sec][0] : ''}}</text>
                </view>
                <view v-for="(day, di) in tableDays" :key="'m'+sec+'-'+di" class="table-cell" :class="{today: di === todayIndex}">
                  <view v-if="getCourseAt(sec, di)" class="table-course">
                    <text class="tc-name">{{getCourseAt(sec, di).name}}</text>
                    <text class="tc-loc">{{getCourseAt(sec, di).location}}</text>
                  </view>
                </view>
              </view>
            </view>
            <view v-if="afternoonSections.length > 0">
              <view class="table-row table-period-sep">
                <view class="table-cell table-period-label"><text class="period-text">下午</text></view>
                <view v-for="d in tableDays" :key="'ps'+d" class="table-cell"></view>
              </view>
              <view v-for="sec in afternoonSections" :key="'a'+sec" class="table-row">
                <view class="table-cell table-time-cell">
                  <text class="time-text">第{{sec}}节</text>
                  <text class="time-sub">{{sectionTime[sec] ? sectionTime[sec][0] : ''}}</text>
                </view>
                <view v-for="(day, di) in tableDays" :key="'a'+sec+'-'+di" class="table-cell" :class="{today: di === todayIndex}">
                  <view v-if="getCourseAt(sec, di)" class="table-course">
                    <text class="tc-name">{{getCourseAt(sec, di).name}}</text>
                    <text class="tc-loc">{{getCourseAt(sec, di).location}}</text>
                  </view>
                </view>
              </view>
            </view>
            <view v-if="eveningSections.length > 0">
              <view class="table-row table-period-sep">
                <view class="table-cell table-period-label"><text class="period-text">晚上</text></view>
                <view v-for="d in tableDays" :key="'es'+d" class="table-cell"></view>
              </view>
              <view v-for="sec in eveningSections" :key="'e'+sec" class="table-row">
                <view class="table-cell table-time-cell">
                  <text class="time-text">第{{sec}}节</text>
                  <text class="time-sub">{{sectionTime[sec] ? sectionTime[sec][0] : ''}}</text>
                </view>
                <view v-for="(day, di) in tableDays" :key="'e'+sec+'-'+di" class="table-cell" :class="{today: di === todayIndex}">
                  <view v-if="getCourseAt(sec, di)" class="table-course">
                    <text class="tc-name">{{getCourseAt(sec, di).name}}</text>
                    <text class="tc-loc">{{getCourseAt(sec, di).location}}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-else-if="viewMode === 'week'">
      <view class="card" v-for="(day, dayIndex) in weekDays" :key="dayIndex">
        <text class="card-title">{{day}}</text>
        <view class="course-list" v-if="getCoursesByDay(dayIndex).length > 0">
          <view class="course-item" v-for="(course, index) in getCoursesByDay(dayIndex)" :key="index" :class="{'active-course': isCurrentCourse(course)}" @tap="promptAttendance(course)">
            <view class="course-time-col">
              <text class="course-time">{{course.startTime}}</text>
              <text class="course-end">{{course.endTime}}</text>
            </view>
            <view class="course-detail">
              <text class="cn">{{course.name}}</text>
              <text class="cl">📍{{course.location}}</text>
                          </view>
            <view v-if="getAttendanceStatus(course)" class="att-status" :class="{'att-attended': getAttendanceStatus(course)==='attended', 'att-absent': getAttendanceStatus(course)==='absent'}">
              <text style="color:#fff;font-size:18rpx;">{{getAttendanceLabel(course)}}</text>
            </view>
          </view>
        </view>
        <view class="empty-day" v-else>
          <text class="empty-text">暂无课程</text>
        </view>
      </view>
    </view>

    <view v-else>
      <view class="card">
        <text class="card-title">{{weekDays[todayIndex]}}课程</text>
        <view class="course-list" v-if="getCoursesByDay(todayIndex).length > 0">
          <view class="course-item" v-for="(course, index) in getCoursesByDay(todayIndex)" :key="index" :class="{'active-course': isCurrentCourse(course)}" @tap="promptAttendance(course)">
            <view class="course-time-col">
              <text class="course-time">{{course.startTime}}</text>
              <text class="course-end">{{course.endTime}}</text>
            </view>
            <view class="course-detail">
              <text class="cn">{{course.name}}</text>
              <text class="cl">📍{{course.location}}</text>
                          </view>
            <view v-if="getAttendanceStatus(course)" class="att-status" :class="{'att-attended': getAttendanceStatus(course)==='attended', 'att-absent': getAttendanceStatus(course)==='absent'}">
              <text style="color:#fff;font-size:18rpx;">{{getAttendanceLabel(course)}}</text>
            </view>
          </view>
        </view>
        <view class="empty-day" v-else>
          <text class="empty-text">暂无课程</text>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="card-header">
        <text class="card-title">待完成作业</text>
        <text class="card-action" @click="goImport">+ 添加</text>
      </view>
      <view class="homework-list" v-if="sortedHomeworks.length > 0">
        <view class="hw-item" v-for="hw in sortedHomeworks" :key="hw.id">
          <view class="hw-check" :class="{checked: hw.done}" @click="toggleHomeworkDone(hw)">
            <text v-if="hw.done" class="hw-check-icon">✓</text>
          </view>
          <view class="hw-info">
            <text class="hw-name" :class="{'hw-done-text': hw.done}">{{hw.title}}</text>
            <text class="hw-course">{{hw.courseName}}</text>
            <text class="hw-desc" v-if="hw.description">{{hw.description}}</text>
          </view>
          <view class="hw-deadline">
            <text class="hw-date">{{hw.dueDate}}</text>
            <text class="hw-countdown" :class="getDeadlineClass(hw)">{{getDeadlineText(hw)}}</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-day">
        <text class="empty-text">暂无作业</text>
      </view>
    </view>

    <view class="card">
      <text class="card-title">出勤统计</text>
      <view class="attendance-row">
        <view class="att-item">
          <text class="att-value green">{{attendance.attended}}</text>
          <text class="att-label">已签到</text>
        </view>
        <view class="att-item">
          <text class="att-value red">{{attendance.absent}}</text>
          <text class="att-label">已缺勤</text>
        </view>
        <view class="att-item">
          <text class="att-value blue">{{attendance.rate}}%</text>
          <text class="att-label">出勤率</text>
        </view>
      </view>
    </view>

    <view class="modal-mask" v-if="showSettingsModal" @click="closeSettings">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">课程表设置</text>
          <text class="modal-close" @click="closeSettings">×</text>
        </view>
        <view class="modal-body">
          <scroll-view class="settings-scroll" scroll-y>
            <view class="settings-section">
              <text class="settings-label-title">开学日期</text>
              <picker mode="date" :value="settings.startDate" @change="onStartDateChange">
                <view class="settings-picker"><text class="picker-text">{{settings.startDate}}</text></view>
              </picker>
            </view>
            <view class="settings-section">
              <text class="settings-label-title">上课天数</text>
              <view class="settings-stepper">
                <view class="stepper-btn" @click="adjustSectionCount('weekday', -1)"><text>-</text></view>
                <text class="stepper-value">{{settings.weekdayCount}}天</text>
                <view class="stepper-btn" @click="adjustSectionCount('weekday', 1)"><text>+</text></view>
              </view>
            </view>
            <view class="settings-section">
              <text class="settings-label-title">上午节数</text>
              <view class="settings-stepper">
                <view class="stepper-btn" @click="adjustSectionCount('morning', -1)"><text>-</text></view>
                <text class="stepper-value">{{settings.morningCount}}节</text>
                <view class="stepper-btn" @click="adjustSectionCount('morning', 1)"><text>+</text></view>
              </view>
            </view>
            <view class="settings-section">
              <text class="settings-label-title">下午节数</text>
              <view class="settings-stepper">
                <view class="stepper-btn" @click="adjustSectionCount('afternoon', -1)"><text>-</text></view>
                <text class="stepper-value">{{settings.afternoonCount}}节</text>
                <view class="stepper-btn" @click="adjustSectionCount('afternoon', 1)"><text>+</text></view>
              </view>
            </view>
            <view class="settings-section">
              <text class="settings-label-title">晚上节数</text>
              <view class="settings-stepper">
                <view class="stepper-btn" @click="adjustSectionCount('evening', -1)"><text>-</text></view>
                <text class="stepper-value">{{settings.eveningCount}}节</text>
                <view class="stepper-btn" @click="adjustSectionCount('evening', 1)"><text>+</text></view>
              </view>
            </view>
            <view class="settings-section">
              <text class="settings-label-title">每节时长</text>
              <view class="settings-stepper">
                <text class="stepper-value">{{settings.duration}}分钟</text>
              </view>
            </view>
            <view class="settings-section">
              <text class="settings-label-title">上午开始</text>
              <picker mode="time" :value="settings.morningStart" @change="onMorningStartChange">
                <view class="settings-picker"><text class="picker-text">{{settings.morningStart}}</text></view>
              </picker>
            </view>
            <view class="settings-section">
              <text class="settings-label-title">下午开始</text>
              <picker mode="time" :value="settings.afternoonStart" @change="onAfternoonStartChange">
                <view class="settings-picker"><text class="picker-text">{{settings.afternoonStart}}</text></view>
              </picker>
            </view>
            <view class="settings-section">
              <text class="settings-label-title">晚上开始</text>
              <picker mode="time" :value="settings.eveningStart" @change="onEveningStartChange">
                <view class="settings-picker"><text class="picker-text">{{settings.eveningStart}}</text></view>
              </picker>
            </view>
            <view class="settings-section">
              <text class="settings-label-title">课间休息</text>
              <view class="settings-stepper">
                <text class="stepper-value">{{settings.breakTime}}分钟</text>
              </view>
            </view>
          </scroll-view>
          <button class="btn-submit" @click="saveSettings">保存设置</button>
        </view>
      </view>
    </view>
  </view>

  <!-- 自定义底部导航 -->
  <bottom-nav activeTab="/pages/study/index" />
</template>

<script>
import BottomNav from '../../components/bottom-nav/bottom-nav.vue'
import { homeworkApi } from '../../utils/request.js'

export default {
  components: { BottomNav },
	data() {
		return {
			viewMode: 'table',
			courses: [],
			homeworks: [],
			homeworkDoneStatus: {},
			weekDays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
			todayIndex: 0,
			selectedWeek: 0,
			showSettingsModal: false,
			settings: {
				startDate: '2026-02-28',
				weekdayCount: 5,
				morningCount: 4,
				afternoonCount: 4,
				eveningCount: 2,
				duration: 45,
				morningStart: '08:00',
				afternoonStart: '14:00',
				eveningStart: '19:00',
				breakTime: 10
			}
		}
	},
	computed: {
		tableDays() {
			var names = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日']
			return names.slice(0, this.settings.weekdayCount)
		},
		morningSections() {
			var arr = []
			for (var i = 1; i <= this.settings.morningCount; i++) arr.push(i)
			return arr
		},
		afternoonSections() {
			var arr = []
			var start = this.settings.morningCount + 1
			for (var i = 0; i < this.settings.afternoonCount; i++) arr.push(start + i)
			return arr
		},
		eveningSections() {
			var arr = []
			var start = this.settings.morningCount + this.settings.afternoonCount + 1
			for (var i = 0; i < this.settings.eveningCount; i++) arr.push(start + i)
			return arr
		},
		weekdayCount() {
			return this.settings.weekdayCount
		},
		currentWeek() {
			if (!this.settings.startDate) return 0
			var start = new Date(this.settings.startDate)
			var now = new Date()
			var diff = now.getTime() - start.getTime()
			var weeks = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 2
			return Math.max(0, weeks)
		},
		totalWeeks() {
			return 20
		},
		weekOptions() {
			var opts = [{ label: '全部', value: 0 }]
			for (var i = 1; i <= this.totalWeeks; i++) {
				opts.push({ label: '第' + i + '周', value: i })
			}
			return opts
		},
		filteredCourses() {
			var week = this.selectedWeek
			if (week === 0) return this.courses
			return this.courses.filter(c => this.isCourseActive(c, week))
		},
		sectionTime() {
			var s = this.settings
			var result = {}
			// 优先使用自定义节次时间（万向校历）
			if (s.sectionTimes && Object.keys(s.sectionTimes).length > 0) {
				for (var i = 1; i <= 12; i++) {
					if (s.sectionTimes[i]) {
						result[i] = s.sectionTimes[i]
					}
				}
				return result
			}
			// fallback: 均匀计算
			function toStr(m) {
				var h = Math.floor(m / 60)
				var min = m % 60
				return (h < 10 ? '0' : '') + h + ':' + (min < 10 ? '0' : '') + min
			}
			function parseTime(str) {
				var p = str.split(':')
				return parseInt(p[0]) * 60 + parseInt(p[1])
			}
			var mStart = parseTime(s.morningStart)
			var pStart = parseTime(s.afternoonStart)
			var eStart = parseTime(s.eveningStart)
			var dur = s.duration
			var brk = s.breakTime
			for (var i = 0; i < s.morningCount; i++) {
				var sec = i + 1
				var st = mStart + i * (dur + brk)
				result[sec] = [toStr(st), toStr(st + dur)]
			}
			for (var i = 0; i < s.afternoonCount; i++) {
				var sec = s.morningCount + i + 1
				var st = pStart + i * (dur + brk)
				result[sec] = [toStr(st), toStr(st + dur)]
			}
			for (var i = 0; i < s.eveningCount; i++) {
				var sec = s.morningCount + s.afternoonCount + i + 1
				var st = eStart + i * (dur + brk)
				result[sec] = [toStr(st), toStr(st + dur)]
			}
			return result
		},
		sortedHomeworks() {
			var self = this
			var list = this.homeworks.map(function(hw) {
				return Object.assign({}, hw, { done: !!self.homeworkDoneStatus[hw.id] })
			})
			list.sort(function(a, b) {
				if (a.done !== b.done) return a.done ? 1 : -1
				return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
			})
			return list
		},
		nextCourse() {
			var today = this.getCoursesByDay(this.todayIndex)
			if (today.length === 0) return null
			var now = new Date()
			var nowMin = now.getHours() * 60 + now.getMinutes()
			for (var i = 0; i < today.length; i++) {
				var c = today[i]
				var startMin = this._parseTime(c.startTime)
				if (startMin !== null && startMin > nowMin) return c
				if (!c.startTime && c.startSection) {
					var times = this.sectionTime[c.startSection]
					if (times) {
						var est = this._parseTime(times[0])
						if (est > nowMin) return c
					}
				}
			}
			return null
		},
		attendance() {
			var total = this.courses.length
			if (total === 0) return { rate: 0, attended: 0, absent: 0 }
			try {
				var data = uni.getStorageSync('campus_attendance_records')
				if (data) {
					var records = JSON.parse(data)
					var attended = 0
					var absent = 0
					this.courses.forEach(function(c) {
						var key = c.name + '_' + c.weekDay + '_' + c.startSection
						if (records[key] === 'attended') attended++
						else if (records[key] === 'absent') absent++
					})
					return {
						rate: (attended + absent) > 0 ? Math.round((attended / (attended + absent)) * 100) : 0,
						attended: attended,
						absent: absent
					}
				}
			} catch (e) {}
			return { rate: 0, attended: 0, absent: 0 }
		}
	},
	onShow() {
		this.loadCourses()
		this.loadHomeworkDoneStatus()
		this.loadHomeworksFromServer()
		this.loadSettings()
		this.todayIndex = (new Date().getDay() + 6) % 7
	},
	methods: {
		_parseTime(timeStr) {
			if (!timeStr) return null
			var parts = timeStr.split(':')
			if (parts.length < 2) return null
			return parseInt(parts[0]) * 60 + parseInt(parts[1])
		},
		loadCourses() {
			try {
				var data = uni.getStorageSync('campus_courses')
				this.courses = data ? JSON.parse(data) : []
			} catch (e) {
				this.courses = []
			}
		},
		loadHomeworksFromServer() {
			var self = this
			homeworkApi.fetch().then(function(res) {
				if (res && res.success && res.data && res.data.homeworks) {
					self.homeworks = res.data.homeworks
				}
			}).catch(function(err) {
				console.error('加载作业失败:', err)
			})
		},
		loadHomeworkDoneStatus() {
			try {
				var data = uni.getStorageSync('campus_homework_done')
				if (data) {
					this.homeworkDoneStatus = JSON.parse(data)
				}
			} catch (e) {
				this.homeworkDoneStatus = {}
			}
		},
		saveHomeworkDoneStatus() {
			uni.setStorageSync('campus_homework_done', JSON.stringify(this.homeworkDoneStatus))
		},
		getCoursesByDay(dayIndex) {
			var week = this.selectedWeek || this.currentWeek
			return this.filteredCourses
				.filter(c => {
					if (c.weekDay !== dayIndex) return false
					// Week filtering - use startWeek/endWeek from API data
					if (week > 0) {
						if (c.startWeek && week < c.startWeek) return false
						if (c.endWeek && week > c.endWeek) return false
					}
					return true
				})
				.sort((a, b) => a.startSection - b.startSection)
		},
		getCourseAt(section, dayIndex) {
			var week = this.selectedWeek || this.currentWeek
			return this.filteredCourses.find(c => {
				if (c.weekDay !== dayIndex) return false
				if (c.startSection > section || c.endSection < section) return false
				// Week filtering - use startWeek/endWeek from API data
				if (week > 0) {
					if (c.startWeek && week < c.startWeek) return false
					if (c.endWeek && week > c.endWeek) return false
				}
				return true
			}) || null
		},
		isCourseActive(course, week) {
			var w = week || this.currentWeek
			if (!w || w <= 0) return true
			if (course.weekRange) {
				var m = course.weekRange.match(/(\d+)-(\d+)/)
				if (m) {
					var from = parseInt(m[1])
					var to = parseInt(m[2])
					return w >= from && w <= to
				}
			}
			if (course.weeks && Array.isArray(course.weeks)) {
				return course.weeks.indexOf(w) >= 0
			}
			return true
		},
		getWeekRangeText(course) {
			if (course.weekRange) return course.weekRange
			if (course.zcd) return course.zcd
			return ''
		},
		isCurrentCourse(course) {
			if (course.weekDay !== this.todayIndex) return false
			var now = new Date()
			var nowMin = now.getHours() * 60 + now.getMinutes()
			var startMin = this._parseTime(course.startTime)
			var endMin = this._parseTime(course.endTime)
			if (startMin !== null && endMin !== null) {
				return nowMin >= startMin && nowMin < endMin
			}
			if (course.startSection && course.endSection) {
				var times = this.sectionTime[course.startSection]
				var endTimes = this.sectionTime[course.endSection]
				if (times && endTimes) {
					var startEst = this._parseTime(times[0])
					var endEst = this._parseTime(endTimes[1])
					return nowMin >= startEst && nowMin < endEst
				}
			}
			return false
		},
		getDeadlineDays(hw) {
			if (!hw.dueDate) return null
			var now = new Date()
			now.setHours(0, 0, 0, 0)
			var due = new Date(hw.dueDate)
			return Math.ceil((due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
		},
		getDeadlineText(hw) {
			if (hw.done) return '已完成'
			var days = this.getDeadlineDays(hw)
			if (days === null) return ''
			if (days < 0) return '已逾期' + Math.abs(days) + '天'
			if (days === 0) return '今天截止'
			if (days === 1) return '明天截止'
			return days + '天后截止'
		},
		getDeadlineClass(hw) {
			if (hw.done) return 'done'
			var days = this.getDeadlineDays(hw)
			if (days === null) return ''
			if (days < 0) return 'overdue'
			if (days <= 1) return 'urgent'
			if (days <= 3) return 'soon'
			return 'normal'
		},
		toggleHomeworkDone(hw) {
			var newStatus = {}
			for (var key in this.homeworkDoneStatus) {
				newStatus[key] = this.homeworkDoneStatus[key]
			}
			newStatus[hw.id] = !this.homeworkDoneStatus[hw.id]
			this.homeworkDoneStatus = newStatus
			this.saveHomeworkDoneStatus()
		},
		loadSettings() {
			try {
				var data = uni.getStorageSync('campus_schedule_settings')
				if (data) {
					var s = JSON.parse(data)
					for (var key in s) {
						if (this.settings.hasOwnProperty(key)) {
							this.settings[key] = s[key]
						}
					}
				}
			} catch (e) {}
		},
		saveSettings() {
			uni.setStorageSync('campus_schedule_settings', JSON.stringify(this.settings))
			this.showSettingsModal = false
			// Force re-render by triggering reactive update
			this.settings = JSON.parse(JSON.stringify(this.settings))
			uni.showToast({ title: '设置已保存', icon: 'success' })
		},
		openSettings() {
			this.showSettingsModal = true
		},
		closeSettings() {
			this.showSettingsModal = false
		},
		adjustSectionCount(period, delta) {
			var key = period + 'Count'
			var val = this.settings[key] + delta
			if (val < 0) val = 0
			if (val > 10) val = 10
			this.settings[key] = val
		},
		onStartDateChange(e) {
			this.settings.startDate = e.detail.value
		},
		onMorningStartChange(e) {
			this.settings.morningStart = e.detail.value
		},
		onAfternoonStartChange(e) {
			this.settings.afternoonStart = e.detail.value
		},
		onEveningStartChange(e) {
			this.settings.eveningStart = e.detail.value
		},
		goImport() {
			uni.navigateTo({ url: '/pages/course/import' })
		},
		getAttendanceKey(course) {
			return course.name + '_' + course.weekDay + '_' + course.startSection
		},
		getAttendanceStatus(course) {
			try {
				var records = uni.getStorageSync('campus_attendance_records')
				if (records) {
					var parsed = JSON.parse(records)
					return parsed[this.getAttendanceKey(course)] || ''
				}
			} catch (e) {}
			return ''
		},
		getAttendanceLabel(course) {
			var status = this.getAttendanceStatus(course)
			if (status === 'attended') return '已签到'
			if (status === 'absent') return '已缺勤'
			return ''
		},
		promptAttendance(course) {
			var self = this
			var items = ['已签到', '已缺勤', '取消记录']
			uni.showActionSheet({
				itemList: items,
				success: function(res) {
					var key = self.getAttendanceKey(course)
					var records = {}
					try {
						var data = uni.getStorageSync('campus_attendance_records')
						if (data) records = JSON.parse(data)
					} catch (e) {}
					if (res.tapIndex === 0) {
						records[key] = 'attended'
					} else if (res.tapIndex === 1) {
						records[key] = 'absent'
					} else {
						delete records[key]
					}
					uni.setStorageSync('campus_attendance_records', JSON.stringify(records))
					uni.showToast({ title: '记录已更新', icon: 'success' })
				}
			})
		}
	}
}
</script>

<style>
page {
	background: #dce4f7;
	font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', 'Helvetica Neue', sans-serif;
	min-height: 100vh;
}

.study-page {
	background: transparent;
	min-height: 100vh;
	padding-bottom: 120rpx;
	position: relative;
}

/* 磨砂玻璃背景层 */
.study-page::before {
	content: '';
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(180deg, 
		#4361ee 0%, 
		#5a7bff 8%,
		#7b94f7 18%,
		#a8bdf5 30%,
		#c8d6f8 42%,
		#dce4f7 55%,
		#e8ecff 70%,
		#f0f2ff 85%,
		#f5f6fa 100%
	);
	backdrop-filter: blur(30px) saturate(160%);
	-webkit-backdrop-filter: blur(30px) saturate(160%);
	z-index: -1;
}

/* 导航栏 - 与首页一致 */
.custom-nav {
	background: linear-gradient(180deg, #4361ee, #5a7bff);
}
.nav-status-bar { height: var(--status-bar-height); }
.nav-title-bar {
	padding: 16rpx 32rpx 24rpx;
}
.nav-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #ffffff;
}

/* 视图切换 - iOS 分段控件 */
.view-toggle {
	display: flex;
	margin: 20rpx 28rpx 16rpx;
	background: rgba(255,255,255,0.25);
	border-radius: 12rpx;
	padding: 4rpx;
	backdrop-filter: blur(10px);
	-webkit-backdrop-filter: blur(10px);
}
.toggle-btn {
	flex: 1;
	padding: 14rpx;
	border-radius: 10rpx;
	text-align: center;
	transition: all 0.25s ease;
}
.toggle-btn.active {
	background: #fff;
	box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.1);
}
.toggle-text {
	font-size: 26rpx;
	color: rgba(255,255,255,0.55);
	font-weight: 500;
	transition: all 0.25s ease;
}
.toggle-btn.active .toggle-text {
	color: #4361ee;
	font-weight: 600;
}

/* 导入栏 */
.import-bar {
	display: flex;
	align-items: center;
	gap: 14rpx;
	margin: 0 28rpx 16rpx;
	padding: 20rpx 24rpx;
	background: rgba(255,255,255,0.5);
	border-radius: 20rpx;
	backdrop-filter: blur(10px);
	-webkit-backdrop-filter: blur(10px);
	box-shadow: 0 4rpx 20rpx rgba(67,97,238,0.12);
	border: 1rpx solid rgba(255,255,255,0.6);
	transition: all 0.2s ease;
}
.import-bar:active { transform: scale(0.98); }
.import-icon { font-size: 32rpx; }
.import-text {
	flex: 1;
	font-size: 28rpx;
	color: #4361ee;
	font-weight: 600;
}
.import-arrow { font-size: 28rpx; color: #4361ee; opacity: 0.6; }

/* 课前提醒 */
.reminder-card {
	display: flex;
	align-items: center;
	gap: 20rpx;
	margin: 0 28rpx 16rpx;
	padding: 24rpx;
	background: rgba(255,255,255,0.55);
	border-radius: 20rpx;
	box-shadow: 0 4rpx 20rpx rgba(67,97,238,0.1);
	border: 1rpx solid rgba(255,255,255,0.6);
}
.reminder-icon { font-size: 48rpx; }
.reminder-info { flex: 1; }
.reminder-title {
	font-size: 26rpx;
	font-weight: 600;
	color: #1a1a2e;
	display: block;
	margin-bottom: 4rpx;
}
.reminder-desc {
	font-size: 24rpx;
	color: #666;
	display: block;
	margin-bottom: 2rpx;
}
.reminder-time {
	font-size: 24rpx;
	color: #4361ee;
	font-weight: 600;
}

/* 周选择器 */
.week-selector {
	margin: 0 28rpx 16rpx;
}
.week-scroll { white-space: nowrap; }
.week-chips {
	display: flex;
	gap: 10rpx;
	padding: 2rpx 0;
}
.week-chip {
	min-width: 56rpx;
	height: 52rpx;
	padding: 0 16rpx;
	background: rgba(255,255,255,0.35);
	border-radius: 26rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	transition: all 0.25s ease;
	backdrop-filter: blur(5px);
	-webkit-backdrop-filter: blur(5px);
}
.week-chip.active {
	background: linear-gradient(135deg, #4361ee, #6b83f5);
	box-shadow: 0 4rpx 16rpx rgba(67,97,238,0.35);
}
.week-chip.current-week {
	border: 2rpx solid #4361ee;
	background: rgba(67,97,238,0.1);
}
.week-chip-text {
	font-size: 24rpx;
	color: #666;
	font-weight: 500;
}
.week-chip.active .week-chip-text {
	color: #fff;
	font-weight: 600;
}
.week-chip.current-week:not(.active) .week-chip-text {
	color: #4361ee;
	font-weight: 600;
}

/* 卡片 - 与首页一致 */
.card {
	margin: 0 28rpx 20rpx;
	background: rgba(255,255,255,0.55);
	border-radius: 24rpx;
	padding: 28rpx 24rpx;
	box-shadow: 0 4rpx 24rpx rgba(0,0,0,0.06);
	backdrop-filter: blur(10px);
	-webkit-backdrop-filter: blur(10px);
	border: 1rpx solid rgba(255,255,255,0.6);
}
.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16rpx;
}
.card-title {
	font-size: 30rpx;
	font-weight: 700;
	color: #1a1a2e;
	margin-bottom: 16rpx;
}
.card-header .card-title { margin-bottom: 0; }
.card-action {
	font-size: 24rpx;
	color: #4361ee;
	font-weight: 500;
}

/* 课程表 */
.table-card {
	margin: 0 28rpx 20rpx;
	background: rgba(255,255,255,0.92);
	border-radius: 24rpx;
	padding: 24rpx;
	box-shadow: 0 4rpx 24rpx rgba(0,0,0,0.06);
	backdrop-filter: blur(10px);
	-webkit-backdrop-filter: blur(10px);
	border: 1rpx solid rgba(255,255,255,0.6);
}
.table-title-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8rpx;
}
.table-title {
	font-size: 30rpx;
	font-weight: 700;
	color: #1a1a2e;
}
.table-settings-btn {
	display: flex;
	align-items: center;
	gap: 6rpx;
	padding: 8rpx 16rpx;
	background: rgba(67,97,238,0.08);
	border-radius: 16rpx;
}
.settings-icon { font-size: 24rpx; }
.settings-label {
	font-size: 22rpx;
	color: #4361ee;
	font-weight: 500;
}
.table-week-info {
	font-size: 24rpx;
	color: #999;
	display: block;
	margin-bottom: 16rpx;
}
.current-week-badge {
	color: #4361ee;
	font-weight: 700;
}
.table-scroll {
	overflow-x: auto;
	-webkit-overflow-scrolling: touch;
}
.table-grid {
	min-width: 100%;
}
.table-row {
	display: flex;
}
.table-cell {
	flex: 1;
	min-width: 90rpx;
	padding: 8rpx 4rpx;
	text-align: center;
	border-bottom: 1rpx solid rgba(0,0,0,0.04);
}
.table-header {
	background: linear-gradient(180deg, rgba(67,97,238,0.06), rgba(67,97,238,0.02));
}
.table-day-header.today {
	background: rgba(67,97,238,0.12);
	border-radius: 10rpx 10rpx 0 0;
}
.th-text {
	font-size: 22rpx;
	color: #666;
	font-weight: 600;
}
.th-text.today {
	color: #4361ee;
	font-weight: 700;
}
.table-time-cell {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 2rpx;
}
.time-text {
	font-size: 20rpx;
	color: #999;
	font-weight: 500;
}
.time-sub {
	font-size: 16rpx;
	color: #bbb;
}
.table-period-sep .table-period-label {
	background: rgba(67,97,238,0.06);
	border-radius: 8rpx;
	padding: 6rpx;
}
.period-text {
	font-size: 20rpx;
	color: #4361ee;
	font-weight: 600;
}
.table-course {
	padding: 8rpx 6rpx;
	background: linear-gradient(135deg, rgba(67,97,238,0.12), rgba(107,131,245,0.08));
	border-radius: 10rpx;
	border-left: 4rpx solid #4361ee;
}
.tc-name {
	font-size: 18rpx;
	color: #1a1a2e;
	font-weight: 600;
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.tc-loc {
	font-size: 14rpx;
	color: #999;
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

/* 课程列表 */
.course-item {
	display: flex;
	gap: 16rpx;
	padding: 20rpx 16rpx;
	border-radius: 16rpx;
	margin-bottom: 10rpx;
	background: transparent;
	transition: all 0.2s ease;
}
.course-item:active {
	transform: scale(0.98);
	background: rgba(67,97,238,0.06);
}
.course-time-col {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-width: 90rpx;
	gap: 4rpx;
}
.course-time, .course-end {
	font-size: 22rpx;
	color: #4361ee;
	font-weight: 600;
}
.course-end {
	font-size: 18rpx;
	color: #999;
	font-weight: 400;
}
.course-detail {
	flex: 1;
}
.cn {
	font-size: 28rpx;
	font-weight: 600;
	color: #1a1a2e;
	margin-bottom: 4rpx;
	display: block;
}
.cl {
	font-size: 22rpx;
	color: #999;
	display: block;
	margin-bottom: 2rpx;
}
.course-week-range {
	font-size: 20rpx;
	color: #bbb;
}
.active-course {
	background: linear-gradient(135deg, rgba(67,97,238,0.18), rgba(107,131,245,0.08)) !important;
		border-left: 4rpx solid #5a7bff;
	border-left: 4rpx solid #4361ee;
	padding-left: 12rpx;
}
.att-status {
	padding: 6rpx 12rpx;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	align-self: center;
}
.att-attended { background: #34C759; }
.att-absent { background: #FF3B30; }

.course-list {
		margin-bottom: 0;
	}
	
	/* 空状态 */
.empty-day {
	padding: 48rpx 24rpx;
	text-align: center;
}
.empty-text {
	font-size: 26rpx;
	color: #bbb;
}

/* 作业 */
.hw-item {
	display: flex;
	gap: 16rpx;
	padding: 20rpx 16rpx;
	border-radius: 16rpx;
	margin-bottom: 10rpx;
	background: transparent;
	transition: all 0.2s ease;
}
.hw-item:active { transform: scale(0.98); }
.hw-check {
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	border: 2rpx solid #ddd;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	margin-top: 4rpx;
	transition: all 0.2s ease;
}
.hw-check.checked {
	background: #4361ee;
	border-color: #4361ee;
}
.hw-check-icon {
	font-size: 22rpx;
	color: #fff;
	font-weight: bold;
}
.hw-info { flex: 1; }
.hw-name {
	font-size: 28rpx;
	font-weight: 600;
	color: #1a1a2e;
	display: block;
	margin-bottom: 4rpx;
}
.hw-done-text {
	text-decoration: line-through;
	color: #ccc !important;
}
.hw-course {
	font-size: 22rpx;
	color: #4361ee;
	display: block;
	margin-bottom: 2rpx;
}
.hw-desc {
	font-size: 20rpx;
	color: #999;
	display: block;
}
.hw-deadline {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 4rpx;
}
.hw-date {
	font-size: 22rpx;
	color: #999;
}
.hw-countdown {
	font-size: 20rpx;
	font-weight: 600;
	padding: 4rpx 10rpx;
	border-radius: 8rpx;
}
.deadline-urgent { color: #FF3B30; background: rgba(255,59,48,0.1); }
.deadline-soon { color: #FF9500; background: rgba(255,149,0,0.1); }
.deadline-ok { color: #34C759; background: rgba(52,199,89,0.1); }

/* 出勤统计 */
.attendance-row {
	display: flex;
	justify-content: space-around;
	padding: 12rpx 0;
}
.att-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
}
.att-value {
	font-size: 48rpx;
	font-weight: 800;
}
.att-value.green { color: #34C759; }
.att-value.red { color: #FF3B30; }
.att-value.blue { color: #4361ee; }
.att-label {
	font-size: 22rpx;
	color: #999;
}

/* 设置弹窗 */
.modal-mask {
	position: fixed;
	top: 0; left: 0; right: 0; bottom: 0;
	background: rgba(0,0,0,0.4);
	z-index: 999;
	display: flex;
	align-items: flex-end;
}
.modal-content {
	position: relative;
	width: 100%;
	margin-top: auto;
	background: #f5f6fa;
	border-radius: 24rpx 24rpx 0 0;
	max-height: 80vh;
	display: flex;
	flex-direction: column;
}
.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 28rpx 32rpx 20rpx;
	border-bottom: 1rpx solid rgba(0,0,0,0.06);
}
.modal-title {
	font-size: 32rpx;
	font-weight: 700;
	color: #1a1a2e;
}
.modal-close {
	font-size: 40rpx;
	color: #999;
	padding: 0 8rpx;
}
.modal-body {
	padding: 24rpx 32rpx 40rpx;
	overflow-y: auto;
}
.settings-scroll {
	max-height: 50vh;
}
.settings-section {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 0;
	border-bottom: 1rpx solid rgba(0,0,0,0.04);
}
.settings-label-title {
	font-size: 28rpx;
	color: #1a1a2e;
	font-weight: 500;
}
.settings-stepper {
	display: flex;
	align-items: center;
	gap: 16rpx;
}
.stepper-btn {
	width: 48rpx;
	height: 48rpx;
	border-radius: 50%;
	background: rgba(67,97,238,0.1);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	color: #4361ee;
	font-weight: 600;
}
.stepper-value {
	font-size: 26rpx;
	color: #1a1a2e;
	font-weight: 600;
	min-width: 80rpx;
	text-align: center;
}
.settings-picker {
	padding: 10rpx 20rpx;
	background: rgba(67,97,238,0.08);
	border-radius: 12rpx;
}
.picker-text {
	font-size: 26rpx;
	color: #4361ee;
	font-weight: 500;
}
.btn-submit {
	margin-top: 24rpx;
	background: linear-gradient(135deg, #4361ee, #6b83f5);
	color: #fff;
	font-size: 30rpx;
	font-weight: 600;
	border: none;
	border-radius: 16rpx;
	padding: 24rpx;
	box-shadow: 0 4rpx 20rpx rgba(67,97,238,0.3);
}
.btn-submit::after { border: none; }
</style>