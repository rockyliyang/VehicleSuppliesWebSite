import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import store from '../store'
import api from '../utils/api'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/products',
    name: 'Products',
    component: () => import('../views/Products.vue')
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: () => import('../views/ProductDetail.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue')
  },
  {
    path: '/news',
    name: 'News',
    component: () => import('../views/News.vue')
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import('../views/Contact.vue')
  },
  {
    path: '/admin',
    component: () => import('../views/Admin.vue'),
    // 添加路由守卫，检查用户是否有管理员权限

    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('../views/admin/Dashboard.vue')
      },
      {
        path: 'products',
        name: 'AdminProducts',
        component: () => import('../views/admin/Products.vue')
      },
      {
        path: 'categories',
        name: 'AdminCategories',
        component: () => import('../views/admin/Categories.vue')
      },
      {
        path: 'banners',
        name: 'AdminBanners',
        component: () => import('../views/admin/Banners.vue')
      },
      {
        path: 'company',
        name: 'AdminCompany',
        component: () => import('../views/admin/Company.vue')
      },
      {
        path: 'language',
        name: 'AdminLanguage',
        component: () => import('../views/admin/LanguageManagement.vue')
      },
      {
        path: '',
        redirect: '/admin/dashboard'
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/admin-login',
    name: 'AdminLogin',
    component: () => import('../views/admin/AdminLogin.vue')
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
    component: () => import('../views/Register.vue')
  },
  {
    path: '/activate',
    name: 'Activate',
    component: () => import('../views/Activate.vue')
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: () => import('../views/Checkout.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/checkout2',
    name: 'Checkout2',
    component: () => import('../views/CheckoutV2.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/checkout-complete',
    name: 'CheckoutComplete',
    component: () => import('../views/CheckoutComplete.vue'),
    // 不需要验证，因为是从PayPal回调
    meta: { requiresAuth: false }
  },
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
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 全局路由守卫 - 在每次路由跳转前验证token
router.beforeEach(async (to, from, next) => {
  // 不需要验证token的路由
  const publicPages = ['/login', '/register', '/admin-login', '/activate', '/products', '/product', '/about', '/news', '/contact', '/paypal-test', '/checkout-complete']
  const authRequired = (to.path != '/') && (!publicPages.some(path => to.path.startsWith(path)) || to.path.startsWith('/admin'))

  
  if (to.path === '/admin-login' || to.path === '/login') {
    // 如果是管理员登录页，清除普通用户token
    return next()
  }
  // 如果是管理员路由，检查管理员token
  if (to.path.startsWith('/admin') && to.path !== '/admin-login') {
    const adminToken = localStorage.getItem('admin_token')
    if (!adminToken) {
      return next({
        path: '/admin-login',
        query: { redirect: to.fullPath }
      })
    }
    
    try {
      // 验证管理员token
      await api.get('/users/check-token')
    } catch (error) {
      // token无效，清除并跳转到登录页
      localStorage.removeItem('admin_token')
      store.commit('setUser', null)
      return next({
        path: '/admin-login',
        query: { redirect: to.fullPath }
      })
    }
  }
  
  // 如果需要验证普通用户token
  else if (authRequired) {
    const isLoggedIn = store.state.isLoggedIn
    if (!isLoggedIn) {
      return next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }
    
    try {
      // 验证用户token
      await api.get('/users/check-token')
    } catch (error) {
      // token无效，清除并跳转到登录页
      store.commit('setUser', null)
      return next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }
  }
  
  next()
})

export default router