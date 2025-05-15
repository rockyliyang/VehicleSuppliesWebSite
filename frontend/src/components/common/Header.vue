<template>
  <header class="site-header">
    <div class="top-bar">
      <div class="container">
        <div class="contact-info">
          <span><el-icon>
              <PhoneFilled />
            </el-icon> {{ companyInfo.phone || '+86 123 4567 8910' }}</span>
          <span><el-icon>
              <Message />
            </el-icon> {{ companyInfo.email || 'contact@autoease.com' }}</span>
        </div>
        <div class="top-right">
          <span class="discount">10% OFF All Items</span>
          <el-dropdown>
            <span class="language-selector">
              中文 <el-icon>
                <ArrowDown />
              </el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>English</el-dropdown-item>
                <el-dropdown-item>中文</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

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
            <li><router-link to="/" exact>首页</router-link></li>
            <li><router-link to="/products">产品中心</router-link></li>
            <li><router-link to="/about">关于我们</router-link></li>
            <li><router-link to="/news">新闻资讯</router-link></li>
            <li><router-link to="/contact">联系我们</router-link></li>
          </ul>
        </nav>

        <div class="user-actions">
          <!-- 购物车按钮 -->
          <el-button link @click="handleCartClick">
            <el-icon>
              <ShoppingCartFull />
            </el-icon>
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
                <el-dropdown-item v-if="isLoggedIn" command="orders">我的订单</el-dropdown-item>
                <el-dropdown-item v-if="isLoggedIn" command="logout">退出</el-dropdown-item>
                <el-dropdown-item v-if="!isLoggedIn" command="login">注册/登录</el-dropdown-item>
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

import { PhoneFilled, Message, ArrowDown, User, Lock, ShoppingCartFull } from '@element-plus/icons-vue'
import { handleImageError } from '../../utils/imageUtils'

export default {
  name: 'SiteHeader',
  components: {
    PhoneFilled,
    Message,
    ArrowDown,
    User,
    Lock,
    ShoppingCartFull
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
      tokenCheckTimer: null
    }
  },
  computed: {
    isLoggedIn() {
      // 只判断user_token
      return !!localStorage.getItem('user_token');
    }
  },
  created() {
    this.fetchCompanyInfo();
    this.startTokenCheck();
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
        this.$router.push('/login');
      } else {
        this.$router.push('/cart');
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
        this.$router.push('/orders');
      } else if (command === 'logout') {
        // 清除登录状态
        localStorage.removeItem('user_token');
        this.$store.commit('setUser', null);
        this.$message.success('已退出登录');
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