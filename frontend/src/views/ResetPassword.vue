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
            this.$messageHandler.showSuccessAlert(
              this.$t('resetPassword.success.message') || '密码重置成功，请使用新密码登录！', 
              'resetPassword.success.title',
              null,
              () => {
                this.$router.push('/login');
              }
            );
            // 延迟跳转到登录页面
            setTimeout(() => {
              this.$router.push('/login');
            }, 2000);
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
e
<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';
@import '@/assets/styles/_mixins.scss';

/* Main Container */
.reset-password-page {
    min-height: 100vh;
    background-color: $gray-100;
}

.reset-password-container {
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

.reset-password-card {
    @include card;
    padding: $spacing-2xl;
    border: 1px solid $gray-200;
    position: relative;
    overflow: hidden;
}

/* Header */
.reset-password-header {
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

.reset-password-title {
    font-size: $font-size-4xl;
    font-weight: $font-weight-bold;
    color: $text-primary;
    margin: 0 0 $spacing-sm 0;
    letter-spacing: -0.025em;
}

.reset-password-subtitle {
    color: $text-secondary;
    font-size: $font-size-xl;
    margin: 0;
    line-height: $line-height-relaxed;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
}

/* Form */
.reset-password-form {
    margin-bottom: $spacing-xl;
}

/* Button */
.reset-password-button {
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

.reset-password-button:hover:not(:disabled) {
    background-color: $primary-dark;
    box-shadow: $shadow-lg;
    transform: translateY(-1px);
}

.reset-password-button:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: $shadow-md;
}

.reset-password-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

/* Footer */
.reset-password-footer {
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

:deep(.el-input) {
    width: 100%;
}

:deep(.el-input__wrapper) {
    width: 100% !important;
    height: 48px;
    border-radius: $border-radius-md;
    border: 1px solid $gray-300;
    background-color: $white;
    transition: $transition-base;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    padding: 0 $spacing-sm;
}

:deep(.el-input__wrapper:hover) {
    border-color: $gray-400;
}

:deep(.el-input__wrapper.is-focus) {
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1);
}

:deep(.el-input__inner) {
    width: 100% !important;
    height: 100%;
    border: none;
    border-radius: 0;
    font-family: $font-family-base;
    font-size: $font-size-xl;
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
    -webkit-box-shadow: 0 0 0 1000px $white inset !important;
    -webkit-text-fill-color: $text-primary !important;
    background-color: $white !important;
    transition: background-color 5000s ease-in-out 0s;
}

:deep(.el-input__prefix) {
    position: relative;
    left: 0;
    margin-right: $spacing-xs;
    color: $text-muted;
    height: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

:deep(.el-input__suffix) {
    position: relative;
    right: 0;
    margin-left: $spacing-xs;
    color: $text-muted;
    height: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

:deep(.el-input__prefix .el-icon),
:deep(.el-input__suffix .el-icon) {
    font-size: $font-size-lg;
}

:deep(.el-input__password) {
    color: $text-muted;
    cursor: pointer;
}

:deep(.el-input__password:hover) {
    color: $primary-color;
}

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
    font-size: $font-size-sm;
    margin-top: $spacing-xs;
}

/* Responsive Design */
@include mobile {
    .reset-password-card {
        margin: $spacing-lg;
        padding: $spacing-xl $spacing-lg;
    }

    .reset-password-container {
        padding: $spacing-2xl $spacing-md;
    }
}
</style>