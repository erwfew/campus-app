process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const test = require('node:test');
const assert = require('node:assert');
const {
  toZhengfangSemester,
  toQingguoSemester,
  toJinzhiSemester,
  convertSemester
} = require('../services/semesterHelper');

test('toZhengfangSemester 转换学年学期', () => {
  assert.strictEqual(toZhengfangSemester('2025-1'), '2024-2025-1');
  assert.strictEqual(toZhengfangSemester('2025-2'), '2024-2025-2');
  assert.strictEqual(toZhengfangSemester('2020-1'), '2019-2020-1');
});

test('toQingguoSemester 转换学年学期', () => {
  assert.strictEqual(toQingguoSemester('2025-1'), '202420251');
  assert.strictEqual(toQingguoSemester('2025-2'), '202420252');
});

test('toJinzhiSemester 与青果格式一致', () => {
  assert.strictEqual(toJinzhiSemester('2025-1'), '202420251');
  assert.strictEqual(toJinzhiSemester('2025-2'), '202420252');
});

test('非法格式原样返回', () => {
  assert.strictEqual(toZhengfangSemester('2025'), '2025');
  assert.strictEqual(toQingguoSemester('abc'), 'abc');
  assert.strictEqual(toJinzhiSemester('2025-1-x'), '2025-1-x');
});

test('convertSemester 按系统类型分发', () => {
  assert.strictEqual(convertSemester('zhengfang', '2025-1'), '2024-2025-1');
  assert.strictEqual(convertSemester('qingguo', '2025-1'), '202420251');
  assert.strictEqual(convertSemester('jinzhi', '2025-1'), '202420251');
  // 未知系统类型原样返回
  assert.strictEqual(convertSemester('unknown', '2025-1'), '2025-1');
});
