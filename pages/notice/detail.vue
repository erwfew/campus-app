<template>
	<view class="detail-page">
		<view class="detail-header">
			<view class="header-decoration"></view>
			<view class="header-decoration-2"></view>
			<view class="header-content">
				<text class="detail-tag" :class="notice.tagType">{{notice.tag}}</text>
				<text class="detail-title">{{notice.title}}</text>
				<view class="detail-meta">
					<view class="meta-item" v-if="notice.author">
						<text class="meta-icon">👤</text>
						<text class="meta-text">{{notice.author}}</text>
					</view>
					<view class="meta-item">
						<text class="meta-icon">📅</text>
						<text class="meta-text">{{notice.date}}</text>
					</view>
				</view>
			</view>
		</view>
		<view class="detail-body">
			<view class="detail-card">
				<view class="card-accent"></view>
				<view class="detail-content">
					<text class="content-text" v-for="(line, index) in contentLines" :key="index"
						:class="{ 'content-heading': isHeading(line), 'content-list-item': isListItem(line) }">{{line}}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			notice: {
				id: 0,
				tag: '',
				tagType: '',
				title: '',
				content: '',
				date: '',
				author: ''
			}
		}
	},
	computed: {
		contentLines() {
			return this.notice.content.split('\n').filter(function(line) { return line.trim() !== '' })
		}
	},
	methods: {
		isHeading(line) {
			return line.indexOf('活动流程') !== -1 || line.indexOf('注意事项') !== -1 || line.indexOf('候选窗口') !== -1 || line.indexOf('投票方式') !== -1
		},
		isListItem(line) {
			return /^\d+\./.test(line.trim()) || /^[-•]/.test(line.trim())
		},
		loadNotice(id) {
			try {
				var cached = uni.getStorageSync('campus_notices')
				if (cached) {
					var list = JSON.parse(cached)
					var found = list.find(function(n) { return n.id == id })
					if (found) {
						this.notice = found
						return
					}
				}
			} catch (e) {}
			var defaults = [
				{ id: 1, tag: '热门', tagType: 'hot', title: '图书馆本周六举办读书分享会', content: '图书馆将于本周六下午2点在三楼报告厅举办读书分享会，欢迎同学们踊跃参加。本次活动主题为"经典重读"，届时将有学长学姐分享读书心得。\n\n活动流程：\n1. 签到入场（13:30-14:00）\n2. 主持人开场\n3. 嘉宾分享（每人15分钟）\n4. 自由交流环节\n5. 合影留念\n\n参加活动的同学可获得图书馆精美书签一枚。', date: '2026-03-28', author: '图书馆' },
				{ id: 2, tag: '新', tagType: 'new', title: '下周一全校停课一天通知', content: '接上级通知，因校园设施维护需要，下周一（3月30日）全校停课一天，请各学院做好教学调整安排。\n\n注意事项：\n1. 请各任课老师提前安排好补课计划\n2. 在校学生注意安全，远离施工区域\n3. 食堂正常开放\n4. 图书馆正常开放', date: '2026-03-27', author: '教务处' },
				{ id: 3, tag: '通知', tagType: 'info', title: '食堂新增窗口投票开始啦', content: '为了丰富同学们的用餐选择，食堂计划新增两个窗口，现面向全校同学征集意见。投票截止日期为4月5日，快来为你喜欢的美食投票吧！\n\n候选窗口：\n- 川湘菜\n- 日式料理\n- 西式简餐\n- 清真美食\n- 粤式茶点\n- 台湾小吃\n\n投票方式：关注"校园后勤"公众号，点击菜单栏"食堂投票"即可参与。', date: '2026-03-26', author: '后勤处' }
			]
			var found = defaults.find(function(n) { return n.id == id })
			if (found) this.notice = found
		}
	},
	onLoad(options) {
		if (options.id) {
			this.loadNotice(options.id)
		}
	}
}
</script>

<style>
.detail-page {
	min-height: 100vh;
	background: #f0f2ff;
}
.detail-header {
	padding: 48rpx 32rpx 56rpx;
	background: linear-gradient(135deg, #4361ee 0%, #6366f1 50%, #818cf8 100%);
	position: relative;
	overflow: hidden;
	border-radius: 0 0 48rpx 48rpx;
}
.header-decoration {
	position: absolute;
	top: -60rpx;
	right: -40rpx;
	width: 240rpx;
	height: 240rpx;
	border-radius: 50%;
	background: rgba(255,255,255,0.08);
}
.header-decoration-2 {
	position: absolute;
	bottom: -80rpx;
	left: -60rpx;
	width: 200rpx;
	height: 200rpx;
	border-radius: 50%;
	background: rgba(255,255,255,0.05);
}
.header-content {
	position: relative;
	z-index: 1;
}
.detail-tag {
	font-size: 22rpx;
	padding: 6rpx 20rpx;
	border-radius: 20rpx;
	display: inline-block;
	margin-bottom: 24rpx;
	font-weight: 500;
	letter-spacing: 2rpx;
}
.detail-tag.hot { background: rgba(255,107,107,0.35); color: #ffc8c8; border: 1rpx solid rgba(255,107,107,0.3); }
.detail-tag.new { background: rgba(78,205,196,0.35); color: #c8fff8; border: 1rpx solid rgba(78,205,196,0.3); }
.detail-tag.info { background: rgba(255,209,102,0.35); color: #fff3c8; border: 1rpx solid rgba(255,209,102,0.3); }
.detail-title {
	font-size: 38rpx;
	font-weight: bold;
	color: #fff;
	display: block;
	margin-bottom: 24rpx;
	line-height: 1.45;
	text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
}
.detail-meta {
	display: flex;
	gap: 32rpx;
}
.meta-item {
	display: flex;
	align-items: center;
	gap: 8rpx;
}
.meta-icon {
	font-size: 22rpx;
}
.meta-text {
	font-size: 24rpx;
	color: rgba(255,255,255,0.85);
}
.detail-body {
	padding: 32rpx 28rpx 48rpx;
}
.detail-card {
	background: #fff;
	border-radius: 32rpx;
	position: relative;
	overflow: hidden;
	box-shadow: 0 4rpx 24rpx rgba(67,97,238,0.08), 0 1rpx 4rpx rgba(0,0,0,0.04);
}
.card-accent {
	height: 6rpx;
	background: linear-gradient(90deg, #4361ee, #818cf8, #a78bfa);
}
.detail-content {
	padding: 40rpx 36rpx 48rpx;
}
.content-text {
	display: block;
	font-size: 30rpx;
	color: #2d2d3f;
	line-height: 1.85;
	letter-spacing: 0.5rpx;
}
.content-heading {
	font-size: 32rpx;
	font-weight: 600;
	color: #1a1a2e;
	margin-top: 16rpx;
	margin-bottom: 4rpx;
}
.content-list-item {
	padding-left: 8rpx;
	color: #3d3d5c;
}
</style>
