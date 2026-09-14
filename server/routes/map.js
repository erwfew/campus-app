/**
 * 地图路线代理路由
 * 前端不直接携带地图 API Key 请求高德/腾讯，统一走后端转发，Key 只存在于服务端环境变量
 */
const express = require('express');
const axios = require('axios');
const config = require('../config');
const { authenticate } = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');

const router = express.Router();

// 经纬度参数校验：lng,lat（数字，纬度 ≤90、经度 ≤180 在解析后校验）
const LNG_LAT_RE = /^(\d{1,3}(?:\.\d+)?),(\d{1,3}(?:\.\d+)?)$/;

function parseLngLat(value, order) {
  if (typeof value !== 'string') return null;
  const m = value.match(LNG_LAT_RE);
  if (!m) return null;
  const first = parseFloat(m[1]);
  const second = parseFloat(m[2]);
  const [lng, lat] = order === 'lngLat' ? [first, second] : [second, first];
  if (lat > 90 || lng > 180) return null;
  return { lng, lat };
}

function keyMissing(res, provider) {
  return res.status(503).json({
    success: false,
    error: { code: 'MAP_KEY_NOT_CONFIGURED', message: `服务端未配置${provider}地图 Key，请在环境变量中设置` }
  });
}

// 高德步行路线（支持途经点）
// GET /api/map/walking?origin=lng,lat&destination=lng,lat&waypoints=lng,lat|lng,lat
router.get('/walking', authenticate, rateLimit(config.rateLimit.windowMs, 60), async (req, res) => {
  if (!config.amapKey) return keyMissing(res, '高德');

  const origin = parseLngLat(req.query.origin, 'lngLat');
  const destination = parseLngLat(req.query.destination, 'lngLat');
  if (!origin || !destination) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_PARAMS', message: 'origin/destination 格式应为 经度,纬度' }
    });
  }

  const params = {
    origin: `${origin.lng},${origin.lat}`,
    destination: `${destination.lng},${destination.lat}`,
    key: config.amapKey,
    extensions: 'all',
    strategy: 2
  };
  if (typeof req.query.waypoints === 'string' && req.query.waypoints) {
    const parts = req.query.waypoints.split('|');
    const parsed = parts.map(p => parseLngLat(p, 'lngLat'));
    if (parsed.some(p => !p)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: 'waypoints 格式应为 经度,纬度，多个用 | 分隔' }
      });
    }
    params.waypoints = parsed.map(p => `${p.lng},${p.lat}`).join('|');
  }

  try {
    const resp = await axios.get('https://restapi.amap.com/v3/direction/walking', {
      params,
      timeout: config.requestTimeout
    });
    res.json(resp.data);
  } catch (err) {
    console.error('[Map] 高德路线请求失败:', err.message);
    res.status(502).json({
      success: false,
      error: { code: 'MAP_UPSTREAM_ERROR', message: '高德路线服务请求失败' }
    });
  }
});

module.exports = router;
// 仅供单元测试使用
module.exports._parseLngLat = parseLngLat;
