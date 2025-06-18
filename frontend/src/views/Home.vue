<template>
  <div class="home">
    <!-- Banner轮播图 -->
    <div class="banner-container">
      <el-carousel :height="bannerHeight" indicator-position="inside">
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
        <div class="category-tabs-container">
          <div class="category-buttons-wrapper">
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
        <div class="product-grid">
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
            <!-- 电脑端More按钮 -->
            <div class="desktop-button">
              <router-link to="/about" class="learn-more-link">
                <button class="learn-more-button">
                  {{ $t('about.learnMore') || '了解更多' }} <i class="fas fa-arrow-right"></i>
                </button>
              </router-link>
            </div>
          </div>
          <div class="about-image">
            <img :src="aboutImageUrl || 'https://via.placeholder.com/600x400/f3f4f6/6b7280?text=About+Us'"
              alt="About Us" @error="handleImageError" />
          </div>
        </div>
        <div class="about-button-row">
          <router-link to="/about" class="learn-more-link">
            <button class="learn-more-button">
              {{ $t('about.learnMore') || '了解更多' }} <i class="fas fa-arrow-right"></i>
            </button>
          </router-link>
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
      aboutContent: null,
      aboutImageUrl: null,
      bannerHeight: '500px',
      defaultProductDescription: 'We offer the best selection of automotive electronic products. Our            high-quality car vacuum cleaners, tire inflators, and jump starters are designed for maximum performance and reliability.',
    }
  },
  computed: {
    displayProducts() {
      return this.products.filter(product => product.category_id && product.category_id.toString() === this.activeCategory)
    },
    lang() {
      return this.$store.getters['language/currentLanguage'];
    }
  },
  mounted() {
    this.fetchCategories()
    this.fetchProducts()
    this.fetchAboutContent()
    this.updateBannerHeight();
    window.addEventListener('resize', this.updateBannerHeight);
    
    // 监听语言切换事件
    this.$bus.on('language-changed', this.onLanguageChange);
  },
  
  
  beforeUnmount() {
    // 清理事件监听器
    this.$bus.off('language-changed', this.onLanguageChange);
    window.removeEventListener('resize', this.updateBannerHeight);
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
    },
    
    // 获取About Us内容
    async fetchAboutContent() {
      try {
        const response = await this.$api.get(`common-content/content/home.about_us/${this.lang}`);
        const { contentList } = response.data;
        
        if (contentList && contentList.length > 0) {
          this.aboutContent = contentList[0];
          // 直接从接口返回的数据中获取主图
          this.aboutImageUrl = contentList[0].main_image || null;
        }
      } catch (error) {
        console.error('获取About Us内容失败:', error);
        this.aboutContent = null;
        this.aboutImageUrl = null;
      }
    },
     
     // 语言切换处理
     onLanguageChange() {
       this.fetchAboutContent();
     },

    // 更新Banner高度
    updateBannerHeight() {
      if (window.innerWidth <= 768) {
        this.bannerHeight = '250px';
      } else if (window.innerWidth <= 1024) {
        this.bannerHeight = '350px';
      } else {
        this.bannerHeight = '500px';
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
      width: $spacing-6xl / 2 - $spacing-sm;
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
  @include button-outline;
  padding: $spacing-sm $spacing-lg;
  margin: 0 $spacing-xs;
  white-space: nowrap;
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  border-radius: $border-radius-md;
  min-height: $spacing-3xl;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  @include mobile {
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-sm;
    min-height: $spacing-2xl;
    margin: 0 $spacing-xs/2;
  }

  &.active {
    @include button-primary;
    padding: $spacing-sm $spacing-lg;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    min-height: $spacing-3xl;

    @include mobile {
      padding: $spacing-xs $spacing-sm;
      font-size: $font-size-sm;
      min-height: $spacing-2xl;
    }
  }
}

/* More按钮样式 - 与category-button保持一致 */
.more-button {
  @include button-base;
  background-color: $gray-200;
  color: $gray-700;
  padding: $spacing-sm $spacing-lg;
  margin: 0 $spacing-xs;
  white-space: nowrap;
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  border-radius: $border-radius-md;
  min-height: $spacing-3xl;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  @include mobile {
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-sm;
    min-height: $spacing-2xl;
    margin: 0 $spacing-xs/2;
  }

  &:hover:not(:disabled) {
    background-color: $gray-300;
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

    // 电脑端：More按钮在文本区域内
    .desktop-button {
      display: none;

      @include tablet {
        display: block;
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

  .about-button-row {
    margin-top: $spacing-xl;
    display: flex;
    justify-content: flex-start;
    align-items: center;

    // 移动端：显示按钮
    @include mobile {
      margin-top: $spacing-lg;
      display: flex;
    }

    // 电脑端：隐藏按钮
    @include tablet {
      display: none;
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