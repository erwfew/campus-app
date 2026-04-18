<template>
	<view class="mascot-page">
		<!-- 吉祥物展示 -->
		<view class="mascot-display">
			<text class="mascot-avatar" @tap="changeEmoji">{{emoji}}</text>
			<text class="mascot-name">{{name}}</text>
			<text class="mascot-level">Lv.{{level}} 经验值 {{exp}}/{{maxExp}}</text>
			<view class="exp-bar-bg">
				<view class="exp-bar-fill" :style="{ width: (exp / maxExp * 100) + '%' }"></view>
			</view>
		</view>

		<!-- 成长提示 -->
		<view class="card">
			<text class="card-title">成长秘籍</text>
			<view class="tips-list">
				<view class="tip-item">
					<text class="tip-icon">&#x1F4C5;</text>
					<text class="tip-text">每天签到可以获得 10 经验值</text>
				</view>
				<view class="tip-item done">
					<text class="tip-icon">&#x2705;</text>
					<text class="tip-text">完成课程可以获得 50 经验值</text>
				</view>
				<view class="tip-item">
					<text class="tip-icon">&#x1F3C3;</text>
					<text class="tip-text">跑步 3 公里可以获得 30 经验值</text>
				</view>
			</view>
		</view>

		<!-- 进化阶段 -->
		<view class="card">
			<text class="card-title">进化阶段</text>
			<view class="evo-list">
				<view class="evo-item current">
					<text class="evo-avatar">&#x1F431;</text>
					<text class="evo-name">幼年期</text>
					<text class="evo-tag">当前</text>
				</view>
				<view class="evo-item">
					<text class="evo-avatar">&#x1F408;</text>
					<text class="evo-name">成长期</text>
				</view>
				<view class="evo-item locked">
					<text class="evo-avatar">&#x1F408;</text>
					<text class="evo-name">成熟期</text>
				</view>
				<view class="evo-item locked">
					<text class="evo-avatar">&#x1F432;</text>
					<text class="evo-name">完全体</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			emoji: '\u{1F431}',
			name: '小喵',
			level: 5,
			exp: 680,
			maxExp: 1000
		}
	},
	onShow() {
		this.loadMascot()
	},
	methods: {
		loadMascot() {
			try {
				var data = uni.getStorageSync('campus_mascot')
				if (data) {
					var m = JSON.parse(data)
					if (m.emoji) this.emoji = m.emoji
					if (m.name) this.name = m.name
					if (m.level) this.level = m.level
					if (m.exp) this.exp = m.exp
					if (m.maxExp) this.maxExp = m.maxExp
				}
			} catch (e) {}
		},
		saveMascot() {
			uni.setStorageSync('campus_mascot', JSON.stringify({
				emoji: this.emoji,
				name: this.name,
				level: this.level,
				exp: this.exp,
				maxExp: this.maxExp
			}))
		},
		changeEmoji() {
			var emojis = ['\u{1F431}', '\u{1F434}', '\u{1F436}', '\u{1F437}', '\u{1F439}']
			var idx = emojis.indexOf(this.emoji)
			this.emoji = emojis[(idx + 1) % emojis.length]
			this.saveMascot()
		}
	}
}
</script>

<style>
.mascot-page {
	padding-bottom: 20rpx;
	background: linear-gradient(180deg, #4361ee 0%, #6b83f5 12%, #d4daff 28%, #e8ecff 50%, #f0f2ff 70%, #f5f6fa 100%);
	min-height: 100vh;
}

/* 吉祥物展示 */
.mascot-display {
	text-align: center;
	padding: 60rpx 32rpx;
	background: linear-gradient(135deg, #a18cd1 0%, #c48fd4 30%, #e8a0c8 60%, #fbc2eb 100%);
	margin-bottom: 24rpx;
	position: relative;
	overflow: hidden;
	box-shadow: 0 8rpx 32rpx rgba(161, 140, 209, 0.25), inset 0 0 60rpx rgba(255, 255, 255, 0.15);
}
.mascot-display::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
	pointer-events: none;
}
.mascot-avatar {
	font-size: 160rpx;
	display: block;
	animation: float 3s ease-in-out infinite;
}
@keyframes float {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-30rpx); }
}
.mascot-name {
	font-size: 40rpx;
	font-weight: bold;
	color: #ffffff;
	display: block;
	margin-top: 16rpx;
	text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
}
.mascot-level {
	font-size: 26rpx;
	color: rgba(255,255,255,0.85);
	display: block;
	margin-top: 8rpx;
	margin-bottom: 24rpx;
}
.exp-bar-bg {
	max-width: 400rpx;
	margin: 0 auto;
	height: 16rpx;
	background: rgba(255,255,255,0.3);
	border-radius: 8rpx;
	overflow: hidden;
	box-shadow: inset 0 1rpx 4rpx rgba(0,0,0,0.1);
}
.exp-bar-fill {
	height: 100%;
	background: linear-gradient(90deg, #ffffff, #f0e6ff);
	border-radius: 8rpx;
	transition: width 0.5s;
	box-shadow: 0 0 8rpx rgba(255,255,255,0.5);
}

/* 卡片 */
.card {
	margin: 0 32rpx 32rpx;
	background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.88) 100%);
	border-radius: 28rpx;
	padding: 32rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.7);
	box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.06), 0 1rpx 0 rgba(255, 255, 255, 0.9) inset;
	position: relative;
	overflow: hidden;
}
.card::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
	pointer-events: none;
}
.card-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #1a1a2e;
	display: block;
	margin-bottom: 24rpx;
}

/* 成长提示 */
.tips-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}
.tip-item {
	display: flex;
	align-items: center;
	gap: 20rpx;
	padding: 24rpx;
	border-radius: 20rpx;
	background: linear-gradient(180deg, rgba(243,229,245,0.8) 0%, rgba(238,223,242,0.7) 100%);
	border: 1rpx solid rgba(255,255,255,0.5);
	box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.03);
	transition: all 0.2s ease;
}
.tip-item.done {
	background: linear-gradient(180deg, rgba(232,245,233,0.8) 0%, rgba(220,237,222,0.7) 100%);
}
.tip-item:active {
	transform: scale(0.98);
	opacity: 0.85;
}
.tip-icon {
	font-size: 36rpx;
}
.tip-text {
	font-size: 26rpx;
	color: #555;
}

/* 进化 */
.evo-list {
	display: flex;
	justify-content: space-between;
}
.evo-item {
	text-align: center;
	flex: 1;
	padding: 20rpx 8rpx;
	border-radius: 20rpx;
	position: relative;
	transition: all 0.2s ease;
}
.evo-item:active {
	transform: scale(0.98);
	opacity: 0.85;
}
.evo-item.current {
	background: linear-gradient(180deg, rgba(238,240,255,0.9) 0%, rgba(228,232,255,0.8) 100%);
	border: 4rpx solid #4361ee;
	box-shadow: 0 4rpx 16rpx rgba(67, 97, 238, 0.15);
}
.evo-item.locked {
	opacity: 0.4;
}
.evo-avatar {
	font-size: 80rpx;
	display: block;
}
.evo-name {
	font-size: 24rpx;
	color: #4361ee;
	display: block;
	margin-top: 8rpx;
}
.evo-tag {
	font-size: 20rpx;
	color: #4361ee;
	font-weight: bold;
	display: block;
	margin-top: 4rpx;
}
.evo-item.locked .evo-name {
	color: #999;
}

</style>
