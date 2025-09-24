import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin(() => {
  // 客户端性能优化 - FCP优化
  if (process.client) {
    // 预加载关键资源 - 根据Google FCP优化建议
    const preloadCriticalResources = () => {
      // 从store获取实际的banner图片，而不是硬编码的默认图片
      try {
        const { $store } = useNuxtApp()
        const banners = $store?.company?.banners || []
        
        // 只预加载第一个banner图片（LCP候选）
        const firstBanner = banners.length > 0 ? banners[0]?.image_url : null
        
        if (firstBanner) {
          const link = document.createElement('link')
          link.rel = 'preload'
          link.as = 'image'
          link.href = firstBanner
          link.fetchpriority = 'high' // 高优先级加载
          document.head.appendChild(link)
        }
        
        // 预加载关键CSS（如果还未加载）
        const criticalCSS = document.querySelector('link[href*="critical.css"]')
        if (!criticalCSS) {
          const cssLink = document.createElement('link')
          cssLink.rel = 'preload'
          cssLink.as = 'style'
          cssLink.href = '/_nuxt/assets/styles/critical.css'
          cssLink.onload = function() {
            this.rel = 'stylesheet'
          }
          document.head.appendChild(cssLink)
        }
        
      } catch (error) {
        console.warn('预加载关键资源失败:', error)
      }
    }
    
    // FCP优化 - 立即显示内容
    const optimizeFCP = () => {
      // 移除阻塞渲染的元素
      const belowFoldElements = document.querySelectorAll('.below-fold')
      belowFoldElements.forEach(el => {
        el.classList.add('loaded')
      })
      
      // 优化字体显示
      document.body.classList.remove('font-loading')
    }
    
    // 延迟执行非关键操作
    const deferNonCriticalOperations = () => {
      // 延迟加载非关键CSS
      setTimeout(() => {
        const nonCriticalCSS = [
          // 可以在这里添加非关键CSS
        ]
        
        nonCriticalCSS.forEach(href => {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = href
          link.media = 'print'
          link.onload = function() {
            this.media = 'all'
          }
          document.head.appendChild(link)
        })
      }, 100)
    }
    
    // DOMContentLoaded时立即执行FCP优化
    document.addEventListener('DOMContentLoaded', () => {
      optimizeFCP()
      preloadCriticalResources()
    })
    
    // 页面加载完成后执行非关键优化
    window.addEventListener('load', () => {
      deferNonCriticalOperations()
    })
    
    // 优化图片懒加载
    const optimizeImageLoading = () => {
      if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target
              if (img.dataset.src) {
                img.src = img.dataset.src
                img.removeAttribute('data-src')
                observer.unobserve(img)
              }
            }
          })
        })
        
        // 观察所有带有data-src属性的图片
        document.querySelectorAll('img[data-src]').forEach(img => {
          imageObserver.observe(img)
        })
      }
    }
    
    // DOM内容加载完成后执行
    document.addEventListener('DOMContentLoaded', optimizeImageLoading)
  }
})