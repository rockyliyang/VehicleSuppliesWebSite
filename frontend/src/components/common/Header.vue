<template>
  <header class="bg-white shadow-md">
    <div class="container">
      <!-- Logo -->
      <div class="logo">
        <router-link to="/">
          <img :src="companyInfo.logo_url || logoImage" :alt="companyInfo.company_name || 'AUTO EASE EXPERT CO., LTD'"
            @error="handleImageError" />
        </router-link>
      </div>
      <!-- Navigation -->
      <nav class="main-nav">
        <router-link to="/" exact-active-class="nav-active">{{$t('home')}}</router-link>
        <router-link to="/about" active-class="nav-active">{{$t('about')}}</router-link>
        <router-link to="/products" active-class="nav-active">{{$t('products')}}</router-link>
        <router-link to="/news" active-class="nav-active">{{$t('news')}}</router-link>
        <router-link to="/contact" active-class="nav-active">{{$t('contact')}}</router-link>
      </nav>
      <!-- Actions -->
      <div class="user-actions">
        <!-- Language Switcher -->
        <LanguageSwitcher />
        <!-- Cart Button -->
        <el-button link @click="handleCartClick" class="action-btn cart-button">
          <el-icon :size="22">
            <ShoppingCartFull />
          </el-icon>
          <span v-if="cartCount > 0" class="cart-count">{{ cartCount }}</span>
        </el-button>
        <!-- User Dropdown -->
        <el-dropdown trigger="hover" @command="handleUserMenu">
          <span class="action-btn user-btn">
            <el-icon :size="22">
              <User />
            </el-icon>
            <i class="el-icon-arrow-down"></i>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-if="isLoggedIn" command="orders">{{ $t('orders') }}</el-dropdown-item>
              <el-dropdown-item v-if="isLoggedIn" command="logout">{{ $t('logout') }}</el-dropdown-item>
              <el-dropdown-item v-if="!isLoggedIn" command="login">{{ $t('login') }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    <!-- 登录对话框 -->
    <el-dialog title="用户登录" v-model="loginDialogVisible" width="400px" center class="login-dialog">
      <el-form :model="loginForm" :rules="loginRules" ref="loginForm">
        <el-form-item prop="username">
          <el-input v-model="loginForm.username" placeholder="用户名">
            <template #prefix>
              <el-icon>
                <User />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="loginForm.password" placeholder="密码" show-password>
            <template #prefix>
              <el-icon>
                <Lock />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitLogin" class="submit-btn">登录</el-button>
        </el-form-item>
        <div class="login-options">
          <span>没有账号？<a href="javascript:;" @click="showRegister">立即注册</a></span>
          <a href="javascript:;" class="forgot-password">忘记密码</a>
        </div>
      </el-form>
    </el-dialog>
  </header>
</template>

<script>
// 使用全局注册的$api替代axios
import logoImage from '../../assets/images/logo.png'

import {  User, Lock, ShoppingCartFull } from '@element-plus/icons-vue'
import { handleImageError } from '../../utils/imageUtils'
import LanguageSwitcher from './LanguageSwitcher.vue'

export default {
  name: 'SiteHeader',
  components: {
    User,
    Lock,
    ShoppingCartFull,
    LanguageSwitcher
  },
  data() {
    return {
      loginDialogVisible: false,
      loginForm: {
        username: '',
        password: ''
      },
      loginRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ]
      },
      companyInfo: {},
      logoImage,
      tokenCheckTimer: null,
      cartCount: 0
    }
  },
  computed: {
    isLoggedIn() {
      // 同时检查store状态和localStorage中的token
      return this.$store.getters.isLoggedIn || !!localStorage.getItem('user_token');
    }
  },
  watch: {
    isLoggedIn(newVal) {
      if (newVal) {
        this.fetchCartCount();
      } else {
        this.cartCount = 0;
      }
    }
  },
  created() {
    this.fetchCompanyInfo();
    this.startTokenCheck();
    this.checkLoginStatus();
    this.fetchCartCount();
  },
  methods: {
    handleImageError,
    async fetchCompanyInfo() {
      try {
        const response = await this.$api.get('company')
        this.companyInfo = response.data || {}
      } catch (error) {
        console.error('获取公司信息失败:', error)
        this.$errorHandler.showError(error, 'company.error.fetchFailed')
      }
    },

    login() {
      this.loginDialogVisible = true
    },
    submitLogin() {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          // 实际项目中这里会调用登录API
          this.$errorHandler.showSuccess('登录成功', 'login.success.loginSuccess')
          this.loginDialogVisible = false
        }
      })
    },
    showRegister() {
      this.loginDialogVisible = false
      // 跳转到注册页面
      this.$router.push('/register')
    },
    handleCartClick() {
      if (!this.isLoggedIn) {
        this.$router.push('/login?redirect=/cart');
      } else {
        this.$router.push('/cart');
      }
    },
    
    async fetchCartCount() {
      if (!this.isLoggedIn) return;
      
      try {
        const response = await this.$api.get('/cart/count');
        if (response.success) {
          this.cartCount = response.data.count;
        }
      } catch (error) {
        console.error('获取购物车数量失败:', error);
      }
    },
    startTokenCheck() {
      if (this.tokenCheckTimer) clearInterval(this.tokenCheckTimer)
      this.tokenCheckTimer = setInterval(this.checkTokenValidity, 5 * 60 * 1000)
    },
    async checkTokenValidity() {
      const token = localStorage.getItem('user_token')
      if (!token) return
      try {
        const res = await this.$api.get('/users/check-token', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.success) throw new Error('Token invalid')
      } catch (e) {
        localStorage.removeItem('user_token')
        this.$store.commit('setUser', null)
        this.$errorHandler.showError(null, 'common.error.tokenExpired')
        this.$router.push('/login')
      }
    },
    
    // 检查登录状态并同步到store
    async checkLoginStatus() {
      const token = localStorage.getItem('user_token');
      if (token && !this.$store.getters.isLoggedIn) {
        try {
          // 验证token有效性并获取用户信息
          const response = await this.$api.get('/users/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.success) {
            this.$store.commit('setUser', response.data);
          }
        } catch (error) {
          // token无效，清除localStorage
          localStorage.removeItem('user_token');
          console.error('Token验证失败:', error);
        }
      }
    },
    
    handleUserMenu(command) {
      if (command === 'orders') {
        this.$router.push('/user/orders');
      } else if (command === 'logout') {
        // 清除登录状态
        localStorage.removeItem('user_token');
        this.$store.commit('setUser', null);
        this.$errorHandler.showSuccess('已退出登录', 'login.success.logoutSuccess');
        this.cartCount = 0;
        this.$router.push('/login');
      } else if (command === 'login') {
        this.$router.push('/login');
      }
    },
  },
  beforeUnmount() {
    // 清理定时器
    if (this.tokenCheckTimer) {
      clearInterval(this.tokenCheckTimer);
    }
  }
}
</script>

<style scoped>
.bg-white {
  background: #fff;
}

.shadow-md {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 40px;
}

/* Logo */
.logo {
  flex: 0 0 auto;
  min-width: 180px;
  max-width: 220px;
  height: 48px;
  display: flex;
  align-items: center;
}

.logo img {
  height: 100%;
  width: auto;
  max-width: 100%;
  object-fit: contain;
}

/* Navigation */
.main-nav {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32px;
  min-width: 0;
  margin: 0 20px;
}

.main-nav a {
  color: #333;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  padding: 6px 0;
  position: relative;
  transition: color 0.2s ease;
  white-space: nowrap;
}

.main-nav a:hover {
  color: #dc2626;
}

.main-nav .nav-active {
  color: #dc2626;
  font-weight: 600;
}

.main-nav .nav-active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background: #dc2626;
  border-radius: 2px;
}

/* User Actions */
.user-actions {
  flex: 0 0 auto;
  min-width: 140px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #333;
  transition: color 0.2s ease;
  padding: 4px;
  border: none;
  background: none;
  cursor: pointer;
  position: relative;
}

.action-btn:hover {
  color: #dc2626;
}

.cart-button {
  padding: 4px !important;
  height: auto !important;
}

.cart-count {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  background: #dc2626;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  text-align: center;
  border-radius: 9px;
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
}

.user-btn {
  gap: 4px;
}

.user-btn .el-icon-arrow-down {
  font-size: 12px;
  margin-top: 2px;
}

/* Login Dialog */
.login-dialog :deep(.el-dialog__body) {
  padding: 30px 40px;
}

.submit-btn {
  width: 100%;
  height: 40px;
  margin-top: 10px;
  background: #dc2626;
  border-color: #dc2626;
}

.submit-btn:hover {
  background: #b91c1c;
  border-color: #b91c1c;
}

.login-options {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-top: 16px;
}

.login-options a {
  color: #dc2626;
  text-decoration: none;
}

.login-options a:hover {
  color: #b91c1c;
}

/* Responsive */
@media (max-width: 1024px) {
  .container {
    padding: 12px 16px;
    gap: 20px;
  }

  .main-nav {
    gap: 24px;
  }

  .logo {
    min-width: 160px;
  }
}

@media (max-width: 900px) {
  .main-nav {
    display: none;
  }

  .container {
    justify-content: space-between;
  }

  .logo {
    min-width: 140px;
  }
}

@media (max-width: 600px) {
  .container {
    padding: 8px 12px;
  }

  .logo img {
    height: 40px;
  }

  .user-actions {
    min-width: auto;
    gap: 12px;
  }
}
</style>