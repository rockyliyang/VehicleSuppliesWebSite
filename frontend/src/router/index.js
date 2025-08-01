import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import store from '../store'
import api from '../utils/api'

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
    component: () => import('../views/Products.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: () => import('../views/ProductDetail.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/news',
    name: 'News',
    component: () => import('../views/News.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/news/:id',
    name: 'NewsDetail',
    component: () => import('../views/NewsDetail.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import('../views/Contact.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/admin',
    component: () => import('../views/Admin.vue'),
    meta: { requiresAuth: true },
    // 添加路由守卫，检查用户是否有管理员权限

    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('../views/admin/Dashboard.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'products',
        name: 'AdminProducts',
        component: () => import('../views/admin/ProductsManagement.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'categories',
        name: 'AdminCategories',
        component: () => import('../views/admin/Categories.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'banners',
        name: 'AdminBanners',
        component: () => import('../views/admin/Banners.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'company',
        name: 'AdminCompany',
        component: () => import('../views/admin/Company.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'common-content',
        name: 'AdminCommonContent',
        component: () => import('../views/admin/CommonContent.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'language',
        name: 'AdminLanguage',
        component: () => import('../views/admin/LanguageManagement.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'contact-messages',
        name: 'AdminContactMessages',
        component: () => import('../views/admin/ContactMessages.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'inquiries',
        name: 'AdminInquiries',
        component: () => import('../views/admin/InquiryManagement.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'regular-users',
        name: 'AdminRegularUsers',
        component: () => import('../views/admin/RegularUserList.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'sales-users',
        name: 'AdminSalesUsers',
        component: () => import('../views/admin/SalesUserList.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'admin-users',
        name: 'AdminAdminUsers',
        component: () => import('../views/admin/AdminUserList.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'business-groups',
        name: 'AdminBusinessGroups',
        component: () => import('../views/admin/BusinessGroups.vue'),
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
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/admin-login',
    name: 'AdminLogin',
    component: () => import('../views/admin/AdminLogin.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('../views/Cart.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/ForgotPassword.vue'),
    meta: { requiresAuth: false  }
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('../views/ResetPassword.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/activate',
    name: 'Activate',
    component: () => import('../views/Activate.vue'),
    meta: { requiresAuth: false }
  },
  // CheckoutComplete路由已删除 - 组件不再使用
  {
    path: '/paypal-test',
    name: 'PayPalTest',
    component: () => import('../views/PayPalTestView.vue')
  },
  {
    path: '/user/orders',
    name: 'UserOrders',
    component: () => import('../views/UserOrders.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/user/settings',
    name: 'UserSettings',
    component: () => import('../views/UserSettings.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/unified-checkout',
    name: 'UnifiedCheckout',
    component: () => import('../views/UnifiedCheckout.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/inquiry-management',
    name: 'InquiryManagement',
    component: () => import('../views/InquiryManagement.vue'),
    meta: { requiresAuth: true }
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 全局路由守卫 - 在每次路由跳转前验证token
router.beforeEach(async (to, from, next) => {
  // 不需要验证token的路由
  //const publicPages = ['/login', '/register', '/admin-login', '/activate', '/products', '/product', '/about', '/news', '/contact', '/paypal-test', '/forgot-password', '/reset-password']
  //const authRequired = (to.path != '/') && (!publicPages.some(path => to.path.startsWith(path)) || to.path.startsWith('/admin'))
  const authRequired =  to.meta.requiresAuth ?? true

  
  if (to.path === '/admin-login' || to.path === '/login') {
    // 如果是管理员登录页，清除普通用户token
    return next()
  }

  let loginPath = '/login'
  if (to.path.startsWith('/admin') && to.path !== '/admin-login') {
      loginPath = '/admin-login'
  }

  if (authRequired) {
    let isLoggedIn = store.state.isLoggedIn
    if (loginPath === '/admin-login') {
        isLoggedIn = store.state.isAdminLoggedIn
    }

    if (!isLoggedIn) {
      return next({
        path: loginPath,
        query: { redirect: to.fullPath }
      })
    }

    try {
      // 验证管理员token
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

export default router