import { defineStore } from 'pinia'

export const useNoticeStore = defineStore('notice', {
  state: () => ({
    list: [],
    loaded: false
  }),

  getters: {
    noticeCount: (state) => state.list.length,
    hotNotices: (state) => state.list.filter(n => n.tagType === 'hot'),
    newNotices: (state) => state.list.filter(n => n.tagType === 'new')
  },

  actions: {
    /** 从本地存储加载公告 */
    loadFromStorage() {
      try {
        const cached = uni.getStorageSync('campus_notices')
        if (cached) {
          this.list = JSON.parse(cached)
        }
        this.loaded = true
      } catch (e) {
        this.loaded = true
      }
    },

    /** 保存公告到本地 */
    saveToStorage() {
      try {
        uni.setStorageSync('campus_notices', JSON.stringify(this.list))
      } catch (e) {}
    },

    /** 设置公告列表 */
    setNotices(notices) {
      this.list = notices
      this.saveToStorage()
    },

    /** 添加公告 */
    addNotice(notice) {
      this.list.unshift(notice)
      this.saveToStorage()
    },

    /** 获取公告详情（按 ID） */
    getNoticeById(id) {
      return this.list.find(n => n.id === id) || null
    }
  }
})
