<template>
	<view class="profile-page">
		<!-- 用户信息卡片 -->
		<view class="user-card" @tap="editProfile">
			<view class="avatar-circle">
				<text class="avatar-letter">{{avatarEmoji}}</text>
			</view>
			<view class="user-info">
				<view class="user-name-row">
					<text class="user-name">{{userName}}</text>
					<text class="verified-badge" v-if="verified">&#x2705; 已认证</text>
				</view>
				<text class="user-dept">{{userDept}}</text>
				<text class="user-school" v-if="schoolName">{{schoolName}}</text>
			</view>
			<text class="edit-btn">编辑</text>
		</view>

		<!-- 签到卡片 -->
		<view class="sign-card" @tap="doSignIn">
			<view class="sign-left">
				<text class="sign-icon">{{signed ? '&#x2705;' : '&#x1F4C5;'}}</text>
				<view>
					<text class="sign-title">{{signed ? '今日已签到' : '每日签到'}}</text>
					<text class="sign-desc">{{signed ? '明天再来签到吧' : '签到获得 10 经验值'}}</text>
				</view>
			</view>
			<view class="sign-btn" :class="{ done: signed }">
				<text class="sign-btn-text">{{signed ? '已签到' : '签到'}}</text>
			</view>
		</view>

		<!-- 数据汇总 -->
		<view class="data-row">
			<view class="data-item">
				<text class="data-val green">{{totalKm}}</text>
				<text class="data-lbl">总公里</text>
			</view>
			<view class="data-item">
				<text class="data-val blue">{{totalRuns}}</text>
				<text class="data-lbl">跑步次数</text>
			</view>
			<view class="data-item">
				<text class="data-val orange">{{totalCalories}}</text>
				<text class="data-lbl">总卡路里</text>
			</view>
		</view>

		<!-- 吉祥物快捷入口 -->
		<view class="mascot-card" @tap="goPage('/pages/mascot/index')">
			<text class="mascot-card-emoji">{{mascotEmoji}}</text>
			<view class="mascot-card-info">
				<text class="mascot-card-name">{{mascotName}}</text>
				<text class="mascot-card-level">Lv.{{mascotLevel}} · 经验 {{mascotExp}}/{{mascotMaxExp}}</text>
				<view class="mascot-exp-bg">
					<view class="mascot-exp-fill" :style="{ width: expPercent + '%' }"></view>
				</view>
			</view>
			<text class="menu-arrow">&#x203A;</text>
		</view>

		<!-- 功能菜单 -->
		<view class="menu-group">
			<view class="menu-item" @tap="goPage('/pages/study/index')">
				<text class="menu-icon" style="background: #e3f2fd;">&#x1F4DA;</text>
				<text class="menu-text">教务学习中心</text>
				<text class="menu-arrow">&#x203A;</text>
			</view>
			<view class="menu-item" @tap="goPage('/pages/sport/index')">
				<text class="menu-icon" style="background: #fce4ec;">&#x1F3C3;</text>
				<text class="menu-text">校园运动</text>
				<text class="menu-arrow">&#x203A;</text>
			</view>
			<view class="menu-item" @tap="goPage('/pages/creative/index')">
				<text class="menu-icon" style="background: #fff3e0;">&#x1F3A8;</text>
				<text class="menu-text">校园文创</text>
				<text class="menu-arrow">&#x203A;</text>
			</view>
			<view class="menu-item" @tap="goPage('/pages/navigation/index')">
				<text class="menu-icon" style="background: #e8f5e9;">&#x1F4CD;</text>
				<text class="menu-text">校园导航</text>
				<text class="menu-arrow">&#x203A;</text>
			</view>
		</view>

		<view class="menu-group">
			<view class="menu-item" @tap="showSchoolVerify">
				<text class="menu-icon" style="background: #e8f5e9;">&#x1F3DB;</text>
				<text class="menu-text">学校认证</text>
				<text class="verify-status" v-if="verified">已认证</text>
				<text class="verify-status unverified" v-else>未认证</text>
				<text class="menu-arrow">&#x203A;</text>
			</view>
			<view class="menu-item" @tap="showSettings">
				<text class="menu-icon" style="background: #f5f5f5;">&#x2699;</text>
				<text class="menu-text">设置</text>
				<text class="menu-arrow">&#x203A;</text>
			</view>
			<view class="menu-item" @tap="showAbout">
				<text class="menu-icon" style="background: #f5f5f5;">&#x2139;</text>
				<text class="menu-text">关于我们</text>
				<text class="menu-arrow">&#x203A;</text>
			</view>
		</view>

		<!-- 编辑资料弹窗 -->
		<view class="detail-mask" v-if="showEdit" @tap="showEdit = false">
			<view class="edit-panel" @tap.stop>
				<view class="edit-handle"></view>
				<text class="edit-title">编辑资料</text>
				<view class="edit-field">
					<text class="edit-label">昵称</text>
					<input class="edit-input" v-model="editName" placeholder="输入昵称" />
				</view>
				<view class="edit-field">
					<text class="edit-label">院系</text>
					<input class="edit-input" v-model="editDept" placeholder="输入院系信息" />
				</view>
				<view class="edit-actions">
					<view class="edit-cancel" @tap="showEdit = false">
						<text>取消</text>
					</view>
					<view class="edit-save" @tap="saveProfile">
						<text>保存</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 设置弹窗 -->
		<view class="detail-mask" v-if="showSettingPanel" @tap="showSettingPanel = false">
			<view class="edit-panel" @tap.stop>
				<view class="edit-handle"></view>
				<text class="edit-title">设置</text>
				<view class="setting-item" @tap="clearRunData">
					<text class="setting-text">清除跑步数据</text>
					<text class="setting-arrow">&#x203A;</text>
				</view>
				<view class="setting-item" @tap="clearMascotData">
					<text class="setting-text">重置吉祥物</text>
					<text class="setting-arrow">&#x203A;</text>
				</view>
				<view class="setting-item">
					<text class="setting-text">版本号</text>
					<text class="setting-val">v1.0.0</text>
				</view>
			</view>
		</view>

		<!-- 关于弹窗 -->
		<view class="detail-mask" v-if="showAboutPanel" @tap="showAboutPanel = false">
			<view class="edit-panel" @tap.stop>
				<view class="edit-handle"></view>
				<text class="edit-title">关于效园通</text>
				<text class="about-text">效园通 APP 为大学生提供一站式校园生活服务，包括智能导航、课程管理、校园跑步、虚拟吉祥物养成等功能。</text>
				<text class="about-text">版本：v1.0.0</text>
				<text class="about-text">开发者：校园开发团队</text>
				<view class="edit-actions" style="margin-top: 40rpx;">
					<view class="edit-save" @tap="showAboutPanel = false" style="flex: 1;">
						<text>知道了</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 学校认证弹窗 -->
		<view class="detail-mask" v-if="showVerifyPanel" @tap="showVerifyPanel = false">
			<view class="edit-panel verify-panel" @tap.stop>
				<view class="edit-handle"></view>
				<text class="edit-title">学信网学校认证</text>

				<!-- 已认证状态 -->
				<template v-if="verified">
					<view class="verify-success">
						<text class="verify-success-icon">&#x2705;</text>
						<text class="verify-success-title">认证成功</text>
						<text class="verify-success-info">学校：{{schoolName}}</text>
						<text class="verify-success-info">学号：{{studentId}}</text>
						<text class="verify-success-info">认证时间：{{verifyDate}}</text>
					</view>
					<view class="edit-actions">
						<view class="edit-cancel" @tap="showVerifyPanel = false">
							<text>关闭</text>
						</view>
						<view class="edit-cancel" @tap="cancelVerify">
							<text>解除认证</text>
						</view>
					</view>
				
</template>

				<!-- 未认证状态 -->
				<template v-else>
					<view class="verify-intro">
						<text class="verify-intro-text">通过学信网（CHSI）认证您的在校学生身份，认证后可解锁更多校园服务功能。</text>
					</view>
					<view class="edit-field">
						<text class="edit-label">姓名</text>
						<input class="edit-input" v-model="verifyName" placeholder="输入真实姓名" />
					</view>
					<view class="edit-field">
						<text class="edit-label">学校名称</text>
						<input class="edit-input" v-model="verifySchool" placeholder="输入就读学校全称" />
					</view>
					<view class="edit-field">
						<text class="edit-label">学号</text>
						<input class="edit-input" v-model="verifyStudentId" placeholder="输入学号" />
					</view>
					<view class="verify-steps" v-if="verifying">
						<view class="verify-step" :class="{ active: verifyStep >= 1, done: verifyStep > 1 }">
							<text class="step-dot"></text>
							<text class="step-text">验证个人信息...</text>
						</view>
						<view class="verify-step" :class="{ active: verifyStep >= 2, done: verifyStep > 2 }">
							<text class="step-dot"></text>
							<text class="step-text">连接学信网数据库...</text>
						</view>
						<view class="verify-step" :class="{ active: verifyStep >= 3, done: verifyStep > 3 }">
							<text class="step-dot"></text>
							<text class="step-text">核实在校学籍信息...</text>
						</view>
						<view class="verify-step" :class="{ active: verifyStep >= 4 }">
							<text class="step-dot"></text>
							<text class="step-text">生成认证报告...</text>
						</view>
					</view>
					<view class="edit-actions">
						<view class="edit-cancel" @tap="showVerifyPanel = false">
							<text>取消</text>
						</view>
						<view class="edit-save" @tap="startVerify">
							<text>{{verifying ? '认证中...' : '开始认证'}}</text>
						</view>
					</view>
				</template>
			</view>
		</view>

		<bottom-nav activeTab="/pages/profile/index" />
	</view>
</template>

<script>
import BottomNav from '../../components/bottom-nav/bottom-nav.vue'
export default {
components: { BottomNav },
	data() {
		return {
			userName: '张同学',
			userDept: '计算机科学与技术 2024级',
			avatarEmoji: 'U',
			totalKm: '0.0',
			totalRuns: '0',
			totalCalories: '0',
			mascotEmoji: '\u{1F431}',
			mascotName: '小喵',
			mascotLevel: 5,
			mascotExp: 680,
			mascotMaxExp: 1000,
			signed: false,
			signDate: '',
			showEdit: false,
			editName: '',
			editDept: '',
			showSettingPanel: false,
			showAboutPanel: false,
			// 学校认证
			showVerifyPanel: false,
			verified: false,
			schoolName: '',
			studentId: '',
			verifyDate: '',
			verifyName: '',
			verifySchool: '',
			verifyStudentId: '',
			verifying: false,
			verifyStep: 0
		}
	},
	computed: {
		expPercent() {
			return Math.round((this.mascotExp / this.mascotMaxExp) * 100)
		}
	},
	onShow() {
		this.loadProfile()
		this.loadRunStats()
		this.loadMascotData()
		this.checkSignIn()
		this.loadVerifyData()
		this.fetchVerifyFromApi()
	},
	methods: {
loadProfile() {
			try {
				var data = uni.getStorageSync('campus_profile')
				if (data) {
					var p = JSON.parse(data)
					if (p.name) this.userName = p.name
					if (p.dept) this.userDept = p.dept
					this.avatarEmoji = this.userName.charAt(0)
				}
			} catch (e) {}
		},
		loadRunStats() {
			try {
				var data = uni.getStorageSync('campus_run_history')
				if (data) {
					var history = JSON.parse(data)
					var totalKm = 0
					var totalCal = 0
					history.forEach(function(item) {
						totalKm += parseFloat(item.distance) || 0
						totalCal += parseInt(item.calories) || 0
					})
					this.totalKm = totalKm.toFixed(1)
					this.totalRuns = history.length.toString()
					this.totalCalories = totalCal.toString()
				}
			} catch (e) {}
		},
		loadMascotData() {
			try {
				var data = uni.getStorageSync('campus_mascot')
				if (data) {
					var m = JSON.parse(data)
					if (m.emoji) this.mascotEmoji = m.emoji
					if (m.name) this.mascotName = m.name
					if (m.level) this.mascotLevel = m.level
					if (m.exp) this.mascotExp = m.exp
					if (m.maxExp) this.mascotMaxExp = m.maxExp
				}
			} catch (e) {}
		},
		checkSignIn() {
			var today = new Date()
			var dateStr = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate()
			try {
				var data = uni.getStorageSync('campus_signin')
				if (data === dateStr) {
					this.signed = true
					this.signDate = dateStr
				}
			} catch (e) {}
		},
		doSignIn() {
			if (this.signed) return
			var today = new Date()
			var dateStr = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate()
			uni.setStorageSync('campus_signin', dateStr)
			this.signed = true
			this.signDate = dateStr

			// 给吉祥物加经验
			try {
				var data = uni.getStorageSync('campus_mascot')
				var m = data ? JSON.parse(data) : { emoji: '\u{1F431}', name: '小喵', level: 5, exp: 680, maxExp: 1000 }
				m.exp = (m.exp || 0) + 10
				if (m.exp >= m.maxExp) {
					m.level = (m.level || 1) + 1
					m.exp = m.exp - m.maxExp
					m.maxExp = Math.round(m.maxExp * 1.5)
				}
				uni.setStorageSync('campus_mascot', JSON.stringify(m))
				this.mascotExp = m.exp
				this.mascotLevel = m.level
				this.mascotMaxExp = m.maxExp
			} catch (e) {}

			uni.showToast({ title: '签到成功 +10经验', icon: 'none' })
		},
		editProfile() {
			this.editName = this.userName
			this.editDept = this.userDept
			this.showEdit = true
		},
		saveProfile() {
			if (!this.editName.trim()) {
				uni.showToast({ title: '昵称不能为空', icon: 'none' })
				return
			}
			this.userName = this.editName.trim()
			this.userDept = this.editDept.trim()
			this.avatarEmoji = this.userName.charAt(0)
			uni.setStorageSync('campus_profile', JSON.stringify({
				name: this.userName,
				dept: this.userDept
			}))
			this.showEdit = false
			uni.showToast({ title: '保存成功', icon: 'none' })
		},
		showSettings() {
			this.showSettingPanel = true
		},
		showAbout() {
			this.showAboutPanel = true
		},
		clearRunData() {
			var _this = this
			uni.showModal({
				title: '确认清除',
				content: '确定要清除所有跑步数据吗？此操作不可恢复。',
				success: function(res) {
					if (res.confirm) {
						uni.removeStorageSync('campus_run_history')
						_this.totalKm = '0.0'
						_this.totalRuns = '0'
						_this.totalCalories = '0'
						_this.showSettingPanel = false
						uni.showToast({ title: '已清除', icon: 'none' })
					}
				}
			})
		},
		clearMascotData() {
			var _this = this
			uni.showModal({
				title: '确认重置',
				content: '确定要重置吉祥物吗？等级和经验将回到初始状态。',
				success: function(res) {
					if (res.confirm) {
						var m = { emoji: '\u{1F431}', name: '小喵', level: 1, exp: 0, maxExp: 100 }
						uni.setStorageSync('campus_mascot', JSON.stringify(m))
						_this.mascotEmoji = m.emoji
						_this.mascotName = m.name
						_this.mascotLevel = m.level
						_this.mascotExp = m.exp
						_this.mascotMaxExp = m.maxExp
						_this.showSettingPanel = false
						uni.showToast({ title: '已重置', icon: 'none' })
					}
				}
			})
		},
		// ==================== 学校认证 ====================
		loadVerifyData() {
			try {
				var data = uni.getStorageSync('campus_school_verify')
				if (data) {
					var v = JSON.parse(data)
					if (v.verified) {
						this.verified = true
						this.schoolName = v.schoolName || ''
						this.studentId = v.studentId || ''
						this.verifyDate = v.verifyDate || ''
					}
				}
			} catch (e) {}
		},
		fetchVerifyFromApi() {
			var _this = this
			var token = uni.getStorageSync('campus_token')
			if (!token) return
			uni.request({
				url: 'http://192.168.31.98:3000/api/auth/verify',
				method: 'GET',
				header: { 'Authorization': 'Bearer ' + token },
				success: function(res) {
					if (res.data && res.data.success && res.data.data) {
						var d = res.data.data
						if (d.verified) {
							_this.verified = true
							_this.schoolName = d.schoolName || ''
							_this.verifyDate = d.verifyDate || ''
							uni.setStorageSync('campus_school_verify', JSON.stringify({
								verified: true, schoolName: d.schoolName, verifyDate: d.verifyDate
							}))
						}
					}
				},
				fail: function() {}
			})
		},
		showSchoolVerify() {
			if (this.verified) {
				// 已认证，显示认证信息弹窗
				this.showVerifyPanel = true
			} else {
				// 未认证，跳转学信网 web-view
				uni.navigateTo({
					url: '/pages/verify/index?name=' + encodeURIComponent(this.userName)
				})
			}
		},
		startVerify() {
			if (this.verifying) return
			if (!this.verifyName.trim()) {
				uni.showToast({ title: '请输入姓名', icon: 'none' })
				return
			}
			if (!this.verifySchool.trim()) {
				uni.showToast({ title: '请输入学校名称', icon: 'none' })
				return
			}
			if (!this.verifyStudentId.trim()) {
				uni.showToast({ title: '请输入学号', icon: 'none' })
				return
			}

			this.verifying = true
			this.verifyStep = 1

			var _this = this
			var schoolName = this.verifySchool.trim()
			var studentId = this.verifyStudentId.trim()

			// 模拟学信网认证流程
			setTimeout(function() {
				_this.verifyStep = 2
				setTimeout(function() {
					_this.verifyStep = 3
					setTimeout(function() {
						_this.verifyStep = 4
						setTimeout(function() {
							// 认证成功
							var now = new Date()
							var dateStr = now.getFullYear() + '-' +
								String(now.getMonth() + 1).padStart(2, '0') + '-' +
								String(now.getDate()).padStart(2, '0')

							_this.verified = true
							_this.schoolName = schoolName
							_this.studentId = studentId
							_this.verifyDate = dateStr

							// 保存到本地存储
							try {
								uni.setStorageSync('campus_school_verify', JSON.stringify({
									verified: true, schoolName: schoolName,
									studentId: studentId, verifyDate: dateStr
								}))
							} catch (e) {
								console.error('localStorage save failed:', e)
							}

							// 保存到服务器
							var token = uni.getStorageSync('campus_token')
							if (token) {
								uni.request({
									url: 'http://192.168.31.98:3000/api/auth/verify',
									method: 'POST',
									header: { 'Authorization': 'Bearer ' + token },
									data: { schoolName: schoolName, studentId: studentId },
									success: function() { console.log('Verify saved to server') },
									fail: function() { console.log('Verify server save failed, local saved') }
								})
							}

							_this.verifying = false
							uni.showToast({ title: '认证成功！', icon: 'success' })
						}, 1500)
					}, 1200)
				}, 1000)
			}, 800)
		},
		cancelVerify() {
			var _this = this
			uni.showModal({
				title: '解除认证',
				content: '确定要解除学校认证吗？解除后需要重新认证才能使用相关功能。',
				success: function(res) {
					if (res.confirm) {
						uni.removeStorageSync('campus_school_verify')
						_this.verified = false
						_this.schoolName = ''
						_this.studentId = ''
						_this.verifyDate = ''
						_this.showVerifyPanel = false
						// 同步到服务器
						var token = uni.getStorageSync('campus_token')
						if (token) {
							uni.request({
								url: 'http://192.168.31.98:3000/api/auth/verify',
								method: 'DELETE',
								header: { 'Authorization': 'Bearer ' + token },
								success: function() {},
								fail: function() {}
							})
						}
						uni.showToast({ title: '已解除认证', icon: 'none' })
					}
				}
			})
		},
		goPage(url) {
			if (url.indexOf('/pages/navigation/') === 0 || url.indexOf('/pages/study/') === 0 || url.indexOf('/pages/sport/') === 0) {
				uni.switchTab({ url: url })
			} else {
				uni.navigateTo({ url: url })
			}
		}
	}
}
</script>

<style>
/* ==================== Page Background ==================== */
.profile-page {
	padding: 20rpx 32rpx calc(40rpx + var(--safe-area-inset-bottom));
	background: linear-gradient(180deg, #4361ee 0%, #6b83f5 12%, #d4daff 28%, #e8ecff 50%, #f0f2ff 70%, #f5f6fa 100%);
	min-height: 100vh;
}

/* ==================== Shared Glass Card ==================== */
.glass-card {
	background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.88) 100%);
	border-radius: 28rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.7);
	box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.06), 0 1rpx 0 rgba(255, 255, 255, 0.9) inset;
	position: relative;
	overflow: hidden;
}
.glass-card::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
	pointer-events: none;
}

/* ==================== User Card ==================== */
.user-card {
	display: flex;
	align-items: center;
	gap: 24rpx;
	padding: 40rpx;
	background: linear-gradient(135deg, #4361ee, #7b8cff);
	border-radius: 28rpx;
	margin-bottom: 24rpx;
	position: relative;
	overflow: hidden;
	border: 1rpx solid rgba(255,255,255,0.3);
	box-shadow: 0 8rpx 32rpx rgba(67,97,238,0.3), 0 1rpx 0 rgba(255,255,255,0.4) inset;
	transition: all 0.2s ease;
}
.user-card::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
	pointer-events: none;
}
.user-card:active {
	transform: scale(0.98);
	opacity: 0.85;
}
.avatar-circle {
	width: 120rpx;
	height: 120rpx;
	border-radius: 60rpx;
	background: rgba(255,255,255,0.95);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.08);
}
.avatar-letter {
	font-size: 48rpx;
	color: #4361ee;
	font-weight: bold;
}
.user-info {
	flex: 1;
}
.user-name {
	font-size: 36rpx;
	font-weight: bold;
	color: #ffffff;
	display: block;
	margin-bottom: 8rpx;
}
.user-name-row {
	display: flex;
	align-items: center;
	gap: 12rpx;
}
.verified-badge {
	font-size: 20rpx;
	color: #ffffff;
	background: rgba(255,255,255,0.25);
	padding: 4rpx 16rpx;
	border-radius: 20rpx;
	flex-shrink: 0;
	backdrop-filter: none;
}
.user-dept {
	font-size: 24rpx;
	color: rgba(255,255,255,0.8);
}
.user-school {
	font-size: 22rpx;
	color: rgba(255,255,255,0.7);
	display: block;
	margin-top: 4rpx;
}
.edit-btn {
	font-size: 26rpx;
	color: #ffffff;
	padding: 8rpx 28rpx;
	border: 2rpx solid rgba(255,255,255,0.6);
	border-radius: 32rpx;
	transition: all 0.2s ease;
}
.edit-btn:active {
	transform: scale(0.98);
	opacity: 0.85;
}

/* ==================== Sign-in Card ==================== */
.sign-card {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.88) 100%);
	border-radius: 28rpx;
	padding: 28rpx 32rpx;
	margin-bottom: 24rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.7);
	box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.06), 0 1rpx 0 rgba(255, 255, 255, 0.9) inset;
	position: relative;
	overflow: hidden;
	transition: all 0.2s ease;
}
.sign-card::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
	pointer-events: none;
}
.sign-card:active {
	transform: scale(0.98);
	opacity: 0.85;
}
.sign-left {
	display: flex;
	align-items: center;
	gap: 20rpx;
}
.sign-icon {
	font-size: 44rpx;
}
.sign-title {
	font-size: 30rpx;
	font-weight: bold;
	color: #1a1a2e;
	display: block;
}
.sign-desc {
	font-size: 22rpx;
	color: #555;
	display: block;
	margin-top: 4rpx;
}
.sign-btn {
	padding: 12rpx 36rpx;
	border-radius: 40rpx;
	background: linear-gradient(135deg, #4caf50, #66bb6a);
	transition: all 0.2s ease;
}
.sign-btn:active {
	transform: scale(0.98);
	opacity: 0.85;
}
.sign-btn.done {
	background: linear-gradient(135deg, #e0e0e0, #eeeeee);
}
.sign-btn-text {
	font-size: 26rpx;
	color: #ffffff;
	font-weight: bold;
}

/* ==================== Data Summary ==================== */
.data-row {
	display: flex;
	justify-content: space-around;
	background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.88) 100%);
	border-radius: 28rpx;
	padding: 36rpx;
	margin-bottom: 24rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.7);
	box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.06), 0 1rpx 0 rgba(255, 255, 255, 0.9) inset;
	position: relative;
	overflow: hidden;
}
.data-row::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
	pointer-events: none;
}
.data-item {
	text-align: center;
}
.data-val {
	font-size: 44rpx;
	font-weight: bold;
	display: block;
}
.data-val.green { color: #4caf50; }
.data-val.blue { color: #4361ee; }
.data-val.orange { color: #ff9800; }
.data-lbl {
	font-size: 22rpx;
	color: #555;
	display: block;
	margin-top: 8rpx;
}

/* ==================== Mascot Card ==================== */
.mascot-card {
	display: flex;
	align-items: center;
	gap: 20rpx;
	background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.88) 100%);
	border-radius: 28rpx;
	padding: 28rpx 32rpx;
	margin-bottom: 24rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.7);
	box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.06), 0 1rpx 0 rgba(255, 255, 255, 0.9) inset;
	position: relative;
	overflow: hidden;
	transition: all 0.2s ease;
}
.mascot-card::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
	pointer-events: none;
}
.mascot-card:active {
	transform: scale(0.98);
	opacity: 0.85;
}
.mascot-card-emoji {
	font-size: 64rpx;
	flex-shrink: 0;
}
.mascot-card-info {
	flex: 1;
}
.mascot-card-name {
	font-size: 30rpx;
	font-weight: bold;
	color: #1a1a2e;
	display: block;
}
.mascot-card-level {
	font-size: 22rpx;
	color: #555;
	display: block;
	margin-top: 4rpx;
	margin-bottom: 10rpx;
}
.mascot-exp-bg {
	height: 14rpx;
	background: linear-gradient(180deg, #e8eaf6, #f0f2ff);
	border-radius: 7rpx;
	overflow: hidden;
	box-shadow: 0 1rpx 0 rgba(255,255,255,0.8) inset, 0 1rpx 4rpx rgba(0,0,0,0.04);
}
.mascot-exp-fill {
	height: 100%;
	background: linear-gradient(90deg, #a18cd1, #fbc2eb);
	border-radius: 7rpx;
	transition: width 0.5s;
	box-shadow: 0 1rpx 2rpx rgba(161,140,209,0.3);
}

/* ==================== Menu Groups ==================== */
.menu-group {
	background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.88) 100%);
	border-radius: 28rpx;
	margin-bottom: 24rpx;
	overflow: hidden;
	border: 1rpx solid rgba(255, 255, 255, 0.7);
	box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.06), 0 1rpx 0 rgba(255, 255, 255, 0.9) inset;
	position: relative;
}
.menu-group::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
	pointer-events: none;
	z-index: 1;
}
.menu-item {
	display: flex;
	align-items: center;
	gap: 24rpx;
	padding: 28rpx 32rpx;
	border-bottom: 1rpx solid rgba(0,0,0,0.04);
	transition: all 0.2s ease;
	position: relative;
}
.menu-item:last-child { border-bottom: none; }
.menu-item:active {
	background: rgba(67,97,238,0.04);
	transform: scale(0.98);
	opacity: 0.85;
}
.menu-icon {
	width: 64rpx;
	height: 64rpx;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 32rpx;
	flex-shrink: 0;
}
.menu-text {
	flex: 1;
	font-size: 30rpx;
	color: #1a1a2e;
}
.menu-arrow {
	font-size: 36rpx;
	color: #ccc;
}
.verify-status {
	font-size: 22rpx;
	color: #4caf50;
	margin-left: auto;
	margin-right: 8rpx;
}
.verify-status.unverified {
	color: #ff9800;
}

/* ==================== Modal / Panels ==================== */
.detail-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0,0,0,0.25);
	z-index: 999;
	display: flex;
	align-items: center;
	justify-content: center;
}
.edit-panel {
	background: linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(248,250,255,0.92) 100%);
	border-radius: 32rpx;
	width: 600rpx;
	padding: 40rpx;
	animation: popIn 0.25s ease;
	border: 1rpx solid rgba(255,255,255,0.8);
	box-shadow: 0 16rpx 64rpx rgba(0,0,0,0.12), 0 1rpx 0 rgba(255,255,255,0.9) inset;
	position: relative;
	overflow: hidden;
}
.edit-panel::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent);
	pointer-events: none;
}
@keyframes popIn {
	from { transform: scale(0.85); opacity: 0; }
	to { transform: scale(1); opacity: 1; }
}
.edit-handle {
	width: 80rpx;
	height: 8rpx;
	background: rgba(0,0,0,0.1);
	border-radius: 4rpx;
	margin: 0 auto 32rpx;
}
.edit-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #1a1a2e;
	display: block;
	margin-bottom: 32rpx;
	text-align: center;
}
.edit-field {
	margin-bottom: 24rpx;
}
.edit-label {
	font-size: 26rpx;
	color: #555;
	display: block;
	margin-bottom: 10rpx;
}
.edit-input {
	font-size: 30rpx;
	color: #1a1a2e;
	background: linear-gradient(180deg, #f0f2ff, #f5f6fa);
	border-radius: 12rpx;
	padding: 20rpx 24rpx;
}
.edit-actions {
	display: flex;
	gap: 20rpx;
	margin-top: 32rpx;
}
.edit-cancel {
	flex: 1;
	text-align: center;
	padding: 24rpx 0;
	border-radius: 16rpx;
	background: linear-gradient(180deg, #f0f2ff, #f5f6fa);
	font-size: 30rpx;
	color: #555;
	transition: all 0.2s ease;
}
.edit-cancel:active {
	transform: scale(0.98);
	opacity: 0.85;
}
.edit-save {
	flex: 1;
	text-align: center;
	padding: 24rpx 0;
	border-radius: 16rpx;
	background: linear-gradient(135deg, #4361ee, #7b8cff);
	font-size: 30rpx;
	color: #ffffff;
	font-weight: bold;
	transition: all 0.2s ease;
}
.edit-save:active {
	transform: scale(0.98);
	opacity: 0.85;
}

/* ==================== Settings ==================== */
.setting-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 28rpx 0;
	border-bottom: 1rpx solid rgba(0,0,0,0.04);
	transition: all 0.2s ease;
}
.setting-item:last-child { border-bottom: none; }
.setting-item:active {
	transform: scale(0.98);
	opacity: 0.85;
}
.setting-text {
	font-size: 30rpx;
	color: #1a1a2e;
}
.setting-val {
	font-size: 26rpx;
	color: #555;
}
.setting-arrow {
	font-size: 32rpx;
	color: #ccc;
}

/* ==================== About ==================== */
.about-text {
	font-size: 28rpx;
	color: #555;
	display: block;
	margin-bottom: 16rpx;
	line-height: 1.6;
}

/* ==================== Verification ==================== */
.verify-intro {
	background: linear-gradient(180deg, rgba(232,240,255,0.9), rgba(240,247,255,0.85));
	border-radius: 16rpx;
	padding: 24rpx;
	margin-bottom: 24rpx;
	border: 1rpx solid rgba(67,97,238,0.1);
}
.verify-intro-text {
	font-size: 26rpx;
	color: #4361ee;
	line-height: 1.6;
}
.verify-success {
	text-align: center;
	padding: 20rpx 0 32rpx;
}
.verify-success-icon {
	font-size: 80rpx;
	display: block;
	margin-bottom: 16rpx;
}
.verify-success-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #4caf50;
	display: block;
	margin-bottom: 20rpx;
}
.verify-success-info {
	font-size: 26rpx;
	color: #555;
	display: block;
	margin-bottom: 8rpx;
}

/* ==================== Verification Steps ==================== */
.verify-steps {
	margin: 24rpx 0;
	padding: 24rpx;
	background: linear-gradient(180deg, rgba(248,250,255,0.9), rgba(240,242,255,0.85));
	border-radius: 16rpx;
	border: 1rpx solid rgba(67,97,238,0.06);
}
.verify-step {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 12rpx 0;
	opacity: 0.4;
	transition: opacity 0.3s;
}
.verify-step.active {
	opacity: 1;
}
.step-dot {
	width: 16rpx;
	height: 16rpx;
	border-radius: 8rpx;
	background: #e0e0e0;
	flex-shrink: 0;
	transition: background 0.3s;
}
.verify-step.active .step-dot {
	background: #4361ee;
	animation: stepPulse 1s ease infinite;
}
.verify-step.done .step-dot {
	background: #4caf50;
	animation: none;
}
@keyframes stepPulse {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.4; }
}
.step-text {
	font-size: 26rpx;
	color: #555;
}
.verify-step.active .step-text {
	color: #4361ee;
	font-weight: bold;
}
.verify-step.done .step-text {
	color: #4caf50;
}

/* 自定义底部导航 */
</style>

