<template>
  <div class="news-page">
    <PageBanner :title="$t('news')" />

    <!-- 路径导航菜单 -->
    <NavigationMenu :breadcrumb-items="breadcrumbItems" />

    <div class="container">
      <div class="news-layout">
        <!-- 侧边导航 -->
        <div class="sidebar-nav">
          <div class="nav-title">
            <h3>{{ $t('news') }}</h3>
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

          <div v-else-if="contentList && contentList.length > 0" class="news-section">
            <div class="news-grid">
              <div v-for="content in paginatedContent" :key="content.id" class="news-card" @click="goToDetail(content)">
                <div class="news-image">
                  <img :src="content.main_image || defaultImage" :alt="content.title" @error="handleImageError">
                </div>
                <div class="news-content">
                  <h3 class="news-title">{{ content.title }}</h3>
                  <div class="news-meta">
                    <span><i class="el-icon-date"></i> {{ formatDate(content.created_at) }}</span>
                  </div>
                  <p class="news-summary">{{ getContentSummary(content.content) }}</p>
                  <div class="read-more">
                    {{ $t('news.readMore') }} <i class="el-icon-arrow-right"></i>
                  </div>
                </div>
              </div>
            </div>

            <!-- 分页 -->
            <div class="pagination-container">
              <el-pagination background layout="total, prev, pager, next, jumper" :total="contentList.length"
                :page-size="pageSize" :current-page="currentPage" @current-change="handlePageChange">
              </el-pagination>
            </div>
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
  name: 'NewsPage',
  components: {
    PageBanner,
    NavigationMenu
  },
  data() {
    return {
      navList: [],
      currentNavId: null,
      contentList: [],
      loading: false,
      currentLanguage: 'zh-CN',
      currentPage: 1,
      pageSize: 6,
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
      return [
        {
          text: this.$t('news'),
          to: null // 当前页面，不需要链接
        }
      ];
    },

    // 分页后的内容
    paginatedContent() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.contentList.slice(start, end);
    },

    // 总页数
    totalPages() {
      return Math.ceil(this.contentList.length / this.pageSize);
    }
  },
  methods: {
    // 获取导航菜单列表
    async fetchNavList() {
      try {
        const response = await this.$api.get(`common-content/nav/news?lang=${this.lang}`);
        this.navList = response.data.navList || [];
        
        // 默认选择第一个导航
        if (this.navList.length > 0 && !this.currentNavId) {
          this.currentNavId = this.navList[0].id;
          await this.fetchContentList(this.navList[0].name_key);
        }
      } catch (error) {
        console.error('获取导航菜单失败:', error);
        this.$messageHandler.showError('获取导航菜单失败', 'news.error.fetchNavFailed');
      }
    },

    // 获取指定导航的内容列表
    async fetchContentList(nameKey) {
      if (!nameKey) return;
      
      this.loading = true;
      try {
        const response = await this.$api.get(`common-content/content/${nameKey}/${this.lang}`);
        const { contentList } = response.data;
        
        this.contentList = contentList || [];
        this.currentPage = 1; // 重置到第一页
      } catch (error) {
        console.error('获取内容列表失败:', error);
        this.contentList = [];
        if (error.response && error.response.status !== 404) {
          this.$messageHandler.showError('获取内容列表失败', 'news.error.fetchContentFailed');
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
        await this.fetchContentList(selectedNav.name_key);
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
      return currentNav ? this.$t(currentNav.name_key) : '';
    },

    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN');
    },

    // 获取内容摘要
    getContentSummary(content) {
      if (!content) return '';
      // 移除HTML标签
      const textContent = content.replace(/<[^>]*>/g, '');
      // 截取前100个字符
      return textContent.length > 100 ? textContent.substring(0, 100) + '...' : textContent;
    },

    // 跳转到详情页
    goToDetail(content) {
      this.$router.push({
        name: 'NewsDetail',
        params: { id: content.id },
        query: {
          navId: this.currentNavId,
          navName: this.getCurrentNavName()
        }
      });
    },

    // 处理分页变化
    handlePageChange(page) {
      this.currentPage = page;
      // 滚动到顶部
      this.$nextTick(() => {
        const contentSection = document.querySelector('.news-section');
        if (contentSection) {
          contentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    },

    // 图片加载错误处理
    handleImageError(event) {
      event.target.src = this.defaultImage;
    },

    // 监听语言变化
    async onLanguageChange() {
      this.currentLanguage = this.lang;
      await this.fetchNavList();
      if (this.currentNavId) {
        const selectedNav = this.navList.find(nav => nav.id === this.currentNavId);
        if (selectedNav) {
          await this.fetchContentList(selectedNav.name_key);
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
@import '@/assets/styles/_variables.scss';
@import '@/assets/styles/_mixins.scss';

// 新闻页面专用主题色系 - 科技红色调
$news-primary: #e74c3c; // 科技红色
$news-primary-light: #ff6b6b; // 亮红色
$news-primary-dark: #c0392b; // 深红色
$news-accent: #ff4757; // 强调红色
$news-tech-gradient: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); // 科技渐变

.news-page {
  min-height: $content-page-min-height;
  background-color: $content-page-background;
}

.container {
  @include container;
}

.news-layout {
  display: flex;
  gap: $content-layout-gap;
  padding: $content-layout-padding;
  min-height: $content-layout-min-height;
}

/* 侧边导航 */
.sidebar-nav {
  width: $sidebar-nav-width;
  background-color: $sidebar-nav-background;
  border-radius: $sidebar-nav-border-radius;
  box-shadow: $sidebar-nav-shadow;
  height: fit-content;
  position: sticky;
  top: $sidebar-nav-sticky-top;
}

.nav-title {
  padding: $nav-title-padding;
  border-bottom: $nav-title-border-bottom;
  background-color: $news-primary;
  color: $nav-title-color;
  border-radius: $nav-title-border-radius;
}

.nav-title h3 {
  margin: $nav-title-margin;
  font-size: $nav-title-font-size;
  font-weight: $nav-title-font-weight;
}

.nav-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-menu li {
  border-bottom: $nav-menu-border-bottom;
  transition: $nav-menu-transition;
}

.nav-menu li:last-child {
  border-bottom: none;
}

.nav-menu li a {
  display: block;
  padding: $nav-menu-item-padding;
  color: $nav-menu-item-color;
  text-decoration: none;
  font-size: $nav-menu-item-font-size;
  transition: $nav-menu-transition;
}

.nav-menu li:hover {
  background-color: rgba($news-primary-light, 0.1);
}

.nav-menu li:hover a {
  color: $news-primary;
  padding-left: $nav-menu-hover-padding-left;
  font-weight: $nav-menu-hover-font-weight;
}

.nav-menu li.active {
  background-color: rgba($news-primary, 0.05);
  border-left: $nav-menu-active-border-left solid $news-primary;
}

.nav-menu li.active a {
  color: $news-primary;
  font-weight: $nav-menu-active-font-weight;
  text-shadow: 0 0 1px rgba($news-primary, 0.3);
}

@keyframes pulse {

  0%,
  100% {
    transform: translateY(-50%) scale(1);
    opacity: 1;
  }

  50% {
    transform: translateY(-50%) scale(1.2);
    opacity: 0.8;
  }
}

/* 主内容区域 */
.main-content {
  flex: 1;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background: $main-content-background;
  border-radius: $main-content-border-radius;
  box-shadow: $main-content-shadow;
}

.news-section {
  background: $main-content-background;
  border-radius: $main-content-border-radius;
  box-shadow: $main-content-shadow;
  padding: $content-section-padding;
}

.news-grid {
  display: grid;
  grid-template-columns: $news-grid-columns;
  gap: $news-grid-gap;
  margin-bottom: $news-grid-margin-bottom;
  min-height: $news-grid-min-height;
  align-content: start;
}

.news-card {
  background: $news-card-background;
  border: $news-card-border;
  border-radius: $news-card-border-radius;
  overflow: hidden;
  transition: $news-card-transition;
  cursor: pointer;
  box-shadow: $news-card-shadow;
  display: flex;
  flex-direction: column;
  height: 100%;

  &:hover {
    transform: $news-card-hover-transform;
    box-shadow: $news-card-hover-shadow;
    border-color: $news-card-hover-border-color;

    .news-image img {
      transform: $news-image-hover-scale;
    }

    .read-more {
      color: $news-read-more-hover-color;
    }
  }
}

.news-image {
  width: 100%;
  height: $news-image-height;
  overflow: hidden;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: $news-card-transition;
  }
}

.news-content {
  padding: $news-content-padding;
}

.news-title {
  font-size: $news-title-font-size;
  font-weight: $news-title-font-weight;
  color: $news-title-color;
  line-height: $news-title-line-height;
  margin-bottom: $news-title-margin-bottom;
  display: -webkit-box;
  -webkit-line-clamp: $news-title-line-clamp;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.3s ease;

  &:hover {
    color: $news-title-hover-color;
  }
}

.news-meta {
  display: flex;
  align-items: center;
  gap: $news-meta-gap;
  margin-bottom: $news-meta-margin-bottom;
  font-size: $news-meta-font-size;
  color: $news-meta-color;

  i {
    color: $news-meta-icon-color;
  }
}

.news-summary {
  color: $news-summary-color;
  line-height: $news-summary-line-height;
  font-size: $news-summary-font-size;
  margin-bottom: $news-summary-margin-bottom;
  display: -webkit-box;
  -webkit-line-clamp: $news-summary-line-clamp;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.read-more {
  color: $news-read-more-color;
  font-size: $news-read-more-font-size;
  font-weight: $news-read-more-font-weight;
  display: flex;
  align-items: center;
  gap: $news-read-more-gap;
  transition: $news-card-transition;

  i {
    transition: $news-card-transition;
  }

  &:hover {
    color: $news-read-more-hover-color;

    i {
      transform: $news-read-more-icon-transform;
    }
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: $pagination-container-margin-top;

  :deep(.el-pagination) {
    background: $pagination-background;
    padding: $pagination-padding;
    border-radius: $pagination-border-radius;
    box-shadow: $pagination-shadow;

    .el-pager li {
      &.active {
        background-color: $news-primary;
        border-color: $news-primary;
      }

      &:hover {
        color: $news-primary;
      }
    }

    .btn-prev,
    .btn-next {
      &:hover {
        color: $news-primary;
      }
    }
  }
}

.no-content {
  background: $main-content-background;
  border-radius: $pagination-border-radius;
  box-shadow: $pagination-shadow;
  padding: $no-content-padding $content-section-padding;
  text-align: $no-content-text-align;
}

/* 响应式设计 */
@media (max-width: $content-tablet-breakpoint) {
  .news-grid {
    grid-template-columns: $news-grid-columns;
    gap: $news-tablet-grid-gap;
  }

  .news-layout {
    gap: $news-tablet-layout-gap;
    padding: $news-tablet-layout-padding;
  }
}

@media (max-width: $content-mobile-breakpoint) {
  .news-layout {
    flex-direction: column;
    gap: $content-mobile-layout-gap;
    padding: $content-mobile-layout-padding;
  }

  .sidebar-nav {
    width: 100%;
    position: static;
    margin-top: $content-layout-gap;
    order: 2;
  }

  .main-content {
    order: 1;
  }

  .nav-menu {
    display: flex;
    overflow-x: auto;
    white-space: nowrap;
  }

  .nav-menu li {
    flex-shrink: 0;
    border-bottom: none;
    border-right: $nav-menu-border-bottom;
  }

  .nav-menu li:last-child {
    border-right: none;
  }

  .nav-menu li a {
    padding: $content-mobile-nav-menu-padding;
    font-size: $content-mobile-nav-menu-font-size;
  }

  .news-section {
    padding: $news-mobile-section-padding;
  }

  .news-grid {
    grid-template-columns: 1fr;
    gap: $news-mobile-grid-gap;
  }

  .news-content {
    padding: $news-mobile-content-padding;
  }

  .news-title {
    font-size: $news-mobile-title-font-size;
  }

  .news-summary {
    font-size: $news-mobile-summary-font-size;
  }

  .pagination-container {
    margin-top: $news-mobile-pagination-margin-top;

    :deep(.el-pagination) {
      padding: $news-mobile-pagination-padding;
    }
  }
}

@media (max-width: $content-small-mobile-breakpoint) {
  .container {
    padding: $content-small-mobile-container-padding;
  }

  .news-layout {
    gap: $news-mobile-grid-gap;
  }

  .news-section {
    padding: $news-small-mobile-section-padding;
  }

  .news-content {
    padding: $news-small-mobile-content-padding;
  }

  .nav-title {
    padding: $news-small-mobile-nav-title-padding;

    h3 {
      font-size: $news-small-mobile-nav-title-font-size;
    }
  }

  .nav-menu li a {
    padding: $content-mobile-nav-menu-padding;
    font-size: $content-mobile-nav-menu-font-size;
  }

  .news-title {
    font-size: $news-mobile-title-font-size;
  }

  .news-summary {
    font-size: $news-mobile-summary-font-size;
  }

  .news-grid {
    gap: $news-mobile-grid-gap;
  }

  .no-content {
    padding: $news-small-mobile-no-content-padding;
  }
}
</style>