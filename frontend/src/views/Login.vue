<template>
  <div class="login-page">
    <!-- Page Banner -->
    <PageBanner :title="$t('login.title') || '用户登录'" />

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
import PageBanner from '@/components/common/PageBanner.vue'
/* eslint-enable no-unused-vars */

export default {
  name: 'UserLogin',
  components: {
    FormInput,
    PageBanner
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
      logoUrl: '/static/images/logo.png'
    }
  },
  created() {
    this.fetchCompanyLogo();
  },
  mounted() {
    // 登录状态现在通过store初始化时自动恢复
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
            // 登录成功，保存用户信息（token已通过cookie设置）
            const { user } = response.data
            this.$store.commit('setUser', user)
            this.$messageHandler.showSuccess(response.message || this.$t('login.success.loginSuccess'), 'login.success.loginSuccess')
            // Header组件已经启动了全局token检查，这里不需要重复启动
            this.$router.push(this.$route.query.redirect || '/')
          } catch (error) {
            this.$messageHandler.showError(error, 'login.error.loginFailed')
          } finally {
            this.loading = false
          }
        } else {
          console.log('表单验证失败:', fields)
          // 显示第一个验证错误
          const firstErrorField = Object.keys(fields)[0]
          const firstError = fields[firstErrorField][0]
          this.$messageHandler.showError(firstError.message, 'login.error.checkInput')
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
            this.$messageHandler.showSuccess(this.$t('login.success.loginSuccess'), 'login.success.loginSuccess')
            this.$router.push('/')
          }, 1500)
        } else {
          console.log('手机登录表单验证失败:', fields)
          // 显示第一个验证错误
          const firstErrorField = Object.keys(fields)[0]
          const firstError = fields[firstErrorField][0]
          this.$messageHandler.showError(firstError.message, 'login.error.checkInput')
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
            this.$messageHandler.showSuccess(this.$t('login.success.codeSent'), 'login.success.codeSent')
            this.startCooldown()
          }, 1000)
        } else {
          this.$messageHandler.showError(errorMessage, 'login.error.phoneFormat')
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
    // Token检查已移至Header组件统一处理

  },
  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';
@import '@/assets/styles/_mixins.scss';


/* Login Container */
.login-page {
  min-height: $auth-page-min-height;
  background-color: $gray-100;
  @include flex-column;
}

.login-container {
  padding: $auth-container-padding;
  background-color: $gray-100;
  min-height: $auth-container-min-height;
  width: 100%;
}

.form-wrapper {
  max-width: $auth-form-max-width;
  margin: 0 auto;
  padding: $auth-form-padding;
  @include flex-center;
}

.login-card {
  width: 100%;
  max-width: 550px;
  margin: 0 auto;
  @include card-hover;
  padding: $spacing-2xl;
  border: $auth-card-border;
}

.login-header {
  text-align: center;
  margin-bottom: $auth-header-margin-bottom;
}

.logo {
  width: $auth-logo-width;
  height: auto;
  max-height: $auth-logo-max-height;
  margin: $auth-logo-margin;
  object-fit: contain;
  display: block;
}

.login-title {
  text-align: center;
  font-size: $auth-title-font-size;
  font-weight: $font-weight-bold;
  color: $auth-title-color;
  margin: $auth-title-margin;
  letter-spacing: $auth-title-letter-spacing;

  .highlight {
    color: $primary-color;
  }
}

.login-subtitle {
  text-align: center;
  color: $text-secondary;
  font-size: $font-size-xl;
  margin: 0 0 $spacing-xl 0;
  line-height: $line-height-relaxed;
}

/* Form Styles */
.login-form {
  margin-top: $spacing-lg;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
}

/* Element UI Overrides */
.login-form :deep(.el-form-item) {
  margin-bottom: $auth-form-item-margin;
}

.login-form :deep(.el-form-item__content) {
  display: flex;
  justify-content: center;
  max-width: 100%;
}



.login-form :deep(.el-form-item__label) {
  font-size: $font-size-xl;
}

/* Tabs */
.login-tabs {
  margin-bottom: $spacing-lg;
}

.login-tabs :deep(.el-tabs__header) {
  margin: 0 0 $spacing-lg 0;
}

.login-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.login-tabs :deep(.el-tabs__item) {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $text-secondary;
  padding: 0 $spacing-lg;
}

.login-tabs :deep(.el-tabs__item.is-active) {
  color: $primary-color;
  font-weight: $font-weight-bold;
}

.login-tabs :deep(.el-tabs__active-bar) {
  background-color: $primary-color;
}

.login-tabs :deep(.el-tabs__content) {
  min-height: $auth-tabs-min-height;
}

.login-tabs :deep(.el-tab-pane) {
  min-height: $auth-tabs-min-height;
}

/* Remember & Forgot */
.remember-forgot {
  @include flex-between;
  margin-bottom: $spacing-lg;
  font-size: $font-size-xl;
}

.remember-checkbox :deep(.el-checkbox__label) {
  color: $text-secondary;
  font-size: $font-size-xl;
}

.forgot-password {
  @include link-base;
  font-size: $font-size-xl;
  font-weight: $font-weight-medium;
}

/* Verification Code */
.code-container {
  display: flex;
  gap: $spacing-sm;
  width: 100%;
}

.code-input {
  flex: 1;
}

.code-button {
  @include button-primary;
  @include gradient-primary;
  padding: $spacing-sm $spacing-lg;
  font-size: $font-size-lg;
  font-weight: $auth-button-font-weight;
  white-space: nowrap;
  min-width: 120px;
  height: $auth-button-height;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    background: $gray-400;
    cursor: not-allowed;
    transform: none;
  }
}

/* Login Button */
.button-form-item :deep(.el-form-item__content) {
  width: 100%;
}

.login-button {
  width: 100%;
  @include button-primary;
  @include button-lg;
  font-size: $font-size-lg;
  font-weight: $auth-button-font-weight;
  margin-top: $spacing-sm;
  height: $auth-button-height;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba($primary-color, 0.3);
  }

  &:disabled {
    background: $gray-400;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
}

/* Footer */
.login-footer {
  text-align: center;
  margin-top: $spacing-lg;
}

.footer-text {
  color: $text-secondary;
  margin: $spacing-sm 0;
  font-size: $font-size-lg;
  line-height: $line-height-relaxed;
}

.footer-link {
  @include link-base;
  font-weight: $font-weight-medium;
  margin-left: $spacing-xs;
}

.social-login {
  margin-top: $spacing-lg;
  @include flex-center;
  gap: $spacing-md;
}

.social-login i {
  font-size: $font-size-2xl;
  color: $gray-400;
  cursor: pointer;
  transition: $transition-base;
  padding: $spacing-sm;
  border-radius: $border-radius-full;

  &:hover {
    color: $primary-color;
    background-color: rgba($primary-color, 0.1);
    transform: translateY(-2px);
  }
}

/* Responsive Design */
@include mobile {
  .banner-title {
    font-size: $font-size-3xl;
  }

  .login-card {
    margin: $spacing-lg;
    padding: $spacing-xl $spacing-lg;
  }

  .form-wrapper {
    padding: 0 $spacing-sm;
  }

  .code-container {
    flex-direction: column;
    gap: $spacing-sm;
  }

  .code-button {
    width: 100%;
    min-width: auto;
  }


  .login-container {
    padding: $spacing-2xl $spacing-md;
  }

  .login-card {
    margin: $spacing-sm;
    padding: $spacing-lg $spacing-md;
  }
}
</style>