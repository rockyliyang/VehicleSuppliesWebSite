<template>
  <div class="register-page">
    <!-- Page Banner -->
    <div class="page-banner">
      <div class="banner-content">
        <h1 class="banner-title">
          {{ $t('register.title') || '用户注册' }}
        </h1>
        <div class="banner-divider"></div>
      </div>
    </div>

    <!-- Register Form Section -->
    <div class="register-container">
      <div class="form-wrapper">
        <div class="register-card">
          <h2 class="register-title">
            {{ $t('register.createAccount') || '创建新账户' }}
          </h2>
          <p class="register-subtitle">
            {{ $t('register.subtitle') || '请填写以下信息完成注册' }}
          </p>

          <el-form :model="form" :rules="rules" ref="formRef" class="register-form">
            <el-form-item prop="email">
              <el-input v-model="form.email" :placeholder="$t('register.emailPlaceholder') || '请输入邮箱地址'" size="large"
                class="form-input">
                <template #prefix>
                  <el-icon>
                    <Message />
                  </el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="password">
              <el-input v-model="form.password" type="password"
                :placeholder="$t('register.passwordPlaceholder') || '请输入密码（至少8位，包含字母和数字）'" size="large" show-password
                class="form-input">
                <template #prefix>
                  <el-icon>
                    <Lock />
                  </el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="confirmPassword">
              <el-input v-model="form.confirmPassword" type="password"
                :placeholder="$t('register.confirmPasswordPlaceholder') || '请再次输入密码'" size="large" show-password
                class="form-input">
                <template #prefix>
                  <el-icon>
                    <Lock />
                  </el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="captcha">
              <div class="captcha-container">
                <el-input v-model="form.captcha" :placeholder="$t('register.captchaPlaceholder') || '请输入验证码'"
                  size="large" class="captcha-input">
                  <template #prefix>
                    <el-icon>
                      <PictureIcon />
                    </el-icon>
                  </template>
                </el-input>
                <img :src="captchaUrl" @click="refreshCaptcha" class="captcha-img"
                  :alt="$t('register.captchaAlt') || '验证码'" :title="$t('register.captchaRefresh') || '点击刷新验证码'" />
              </div>
            </el-form-item>

            <el-form-item prop="agree">
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
import { ElIcon } from 'element-plus'
import { Message, Lock, Picture as PictureIcon } from '@element-plus/icons-vue'

export default {
  name: 'UserRegister',
  components: {
    ElIcon,
    Message,
    Lock,
    PictureIcon
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
          { required: true, message: this.$t('register.validation.emailRequired') || '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: this.$t('register.validation.emailFormat') || '邮箱格式不正确', trigger: 'blur' }
        ],
        password: [
          { required: true, message: this.$t('register.validation.passwordRequired') || '请输入密码', trigger: 'blur' },
          { min: 8, message: this.$t('register.validation.passwordLength') || '密码至少8位', trigger: 'blur' },
          { validator: (rule, value, callback) => {
              if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=]{8,}$/.test(value)) {
                callback(new Error(this.$t('register.validation.passwordFormat') || '密码需包含字母和数字'));
              } else {
                callback();
              }
            }, trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: this.$t('register.validation.confirmPasswordRequired') || '请确认密码', trigger: 'blur' },
          { validator: (rule, value, callback) => {
              if (value !== this.form.password) {
                callback(new Error(this.$t('register.validation.passwordMismatch') || '两次输入的密码不一致'));
              } else {
                callback();
              }
            }, trigger: 'blur' }
        ],
        captcha: [
          { required: true, message: this.$t('register.validation.captchaRequired') || '请输入验证码', trigger: 'blur' }
        ],
        agree: [
          { required: true, type: 'boolean', validator: (rule, value, callback) => {
              if (!value) callback(new Error(this.$t('register.validation.agreeRequired') || '请同意用户协议'));
              else callback();
            }, trigger: 'change' }
        ]
      },
      loading: false,
      captchaUrl: '/api/users/captcha?'+Date.now()
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
          const res = await this.$api.post('/users/register', {
            email: this.form.email,
            password: this.form.password,
            captcha: this.form.captcha
          });
          if (res.success) {
            this.$alert(
              this.$t('register.success.message') || '注册成功，请前往邮箱激活账号！', 
              this.$t('register.success.title') || '注册成功', 
              {
                confirmButtonText: this.$t('register.success.goToLogin') || '去登录',
                callback: () => {
                  this.$router.push('/login');
                }
              }
            );
          } else {
            this.$message.error(res.message || this.$t('register.error.failed') || '注册失败');
            this.refreshCaptcha();
          }
        } catch (e) {
          this.$message.error(e.response?.data?.message || this.$t('register.error.failed') || '注册失败');
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
/* Page Banner */
.page-banner {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  padding: 60px 0;
  text-align: center;
  width: 100%;
}

.banner-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.banner-title {
  font-family: Arial, sans-serif;
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
  margin: 0 0 1rem 0;
}

.banner-divider {
  width: 6rem;
  height: 0.25rem;
  background-color: white;
  margin: 0 auto;
}

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
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 40px;
  transition: box-shadow 0.3s ease;
}

.register-card:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
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
  text-align: center;
  color: #6b7280;
  margin-bottom: 2rem;
  font-size: 1rem;
  font-family: Arial, sans-serif;
}

/* Form Styles */
.register-form {
  margin-top: 1.5rem;
  max-width: 500px;
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

/* Agreement Checkbox */
.agreement-checkbox {
  font-family: Arial, sans-serif;
  font-size: 14px;
  color: #374151;
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

/* Register Button */
.register-button {
  width: 100%;
  background-color: #dc2626;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 0.375rem;
  font-size: 16px;
  font-weight: 600;
  font-family: Arial, sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.register-button:hover:not(:disabled) {
  background-color: #b91c1c;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.register-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Footer */
.register-footer {
  text-align: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.footer-text {
  color: #6b7280;
  margin-bottom: 0.5rem;
  font-family: Arial, sans-serif;
  font-size: 14px;
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
  /* 恢复行高以确保文本垂直居中 */
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

/* 处理Firefox自动填充样式 */
:deep(.el-input__inner:-moz-autofill) {
  background-color: #ffffff !important;
  color: #374151 !important;
}

/* 处理其他浏览器自动填充样式 */
:deep(.el-input__inner:autofill) {
  background-color: #ffffff !important;
  color: #374151 !important;
}



:deep(.el-input__prefix) {
  position: relative;
  left: 0;
  margin-right: 8px;
  color: #6b7280;
  height: 100%;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

:deep(.el-input__suffix) {
  position: relative;
  right: 0;
  margin-left: 8px;
  height: 100%;
  display: inline-flex;
  align-items: center;
  min-width: 30px;
  justify-content: center;
  flex-shrink: 0;
}

:deep(.el-input__icon) {
  line-height: 48px;
}

:deep(.el-checkbox) {
  color: #374151;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #dc2626;
  border-color: #dc2626;
}

:deep(.el-checkbox__inner:hover) {
  border-color: #dc2626;
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
  /* Ensure no inherited margin */
  width: 100%;
  /* Ensure content area takes full width */
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

  .page-banner {
    padding: 40px 0;
  }

  .page-banner h1 {
    font-size: 2rem;
  }

  .register-container {
    padding: 40px 0;
  }
}
</style>