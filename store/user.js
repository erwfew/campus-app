import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    userInfo: null,
    verified: false,
    schoolName: '',
    studentId: '',
    verifyDate: '',
    isLoggedIn: false,
    // 个人资料
    profile: {
      name: '张同学',
      dept: '计算机科学与技术 2024级'
    }
  }),

  getters: {
    avatarEmoji: (state) => {
      return state.profile.name ? state.profile.name.charAt(0) : 'U'
    },
    displayName: (state) => {
      return state.profile.name || '同学'
    }
  },

  actions: {
    /** 从本地存储恢复用户状态 */
    initFromStorage() {
      try {
        const token = uni.getStorageSync('campus_token') || ''
        let userInfo = null
        try {
          const raw = uni.getStorageSync('campus_user')
          if (raw) userInfo = JSON.parse(raw)
        } catch (e) {}

        this.token = token
        this.userInfo = userInfo
        this.isLoggedIn = !!token

        // 恢复个人资料
        try {
          const profileData = uni.getStorageSync('campus_profile')
          if (profileData) {
            const p = JSON.parse(profileData)
            this.profile = { ...this.profile, ...p }
          }
        } catch (e) {}

        // 恢复认证信息（兼容 campus_verify 和 campus_school_verify）
        try {
          var verifyData = uni.getStorageSync('campus_school_verify') || uni.getStorageSync('campus_verify')
          if (verifyData) {
            var v = JSON.parse(verifyData)
            this.verified = v.verified || false
            this.schoolName = v.schoolName || ''
            this.studentId = v.studentId || ''
            this.verifyDate = v.verifyDate || ''
          }
        } catch (e) {}
      } catch (e) {
        console.error('[UserStore] initFromStorage error:', e)
      }
    },

    /** 登录 */
    login(token, userInfo) {
      try {
        uni.setStorageSync('campus_token', token)
        uni.setStorageSync('campus_user', JSON.stringify(userInfo))
      } catch (e) {}
      this.token = token
      this.userInfo = userInfo
      this.isLoggedIn = true
    },

    /** 登出 */
    logout() {
      try {
        uni.removeStorageSync('campus_token')
        uni.removeStorageSync('campus_user')
      } catch (e) {}
      this.token = ''
      this.userInfo = null
      this.isLoggedIn = false
      this.verified = false
      this.schoolName = ''
      this.studentId = ''
      this.verifyDate = ''
      this.profile = { name: '张同学', dept: '计算机科学与技术 2024级' }
    },

    /** 更新个人资料 */
    updateProfile(data) {
      this.profile = { ...this.profile, ...data }
      try {
        uni.setStorageSync('campus_profile', JSON.stringify(this.profile))
      } catch (e) {}
    },

    /** 更新认证信息 */
    setVerified(info) {
      this.verified = info.verified || false
      this.schoolName = info.schoolName || ''
      this.studentId = info.studentId || ''
      this.verifyDate = info.verifyDate || ''
      try {
        var verifyObj = {
          verified: this.verified,
          schoolName: this.schoolName,
          studentId: this.studentId,
          verifyDate: this.verifyDate
        }
        uni.setStorageSync('campus_school_verify', JSON.stringify(verifyObj))
      } catch (e) {}
    },

    /** 解除认证 */
    clearVerify() {
      this.verified = false
      this.schoolName = ''
      this.studentId = ''
      this.verifyDate = ''
      try {
        uni.removeStorageSync('campus_school_verify')
      } catch (e) {}
    }
  }
})
