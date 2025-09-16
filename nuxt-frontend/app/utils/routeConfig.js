// 路由认证配置 - 对应Vue项目中的路由meta配置
export const routeAuthConfig = {
  // 公开页面 - 不需要认证
  '/': { requiresAuth: false },
  '/About': { requiresAuth: false },
  '/Products': { requiresAuth: false },
  '/Product': { requiresAuth: false }, // 产品详情页
  '/Product/': { requiresAuth: false }, // 产品详情页动态路由
  '/News': { requiresAuth: false },
  '/News/': { requiresAuth: false }, // 新闻详情页
  '/Contact': { requiresAuth: false },
  '/Login': { requiresAuth: false },
  '/Register': { requiresAuth: false },
  '/UserAgreement': { requiresAuth: false },
  '/ForgotPassword': { requiresAuth: false },
  '/ResetPassword': { requiresAuth: false },
  '/Activate': { requiresAuth: false },
  '/paypal-test': { requiresAuth: false },
  
  // 需要认证的页面
  '/Cart': { requiresAuth: true },
  '/UserOrders': { requiresAuth: true },
  '/UserSettings': { requiresAuth: true },
  '/UnifiedCheckout': { requiresAuth: true },
  '/Inquiries': { requiresAuth: true },
  '/Address': { requiresAuth: true },
  '/BrowsingHistory': { requiresAuth: true },
  '/FavoritesManagement': { requiresAuth: true },
  '/OrderPayment': { requiresAuth: true },

}

// 获取路由的认证配置
export function getRouteAuthConfig(path) {
  // 精确匹配
  if (routeAuthConfig[path]) {
    return routeAuthConfig[path]
  }
  
  // 模糊匹配（用于动态路由）
  for (const [routePath, config] of Object.entries(routeAuthConfig)) {
    if (routePath.endsWith('/') && path.startsWith(routePath)) {
      return config
    }
    
    // 处理动态路由参数
    if (routePath.includes(':') || routePath.includes('*')) {
      const regex = routePath
        .replace(/:[^/]+/g, '[^/]+')  // :id -> [^/]+
        .replace(/\*/g, '.*')         // * -> .*
      
      if (new RegExp(`^${regex}$`).test(path)) {
        return config
      }
    }
  }
  
  // 默认需要认证
  return { requiresAuth: true }
}

// 检查路径是否匹配某个模式
export function matchesPattern(path, pattern) {
  if (pattern === path) return true
  
  // 处理通配符
  if (pattern.includes('*')) {
    const regex = pattern.replace(/\*/g, '.*')
    return new RegExp(`^${regex}$`).test(path)
  }
  
  // 处理动态参数
  if (pattern.includes(':')) {
    const regex = pattern.replace(/:[^/]+/g, '[^/]+')
    return new RegExp(`^${regex}$`).test(path)
  }
  
  return false
}