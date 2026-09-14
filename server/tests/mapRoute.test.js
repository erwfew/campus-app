process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const test = require('node:test');
const assert = require('node:assert');
const { _parseLngLat } = require('../routes/map');

test('parseLngLat 解析经度,纬度格式（高德）', () => {
  assert.deepStrictEqual(_parseLngLat('113.123456,23.123456', 'lngLat'), {
    lng: 113.123456,
    lat: 23.123456
  });
  // 途经点列表里的单个点
  assert.deepStrictEqual(_parseLngLat('113.5,23.5', 'lngLat'), { lng: 113.5, lat: 23.5 });
});

test('parseLngLat 拒绝非法输入', () => {
  // 非字符串
  assert.strictEqual(_parseLngLat(undefined, 'lngLat'), null);
  assert.strictEqual(_parseLngLat(null, 'lngLat'), null);
  // 非数字
  assert.strictEqual(_parseLngLat('abc,def', 'lngLat'), null);
  // 多余段
  assert.strictEqual(_parseLngLat('113,23,45', 'lngLat'), null);
  // 注入尝试
  assert.strictEqual(_parseLngLat('113,23&key=x', 'lngLat'), null);
  // 越界：纬度 > 90（lngLat 顺序，第二段为纬度）
  assert.strictEqual(_parseLngLat('113,95', 'lngLat'), null);
  // 越界：经度 > 180
  assert.strictEqual(_parseLngLat('200,23', 'lngLat'), null);
});
