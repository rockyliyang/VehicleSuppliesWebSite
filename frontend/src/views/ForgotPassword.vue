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
            this.$alert(
              this.$t('forgotPassword.success.message') || '重置密码链接已发送到您的邮箱，请查收！', 
              this.$t('forgotPassword.success.title') || '发送成功', 
              {
                confirmButtonText: this.$t('forgotPassword.success.confirm') || '确定',
                callback: () => {
                  this.$router.push('/login');
                }
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

<style scoped>
/* Main Container */
.forgot-password-container {
  background: #f9fafb;
  min-height: calc(100vh - 200px);
  padding: 80px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-wrapper {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 0 20px;
}

.forgot-password-card {
  background: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  padding: 50px 40px;
  border: 1px solid #e5e7eb;
  position: relative;
  overflow: hidden;
}

.forgot-password-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #dc2626, #b91c1c);
}

/* Header */
.forgot-password-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-bottom: 20px;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.forgot-password-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 12px 0;
  letter-spacing: -0.025em;
}

.forgot-password-subtitle {
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
  line-height: 1.6;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

/* Form */
.forgot-password-form {
  margin-bottom: 30px;
}

/* Captcha */
.captcha-container {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
}

.captcha-input {
  flex: 1;
}

.captcha-img {
  width: 120px;
  height: 48px;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: border-color 0.3s ease;
  object-fit: cover;
}

.captcha-img:hover {
  border-color: #9ca3af;
}

/* Button */
.forgot-password-button {
  width: 100%;
  max-width: 400px;
  height: 48px;
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: #ffffff;
  border: none;
  border-radius: 0.375rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
}

.forgot-password-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.forgot-password-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.forgot-password-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Footer */
.forgot-password-footer {
  text-align: center;
  border-top: 1px solid #e5e7eb;
  padding-top: 30px;
}

.footer-text {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.footer-text:last-child {
  margin-bottom: 0;
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
:deep(.el-form-item__content) {
  width: 100%;
  display: flex;
  justify-content: center;
  line-height: normal;
  margin-left: 0 !important;
}

:deep(.el-input) {
  width: 100%;
}

:deep(.el-input__wrapper) {
  width: 100% !important;
  height: 48px;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  background-color: #ffffff;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 0 12px;
}

:deep(.el-input__wrapper:hover) {
  border-color: #9ca3af;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

:deep(.el-input__inner) {
  width: 100% !important;
  height: 100%;
  border: none;
  border-radius: 0;
  font-family: Arial, sans-serif;
  font-size: 16px;
  padding: 0 0px;
  background-color: transparent;
  transition: none;
  line-height: 48px;
  box-sizing: border-box;
  outline: none;
  text-align: left;
}

:deep(.el-input__inner:focus) {
  border: none;
  box-shadow: none;
  background-color: transparent;
}

/* 处理浏览器自动填充样式 */
:deep(.el-input__inner:-webkit-autofill),
:deep(.el-input__inner:-webkit-autofill:hover),
:deep(.el-input__inner:-webkit-autofill:focus),
:deep(.el-input__inner:-webkit-autofill:active) {
  -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
  -webkit-text-fill-color: #374151 !important;
  background-color: #ffffff !important;
  transition: background-color 5000s ease-in-out 0s;
}

:deep(.el-input__prefix) {
  position: relative;
  left: 0;
  margin-right: 8px;
  color: #6b7280;
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-input__prefix .el-icon) {
  font-size: 18px;
}

:deep(.el-form-item) {
  margin-bottom: 1.5rem;
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
  color: #dc2626;
  font-family: Arial, sans-serif;
  font-size: 12px;
  margin-top: 5px;
}

/* Responsive Design */
@media (max-width: 640px) {
  .forgot-password-card {
    margin: 0 1rem;
    padding: 30px 20px;
  }



  .forgot-password-container {
    padding: 40px 0;
  }
}
</style>