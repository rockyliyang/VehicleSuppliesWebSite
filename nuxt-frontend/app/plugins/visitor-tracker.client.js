import { defineNuxtPlugin } from '#app'
import visitorTracker from '~/utils/visitorTracker.js'

export default defineNuxtPlugin((nuxtApp) => {
  // 只在客户端运行
  if (process.client) {
    const router = useRouter()
    
    // 监听路由变化，实现类似Vue Router afterEach的功能
    router.afterEach((to, from) => {
      // 如果是首次访问（from为undefined或空），记录网站进入
      if (!from || from.name === undefined) {
        // 延迟执行，确保页面已完全加载
        nextTick(() => {
          visitorTracker.trackSiteEntry(to)
        })
      }
      
      // 如果是页面间跳转，可以在这里添加页面访问记录逻辑
      // 例如记录页面浏览量等
      if (from && from.name) {
        // 页面跳转时的访问记录逻辑
        console.log(`Page navigation: ${from.fullPath} -> ${to.fullPath}`)
      }
    })
    
    // 将visitorTracker实例提供给全局使用
    nuxtApp.provide('visitorTracker', visitorTracker)
  }
})