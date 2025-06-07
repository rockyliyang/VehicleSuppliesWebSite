<template>
    <div class="reset-password-page">
        <!-- Page Banner -->
        <PageBanner :title="$t('resetPassword.title') || '设置新密码'" />

        <!-- Reset Password Form Section -->
        <div class="reset-password-container">
            <div class="form-wrapper">
                <div class="reset-password-card">
                    <div class="reset-password-header">
                        <img :src="logoUrl" alt="AUTO EASE EXPERT CO., LTD" class="logo">
                        <h2 class="reset-password-title">
                            {{ $t('resetPassword.setNewPassword') || '设置新密码' }}
                        </h2>
                        <p class="reset-password-subtitle">
                            {{ $t('resetPassword.subtitle') || '请输入您的新密码，密码需要包含字母和数字，至少8位' }}
                        </p>
                    </div>

                    <el-form :model="form" :rules="rules" ref="formRef" class="reset-password-form">
                        <el-form-item prop="password">
                            <FormInput v-model="form.password" type="password"
                                :placeholder="$t('resetPassword.passwordPlaceholder') || '请输入新密码（至少8位，包含字母和数字）'"
                                :prefix-icon="Lock" :show-password="true" />
                        </el-form-item>

                        <el-form-item prop="confirmPassword">
                            <FormInput v-model="form.confirmPassword" type="password"
                                :placeholder="$t('resetPassword.confirmPasswordPlaceholder') || '请再次输入新密码'"
                                :prefix-icon="Lock" :show-password="true" />
                        </el-form-item>

                        <el-form-item class="button-form-item">
                            <button @click="submitForm" :disabled="loading" class="reset-password-button">
                                {{ loading ? ($t('resetPassword.saving') || '保存中...') :
                                ($t('resetPassword.savePassword') || '保存密码') }}
                            </button>
                        </el-form-item>
                    </el-form>

                    <div class="reset-password-footer">
                        <p class="footer-text">
                            {{ $t('resetPassword.rememberPassword') || '想起密码了？' }}
                            <router-link to="/login" class="footer-link">
                                {{ $t('resetPassword.backToLogin') || '返回登录' }}
                            </router-link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { Lock } from '@element-plus/icons-vue'
import FormInput from '@/components/common/FormInput.vue'
import PageBanner from '@/components/common/PageBanner.vue'

export default {
  name: 'ResetPassword',
  components: {
    FormInput,
    PageBanner
  },
  data() {
    return {
      // 图标组件
      Lock,
      form: {
        password: '',
        confirmPassword: ''
      },
      rules: {
        password: [
          { required: true, message: this.$t('resetPassword.validation.passwordRequired') || '请输入密码', trigger: 'blur' },
          { min: 8, message: this.$t('resetPassword.validation.passwordLength') || '密码至少8位', trigger: 'blur' },
          { validator: (rule, value, callback) => {
              if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=]{8,}$/.test(value)) {
                callback(new Error(this.$t('resetPassword.validation.passwordFormat') || '密码需包含字母和数字'));
              } else {
                callback();
              }
            }, trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: this.$t('resetPassword.validation.confirmPasswordRequired') || '请确认密码', trigger: 'blur' },
          { validator: (rule, value, callback) => {
              if (value !== this.form.password) {
                callback(new Error(this.$t('resetPassword.validation.passwordMismatch') || '两次输入的密码不一致'));
              } else {
                callback();
              }
            }, trigger: 'blur' }
        ]
      },
      loading: false,
      logoUrl: '/static/images/logo.png',
      token: ''
    }
  },
  created() {
    // 从URL参数中获取重置密码的token
    this.token = this.$route.query.token;
    if (!this.token) {
      this.$messageHandler.showError(null, 'resetPassword.error.invalidToken');
      this.$router.push('/login');
    }
  },
  methods: {
    submitForm() {
      this.$refs.formRef.validate(async valid => {
        if (!valid) return;
        this.loading = true;
        try {
          const res = await this.$api.postWithErrorHandler('/users/reset-password', {
            token: this.token,
            password: this.form.password
          });
          if (res.success) {
            this.$alert(
              this.$t('resetPassword.success.message') || '密码重置成功，请使用新密码登录！', 
              this.$t('resetPassword.success.title') || '重置成功', 
              {
                confirmButtonText: this.$t('resetPassword.success.goToLogin') || '去登录',
                callback: () => {
                  this.$router.push('/login');
                }
              }
            );
          } else {
            this.$messageHandler.showError(res.message, 'resetPassword.error.failed');
          }
        } catch (e) {
          this.$messageHandler.showError(e, 'resetPassword.error.failed');
        } finally {
          this.loading = false;
        }
      });
    }
  }
}
</script>

<style scoped>


.banner-content {
    position: relative;
    z-index: 1;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.banner-title {
    font-size: 3rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    letter-spacing: -0.025em;
}

.banner-divider {
    width: 80px;
    height: 4px;
    background: #ffffff;
    margin: 20px auto 0;
    border-radius: 2px;
    opacity: 0.9;
}

/* Main Container */
.reset-password-container {
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

.reset-password-card {
    background: #ffffff;
    border-radius: 1rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    padding: 50px 40px;
    border: 1px solid #e5e7eb;
    position: relative;
    overflow: hidden;
}

.reset-password-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #dc2626, #b91c1c);
}

/* Header */
.reset-password-header {
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

.reset-password-title {
    font-size: 1.875rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 12px 0;
    letter-spacing: -0.025em;
}

.reset-password-subtitle {
    color: #6b7280;
    font-size: 1rem;
    margin: 0;
    line-height: 1.6;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
}

/* Form */
.reset-password-form {
    margin-bottom: 30px;
}

/* Button */
.reset-password-button {
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

.reset-password-button:hover:not(:disabled) {
    background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    transform: translateY(-1px);
}

.reset-password-button:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.reset-password-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

/* Footer */
.reset-password-footer {
    text-align: center;
    border-top: 1px solid #e5e7eb;
    padding-top: 30px;
}

.footer-text {
    color: #6b7280;
    font-size: 0.875rem;
    margin: 0;
    line-height: 1.5;
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

:deep(.el-input__suffix) {
    position: relative;
    right: 0;
    margin-left: 8px;
    color: #6b7280;
    height: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

:deep(.el-input__prefix .el-icon),
:deep(.el-input__suffix .el-icon) {
    font-size: 18px;
}

:deep(.el-input__password) {
    color: #6b7280;
    cursor: pointer;
}

:deep(.el-input__password:hover) {
    color: #dc2626;
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
    .reset-password-card {
        margin: 0 1rem;
        padding: 30px 20px;
    }



    .reset-password-container {
        padding: 40px 0;
    }
}
</style>