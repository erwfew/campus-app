<template>
	<view class="webview-page">
		<web-view :src="url"></web-view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			url: ''
		}
	},
	onLoad(options) {
		if (options.url) {
			this.url = decodeURIComponent(options.url)
		}
	}
}
</script>

<style>
.webview-page {
	width: 100%;
	height: 100%;
}
</style>
