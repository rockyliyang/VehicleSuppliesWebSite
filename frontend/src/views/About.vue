<template>
  <div class="about-page">
    <PageBanner :title="$t('about')" />

    <!-- Breadcrumb Section -->
    <div class="breadcrumb-section">
      <div class="container">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">{{ $t('home') }}</el-breadcrumb-item>
          <el-breadcrumb-item>{{ $t('about') }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <div class="container">
      <div class="about-layout">
        <!-- 侧边导航 -->
        <div class="sidebar-nav">
          <div class="nav-title">
            <h3>{{ $t('about') }}</h3>
          </div>
          <ul class="nav-menu">
            <li 
              v-for="nav in navList" 
              :key="nav.id"
              :class="{ active: currentNavId === nav.id }"
              @click="selectNav(nav.id)"
            >
              <a href="#" @click.prevent>{{ nav.nav_name }}</a>
            </li>
          </ul>
        </div>

        <!-- 主内容区域 -->
        <div class="main-content">
          <div v-if="loading" class="loading-container">
            <el-loading :loading="true" text="加载中..." />
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

export default {
  name: 'AboutPage',
  components: {
    PageBanner
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
      return this.$i18n.locale || 'zh-CN';
    }
  },
  methods: {
    // 获取导航菜单列表
    async fetchNavList() {
      try {
        const response = await this.$api.get(`common-content/nav/about?lang=${this.lang}`);
        this.navList = response.data.navList || [];
        
        // 默认选择第一个导航
        if (this.navList.length > 0 && !this.currentNavId) {
          this.currentNavId = this.navList[0].id;
          await this.fetchContent(this.navList[0].name_key);
        }
      } catch (error) {
        console.error('获取导航菜单失败:', error);
        this.$message.error('获取导航菜单失败');
      }
    },

    // 获取指定导航的内容
    async fetchContent(nameKey) {
      if (!nameKey) return;
      
      this.loading = true;
      try {
        const response = await this.$api.get(`common-content/content/${nameKey}/${this.lang}`);
        this.currentContent = response.data.content;
      } catch (error) {
        console.error('获取内容失败:', error);
        this.currentContent = null;
        if (error.response && error.response.status !== 404) {
          this.$message.error('获取内容失败');
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
      return currentNav ? currentNav.nav_name : '';
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
  },
  watch: {
    // 监听语言变化
    '$i18n.locale'() {
      this.onLanguageChange();
    }
  }
}
</script>

<style scoped>
.about-page {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

.breadcrumb-section {
  background-color: #fff;
  padding: 15px 0;
  border-bottom: 1px solid #e9ecef;
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
  background-color: #409EFF;
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
  background-color: #f8f9fa;
}

.nav-menu li:hover a {
  color: #409EFF;
  padding-left: 25px;
}

.nav-menu li.active {
  background-color: #409EFF;
}

.nav-menu li.active a {
  color: white;
  font-weight: 600;
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
  background-color: #409EFF;
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
  border-left: 4px solid #409EFF;
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