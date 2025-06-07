<template>
  <div class="home">
    <!-- Banner轮播图 -->
    <div class="banner-container">
      <el-carousel height="500px" indicator-position="inside">
        <el-carousel-item v-for="(item, index) in banners" :key="index">
          <div class="banner-item" :style="{ backgroundImage: `url(${item.image_url})` }">
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
          <div class="section-divider"></div>
          <p class="section-description">
            {{ $t('products.description') || defaultProductDescription}}
          </p>
        </div>

        <!-- Product Categories Tabs -->
        <div class="mb-10">
          <div class="flex flex-wrap justify-center gap-2 mb-8">
            <button v-for="category in categories" :key="category.id"
              :class="['category-button', { active: activeCategory === category.id.toString() }]"
              @click="activeCategory = category.id.toString()">
              {{ category.name }}
            </button>
            <router-link to="/products">
              <button class="more-button">
                {{ $t('products.more') || 'More' }}
              </button>
            </router-link>
          </div>
        </div>

        <!-- Product Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <ProductCard v-for="product in displayProducts" :key="product.id" :product="product" :show-description="true"
            :show-arrow="true" :default-description="'Powerful suction with long battery life'" card-style="home"
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
            <p class="about-description">
              {{ $t('about.description1') ||
              '我们是一家专业的汽车电子产品制造商，致力于为客户提供高品质的汽车吸尘器、充气泵、启动电源等产品。我们拥有先进的生产设备和专业的技术团队，确保每一款产品都能满足客户的需求。' }}
            </p>
            <p class="about-description">
              {{ $t('about.description2') || '我们的产品以卓越的性能、可靠的品质和创新的设计而闻名，已经获得了众多客户的信赖和好评。我们不断追求技术创新和产品改进，为客户提供更好的产品和服务。'
              }}
            </p>
            <router-link to="/about" class="learn-more-link">
              <button class="learn-more-button">
                {{ $t('about.learnMore') || '了解更多' }} <i class="fas fa-arrow-right"></i>
              </button>
            </router-link>
          </div>
          <div class="about-image">
            <img src="https://via.placeholder.com/600x400/f3f4f6/6b7280?text=About+Us" alt="About Us" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
// import axios from 'axios';
import { handleImageError } from '../utils/imageUtils';
import ProductCard from '../components/common/ProductCard.vue';

export default {
  name: 'HomePage',
  components: {
    ProductCard
  },
  data() {
    return {
      activeCategory: '',
      banners: [
        { image_url: require('../assets/images/banner1.jpg') },
        { image_url: require('../assets/images/banner2.jpg') },
        { image_url: require('../assets/images/banner3.jpg') }
      ],
      categories: [],
      products: [],
      defaultProductDescription: 'We offer the best selection of automotive electronic products. Our            high-quality car vacuum cleaners, tire inflators, and jump starters are designed for maximum performance and reliability.',
    }
  },
  computed: {
    displayProducts() {
      return this.products.filter(product => product.category_id && product.category_id.toString() === this.activeCategory)
    }
  },
  mounted() {
    this.fetchCategories()
    this.fetchProducts()
  },
  methods: {
    handleImageError,
    handleProductClick(product) {
      // 产品点击事件处理，可以在这里添加额外的逻辑
      console.log('Product clicked:', product);
    },
    async fetchCategories() {
      try {
        const res = await this.$api.get('categories')
        this.categories = res.data || []
        if (this.categories.length > 0) {
          this.activeCategory = this.categories[0].id.toString()
        }
      } catch (e) {
        this.categories = []
      }
    },
    async fetchProducts() {
      try {
        const res = await this.$api.get('products')
        this.products = (res.data && res.data.items) ? res.data.items : []
      } catch (e) {
        this.products = []
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';
@import '@/assets/styles/_mixins.scss';

/* Element UI 组件样式穿透 */
:deep(.el-carousel__indicator) {
  background-color: rgba(255, 255, 255, 0.4);
  border: none;
  border-radius: 50%;
  width: 8px;
  height: 8px;
  margin: 0 4px;
  padding: 0;
  transition: all 0.3s ease;
  outline: none;
  box-shadow: none;
}

:deep(.el-carousel__indicator.is-active) {
  background-color: #dc2626;
  transform: scale(1.3);
}

:deep(.el-carousel__indicator:hover) {
  background-color: rgba(255, 255, 255, 0.7);
  transform: scale(1.1);
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
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
}

:deep(.el-carousel__arrow:hover) {
  background-color: rgba(0, 0, 0, 0.7);
}

/* Banner轮播图样式 */
.banner-container {
  width: 100%;
  height: 500px;
  background: $gradient-primary;

  :deep(.el-carousel) {
    height: 100%;
  }
}

.banner-item {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
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
  padding: $spacing-4xl 0;
  background-color: $white;

  .section-header {
    text-align: center;
    margin-bottom: $spacing-2xl;

    .section-title {
      font-size: $font-size-4xl;
      font-weight: $font-weight-bold;
      margin-bottom: $spacing-sm;
      text-align: center;

      .highlight {
        color: $primary-color;
      }
    }

    .section-divider {
      width: 96px;
      height: 4px;
      background-color: $primary-color;
      margin: 0 auto $spacing-lg;
    }

    .section-description {
      color: $text-secondary;
      font-size: $font-size-xl;
      max-width: 1000px;
      margin: 0 auto;
      line-height: $line-height-relaxed;
    }
  }
}

/* 产品分类按钮 */
.category-button {
  @include button-outline;
  padding: $spacing-md $spacing-xl;
  /* px-8 py-3 equivalent */
  margin: 0 $spacing-xs;
  white-space: nowrap;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;

  &.active {
    @include button-primary;
    padding: $spacing-md $spacing-xl;
    /* 保持一致的padding */
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
  }
}

/* More按钮样式 - 与category-button保持一致 */
.more-button {
  @include button-base;
  background-color: $gray-200;
  color: $gray-700;
  padding: $spacing-md $spacing-xl;
  /* 与category-button一致 */
  margin: 0 $spacing-xs;
  white-space: nowrap;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;

  &:hover:not(:disabled) {
    background-color: $gray-300;
  }
}

/* Home页面特定的产品卡片样式覆盖 */
.home-style {
  /* 这些样式会应用到ProductCard组件上 */
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
      align-items: center;
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
    }

    .learn-more-button {
      @include button-primary;
      @include button-lg;
      font-size: $font-size-lg;
      font-weight: $font-weight-semibold;

      i {
        margin-left: $spacing-sm;
      }
    }
  }
}

/* 响应式网格 */
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

/* 其他必要样式 */
.relative {
  position: relative;
}

.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.flex-wrap {
  flex-wrap: wrap;
}

.items-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.justify-between {
  justify-content: space-between;
}

.gap-2 {
  gap: 0.5rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.mb-3 {
  margin-bottom: 0.75rem;
}

.mb-6 {
  margin-bottom: 1.5rem;
}

.mb-8 {
  margin-bottom: 2rem;
}

.mb-10 {
  margin-bottom: 2.5rem;
}

.mb-12 {
  margin-bottom: 3rem;
}

.mt-12 {
  margin-top: 3rem;
}

.ml-2 {
  margin-left: 0.5rem;
}

.p-4 {
  padding: 1rem;
}

.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}

.px-6 {
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

.py-2 {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.py-3 {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}

.py-16 {
  padding-top: 4rem;
  padding-bottom: 4rem;
}

.text-center {
  text-align: center;
}

.text-sm {
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.text-lg {
  font-size: 1.125rem;
  line-height: 1.75rem;
}

.text-3xl {
  font-size: 1.875rem;
  line-height: 2.25rem;
}

.font-bold {
  font-weight: 700;
}

.font-semibold {
  font-weight: 600;
}

.text-white {
  color: #ffffff;
}

.text-gray-600 {
  color: #6b7280;
}

.text-gray-700 {
  color: #374151;
}

.text-red-600 {
  color: #dc2626;
}

.bg-white {
  background-color: #ffffff;
}

.bg-gray-100 {
  background-color: #f3f4f6;
}

.bg-gray-200 {
  background-color: #e5e7eb;
}

.bg-red-600 {
  background-color: #dc2626;
}

.rounded-md {
  border-radius: 0.375rem;
}

.rounded-lg {
  border-radius: 0.5rem;
}

.shadow-md {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.shadow-xl {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.overflow-hidden {
  overflow: hidden;
}

.transition-transform {
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.transition {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.duration-300 {
  transition-duration: 300ms;
}

.hover\:shadow-xl:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.hover\:-translate-y-1:hover {
  transform: translateY(-0.25rem);
}

.hover\:bg-gray-300:hover {
  background-color: #d1d5db;
}

.hover\:bg-red-700:hover {
  background-color: #b91c1c;
}

.hover\:text-red-800:hover {
  color: #991b1b;
}

.cursor-pointer {
  cursor: pointer;
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}

.max-w-3xl {
  max-width: 48rem;
}

.w-24 {
  width: 6rem;
}

.w-full {
  width: 100%;
}

.h-1 {
  height: 0.25rem;
}

.h-64 {
  height: 16rem;
}

.h-full {
  height: 100%;
}

.h-auto {
  height: auto;
}

.object-cover {
  object-fit: cover;
}

.object-center {
  object-position: center;
}

@media (min-width: 768px) {
  .md\:w-1\/2 {
    width: 50%;
  }

  .md\:flex-row {
    flex-direction: row;
  }
}
</style>