<template>
  <div class="news-detail-page">
    <!-- 页面横幅 -->
    <PageBanner :title="$t('news')" :breadcrumb-items="breadcrumbItems" />

    <!-- 导航菜单 -->
    <NavigationMenu :breadcrumb-items="breadcrumbItems" />

    <div class="news-detail-container">
      <div class="news-detail-content">
        <!-- 主要内容区域 -->
        <div class="main-content">
          <!-- 加载状态 -->
          <div v-if="loading" class="loading-container">
            <el-icon class="is-loading">
              <Loading />
            </el-icon>
            <span>{{ $t('loading') }}...</span>
          </div>

          <!-- 新闻详情 -->
          <div v-else-if="currentContent" class="news-detail">
            <!-- 新闻头部信息 -->
            <div class="news-header">
              <h1 class="news-title">{{ currentContent.title }}</h1>
              <div class="news-meta">
                <span class="news-date">
                  <el-icon>
                    <Calendar />
                  </el-icon>
                  {{ formatDate(currentContent.created_at) }}
                </span>
                <span class="news-category">
                  <el-icon>
                    <Collection />
                  </el-icon>
                  {{ getCurrentNavName() }}
                </span>
                <span v-if="currentContent.views" class="news-views">
                  <el-icon>
                    <ViewIcon />
                  </el-icon>
                  {{ currentContent.views }} {{ $t('views') }}
                </span>
              </div>
            </div>

            <!-- 新闻主图 -->
            <div v-if="currentContent.main_image_url" class="news-image">
              <img :src="currentContent.main_image_url" :alt="currentContent.title" @error="handleImageError" />
            </div>

            <!-- 新闻内容 -->
            <div class="news-content" v-html="currentContent.content"></div>

            <!-- 导航按钮 -->
            <div class="news-navigation">
              <el-button @click="goToPrevious" :disabled="!prevContent" type="primary" plain class="nav-button prev-button">
                <el-icon>
                  <ArrowLeft />
                </el-icon>
                <span>{{ $t('news.previous_article', 'previousArticle') }}</span>
              </el-button>

              <el-button @click="goBack" type="default" class="nav-button back-button">
                <el-icon>
                  <Back />
                </el-icon>
                <span>{{ $t('news.back_to_list', 'backToList') }}</span>
              </el-button>

              <el-button @click="goToNext" :disabled="!nextContent" type="primary" plain class="nav-button next-button">
                <span>{{ $t('news.next_article', 'nextArticle') }}</span>
                <el-icon>
                  <ArrowRight />
                </el-icon>
              </el-button>
            </div>
          </div>

          <!-- 内容不存在 -->
          <div v-else class="no-content">
            <el-icon class="empty-icon">
              <Document />
            </el-icon>
            <h3>{{ $t('contentNotFound') }}</h3>
            <p>{{ $t('contentNotFoundDesc') }}</p>
            <el-button @click="goBack" type="primary">
              {{ $t('backToList') }}
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
import { 
  Loading, 
  Calendar, 
  Collection, 
  View as ViewIcon, 
  ArrowLeft, 
  ArrowRight, 
  Back, 
  Document 
} from '@element-plus/icons-vue';

export default {
  name: 'NewsDetail',
  components: {
    PageBanner,
    NavigationMenu,
    Loading,
    Calendar,
    Collection,
    ViewIcon,
    ArrowLeft,
    ArrowRight,
    Back,
    Document
  },
  data() {
    return {
      navList: [],
      currentNavId: null,
      currentContent: null,
      contentList: [],
      loading: false,
      currentLanguage: 'zh-CN',
      defaultImage: require('@/assets/images/news1.jpg')
    }
  },
  computed: {
    // 获取当前语言
    lang() {
      return this.$store.getters['language/currentLanguage'] || 'zh-CN';
    },
    
    // 面包屑导航项
    breadcrumbItems() {
      const items = [
        {
          text: this.$t('news'),
          to: { name: 'News' }
        }
      ];
      
      if (this.currentContent) {
        items.push({
          text: this.currentContent.title,
          to: null // 当前页面
        });
      }
      
      return items;
    },

    // 获取当前内容在列表中的索引
    currentIndex() {
      if (!this.currentContent || !this.contentList.length) return -1;
      return this.contentList.findIndex(item => item.id === this.currentContent.id);
    },

    // 上一篇文章
    prevContent() {
      if (this.currentIndex <= 0) return null;
      return this.contentList[this.currentIndex - 1];
    },

    // 下一篇文章
    nextContent() {
      if (this.currentIndex < 0 || this.currentIndex >= this.contentList.length - 1) return null;
      return this.contentList[this.currentIndex + 1];
    }
  },
  methods: {
    // 获取导航菜单列表
    async fetchNavList() {
      try {
        const response = await this.$api.get(`common-content/nav/news?lang=${this.lang}`);
        this.navList = response.data.navList || [];
      } catch (error) {
        console.error('获取导航菜单失败:', error);
        this.$messageHandler.showError(this.$t('common.error.fetch_nav_failed', '获取导航菜单失败'), 'common.error.fetch_nav_failed');
      }
    },

    // 获取指定导航的内容列表
    async fetchContentList(nameKey) {
      if (!nameKey) return;
      
      try {
        const response = await this.$api.get(`common-content/content/${nameKey}/${this.lang}`);
        const { contentList } = response.data;
        this.contentList = contentList || [];
      } catch (error) {
        console.error('获取内容列表失败:', error);
        this.contentList = [];
      }
    },

    // 根据ID获取内容详情
    async fetchContentById(contentId) {
      this.loading = true;
      try {
        // 首先尝试从路由查询参数获取导航信息
        const navId = this.$route.query.navId;
        
        if (navId) {
          this.currentNavId = parseInt(navId);
        }

        // 获取导航列表
        await this.fetchNavList();

        // 如果有导航ID，获取对应的内容列表
        if (this.currentNavId) {
          const selectedNav = this.navList.find(nav => nav.id === this.currentNavId);
          if (selectedNav) {
            await this.fetchContentList(selectedNav.name_key);
          }
        } else {
          // 如果没有导航ID，遍历所有导航查找内容
          for (const nav of this.navList) {
            await this.fetchContentList(nav.name_key);
            const content = this.contentList.find(item => item.id === parseInt(contentId));
            if (content) {
              this.currentNavId = nav.id;
              break;
            }
          }
        }

        // 从内容列表中找到当前内容
        this.currentContent = this.contentList.find(item => item.id === parseInt(contentId));
        
        if (!this.currentContent) {
          console.warn('未找到指定的内容');
        }
      } catch (error) {
        console.error('获取内容详情失败:', error);
        this.$messageHandler.showError(this.$t('common.error.fetch_content_failed', '获取内容详情失败'), 'common.error.fetch_content_failed');
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
        await this.fetchContentList(selectedNav.name_key);
        // 跳转到该分类的新闻列表页
        this.$router.push({ name: 'News' });
      }
    },

    // 获取当前导航名称
    getCurrentNavName() {
      const currentNav = this.navList.find(nav => nav.id === this.currentNavId);
      return currentNav ? this.$t(currentNav.name_key) : '';
    },

    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString(this.lang === 'en' ? 'en-US' : 'zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },

    // 图片加载错误处理
    handleImageError(event) {
      event.target.src = this.defaultImage;
    },

    // 跳转到上一篇
    goToPrevious() {
      if (this.prevContent) {
        this.$router.push({
          name: 'NewsDetail',
          params: { id: this.prevContent.id },
          query: {
            navId: this.currentNavId,
            navName: this.getCurrentNavName()
          }
        });
      }
    },

    // 跳转到下一篇
    goToNext() {
      if (this.nextContent) {
        this.$router.push({
          name: 'NewsDetail',
          params: { id: this.nextContent.id },
          query: {
            navId: this.currentNavId,
            navName: this.getCurrentNavName()
          }
        });
      }
    },

    // 返回列表页
    goBack() {
      this.$router.push({ name: 'News' });
    },

    // 监听语言变化
    async onLanguageChange() {
      this.currentLanguage = this.lang;
      const contentId = this.$route.params.id;
      if (contentId) {
        await this.fetchContentById(contentId);
      }
    }
  },
  async created() {
    const contentId = this.$route.params.id;
    if (contentId) {
      await this.fetchContentById(contentId);
    }
    
    // 监听全局语言切换事件
    this.$bus.on('language-changed', this.onLanguageChange);
  },
  
  beforeUnmount() {
    // 清理事件监听器
    this.$bus.off('language-changed', this.onLanguageChange);
  },
  
  watch: {
    // 监听路由参数变化
    '$route.params.id'(newId, oldId) {
      if (newId !== oldId && newId) {
        this.fetchContentById(newId);
      }
    },
    
    // 监听语言变化
    '$store.getters["language/currentLanguage"]'(newLang, oldLang) {
      if (newLang !== oldLang && newLang !== this.currentLanguage) {
        this.onLanguageChange();
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';
@import '@/assets/styles/_mixins.scss';

.news-detail-page {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.news-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.news-detail-content {
  width: 100%;
}

.main-content {
  width: 100%;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  height: 200px;
  background: white;
  border-radius: 8px;
  box-shadow: $news-detail-box-shadow;
  font-size: 16px;
  color: #6c757d;
}

.news-detail {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.news-header {
  padding: $news-header-padding-top $news-header-padding-horizontal $news-header-padding-bottom;
  border-bottom: $border-width-sm solid #e9ecef;
}

.news-title {
  font-size: $news-title-font-size;
  font-weight: $news-title-font-weight;
  color: #333;
  line-height: 1.4;
  margin-bottom: $news-title-margin-bottom;
}

.news-meta {
  display: flex;
  align-items: center;
  gap: $news-meta-gap;
  font-size: $news-meta-font-size;
  color: #6c757d;
}

.news-meta span {
  display: flex;
  align-items: center;
  gap: $news-meta-icon-gap;
}

.news-image {
  width: 100%;
  max-height: $news-image-max-height;
  overflow: hidden;
}

.news-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.news-content {
  padding: $news-content-padding;
  line-height: $news-content-line-height;
  font-size: $news-content-font-size;
  color: #333;
}

.news-content :deep(h1),
.news-content :deep(h2),
.news-content :deep(h3),
.news-content :deep(h4),
.news-content :deep(h5),
.news-content :deep(h6) {
  margin: $news-content-heading-margin-top 0 $news-content-heading-margin-bottom;
  color: #333;
  font-weight: 600;
}

.news-content :deep(p) {
  margin-bottom: $news-content-p-margin-bottom;
  text-align: justify;
}

.news-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: $news-content-img-margin 0;
}

.news-content :deep(blockquote) {
  border-left: $news-content-blockquote-border-width solid #007bff;
  padding-left: $news-content-blockquote-padding;
  margin: $news-content-blockquote-margin 0;
  color: #6c757d;
  font-style: italic;
}

.news-content :deep(ul),
.news-content :deep(ol) {
  padding-left: $news-content-list-padding;
  margin-bottom: $news-content-list-margin;
}

.news-content :deep(li) {
  margin-bottom: $news-content-li-margin;
}

.news-navigation {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: $news-navigation-padding;
  border-top: $border-width-sm solid #e9ecef;
  background: #f8f9fa;
  gap: $news-navigation-gap;
  position: relative;
}

:deep(.nav-button.el-button) {
  @include button-base;
  padding: $spacing-md $spacing-xl !important;
  font-size: $font-size-lg !important;
  font-weight: $font-weight-semibold !important;
  min-width: $news-nav-button-min-width !important;
  display: flex !important;
  align-items: center !important;
  gap: $news-nav-button-gap;
  white-space: nowrap !important;
  height: auto !important;
  min-height: auto !important;
  border-radius: $border-radius-md !important;
  transition: all 0.3s ease !important;
}

.prev-button {
  position: absolute;
  left: $news-nav-button-side-position;
}

:deep(.prev-button.el-button) {
  background-color: transparent !important;
  border-color: $primary-color !important;
  color: $primary-color !important;
  border: 1px solid $primary-color !important;
  
  &:hover:not(.is-disabled) {
    background-color: $primary-color !important;
    border-color: $primary-color !important;
    color: white !important;
  }
  
  &.is-disabled {
    background-color: $gray-100 !important;
    border-color: $gray-300 !important;
    color: $gray-400 !important;
  }
  
  &:focus {
    background-color: transparent !important;
    border-color: $primary-color !important;
    color: $primary-color !important;
  }
}

.next-button {
  position: absolute;
  right: $news-nav-button-side-position;
}

:deep(.next-button.el-button) {
  background-color: transparent !important;
  border-color: $primary-color !important;
  color: $primary-color !important;
  border: 1px solid $primary-color !important;
  
  &:hover:not(.is-disabled) {
    background-color: $primary-color !important;
    border-color: $primary-color !important;
    color: white !important;
  }
  
  &.is-disabled {
    background-color: $gray-100 !important;
    border-color: $gray-300 !important;
    color: $gray-400 !important;
  }
  
  &:focus {
    background-color: transparent !important;
    border-color: $primary-color !important;
    color: $primary-color !important;
  }
}

:deep(.back-button.el-button) {
  background-color: $gray-200 !important;
  color: $gray-700 !important;
  border-color: $gray-200 !important;
  border: 1px solid $gray-200 !important;
  
  &:hover {
    background-color: $primary-color !important;
    border-color: $primary-color !important;
    color: white !important;
  }
  
  &:focus {
    background-color: $gray-200 !important;
    border-color: $gray-200 !important;
    color: $gray-700 !important;
  }
}

.no-content {
  background: white;
  border-radius: 8px;
  box-shadow: $news-detail-box-shadow;
  padding: $news-no-content-padding-vertical $news-no-content-padding-horizontal;
  text-align: center;
}

.empty-icon {
  font-size: $news-empty-icon-size;
  color: #d1d5db;
  margin-bottom: $news-empty-icon-margin;
}

.no-content h3 {
  font-size: $news-no-content-title-size;
  color: #374151;
  margin-bottom: $news-no-content-title-margin;
}

.no-content p {
  color: #6b7280;
  margin-bottom: $news-no-content-desc-margin;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .news-detail-container {
    padding: $news-mobile-container-padding $news-mobile-container-padding-sm;
  }

  .news-header {
    padding: $news-mobile-header-padding;
  }

  .news-title {
    font-size: $news-mobile-title-size;
  }

  .news-content {
    padding: $news-mobile-content-padding;
  }

  .news-navigation {
    flex-direction: column;
    gap: $news-mobile-navigation-gap;
    padding: $news-mobile-navigation-padding;
  }

  .nav-button {
    width: 100%;
    justify-content: center;
    min-width: auto;
  }

  .prev-button,
  .next-button,
  .back-button {
    margin: 0;
  }
}

@media (max-width: 480px) {
  .news-detail-container {
    padding: $news-mobile-container-padding-sm;
  }

  .news-header {
    padding: $news-mobile-header-padding-sm;
  }

  .news-title {
    font-size: $news-mobile-title-size-sm;
  }

  .news-content {
    padding: $news-mobile-content-padding-sm;
    font-size: $news-mobile-content-font-size;
  }

  .news-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: $news-mobile-meta-gap;
  }
}
</style>