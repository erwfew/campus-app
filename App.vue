<script>
import { useUserStore } from './store/pinia'
import { useMascotStore } from './store/pinia'

export default {
  onLaunch: function() {
    console.log('效园通APP 启动')
    // 初始化 Pinia stores（从本地存储恢复状态）
    const userStore = useUserStore()
    const mascotStore = useMascotStore()
    userStore.initFromStorage()
    mascotStore.loadFromStorage()
  }
}
</script>

<style>
page {
	margin: 0;
	padding: 0;
	--safe-area-inset-top: env(safe-area-inset-top, 0px);
	--safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
	--safe-area-inset-left: env(safe-area-inset-left, 0px);
	--safe-area-inset-right: env(safe-area-inset-right, 0px);
}
</style>
