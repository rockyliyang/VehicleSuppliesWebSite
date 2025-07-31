<template>
  <div class="login-page">
    <!-- Page Banner -->
    <PageBanner :title="$t('login.title') || '用户登录'" />

    <!-- Login Form Section -->
    <div class="login-container">
      <div class="form-wrapper">
        <LoginDialog
          :show-close-button="false"
          :auto-redirect="true"
          @login-success="handleLoginSuccess"
        />
      </div>
    </div>
  </div>
</template>

<script>
import PageBanner from '@/components/common/PageBanner.vue'
import LoginDialog from '@/components/common/LoginDialog.vue'

export default {
  name: 'UserLogin',
  components: {
    PageBanner,
    LoginDialog
  },
  data() {
    return {
      // 页面级别的数据
    }
  },
  methods: {
    handleLoginSuccess(data) {
      // 登录成功处理
      if (data && data.user) {
        this.$store.commit('setUser', data.user);
      }
      // 页面跳转由LoginDialog组件处理（autoRedirect=true）
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';
@import '@/assets/styles/_mixins.scss';

/* Login Page */
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

/* 登录对话框样式已移至 LoginDialog.vue 组件 */

/* Responsive Design */
@include mobile {
  .form-wrapper {
    padding: 0 $spacing-sm;
  }

  .login-container {
    padding: $spacing-2xl $spacing-md;
  }
}
</style>