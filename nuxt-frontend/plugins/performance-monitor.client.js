// 性能监控插件 - 测量FCP和其他核心Web指标
export default defineNuxtPlugin(() => {
  // 只在客户端运行
  if (process.server) return

  // 性能监控配置
  const config = {
    enableLogging: process.env.NODE_ENV === 'development',
    enableReporting: process.env.NODE_ENV === 'production',
    reportEndpoint: '/api/performance' // 可选的性能数据上报端点
  }

  // 性能指标收集器
  class PerformanceMonitor {
    constructor() {
      this.metrics = {}
      this.observers = []
      this.init()
    }

    init() {
      // 监听页面加载完成
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.measureInitialMetrics())
      } else {
        this.measureInitialMetrics()
      }

      // 监听页面完全加载
      window.addEventListener('load', () => this.measureLoadMetrics())

      // 设置性能观察器
      this.setupPerformanceObservers()
    }

    measureInitialMetrics() {
      // 测量FCP (First Contentful Paint)
      this.measureFCP()
      
      // 测量TTFB (Time to First Byte)
      this.measureTTFB()
      
      // 测量DOM加载时间
      this.measureDOMContentLoaded()
    }

    measureLoadMetrics() {
      // 测量完整页面加载时间
      this.measurePageLoad()
      
      // 测量资源加载时间
      this.measureResourceTiming()
    }

    measureFCP() {
      try {
        const paintEntries = performance.getEntriesByType('paint')
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
        
        if (fcpEntry) {
          this.metrics.fcp = Math.round(fcpEntry.startTime)
          this.logMetric('FCP', this.metrics.fcp, 'ms')
          
          // FCP性能评估
          this.evaluateFCP(this.metrics.fcp)
        }
      } catch (error) {
        console.warn('Failed to measure FCP:', error)
      }
    }

    measureTTFB() {
      try {
        const navigationEntry = performance.getEntriesByType('navigation')[0]
        if (navigationEntry) {
          this.metrics.ttfb = Math.round(navigationEntry.responseStart - navigationEntry.requestStart)
          this.logMetric('TTFB', this.metrics.ttfb, 'ms')
        }
      } catch (error) {
        console.warn('Failed to measure TTFB:', error)
      }
    }

    measureDOMContentLoaded() {
      try {
        const navigationEntry = performance.getEntriesByType('navigation')[0]
        if (navigationEntry) {
          this.metrics.domContentLoaded = Math.round(navigationEntry.domContentLoadedEventEnd - navigationEntry.navigationStart)
          this.logMetric('DOM Content Loaded', this.metrics.domContentLoaded, 'ms')
        }
      } catch (error) {
        console.warn('Failed to measure DOM Content Loaded:', error)
      }
    }

    measurePageLoad() {
      try {
        const navigationEntry = performance.getEntriesByType('navigation')[0]
        if (navigationEntry) {
          this.metrics.pageLoad = Math.round(navigationEntry.loadEventEnd - navigationEntry.navigationStart)
          this.logMetric('Page Load', this.metrics.pageLoad, 'ms')
        }
      } catch (error) {
        console.warn('Failed to measure Page Load:', error)
      }
    }

    measureResourceTiming() {
      try {
        const resourceEntries = performance.getEntriesByType('resource')
        const criticalResources = resourceEntries.filter(entry => 
          entry.name.includes('.css') || 
          entry.name.includes('.js') || 
          entry.name.includes('font')
        )

        this.metrics.resourceCount = resourceEntries.length
        this.metrics.criticalResourceCount = criticalResources.length
        
        // 计算关键资源平均加载时间
        if (criticalResources.length > 0) {
          const avgLoadTime = criticalResources.reduce((sum, entry) => 
            sum + (entry.responseEnd - entry.requestStart), 0) / criticalResources.length
          this.metrics.avgCriticalResourceTime = Math.round(avgLoadTime)
          this.logMetric('Avg Critical Resource Time', this.metrics.avgCriticalResourceTime, 'ms')
        }
      } catch (error) {
        console.warn('Failed to measure Resource Timing:', error)
      }
    }

    setupPerformanceObservers() {
      // 观察LCP (Largest Contentful Paint)
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries()
            const lastEntry = entries[entries.length - 1]
            this.metrics.lcp = Math.round(lastEntry.startTime)
            this.logMetric('LCP', this.metrics.lcp, 'ms')
          })
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
          this.observers.push(lcpObserver)
        } catch (error) {
          console.warn('LCP observer not supported:', error)
        }

        // 观察CLS (Cumulative Layout Shift)
        try {
          const clsObserver = new PerformanceObserver((entryList) => {
            let clsValue = 0
            for (const entry of entryList.getEntries()) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value
              }
            }
            this.metrics.cls = Math.round(clsValue * 1000) / 1000
            this.logMetric('CLS', this.metrics.cls, '')
          })
          clsObserver.observe({ entryTypes: ['layout-shift'] })
          this.observers.push(clsObserver)
        } catch (error) {
          console.warn('CLS observer not supported:', error)
        }
      }
    }

    evaluateFCP(fcpTime) {
      let rating = 'good'
      let message = ''
      
      if (fcpTime <= 1800) {
        rating = 'good'
        message = 'FCP性能优秀！'
      } else if (fcpTime <= 3000) {
        rating = 'needs-improvement'
        message = 'FCP性能需要改进'
      } else {
        rating = 'poor'
        message = 'FCP性能较差，需要优化'
      }

      this.metrics.fcpRating = rating
      
      if (config.enableLogging) {
        console.log(`%c${message}`, `color: ${rating === 'good' ? 'green' : rating === 'needs-improvement' ? 'orange' : 'red'}`)
        
        if (rating !== 'good') {
          console.log('FCP优化建议:')
          console.log('- 内联关键CSS')
          console.log('- 优化字体加载')
          console.log('- 减少阻塞渲染的资源')
          console.log('- 使用资源预加载')
        }
      }
    }

    logMetric(name, value, unit) {
      if (config.enableLogging) {
        console.log(`📊 ${name}: ${value}${unit}`)
      }
    }

    // 获取所有性能指标
    getMetrics() {
      return { ...this.metrics }
    }

    // 上报性能数据（可选）
    async reportMetrics() {
      if (!config.enableReporting || !config.reportEndpoint) return

      try {
        await fetch(config.reportEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            metrics: this.metrics
          })
        })
      } catch (error) {
        console.warn('Failed to report performance metrics:', error)
      }
    }

    // 清理观察器
    cleanup() {
      this.observers.forEach(observer => observer.disconnect())
      this.observers = []
    }
  }

  // 创建性能监控实例
  const monitor = new PerformanceMonitor()

  // 页面卸载时上报数据
  window.addEventListener('beforeunload', () => {
    monitor.reportMetrics()
    monitor.cleanup()
  })

  // 将监控器暴露给全局，方便调试
  if (config.enableLogging) {
    window.__performanceMonitor = monitor
    console.log('🚀 性能监控已启用，使用 window.__performanceMonitor.getMetrics() 查看指标')
  }

  // 提供给Nuxt应用使用
  return {
    provide: {
      performanceMonitor: monitor
    }
  }
})