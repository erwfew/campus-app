process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const test = require('node:test');
const assert = require('node:assert');
const { parseCourses } = require('../services/courseParser');
const { AppError } = require('../middleware/errorHandler');

test('不支持的教务系统类型抛出 400 错误', async () => {
  await assert.rejects(
    () => parseCourses('not-a-system', {}, '测试大学', '2025-1'),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.code, 'UNSUPPORTED_SYSTEM');
      return true;
    }
  );
});

test('支持的系统类型转发解析请求', async () => {
  const calls = [];
  const fakeClient = { mark: 'fake' };
  // 动态替换 zhengfang 适配器，验证参数透传
  const zhengfang = require('../services/systems/zhengfang');
  const original = zhengfang.parseCourses;
  zhengfang.parseCourses = async (client, school, semester) => {
    calls.push({ client, school, semester });
    return [{ name: '高等数学' }];
  };
  try {
    const result = await parseCourses('zhengfang', fakeClient, '测试大学', '2025-1');
    assert.deepStrictEqual(result, [{ name: '高等数学' }]);
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0].client, fakeClient);
    assert.strictEqual(calls[0].school, '测试大学');
    assert.strictEqual(calls[0].semester, '2025-1');
  } finally {
    zhengfang.parseCourses = original;
  }
});
