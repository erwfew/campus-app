<template>
	<view class="rank-page">
		<!-- 排行类型切换 -->
		<view class="rank-tabs">
			<text
				class="rank-tab"
				:class="{ active: activeTab === tab.value }"
				v-for="tab in tabs"
				:key="tab.value"
				@tap="switchTab(tab.value)"
			>{{tab.label}}</text>
		</view>

		<!-- 范围切换 -->
		<view class="scope-row">
			<text
				class="scope-tag"
				:class="{ active: activeScope === scope.value }"
				v-for="scope in scopes"
				:key="scope.value"
				@tap="switchScope(scope.value)"
			>{{scope.label}}</text>
		</view>

		<!-- 排行列表 -->
		<view class="card">
			<view
				class="rank-item"
				:class="{
					top1: index === 0,
					top2: index === 1,
					top3: index === 2,
					me: item.isMe
				}"
				v-for="(item, index) in currentRankList"
				:key="index"
			>
				<text class="rank-num" :class="getRankClass(index)">{{index + 1}}</text>
				<view class="rank-avatar-box" :style="{ background: item.avatarBg }">
					<text class="rank-avatar-text" :style="{ color: item.avatarColor }">{{item.avatarText}}</text>
				</view>
				<view class="rank-info">
					<text class="rank-name">{{item.name}}</text>
					<text class="rank-desc">{{item.desc}}</text>
				</view>
				<text class="rank-score">{{item.score}}</text>
			</view>
		</view>

		<!-- 成就徽章 -->
		<view class="card">
			<text class="card-title">我的成就</text>
			<view class="ach-grid">
				<view
					class="ach-item"
					:class="{ locked: !ach.unlocked }"
					v-for="ach in achievements"
					:key="ach.name"
					@tap="showAchDetail(ach)"
				>
					<text class="ach-icon">{{ach.icon}}</text>
					<text class="ach-name">{{ach.name}}</text>
				</view>
			</view>
		</view>

		<!-- 成就详情弹窗 -->
		<view class="modal-mask" v-if="showAchModal" @tap="closeAchModal">
			<view class="modal-content" @tap.stop>
				<view class="modal-body" v-if="selectedAch">
					<text class="modal-ach-icon">{{selectedAch.icon}}</text>
					<text class="modal-ach-name">{{selectedAch.name}}</text>
					<text class="modal-ach-desc">{{selectedAch.description}}</text>
					<text class="modal-ach-status" :class="{ unlocked: selectedAch.unlocked }">
						{{selectedAch.unlocked ? '已解锁 · ' + selectedAch.date : '未解锁 · ' + selectedAch.requirement}}
					</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			activeTab: 'attendance',
			activeScope: 'class',
			showAchModal: false,
			selectedAch: null,
			tabs: [
				{ label: '到课率', value: 'attendance' },
				{ label: '课堂表现', value: 'performance' },
				{ label: '运动排行', value: 'sport' }
			],
			scopes: [
				{ label: '班级', value: 'class' },
				{ label: '年级', value: 'grade' },
				{ label: '全院', value: 'college' }
			],
			rankData: {
				attendance: {
					class: [
						{ name: '李明', desc: '出勤率 100%', score: '98分', avatarText: '李', avatarBg: '#fff9c4', avatarColor: '#f9a825', isMe: false },
						{ name: '王芳', desc: '出勤率 97%', score: '95分', avatarText: '王', avatarBg: '#e8f5e9', avatarColor: '#4caf50', isMe: false },
						{ name: '张同学', desc: '出勤率 90%', score: '90分', avatarText: '张', avatarBg: '#fff3e0', avatarColor: '#ff9800', isMe: true },
						{ name: '赵雷', desc: '出勤率 87%', score: '85分', avatarText: '赵', avatarBg: '#f5f5f5', avatarColor: '#666', isMe: false },
						{ name: '刘洋', desc: '出勤率 85%', score: '82分', avatarText: '刘', avatarBg: '#f5f5f5', avatarColor: '#666', isMe: false },
						{ name: '陈静', desc: '出勤率 80%', score: '78分', avatarText: '陈', avatarBg: '#f5f5f5', avatarColor: '#666', isMe: false }
					],
					grade: [
						{ name: '周学霸', desc: '出勤率 100%', score: '99分', avatarText: '周', avatarBg: '#fff9c4', avatarColor: '#f9a825', isMe: false },
						{ name: '孙晓', desc: '出勤率 98%', score: '96分', avatarText: '孙', avatarBg: '#e8f5e9', avatarColor: '#4caf50', isMe: false },
						{ name: '张同学', desc: '出勤率 90%', score: '90分', avatarText: '张', avatarBg: '#fff3e0', avatarColor: '#ff9800', isMe: true },
						{ name: '吴磊', desc: '出勤率 88%', score: '86分', avatarText: '吴', avatarBg: '#f5f5f5', avatarColor: '#666', isMe: false },
						{ name: '郑华', desc: '出勤率 82%', score: '80分', avatarText: '郑', avatarBg: '#f5f5f5', avatarColor: '#666', isMe: false }
					],
					college: [
						{ name: '院状元', desc: '出勤率 100%', score: '100分', avatarText: '状', avatarBg: '#fff9c4', avatarColor: '#f9a825', isMe: false },
						{ name: '榜眼君', desc: '出勤率 99%', score: '98分', avatarText: '榜', avatarBg: '#e8eaf6', avatarColor: '#5c6bc0', isMe: false },
						{ name: '张同学', desc: '出勤率 90%', score: '90分', avatarText: '张', avatarBg: '#fff3e0', avatarColor: '#ff9800', isMe: true },
						{ name: '钱多多', desc: '出勤率 86%', score: '84分', avatarText: '钱', avatarBg: '#f5f5f5', avatarColor: '#666', isMe: false },
						{ name: '冯刚', desc: '出勤率 83%', score: '81分', avatarText: '冯', avatarBg: '#f5f5f5', avatarColor: '#666', isMe: false }
					]
				},
				performance: {
					class: [
						{ name: '王芳', desc: '课堂互动 45次', score: '96分', avatarText: '王', avatarBg: '#fff9c4', avatarColor: '#f9a825', isMe: false },
						{ name: '张同学', desc: '课堂互动 38次', score: '90分', avatarText: '张', avatarBg: '#e8f5e9', avatarColor: '#4caf50', isMe: true },
						{ name: '李明', desc: '课堂互动 30次', score: '88分', avatarText: '李', avatarBg: '#fff3e0', avatarColor: '#ff9800', isMe: false },
						{ name: '赵雷', desc: '课堂互动 25次', score: '82分', avatarText: '赵', avatarBg: '#f5f5f5', avatarColor: '#666', isMe: false },
						{ name: '刘洋', desc: '课堂互动 18次', score: '75分', avatarText: '刘', avatarBg: '#f5f5f5', avatarColor: '#666', isMe: false }
					],
					grade: [
						{ name: '学霸A', desc: '课堂互动 52次', score: '98分', avatarText: 'A', avatarBg: '#fff9c4', avatarColor: '#f9a825', isMe: false },
						{ name: '张同学', desc: '课堂互动 38次', score: '90分', avatarText: '张', avatarBg: '#e8eaf6', avatarColor: '#5c6bc0', isMe: true },
						{ name: '好学B', desc: '课堂互动 35次', score: '87分', avatarText: 'B', avatarBg: '#fff3e0', avatarColor: '#ff9800', isMe: false },
						{ name: '认真C', desc: '课堂互动 28次', score: '80分', avatarText: 'C', avatarBg: '#f5f5f5', avatarColor: '#666', isMe: false }
					],
					college: [
						{ name: '互动王', desc: '课堂互动 60次', score: '99分', avatarText: '互', avatarBg: '#fff9c4', avatarColor: '#f9a825', isMe: false },
						{ name: '积极D', desc: '课堂互动 48次', score: '95分', avatarText: 'D', avatarBg: '#e8eaf6', avatarColor: '#5c6bc0', isMe: false },
						{ name: '张同学', desc: '课堂互动 38次', score: '90分', avatarText: '张', avatarBg: '#fff3e0', avatarColor: '#ff9800', isMe: true },
						{ name: '普通E', desc: '课堂互动 22次', score: '78分', avatarText: 'E', avatarBg: '#f5f5f5', avatarColor: '#666', isMe: false }
					]
				},
				sport: {
					class: [
						{ name: '赵雷', desc: '本周跑步 15.2km', score: '95分', avatarText: '赵', avatarBg: '#fff9c4', avatarColor: '#f9a825', isMe: false },
						{ name: '刘洋', desc: '本周跑步 12.8km', score: '88分', avatarText: '刘', avatarBg: '#e8f5e9', avatarColor: '#4caf50', isMe: false },
						{ name: '张同学', desc: '本周跑步 8.5km', score: '75分', avatarText: '张', avatarBg: '#fff3e0', avatarColor: '#ff9800', isMe: true },
						{ name: '李明', desc: '本周跑步 6.0km', score: '65分', avatarText: '李', avatarBg: '#f5f5f5', avatarColor: '#666', isMe: false },
						{ name: '王芳', desc: '本周跑步 3.2km', score: '50分', avatarText: '王', avatarBg: '#f5f5f5', avatarColor: '#666', isMe: false }
					],
					grade: [
						{ name: '跑步达人', desc: '本周跑步 22.0km', score: '99分', avatarText: '跑', avatarBg: '#fff9c4', avatarColor: '#f9a825', isMe: false },
						{ name: '运动F', desc: '本周跑步 18.5km', score: '92分', avatarText: 'F', avatarBg: '#e8eaf6', avatarColor: '#5c6bc0', isMe: false },
						{ name: '张同学', desc: '本周跑步 8.5km', score: '75分', avatarText: '张', avatarBg: '#fff3e0', avatarColor: '#ff9800', isMe: true },
						{ name: '慢跑G', desc: '本周跑步 5.0km', score: '55分', avatarText: 'G', avatarBg: '#f5f5f5', avatarColor: '#666', isMe: false }
					],
					college: [
						{ name: '院跑神', desc: '本周跑步 30.0km', score: '100分', avatarText: '神', avatarBg: '#fff9c4', avatarColor: '#f9a825', isMe: false },
						{ name: '快跑H', desc: '本周跑步 25.0km', score: '96分', avatarText: 'H', avatarBg: '#e8eaf6', avatarColor: '#5c6bc0', isMe: false },
						{ name: '张同学', desc: '本周跑步 8.5km', score: '75分', avatarText: '张', avatarBg: '#fff3e0', avatarColor: '#ff9800', isMe: true },
						{ name: '散步I', desc: '本周跑步 2.0km', score: '30分', avatarText: 'I', avatarBg: '#f5f5f5', avatarColor: '#666', isMe: false }
					]
				}
			},
			achievements: [
				{ icon: '\u{1F3C6}', name: '学习之星', unlocked: true, date: '2026-03-15', description: '连续一周出勤率100%', requirement: '连续一周出勤率100%' },
				{ icon: '\u{1F3C5}', name: '运动达人', unlocked: true, date: '2026-03-20', description: '累计跑步超过50公里', requirement: '累计跑步超过50公里' },
				{ icon: '\u2B50', name: '全勤奖', unlocked: true, date: '2026-03-01', description: '本月无缺勤记录', requirement: '本月无缺勤记录' },
				{ icon: '\u{1F451}', name: '学霸', unlocked: false, date: '', description: '课堂表现连续3次排名第一', requirement: '课堂表现连续3次排名第一' },
				{ icon: '\u{1F680}', name: '进步王', unlocked: false, date: '', description: '排名较上周提升5名以上', requirement: '排名较上周提升5名以上' },
				{ icon: '\u{1F31F}', name: '社团达人', unlocked: false, date: '', description: '参加3个以上社团活动', requirement: '参加3个以上社团活动' }
			]
		}
	},
	computed: {
		currentRankList() {
			var tabData = this.rankData[this.activeTab]
			if (!tabData) return []
			return tabData[this.activeScope] || []
		}
	},
	methods: {
		switchTab(value) {
			this.activeTab = value
		},
		switchScope(value) {
			this.activeScope = value
		},
		getRankClass(index) {
			if (index === 0) return 'gold'
			if (index === 1) return 'silver'
			if (index === 2) return 'bronze'
			return 'normal'
		},
		showAchDetail(ach) {
			this.selectedAch = ach
			this.showAchModal = true
		},
		closeAchModal() {
			this.showAchModal = false
			this.selectedAch = null
		}
	}
}
</script>

<style>
.rank-page {
	padding-bottom: 20rpx;
	background: linear-gradient(180deg, #4361ee 0%, #6b83f5 12%, #d4daff 28%, #e8ecff 50%, #f0f2ff 70%, #f5f6fa 100%);
	min-height: 100vh;
}

/* 排行切换 */
.rank-tabs {
	display: flex;
	margin: 20rpx 32rpx;
	background: linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(248,250,255,0.65) 100%);
	border-radius: 24rpx;
	padding: 6rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.6);
	box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06), 0 1rpx 0 rgba(255, 255, 255, 0.8) inset;
}
.rank-tab {
	flex: 1;
	padding: 16rpx;
	text-align: center;
	border-radius: 20rpx;
	font-size: 26rpx;
	color: #555;
	transition: all 0.2s ease;
}
.rank-tab:active {
	transform: scale(0.98);
	opacity: 0.85;
}
.rank-tab.active {
	background: linear-gradient(135deg, #4361ee, #7b8cff);
	color: #ffffff;
	font-weight: bold;
	box-shadow: 0 4rpx 16rpx rgba(67, 97, 238, 0.3);
}

.scope-row {
	display: flex;
	gap: 16rpx;
	margin: 0 32rpx 24rpx;
}
.scope-tag {
	padding: 12rpx 32rpx;
	border-radius: 32rpx;
	font-size: 26rpx;
	background: linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(248,250,255,0.85) 100%);
	color: #555;
	border: 1rpx solid rgba(255, 255, 255, 0.7);
	box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06), 0 1rpx 0 rgba(255, 255, 255, 0.9) inset;
	transition: all 0.2s ease;
}
.scope-tag:active {
	transform: scale(0.98);
	opacity: 0.85;
}
.scope-tag.active {
	background: linear-gradient(135deg, #4361ee, #7b8cff);
	color: #ffffff;
	border-color: rgba(67, 97, 238, 0.3);
	box-shadow: 0 4rpx 20rpx rgba(67, 97, 238, 0.3);
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

/* 排行项 */
.rank-item {
	display: flex;
	align-items: center;
	gap: 24rpx;
	padding: 24rpx 16rpx;
	border-bottom: 1rpx solid rgba(0,0,0,0.05);
	transition: all 0.2s ease;
}
.rank-item:active {
	transform: scale(0.99);
	opacity: 0.9;
}
.rank-item:last-child { border-bottom: none; }
.rank-item.me {
	background: linear-gradient(180deg, rgba(238,240,255,0.9) 0%, rgba(228,232,255,0.75) 100%);
	border-radius: 20rpx;
	margin: 8rpx -16rpx;
	padding: 24rpx 32rpx;
	box-shadow: 0 4rpx 16rpx rgba(67, 97, 238, 0.1);
}
.rank-num {
	font-size: 32rpx;
	font-weight: bold;
	width: 48rpx;
	text-align: center;
}
.rank-num.gold {
	color: #ffd700;
	text-shadow: 0 2rpx 8rpx rgba(255, 215, 0, 0.4);
}
.rank-num.silver {
	color: #c0c0c0;
	text-shadow: 0 2rpx 8rpx rgba(192, 192, 192, 0.4);
}
.rank-num.bronze {
	color: #cd7f32;
	text-shadow: 0 2rpx 8rpx rgba(205, 127, 50, 0.4);
}
.rank-num.normal { color: #999; }
.rank-avatar-box {
	width: 80rpx;
	height: 80rpx;
	border-radius: 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.rank-avatar-text {
	font-size: 32rpx;
	font-weight: bold;
}
.rank-info {
	flex: 1;
}
.rank-name {
	font-size: 30rpx;
	font-weight: bold;
	color: #1a1a2e;
	display: block;
	margin-bottom: 4rpx;
}
.rank-desc {
	font-size: 24rpx;
	color: #999;
}
.rank-score {
	font-size: 30rpx;
	font-weight: bold;
	color: #4361ee;
}

/* 成就 */
.ach-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}
.ach-item {
	width: calc(33.33% - 12rpx);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12rpx;
	padding: 28rpx 12rpx;
	background: linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(248,250,255,0.75) 100%);
	border-radius: 20rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.6);
	box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
	transition: all 0.2s ease;
}
.ach-item:active {
	transform: scale(0.96);
	opacity: 0.85;
}
.ach-item.locked {
	opacity: 0.4;
}
.ach-icon {
	font-size: 56rpx;
}
.ach-name {
	font-size: 24rpx;
	color: #555;
	text-align: center;
}

/* 弹窗 */
.modal-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0,0,0,0.35);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}
.modal-content {
	background: linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(248,250,255,0.92) 100%);
	border-radius: 28rpx;
	width: 600rpx;
	animation: scaleIn 0.2s ease;
	border: 1rpx solid rgba(255, 255, 255, 0.7);
	box-shadow: 0 16rpx 48rpx rgba(0,0,0,0.1), 0 1rpx 0 rgba(255, 255, 255, 0.9) inset;
	position: relative;
	overflow: hidden;
}
.modal-content::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
	pointer-events: none;
}
@keyframes scaleIn {
	from { transform: scale(0.8); opacity: 0; }
	to { transform: scale(1); opacity: 1; }
}
.modal-body {
	padding: 48rpx 32rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}
.modal-ach-icon {
	font-size: 96rpx;
	margin-bottom: 20rpx;
}
.modal-ach-name {
	font-size: 34rpx;
	font-weight: bold;
	color: #1a1a2e;
	margin-bottom: 16rpx;
}
.modal-ach-desc {
	font-size: 28rpx;
	color: #555;
	text-align: center;
	margin-bottom: 20rpx;
	line-height: 1.5;
}
.modal-ach-status {
	font-size: 24rpx;
	color: #999;
}
.modal-ach-status.unlocked {
	color: #4caf50;
}
</style>
