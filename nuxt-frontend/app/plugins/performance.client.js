import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin(() => {
  // 客户端性能优化
  if (process.client) {
    // 预加载关键资源
    const preloadCriticalResources = () => {
      const criticalImages = [
        '/images/banner1.jpg',
        '/images/banner2.jpg',
        '/images/banner3.jpg'
      ]
      
      criticalImages.forEach(src => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'image'
        link.href = src
        document.head.appendChild(link)
      })
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
    
    // 页面加载完成后执行优化
    window.addEventListener('load', () => {
      preloadCriticalResources()
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