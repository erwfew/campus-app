import { defineStore } from 'pinia'

export const useMascotStore = defineStore('mascot', {
  state: () => ({
    emoji: '🐱',
    name: '小喵',
    level: 5,
    exp: 0,
    maxExp: 1000,
    loaded: false
  }),

  getters: {
    expPercent: (state) => {
      return state.maxExp > 0 ? Math.round((state.exp / state.maxExp) * 100) : 0
    },
    displayLevel: (state) => `Lv.${state.level}`
  },

  actions: {
    /** 从本地存储加载吉祥物 */
    loadFromStorage() {
      try {
        const data = uni.getStorageSync('campus_mascot')
        if (data) {
          const m = JSON.parse(data)
          this.emoji = m.emoji || '🐱'
          this.name = m.name || '小喵'
          this.level = m.level || 5
          this.exp = m.exp || 0
          this.maxExp = m.maxExp || 1000
        }
        this.loaded = true
      } catch (e) {
        this.loaded = true
      }
    },

    /** 保存吉祥物到本地 */
    saveToStorage() {
      try {
        uni.setStorageSync('campus_mascot', JSON.stringify({
          emoji: this.emoji,
          name: this.name,
          level: this.level,
          exp: this.exp,
          maxExp: this.maxExp
        }))
      } catch (e) {}
    },

    /** 增加经验值 */
    addExp(amount) {
      this.exp += amount
      // 升级检测
      while (this.exp >= this.maxExp) {
        this.level++
        this.exp -= this.maxExp
        this.maxExp = Math.round(this.maxExp * 1.5)
      }
      this.saveToStorage()
    },

    /** 更新吉祥物外观 */
    update({ emoji, name }) {
      if (emoji !== undefined) this.emoji = emoji
      if (name !== undefined) this.name = name
      this.saveToStorage()
    },

    /** 重置吉祥物 */
    reset() {
      this.emoji = '🐱'
      this.name = '小喵'
      this.level = 5
      this.exp = 0
      this.maxExp = 1000
      this.saveToStorage()
    }
  }
})
