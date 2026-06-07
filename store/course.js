import { defineStore } from 'pinia'

export const useCourseStore = defineStore('course', {
  state: () => ({
    allCourses: [],
    loaded: false
  }),

  getters: {
    /** 今日课程 */
    todayCourses: (state) => {
      const todayIndex = (new Date().getDay() + 6) % 7 // 周日=0转为6
      return state.allCourses
        .filter(c => c.weekDay === todayIndex)
        .sort((a, b) => a.startSection - b.startSection)
    },

    /** 按星期分组 */
    coursesByWeek: (state) => {
      const groups = {}
      for (let i = 0; i < 7; i++) groups[i] = []
      state.allCourses.forEach(c => {
        if (groups[c.weekDay]) groups[c.weekDay].push(c)
      })
      // 每组内按节次排序
      Object.values(groups).forEach(arr => {
        arr.sort((a, b) => a.startSection - b.startSection)
      })
      return groups
    },

    /** 总课程数 */
    courseCount: (state) => state.allCourses.length
  },

  actions: {
    /** 从本地存储加载课程 */
    loadFromStorage() {
      try {
        const data = uni.getStorageSync('campus_courses')
        if (data) {
          this.allCourses = JSON.parse(data)
        }
        this.loaded = true
      } catch (e) {
        console.error('[CourseStore] loadFromStorage error:', e)
        this.loaded = true
      }
    },

    /** 保存课程到本地 */
    saveToStorage() {
      try {
        uni.setStorageSync('campus_courses', JSON.stringify(this.allCourses))
      } catch (e) {}
    },

    /** 设置课程列表 */
    setCourses(courses) {
      this.allCourses = courses
      this.saveToStorage()
    },

    /** 添加课程 */
    addCourse(course) {
      this.allCourses.push(course)
      this.saveToStorage()
    },

    /** 删除课程 */
    removeCourse(index) {
      this.allCourses.splice(index, 1)
      this.saveToStorage()
    },

    /** 清空课程 */
    clearCourses() {
      this.allCourses = []
      try {
        uni.removeStorageSync('campus_courses')
      } catch (e) {}
    }
  }
})
