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
            <el-result :icon="resultIcon" :title="resultTitle" :sub-title="resultSubTitle">
              <template #extra>
                <button @click="goHome" class="home-button">
                  {{ $t('activate.goHome') || '返回首页' }}
                </button>
              </template>
            </el-result>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
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
    const token = this.$route.query.token;
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
      this.$router.push('/');
    }
  }
}
</script>

<style scoped>
/* Activate Container */
.activate-container {
  padding: 80px 0;
  background: #f8f9fa;
  min-height: calc(100vh - 200px);
  width: 100%;
}

.result-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: center;
}

.activate-card {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 40px;
  transition: box-shadow 0.3s ease;
}

.activate-card:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.activate-header {
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

.activate-title {
  text-align: center;
  font-size: 1.875rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 0.5rem;
  font-family: Arial, sans-serif;
}

.activate-message {
  margin-top: 20px;
}

/* Home Button */
.home-button {
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
  min-width: 120px;
}

.home-button:hover {
  background-color: #b91c1c;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Element UI Result Component Overrides */
:deep(.el-result__title) {
  font-family: Arial, sans-serif;
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
}

:deep(.el-result__subtitle) {
  font-family: Arial, sans-serif;
  font-size: 1rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

:deep(.el-result__icon .el-icon) {
  font-size: 4rem;
}

:deep(.el-result__icon .el-icon.el-icon-success) {
  color: #10b981;
}

:deep(.el-result__icon .el-icon.el-icon-error) {
  color: #dc2626;
}

/* Responsive Design */
@media (max-width: 640px) {
  .activate-card {
    margin: 0 1rem;
    padding: 30px 20px;
  }


  .activate-container {
    padding: 40px 0;
  }

  .activate-title {
    font-size: 1.5rem;
  }
}
</style>