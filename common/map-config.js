/**
 * 地图 API 配置
 * 生产环境请通过后端代理转发请求，不要直接暴露 Key
 * 
 * 申请地址：
 * - 腾讯地图：https://lbs.qq.com/dev/console/key
 * - 高德地图：https://console.amap.com/dev/key/app
 */

// 腾讯地图 WebService API Key
const TENCENT_MAP_KEY = 'HY2BZ-UKWWW-4ONRT-3SF44-INJF2-GAFVV'

// 高德地图 WebService API Key（优先使用，路线数据更可靠）
const AMAP_KEY = '30a676912903ee1e2fbf2f7e52a54772'

export { TENCENT_MAP_KEY, AMAP_KEY }
