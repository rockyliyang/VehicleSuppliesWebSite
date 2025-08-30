import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import store from '../store'
import api from '../utils/api'
import { createRetryableImport } from '../utils/chunkRetry'
import visitorTracker from '../utils/visitorTracker'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: false }
  },
  {
    path: '/products',
    name: 'Products',
    component: createRetryableImport(() => import('../views/Products.vue')),
    meta: { requiresAuth: false }
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: createRetryableImport(() => import('../views/ProductDetail.vue')),
    meta: { requiresAuth: false }
  },
  {
    path: '/about',
    name: 'About',
    component: createRetryableImport(() => import('../views/About.vue')),
    meta: { requiresAuth: false }
  },
  {
    path: '/news',
    name: 'News',
    component: createRetryableImport(() => import('../views/News.vue')),
    meta: { requiresAuth: false }
  },
  {
    path: '/news/:id',
    name: 'NewsDetail',
    component: createRetryableImport(() => import('../views/NewsDetail.vue')),
    meta: { requiresAuth: false }
  },
  {
    path: '/contact',
    name: 'Contact',
    component: createRetryableImport(() => import('../views/Contact.vue')),
    meta: { requiresAuth: false }
  },
  {
    path: '/business',
    name: 'BusinessDashboard',
    component: createRetryableImport(() => import('../views/admin/BusinessDashboard.vue')),
    meta: { requiresAuth: true, requiresRole: 'business' }
  },
  {
    path: '/admin',
    component: createRetryableImport(() => import('../views/Admin.vue')),
    meta: { requiresAuth: true },
    // 添加路由守卫，检查用户是否有管理员权限

    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: createRetryableImport(() => import('../views/admin/Dashboard.vue')),
        meta: { requiresAuth: true, requiresRole: 'admin' }
      },
      {
        path: 'products',
        name: 'AdminProducts',
        component: createRetryableImport(() => import('../views/admin/ProductsManagement.vue')),
        meta: { requiresAuth: true }
      },
      {
        path: 'categories',
        name: 'AdminCategories',
        component: createRetryableImport(() => import('../views/admin/Categories.vue')),
        meta: { requiresAuth: true }
      },
      {
        path: 'banners',
        name: 'AdminBanners',
        component: createRetryableImport(() => import('../views/admin/Banners.vue')),
        meta: { requiresAuth: true }
      },
      {
        path: 'company',
        name: 'AdminCompany',
        component: createRetryableImport(() => import('../views/admin/Company.vue')),
        meta: { requiresAuth: true }
      },
      {
        path: 'common-content',
        name: 'AdminCommonContent',
        component: createRetryableImport(() => import('../views/admin/CommonContent.vue')),
        meta: { requiresAuth: true }
      },
      {
        path: 'language',
        name: 'AdminLanguage',
        component: createRetryableImport(() => import('../views/admin/LanguageManagement.vue')),
        meta: { requiresAuth: true }
      },
      {
        path: 'contact-messages',
        name: 'AdminContactMessages',
        component: createRetryableImport(() => import('../views/admin/ContactMessages.vue')),
        meta: { requiresAuth: true }
      },
      {
        path: 'inquiries',
        name: 'AdminInquiries',
        component: createRetryableImport(() => import('../views/admin/InquiryManagement.vue')),
        meta: { requiresAuth: true }
      },
      {
        path: 'regular-users',
        name: 'AdminRegularUsers',
        component: createRetryableImport(() => import('../views/admin/RegularUserList.vue')),
        meta: { requiresAuth: true }
      },
      {
        path: 'sales-users',
        name: 'AdminSalesUsers',
        component: createRetryableImport(() => import('../views/admin/SalesUserList.vue')),
        meta: { requiresAuth: true }
      },
      {
        path: 'admin-users',
        name: 'AdminAdminUsers',
        component: createRetryableImport(() => import('../views/admin/AdminUserList.vue')),
        meta: { requiresAuth: true }
      },
      {
        path: 'business-groups',
        name: 'AdminBusinessGroups',
        component: createRetryableImport(() => import('../views/admin/BusinessGroups.vue')),
        meta: { requiresAuth: true }
      },
      {
        path: 'orders',
        name: 'AdminOrders',
        component: createRetryableImport(() => import('../views/admin/OrderManagement.vue')),
        meta: { requiresAuth: true }
      },
      {
        path: 'logistics-companies',
        name: 'AdminLogisticsCompanies',
        component: createRetryableImport(() => import('../views/admin/LogisticsCompanies.vue')),
        meta: { requiresAuth: true }
      },
      {
        path: 'countries',
        name: 'AdminCountries',
        component: createRetryableImport(() => import('../views/admin/CountryManagement.vue')),
        meta: { requiresAuth: true }
      },
      {
        path: 'visitor-logs',
        name: 'AdminVisitorLogs',
        component: createRetryableImport(() => import('../views/admin/VisitorLogs.vue')),
        meta: { requiresAuth: true }
      },
      {
        path: '',
        redirect: '/admin/dashboard',
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: createRetryableImport(() => import('../views/Login.vue')),
    meta: { requiresAuth: false }
  },
  {
    path: '/admin-login',
    name: 'AdminLogin',
    component: createRetryableImport(() => import('../views/admin/AdminLogin.vue')),
    meta: { requiresAuth: false }
  },
  {
    path: '/business-login',
    name: 'BusinessLogin',
    component: createRetryableImport(() => import('../views/admin/BusinessLogin.vue')),
    meta: { requiresAuth: false }
  },  
  {
    path: '/business-inquiries',
    name: 'BusinessInquiries',
    component: createRetryableImport(() => import('../views/admin/InquiryManagement.vue')),
    meta: { requiresAuth: true }
  },
  {
    path: '/business-orders',
    name: 'BusinessOrders',
    component: createRetryableImport(() => import('../views/admin/OrderManagement.vue')),
    meta: { requiresAuth: true }
  },  
  {
    path: '/cart',
    name: 'Cart',
    component: createRetryableImport(() => import('../views/Cart.vue')),
    meta: { requiresAuth: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: createRetryableImport(() => import('../views/Register.vue')),
    meta: { requiresAuth: false }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: createRetryableImport(() => import('../views/ForgotPassword.vue')),
    meta: { requiresAuth: false  }
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: createRetryableImport(() => import('../views/ResetPassword.vue')),
    meta: { requiresAuth: false }
  },
  {
    path: '/activate',
    name: 'Activate',
    component: createRetryableImport(() => import('../views/Activate.vue')),
    meta: { requiresAuth: false }
  },
  // CheckoutComplete路由已删除 - 组件不再使用
  {
    path: '/paypal-test',
    name: 'PayPalTest',
    component: createRetryableImport(() => import('../views/PayPalTestView.vue'))
  },
  {
    path: '/user/orders',
    name: 'UserOrders',
    component: createRetryableImport(() => import('../views/UserOrders.vue')),
    meta: { requiresAuth: true }
  },
  {
    path: '/user/settings',
    name: 'UserSettings',
    component: createRetryableImport(() => import('../views/UserSettings.vue')),
    meta: { requiresAuth: true }
  },
  {
    path: '/unified-checkout',
    name: 'UnifiedCheckout',
    component: createRetryableImport(() => import('../views/UnifiedCheckout.vue')),
    meta: { requiresAuth: true }
  },
  {
    path: '/inquiry-management',
    name: 'InquiryManagement',
    component: createRetryableImport(() => import('../views/Inquiries.vue')),
    meta: { requiresAuth: true }
  },
  {
    path: '/address',
    name: 'AddressList',
    component: createRetryableImport(() => import('../views/AddressList.vue')),
    meta: { requiresAuth: true }
  },
  {
    path: '/browsing-history',
    name: 'BrowsingHistory',
    component: createRetryableImport(() => import('../views/BrowsingHistory.vue')),
    meta: { requiresAuth: true }
  },
  {
    path: '/favorites',
    name: 'FavoritesManagement',
    component: createRetryableImport(() => import('../views/FavoritesManagement.vue')),
    meta: { requiresAuth: true }
  },
  {
    path: '/order-payment/:orderId',
    name: 'OrderPayment',
    component: createRetryableImport(() => import('../views/OrderPayment.vue')),
    meta: { requiresAuth: true }
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 如果有保存的位置（比如浏览器前进后退），则恢复到保存的位置
    if (savedPosition) {
      return savedPosition
    }
    // 否则滚动到页面顶部
    return { top: 0 }
  }
})

// 全局路由守卫 - 在每次路由跳转前验证token
router.beforeEach(async (to, from, next) => {
  const authRequired = to.meta.requiresAuth ?? true

  if (to.path === '/admin-login' || to.path === '/login' || to.path === '/business-login') {
    // 如果是登录页，直接通过
    return next()
  }

  let loginPath = '/login'
  if (to.path.startsWith('/admin') && to.path !== '/admin-login') {
    loginPath = '/admin-login'
  }
  else if (to.path.startsWith('/business') && to.path !== '/business-login') {
    loginPath = '/business-login'
  }

  if (authRequired) {
    // 如果状态未初始化，先尝试恢复登录状态

    
    if (!store.state.isLoggedIn || !store.state.isAdminLoggedIn || !store.state.isBusinessLoggedIn) {
      try {
        // 尝试从cookie恢复登录状态
        await store.dispatch('restoreLoginState')

      } catch (error) {
        console.log('恢复登录状态失败:', error)
      }
    }

    // 检查对应的登录状态
    const hasValidAuth = loginPath === '/login' ? store.state.isLoggedIn : 
                         (loginPath === '/admin-login' ? store.state.isAdminLoggedIn:store.state.isBusinessLoggedIn)

    if (!hasValidAuth) {
      return next({
        path: loginPath,
        query: { redirect: to.fullPath }
      })
    }

    try {
      // 验证token有效性
      await api.post('/users/check-token')
    } catch (error) {
      // 检查是否为超时错误
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.message?.includes('Network Error')) {
        // 超时错误，跳转到首页
        console.warn('Token验证超时，跳转到首页')
        return next('/')
      }
      
      // token无效，清除前端状态并跳转到登录页
      store.commit('setUser', null)
      return next({
        path: loginPath,
        query: { redirect: to.fullPath }
      })
    }
  }
  
  next()
})

// 路由后置守卫 - 记录页面访问
router.afterEach(async (to) => {
  try {
    // 只在首次进入网站时记录（不是页面内跳转）
    await visitorTracker.trackSiteEntry(to)
    
    // 如果用户已登录，更新访问记录中的用户信息
    if (store.state.user && store.state.user.id) {
      await visitorTracker.updateVisitorInfo({
        userId: store.state.user.id
      })
    }
  } catch (error) {
    console.warn('Failed to track site entry:', error)
  }
})

export default router