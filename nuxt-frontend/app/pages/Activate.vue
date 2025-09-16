<template>
  <div class="activate-page">
    <!-- Page Banner -->
    <PageBanner :title="$t('activate.title') || '账号激活'" />

    <!-- Activate Result Section -->
    <div class="activate-container">
      <div class="result-wrapper">
        <div class="activate-card">
          <div class="activate-header">
            <img :src="logoUrl" alt="AUTO EASE EXPERT CO., LTD" class="logo">
            <h2 class="activate-title">
              {{ $t('activate.pageTitle') || '账号激活结果' }}
            </h2>
          </div>

          <div class="activate-message">
            <el-result :icon="resultIcon" :title="resultTitle">
              <template #extra>
                <el-button type="primary" @click="goHome" class="home-button">
                  {{ $t('activate.goHome', 'Go to Login') }}
                </el-button>
              </template>
            </el-result>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useRoute, navigateTo } from '#app'
import PageBanner from '@/components/common/PageBanner.vue';

export default {
  name: 'UserActivate',
  components: {
    PageBanner
  },
  data() {
    return {
      resultIcon: 'success',
      resultTitle: this.$t('activate.success.title') || '激活成功',
      resultSubTitle: this.$t('activate.success.message') || '您的账号已成功激活，正在跳转首页...',
      logoUrl: '/static/images/logo.png'
    }
  },
  mounted() {
    const route = useRoute();
    const token = route.query.token;
    if (!token) {
      this.resultIcon = 'error';
      this.resultTitle = this.$t('activate.error.title') || '激活失败';
      this.resultSubTitle = this.$t('activate.error.invalidToken') || '激活链接无效，请检查链接或联系管理员。';
      return;
    }
    this.$api.getWithErrorHandler(`/users/activate?token=${token}`, {
      fallbackKey: 'activate.error.failed'
    })
      .then(res => {
        if (res.success) {
          this.resultIcon = 'success';
          this.resultTitle = this.$t('activate.success.title') || '激活成功';
          this.resultSubTitle = this.$t('activate.success.message') || '您的账号已成功激活，正在跳转首页...';
          //setTimeout(this.goHome, 2000);
        } else {
          this.resultIcon = 'error';
          this.resultTitle = this.$t('activate.error.title') || '激活失败';
          this.resultSubTitle = res.message || this.$t('activate.error.failed') || '激活失败，请检查链接或联系管理员。';
        }
      })
      .catch(() => {
        this.resultIcon = 'error';
        this.resultTitle = this.$t('activate.error.title') || '激活失败';
        this.resultSubTitle = this.$t('activate.error.networkError') || '激活请求出错，请稍后重试。';
      });
  },
  methods: {
    goHome() {
      navigateTo('/');
    }
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/_variables.scss' as *;
@use '@/assets/styles/_mixins.scss' as *;

/* Activate Container */
.activate-container {
  padding: $auth-container-padding;
  background: $gray-100;
  min-height: $auth-container-min-height;
  width: 100%;
}

.result-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 $spacing-md;
  @include flex-center;
}

.activate-card {
  max-width: $auth-form-max-width;
  margin: 0 auto;
  @include card-hover;
  padding: $spacing-2xl;
}

.activate-header {
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

.activate-title {
  text-align: center;
  font-size: $auth-title-font-size;
  font-weight: $font-weight-bold;
  color: $auth-title-color;
  margin: $auth-title-margin;
  letter-spacing: $auth-title-letter-spacing;
  font-family: Arial, sans-serif;
}

.activate-message {
  margin-top: $spacing-lg;
}

/* Home Button - 与Login.vue的login-button保持一致 */
.home-button {
  width: 100%;
  @include button-primary;
  @include button-lg;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  margin-top: $spacing-sm;
  height: auto;

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

/* Element UI Result Component Overrides */
:deep(.el-result__title) {
  font-family: Arial, sans-serif;
  font-size: $font-size-2xl;
  font-weight: $font-weight-bold;
  color: $text-primary;
}

:deep(.el-result__subtitle) {
  font-family: Arial, sans-serif;
  font-size: $font-size-lg;
  color: $text-secondary;
  margin-top: $spacing-sm;
}

:deep(.el-result__icon .el-icon) {
  font-size: 5rem;
}

:deep(.el-result__icon .el-icon.el-icon-success) {
  color: $success-color;
}

:deep(.el-result__icon .el-icon.el-icon-error) {
  color: $error-color;
}

/* Responsive Design */
@media (max-width: $breakpoint-mobile) {
  .activate-card {
    margin: 0 $spacing-md;
    padding: $spacing-xl $spacing-lg;
  }

  .activate-container {
    padding: $spacing-2xl 0;
  }

  .activate-title {
    font-size: $font-size-2xl;
  }
}
</style>