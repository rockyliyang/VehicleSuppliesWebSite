export default defineNuxtRouteMiddleware((to, from) => {
  // 跳过服务端渲染时的检查
  if (process.server) {
    return
  }
  
  // 定义需要自定义head的页面路径模式
  const customHeadPages = [
    '/product/',  // 产品详情页
    '/NewsDetail' // 新闻详情页
  ]
  
  // 检查当前页面是否需要自定义head
  const currentPageHasCustomHead = customHeadPages.some(pattern => 
    to.path.startsWith(pattern) || to.path === pattern
  )
  
  // 检查来源页面是否有自定义head
  const fromPageHadCustomHead = from && customHeadPages.some(pattern => 
    from.path.startsWith(pattern) || from.path === pattern
  )
  
  // 如果从有自定义head的页面切换到没有自定义head的页面，重置head
  if (fromPageHadCustomHead && !currentPageHasCustomHead) {
    console.log('Head reset triggered: from', from.path, 'to', to.path)
    
    // 重置为默认的head配置
    useHead({
      title: 'Auto Ease TechX',
      meta: [
        { key: 'description', name: 'description', content: 'A professional supplier of automotive products, offering high-quality automotive parts and accessories' },
        { name: 'keywords', content: 'automotive products, automotive parts, automotive supplier' }
      ]
    })
  }
})