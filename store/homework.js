import { defineStore } from 'pinia'

export const useHomeworkStore = defineStore('homework', {
  state: () => ({
    doneMap: {},
    loaded: false
  }),

  getters: {
    isDone: (state) => {
      return function(id) {
        return !!state.doneMap[id]
      }
    }
  },

  actions: {
    loadFromStorage() {
      try {
        var data = uni.getStorageSync('campus_homework_done')
        if (data) {
          this.doneMap = JSON.parse(data)
        }
        this.loaded = true
      } catch (e) {
        this.loaded = true
      }
    },
    saveToStorage() {
      try {
        uni.setStorageSync('campus_homework_done', JSON.stringify(this.doneMap))
      } catch (e) {}
    },
    toggleDone(id) {
      var newMap = {}
      for (var key in this.doneMap) {
        newMap[key] = this.doneMap[key]
      }
      newMap[id] = !this.doneMap[id]
      this.doneMap = newMap
      this.saveToStorage()
    },
    setDone(id, val) {
      var newMap = {}
      for (var key in this.doneMap) {
        newMap[key] = this.doneMap[key]
      }
      newMap[id] = val
      this.doneMap = newMap
      this.saveToStorage()
    }
  }
})
