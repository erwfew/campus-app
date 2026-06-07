import { defineStore } from 'pinia'

export const useScheduleStore = defineStore('schedule', {
  state: () => ({
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
    },
    loaded: false
  }),

  actions: {
    loadFromStorage() {
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
        this.loaded = true
      } catch (e) {
        this.loaded = true
      }
    },
    saveToStorage() {
      try {
        uni.setStorageSync('campus_schedule_settings', JSON.stringify(this.settings))
      } catch (e) {}
    },
    updateSettings(newSettings) {
      for (var key in newSettings) {
        if (this.settings.hasOwnProperty(key)) {
          this.settings[key] = newSettings[key]
        }
      }
      this.saveToStorage()
    }
  }
})
