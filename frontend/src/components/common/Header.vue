<template>
  <header class="bg-white shadow-md">
    <!-- Desktop Header -->
    <div class="container mx-auto px-4 flex items-center justify-between desktop-header">
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
        <LanguageSwitcher class="mobile-only" />
        <!-- Cart Button -->
        <a href="#" @click.prevent="handleCartClick" class="action-btn cart-button">
          <span class="material-icons icon-md">shopping_cart</span>
          <span v-if="cartCount > 0" class="cart-count">{{ cartCount }}</span>
        </a>
        <!-- Desktop User Dropdown -->
        <el-dropdown trigger="hover" @command="handleUserMenu">
          <span class="action-btn user-btn">
            <span class="material-icons icon-md">person</span>
            <span class="material-icons icon-sm ml-1">expand_more</span>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-if="isLoggedIn" command="settings">{{ $t('userSettings.myaccount') || '我的'
                }}</el-dropdown-item>
              <el-dropdown-item v-if="isLoggedIn" command="orders">{{ $t('orders') }}</el-dropdown-item>
              <el-dropdown-item v-if="isLoggedIn" command="inquiries">{{ $t('inquiry.management.title') || '询价单管理'
                }}</el-dropdown-item>
              <el-dropdown-item v-if="isLoggedIn" command="logout">{{ $t('logout') }}</el-dropdown-item>
              <el-dropdown-item v-if="!isLoggedIn" command="login">{{ $t('login') }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- Mobile Header -->
    <div class="mobile-header">
      <!-- Single Row: Logo, Cart & User -->
      <div class="mobile-header-row">
        <!-- Center: Logo -->
        <div class="logo mobile-logo-center">
          <router-link to="/">
            <img :src="companyInfo.logo_url || logoImage" :alt="companyInfo.company_name || 'AUTO EASE EXPERT CO., LTD'"
              @error="handleImageError" />
          </router-link>
        </div>

        <!-- Right: Cart & User Actions -->
        <div class="mobile-actions">
          <!-- Cart Button -->
          <a href="#" @click.prevent="handleCartClick" class="action-btn cart-button">
            <span class="material-icons icon-md">shopping_cart</span>
            <span v-if="cartCount > 0" class="cart-count">{{ cartCount }}</span>
          </a>
          <!-- Mobile User Button - Direct to settings -->
          <button @click="handleMobileUserClick" class="mobile-user-btn" :class="{ 'user-logged-in': isLoggedIn }">
            <i class="fas fa-user"></i>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation Row -->
      <div class="mobile-nav-row">
        <div class="mobile-nav-buttons">
          <router-link to="/" exact-active-class="nav-active" class="mobile-nav-btn">{{$t('home')}}</router-link>
          <router-link to="/about" active-class="nav-active" class="mobile-nav-btn">{{$t('about')}}</router-link>
          <router-link to="/products" active-class="nav-active" class="mobile-nav-btn">{{$t('products')}}</router-link>
          <router-link to="/news" active-class="nav-active" class="mobile-nav-btn">{{$t('news')}}</router-link>
          <router-link to="/contact" active-class="nav-active" class="mobile-nav-btn">{{$t('contact')}}</router-link>
        </div>
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
        // 移动端状态
        isMobile: false,
        // 语言显示名称映射
        languageDisplayMap: {
          'zh-CN': '中文',
          'en': 'English'
        },
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
    },
    
    // 获取当前语言
    currentLanguage: {
      get() {
    try {
      const lang = this.$store.getters['language/currentLanguage'];
      console.log('Getting current language:', lang);
      return lang || 'en'; // 提供默认值
    } catch (error) {
      console.error('Error getting current language:', error);
      return 'en';
    }
  },
      set(value) {
        // setter用于v-model双向绑定
        console.log('set current language:', value);
        this.handleLanguageChange(value);
      }
    },
    
    // 获取支持的语言列表
    supportedLanguages() {
      console.log('Getting supported languages:', this.$store.getters['language/supportedLanguages']);
      return this.$store.getters['language/supportedLanguages'];
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
  mounted() {
    this.checkMobile();
    
    // 监听窗口大小变化
    window.addEventListener('resize', this.checkMobile);
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
          //this.$messageHandler.showSuccess('登录成功', 'login.success.loginSuccess')
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
        const res = await this.$api.post('/users/check-token', { renew: false })
        if (!res.success) throw new Error('Token invalid')
      } catch (e) {
        this.$store.commit('setUser', null)
        //this.$messageHandler.showError(null, 'common.error.tokenExpired')
        
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
      if (command === 'settings') {
        this.$router.push('/user/settings');
      } else if (command === 'orders') {
        this.$router.push('/user/orders');
      } else if (command === 'inquiries') {
        this.$router.push('/inquiry-management');
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
        //this.$messageHandler.showSuccess('已退出登录', 'login.success.logoutSuccess');
        this.cartCount = 0;
        this.$router.push('/login');
      } catch (error) {
        console.error('登出失败:', error);
        // 即使API调用失败，也清除前端状态
        this.$store.commit('setUser', null);
        this.$router.push('/login');
      }
    },
    
    // 移动端检测
    checkMobile() {
      this.isMobile = window.innerWidth <= 900;
    },
    
    // 移动端用户按钮点击 - 直接跳转到用户设置
    handleMobileUserClick() {
      if (this.isLoggedIn) {
        this.$router.push('/user/settings');
      } else {
        this.$router.push('/login');
      }
    },
    
    // 获取语言显示名称
    getLanguageDisplay(lang) {
      return this.languageDisplayMap[lang] || lang;
    },
    
    // 处理语言切换（移动端）
    handleLanguageChange(lang) {
      console.log('handleLanguageChange received:', lang, typeof lang);
      // 如果传入的是event对象，获取其target.value
      if (lang && typeof lang === 'object' && lang.target) {
        lang = lang.target.value;
      }
      console.log('handleLanguageChange processed lang:', lang);
      if (lang !== this.$store.getters['language/currentLanguage']) {
        this.$store.dispatch('language/changeLanguage', lang);
        console.log('handleLanguageChange current language:', lang);
        // 触发全局语言切换事件，与桌面端保持一致
        this.$bus.emit('language-changed', lang);
      }
    }
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

/* Logo - 统一管理所有logo相关样式 */
.logo {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: flex-start;

  /* 默认桌面端样式 */
  min-width: 150px; // 增大最小宽度
  max-width: 250px; // 增大最大宽度
  height: 60px; // 增大高度

  /* 平板端样式 */
  @include tablet {
    min-width: 180px; // 增大平板端宽度
    height: 55px;
  }

  /* 平板到桌面端之间的样式 */
  @media (min-width: $breakpoint-tablet) and (max-width: $breakpoint-desktop) {
    min-width: 200px; // 增大中等屏幕宽度
    height: 58px;
  }

  /* 手机端样式 */
  @include mobile {
    min-width: 100px; // 增大手机端最小宽度
    max-width: 140px; // 增大手机端最大宽度
    height: 45px; // 增大手机端高度
  }

  /* Logo图片样式 */
  img {
    height: 100%;
    width: auto;
    max-width: 100%;
    object-fit: contain;

    /* 手机端图片高度 */
    @include mobile {
      height: 45px; // 对应手机端容器高度
    }
  }
}

/* Desktop/Mobile Header Display */
.desktop-header {
  @media (max-width: $mobile-breakpoint-lg) {
    display: none;
  }
}

.mobile-header {
  display: none;

  @media (max-width: $mobile-breakpoint-lg) {
    display: block;
  }
}

/* Mobile Header Rows */
.mobile-header-row {
  @include flex-between;
  align-items: center;
  padding: $spacing-sm $spacing-sm;
  margin-bottom: 0;
}

.mobile-actions {
  @include flex-center;
  gap: $spacing-sm;
}

.mobile-nav-row {
  background: $white;
  box-shadow: $shadow-sm;
  margin: 0;
  padding: 0;
  width: 100%;
}

.mobile-nav-buttons {
  display: flex;
  gap: 0;
  overflow-x: auto;
  padding: 0;
  justify-content: space-around;
  min-height: $spacing-4xl - $spacing-md; // 约51px (64px - 13px)
  align-items: stretch;
  width: 100%;

  &::-webkit-scrollbar {
    display: none;
  }

  -ms-overflow-style: none;
  scrollbar-width: none;

  @include mobile {
    justify-content: space-around;
    gap: 0;
    padding: 0;
    min-height: $spacing-4xl - $spacing-md; // 约51px (64px - 13px)
  }
}

.mobile-nav-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-sm $spacing-xs;
  background: transparent;
  color: $text-secondary;
  text-decoration: none;
  border-radius: 0;
  font-size: $font-size-lg;
  font-weight: $font-weight-medium;
  transition: $transition-base;
  white-space: nowrap;
  position: relative;
  min-height: $spacing-4xl - $spacing-md; // 约51px (64px - 13px)
  text-align: center;
  border: none;

  &:hover {
    color: $primary-color;
    background: rgba($primary-color, 0.05);
  }

  &.nav-active {
    color: $primary-color;
    font-weight: $font-weight-semibold;
    background: rgba($primary-color, 0.08);
  }

  @include mobile {
    flex: 1;
    min-width: auto;
    font-size: $font-size-lg;
    padding: $spacing-sm $spacing-xs;
    min-height: $spacing-4xl - $spacing-md; // 约51px (64px - 13px)
  }
}

/* Language Selector */
.language-selector {
  .language-select {
    padding: $spacing-xs $spacing-sm;
    border: $border-width-sm solid $gray-300;
    border-radius: $border-radius-sm;
    background: $white;
    color: $text-primary;
    font-size: $font-size-sm;
    cursor: pointer;
    transition: $transition-base;

    &:hover {
      border-color: $primary-color;
    }

    &:focus {
      outline: none;
      border-color: $primary-color;
      box-shadow: 0 0 0 $border-width-md rgba($primary-color, 0.1);
    }
  }
}

/* Mobile Menu Button */
.mobile-menu-btn {
  @include flex-center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  background: none;
  border: $border-width-sm solid $gray-300;
  border-radius: $border-radius-md;
  color: $text-primary;
  cursor: pointer;
  transition: $transition-base;
  font-size: $font-size-sm;

  &:hover {
    color: $primary-color;
    border-color: $primary-color;
  }

  .menu-text {
    font-weight: $font-weight-medium;
  }
}

/* Navigation Styles - 导航样式合并 */
/* Desktop Navigation */
.main-nav {
  flex: 1;
  @include flex-center;
  gap: $spacing-xl;
  min-width: 0;
  margin: 0 $spacing-lg;

  /* Desktop Navigation Links */
  a {
    color: $nav-link-color;
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    text-decoration: none;
    padding: $spacing-xs 0;
    position: relative;
    transition: $transition-base;
    white-space: nowrap;

    &:hover {
      color: $primary-color;
    }

    &.nav-active {
      color: $primary-color;
      font-weight: $font-weight-semibold;

      &::after {
        content: '';
        position: absolute;
        bottom: -$spacing-xs;
        left: 0;
        width: 100%;
        height: $spacing-xs;
        background: $primary-color;
        border-radius: $border-radius-sm;
      }
    }
  }

  /* Responsive behavior */
  @include tablet {
    gap: $spacing-lg;
  }

  @media (max-width: $breakpoint-desktop) {
    display: none;
  }
}

/* Mobile Navigation */
.mobile-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: $white;
  @include flex-column;
  justify-content: center;
  align-items: center;
  gap: $spacing-xl;
  padding: $spacing-lg;
  box-shadow: $shadow-lg;
  transform: translateY(-100%);
  opacity: 0;
  visibility: hidden;
  transition: $transition-carousel;
  z-index: $z-index-mobile-nav;

  &.mobile-nav-open {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
  }

  /* Mobile Navigation Links */
  a {
    color: $text-primary;
    font-size: $font-size-2xl;
    font-weight: $font-weight-semibold;
    text-decoration: none;
    padding: $spacing-md 0;
    transition: $transition-base;
    text-align: center;

    &:hover {
      color: $primary-color;
    }

    &.nav-active {
      color: $primary-color;
      font-weight: $font-weight-bold;
    }
  }
}

/* Mobile Navigation Overlay */
.mobile-nav-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, $mobile-nav-overlay-opacity);
  z-index: $z-index-mobile-overlay;

  @media (min-width: ($breakpoint-desktop + 1px)) {
    display: none;
  }
}

/* Responsive Display Classes */
.desktop-only {
  @media (max-width: $breakpoint-desktop) {
    display: none !important;
  }
}

.mobile-only {
  display: none;

  @media (max-width: $breakpoint-desktop) {
    display: flex !important;
  }
}

/* User Actions */
.user-actions {
  flex: 0 0 auto;
  min-width: $spacing-6xl + $spacing-lg; // 约140px
  @include flex-center;
  gap: $spacing-md;

  @include mobile {
    min-width: auto;
    gap: $spacing-sm;
  }
}

/* Mobile User Button */
.mobile-user-btn {
  @include flex-center;
  padding: $spacing-xs;
  background: none;
  border: none;
  color: $text-primary;
  cursor: pointer;
  transition: $transition-base;
  width: 40px;
  height: 40px;
  font-size: 18px;

  &:hover {
    color: $primary-color;
  }
}

/* User Dropdown Menu */
.user-actions :deep(.el-dropdown-menu) {
  .el-dropdown-menu__item {
    font-size: $font-size-lg;
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
  min-width: $mobile-cart-badge-size;
  height: $mobile-cart-badge-size;
  padding: 0 $spacing-xs;
  background: $primary-color;
  color: $white;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  line-height: $mobile-cart-badge-size;
  text-align: center;
  border-radius: $border-radius-full;
  box-shadow: $shadow-sm;
}

.user-btn {
  gap: $spacing-xs;
}

.user-btn .el-icon-arrow-down {
  font-size: $font-size-xs;
  margin-top: $spacing-xs;
}

/* Login Dialog */
.login-dialog :deep(.el-dialog__body) {
  padding: $spacing-xl $spacing-2xl;
}

.submit-btn {
  @include button-primary;
  width: 100%;
  height: $mobile-submit-button-height;
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
}

@media (min-width: $breakpoint-tablet) and (max-width: $breakpoint-desktop) {
  .container {
    justify-content: space-between;
  }
}

@include mobile {
  .container {
    padding: $spacing-sm $spacing-sm;
  }

  .user-actions {
    min-width: auto;
    gap: $spacing-sm;
  }
}
</style>