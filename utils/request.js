// API 请求封装（uni-app 环境）
// BASE_URL 可通过创建项目根目录 config.js 覆盖: module.exports = { BASE_URL: 'https://...' }
// （参考根目录 config.example.js，复制为 config.js 后修改）
var BASE_URL = 'http://localhost:3000'
try {
  if (typeof require === 'function') {
    // eslint-disable-next-line node/no-missing-require
    var userConfig = require('../config.js')
    if (userConfig && userConfig.BASE_URL) BASE_URL = userConfig.BASE_URL
  }
} catch (e) {}

var TOKEN_KEY = 'campus_token'

function getToken() {
  try {
    return uni.getStorageSync(TOKEN_KEY) || ''
  } catch (e) {
    return ''
  }
}

function setToken(token) {
  try {
    uni.setStorageSync(TOKEN_KEY, token)
  } catch (e) {}
}

function removeToken() {
  try {
    uni.removeStorageSync(TOKEN_KEY)
  } catch (e) {}
}

// 请求拦截器列表
var requestInterceptors = []
// 响应拦截器列表
var responseInterceptors = []

function addRequestInterceptor(fn) {
  requestInterceptors.push(fn)
}

function addResponseInterceptor(fn) {
  responseInterceptors.push(fn)
}

var refreshTokenFn = null
function setRefreshToken(fn) {
  refreshTokenFn = fn
}

function request(options) {
  return new Promise(function (resolve, reject) {
    var token = getToken()

    var config = {
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      timeout: options.timeout || 15000,
      header: Object.assign(
        {
          'Content-Type': 'application/json'
        },
        token ? { Authorization: 'Bearer ' + token } : {},
        options.header || {}
      )
    }

    var chain = Promise.resolve(config)
    requestInterceptors.forEach(function (interceptor) {
      chain = chain.then(function (cfg) {
        return interceptor(cfg) || cfg
      })
    })

    chain
      .then(function (finalConfig) {
        uni.request({
          url: finalConfig.url,
          method: finalConfig.method,
          data: finalConfig.data,
          header: finalConfig.header,
          timeout: finalConfig.timeout || 15000,
          success: function (res) {
            handleResponse(res, resolve, reject)
          },
          fail: function (err) {
            reject({ error: { message: '网络连接失败', detail: err } })
          }
        })
      })
      .catch(reject)
  })
}

function handleResponse(res, resolve, reject) {
  var chain = Promise.resolve(res)
  responseInterceptors.forEach(function (interceptor) {
    chain = chain.then(function (response) {
      return new Promise(function (nextResolve, nextReject) {
        interceptor(response, nextResolve, nextReject)
      })
    })
  })

  chain
    .then(function (finalRes) {
      if (finalRes.statusCode >= 200 && finalRes.statusCode < 300) {
        resolve(finalRes.data)
      } else if (finalRes.statusCode === 401) {
        removeToken()
        if (refreshTokenFn) {
          refreshTokenFn().catch(function () {})
        }
        reject(finalRes.data || { error: { code: 401, message: '登录已过期，请重新登录' } })
      } else {
        reject(finalRes.data || { error: { message: '请求失败' } })
      }
    })
    .catch(reject)
}

// ============ API 模块 ============

var authApi = {
  login: function (data) {
    return request({ url: '/api/auth/login', method: 'POST', data: data })
  },
  register: function (data) {
    return request({ url: '/api/auth/register', method: 'POST', data: data })
  },
  me: function () {
    return request({ url: '/api/auth/me', method: 'GET' })
  },
  verify: function () {
    return request({ url: '/api/auth/verify', method: 'GET' })
  },
  changePassword: function (data) {
    return request({ url: '/api/auth/password', method: 'PUT', data: data })
  }
}

var studentApi = {
  courses: function () {
    return request({ url: '/api/student/courses', method: 'GET' })
  },
  todayCourses: function () {
    return request({ url: '/api/student/today-courses', method: 'GET' })
  },
  attendance: function () {
    return request({ url: '/api/student/attendance', method: 'GET' })
  },
  profile: function () {
    return request({ url: '/api/student/profile', method: 'GET' })
  },
  grades: function () {
    return request({ url: '/api/student/grades', method: 'GET' })
  }
}

var importApi = {
  preview: function (data) {
    return request({ url: '/api/import/preview', method: 'POST', data: data })
  },
  confirm: function (data) {
    return request({ url: '/api/import/confirm', method: 'POST', data: data })
  }
}

var homeworkApi = {
  fetch: function () {
    return request({ url: '/api/homework', method: 'GET' })
  }
}

var noticeApi = {
  list: function () {
    return request({ url: '/api/notices', method: 'GET' })
  }
}

var rankingApi = {
  list: function () {
    return request({ url: '/api/ranking', method: 'GET' })
  }
}

export default {
  request: request,
  addRequestInterceptor: addRequestInterceptor,
  addResponseInterceptor: addResponseInterceptor,
  setRefreshToken: setRefreshToken,
  getToken: getToken,
  setToken: setToken,
  removeToken: removeToken
}

export { authApi, studentApi, importApi, homeworkApi, noticeApi, rankingApi }
