<template>
  <div class="login-page">
    <!-- Page Banner -->
    <div class="page-banner">
      <div class="banner-content">
        <h1 class="banner-title">
          {{ $t('login.title') || '用户登录' }}
        </h1>
        <div class="banner-divider"></div>
      </div>
    </div>

    <!-- Login Form Section -->
    <div class="login-container">
      <div class="form-wrapper">
        <div class="login-card">
          <div class="login-header">
            <img :src="logoUrl" alt="AUTO EASE EXPERT CO., LTD" class="logo">
            <h2 class="login-title">
              {{ $t('login.welcome') || '欢迎回来' }}
            </h2>
            <p class="login-subtitle">
              {{ $t('login.subtitle') || '请登录您的账户' }}
            </p>
          </div>

          <el-tabs v-model="activeTab" class="login-tabs">
            <el-tab-pane :label="$t('login.accountLogin') || '账号登录'" name="account">
              <el-form :model="loginForm" :rules="loginRules" ref="loginForm" class="login-form">
                <el-form-item prop="username">
                  <FormInput v-model="loginForm.username" :placeholder="$t('login.usernamePlaceholder') || '请输入用户名/邮箱'"
                    :prefix-icon="User" />
                </el-form-item>
                <el-form-item prop="password">
                  <FormInput v-model="loginForm.password" type="password"
                    :placeholder="$t('login.passwordPlaceholder') || '请输入密码'" :prefix-icon="Lock" :show-password="true"
                    @enter="submitLogin" />
                </el-form-item>
                <div class="remember-forgot">
                  <el-checkbox v-model="rememberMe" class="remember-checkbox">
                    {{ $t('login.rememberMe') || '记住我' }}
                  </el-checkbox>
                  <router-link to="/forgot-password" class="forgot-password">
                    {{ $t('login.forgotPassword') || '忘记密码?' }}
                  </router-link>
                </div>
                <el-form-item class="button-form-item">
                  <button type="button" @click="submitLogin" :disabled="loading" class="login-button">
                    {{ loading ? ($t('login.loggingIn') || '登录中...') : ($t('login.login') || '登录') }}
                  </button>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <el-tab-pane :label="$t('login.phoneLogin') || '手机登录'" name="phone">
              <el-form :model="phoneForm" :rules="phoneRules" ref="phoneForm" class="login-form">
                <el-form-item prop="phone">
                  <FormInput v-model="phoneForm.phone" :placeholder="$t('login.phonePlaceholder') || '请输入手机号码'"
                    :prefix-icon="PhoneFilled" />
                </el-form-item>
                <el-form-item prop="code">
                  <div class="code-container">
                    <FormInput v-model="phoneForm.code" :placeholder="$t('login.codePlaceholder') || '请输入验证码'"
                      :prefix-icon="Message" class="code-input" @enter="submitPhoneLogin" />
                    <button type="button" :disabled="codeSending || cooldown > 0" @click="sendCode" class="code-button">
                      {{ cooldown > 0 ? `${cooldown}${$t('login.secondsLater') || '秒后重新获取'}` : ($t('login.getCode') ||
                      '获取验证码') }}
                    </button>
                  </div>
                </el-form-item>
                <el-form-item class="button-form-item">
                  <button type="button" @click="submitPhoneLogin" :disabled="loading" class="login-button">
                    {{ loading ? ($t('login.loggingIn') || '登录中...') : ($t('login.login') || '登录') }}
                  </button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>

          <div class="login-footer">
            <p class="footer-text">
              {{ $t('login.noAccount') || '还没有账号?' }}
              <router-link to="/register" class="footer-link">
                {{ $t('login.goRegister') || '立即注册' }}
              </router-link>
            </p>
            <p class="footer-text">
              {{ $t('login.socialLogin') || '或者使用以下方式登录' }}
            </p>
            <div class="social-login">
              <i class="el-icon-s-platform"></i>
              <i class="el-icon-s-promotion"></i>
              <i class="el-icon-s-custom"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
// 使用全局注册的$api替代axios
import { ElMessage } from 'element-plus'
import { User, Lock, PhoneFilled, Message } from '@element-plus/icons-vue'
import FormInput from '@/components/common/FormInput.vue'
/* eslint-enable no-unused-vars */

export default {
  name: 'UserLogin',
  components: {
    FormInput
  },
  data() {
    return {
      activeTab: 'account',
      // 图标组件
      User,
      Lock,
      PhoneFilled,
      Message,
      loginForm: {
        username: '',
        password: ''
      },
      phoneForm: {
        phone: '',
        code: ''
      },
      loginRules: {
        username: [
          { required: true, message: this.$t('login.validation.usernameRequired'), trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (!value) {
                callback(new Error(this.$t('login.validation.usernameRequired')));
              } else if (value.includes('@')) {
                // 邮箱验证
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (!emailRegex.test(value)) {
                  callback(new Error(this.$t('login.validation.emailFormat')));
                } else {
                  callback();
                }
              } else {
                // 用户名验证
                if (value.length < 3) {
                  callback(new Error(this.$t('login.validation.usernameMinLength')));
                } else if (value.length > 20) {
                  callback(new Error(this.$t('login.validation.usernameMaxLength')));
                } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
                  callback(new Error(this.$t('login.validation.usernameFormat')));
                } else {
                  callback();
                }
              }
            },
            trigger: 'blur'
          }
        ],
        password: [
          { required: true, message: this.$t('login.validation.passwordRequired'), trigger: 'blur' },
          { min: 6, message: this.$t('login.validation.passwordMinLength'), trigger: 'blur' },
          { max: 50, message: this.$t('login.validation.passwordMaxLength'), trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (!value) {
                callback();
              } else if (value.length >= 8) {
                // 强密码验证（8位以上）
                const hasLower = /[a-z]/.test(value);
                const hasUpper = /[A-Z]/.test(value);
                const hasNumber = /\d/.test(value);
                const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
                
                const strength = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
                if (strength < 2) {
                  callback(new Error(this.$t('login.validation.passwordStrength')));
                } else {
                  callback();
                }
              } else {
                callback();
              }
            },
            trigger: 'blur'
          }
        ]
      },
      phoneRules: {
        phone: [
          { required: true, message: this.$t('login.validation.phoneRequired'), trigger: 'blur' },
          { pattern: /^1[3-9]\d{9}$/, message: this.$t('login.validation.phoneFormat'), trigger: 'blur' }
        ],
        code: [
          { required: true, message: this.$t('login.validation.codeRequired'), trigger: 'blur' },
          { len: 6, message: this.$t('login.validation.codeLength'), trigger: 'blur' },
          { pattern: /^\d{6}$/, message: this.$t('login.validation.codeFormat'), trigger: 'blur' }
        ]
      },
      rememberMe: false,
      loading: false,
      codeSending: false,
      cooldown: 0,
      timer: null,
      logoUrl: '/static/images/logo.png',
      tokenCheckTimer: null
    }
  },
  created() {
    this.fetchCompanyLogo();
  },
  mounted() {
    // 页面加载时检查登录状态
    this.checkLocalStorage()
  },
  methods: {
    async fetchCompanyLogo() {
      try {
        const res = await this.$api.get('company');
        if (res.success && res.data && res.data.logo_url) {
          this.logoUrl = res.data.logo_url;
        }
      } catch (e) {
        // 保持默认logo
      }
    },
    submitLogin() {
      this.$refs.loginForm.validate(async (valid, fields) => {
        if (valid) {
          try {
            this.loading = true
            const response = await this.$api.postWithErrorHandler('users/login', {
              username: this.loginForm.username,
              password: this.loginForm.password
            })
            // 登录成功，保存token和用户信息
            const { token, user } = response.data
            this.$store.commit('setUser', user)
            localStorage.setItem('user_token', token)
            this.$errorHandler.showSuccess(response.message || this.$t('login.success.loginSuccess'), 'login.success.loginSuccess')
            this.startTokenCheck()
            this.$router.push(this.$route.query.redirect || '/')
          } catch (error) {
            this.$errorHandler.showError(error, 'login.error.loginFailed')
          } finally {
            this.loading = false
          }
        } else {
          console.log('表单验证失败:', fields)
          // 显示第一个验证错误
          const firstErrorField = Object.keys(fields)[0]
          const firstError = fields[firstErrorField][0]
          this.$errorHandler.showError(firstError.message, 'login.error.checkInput')
          return false
        }
      })
    },
    submitPhoneLogin() {
      this.$refs.phoneForm.validate((valid, fields) => {
        if (valid) {
          // 实际项目中会调用手机登录API
          this.loading = true
          setTimeout(() => {
            this.loading = false
            this.$errorHandler.showSuccess(this.$t('login.success.loginSuccess'), 'login.success.loginSuccess')
            this.$router.push('/')
          }, 1500)
        } else {
          console.log('手机登录表单验证失败:', fields)
          // 显示第一个验证错误
          const firstErrorField = Object.keys(fields)[0]
          const firstError = fields[firstErrorField][0]
          this.$errorHandler.showError(firstError.message, 'login.error.checkInput')
          return false
        }
      })
    },
    sendCode() {
      this.$refs.phoneForm.validateField('phone', (valid, errorMessage) => {
        if (valid) {
          // 实际项目中会调用发送验证码API
          this.codeSending = true
          setTimeout(() => {
            this.codeSending = false
            this.$errorHandler.showSuccess(this.$t('login.success.codeSent'), 'login.success.codeSent')
            this.startCooldown()
          }, 1000)
        } else {
          this.$errorHandler.showError(errorMessage, 'login.error.phoneFormat')
        }
      })
    },
    startCooldown() {
      this.cooldown = 60
      this.timer = setInterval(() => {
        this.cooldown--
        if (this.cooldown <= 0) {
          clearInterval(this.timer)
        }
      }, 1000)
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
        this.$errorHandler.showError(e, 'login.error.tokenExpired')
        this.$router.push('/login')
      }
    },
    // 检查本地存储中的登录信息
    checkLocalStorage() {
      const token = localStorage.getItem('token')
      if (token && !this.$store.state.isLoggedIn) {
        // 如果有token但store中未登录，尝试获取用户信息
        this.getUserInfo()
      }
    },
    
    // 获取用户信息
    async getUserInfo() {
      try {
        const userRes = await this.$api.get('/users/profile')
        if (userRes.success) {
          this.$store.commit('setUser', userRes.data)
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    }
  },
  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  }
}
</script>

<style scoped>
/* Page Banner */
.page-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60px 20px;
  text-align: center;
  width: 100%;
}

.banner-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.banner-title {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin: 0 0 20px 0;
}

.banner-divider {
  width: 60px;
  height: 4px;
  background-color: white;
  margin: 0 auto;
}

/* Login Container */
.login-page {
  min-height: 100vh;
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
}

.login-container {
  padding: 60px 20px;
  background-color: #f8f9fa;
  min-height: calc(100vh - 200px);
  width: 100%;
}

.form-wrapper {
  max-width: 500px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  max-width: 450px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 40px;
  transition: all 0.3s ease;
}

.login-card:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  width: 200px;
  height: auto;
  max-height: 100px;
  margin: 0 auto 20px auto;
  object-fit: contain;
  display: block;
}

.login-title {
  text-align: center;
  font-size: 1.8rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 10px 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.login-subtitle {
  text-align: center;
  color: #7f8c8d;
  margin: 0 0 30px 0;
  font-size: 1rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Form Styles */
.login-form {
  margin-top: 20px;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
}

/* Element UI Overrides */
.login-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-form :deep(.el-form-item__content) {
  display: flex;
  justify-content: center;
  max-width: 100%;
}

/* Tabs */
.login-tabs {
  margin-bottom: 20px;
}

.login-tabs :deep(.el-tabs__header) {
  margin: 0 0 20px 0;
}

.login-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.login-tabs :deep(.el-tabs__item) {
  font-size: 16px;
  font-weight: 500;
  color: #7f8c8d;
  padding: 0 20px;
}

.login-tabs :deep(.el-tabs__item.is-active) {
  color: #667eea;
  font-weight: 600;
}

.login-tabs :deep(.el-tabs__active-bar) {
  background-color: #667eea;
}

.login-tabs :deep(.el-tabs__content) {
  min-height: 280px;
}

.login-tabs :deep(.el-tab-pane) {
  min-height: 280px;
}

/* Remember & Forgot */
.remember-forgot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  font-size: 14px;
}

.remember-checkbox :deep(.el-checkbox__label) {
  color: #7f8c8d;
  font-size: 14px;
}

.forgot-password {
  color: #667eea;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.3s ease;
}

.forgot-password:hover {
  color: #5a6fd8;
  text-decoration: underline;
}

/* Verification Code */
.code-container {
  display: flex;
  gap: 12px;
  width: 100%;
}

.code-input {
  flex: 1;
}

.code-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: 120px;
}

.code-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-1px);
}

.code-button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
}

/* Login Button */
.button-form-item :deep(.el-form-item__content) {
  width: 100%;
}

.login-button {
  width: 100%;
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.login-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(220, 38, 38, 0.3);
}

.login-button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Footer */
.login-footer {
  text-align: center;
  margin-top: 30px;
}

.footer-text {
  color: #7f8c8d;
  margin: 10px 0;
  font-size: 14px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.footer-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  margin-left: 5px;
  transition: color 0.3s ease;
}

.footer-link:hover {
  color: #5a6fd8;
  text-decoration: underline;
}

.social-login {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 15px;
}

.social-login i {
  font-size: 24px;
  color: #bdc3c7;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 8px;
  border-radius: 50%;
}

.social-login i:hover {
  color: #667eea;
  background-color: rgba(102, 126, 234, 0.1);
  transform: translateY(-2px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .banner-title {
    font-size: 2rem;
  }

  .login-card {
    margin: 20px;
    padding: 30px 20px;
  }

  .form-wrapper {
    padding: 0 10px;
  }

  .code-container {
    flex-direction: column;
    gap: 10px;
  }

  .code-button {
    width: 100%;
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .page-banner {
    padding: 40px 15px;
  }

  .banner-title {
    font-size: 1.8rem;
  }

  .login-container {
    padding: 40px 15px;
  }

  .login-card {
    margin: 10px;
    padding: 25px 15px;
  }
}
</style>