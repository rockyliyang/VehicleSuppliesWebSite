<template>
  <header class="bg-white shadow-md">
    <div class="container mx-auto px-4 flex items-center justify-between">
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
        <a href="#" @click.prevent="handleCartClick" class="action-btn cart-button">
          <span class="material-icons icon-md">shopping_cart</span>
          <span v-if="cartCount > 0" class="cart-count">{{ cartCount }}</span>
        </a>
        <!-- User Dropdown -->
        <el-dropdown trigger="hover" @command="handleUserMenu">
          <span class="action-btn user-btn">
            <span class="material-icons icon-md">person</span>
            <span class="material-icons icon-sm ml-1">expand_more</span>
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

import {  User, Lock } from '@element-plus/icons-vue'
import { handleImageError } from '../../utils/imageUtils'
import LanguageSwitcher from './LanguageSwitcher.vue'

export default {
  name: 'SiteHeader',
  components: {
    User,
    Lock,
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
      // 只使用store状态判断登录状态
      return this.$store.getters.isLoggedIn;
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

    this.fetchCartCount();
    // 监听购物车更新事件
    this.$bus && this.$bus.on('cart-updated', this.fetchCartCount);
  },
  beforeUnmount() {
    // 清理事件监听
    this.$bus && this.$bus.off('cart-updated', this.fetchCartCount);
    if (this.tokenCheckTimer) {
      clearInterval(this.tokenCheckTimer);
    }
  },
  methods: {
    handleImageError,
    async fetchCompanyInfo() {
      try {
        const response = await this.$api.get('company')
        this.companyInfo = response.data || {}
      } catch (error) {
        console.error('获取公司信息失败:', error)
        this.$messageHandler.showError(error, 'company.error.fetchFailed')
      }
    },

    login() {
      this.loginDialogVisible = true
    },
    submitLogin() {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          // 实际项目中这里会调用登录API
          this.$messageHandler.showSuccess('登录成功', 'login.success.loginSuccess')
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
      try {
        const res = await this.$api.post('/users/check-token')
        if (!res.success) throw new Error('Token invalid')
      } catch (e) {
        this.$store.commit('setUser', null)
        this.$messageHandler.showError(null, 'common.error.tokenExpired')
        
        // 只有当前页面需要认证时才跳转到登录页面
        const currentRoute = this.$route
        const requiresAuth = currentRoute.meta?.requiresAuth ?? true
        
        if (requiresAuth) {
          this.$router.push('/login')
        }
      }
    },
    
    // 登录状态检查现在由store初始化时自动处理
    
    handleUserMenu(command) {
      if (command === 'orders') {
        this.$router.push('/user/orders');
      } else if (command === 'logout') {
        this.handleLogout();
      } else if (command === 'login') {
        this.$router.push('/login');
      }
    },
    
    // 处理登出逻辑
    async handleLogout() {
      try {
        // 调用后端登出接口清除cookie
        await this.$api.post('/users/logout');
        // 清除前端状态
        this.$store.commit('setUser', null);
        this.$messageHandler.showSuccess('已退出登录', 'login.success.logoutSuccess');
        this.cartCount = 0;
        this.$router.push('/login');
      } catch (error) {
        console.error('登出失败:', error);
        // 即使API调用失败，也清除前端状态
        this.$store.commit('setUser', null);
        this.$router.push('/login');
      }
    },
  },

  
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';
@import '@/assets/styles/mixins';

/* Material Icons */
.icon-sm {
  font-size: 1.25rem;
}

.icon-md {
  font-size: 1.5rem;
}

.ml-1 {
  margin-left: 0.25rem;
}

.bg-white {
  background: $white;
}

.shadow-md {
  box-shadow: $shadow-md;
}

.container {
  @include container;
  height: $header-height;
  @include flex-between;
  gap: $spacing-2xl;
  padding: $spacing-md $spacing-lg;
}

/* Logo */
.logo {
  flex: 0 0 auto;
  min-width: 180px;
  max-width: 260px;
  height: 40px;
  display: flex; /* 使用flex布局 */
  align-items: center; /* 垂直居中 */
  justify-content: flex-start; /* 水平向左对齐 */
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
  @include flex-center;
  gap: $spacing-xl;
  min-width: 0;
  margin: 0 $spacing-lg;
}

.main-nav a {
  color: #6b7280;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  text-decoration: none;
  padding: $spacing-xs 0;
  position: relative;
  transition: $transition-base;
  white-space: nowrap;
}

.main-nav a:hover {
  color: $primary-color;
}

.main-nav .nav-active {
  color: $primary-color;
  font-weight: $font-weight-semibold;
}

.main-nav .nav-active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background: $primary-color;
  border-radius: $border-radius-sm;
}

/* User Actions */
.user-actions {
  flex: 0 0 auto;
  min-width: 140px;
  @include flex-center;
  gap: $spacing-md;
}

/* User Dropdown Menu */
.user-actions :deep(.el-dropdown-menu) {
  .el-dropdown-menu__item {
    font-size: 18px;
  }
}

.action-btn {
  @include flex-center;
  color: $text-primary;
  transition: $transition-base;
  padding: $spacing-xs;
  border: none;
  background: none;
  cursor: pointer;
  position: relative;
}

.action-btn:hover {
  color: $primary-color;
}

.cart-button {
  padding: $spacing-xs !important;
  height: auto !important;
}

.cart-count {
  position: absolute;
  top: -$spacing-xs;
  right: -$spacing-xs;
  min-width: 18px;
  height: 18px;
  padding: 0 $spacing-xs;
  background: $primary-color;
  color: $white;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  line-height: 18px;
  text-align: center;
  border-radius: $border-radius-full;
  box-shadow: 0 2px 4px rgba($primary-color, 0.2);
}

.user-btn {
  gap: $spacing-xs;
}

.user-btn .el-icon-arrow-down {
  font-size: $font-size-xs;
  margin-top: 2px;
}

/* Login Dialog */
.login-dialog :deep(.el-dialog__body) {
  padding: $spacing-xl $spacing-2xl;
}

.submit-btn {
  @include button-primary;
  width: 100%;
  height: 40px;
  margin-top: $spacing-sm;
}

.submit-btn:hover {
  background: $primary-dark;
  border-color: $primary-dark;
}

.login-options {
  @include flex-between;
  font-size: $font-size-sm;
  margin-top: $spacing-md;
}

.login-options a {
  @include link-base;
  text-decoration: none;
}

.login-options a:hover {
  color: $primary-dark;
}

/* Responsive */
@include tablet {
  .container {
    padding: $spacing-sm $spacing-md;
    gap: $spacing-lg;
  }

  .main-nav {
    gap: $spacing-lg;
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

@include mobile {
  .container {
    padding: $spacing-sm $spacing-sm;
  }

  .logo img {
    height: 40px;
  }

  .user-actions {
    min-width: auto;
    gap: $spacing-sm;
  }
}
</style>