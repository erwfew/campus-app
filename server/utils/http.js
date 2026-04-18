const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const iconv = require('iconv-lite');
const config = require('../config');

/**
 * 创建带 cookie jar 支持的 axios 实例
 * 自动处理 GBK/GB2312 编码解码
 */
function createClient(baseURL) {
  const jar = new CookieJar();
  const client = wrapper(axios.create({
    baseURL,
    jar,
    timeout: config.requestTimeout,
    maxRedirects: config.maxRedirects,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    },
    responseType: 'arraybuffer'
  }));

  // 响应拦截器：自动解码 GBK/GB2312 → UTF-8，二进制响应保持原样
  client.interceptors.response.use(response => {
    const contentType = (response.headers['content-type'] || '').toLowerCase();
    const buf = Buffer.from(response.data);

    // 二进制内容（图片、文件等）不处理
    if (contentType.includes('image') || contentType.includes('octet-stream') ||
        contentType.includes('pdf') || contentType.includes('zip')) {
      response.data = buf;
      return response;
    }

    if (contentType.includes('gbk') || contentType.includes('gb2312')) {
      response.data = iconv.decode(buf, 'gbk');
    } else if (contentType.includes('json')) {
      // JSON 响应直接解析
      try {
        response.data = JSON.parse(buf.toString('utf-8'));
      } catch (e) {
        response.data = buf.toString('utf-8');
      }
    } else {
      response.data = buf.toString('utf-8');
    }
    return response;
  });

  return client;
}

module.exports = { createClient };
