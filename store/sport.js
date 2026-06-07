import { defineStore } from 'pinia'

export const useSportStore = defineStore('sport', {
  state: () => ({
    runHistory: [],
    loaded: false
  }),

  getters: {
    totalDistance: (state) => {
      var totalKm = 0
      state.runHistory.forEach(function(item) {
        totalKm += parseFloat(item.distance) || 0
      })
      return totalKm.toFixed(1)
    },
    totalRuns: (state) => state.runHistory.length.toString(),
    totalCalories: (state) => {
      var totalCal = 0
      state.runHistory.forEach(function(item) {
        totalCal += parseInt(item.calories) || 0
      })
      return totalCal.toString()
    }
  },

  actions: {
    loadFromStorage() {
      try {
        var data = uni.getStorageSync('campus_run_history')
        if (data) {
          this.runHistory = JSON.parse(data)
        }
        this.loaded = true
      } catch (e) {
        this.loaded = true
      }
    },
    saveToStorage() {
      try {
        uni.setStorageSync('campus_run_history', JSON.stringify(this.runHistory))
      } catch (e) {}
    },
    addRecord(record) {
      this.runHistory.unshift(record)
      if (this.runHistory.length > 50) this.runHistory = this.runHistory.slice(0, 50)
      this.saveToStorage()
    },
    clearHistory() {
      this.runHistory = []
      try {
        uni.removeStorageSync('campus_run_history')
      } catch (e) {}
    }
  }
})
