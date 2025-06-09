<template>
  <div class="register-page">
    <!-- Page Banner -->
    <PageBanner :title="$t('register.title') || '用户注册'" />

    <!-- Register Form Section -->
    <div class="register-container">
      <div class="form-wrapper">
        <div class="register-card">
          <div class="register-header">
            <img :src="logoUrl" alt="AUTO EASE EXPERT CO., LTD" class="logo">
            <h2 class="register-title">
              {{ $t('register.createAccount') || '创建新账户' }}
            </h2>
            <p class="register-subtitle">
              {{ $t('register.subtitle') || '请填写以下信息完成注册' }}
            </p>
          </div>

          <el-form :model="form" :rules="rules" ref="formRef" class="register-form">
            <el-form-item prop="email">
              <FormInput v-model="form.email" :placeholder="$t('register.emailPlaceholder') || '请输入邮箱地址'"
                :prefix-icon="Message" />
            </el-form-item>

            <el-form-item prop="password">
              <FormInput v-model="form.password" type="password"
                :placeholder="$t('register.passwordPlaceholder') || '请输入密码（至少8位，包含字母和数字）'" :prefix-icon="Lock"
                :show-password="true" />
            </el-form-item>

            <el-form-item prop="confirmPassword">
              <FormInput v-model="form.confirmPassword" type="password"
                :placeholder="$t('register.confirmPasswordPlaceholder') || '请再次输入密码'" :prefix-icon="Lock"
                :show-password="true" />
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
              <button @click="submitForm" :disabled="loading" class="register-button">
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
      Lock,
      PictureIcon
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
        } catch (e) {
          this.$messageHandler.showError(e, 'register.error.failed');
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

/* Register Container */
.register-container {
  padding: 80px 0;
  background: #f8f9fa;
  min-height: calc(100vh - 200px);
  width: 100%;
}

.form-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: center;
}

.register-card {
  width: 100%;
  max-width: 550px;
  margin: 0 auto;
  @include card-hover;
  padding: $spacing-2xl;
}

.register-card:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.register-header {
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

.register-title {
  text-align: center;
  font-size: 1.875rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 0.5rem;
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
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
}

.form-input {
  font-family: Arial, sans-serif;
  font-size: 16px;
}

/* Captcha Container */
.captcha-container {
  display: flex;
  gap: 12px;
  align-items: stretch;
  width: 100%;
}

.captcha-input {
  flex: 1;
}

.captcha-img {
  height: 48px;
  width: 120px;
  cursor: pointer;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  transition: border-color 0.3s ease;
  background-color: #ffffff;
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
  margin-left: 0;
  padding-left: 0;
}

/* 确保Element UI checkbox组件的字体大小 */
:deep(.el-checkbox__label) {
  font-size: $font-size-lg !important;
}

.agreement-link {
  color: #dc2626;
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
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}


.footer-link {
  color: #dc2626;
  text-decoration: none;
  font-weight: 500;
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
  border-color: #9ca3af;
  background-color: #f3f4f6;
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
  font-size: 12px;
  margin-top: 5px;
}

/* Responsive Design */
@media (max-width: 640px) {
  .register-card {
    margin: 0 1rem;
    padding: 30px 20px;
  }


  .register-container {
    padding: 40px 0;
  }
}
</style>