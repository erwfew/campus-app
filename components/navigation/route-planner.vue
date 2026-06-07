<template>
  <view class="route-planner">
    <text class="card-title">路线规划</text>
    <view class="route-modes">
      <text
        class="route-mode"
        :class="{ active: travelMode === 'walk' }"
        @tap="$emit('switch-mode', 'walk')"
      >步行</text>
      <text
        class="route-mode"
        :class="{ active: travelMode === 'cycle' }"
        @tap="$emit('switch-mode', 'cycle')"
      >骑行</text>
    </view>
    <view class="route-card" @tap="$emit('select-start')">
      <view class="route-row">
        <view class="route-dot start-dot"></view>
        <text class="route-text">{{ startPointName }}</text>
      </view>
    </view>
    <view class="route-line-v"></view>
    <view
      class="route-row waypoint-row"
      v-for="(wp, wpIdx) in waypoints"
      :key="'wp-' + wpIdx"
    >
      <view class="route-dot waypoint-dot"></view>
      <text class="route-text" @tap.stop="$emit('select-waypoint', wpIdx)">{{ wp.name }}</text>
      <text class="waypoint-remove" @tap.stop="$emit('remove-waypoint', wpIdx)">✕</text>
    </view>
    <view class="route-line-v" v-if="waypoints.length > 0"></view>
    <view class="add-waypoint-btn" @tap="$emit('add-waypoint')">
      <text class="add-waypoint-icon">+</text>
      <text class="add-waypoint-text">添加途经点</text>
    </view>
    <view class="route-line-v"></view>
    <view class="route-card" @tap="$emit('select-end')">
      <view class="route-row">
        <view class="route-dot end-dot"></view>
        <text class="route-text">{{ endPointName }}</text>
      </view>
    </view>
    <view class="route-result" v-if="routeResult">
      <text class="route-result-text">{{ routeResult }}</text>
      <text class="route-source" v-if="routeSource">{{ routeSource }}</text>
    </view>
    <view class="route-btn" @tap="$emit('start-nav')" v-if="canStartNav">
      <text class="route-btn-text">开始导航</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'RoutePlanner',
  props: {
    startPointName: { type: String, default: '我的位置' },
    endPointName: { type: String, default: '请选择目的地' },
    waypoints: { type: Array, default: () => [] },
    travelMode: { type: String, default: 'walk' },
    routeResult: { type: String, default: '' },
    routeSource: { type: String, default: '' },
    canStartNav: { type: Boolean, default: false }
  },
  emits: ['switch-mode', 'select-start', 'select-end', 'select-waypoint', 'remove-waypoint', 'add-waypoint', 'start-nav']
}
</script>

<style scoped>
.route-planner { margin: 0; }
.card-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1a1a2e;
  display: block;
  margin-bottom: 20rpx;
}
.route-modes {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}
.route-mode {
  padding: 12rpx 32rpx;
  border-radius: 40rpx;
  font-size: 26rpx;
  background: rgba(245, 246, 250, 0.6);
  color: #666;
  border: 1rpx solid rgba(255, 255, 255, 0.3);
  transition: all 0.2s ease;
}
.route-mode.active {
  background: linear-gradient(135deg, #5a7bff, #8b9fff);
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 4rpx 16rpx rgba(90, 123, 255, 0.3);
}
.route-card {
  background: rgba(245, 246, 250, 0.75);
  border-radius: 16rpx;
  padding: 24rpx;
  border: none;
}
.route-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.route-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  flex-shrink: 0;
}
.start-dot { background: #4caf50; }
.end-dot { background: #f44336; }
.waypoint-dot { background: #ff9800; }
.waypoint-row { position: relative; }
.waypoint-remove {
  margin-left: auto;
  font-size: 24rpx;
  color: #999;
  padding: 8rpx 12rpx;
}
.add-waypoint-btn {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 0 12rpx 36rpx;
}
.add-waypoint-icon {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 2rpx dashed #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #999;
}
.add-waypoint-text { font-size: 24rpx; color: #999; }
.route-text { font-size: 28rpx; color: #1a1a2e; }
.route-line-v {
  width: 2rpx;
  height: 30rpx;
  background: rgba(0, 0, 0, 0.1);
  margin: 8rpx 0 8rpx 9rpx;
}
.route-result {
  background: rgba(232, 245, 233, 0.85);
  border-radius: 12rpx;
  padding: 20rpx;
  text-align: center;
  margin-bottom: 20rpx;
  border: 1rpx solid rgba(76, 175, 80, 0.15);
}
.route-result-text {
  font-size: 28rpx;
  color: #4caf50;
  font-weight: bold;
  display: block;
}
.route-source {
  font-size: 20rpx;
  color: #999;
  display: block;
  margin-top: 8rpx;
}
.route-btn {
  background: linear-gradient(135deg, #5a7bff, #8b9fff);
  border-radius: 16rpx;
  padding: 24rpx;
  text-align: center;
  box-shadow: 0 6rpx 24rpx rgba(90, 123, 255, 0.3);
  transition: transform 0.2s ease;
}
.route-btn:active { transform: scale(0.97); }
.route-btn-text {
  color: #ffffff;
  font-size: 30rpx;
  font-weight: bold;
}
</style>
