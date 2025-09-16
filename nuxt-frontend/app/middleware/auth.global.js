import { getRouteAuthConfig } from '~/utils/routeConfig'

export default defineNuxtRouteMiddleware(async (to, from) => {
  // 跳过服务端渲染时的检查，避免在服务端执行客户端逻辑
  if (process.server) {
    return
  }
  
  const { $store, $api } = useNuxtApp()
  
  // 如果是登录页面，直接通过
  if (to.path === '/admin-login' || to.path === '/login' || to.path === '/business-login') {
    return
  }
  
  // 获取路由的认证配置
  const routeConfig = getRouteAuthConfig(to.path)
  const requiresAuth = to.meta?.requiresAuth ?? routeConfig.requiresAuth ?? true
  
  // 如果路由不需要认证，直接通过
  if (!requiresAuth) {
    return
  }
  
  // 确定登录页面路径
  let loginPath = '/login'
  if (to.path.startsWith('/admin') && to.path !== '/admin-login') {
    loginPath = '/admin-login'
  } else if (to.path.startsWith('/business') && to.path !== '/business-login') {
    loginPath = '/business-login'
  }
  
  // 如果状态未初始化，先尝试恢复登录状态
  if (!$store?.auth?.isLoggedIn && !$store?.auth?.isAdminLoggedIn && !$store?.auth?.isBusinessLoggedIn) {
    try {
      // 尝试从cookie恢复登录状态
      await $store?.auth.restoreLoginState()
    } catch (error) {
      console.log('恢复登录状态失败:', error)
    }
  }
  
  // 检查对应的登录状态
  const hasValidAuth = loginPath === '/login' ? $store?.auth?.isLoggedIn : 
                       (loginPath === '/admin-login' ? $store?.auth?.isAdminLoggedIn : $store?.auth?.isBusinessLoggedIn)
  
  if (!hasValidAuth) {
    return navigateTo({
      path: loginPath,
      query: { redirect: to.fullPath }
    })
  }
  
  try {
    // 验证token有效性
    await $api.post('/users/check-token')
  } catch (error) {
    // 检查是否为超时错误
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.message?.includes('Network Error')) {
      // 超时错误，跳转到首页
      console.warn('Token验证超时，跳转到首页')
      return navigateTo('/')
    }
    
    // token无效，清除前端状态并跳转到登录页
    $store?.auth.setUser(null)
    return navigateTo({
      path: loginPath,
      query: { redirect: to.fullPath }
    })
  }
})