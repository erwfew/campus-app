const memoryCache = new Map()

function cacheMiddleware(ttlMs = 60000) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next()
    const key = req.originalUrl
    const cached = memoryCache.get(key)
    if (cached && Date.now() - cached.time < ttlMs) {
      res.setHeader('X-Cache', 'HIT')
      return res.json(cached.data)
    }
    const originalJson = res.json.bind(res)
    res.json = (data) => {
      memoryCache.set(key, { data, time: Date.now() })
      res.setHeader('X-Cache', 'MISS')
      return originalJson(data)
    }
    next()
  }
}

// 定期清理过期缓存
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of memoryCache) {
    if (now - val.time > 300000) memoryCache.delete(key)
  }
}, 60000)

module.exports = { cacheMiddleware }
