<template>
  <header class="site-header">


    <div class="main-header">
      <div class="container">
        <div class="logo">
          <router-link to="/">
            <img :src="companyInfo.logo_url || logoImage" :alt="companyInfo.company_name || 'AUTO EASE EXPERT CO., LTD'"
              @error="handleImageError">
          </router-link>
        </div>

        <nav class="main-nav">
          <ul>
            <li><router-link to="/" exact>{{ $t('home') }}</router-link></li>
            <li><router-link to="/products">{{ $t('products') }}</router-link></li>
            <li><router-link to="/about">{{ $t('about') }}</router-link></li>
            <li><router-link to="/news">{{ $t('news') }}</router-link></li>
            <li><router-link to="/contact">{{ $t('contact') }}</router-link></li>
          </ul>
        </nav>

        <div class="user-actions">
          <!-- 语言切换器 -->
          <LanguageSwitcher />

          <!-- 购物车按钮 -->
          <el-button link @click="handleCartClick" class="cart-button">
            <el-icon>
              <ShoppingCartFull />
            </el-icon>
            <span v-if="cartCount > 0" class="cart-count">{{ cartCount }}</span>
          </el-button>
          <!-- 登录/用户按钮 -->
          <el-dropdown trigger="hover" @command="handleUserMenu">
            <span class="user-btn">
              <el-icon>
                <User />
              </el-icon>
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
    </div>

    <!-- 登录对话框 -->
    <el-dialog title="用户登录" v-model="loginDialogVisible" width="400px" center>
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
          <el-button type="primary" @click="submitLogin" style="width: 100%">登录</el-button>
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
      // 只判断user_token
      return !!localStorage.getItem('user_token');
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
  },
  methods: {
    handleImageError,
    async fetchCompanyInfo() {
      try {
        const response = await this.$api.get('company')
        this.companyInfo = response.data || {}
      } catch (error) {
        console.error('获取公司信息失败:', error)
        this.$message.error(error.response?.data?.message || '获取公司信息失败')
      }
    },

    login() {
      this.loginDialogVisible = true
    },
    submitLogin() {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          // 实际项目中这里会调用登录API
          this.$message.success('登录成功')
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
        this.$message.error('登录已过期，请重新登录')
        this.$router.push('/login')
      }
    },
    handleUserMenu(command) {
      if (command === 'orders') {
        this.$router.push('/user/orders');
      } else if (command === 'logout') {
        // 清除登录状态
        localStorage.removeItem('user_token');
        this.$store.commit('setUser', null);
        this.$message.success('已退出登录');
        this.cartCount = 0;
        this.$router.push('/login');
      } else if (command === 'login') {
        this.$router.push('/login');
      }
    },
  }
}
</script>

<style scoped>
.site-header {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.top-bar {
  background-color: #333;
  color: #fff;
  padding: 8px 0;
  font-size: 14px;
}

.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.contact-info span {
  margin-right: 20px;
}

.contact-info i {
  margin-right: 5px;
}

.top-right {
  display: flex;
  align-items: center;
}

.discount {
  background-color: #e60012;
  padding: 2px 10px;
  border-radius: 3px;
  margin-right: 15px;
}

.language-selector {
  cursor: pointer;
  color: #fff;
}

.main-header {
  padding: 15px 0;
  background-color: #fff;
}

.logo img {
  height: 50px;
}

.main-nav ul {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
}

.main-nav li {
  margin: 0 15px;
}

.main-nav a {
  text-decoration: none;
  color: #333;
  font-size: 16px;
  font-weight: 500;
  padding: 5px 0;
  position: relative;
  transition: color 0.3s;
}

.main-nav a:hover,
.main-nav a.router-link-active {
  color: #e60012;
}

.main-nav a.router-link-active:after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #e60012;
}

.user-actions {
  display: flex;
  align-items: center;
}

.user-actions .el-button {
  margin-left: 15px;
  font-size: 16px;
}

.user-actions .el-button i {
  margin-right: 5px;
  font-size: 18px;
}

.cart-button {
  position: relative;
}

.cart-count {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #e60012;
  color: white;
  border-radius: 50%;
  min-width: 16px;
  height: 16px;
  font-size: 12px;
  line-height: 16px;
  text-align: center;
  padding: 0 4px;
}

.login-options {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-top: 10px;
}

.login-options a {
  color: #e60012;
  text-decoration: none;
}

@media (max-width: 768px) {
  .container {
    flex-direction: column;
    align-items: flex-start;
  }

  .top-right,
  .main-nav,
  .user-actions {
    margin-top: 10px;
    width: 100%;
  }

  .main-nav ul {
    flex-wrap: wrap;
  }

  .main-nav li {
    margin: 5px 10px 5px 0;
  }
}
</style>