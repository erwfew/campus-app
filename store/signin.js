import { defineStore } from 'pinia'

export const useSigninStore = defineStore('signin', {
  state: () => ({
    records: [],
    loaded: false
  }),

  getters: {
    /** 今天是否已签到 */
    signedToday: (state) => {
      var today = new Date()
      var dateStr = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate()
      return state.records.indexOf(dateStr) >= 0
    },
    todayDateStr: () => {
      var today = new Date()
      return today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate()
    }
  },

  actions: {
    loadFromStorage() {
      try {
        var data = uni.getStorageSync('campus_signin')
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
        uni.setStorageSync('campus_signin', JSON.stringify(this.records))
      } catch (e) {}
    },
    /** 签到（兼容旧的字符串格式） */
    signIn() {
      var dateStr = this.todayDateStr
      if (this.records.indexOf(dateStr) >= 0) return false
      // 兼容旧格式：如果 storage 里是字符串，先迁移
      this.records.push(dateStr)
      this.saveToStorage()
      return true
    },
    checkToday() {
      // 兼容旧格式：旧数据可能直接存了日期字符串
      try {
        var raw = uni.getStorageSync('campus_signin')
        if (typeof raw === 'string' && raw.indexOf('[') !== 0) {
          // 旧格式：直接是日期字符串
          var today = new Date()
          var dateStr = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate()
          if (raw === dateStr) {
            this.records = [dateStr]
            this.saveToStorage()
            return true
          }
          return false
        }
      } catch (e) {}
      return this.signedToday
    }
  }
})
