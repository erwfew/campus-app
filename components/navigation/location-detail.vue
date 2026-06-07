<template>
  <view class="detail-mask" v-if="visible" @tap="$emit('close')">
    <view class="detail-panel" @tap.stop>
      <view class="detail-handle"></view>
      <view class="detail-header">
        <text class="detail-name">{{ location.name }}</text>
        <text class="detail-type">{{ location.typeName }}</text>
      </view>
      <view class="detail-info">
        <text class="detail-row">📍 {{ location.typeName }}</text>
        <text class="detail-row" v-if="location.openTime">🕐 {{ location.openTime }}</text>
        <text class="detail-row" v-if="location.desc">ℹ️ {{ location.desc }}</text>
      </view>
      <view class="detail-actions">
        <view class="detail-btn secondary" @tap="$emit('close')">
          <text>关闭</text>
        </view>
        <view class="detail-btn primary" @tap="$emit('navigate', location)">
          <text>导航到这里</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'LocationDetail',
  props: {
    visible: { type: Boolean, default: false },
    location: { type: Object, default: () => ({}) }
  },
  emits: ['close', 'navigate']
}
</script>

<style scoped>
.detail-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}
.detail-panel {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 32rpx 32rpx 0 0;
  width: 100%;
  padding: 24rpx 40rpx calc(60rpx + var(--safe-area-inset-bottom));
  animation: slideUp 0.3s ease;
  border-top: 1rpx solid rgba(255, 255, 255, 0.5);
}
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.detail-handle {
  width: 80rpx;
  height: 8rpx;
  background: rgba(0, 0, 0, 0.12);
  border-radius: 4rpx;
  margin: 0 auto 24rpx;
}
.detail-header { margin-bottom: 24rpx; }
.detail-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #1a1a2e;
  display: block;
  margin-bottom: 8rpx;
}
.detail-type {
  font-size: 24rpx;
  color: #5a7bff;
  background: rgba(238, 240, 255, 0.8);
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-weight: 500;
}
.detail-info { margin-bottom: 32rpx; }
.detail-row {
  font-size: 28rpx;
  color: #555;
  display: block;
  margin-bottom: 12rpx;
}
.detail-actions {
  display: flex;
  gap: 20rpx;
}
.detail-btn {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: bold;
  transition: transform 0.2s ease;
}
.detail-btn:active { transform: scale(0.97); }
.detail-btn.primary {
  background: linear-gradient(135deg, #5a7bff, #8b9fff);
  color: #ffffff;
  box-shadow: 0 6rpx 24rpx rgba(90, 123, 255, 0.3);
}
.detail-btn.secondary {
  background: rgba(245, 246, 250, 0.8);
  color: #666;
}
</style>
