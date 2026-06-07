<template>
  <view class="detail-mask" v-if="visible" @tap="$emit('close')">
    <view class="picker-panel" @tap.stop>
      <view class="picker-handle"></view>
      <text class="picker-title">{{ title }}</text>
      <view class="picker-search">
        <input class="picker-search-input" :placeholder="'搜索' + title + '...'" v-model="searchText" />
      </view>
      <scroll-view class="picker-list" scroll-y>
        <view
          class="picker-item"
          v-for="(item, index) in filteredItems"
          :key="index"
          @tap="$emit('select', item)"
        >
          <text class="picker-item-icon">{{ getIcon(item.type) }}</text>
          <view class="picker-item-info">
            <text class="picker-item-name">{{ item.name }}</text>
            <text class="picker-item-desc" v-if="item.desc">{{ item.desc }}</text>
          </view>
        </view>
        <view class="picker-empty" v-if="filteredItems.length === 0">
          <text class="picker-empty-text">未找到匹配项</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'PlacePicker',
  props: {
    visible: { type: Boolean, default: false },
    title: { type: String, default: '选择地点' },
    items: { type: Array, default: () => [] }
  },
  emits: ['close', 'select'],
  data() {
    return { searchText: '' }
  },
  computed: {
    filteredItems() {
      if (!this.searchText) return this.items
      var keyword = this.searchText.toLowerCase()
      return this.items.filter(function (item) {
        return item.name.toLowerCase().indexOf(keyword) > -1 ||
               (item.typeName && item.typeName.toLowerCase().indexOf(keyword) > -1) ||
               (item.desc && item.desc.toLowerCase().indexOf(keyword) > -1)
      })
    }
  },
  watch: {
    visible: function (val) {
      if (!val) this.searchText = ''
    }
  },
  methods: {
    getIcon(type) {
      var icons = {
        teaching: '🏫', library: '📚', canteen: '🍜',
        dormitory: '🛏️', playground: '🏃', sports: '🏋️',
        lab: '🔬', office: '🏢', activity: '🎭'
      }
      return icons[type] || '📍'
    }
  }
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
.picker-panel {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 32rpx 32rpx 0 0;
  width: 100%;
  max-height: 70vh;
  padding: 24rpx 40rpx calc(60rpx + var(--safe-area-inset-bottom));
  animation: slideUp 0.3s ease;
  display: flex;
  flex-direction: column;
}
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.picker-handle {
  width: 80rpx;
  height: 8rpx;
  background: rgba(0, 0, 0, 0.12);
  border-radius: 4rpx;
  margin: 0 auto 24rpx;
}
.picker-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1a1a2e;
  display: block;
  text-align: center;
  margin-bottom: 20rpx;
}
.picker-search {
  margin-bottom: 16rpx;
}
.picker-search-input {
  width: 100%;
  padding: 16rpx 24rpx;
  border-radius: 16rpx;
  background: rgba(245, 246, 250, 0.8);
  font-size: 28rpx;
  border: 1rpx solid rgba(0, 0, 0, 0.06);
}
.picker-list {
  max-height: 50vh;
  flex: 1;
}
.picker-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx 8rpx;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.06);
  transition: background 0.2s ease;
  border-radius: 12rpx;
}
.picker-item:active {
  background: rgba(240, 242, 255, 0.5);
}
.picker-item:last-child { border-bottom: none; }
.picker-item-icon { font-size: 36rpx; }
.picker-item-info { flex: 1; }
.picker-item-name {
  font-size: 28rpx;
  color: #1a1a2e;
  display: block;
}
.picker-item-desc {
  font-size: 22rpx;
  color: #999;
  display: block;
  margin-top: 4rpx;
}
.picker-empty {
  padding: 48rpx 0;
  text-align: center;
}
.picker-empty-text {
  font-size: 26rpx;
  color: #999;
}
</style>
