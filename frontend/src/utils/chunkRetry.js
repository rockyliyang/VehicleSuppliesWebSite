/**
 * Chunk 加载重试工具
 * 用于处理动态导入失败的情况
 */

/**
 * 带重试机制的动态导入函数
 * @param {Function} importFn - 动态导入函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} delay - 重试延迟时间（毫秒）
 * @returns {Promise} - 返回导入的模块
 */
export function importWithRetry(importFn, maxRetries = 3, delay = 1000) {
  return new Promise((resolve, reject) => {
    let retryCount = 0
    
    const attemptImport = () => {
      importFn()
        .then(resolve)
        .catch((error) => {
          // 检查是否是 chunk 加载错误
          const isChunkError = error.message && (
            error.message.includes('Loading chunk') ||
            error.message.includes('ChunkLoadError') ||
            error.message.includes('Loading CSS chunk')
          )
          
          if (isChunkError && retryCount < maxRetries) {
            retryCount++
            console.warn(`Chunk loading failed, retrying (${retryCount}/${maxRetries})...`, error.message)
            
            // 延迟后重试
            setTimeout(attemptImport, delay * retryCount)
          } else if (isChunkError && retryCount >= maxRetries) {
            // 重试次数用完，刷新页面
            console.error('Chunk loading failed after maximum retries, reloading page...', error.message)
            window.location.reload()
          } else {
            // 非 chunk 错误，直接抛出
            reject(error)
          }
        })
    }
    
    attemptImport()
  })
}

/**
 * 创建带重试机制的路由组件导入函数
 * @param {Function} importFn - 动态导入函数
 * @returns {Function} - 返回包装后的导入函数
 */
export function createRetryableImport(importFn) {
  return () => importWithRetry(importFn)
}

/**
 * 预加载关键 chunks
 * @param {Array} importFunctions - 导入函数数组
 */
export function preloadChunks(importFunctions) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      importFunctions.forEach(importFn => {
        importFn().catch(() => {
          // 预加载失败时静默处理
          console.warn('Chunk preload failed, will retry on demand')
        })
      })
    })
  }
}

/**
 * 检查浏览器是否支持 Service Worker 缓存
 * @returns {boolean}
 */
export function supportsCaching() {
  return 'serviceWorker' in navigator && 'caches' in window
}

/**
 * 清除过期的缓存
 */
export async function clearStaleCache() {
  if (!supportsCaching()) return
  
  try {
    const cacheNames = await caches.keys()
    const stalePromises = cacheNames.map(async (cacheName) => {
      if (cacheName.includes('webpack') || cacheName.includes('chunk')) {
        console.log('Clearing stale cache:', cacheName)
        return caches.delete(cacheName)
      }
    })
    
    await Promise.all(stalePromises)
  } catch (error) {
    console.warn('Failed to clear stale cache:', error)
  }
}