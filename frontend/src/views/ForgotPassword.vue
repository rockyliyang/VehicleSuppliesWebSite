<template>
  <div class="forgot-password-page">
    <!-- Page Banner -->
    <PageBanner :title="$t('forgotPassword.title') || '重置密码'" />

    <!-- Forgot Password Form Section -->
    <div class="forgot-password-container">
      <div class="form-wrapper">
        <div class="forgot-password-card">
          <div class="forgot-password-header">
            <img :src="logoUrl" alt="AUTO EASE EXPERT CO., LTD" class="logo">
            <h2 class="forgot-password-title">
              {{ $t('forgotPassword.resetPassword') || '重置密码' }}
            </h2>
            <p class="forgot-password-subtitle">
              {{ $t('forgotPassword.subtitle') || '请输入您的邮箱地址，我们将发送重置密码链接到您的邮箱' }}
            </p>
          </div>

          <el-form :model="form" :rules="rules" ref="formRef" class="forgot-password-form">
            <el-form-item prop="email">
              <FormInput v-model="form.email" :placeholder="$t('forgotPassword.emailPlaceholder') || '请输入注册时使用的邮箱地址'"
                :prefix-icon="Message" />
            </el-form-item>

            <el-form-item prop="captcha">
              <div class="captcha-container">
                <FormInput v-model="form.captcha" :placeholder="$t('forgotPassword.captchaPlaceholder') || '请输入验证码'"
                  :prefix-icon="PictureIcon" class="captcha-input" />
                <img :src="captchaUrl" @click="refreshCaptcha" class="captcha-img"
                  :alt="$t('forgotPassword.captchaAlt') || '验证码'"
                  :title="$t('forgotPassword.captchaRefresh') || '点击刷新验证码'" />
              </div>
            </el-form-item>

            <el-form-item class="button-form-item">
              <button @click="submitForm" :disabled="loading" class="forgot-password-button">
                {{ loading ? ($t('forgotPassword.sending') || '发送中...') : ($t('forgotPassword.sendResetLink') ||
                '发送重置链接') }}
              </button>
            </el-form-item>
          </el-form>

          <div class="forgot-password-footer">
            <p class="footer-text">
              {{ $t('forgotPassword.rememberPassword') || '想起密码了？' }}
              <router-link to="/login" class="footer-link">
                {{ $t('forgotPassword.backToLogin') || '返回登录' }}
              </router-link>
            </p>
            <p class="footer-text">
              {{ $t('forgotPassword.noAccount') || '还没有账号？' }}
              <router-link to="/register" class="footer-link">
                {{ $t('forgotPassword.createAccount') || '立即注册' }}
              </router-link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Message, Picture as PictureIcon } from '@element-plus/icons-vue'
import FormInput from '@/components/common/FormInput.vue'
import PageBanner from '@/components/common/PageBanner.vue'

export default {
  name: 'ForgotPassword',
  components: {
    FormInput,
    PageBanner
  },
  data() {
    return {
      // 图标组件
      Message,
      PictureIcon,
      form: {
        email: '',
        captcha: ''
      },
      rules: {
        email: [
          { required: true, message: this.$t('forgotPassword.validation.emailRequired') || '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: this.$t('forgotPassword.validation.emailFormat') || '邮箱格式不正确', trigger: 'blur' }
        ],
        captcha: [
          { required: true, message: this.$t('forgotPassword.validation.captchaRequired') || '请输入验证码', trigger: 'blur' }
        ]
      },
      loading: false,
      captchaUrl: '/api/users/captcha?'+Date.now(),
      logoUrl: '/static/images/logo.png'
    }
  },
  methods: {
    refreshCaptcha() {
      this.captchaUrl = '/api/users/captcha?' + Date.now();
    },
    submitForm() {
      this.$refs.formRef.validate(async valid => {
        if (!valid) return;
        this.loading = true;
        try {
          const res = await this.$api.postWithErrorHandler('/users/forgot-password', {
            email: this.form.email,
            captcha: this.form.captcha
          });
          if (res.success) {
            this.$messageHandler.showSuccessAlert(
              this.$t('forgotPassword.success.message') || '重置密码链接已发送到您的邮箱，请查收！',
              'forgotPassword.success.title',
              null,
              () => {
                this.$router.push('/login');
              }
            );
          } else {
            this.$messageHandler.showError(res.message, 'forgotPassword.error.failed');
            this.refreshCaptcha();
          }
        } catch (e) {
          this.$messageHandler.showError(e, 'forgotPassword.error.failed');
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

/* Main Container */
.forgot-password-page {
  min-height: 100vh;
  background-color: $gray-100;
}

.forgot-password-container {
  background: $gray-50;
  min-height: calc(100vh - 200px);
  padding: $spacing-4xl 0;
  @include flex-center;
}

.form-wrapper {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 0 $spacing-lg;
}

.forgot-password-card {
  @include card;
  padding: $spacing-2xl;
  border: 1px solid $gray-200;
  position: relative;
  overflow: hidden;
}

/* Header */
.forgot-password-header {
  text-align: center;
  margin-bottom: $spacing-2xl;
}

.logo {
  width: 300px;
  height: auto;
  max-height: 100px;
  object-fit: contain;
  margin: 0 auto $spacing-lg auto;
  display: block;
}

.forgot-password-title {
  font-size: $font-size-4xl;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin: 0 0 $spacing-sm 0;
  letter-spacing: -0.025em;
}

.forgot-password-subtitle {
  color: $text-secondary;
  font-size: $font-size-xl;
  margin: 0;
  line-height: $line-height-relaxed;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

/* Form */
.forgot-password-form {
  margin-bottom: $spacing-xl;
}

/* Captcha */
.captcha-container {
  @include flex-start;
  gap: $spacing-sm;
  width: 100%;
}

.captcha-input {
  flex: 1;
}

.captcha-img {
  width: 120px;
  height: 48px;
  border: 1px solid $gray-300;
  border-radius: $border-radius-md;
  cursor: pointer;
  transition: $transition-base;
  object-fit: cover;
}

.captcha-img:hover {
  border-color: $gray-400;
}

/* Button */
.forgot-password-button {
  @include button-primary;
  @include button-lg;
  width: 100%;
  max-width: 400px;
  height: 48px;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  border-radius: $border-radius-md;
  transition: $transition-slow;
  box-shadow: $shadow-md;
  position: relative;
  overflow: hidden;
}

.forgot-password-button:hover:not(:disabled) {
  background-color: $primary-dark;
  box-shadow: $shadow-lg;
  transform: translateY(-1px);
}

.forgot-password-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: $shadow-md;
}

.forgot-password-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Footer */
.forgot-password-footer {
  text-align: center;
  border-top: 1px solid $gray-200;
  padding-top: $spacing-xl;
}

.footer-text {
  color: $text-secondary;
  font-size: $font-size-lg;
  margin: 0 0 $spacing-sm 0;
  line-height: $line-height-relaxed;
}

.footer-text:last-child {
  margin-bottom: 0;
}

.footer-link {
  color: $primary-color;
  text-decoration: none;
  font-weight: $font-weight-medium;
  transition: $transition-base;
}

.footer-link:hover {
  color: $primary-dark;
  text-decoration: underline;
}

/* Element UI Overrides */
:deep(.el-form-item__content) {
  width: 100%;
  display: flex;
  justify-content: center;
  line-height: normal;
  margin-left: 0 !important;
}

/* el-input styles moved to FormInput component */

:deep(.el-form-item) {
  margin-bottom: $spacing-xl;
  display: flex;
  justify-content: center;
  width: 100%;
}

:deep(.el-form-item:not(.button-form-item) .el-form-item__content) {
  max-width: 400px;
  width: 100%;
}

:deep(.button-form-item) {
  display: flex;
  justify-content: center;
  margin-left: 0;
  margin-right: 0;
}

:deep(.button-form-item .el-form-item__content) {
  display: flex;
  justify-content: center;
  margin-left: 0 !important;
  width: 100%;
}

:deep(.el-form-item__error) {
  color: $error-color;
  font-family: $font-family-base;
  font-size: $font-size-xs;
  margin-top: $spacing-xs;
}

/* Responsive Design */
@include mobile {
  .forgot-password-card {
    margin: 0 $spacing-md;
    padding: $spacing-xl $spacing-lg;
  }

  .forgot-password-container {
    padding: $spacing-2xl 0;
  }
}
</style>