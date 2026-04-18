<template>
	<view class="creative-page">
		<!-- Banner -->
		<view class="banner">
			<text class="banner-title">校园文创精选</text>
			<text class="banner-desc">发现校园独特文化魅力</text>
		</view>

		<!-- 分类 -->
		<view class="categories">
			<text
				class="cat-tag"
				:class="{ active: activeCategory === cat.value }"
				v-for="cat in categories"
				:key="cat.value"
				@tap="switchCategory(cat.value)"
			>{{cat.label}}</text>
		</view>

		<!-- 商品网格 -->
		<view class="product-grid" v-if="filteredProducts.length > 0">
			<view
				class="product-card"
				v-for="product in filteredProducts"
				:key="product.id"
				@tap="showProductDetail(product)"
			>
				<view class="product-img" :style="{ background: product.bgColor }">
					<text class="product-emoji">{{product.emoji}}</text>
				</view>
				<view class="product-info">
					<text class="product-name">{{product.name}}</text>
					<text class="product-price">¥{{product.price.toFixed(2)}}</text>
				</view>
			</view>
		</view>
		<view class="empty" v-else>
			<text class="empty-text">该分类暂无商品</text>
		</view>

		<!-- 热门活动 -->
		<view class="card">
			<text class="card-title">热门活动</text>
			<view class="activity-list">
				<view
					class="activity-item"
					v-for="activity in activities"
					:key="activity.id"
					@tap="showActivityDetail(activity)"
				>
					<text class="activity-icon" :style="{ background: activity.bgColor }">{{activity.emoji}}</text>
					<view class="activity-info">
						<text class="activity-name">{{activity.name}}</text>
						<text class="activity-desc">{{activity.date}} · {{activity.location}}</text>
					</view>
					<text class="activity-status" :class="activity.statusClass">{{activity.statusText}}</text>
				</view>
			</view>
		</view>

		<!-- 商品详情弹窗 -->
		<view class="modal-mask" v-if="showProductModal" @tap="closeProductModal">
			<view class="modal-content" @tap.stop>
				<view class="modal-header">
					<text class="modal-title">商品详情</text>
					<text class="modal-close" @tap="closeProductModal">×</text>
				</view>
				<view class="modal-body" v-if="selectedProduct">
					<view class="modal-img" :style="{ background: selectedProduct.bgColor }">
						<text class="modal-emoji">{{selectedProduct.emoji}}</text>
					</view>
					<text class="modal-product-name">{{selectedProduct.name}}</text>
					<text class="modal-product-price">¥{{selectedProduct.price.toFixed(2)}}</text>
					<text class="modal-product-desc">{{selectedProduct.description}}</text>
					<view class="modal-actions">
						<button class="btn-cart" @tap="addToCart(selectedProduct)">加入购物车</button>
					</view>
				</view>
			</view>
		</view>

		<!-- 活动详情弹窗 -->
		<view class="modal-mask" v-if="showActivityModal" @tap="closeActivityModal">
			<view class="modal-content" @tap.stop>
				<view class="modal-header">
					<text class="modal-title">活动详情</text>
					<text class="modal-close" @tap="closeActivityModal">×</text>
				</view>
				<view class="modal-body" v-if="selectedActivity">
					<view class="modal-img" :style="{ background: selectedActivity.bgColor }">
						<text class="modal-emoji">{{selectedActivity.emoji}}</text>
					</view>
					<text class="modal-product-name">{{selectedActivity.name}}</text>
					<text class="modal-activity-meta">{{selectedActivity.date}} · {{selectedActivity.location}}</text>
					<text class="modal-product-desc">{{selectedActivity.description}}</text>
					<view class="modal-actions">
						<button class="btn-cart" @tap="joinActivity(selectedActivity)">{{selectedActivity.statusText === '已报名' ? '已报名' : '立即报名'}}</button>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			activeCategory: 'all',
			categories: [
				{ label: '全部', value: 'all' },
				{ label: '文具', value: 'stationery' },
				{ label: '饰品', value: 'accessory' },
				{ label: '服装', value: 'clothing' }
			],
			products: [
				{ id: 1, name: '校徽笔记本', price: 25, emoji: '\u{1F4DD}', bgColor: '#e8eaf6', category: 'stationery', description: '精致校徽烫金笔记本，128页道林纸内页，适合日常笔记和课堂记录。封面采用PU材质，手感细腻。' },
				{ id: 2, name: '校园背包', price: 89, emoji: '\u{1F392}', bgColor: '#fce4ec', category: 'clothing', description: '经典校园风双肩包，防水面料，多隔层设计，15寸笔记本电脑仓，适合日常通勤和短途出行。' },
				{ id: 3, name: '校徽钥匙扣', price: 15, emoji: '\u{1F453}', bgColor: '#e0f2f1', category: 'accessory', description: '金属校徽钥匙扣，锌合金材质，电镀工艺不易褪色，附赠精美包装盒。' },
				{ id: 4, name: '校园明信片', price: 10, emoji: '\u{1F4AC}', bgColor: '#fff3e0', category: 'stationery', description: '校园风景明信片套装，共8张，精选校园四季美景，300g铜版纸印刷，可寄送可收藏。' },
				{ id: 5, name: '校徽卫衣', price: 128, emoji: '\u{1F455}', bgColor: '#e8eaf6', category: 'clothing', description: '纯棉校园卫衣，胸前刺绣校徽，宽松版型，适合春秋季节穿着。有黑、白、灰三色可选。' },
				{ id: 6, name: '校园帆布袋', price: 35, emoji: '\u{1F6CD}', bgColor: '#f3e5f5', category: 'accessory', description: '环保帆布袋，丝网印刷校园图案，大容量设计，可承载10kg，日常购物和上课都适用。' },
				{ id: 7, name: '校园水杯', price: 45, emoji: '\u{1FAD4}', bgColor: '#e0f7fa', category: 'accessory', description: '不锈钢保温杯，双层真空隔热，6小时保温，杯身激光雕刻校训，容量500ml。' },
				{ id: 8, name: '校园贴纸包', price: 8, emoji: '\u{1F4CB}', bgColor: '#fff9c4', category: 'stationery', description: '校园主题贴纸套装，共20枚，PVC防水材质，适合装饰笔记本、电脑和手机壳。' }
			],
			activities: [
				{ id: 1, name: '校园文化节', date: '3月28日', location: '学校广场', emoji: '\u{1F3AD}', bgColor: '#e8eaf6', statusText: '报名中', statusClass: '', description: '一年一度的校园文化节，包含社团展演、美食市集、创意集市等丰富活动。欢迎全校师生参加！', joined: false },
				{ id: 2, name: '草地音乐节', date: '4月1日', location: '操场', emoji: '\u{1F3B5}', bgColor: '#e8f5e9', statusText: '即将开始', statusClass: 'soon', description: '春日草地音乐节，多个学生乐队倾情演出，带上你的朋友一起来享受音乐吧！', joined: false },
				{ id: 3, name: '读书分享会', date: '4月5日', location: '图书馆报告厅', emoji: '\u{1F4DA}', bgColor: '#fff3e0', statusText: '报名中', statusClass: '', description: '以书会友，分享你最近读过的好书。每位分享者可获得精美书签一枚。', joined: false },
				{ id: 4, name: '校园摄影大赛', date: '4月10日截止', location: '线上投稿', emoji: '\u{1F4F7}', bgColor: '#fce4ec', statusText: '报名中', statusClass: '', description: '用镜头记录校园之美，作品将在学校公众号展示，优秀作品可获得丰厚奖品。', joined: false }
			],
			showProductModal: false,
			showActivityModal: false,
			selectedProduct: null,
			selectedActivity: null
		}
	},
	computed: {
		filteredProducts() {
			if (this.activeCategory === 'all') return this.products
			return this.products.filter(function(p) { return p.category === this.activeCategory }.bind(this))
		}
	},
	methods: {
		switchCategory(value) {
			this.activeCategory = value
		},
		showProductDetail(product) {
			this.selectedProduct = product
			this.showProductModal = true
		},
		closeProductModal() {
			this.showProductModal = false
			this.selectedProduct = null
		},
		showActivityDetail(activity) {
			this.selectedActivity = activity
			this.showActivityModal = true
		},
		closeActivityModal() {
			this.showActivityModal = false
			this.selectedActivity = null
		},
		addToCart(product) {
			uni.showToast({ title: '已加入购物车', icon: 'success' })
			this.closeProductModal()
		},
		joinActivity(activity) {
			if (activity.statusText === '已报名') return
			activity.statusText = '已报名'
			activity.statusClass = ''
			uni.showToast({ title: '报名成功', icon: 'success' })
			this.closeActivityModal()
		}
	}
}
</script>

<style>
.creative-page {
	padding-bottom: 20rpx;
	background: linear-gradient(180deg, #4361ee 0%, #6b83f5 12%, #d4daff 28%, #e8ecff 50%, #f0f2ff 70%, #f5f6fa 100%);
	min-height: 100vh;
}

/* Banner */
.banner {
	margin: 20rpx 32rpx;
	padding: 56rpx 40rpx;
	background: linear-gradient(135deg, #667eea 0%, #7c5cbf 50%, #9b6dff 100%);
	border-radius: 28rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.25);
	box-shadow: 0 8rpx 32rpx rgba(102, 126, 234, 0.3), 0 1rpx 0 rgba(255, 255, 255, 0.15) inset;
	position: relative;
	overflow: hidden;
}
.banner::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
	pointer-events: none;
}
.banner-title {
	font-size: 40rpx;
	font-weight: bold;
	color: #ffffff;
	display: block;
	margin-bottom: 12rpx;
}
.banner-desc {
	font-size: 26rpx;
	color: rgba(255,255,255,0.9);
}

/* 分类 */
.categories {
	display: flex;
	gap: 16rpx;
	margin: 0 32rpx 32rpx;
	overflow-x: hidden;
}
.cat-tag {
	padding: 16rpx 36rpx;
	border-radius: 40rpx;
	font-size: 26rpx;
	background: linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(248,250,255,0.85) 100%);
	color: #555;
	border: 1rpx solid rgba(255, 255, 255, 0.7);
	box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06), 0 1rpx 0 rgba(255, 255, 255, 0.9) inset;
	transition: all 0.2s ease;
}
.cat-tag:active {
	transform: scale(0.98);
	opacity: 0.85;
}
.cat-tag.active {
	background: linear-gradient(135deg, #4361ee, #7b8cff);
	color: #ffffff;
	border-color: rgba(67, 97, 238, 0.3);
	box-shadow: 0 4rpx 20rpx rgba(67, 97, 238, 0.3);
}

/* 商品 */
.product-grid {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	margin: 0 32rpx 32rpx;
}
.product-card {
	width: calc(50% - 12rpx);
	background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.88) 100%);
	border-radius: 28rpx;
	overflow: hidden;
	margin-bottom: 24rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.7);
	box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.06), 0 1rpx 0 rgba(255, 255, 255, 0.9) inset;
	position: relative;
	transition: all 0.2s ease;
}
.product-card::before {
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
.product-card:active {
	transform: scale(0.98);
	opacity: 0.85;
}
.product-img {
	height: 240rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}
.product-emoji {
	font-size: 96rpx;
}
.product-info {
	padding: 24rpx;
}
.product-name {
	font-size: 28rpx;
	color: #1a1a2e;
	display: block;
	margin-bottom: 8rpx;
}
.product-price {
	font-size: 32rpx;
	font-weight: bold;
	color: #f44336;
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

/* 活动 */
.activity-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}
.activity-item {
	display: flex;
	align-items: center;
	gap: 24rpx;
	padding: 20rpx;
	background: linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(248,250,255,0.75) 100%);
	border-radius: 20rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.6);
	box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
	transition: all 0.2s ease;
}
.activity-item:active {
	transform: scale(0.98);
	opacity: 0.85;
}
.activity-icon {
	width: 80rpx;
	height: 80rpx;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 40rpx;
	flex-shrink: 0;
}
.activity-info {
	flex: 1;
}
.activity-name {
	font-size: 28rpx;
	font-weight: bold;
	color: #1a1a2e;
	display: block;
	margin-bottom: 4rpx;
}
.activity-desc {
	font-size: 24rpx;
	color: #999;
}
.activity-status {
	font-size: 22rpx;
	padding: 6rpx 20rpx;
	border-radius: 20rpx;
	background: #e8f5e9;
	color: #4caf50;
}
.activity-status.soon {
	background: #fff3e0;
	color: #ff9800;
}

/* 空状态 */
.empty {
	display: flex;
	justify-content: center;
	padding: 80rpx 0;
	margin: 0 32rpx 32rpx;
}
.empty-text {
	font-size: 28rpx;
	color: #555;
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
	align-items: flex-end;
	justify-content: center;
	z-index: 1000;
}
.modal-content {
	background: linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(248,250,255,0.92) 100%);
	border-radius: 28rpx 28rpx 0 0;
	width: 100%;
	max-height: 80vh;
	overflow-y: auto;
	animation: slideUp 0.25s ease;
	box-shadow: 0 -4rpx 32rpx rgba(0,0,0,0.08), 0 1rpx 0 rgba(255, 255, 255, 0.9) inset;
	position: relative;
	padding-bottom: calc(20rpx + var(--safe-area-inset-bottom));
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
@keyframes slideUp {
	from { transform: translateY(100%); }
	to { transform: translateY(0); }
}
.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 32rpx;
	border-bottom: 1rpx solid rgba(0,0,0,0.06);
}
.modal-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #1a1a2e;
}
.modal-close {
	font-size: 48rpx;
	color: #999;
	line-height: 1;
	transition: all 0.2s ease;
}
.modal-close:active {
	transform: scale(0.9);
	opacity: 0.7;
}
.modal-body {
	padding: 32rpx;
}
.modal-img {
	height: 300rpx;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 24rpx;
}
.modal-emoji {
	font-size: 120rpx;
}
.modal-product-name {
	font-size: 34rpx;
	font-weight: bold;
	color: #1a1a2e;
	display: block;
	margin-bottom: 12rpx;
}
.modal-product-price {
	font-size: 36rpx;
	font-weight: bold;
	color: #f44336;
	display: block;
	margin-bottom: 20rpx;
}
.modal-activity-meta {
	font-size: 26rpx;
	color: #555;
	display: block;
	margin-bottom: 20rpx;
}
.modal-product-desc {
	font-size: 28rpx;
	color: #555;
	line-height: 1.6;
	display: block;
	margin-bottom: 32rpx;
}
.modal-actions {
	padding-bottom: 20rpx;
}
.btn-cart {
	background: linear-gradient(135deg, #4361ee, #7b8cff);
	color: #fff;
	border: none;
	border-radius: 40rpx;
	font-size: 30rpx;
	height: 88rpx;
	line-height: 88rpx;
	transition: all 0.2s ease;
	box-shadow: 0 4rpx 16rpx rgba(67, 97, 238, 0.3);
}
.btn-cart:active {
	transform: scale(0.98);
	opacity: 0.85;
}
</style>
