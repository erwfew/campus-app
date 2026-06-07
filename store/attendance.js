import { defineStore } from 'pinia'

export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    records: {},
    loaded: false
  }),

  getters: {
    /** 统计出勤数据（需要传入课程列表） */
    getStats: (state) => {
      return function(courses) {
        var total = courses.length
        if (total === 0) return { rate: 0, attended: 0, absent: 0 }
        var attended = 0
        var absent = 0
        courses.forEach(function(c) {
          var key = c.name + '_' + c.weekDay + '_' + c.startSection
          if (state.records[key] === 'attended') attended++
          else if (state.records[key] === 'absent') absent++
        })
        return {
          rate: (attended + absent) > 0 ? Math.round((attended / (attended + absent)) * 100) : 0,
          attended: attended,
          absent: absent
        }
      }
    }
  },

  actions: {
    loadFromStorage() {
      try {
        var data = uni.getStorageSync('campus_attendance_records')
        if (data) {
          this.records = JSON.parse(data)
        }
        this.loaded = true
      } catch (e) {
        this.loaded = true
      }
    },
    saveToStorage() {
      try {
        uni.setStorageSync('campus_attendance_records', JSON.stringify(this.records))
      } catch (e) {}
    },
    getStatus(course) {
      var key = course.name + '_' + course.weekDay + '_' + course.startSection
      return this.records[key] || ''
    },
    setStatus(course, status) {
      var key = course.name + '_' + course.weekDay + '_' + course.startSection
      if (status === 'delete') {
        delete this.records[key]
      } else {
        this.records[key] = status
      }
      this.saveToStorage()
    }
  }
})
