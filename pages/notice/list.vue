<template>
	<view class="notice-page">
		<view class="page-header">
			<text class="page-title">校园公告</text>
		</view>

		<view class="notice-list" v-if="noticeList.length > 0">
			<view
				class="notice-card"
				v-for="(notice, index) in noticeList"
				:key="notice.id || index"
				@tap="goDetail(notice)"
			>
				<view class="notice-card-header">
					<text class="notice-tag" :class="notice.tagType">{{notice.tag}}</text>
					<text class="notice-date">{{notice.date}}</text>
				</view>
				<text class="notice-title">{{notice.title}}</text>
				<text class="notice-summary">{{notice.content}}</text>
				<view class="notice-footer" v-if="notice.author">
					<text class="notice-author">{{notice.author}}</text>
				</view>
			</view>
		</view>

		<view class="empty" v-else>
			<text class="empty-text">暂无公告</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			noticeList: []
		}
	},
	onShow() {
		this.loadNotices()
	},
	methods: {
		loadNotices() {
			// TODO: 后端接入后替换为 uni.request
			// uni.request({
			//   url: '/api/notices',
			//   success: (res) => {
			//     this.noticeList = res.data
			//     uni.setStorageSync('campus_notices', JSON.stringify(res.data))
			//   }
			// })
			try {
				var cached = uni.getStorageSync('campus_notices')
				if (cached) {
					this.noticeList = JSON.parse(cached)
					return
				}
			} catch (e) {}
			this.noticeList = [
				{ id: 1, tag: '热门', tagType: 'hot', title: '图书馆本周六举办读书分享会', content: '图书馆将于本周六下午2点在三楼报告厅举办读书分享会，欢迎同学们踊跃参加。本次活动主题为"经典重读"，届时将有学长学姐分享读书心得。', date: '2026-03-28', author: '图书馆' },
				{ id: 2, tag: '新', tagType: 'new', title: '下周一全校停课一天通知', content: '接上级通知，因校园设施维护需要，下周一（3月30日）全校停课一天，请各学院做好教学调整安排。', date: '2026-03-27', author: '教务处' },
				{ id: 3, tag: '通知', tagType: 'info', title: '食堂新增窗口投票开始啦', content: '为了丰富同学们的用餐选择，食堂计划新增两个窗口，现面向全校同学征集意见。投票截止日期为4月5日，快来为你喜欢的美食投票吧！', date: '2026-03-26', author: '后勤处' }
			]
		},
		goDetail(notice) {
			uni.navigateTo({ url: '/pages/notice/detail?id=' + notice.id })
		}
	}
}
</script>

<style>
.notice-page {
	min-height: 100vh;
	background: linear-gradient(180deg, #4361ee 0%, #6b83f5 12%, #d4daff 28%, #e8ecff 50%, #f0f2ff 70%, #f5f6fa 100%);
}
.page-header {
	background: linear-gradient(180deg, #4361ee 0%, #6b83f5 100%);
	padding: 48rpx 32rpx 40rpx;
	position: relative;
	overflow: hidden;
}
.page-header::before {
	content: '';
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 1rpx;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
}
.page-title {
	font-size: 40rpx;
	font-weight: bold;
	color: #fff;
}
.notice-list {
	padding: 24rpx 32rpx;
}
.notice-card {
	background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.88) 100%);
	border-radius: 28rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.7);
	box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.06), 0 1rpx 0 rgba(255, 255, 255, 0.9) inset;
	position: relative;
	overflow: hidden;
	padding: 28rpx;
	margin-bottom: 20rpx;
	transition: all 0.2s ease;
}
.notice-card::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
	pointer-events: none;
}
.notice-card:active {
	transform: scale(0.98);
	opacity: 0.85;
}
.notice-card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16rpx;
}
.notice-tag {
	font-size: 22rpx;
	padding: 4rpx 16rpx;
	border-radius: 8rpx;
}
.notice-tag.hot { background: #ffebee; color: #f44336; }
.notice-tag.new { background: #e3f2fd; color: #4361ee; }
.notice-tag.info { background: #e8f5e9; color: #4caf50; }
.notice-date {
	font-size: 22rpx;
	color: #999;
}
.notice-title {
	font-size: 30rpx;
	font-weight: bold;
	color: #1a1a2e;
	display: block;
	margin-bottom: 12rpx;
}
.notice-summary {
	font-size: 26rpx;
	color: #555;
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}
.notice-footer {
	margin-top: 16rpx;
	padding-top: 16rpx;
	border-top: 1rpx solid rgba(0,0,0,0.06);
}
.notice-author {
	font-size: 22rpx;
	color: #999;
}
.empty {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 160rpx 0;
}
.empty-text {
	font-size: 28rpx;
	color: #8899bb;
	font-weight: 500;
}
</style>
