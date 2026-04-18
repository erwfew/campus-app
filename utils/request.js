// API 请求封装（uni-app 环境）
var BASE_URL = 'http://192.168.31.98:3000'

// 请求拦截器列表
var requestInterceptors = []
// 响应拦截器列表
var responseInterceptors = []

/**
 * 注册请求拦截器
 * @param {Function} fn - 接收 config 对象，返回修改后的 config 或 Promise
 */
function addRequestInterceptor(fn) {
	requestInterceptors.push(fn)
}

/**
 * 注册响应拦截器
 * @param {Function} fn - 接收 (response, resolve, reject)，调用 resolve/reject 继续链
 */
function addResponseInterceptor(fn) {
	responseInterceptors.push(fn)
}

/**
 * 刷新 token（示例，实际接入后端时实现）
 */
var refreshTokenFn = null
function setRefreshToken(fn) {
	refreshTokenFn = fn
}

function request(options) {
	return new Promise(function(resolve, reject) {
		var config = {
			url: BASE_URL + options.url,
			method: options.method || 'GET',
			data: options.data || {},
			header: Object.assign({
				'Content-Type': 'application/json'
			}, options.header || {})
		}

		// 执行请求拦截器
		var chain = Promise.resolve(config)
		requestInterceptors.forEach(function(interceptor) {
			chain = chain.then(function(cfg) {
				return interceptor(cfg) || cfg
			})
		})

		chain.then(function(finalConfig) {
			uni.request({
				url: finalConfig.url,
				method: finalConfig.method,
				data: finalConfig.data,
				header: finalConfig.header,
				success: function(res) {
					handleResponse(res, resolve, reject)
				},
				fail: function(err) {
					reject({ error: { message: '网络连接失败', detail: err } })
				}
			})
		}).catch(reject)
	})
}

function handleResponse(res, resolve, reject) {
	// 执行响应拦截器
	var chain = Promise.resolve(res)
	responseInterceptors.forEach(function(interceptor) {
		chain = chain.then(function(response) {
			return new Promise(function(nextResolve, nextReject) {
				interceptor(response, nextResolve, nextReject)
			})
		})
	})

	chain.then(function(finalRes) {
		if (finalRes.statusCode >= 200 && finalRes.statusCode < 300) {
			resolve(finalRes.data)
		} else {
			reject(finalRes.data || { error: { message: '请求失败' } })
		}
	}).catch(reject)
}

// ============ 内置拦截器 ============

// 401 自动刷新 token（示例）
addResponseInterceptor(function(res, resolve, reject) {
	if (res.statusCode === 401 && refreshTokenFn) {
		refreshTokenFn().then(function() {
			// token 刷新成功，重新发起请求（简化处理：直接 reject 让调用方重试）
			reject({ error: { code: 401, message: 'token已刷新，请重试' } })
		}).catch(function() {
			resolve(res)
		})
	} else {
		resolve(res)
	}
})

// ============ API 模块 ============

var importApi = {
	preview: function(data) {
		return request({
			url: '/api/import/preview',
			method: 'POST',
			data: data
		})
	},
	confirm: function(data) {
		return request({
			url: '/api/import/confirm',
			method: 'POST',
			data: data
		})
	}
}

var homeworkApi = {
	fetch: function() {
		return request({
			url: '/api/homework',
			method: 'GET'
		})
	}
}

export default {
	request: request,
	addRequestInterceptor: addRequestInterceptor,
	addResponseInterceptor: addResponseInterceptor,
	setRefreshToken: setRefreshToken
}
export { importApi, homeworkApi }
