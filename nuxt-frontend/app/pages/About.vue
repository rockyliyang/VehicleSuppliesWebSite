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

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import PageBanner from '~/components/common/PageBanner.vue'
import NavigationMenu from '~/components/common/NavigationMenu.vue'
import { useLanguageStore } from '~/stores/language'

// 定义页面元数据
definePageMeta({
  title: 'About - Vehicle Supplies Website',
  description: 'About our company and services'
})

// 获取Nuxt应用实例
const { $api, $t, $messageHandler, $bus } = useNuxtApp()

// Store
const languageStore = useLanguageStore()

// 响应式数据
const currentNavId = ref(null)
const currentContent = ref(null)
const loading = ref(false)
const currentLanguage = ref('zh-CN')

// 计算属性
const lang = computed(() => {
  return languageStore.getCurrentLanguage || 'zh-CN'
})

const breadcrumbItems = computed(() => {
  return [
    {
      text: $t('about'),
      to: null // 当前页面，不需要链接
    }
  ]
})

// SSR数据获取 - 获取导航菜单列表
const { data: navList } = await useFetch(`/api/common-content/nav/about_us`, {
  query: { lang: lang.value },
  default: () => [],
  transform: (data) => data.data?.navList || [],
  onResponse({ response }) {
    const navData = response._data?.data?.navList
    if (navData && navData.length > 0 && !currentNavId.value) {
      currentNavId.value = navData[0].id
    }
  }
})

// 方法
const fetchNavList = async () => {
  try {
    const response = await $api.get(`common-content/nav/about_us?lang=${lang.value}`)
    navList.value = response.data.navList || []
    
    // 默认选择第一个导航
    if (navList.value.length > 0 && !currentNavId.value) {
      currentNavId.value = navList.value[0].id
      await fetchContent(navList.value[0].name_key)
    }
  } catch (error) {
    console.error('获取导航菜单失败:', error)
    $messageHandler.showError($t('about.error.fetchNavFailed'), 'about.error.fetchNavFailed')
  }
}

const fetchContent = async (nameKey) => {
  if (!nameKey) return
  
  loading.value = true
  try {
    const response = await $api.get(`common-content/content/${nameKey}/${lang.value}`)
    const { contentList } = response.data
    
    // 从contentList中获取内容
    if (contentList && contentList.length > 0) {
      currentContent.value = contentList[0]
    } else {
      currentContent.value = null
    }
  } catch (error) {
    console.error('获取内容失败:', error)
    currentContent.value = null
    if (error.response && error.response.status !== 404) {
      $messageHandler.showError($t('about.error.fetchContentFailed'), 'about.error.fetchContentFailed')
    }
  } finally {
    loading.value = false
  }
}

const selectNav = async (navId) => {
  if (currentNavId.value === navId) return
  
  currentNavId.value = navId
  const selectedNav = navList.value.find(nav => nav.id === navId)
  if (selectedNav) {
    await fetchContent(selectedNav.name_key)
  }
  
  // 滚动到内容顶部
  nextTick(() => {
    const contentSection = document.querySelector('.main-content')
    if (contentSection) {
      contentSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

const getCurrentNavName = () => {
  const currentNav = navList.value.find(nav => nav.id === currentNavId.value)
  return currentNav ? currentNav.title : ''
}

const onLanguageChange = async () => {
  currentLanguage.value = lang.value
  await fetchNavList()
  if (currentNavId.value) {
    const selectedNav = navList.value.find(nav => nav.id === currentNavId.value)
    if (selectedNav) {
      await fetchContent(selectedNav.name_key)
    }
  }
}

// 生命周期
onMounted(() => {
  // 如果SSR没有获取到导航数据，客户端再次获取
  if (navList.value.length === 0) {
    fetchNavList()
  } else if (currentNavId.value) {
    // 如果有默认选中的导航，获取其内容
    const selectedNav = navList.value.find(nav => nav.id === currentNavId.value)
    if (selectedNav) {
      fetchContent(selectedNav.name_key)
    }
  }
  
  if (process.client) {
    // 监听全局语言切换事件
    $bus?.on('language-changed', onLanguageChange)
  }
})

onUnmounted(() => {
  if (process.client) {
    // 清理事件监听器
    $bus?.off('language-changed', onLanguageChange)
  }
})

// 监听语言变化
watch(() => languageStore.getCurrentLanguage, (newLang, oldLang) => {
  // 只有当语言真正发生变化时才触发
  if (newLang !== oldLang && newLang !== currentLanguage.value) {
    onLanguageChange()
  }
})
</script>

<!-- Quill 全局样式 - 不能使用 scoped -->
<style lang="scss">
@use '~/assets/styles/_quill-global.scss';
</style>

<style lang="scss" scoped>
@use '~/assets/styles/_variables.scss' as *;
@use '~/assets/styles/_mixins.scss' as *;

.about-page {
  min-height: $content-page-min-height;
  background-color: $content-page-background;
}

.container {
  @include container;
}

.about-layout {
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
  background-color: $primary-color;
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
  background-color: rgba($primary-light, 0.1);
}

.nav-menu li:hover a {
  color: $primary-color;
  padding-left: $nav-menu-hover-padding-left;
  font-weight: $nav-menu-hover-font-weight;
}

.nav-menu li.active {
  background-color: rgba($primary-color, 0.05);
  border-left: $nav-menu-active-border-left solid $primary-color;
}

.nav-menu li.active a {
  color: $primary-color;
  font-weight: $nav-menu-active-font-weight;
  text-shadow: 0 0 1px rgba($primary-color, 0.3);
}

/* 主内容区域 */
.main-content {
  flex: 1;
  background-color: $main-content-background;
  border-radius: $main-content-border-radius;
  box-shadow: $main-content-shadow;
  min-height: $main-content-min-height;
}

.loading-container {
  padding: $loading-container-padding;
  text-align: $loading-container-text-align;
}

.content-section {
  padding: $content-section-padding;
}

.content-header {
  text-align: $content-header-text-align;
  margin-bottom: $content-header-margin-bottom;
}

.content-header h2 {
  font-size: $content-header-title-font-size;
  color: $content-header-title-color;
  margin-bottom: $content-header-title-margin-bottom;
  font-weight: $content-header-title-font-weight;
}

.title-underline {
  width: $title-underline-width;
  height: $title-underline-height;
  background-color: $primary-color;
  margin: $title-underline-margin;
  border-radius: $title-underline-border-radius;
}

.content-body {
  line-height: $content-body-line-height;
  color: $content-body-color;
  font-size: $content-body-font-size;
}

.content-body :deep(h1),
.content-body :deep(h2),
.content-body :deep(h3),
.content-body :deep(h4),
.content-body :deep(h5),
.content-body :deep(h6) {
  color: $content-body-heading-color;
  margin: $content-body-heading-margin;
  font-weight: $content-body-heading-font-weight;
}

.content-body :deep(p) {
  margin-bottom: $content-body-paragraph-margin-bottom;
  text-align: justify;
}

.content-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: $content-body-image-border-radius;
  margin: $content-body-image-margin;
  box-shadow: $content-body-image-shadow;
}

.content-body :deep(ul),
.content-body :deep(ol) {
  padding-left: $content-body-list-padding-left;
  margin-bottom: $content-body-list-margin-bottom;
}

.content-body :deep(li) {
  margin-bottom: $content-body-list-item-margin-bottom;
}

.content-body :deep(blockquote) {
  border-left: $content-body-blockquote-border-left solid $primary-color;
  padding-left: $content-body-blockquote-padding-left;
  margin: $content-body-blockquote-margin;
  color: $content-body-blockquote-color;
  font-style: italic;
  background-color: $content-body-blockquote-background;
  padding: $content-body-blockquote-padding;
  border-radius: $content-body-blockquote-border-radius;
}

.no-content {
  padding: $no-content-padding;
  text-align: $no-content-text-align;
}

/* 响应式设计 */
@media (max-width: $content-mobile-breakpoint) {
  .about-layout {
    flex-direction: column;
    gap: $content-mobile-layout-gap;
    padding: $content-mobile-layout-padding;
  }

  .sidebar-nav {
    width: 100%;
    position: static;
    margin-bottom: $spacing-md;
    box-shadow: $shadow-sm;
  }

  .nav-title {
    padding: $spacing-md $spacing-lg;
    border-radius: $border-radius-md;
  }

  .nav-title h3 {
    font-size: $font-size-base;
    text-align: center;
  }

  .nav-menu {
    display: flex;
    overflow-x: auto;
    white-space: nowrap;
    padding: $spacing-sm 0;
    scrollbar-width: none;
    /* Firefox */
    -ms-overflow-style: none;
    /* IE and Edge */

    &::-webkit-scrollbar {
      display: none;
      /* Chrome, Safari, Opera */
    }
  }

  .nav-menu li {
    flex-shrink: 0;
    border-bottom: none;
    border-right: $nav-menu-border-bottom;
    min-width: fit-content;
  }

  .nav-menu li:first-child a {
    margin-left: $spacing-md;
  }

  .nav-menu li:last-child {
    border-right: none;
  }

  .nav-menu li:last-child a {
    margin-right: $spacing-md;
  }

  .nav-menu li a {
    padding: $content-mobile-nav-menu-padding;
    font-size: $content-mobile-nav-menu-font-size;
    display: block;
    text-align: center;
    min-width: 80px;
  }

  .nav-menu li.active {
    border-left: none;
    background-color: rgba($primary-color, 0.1);
    border-radius: $border-radius-sm;
  }

  .nav-menu li.active a {
    color: $primary-color;
    font-weight: $nav-menu-active-font-weight;
  }

  .main-content {
    margin-top: 0;
  }

  .content-section {
    padding: $content-mobile-section-padding;
  }

  .content-header {
    margin-bottom: $spacing-lg;
  }

  .content-header h2 {
    font-size: $content-mobile-header-title-font-size;
    margin-bottom: $spacing-sm;
  }

  .title-underline {
    width: 60px;
    height: 2px;
  }

  .content-body {
    font-size: $font-size-sm;
    line-height: $line-height-relaxed;
  }

  .content-body :deep(h1),
  .content-body :deep(h2),
  .content-body :deep(h3) {
    font-size: $font-size-lg;
    margin: $spacing-lg 0 $spacing-sm 0;
  }

  .content-body :deep(h4),
  .content-body :deep(h5),
  .content-body :deep(h6) {
    font-size: $font-size-base;
    margin: $spacing-md 0 $spacing-sm 0;
  }

  .content-body :deep(p) {
    margin-bottom: $spacing-sm;
    text-align: left;
  }

  .content-body :deep(img) {
    margin: $spacing-sm 0;
    border-radius: $border-radius-sm;
  }

  .content-body :deep(ul),
  .content-body :deep(ol) {
    padding-left: $spacing-md;
    margin-bottom: $spacing-sm;
  }

  .content-body :deep(blockquote) {
    padding: $spacing-sm;
    margin: $spacing-sm 0;
    font-size: $font-size-xs;
  }

  .loading-container {
    padding: $spacing-xl;
  }

  .no-content {
    padding: $spacing-xl;
  }
}

@media (max-width: $content-small-mobile-breakpoint) {
  .container {
    padding: $content-small-mobile-container-padding;
  }

  .about-layout {
    padding: $content-small-mobile-layout-padding;
    gap: $spacing-sm;
  }

  .nav-title {
    padding: $spacing-sm $spacing-md;
  }

  .nav-title h3 {
    font-size: $font-size-sm;
  }

  .nav-menu li a {
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-xs;
    min-width: 70px;
  }

  .content-section {
    padding: $content-small-mobile-section-padding;
  }

  .content-header h2 {
    font-size: $font-size-xl;
  }

  .content-body {
    font-size: $content-small-mobile-body-font-size;
  }

  .content-body :deep(h1),
  .content-body :deep(h2),
  .content-body :deep(h3) {
    font-size: $font-size-base;
  }

  .content-body :deep(h4),
  .content-body :deep(h5),
  .content-body :deep(h6) {
    font-size: $font-size-sm;
  }

  .content-body :deep(blockquote) {
    padding: $spacing-xs;
    margin: $spacing-xs 0;
  }

  .loading-container {
    padding: $spacing-lg;
  }

  .no-content {
    padding: $spacing-lg;
  }
}

/* 平板设备优化 */
@media (min-width: ($content-mobile-breakpoint + 1px)) and (max-width: $content-tablet-breakpoint) {
  .about-layout {
    gap: $spacing-lg;
  }

  .sidebar-nav {
    width: 240px;
  }

  .content-section {
    padding: $spacing-lg;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .nav-menu li a {
    padding: $spacing-md $spacing-lg;
    min-height: 44px;
    /* 确保触摸目标足够大 */
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-menu li:hover {
    background-color: transparent;
  }

  .nav-menu li:active {
    background-color: rgba($primary-color, 0.1);
  }
}
</style>