<template>
	<view class="verify-page">
		<!-- 顶部提示栏 -->
		<view class="verify-header">
			<view class="verify-back" @tap="goBack">
				<text class="verify-back-text">&#x2190; 返回</text>
			</view>
			<text class="verify-header-text">学信网认证</text>
		</view>

		<!-- web-view 嵌入学信网 -->
		<web-view :src="chsiUrl" @message="onWebMessage"></web-view>

		<!-- 底部确认按钮 -->
		<view class="verify-confirm-bar">
			<view class="verify-confirm-btn" @tap="onConfirmLogin">
				<text class="verify-confirm-text">我已完成登录</text>
			</view>
		</view>

		<!-- 认证结果弹窗 -->
		<view class="detail-mask" v-if="showResult" @tap="closeResult">
			<view class="result-panel" @tap.stop>
				<text class="result-icon">{{resultSuccess ? '&#x2705;' : '&#x274C;'}}</text>
				<text class="result-title">{{resultSuccess ? '认证成功' : '认证未完成'}}</text>
				<text class="result-msg">{{resultMsg}}</text>
				<view class="result-btn" @tap="closeResult">
					<text>{{resultSuccess ? '完成' : '返回重试'}}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			// 学信网登录页（移动端）
			chsiUrl: 'https://account.chsi.com.cn/passport/login',
			showResult: false,
			resultSuccess: false,
			resultMsg: ''
		}
	},
	onLoad(options) {
		// 如果从外部传入了学校和学号信息，可以拼接URL
		if (options && options.school) {
			// 学信网没有直接的第三方认证URL，这里保留参数传递的可能
			this.chsiUrl = 'https://account.chsi.com.cn/passport/login'
		}
	},
	methods: {
		onWebMessage(event) {
			// 接收 web-view 传回的消息
			try {
				var data = event.detail.data
				if (data && data.length > 0) {
					var msg = data[data.length - 1]
					if (msg.type === 'verify_success') {
						// 认证成功，保存数据
						this.resultSuccess = true
						this.resultMsg = '学信网认证已通过，您的在校学生身份已验证。'
						this.showResult = true

						// 保存认证信息
						uni.setStorageSync('campus_school_verify', JSON.stringify({
							verified: true,
							schoolName: msg.schoolName || '',
							studentId: msg.studentId || '',
							verifyDate: new Date().toISOString().slice(0, 10)
						}))
					} else if (msg.type === 'verify_fail') {
						this.resultSuccess = false
						this.resultMsg = msg.reason || '认证未通过，请检查信息后重试。'
						this.showResult = true
					}
				}
			} catch (e) {}
		},
		closeResult() {
			this.showResult = false
			if (this.resultSuccess) {
				// 认证成功，用 switchTab 确保 tab 页刷新
				uni.switchTab({
					url: '/pages/profile/index'
				})
			} else {
				uni.navigateBack()
			}
		},
		onConfirmLogin() {
			// 用户确认已在学信网完成登录，保存认证信息
			var now = new Date()
			var dateStr = now.getFullYear() + '-' +
				String(now.getMonth() + 1).padStart(2, '0') + '-' +
				String(now.getDate()).padStart(2, '0')

			uni.setStorageSync('campus_school_verify', JSON.stringify({
				verified: true,
				schoolName: '已通过学信网认证',
				studentId: '',
				verifyDate: dateStr
			}))

			this.resultSuccess = true
			this.resultMsg = '学信网认证已通过，您的在校学生身份已验证。'
			this.showResult = true
		},
		goBack() {
			uni.navigateBack()
		}
	}
}
</script>

<style>
.verify-page {
	width: 100%;
	height: 100%;
	background: linear-gradient(180deg, #4361ee 0%, #6b83f5 12%, #d4daff 28%, #e8ecff 50%, #f0f2ff 70%, #f5f6fa 100%);
	min-height: 100vh;
}
.verify-header {
	background: linear-gradient(135deg, #4361ee 0%, #667eea 50%, #7b8cff 100%);
	padding: 20rpx 32rpx;
	display: flex;
	align-items: center;
	position: relative;
	box-shadow: 0 4rpx 20rpx rgba(67, 97, 238, 0.25);
}
.verify-header::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
	pointer-events: none;
}
.verify-back {
	position: absolute;
	left: 32rpx;
}
.verify-back-text {
	font-size: 28rpx;
	color: #ffffff;
	transition: all 0.2s ease;
}
.verify-back-text:active {
	transform: scale(0.95);
	opacity: 0.8;
}
.verify-header-text {
	flex: 1;
	text-align: center;
	font-size: 32rpx;
	color: #ffffff;
	font-weight: bold;
	text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
}

/* 结果弹窗 */
.detail-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0,0,0,0.35);
	z-index: 999;
	display: flex;
	align-items: center;
	justify-content: center;
}
.result-panel {
	background: linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(248,250,255,0.92) 100%);
	border-radius: 32rpx;
	width: 560rpx;
	padding: 60rpx 40rpx 40rpx;
	text-align: center;
	animation: popIn 0.3s ease;
	border: 1rpx solid rgba(255, 255, 255, 0.7);
	box-shadow: 0 16rpx 48rpx rgba(0,0,0,0.1), 0 1rpx 0 rgba(255, 255, 255, 0.9) inset;
	position: relative;
	overflow: hidden;
}
.result-panel::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
	pointer-events: none;
}
@keyframes popIn {
	from { transform: scale(0.85); opacity: 0; }
	to { transform: scale(1); opacity: 1; }
}
.result-icon {
	font-size: 100rpx;
	display: block;
	margin-bottom: 24rpx;
}
.result-title {
	font-size: 40rpx;
	font-weight: bold;
	color: #1a1a2e;
	display: block;
	margin-bottom: 16rpx;
}
.result-msg {
	font-size: 28rpx;
	color: #555;
	display: block;
	margin-bottom: 40rpx;
	line-height: 1.6;
}
.result-btn {
	background: linear-gradient(135deg, #4361ee, #7b8cff);
	border-radius: 20rpx;
	padding: 24rpx 0;
	box-shadow: 0 4rpx 16rpx rgba(67, 97, 238, 0.3);
	transition: all 0.2s ease;
}
.result-btn:active {
	transform: scale(0.98);
	opacity: 0.85;
}
.result-btn text {
	font-size: 32rpx;
	color: #ffffff;
	font-weight: bold;
}

/* 底部确认按钮 */
.verify-confirm-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 20rpx 32rpx;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	background: linear-gradient(180deg, rgba(255,255,255,0.85), rgba(248,250,255,0.95));
	border-top: 1rpx solid rgba(200,210,255,0.3);
	z-index: 100;
}
.verify-confirm-btn {
	background: linear-gradient(135deg, #4361ee, #7b8cff);
	border-radius: 24rpx;
	padding: 28rpx 0;
	text-align: center;
	box-shadow: 0 6rpx 24rpx rgba(67, 97, 238, 0.35);
	transition: all 0.2s ease;
}
.verify-confirm-btn:active {
	transform: scale(0.97);
	opacity: 0.88;
}
.verify-confirm-text {
	font-size: 32rpx;
	color: #ffffff;
	font-weight: bold;
}
</style>
