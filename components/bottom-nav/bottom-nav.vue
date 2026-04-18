<template>
  <view class="bottom-nav">
    <view
      class="bottom-nav-item"
      :class="{ active: activeTab === item.path }"
      v-for="item in navItems"
      :key="item.path"
      @click="goTab(item.path)"
    >
      <text class="bottom-nav-icon">{{ item.icon }}</text>
      <text class="bottom-nav-text">{{ item.label }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'BottomNav',
  props: {
    activeTab: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      navItems: [
        { path: '/pages/index/index', icon: '🏠', label: '首页' },
        { path: '/pages/navigation/index', icon: '🧭', label: '导航' },
        { path: '/pages/study/index', icon: '📚', label: '学习' },
        { path: '/pages/sport/index', icon: '🏃', label: '运动' },
        { path: '/pages/profile/index', icon: '👤', label: '我的' }
      ]
    }
  },
  methods: {
    goTab(path) {
      uni.redirectTo({ url: path })
    }
  }
}
</script>

<style>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 100rpx;
  padding-bottom: env(safe-area-inset-bottom);
  padding-bottom: constant(safe-area-inset-bottom);
  background: rgba(255, 255, 255, 0.98);
  border-top: 1rpx solid rgba(0, 0, 0, 0.08);
  z-index: 9999;
}
.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  gap: 2rpx;
}
.bottom-nav-icon {
  font-size: 40rpx;
  line-height: 1;
}
.bottom-nav-text {
  font-size: 20rpx;
  color: #8e8e93;
}
.bottom-nav-item.active .bottom-nav-text {
  color: #4361ee;
  font-weight: 600;
}
</style>
