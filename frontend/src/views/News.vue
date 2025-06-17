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
      defaultImage: 'https://via.placeholder.com/400x250/f3f4f6/6b7280?text=News+Image'
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
  min-height: 100vh;
  background-color: #f8f9fa;
}

.container {
  @include container;
}

.news-layout {
  display: flex;
  gap: $spacing-xl;
  padding: $spacing-xl 0;
  min-height: 600px;
}

/* 侧边导航 */
.sidebar-nav {
  width: 280px;
  background-color: $white;
  border-radius: $border-radius-md;
  box-shadow: $shadow-lg;
  height: fit-content;
  position: sticky;
  top: $spacing-lg;
}

.nav-title {
  padding: $spacing-lg;
  border-bottom: 1px solid $border-light;
  background-color: $news-primary;
  color: $white;
  border-radius: $border-radius-md $border-radius-md 0 0;
}

.nav-title h3 {
  margin: 0;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
}

.nav-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-menu li {
  border-bottom: 1px solid $gray-200;
  transition: $transition-slow;
}

.nav-menu li:last-child {
  border-bottom: none;
}

.nav-menu li a {
  display: block;
  padding: $spacing-md $spacing-lg;
  color: $text-primary;
  text-decoration: none;
  font-size: $font-size-sm;
  transition: $transition-slow;
}

.nav-menu li:hover {
  background-color: rgba($news-primary-light, 0.1);
}

.nav-menu li:hover a {
  color: $news-primary;
  padding-left: 25px;
  font-weight: $font-weight-medium;
}

.nav-menu li.active {
  background-color: rgba($news-primary, 0.05);
  border-left: 4px solid $news-primary;
}

.nav-menu li.active a {
  color: $news-primary;
  font-weight: $font-weight-bold;
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
  background: $white;
  border-radius: $border-radius-md;
  box-shadow: $shadow-lg;
}

.news-section {
  background: $white;
  border-radius: $border-radius-md;
  box-shadow: $shadow-lg;
  padding: $spacing-xl;
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: $spacing-2xl;
  min-height: 600px;
  align-content: start;
}

.news-card {
  background: $white;
  border: 1px solid $gray-200;
  border-radius: $border-radius-xl;
  overflow: hidden;
  transition: $transition-slow;
  cursor: pointer;
  box-shadow: $shadow-md;
  display: flex;
  flex-direction: column;
  height: 100%;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 8px 25px rgba($news-primary, 0.15);
    border-color: rgba($news-primary, 0.2);

    .news-image img {
      transform: scale(1.05);
    }

    .read-more {
      color: $news-primary-dark;
    }
  }
}

.news-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: $transition-slow;
  }
}

.news-content {
  padding: $spacing-lg;
}

.news-title {
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  color: $text-primary;
  line-height: $line-height-tight;
  margin-bottom: $spacing-sm;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.3s ease;

  &:hover {
    color: $news-primary;
  }
}

.news-meta {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  margin-bottom: $spacing-sm;
  font-size: $font-size-sm;
  color: $text-secondary;

  i {
    color: $news-primary-light;
  }
}

.news-summary {
  color: $text-secondary;
  line-height: $line-height-relaxed;
  font-size: $font-size-sm;
  margin-bottom: $spacing-lg;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.read-more {
  color: $news-primary;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  transition: $transition-slow;

  i {
    transition: $transition-slow;
  }

  &:hover {
    color: $news-primary-dark;

    i {
      transform: translateX(3px);
    }
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: $spacing-2xl;

  :deep(.el-pagination) {
    background: $white;
    padding: $spacing-lg;
    border-radius: $border-radius-lg;
    box-shadow: $shadow-lg;

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
  background: $white;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-lg;
  padding: 80px $spacing-lg;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .news-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  .news-layout {
    gap: 20px;
    padding: 20px 0;
  }
}

@media (max-width: 768px) {
  .news-layout {
    flex-direction: column;
    gap: $spacing-lg;
    padding: $spacing-lg 0;
  }

  .sidebar-nav {
    width: 100%;
    position: static;
    margin-top: $spacing-xl;
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
    border-right: 1px solid $gray-200;
  }

  .nav-menu li:last-child {
    border-right: none;
  }

  .nav-menu li a {
    padding: $spacing-sm $spacing-md;
    font-size: $font-size-xs;
  }

  .news-section {
    padding: $spacing-md;
  }

  .news-grid {
    grid-template-columns: 1fr;
    gap: $spacing-md;
  }

  .news-content {
    padding: $spacing-lg;
  }

  .news-title {
    font-size: $font-size-sm;
  }

  .news-summary {
    font-size: $font-size-xs;
  }

  .pagination-container {
    margin-top: $spacing-xl;

    :deep(.el-pagination) {
      padding: $spacing-md;
    }
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 $spacing-sm;
  }

  .news-layout {
    gap: $spacing-md;
  }

  .news-section {
    padding: $spacing-sm;
  }

  .news-content {
    padding: $spacing-md;
  }

  .nav-title {
    padding: $spacing-md;

    h3 {
      font-size: $font-size-base;
    }
  }

  .nav-menu li a {
    padding: $spacing-sm $spacing-md;
    font-size: $font-size-xs;
  }

  .news-title {
    font-size: $font-size-sm;
  }

  .news-summary {
    font-size: $font-size-xs;
  }

  .news-grid {
    gap: $spacing-md;
  }

  .no-content {
    padding: $spacing-2xl $spacing-md;
  }
}
</style>