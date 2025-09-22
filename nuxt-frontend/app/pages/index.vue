<template>
  <div class="home">
    <!-- Banner轮播图 -->
    <div class="banner-container">
      <el-carousel :height="bannerHeight" indicator-position="outside">
        <el-carousel-item v-for="(item, index) in banners" :key="index">
          <!--div class="banner-item" :style="{ backgroundImage: `url(${item.image_url})` }"></div-->
          <div class="banner-item">
            <NuxtImg :src="item.image_url" :alt="`Banner ${index + 1}`" preset="banner"
              :sizes="`xs:100vw sm:100vw md:100vw lg:100vw xl:100vw`" loading="eager" class="banner-image"
              @error="handleImageError" />
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

    <!-- Products Section -->
    <section class="products-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">
            {{ $t('products.our')}} <span class="highlight">{{ $t('products.products')}}</span>
          </h2>
        </div>

        <!-- Product Categories Tabs -->
        <div class="category-tabs-container">
          <!-- Debug info removed to fix SSR error -->

          <div class="category-buttons-wrapper">
            <button v-for="category in categories" :key="category.id"
              :class="['category-button', { active: activeCategory === category.id.toString() }]"
              @click="activeCategory = category.id.toString()">
              {{ category.name }}
            </button>
            <NuxtLink to="/Products">
              <button class="more-button">
                {{ $t('products.more') || 'More' }}
              </button>
            </NuxtLink>
          </div>
        </div>

        <!-- Product Grid -->
        <div class="product-grid">
          <ProductCard v-for="product in displayProducts" :key="product.id" :product="product" :show-description="true"
            :show-arrow="true" :default-description="product.short_description || ''" card-style="home"
            @card-click="handleProductClick" @title-click="handleProductClick" />
        </div>
      </div>
    </section>

    <!-- About Us Section -->
    <section class="about-section">
      <div class="container">
        <div class="about-content">
          <div class="about-text">
            <h2 class="section-title">
              {{ $t('about.title.about') }} <span class="highlight">{{ $t('about.title.us') }}</span>
            </h2>
            <div class="section-divider"></div>
            <div v-if="aboutContent" class="about-description" v-html="aboutContent.content"></div>
            <div v-else>
              <p class="about-description">
                {{ $t('about.description1') ||
                '我们是一家专业的汽车电子产品制造商，致力于为客户提供高品质的汽车吸尘器、充气泵、启动电源等产品。我们拥有先进的生产设备和专业的技术团队，确保每一款产品都能满足客户的需求。' }}
              </p>
              <p class="about-description">
                {{ $t('about.description2') ||
                '我们的产品以卓越的性能、可靠的品质和创新的设计而闻名，已经获得了众多客户的信赖和好评。我们不断追求技术创新和产品改进，为客户提供更好的产品和服务。'
                }}
              </p>
            </div>
            <!-- 电脑端More按钮 - 在文本区域内 -->
            <div class="desktop-button">
              <NuxtLink to="/About" class="learn-more-link">
                <button class="learn-more-button">
                  {{ $t('about.learnMore') || '了解更多' }}
                  <i class="fas fa-arrow-right"></i>
                </button>
              </NuxtLink>
            </div>
          </div>
          <div class="about-image">
            <!--img :src="aboutImageUrl || '/images/about-company.jpg'" alt="About Us" @error="handleImageError" /-->
            <NuxtImg :src="aboutImageUrl || '/images/about-company.jpg'" alt="About Us" preset="thumbnail"
              :sizes="`xs:100vw sm:100vw md:50vw lg:50vw xl:50vw`" loading="lazy" @error="handleImageError" />
          </div>
        </div>
        <!-- 移动端More按钮 - 独立行 -->
        <div class="mobile-button">
          <NuxtLink to="/About" class="learn-more-link">
            <button class="learn-more-button">
              {{ $t('about.learnMore') || '了解更多' }}
              <i class="fas fa-arrow-right"></i>
            </button>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import ProductCard from '~/components/common/ProductCard.vue'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { handleImageError } from '~/utils/imageUtils'
import { useMainStore } from '~/stores/index'
import { useLanguageStore } from '~/stores/language'

// 定义页面元数据
definePageMeta({
  title: 'Home - Vehicle Supplies Website',
  description: 'Professional vehicle supplies and automotive accessories'
})

// 响应式数据
const activeCategory = ref('')
const bannerHeight = ref('500px')

// Store
const companyStore = useCompanyStore()
await companyStore.init();
const languageStore = useLanguageStore()

// 计算属性
const banners = computed(() => {
  return companyStore.banners.length > 0 ? companyStore.banners : [
    { image_url: '/images/banner1.jpg' },
    { image_url: '/images/banner2.jpg' },
    { image_url: '/images/banner3.jpg' }
  ]
})

// 递归获取分类及其所有子分类的ID
const getCategoryWithChildren = (categoryId) => {
  const categoryIds = [categoryId]
  
  const getChildren = (parentId) => {
    const children = companyStore.categories.filter(cat => cat.parent_id === parentId)
    children.forEach(child => {
      categoryIds.push(child.id)
      getChildren(child.id) // 递归获取子分类的子分类
    })
  }
  
  getChildren(categoryId)
  return categoryIds
}

const displayProducts = computed(() => {
  if (!activeCategory.value) return products.value
  
  // 获取当前分类及其所有子分类的ID
  const categoryIds = getCategoryWithChildren(activeCategory.value)
  console.log('categoryIds in ',categoryIds);
  return products.value.filter(product => 
    product.category_id && categoryIds.includes(product.category_id)
  )
})

const lang = computed(() => {
  return languageStore.getCurrentLanguage
})

const categories = computed(() => {
  console.log('[DEBUG] Categories computed - companyStore.categories:', companyStore.categories)
  console.log('[DEBUG] Categories computed - categories length:', companyStore.categories.length)
  
  // 只显示顶层分类（parent_id为null的分类）
  const topLevelCategories = companyStore.categories.filter(category => category.parent_id === null)
  
  if (topLevelCategories.length > 0) {
    // 只在activeCategory为空时设置默认值
    if (!activeCategory.value) {
      activeCategory.value = topLevelCategories[0].id.toString()
      console.log('[DEBUG] Set default activeCategory:', activeCategory.value)
    }
  }
  
  console.log('[DEBUG] Returning top level categories:', topLevelCategories)
  return topLevelCategories
})


const { data: products } = await useFetch('/api/products', {
  default: () => [],
  transform: (data) => (data.data && data.data.items) ? data.data.items : []
})

const { data: aboutContent } = await useFetch(`/api/common-content/content/home.about_us/${lang.value}`, {
  default: () => null,
  transform: (data) => {
    const contentList = data.data?.contentList
    return contentList && contentList.length > 0 ? contentList[0] : null
  }
})

// 从aboutContent中获取图片URL
const aboutImageUrl = computed(() => {
  return aboutContent.value?.main_image || null
})

// 在服务器端获取banner数据


// 方法
const handleProductClick = (product) => {
  console.log('Product clicked:', product)
}

const updateBannerHeight = () => {
  if (process.client) {
    if (window.innerWidth <= 480) {
      bannerHeight.value = '176px'
    } else if (window.innerWidth <= 768) {
      bannerHeight.value = '224px'
    } else if (window.innerWidth <= 1024) {
      bannerHeight.value = '350px'
    } else {
      bannerHeight.value = '500px'
    }
  }
}

const onLanguageChange = async () => {
  // 语言切换时重新获取About内容
  await refreshCookie('aboutContent')
}

// 生命周期
onMounted(async () => {
  updateBannerHeight()
  
  if (process.client) {
    window.addEventListener('resize', updateBannerHeight)
    
    // 监听语言切换事件
    const { $bus } = useNuxtApp()
    $bus?.on('language-changed', onLanguageChange)
  }
  
  console.log('[DEBUG] onMounted - Initial companyStore.categories:', companyStore.categories)
  console.log('[DEBUG] onMounted - Initial activeCategory:', activeCategory.value)
  
  if (!companyStore.banners || companyStore.banners.length === 0) {
     console.log('[DEBUG] Fetching banners...')
     await companyStore.fetchBanners()
  }
  
  if (!companyStore.categories || companyStore.categories.length === 0) {
     console.log('[DEBUG] Fetching categories...')
     await companyStore.fetchCategories()
     console.log('[DEBUG] After fetchCategories - companyStore.categories:', companyStore.categories)
  }
  
  // 确保activeCategory有值，使用顶层分类
  const topLevelCategories = companyStore.categories.filter(category => category.parent_id === null)
  if (!activeCategory.value && topLevelCategories.length > 0) {
    activeCategory.value = topLevelCategories[0].id.toString()
    console.log('[DEBUG] onMounted - Set activeCategory from top level categories:', activeCategory.value)
  }
  
  console.log('[DEBUG] onMounted completed - Final state:')
  console.log('[DEBUG] - companyStore.categories:', companyStore.categories)
  console.log('[DEBUG] - activeCategory:', activeCategory.value)
})

onUnmounted(() => {
  if (process.client) {
    const { $bus } = useNuxtApp()
    $bus?.off('language-changed', onLanguageChange)
    window.removeEventListener('resize', updateBannerHeight)
  }
})
</script>

<!-- Quill 全局样式 - 不能使用 scoped -->
<style lang="scss">
/* Quill styles would go here if needed */
</style>

<style lang="scss" scoped>
@use '~/assets/styles/_variables.scss' as *;
@use '~/assets/styles/_mixins.scss' as *;

/* Element UI 组件样式穿透 */
:deep(.el-carousel__indicator) {
  background-color: $carousel-indicator-bg;
  border: none;
  border-radius: 50%;
  width: $carousel-indicator-size;
  height: $carousel-indicator-size;
  margin: 0 $carousel-indicator-margin;
  padding: 0;
  transition: $transition-carousel;
  outline: none;
  box-shadow: none;
}

:deep(.el-carousel__indicator.is-active) {
  background-color: $carousel-indicator-active-bg;
  transform: scale($carousel-indicator-scale-active);
}

:deep(.el-carousel__indicator:hover) {
  background-color: $carousel-indicator-hover-bg;
  transform: scale($carousel-indicator-scale-hover);
}

:deep(.el-carousel__indicator button) {
  background-color: inherit;
  border: none;
  border-radius: 50%;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  outline: none;
}

:deep(.el-carousel__arrow) {
  background-color: $carousel-arrow-bg;
  color: $white;
}

:deep(.el-carousel__arrow:hover) {
  background-color: $carousel-arrow-hover-bg;
}

/* Banner轮播图样式 */
.banner-container {
  width: 100%;
  height: $banner-height-desktop;
  background: $gradient-primary;

  @media (max-width: $mobile-breakpoint-md) {
    height: $mobile-banner-height-md;
  }

  @media (max-width: $mobile-breakpoint-sm) {
    height: $mobile-banner-height-sm;
  }

  :deep(.el-carousel) {
    height: 100%;
  }
}

.banner-item {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  transition: $transition-base;
}

.banner-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: $transition-base;
}

/* 基础样式 */
.container {
  @include container;
}

/* Grid 样式 */
.grid {
  display: grid;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.gap-8 {
  gap: $spacing-xl;
}

/* Products Section 样式 */
.products-section {
  padding: $spacing-3xl 0;
  background: $gray-50;

  @include mobile {
    padding: $spacing-xl 0;
  }

  .section-header {
    text-align: center;
    margin-bottom: $spacing-2xl;

    .section-title {
      font-size: $font-size-3xl;
      font-weight: $font-weight-bold;
      margin-bottom: $spacing-sm;
      text-align: center;
      color: $text-primary;

      @include mobile {
        font-size: $font-size-2xl;
        margin-bottom: $spacing-xl;
      }

      .highlight {
        color: $primary-color;
      }
    }

    .section-divider {
      width: calc($spacing-6xl / 2 - $spacing-sm);
      height: $spacing-xs;
      background-color: $primary-color;
      margin: 0 auto $spacing-lg;
    }

    .section-description {
      color: $text-secondary;
      font-size: $font-size-xl;
      max-width: $container-max-width - $spacing-8xl + $spacing-6xl;
      margin: 0 auto;
      line-height: $line-height-relaxed;
    }
  }
}

/* 产品分类按钮 */
.category-button {
  @include button-secondary;
  @include button-lg;
  white-space: nowrap;
  font-weight: $font-weight-medium;

  @include mobile {
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-sm;
    min-height: $spacing-2xl;
    margin: 0 calc($spacing-xs / 2);
  }

  &.active {
    @include button-primary;
    @include button-lg;
    font-weight: $font-weight-semibold;

    @include mobile {
      padding: $spacing-xs $spacing-sm;
      font-size: $font-size-sm;
      min-height: $spacing-2xl;
    }
  }
}

/* More按钮样式 - 与非激活按钮底色一致但有独特样式 */
.more-button {
  @include button-secondary;
  @include button-lg;
  white-space: nowrap;
  font-weight: $font-weight-semibold;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  border: none;

  // 简洁的背景，去掉内阴影和边框
  background: $gray-100;

  // 使用更短更粗的箭头
  &::after {
    content: '▶';
    font-size: $font-size-sm;
    font-weight: $font-weight-bold;
    margin-left: $spacing-xs;
    color: $gray-600;
    transition: all 0.3s ease;
    display: inline-block;
    transform: scale(0.8);
  }

  @include mobile {
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-sm;
    min-height: $spacing-2xl;
    margin: 0 calc($spacing-xs / 2);

    &::after {
      font-size: $font-size-xs;
      margin-left: calc($spacing-xs / 2);
      transform: scale(0.7);
    }
  }

  &:hover:not(:disabled) {
    background: $gray-200;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    &::after {
      color: $primary-color;
      transform: scale(0.8) translateX(2px);
    }
  }

  // 简化聚焦状态
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba($primary-color, 0.3);
  }
}

/* About Section 样式 */
.about-section {
  padding: $spacing-4xl 0;
  background-color: $gray-50;

  .about-content {
    @include flex-column;
    gap: $spacing-2xl;

    @media (min-width: $breakpoint-tablet) {
      flex-direction: row;
      align-items: flex-start;
    }
  }

  .about-image {
    @media (min-width: $breakpoint-tablet) {
      width: 50%;
    }

    img {
      width: 100%;
      height: auto;
      border-radius: $border-radius-lg;
      box-shadow: $shadow-lg;
      transition: $transition-base;

      &:hover {
        transform: scale(1.02);
        box-shadow: $shadow-xl;
      }
    }
  }

  .about-text {
    @media (min-width: $breakpoint-tablet) {
      width: 50%;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
    }

    .section-title {
      font-size: $font-size-4xl;
      font-weight: $font-weight-bold;
      margin-bottom: $spacing-sm;
      text-align: left;

      .highlight {
        color: $primary-color;
      }
    }

    .section-divider {
      width: 96px;
      height: 4px;
      background-color: $primary-color;
      margin-bottom: $spacing-lg;
      margin-left: 0;
    }

    .about-description {
      color: $text-secondary;
      font-size: $font-size-lg;
      margin-bottom: $spacing-lg;
      line-height: $line-height-relaxed;
      flex: 1;
    }

    .desktop-button {
      margin-top: $spacing-xl;
      display: none;

      @media (min-width: $breakpoint-tablet) {
        display: block;
      }
    }
  }
}

// 移动端按钮样式 - 确保在电脑端完全隐藏
.mobile-button {
  margin-top: $spacing-lg;
  width: 100%;
  display: block;

  @media (min-width: $breakpoint-tablet) {
    display: none !important;
  }
}

// About Us 按钮样式 - 移到外层以便两个按钮都能使用
.learn-more-button {
  @include button-primary;
  @include button-lg;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;

  // 移动端：按钮占满宽度
  @include mobile {
    width: 100%;
  }

  i {
    margin-left: $spacing-sm;
  }
}

/* 产品分类和网格布局 - 合并相关样式 */
/* 分类标签容器 */
.category-tabs-container {
  margin-bottom: $spacing-xl;

  .category-buttons-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: $spacing-xs;
    margin-bottom: $spacing-lg;
    overflow-x: auto;
    padding: $spacing-xs 0;

    /* 隐藏滚动条但保持滚动功能 */
    &::-webkit-scrollbar {
      display: none;
    }

    -ms-overflow-style: none;
    scrollbar-width: none;

    @include mobile {
      justify-content: flex-start;
      gap: $spacing-xs;
      margin-bottom: $spacing-lg;
      padding: $spacing-xs $spacing-sm;
    }

    @include desktop {
      flex-wrap: wrap;
      overflow-x: visible;
    }
  }
}

/* 产品网格和响应式布局 */
.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-lg;

  @include tablet {
    grid-template-columns: repeat(3, 1fr);
  }

  @include desktop {
    grid-template-columns: repeat(4, 1fr);
  }

  @include mobile {
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-sm;
    margin-top: $spacing-lg;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-xs;
  }
}

/* 响应式网格工具类 */
@media (min-width: $breakpoint-tablet) {
  .sm\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: $breakpoint-desktop) {
  .lg\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>