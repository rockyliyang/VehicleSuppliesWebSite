<template>
  <div class="user-agreement-page">
    <PageBanner :title="$t('userAgreement.title') || '用户协议'" />

    <!-- 路径导航菜单 -->
    <NavigationMenu :breadcrumb-items="breadcrumbItems" />

    <div class="container">
      <div class="agreement-container">
        <div class="agreement-card">
          <div class="agreement-header">
            <h2 class="agreement-title">{{ $t('userAgreement.title') || '用户协议' }}</h2>
          </div>

          <div class="agreement-content" v-if="loading">
            <div class="loading-container" v-loading="loading" element-loading-text="加载中..."></div>
          </div>

          <div class="agreement-content" v-else-if="contentList && contentList.length > 0">
            <div v-for="content in contentList" :key="content.id">
              <div v-html="content.content"></div>
            </div>
          </div>

          <div class="agreement-content" v-else>
            <el-empty :description="$t('userAgreement.noContent') || '暂无内容'" />
          </div>

          <div class="agreement-footer">
            <el-checkbox v-model="agreed" class="agreement-checkbox">
              {{ $t('userAgreement.agreeText') || '我已阅读并同意以上用户协议' }}
            </el-checkbox>

            <el-button type="primary" class="back-button" @click="goBackToRegister">
              {{ $t('userAgreement.backToRegister') || '返回注册页面' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PageBanner from '@/components/common/PageBanner.vue';
import NavigationMenu from '@/components/common/NavigationMenu.vue';

export default {
  name: 'UserAgreement',
  components: {
    PageBanner,
    NavigationMenu
  },
  data() {
    return {
      contentList: [],
      loading: false,
      agreed: false
    }
  },
  computed: {
    // 获取当前语言
    lang() {
      return this.$store.language.currentLanguage || 'en';
    },
    
    // 面包屑导航项
    breadcrumbItems() {
      return [
        {
          text: this.$t('register.title') || '用户注册',
          to: '/register'
        },
        {
          text: this.$t('userAgreement.title') || '用户协议',
          to: null // 当前页面，不需要链接
        }
      ];
    }
  },
  created() {
    // 获取用户协议内容
    this.fetchAgreementContent();
  },
  methods: {
    // 获取用户协议内容
    async fetchAgreementContent() {
      this.loading = true;
      try {
        const response = await this.$api.get(`common-content/content/register.agreement/${this.lang}`);
        const { contentList } = response.data;
        
        this.contentList = contentList || [];
      } catch (error) {
        console.error('获取用户协议内容失败:', error);
        this.contentList = [];
        if (error.response && error.response.status !== 404) {
          this.$messageHandler.showError('获取用户协议内容失败', 'userAgreement.error.fetchContentFailed');
        }
      } finally {
        this.loading = false;
      }
    },
    
    // 返回注册页面
    goBackToRegister() {
      // 返回注册页面，并传递协议同意状态
      this.$router.push({
        path: '/register',
        query: { agreed: this.agreed ? 'true' : 'false' }
      });
    }
  },
  watch: {
    // 监听语言变化，重新获取内容
    lang() {
      this.fetchAgreementContent();
    }
  }
};
</script>

<style lang="scss" scoped>
@use '@/assets/styles/_variables.scss' as *;

.user-agreement-page {
  min-height: 100vh;
  background-color: $background-light;

  .container {
    padding: 40px 20px;
    max-width: 1200px;
    margin: 0 auto;

    @media (max-width: 767px) {
      padding: 20px 15px;
    }
  }

  .agreement-container {
    display: flex;
    justify-content: center;
    width: 100%;
  }

  .agreement-card {
    background-color: $white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 800px;
    overflow: hidden;

    .agreement-header {
      padding: 20px 30px;
      border-bottom: 1px solid $border-light;

      .agreement-title {
        font-size: 24px;
        font-weight: 600;
        color: $text-primary;
        margin: 0;
      }
    }

    .agreement-content {
      padding: 30px;
      min-height: 300px;
      max-height: 500px;
      overflow-y: auto;
      line-height: 1.6;
      color: $text-secondary;

      h3 {
        font-size: 18px;
        font-weight: 600;
        margin-top: 20px;
        margin-bottom: 10px;
        color: $text-primary;
      }

      p {
        margin-bottom: 16px;
      }

      ul,
      ol {
        padding-left: 20px;
        margin-bottom: 16px;

        li {
          margin-bottom: 8px;
        }
      }

      .loading-container {
        height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .agreement-footer {
      padding: 20px 30px;
      border-top: 1px solid $border-light;
      display: flex;
      flex-direction: column;
      gap: 20px;

      @media (min-width: 768px) {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }

      .agreement-checkbox {
        font-size: 16px;
        color: $text-primary;
      }

      .back-button {
        min-width: 140px;
      }
    }
  }
}
</style>