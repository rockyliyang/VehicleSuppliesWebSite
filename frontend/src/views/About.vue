<template>
  <div class="about-page">
    <PageBanner :title="$t('about')" />

    <!-- 路径导航菜单 -->
    <NavigationMenu :breadcrumb-items="breadcrumbItems" />

    <div class="container">
      <div class="about-layout">
        <!-- 侧边导航 -->
        <div class="sidebar-nav">
          <div class="nav-title">
            <h3>{{ $t('about') }}</h3>
          </div>
          <ul class="nav-menu">
            <li v-for="nav in navList" :key="nav.id" :class="{ active: currentNavId === nav.id }"
              @click="selectNav(nav.id)">
              <a href="#" @click.prevent>{{ $t(nav.name_key) }}</a>
            </li>
          </ul>
        </div>

        <!-- 主内容区域 -->
        <div class="main-content">
          <div v-if="loading" class="loading-container" v-loading="loading" element-loading-text="加载中...">
            <div style="height: 200px;"></div>
          </div>

          <div v-else-if="currentContent" class="content-section">
            <div class="content-header">
              <h2>{{ currentContent.title || getCurrentNavName() }}</h2>
              <div class="title-underline"></div>
            </div>

            <div class="content-body" v-html="currentContent.content"></div>
          </div>

          <div v-else class="no-content">
            <el-empty description="暂无内容" />
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
  name: 'AboutPage',
  components: {
    PageBanner,
    NavigationMenu
  },
  data() {
    return {
      navList: [],
      currentNavId: null,
      currentContent: null,
      loading: false,
      currentLanguage: 'zh-CN'
    }
  },
  computed: {
    // 获取当前语言
    lang() {
      return this.$store.getters['language/currentLanguage'] || 'zh-CN';
    },
    
    // 面包屑导航项
    breadcrumbItems() {
      return [
        {
          text: this.$t('about'),
          to: null // 当前页面，不需要链接
        }
      ];
    }
  },
  methods: {
    // 获取导航菜单列表
    async fetchNavList() {
      try {
        const response = await this.$api.get(`common-content/nav/about_us?lang=${this.lang}`);
        this.navList = response.data.navList || [];
        
        // 默认选择第一个导航
        if (this.navList.length > 0 && !this.currentNavId) {
          this.currentNavId = this.navList[0].id;
          await this.fetchContent(this.navList[0].name_key);
        }
      } catch (error) {
        console.error('获取导航菜单失败:', error);
        this.$messageHandler.showError(this.$t('about.error.fetchNavFailed'), 'about.error.fetchNavFailed');
      }
    },

    // 获取指定导航的内容
    async fetchContent(nameKey) {
      if (!nameKey) return;
      
      this.loading = true;
      try {
        const response = await this.$api.get(`common-content/content/${nameKey}/${this.lang}`);
        const { contentList } = response.data;
        
        // 从contentList中获取内容
        if (contentList && contentList.length > 0) {
          this.currentContent = contentList[0];
        } else {
          this.currentContent = null;
        }
      } catch (error) {
        console.error('获取内容失败:', error);
        this.currentContent = null;
        if (error.response && error.response.status !== 404) {
          this.$messageHandler.showError(this.$t('about.error.fetchContentFailed'), 'about.error.fetchContentFailed');
        }
      } finally {
        this.loading = false;
      }
    },

    // 选择导航菜单
    async selectNav(navId) {
      if (this.currentNavId === navId) return;
      
      this.currentNavId = navId;
      const selectedNav = this.navList.find(nav => nav.id === navId);
      if (selectedNav) {
        await this.fetchContent(selectedNav.name_key);
      }
      
      // 滚动到内容顶部
      this.$nextTick(() => {
        const contentSection = document.querySelector('.main-content');
        if (contentSection) {
          contentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    },

    // 获取当前导航名称
    getCurrentNavName() {
      const currentNav = this.navList.find(nav => nav.id === this.currentNavId);
      return currentNav ? currentNav.title : '';
    },

    // 监听语言变化
    async onLanguageChange() {
      this.currentLanguage = this.lang;
      await this.fetchNavList();
      if (this.currentNavId) {
        const selectedNav = this.navList.find(nav => nav.id === this.currentNavId);
        if (selectedNav) {
          await this.fetchContent(selectedNav.name_key);
        }
      }
    }
  },
  async created() {
    await this.fetchNavList();
    
    // 监听全局语言切换事件
    this.$bus.on('language-changed', this.onLanguageChange);
  },
  
  beforeUnmount() {
    // 清理事件监听器
    this.$bus.off('language-changed', this.onLanguageChange);
  },
  watch: {
    // 监听语言变化
    '$store.getters["language/currentLanguage"]'(newLang, oldLang) {
      // 只有当语言真正发生变化时才触发
      if (newLang !== oldLang && newLang !== this.currentLanguage) {
        this.onLanguageChange();
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';
@import '@/assets/styles/_mixins.scss';

.about-page {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.container {
  @include container;
}



.about-layout {
  display: flex;
  gap: 30px;
  padding: 30px 0;
  min-height: 600px;
}

/* 侧边导航 */
.sidebar-nav {
  width: 280px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  height: fit-content;
  position: sticky;
  top: 20px;
}

.nav-title {
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  background-color: $primary-color;
  color: white;
  border-radius: 8px 8px 0 0;
}

.nav-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.nav-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-menu li {
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.nav-menu li:last-child {
  border-bottom: none;
}

.nav-menu li a {
  display: block;
  padding: 15px 20px;
  color: #333;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.3s ease;
}

.nav-menu li:hover {
  background-color: rgba($primary-light, 0.1);
}

.nav-menu li:hover a {
  color: $primary-color;
  padding-left: 25px;
  font-weight: 500;
}

.nav-menu li.active {
  background-color: rgba($primary-color, 0.05);
  border-left: 4px solid $primary-color;
}

.nav-menu li.active a {
  color: $primary-color;
  font-weight: 700;
  text-shadow: 0 0 1px rgba($primary-color, 0.3);
}

/* 主内容区域 */
.main-content {
  flex: 1;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  min-height: 500px;
}

.loading-container {
  padding: 60px;
  text-align: center;
}

.content-section {
  padding: 30px;
}

.content-header {
  text-align: center;
  margin-bottom: 30px;
}

.content-header h2 {
  font-size: 28px;
  color: #333;
  margin-bottom: 15px;
  font-weight: 600;
}

.title-underline {
  width: 80px;
  height: 3px;
  background-color: $primary-color;
  margin: 0 auto;
  border-radius: 2px;
}

.content-body {
  line-height: 1.8;
  color: #555;
  font-size: 16px;
}

.content-body :deep(h1),
.content-body :deep(h2),
.content-body :deep(h3),
.content-body :deep(h4),
.content-body :deep(h5),
.content-body :deep(h6) {
  color: #333;
  margin: 20px 0 15px 0;
  font-weight: 600;
}

.content-body :deep(p) {
  margin-bottom: 15px;
  text-align: justify;
}

.content-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 15px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.content-body :deep(ul),
.content-body :deep(ol) {
  padding-left: 20px;
  margin-bottom: 15px;
}

.content-body :deep(li) {
  margin-bottom: 8px;
}

.content-body :deep(blockquote) {
  border-left: 4px solid $primary-color;
  padding-left: 15px;
  margin: 20px 0;
  color: #666;
  font-style: italic;
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 0 4px 4px 0;
}

.no-content {
  padding: 60px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .about-layout {
    flex-direction: column;
    gap: 20px;
  }

  .sidebar-nav {
    width: 100%;
    position: static;
  }

  .nav-menu {
    display: flex;
    overflow-x: auto;
    white-space: nowrap;
  }

  .nav-menu li {
    flex-shrink: 0;
    border-bottom: none;
    border-right: 1px solid #f0f0f0;
  }

  .nav-menu li:last-child {
    border-right: none;
  }

  .nav-menu li a {
    padding: 12px 16px;
    font-size: 13px;
  }

  .content-section {
    padding: 20px;
  }

  .content-header h2 {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 10px;
  }

  .about-layout {
    padding: 20px 0;
  }

  .content-section {
    padding: 15px;
  }

  .content-body {
    font-size: 14px;
  }
}
</style>