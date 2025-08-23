<template>
  <div class="register-page" :class="{ 'page-ready': pageReady }">
    <!-- Page Banner -->
    <PageBanner :title="$t('register.title') || '用户注册'" />

    <!-- Register Form Section -->
    <div class="register-container">
      <div class="form-wrapper">
        <div class="register-card" ref="registerCard">
          <div class="register-header">
            <img :src="logoUrl" alt="AUTO EASE EXPERT CO., LTD" class="logo">
            <h2 class="register-title">
              {{ $t('register.createAccount') || '创建新账户' }}
            </h2>
            <p class="register-subtitle">
              {{ $t('register.subtitle') || '请填写以下信息完成注册' }}
            </p>
          </div>

          <el-form :model="form" :rules="rules" ref="formRef" class="register-form" autocomplete="off">
            <el-form-item prop="email">
              <FormInput v-model="form.email" :placeholder="$t('register.emailPlaceholder') || '请输入邮箱地址'"
                :prefix-icon="Message" autocomplete="new-email" />
            </el-form-item>

            <el-form-item prop="password">
              <FormInput v-model="form.password" type="password"
                :placeholder="$t('register.passwordPlaceholder') || '请输入密码（至少8位，包含字母和数字）'" :prefix-icon="Lock"
                :show-password="true" autocomplete="new-password" />
            </el-form-item>

            <el-form-item prop="confirmPassword">
              <FormInput v-model="form.confirmPassword" type="password"
                :placeholder="$t('register.confirmPasswordPlaceholder') || '请再次输入密码'" :prefix-icon="Lock"
                :show-password="true" autocomplete="new-password" />
            </el-form-item>

            <el-form-item prop="captcha">
              <div class="captcha-container">
                <FormInput v-model="form.captcha" :placeholder="$t('register.captchaPlaceholder') || '请输入验证码'"
                  :prefix-icon="PictureIcon" class="captcha-input" />
                <img :src="captchaUrl" @click="refreshCaptcha" class="captcha-img"
                  :alt="$t('register.captchaAlt') || '验证码'" :title="$t('register.captchaRefresh') || '点击刷新验证码'" />
              </div>
            </el-form-item>

            <el-form-item prop="agree" class="agree-form">
              <el-checkbox v-model="form.agree" class="agreement-checkbox">
                {{ $t('register.agreeText') || '我已阅读并同意' }}
                <a href="/user-agreement" target="_blank" class="agreement-link">
                  {{ $t('register.userAgreement') || '用户协议' }}
                </a>
              </el-checkbox>
            </el-form-item>

            <el-form-item class="button-form-item">
              <button type="button" @click.prevent="submitForm" :disabled="loading" class="register-button">
                {{ loading ? ($t('register.registering') || '注册中...') : ($t('register.register') || '注册') }}
              </button>
            </el-form-item>
          </el-form>

          <div class="register-footer">
            <p class="footer-text">
              {{ $t('register.hasAccount') || '已有账号？' }}
              <router-link to="/login" class="footer-link">
                {{ $t('register.goLogin') || '立即登录' }}
              </router-link>
            </p>
            <p class="footer-text">
              {{ $t('register.forgotPassword') || '忘记密码？' }}
              <router-link to="/forgot-password" class="footer-link">
                {{ $t('register.resetPassword') || '找回密码' }}
              </router-link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Message, Lock, Picture as PictureIcon } from '@element-plus/icons-vue'
import { markRaw } from 'vue'
import FormInput from '@/components/common/FormInput.vue'
import PageBanner from '@/components/common/PageBanner.vue'

export default {
  name: 'UserRegister',
  components: {
    FormInput,
    PageBanner
  },
  data() {
    return {
      pageReady: false,
      form: {
        email: '',
        password: '',
        confirmPassword: '',
        captcha: '',
        agree: false
      },
      rules: {
        email: [
          { required: true, message: this.$t('register.validation.emailRequired'), trigger: 'blur' },
          { type: 'email', message: this.$t('register.validation.emailFormat'), trigger: 'blur' }
        ],
        password: [
          { required: true, message: this.$t('register.validation.passwordRequired'), trigger: 'blur' },
          { min: 8, message: this.$t('register.validation.passwordLength'), trigger: 'blur' },
          { validator: (rule, value, callback) => {
              if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=]{8,}$/.test(value)) {
                callback(new Error(this.$t('register.validation.passwordFormat')));
              } else {
                callback();
              }
            }, trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: this.$t('register.validation.confirmPasswordRequired'), trigger: 'blur' },
          { validator: (rule, value, callback) => {
              if (value !== this.form.password) {
                callback(new Error(this.$t('register.validation.passwordMismatch')));
              } else {
                callback();
              }
            }, trigger: 'blur' }
        ],
        captcha: [
          { required: true, message: this.$t('register.validation.captchaRequired'), trigger: 'blur' }
        ],
        agree: [
          { required: true, type: 'boolean', validator: (rule, value, callback) => {
              if (!value) callback(new Error(this.$t('register.validation.agreeRequired')));
              else callback();
            }, trigger: 'change' }
        ]
      },
      loading: false,
      captchaUrl: '/api/users/captcha?'+Date.now(),
      logoUrl: '/static/images/logo.png',
      // 图标组件
      Message,
      Lock: markRaw(Lock),
      PictureIcon
    }
  },
  mounted() {
    // 立即计算并设置初始滚动位置，避免闪烁
    this.$nextTick(() => {
      this.setInitialPosition();
    });
  },
  methods: {
    setInitialPosition() {
      try {
        // 等待DOM完全渲染
        setTimeout(() => {
          const registerCard = this.$refs.registerCard;
          
          if (registerCard) {
            // 计算表单位置
            const cardRect = registerCard.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const cardHeight = cardRect.height;
            
            // 计算目标滚动位置
            let targetScrollTop;
            
            if (window.innerWidth <= 767) {
              // 移动端：滚动到表单顶部，留出一些空间
              targetScrollTop = window.pageYOffset + cardRect.top - 50;
            } else {
              // 桌面端：让表单在视窗中居中
              targetScrollTop = window.pageYOffset + cardRect.top - (viewportHeight - cardHeight) / 2;
            }
            
            // 确保滚动位置在有效范围内
            const maxScrollTop = document.documentElement.scrollHeight - viewportHeight;
            targetScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop));
            
            // 立即设置滚动位置（无动画）
            window.scrollTo(0, targetScrollTop);
            
            // 显示页面内容
            this.pageReady = true;
          }
        }, 100); // 减少延迟时间
      } catch (error) {
        console.warn('设置初始位置失败:', error);
        // 即使失败也要显示页面
        this.pageReady = true;
      }
    },
    jumpToRegisterForm() {
      try {
        // 查找注册表单容器
        const registerContainer = document.querySelector('.register-container');
        const registerCard = document.querySelector('.register-card');
        
        if (registerContainer && registerCard) {
          // 计算滚动位置 - 让表单在视窗中居中
          const cardRect = registerCard.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const cardHeight = cardRect.height;
          
          // 计算目标滚动位置
          let targetScrollTop;
          
          // 移动端和桌面端使用不同的滚动策略
          if (window.innerWidth <= 767) {
            // 移动端：滚动到表单顶部，留出一些空间
            targetScrollTop = window.pageYOffset + cardRect.top - 50;
          } else {
            // 桌面端：让表单在视窗中居中
            targetScrollTop = window.pageYOffset + cardRect.top - (viewportHeight - cardHeight) / 2;
          }
          
          // 确保滚动位置不会超出页面范围
          const maxScrollTop = document.documentElement.scrollHeight - viewportHeight;
          targetScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop));
          
          // 瞬间跳转到目标位置（移除 behavior: 'smooth'）
          window.scrollTo({
            top: targetScrollTop,
            behavior: 'auto'
          });
        }
      } catch (error) {
        console.warn('自动跳转失败:', error);
      }
    },
    refreshCaptcha() {
      this.captchaUrl = '/api/users/captcha?' + Date.now();
    },
    submitForm() {
      this.$refs.formRef.validate(async (valid, fields) => {
        if (!valid) {
          // 显示第一个验证错误
          const firstErrorField = Object.keys(fields)[0];
          const firstError = fields[firstErrorField][0];
          this.$messageHandler.showError(firstError.message, 'register.error.validationFailed','notification');
          return;
        }
        
        this.loading = true;
        try {
          const res = await this.$api.postWithErrorHandler('/users/register', {
            email: this.form.email,
            password: this.form.password,
            captcha: this.form.captcha
          });
          if (res.success) {
            this.$messageHandler.showSuccessAlert(
              this.$t('register.success.message'), 
              this.$t('register.success.title'), 
              null,
              () => {
                this.$router.push('/login');
              }
            );
          } else {
            this.$messageHandler.showError(res.message, 'register.error.failed');
            this.refreshCaptcha();
          }
        } catch (error) {
          console.error('注册失败:', error);
          this.$messageHandler.showError(error, 'register.error.failed');
          this.refreshCaptcha();
        } finally {
          this.loading = false;
        }
      });
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';
@import '@/assets/styles/_mixins.scss';

/* Register Page */
.register-page {
  min-height: 100vh;
  background-color: #f8f9fa;
  @include flex-column;

  /* 防闪烁：初始状态隐藏内容 */
  opacity: 0;
  transition: opacity 0.2s ease-in-out;

  /* 页面就绪后显示内容 */
  &.page-ready {
    opacity: 1;
  }
}

/* Register Container */
.register-container {
  padding: $auth-container-padding;
  background: #f8f9fa;
  min-height: $auth-container-min-height;
  width: 100%;
}

.form-wrapper {
  max-width: $auth-form-max-width;
  margin: 0 auto;
  padding: $auth-form-padding;
  display: flex;
  justify-content: center;
}

.register-card {
  width: 100%;
  max-width: 550px;
  margin: 0 auto;
  @include card-hover;
  padding: $spacing-2xl;
  border: $auth-card-border;
}

.register-card:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.register-header {
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

.register-title {
  text-align: center;
  font-size: $auth-title-font-size;
  font-weight: $font-weight-bold;
  color: $auth-title-color;
  margin: $auth-title-margin;
  letter-spacing: $auth-title-letter-spacing;
  font-family: Arial, sans-serif;
}

.register-subtitle {
  color: $text-secondary;
  font-size: $font-size-xl;
  max-width: 1000px;
  margin: 0 auto;
  line-height: $line-height-relaxed;
}

/* Form Styles */
.register-form {
  margin-top: $spacing-lg;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.register-form .el-form-item {
  margin-bottom: $auth-form-item-margin;
  display: flex;
  align-items: center;
}

.form-input {
  font-family: Arial, sans-serif;
  font-size: $auth-form-input-font-size;
}

/* Captcha Container */
.captcha-container {
  display: flex;
  gap: $captcha-container-gap;
  align-items: stretch;
  width: 100%;
}

.captcha-input {
  flex: 1;
}

.captcha-img {
  height: $captcha-img-height;
  width: $captcha-img-width;
  cursor: pointer;
  border-radius: $captcha-img-border-radius;
  border: $captcha-img-border;
  transition: $transition-base;
  background-color: $captcha-img-bg;
  object-fit: cover;
  flex-shrink: 0;
}

.captcha-img:hover {
  border-color: #dc2626;
}

.agree-form {
  @include flex-between;
  margin-bottom: $spacing-lg;
  font-size: $font-size-xl;
}

/* Agreement Checkbox */
.agreement-checkbox {
  line-height: $line-height-relaxed;
  font-size: $font-size-lg !important;
  color: $text-secondary;
  margin-left: $agreement-checkbox-margin;
  padding-left: $agreement-checkbox-padding;
}

/* 确保Element UI checkbox组件的字体大小 */
:deep(.el-checkbox__label) {
  font-size: $font-size-lg !important;
}

.agreement-link {
  color: $agreement-link-color;
  text-decoration: none;
  transition: color 0.3s ease;
}

.agreement-link:hover {
  color: #b91c1c;
  text-decoration: underline;
}



/* Footer */
.register-footer {
  text-align: center;
  margin-top: $auth-footer-margin-top;
  padding-top: $auth-footer-padding-top;
  border-top: $auth-footer-border-top;
}


.footer-link {
  color: $auth-footer-link-color;
  text-decoration: none;
  font-weight: $auth-footer-link-font-weight;
  transition: color 0.3s ease;
}

.footer-link:hover {
  color: #b91c1c;
  text-decoration: underline;
}

/* Element UI Overrides */
.register-form :deep(.el-form-item) {
  margin-bottom: $spacing-lg;
}

.register-form :deep(.el-form-item__content) {
  display: flex;
  justify-content: center;
  max-width: 100%;
}

/* el-input styles moved to FormInput component */

.register-form :deep(.el-form-item__label) {
  font-size: $font-size-xl;
}

/* Captcha Container */
.captcha-container {
  margin-top: $spacing-sm;
  max-width: 100%;
  display: flex;
  gap: $spacing-sm;
  align-items: center;
}

.captcha-input {
  flex: 1;
  width: 100%;
}

.captcha-img {
  height: 48px;
  cursor: pointer;
  border: 1px solid #d1d5db;
  transition: all 0.3s ease;
  background-color: #f9fafb;
  object-fit: cover;
  flex: 0 0 auto;
}

.captcha-img:hover {
  border-color: $captcha-img-hover-border;
  background-color: $captcha-img-hover-bg;
}

/* Agreement Link */
.agreement-link {
  color: $primary-color;
  text-decoration: none;
  font-weight: $font-weight-medium;
  transition: color 0.3s ease;
}

.agreement-link:hover {
  color: darken($primary-color, 10%);
  text-decoration: underline;
}

/* Register Button */
.register-button {
  width: 100%;
  @include button-primary;
  @include button-lg;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  margin-top: $spacing-sm;

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
.register-footer {
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

:deep(.el-form-item:not(.button-form-item) .el-form-item__content) {
  width: 100%;
}

/* 确保协议复选框与其他输入框左对齐 */
:deep(.agree-form .el-form-item__content) {
  width: 100%;
  justify-content: flex-start;
}

/* 确保注册按钮与输入框宽度一致 */
:deep(.button-form-item .el-form-item__content) {
  width: 100%;
}

:deep(.button-form-item) {
  display: flex;
  justify-content: center;
  margin-left: 0;
  margin-right: 0;
}

:deep(.el-form-item__error) {
  color: #dc2626;
  font-family: Arial, sans-serif;
  font-size: $auth-form-error-font-size;
  margin-top: $auth-form-error-margin-top;
}

/* Responsive Design */
@include mobile {
  .register-container {
    padding: $spacing-lg $spacing-sm;
    min-height: calc(100vh - 200px);
  }

  .form-wrapper {
    padding: 0;
    max-width: 100%;
  }

  .register-card {
    margin: 0;
    padding: $spacing-lg $spacing-md;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }

  .logo {
    width: 120px;
    max-height: 60px;
  }

  .register-title {
    font-size: $font-size-3xl;
    margin: $spacing-md 0 $spacing-sm 0;
  }

  .register-subtitle {
    font-size: $font-size-lg;
    margin-bottom: $spacing-lg;
  }

  .register-form :deep(.el-form-item) {
    margin-bottom: $spacing-lg;
  }

  .captcha-container {
    flex-direction: column;
    gap: $spacing-md;
    align-items: stretch;
  }

  .captcha-img {
    width: 100%;
    height: 48px;
    max-width: 200px;
    align-self: center;
  }

  .agreement-checkbox :deep(.el-checkbox__label) {
    font-size: $font-size-lg !important;
    line-height: 1.6;
  }

  .register-button {
    height: 48px;
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
  }

  .footer-text {
    font-size: $font-size-lg;
    line-height: 1.6;
    margin: $spacing-md 0;
  }
}

/* 超小屏幕适配 */
@media (max-width: 480px) {
  .register-container {
    padding: $spacing-md $spacing-xs;
  }

  .register-card {
    padding: $spacing-md $spacing-sm;
  }

  .logo {
    width: 100px;
    max-height: 50px;
  }

  .register-title {
    font-size: $font-size-2xl;
  }

  .register-subtitle {
    font-size: $font-size-md;
  }

  .agreement-checkbox :deep(.el-checkbox__label) {
    font-size: $font-size-md !important;
  }

  .register-button {
    height: 44px;
    font-size: $font-size-md;
  }

  .footer-text {
    font-size: $font-size-md;
  }
}
</style>