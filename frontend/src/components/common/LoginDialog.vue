<template>
  <div class="login-card">
    <div class="login-header">
      <div class="header-content">
        <img :src="logoUrl" alt="AUTO EASE EXPERT CO., LTD" class="logo">
        <h2 class="login-title">
          {{ $t('login.welcome') || '欢迎回来' }}
        </h2>
        <p class="login-subtitle">
          {{ $t('login.subtitle') || '请登录您的账户' }}
        </p>
      </div>
      <button v-if="showCloseButton" @click="closeDialog" class="close-button">
        <el-icon>
          <Close />
        </el-icon>
      </button>
    </div>

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

        <button @click="loginWithGoogle" :disabled="socialLoading.google" class="social-button google-button">
          <GoogleIcon class="social-icon" />
          <span>{{ $t('login.continueWithGoogle') || 'Continue With Google' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
/* global google */
// 使用全局注册的$api替代axios
import { ElMessage } from 'element-plus'
import { User, Lock, PhoneFilled, Message, Close } from '@element-plus/icons-vue'
import FormInput from '@/components/common/FormInput.vue'
import AppleIcon from '@/components/icons/AppleIcon.vue'
import GoogleIcon from '@/components/icons/GoogleIcon.vue'
import FacebookIcon from '@/components/icons/FacebookIcon.vue'
/* eslint-enable no-unused-vars */

export default {
  name: 'LoginDialog',
  components: {
    FormInput,
    //AppleIcon,
    GoogleIcon,
    //FacebookIcon
  },
  props: {
    showCloseButton: {
      type: Boolean,
      default: false
    },
    autoRedirect: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      activeTab: 'account',
      // 图标组件
      User,
      Lock,
      PhoneFilled,
      Message,
      Close,
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
      socialLoading: {
        apple: false,
        google: false,
        facebook: false
      }
    }
  },
  created() {
    this.fetchCompanyLogo();
  },
  mounted() {
    // 登录状态现在通过store初始化时自动恢复
    this.initThirdPartySDKs();
  },
  methods: {
    closeDialog() {
      this.$emit('close')
    },
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
    initThirdPartySDKs() {
      // 初始化Apple Sign In
      if (typeof AppleID !== 'undefined') {
        AppleID.auth.init({
          clientId: process.env.VUE_APP_APPLE_CLIENT_ID || 'your_apple_client_id',
          scope: 'name email',
          redirectURI: window.location.origin + '/login',
          state: 'login',
          usePopup: true
        });
      }
      
      // 初始化Google API
      this.initGoogleAPI();
      
      // 初始化Facebook SDK
      //this.initFacebookSDK();
    },
    
    initGoogleAPI() {
      // 检查Google Identity Services是否已加载
      if (typeof google !== 'undefined' && google.accounts) {
        console.log('Google Identity Services loaded successfully');
      } else {
        // 如果Google Identity Services还未加载，等待一段时间后重试
        setTimeout(() => {
          this.initGoogleAPI();
        }, 500);
      }
    },
    
    initFacebookSDK() {
      // 检查Facebook SDK是否已加载
      if (typeof FB !== 'undefined') {
        const appId = process.env.VUE_APP_FACEBOOK_APP_ID;
        console.log('Facebook SDK loaded, initializing with App ID:', appId);
        
        if (!appId || appId === 'your_facebook_app_id' || appId === 'your_facebook_app_id_here') {
          console.error('Facebook App ID not configured properly. Please set VUE_APP_FACEBOOK_APP_ID in .env file');
          console.warn('Facebook login will be disabled until a valid App ID is configured');
          return;
        }
        
        try {
          // 使用稳定的API版本
          const apiVersion = 'v18.0';
          console.log(`Initializing Facebook SDK with version ${apiVersion}`);
          
          FB.init({
            appId: appId,
            cookie: true,
            xfbml: true,
            version: apiVersion,
            status: true // 启用状态检查
          });
          
          console.log('Facebook SDK initialized successfully');
          
          // 等待SDK完全初始化后再检查登录状态
          setTimeout(() => {
            if (typeof FB.getLoginStatus === 'function') {
              FB.getLoginStatus((response) => {
                console.log('Facebook login status:', response);
                if (response.status === 'connected') {
                  console.log('User is already logged in to Facebook');
                } else if (response.status === 'not_authorized') {
                  console.log('User is logged in to Facebook but not authorized for this app');
                } else {
                  console.log('User is not logged in to Facebook');
                }
              });
            } else {
              console.warn('FB.getLoginStatus is not available');
            }
          }, 100);
          
        } catch (error) {
          console.error('Facebook SDK initialization failed:', error);
          console.error('This may be due to an invalid App ID or network issues');
        }
      } else {
        console.log('Facebook SDK not loaded yet, retrying...');
        // 如果Facebook SDK还未加载，等待一段时间后重试
        setTimeout(() => {
          this.initFacebookSDK();
        }, 500);
      }
    },
    submitLogin() {
      this.$refs.loginForm.validate(async (valid, fields) => {
        if (valid) {
          try {
            this.loading = true
            const response = await this.$api.postWithErrorHandler('users/login', {
              username: this.loginForm.username.trim(),
              password: this.loginForm.password
            })
            // 登录成功，保存用户信息（token已通过cookie设置）
            const { user } = response.data
            this.$store.commit('setUser', user)
            this.$messageHandler.showSuccess(response.message || this.$t('login.success.loginSuccess'), 'login.success.loginSuccess')
            // Header组件已经启动了全局token检查，这里不需要重复启动
            this.$emit('login-success', { user })
            
            // 根据autoRedirect属性决定是否进行页面跳转
            if (this.autoRedirect) {
              this.$router.push(this.$route.query.redirect || '/')
            }
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
            this.$emit('login-success', { user: null }) // 手机登录暂时传递空用户数据
            
            // 根据autoRedirect属性决定是否进行页面跳转
            if (this.autoRedirect) {
              this.$router.push('/')
            }
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
    // 第三方登录方法
    async loginWithApple() {
      try {
        this.socialLoading.apple = true;
        
        // 检查Apple Sign In是否可用
        if (typeof AppleID === 'undefined') {
          throw new Error(this.$t('login.error.appleNotAvailable') || 'Apple Sign In not available');
        }
        
        const response = await AppleID.auth.signIn();
        
        // 发送到后端验证
        const result = await this.$api.postWithErrorHandler('/auth/apple/callback', {
          authorizationCode: response.authorization.code,
          identityToken: response.authorization.id_token,
          user: response.user
        }, {
          fallbackKey: 'login.error.appleAuthFailed'
        });
        
        this.handleLoginSuccess(result.data);
      } catch (error) {
        this.handleLoginError(error, 'Apple');
      } finally {
        this.socialLoading.apple = false;
      }
    },
    
   
    async loginWithGoogle() {
      try {
        this.socialLoading.google = true;
        
        // 检查Google Identity Services是否可用
        if (typeof google === 'undefined' || !google.accounts) {
          throw new Error(this.$t('login.error.googleNotAvailable') || 'Google Identity Services not loaded');
        }
        
        // 直接使用OAuth2弹窗登录，避免One Tap造成的双重弹窗问题
        const tokenResponse = await new Promise((resolve, reject) => {
          const popup = google.accounts.oauth2.initTokenClient({
            client_id: process.env.VUE_APP_GOOGLE_CLIENT_ID || 'your_google_client_id',
            scope: 'email profile openid',
            callback: (response) => {
              if (response.access_token) {
                resolve(response);
              } else {
                reject(new Error('No access token received'));
              }
            },
            error_callback: (error) => {
              reject(error);
            }
          });
          
          // 直接请求访问令牌
          popup.requestAccessToken();
        });
        
        // 获取用户信息
        const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResponse.access_token}`);
        const userInfo = await userInfoResponse.json();
        
        // 发送到后端验证
        const result = await this.$api.postWithErrorHandler('/auth/google/callback', {
          accessToken: tokenResponse.access_token,
          userInfo: userInfo
        }, {
          fallbackKey: 'login.error.googleAuthFailed'
        });
        
        this.handleLoginSuccess(result.data);
        
      } catch (error) {
        this.handleLoginError(error, 'Google');
      } finally {
        this.socialLoading.google = false;
      }
    },
    
    
    async loginWithFacebook() {
      try {
        this.socialLoading.facebook = true;
        console.log('Facebook login initiated...');
        
        // 检查Facebook SDK是否可用
        if (typeof FB === 'undefined') {
          console.error('Facebook SDK not available');
          throw new Error(this.$t('login.error.facebookNotAvailable') || 'Facebook SDK not loaded. Please refresh the page and try again.');
        }
        
        // 检查Facebook SDK是否已初始化
        if (!window.fbAsyncInit || !FB.getAccessToken) {
          console.error('Facebook SDK not properly initialized');
          throw new Error('Facebook SDK not properly initialized. Please refresh the page and try again.');
        }
        
        console.log('Facebook SDK available, calling FB.login...');
        
        // 使用Promise包装FB.login以便更好地处理异步操作
        const loginResponse = await new Promise((resolve, reject) => {
          FB.login((response) => {
            console.log('Facebook login response:', response);
            if (response.authResponse && response.authResponse.accessToken) {
              resolve(response);
            } else if (response.status === 'not_authorized') {
              reject(new Error('User denied Facebook login permission'));
            } else if (response.status === 'unknown') {
              reject(new Error('Facebook login failed. Please try again.'));
            } else {
              reject(new Error(this.$t('login.error.facebookCancelled') || 'Facebook login was cancelled'));
            }
          }, { scope: 'email' });
        });
        
        console.log('Facebook login successful, getting user info...');
        
        // 获取用户信息
        const userInfo = await new Promise((resolve, reject) => {
          FB.api('/me', { fields: 'name,email' }, (response) => {
            console.log('Facebook user info response:', response);
            if (response && !response.error) {
              resolve(response);
            } else {
              reject(new Error('Failed to get user info from Facebook'));
            }
          });
        });
        
        console.log('Sending Facebook auth data to backend...');
        
        // 发送到后端验证
        const result = await this.$api.postWithErrorHandler('/auth/facebook/callback', {
          accessToken: loginResponse.authResponse.accessToken,
          userID: loginResponse.authResponse.userID,
          user: userInfo
        }, {
          fallbackKey: 'login.error.facebookAuthFailed'
        });
        
        console.log('Facebook login completed successfully');
        this.handleLoginSuccess(result.data);
        
      } catch (error) {
        console.error('Facebook login error:', error);
        this.handleLoginError(error, 'Facebook');
      } finally {
        this.socialLoading.facebook = false;
      }
    },
    
    handleLoginSuccess(data) {
      // 保存用户信息
      this.$store.commit('setUser', data.user);
      this.$messageHandler.showSuccess(this.$t('login.success.loginSuccess'), 'login.success.loginSuccess');
      this.$emit('login-success', data);
      
      // 根据autoRedirect属性决定是否进行页面跳转
      if (this.autoRedirect) {
        this.$router.push(this.$route.query.redirect || '/');
      }
    },
    
    handleLoginError(error, provider) {
      console.error(`${provider} login error:`, error);
      
      let errorMessage = this.$t('login.error.thirdPartyFailed') || '第三方登录失败';
      if (error.message) {
        errorMessage = error.message;
      }
      
      this.$messageHandler.showError(errorMessage, 'login.error.thirdPartyFailed');
    }
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

.login-card {
  width: 100%;
  max-width: 550px;
  margin: 0 auto;
  @include card-hover;
  padding: $spacing-2xl;
  border: $auth-card-border;
}

.login-header {
  position: relative;
  text-align: center;
  margin-bottom: $spacing-xl;
}

.header-content {
  text-align: center;
}

.close-button {
  position: absolute;
  top: 0;
  right: 0;
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.3s ease;

  &:hover {
    color: #666;
    background-color: #f5f5f5;
  }
}

.close-button-top {
  position: absolute;
  top: $spacing-md;
  right: $spacing-md;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: $text-secondary;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 10;

  &:hover {
    background-color: $gray-100;
    color: $text-primary;
  }
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
  margin: 0 0 $spacing-md 0;
  line-height: $line-height-relaxed;
}

/* Form Styles */
.login-form {
  margin-top: $spacing-sm;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
}

/* Element UI Overrides */
.login-form :deep(.el-form-item) {
  margin-bottom: $spacing-lg;
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
  margin-bottom: $spacing-md;
}

.login-tabs :deep(.el-tabs__header) {
  margin: 0 0 $spacing-md 0;
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
  margin-bottom: $spacing-md;
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
  margin-top: 0;
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
  margin-top: $spacing-md;
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
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: $spacing-sm;
}

.social-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  height: 48px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.apple-button {
  color: #000;

  &:hover {
    background-color: #f8f8f8;
  }
}

.google-button {
  color: #757575;

  &:hover {
    background-color: #f8f8f8;
  }
}

.facebook-button {
  color: #1877f2;

  &:hover {
    background-color: #f0f2f5;
  }
}

.social-icon {
  width: 20px;
  height: 20px;
}

/* Responsive Design */
@include mobile {
  .login-card {
    margin: 0;
    padding: $spacing-lg $spacing-md;
    border: none;
    border-radius: 0;
    box-shadow: none;
    min-height: auto;
  }

  .login-header {
    margin-bottom: $spacing-lg;
  }

  .logo {
    width: 120px;
    max-height: 60px;
  }

  .login-title {
    font-size: $font-size-3xl;
    margin: $spacing-md 0 $spacing-sm 0;
  }

  .login-subtitle {
    font-size: $font-size-lg;
    margin-bottom: $spacing-lg;
  }

  .login-tabs :deep(.el-tabs__item) {
    font-size: $font-size-lg;
    padding: 0 $spacing-md;
  }

  .login-form :deep(.el-form-item) {
    margin-bottom: $spacing-lg;
  }

  .remember-forgot {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-sm;
    margin-bottom: $spacing-lg;
  }

  .code-container {
    flex-direction: column;
    gap: $spacing-md;
  }

  .code-button {
    width: 100%;
    min-width: auto;
    height: 48px;
    font-size: $font-size-lg;
  }

  .login-button {
    height: 48px;
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
  }

  .social-login {
    gap: $spacing-md;
  }

  .social-button {
    height: 52px;
    font-size: $font-size-lg;
    padding: 0 $spacing-lg;
  }

  .footer-text {
    font-size: $font-size-lg;
    line-height: 1.6;
  }
}

/* 超小屏幕适配 */
@media (max-width: 480px) {
  .login-card {
    padding: $spacing-md $spacing-sm;
  }

  .logo {
    width: 100px;
    max-height: 50px;
  }

  .login-title {
    font-size: $font-size-2xl;
  }

  .login-subtitle {
    font-size: $font-size-md;
  }

  .login-tabs :deep(.el-tabs__item) {
    font-size: $font-size-md;
    padding: 0 $spacing-sm;
  }

  .social-button {
    height: 48px;
    font-size: $font-size-md;
    gap: 8px;
  }

  .social-icon {
    width: 18px;
    height: 18px;
  }
}
</style>