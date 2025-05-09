import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

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
    beforeEnter: (to, from, next) => {
      // 实际项目中会从store或localStorage中获取用户信息，检查是否有管理员权限
      const isAdmin = localStorage.getItem('isAdmin') === 'true'
      if (isAdmin) {
        next()
      } else {
        next('/login')
      }
    },
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
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router