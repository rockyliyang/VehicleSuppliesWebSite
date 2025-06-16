<template>
  <div class="products-page">
    <!-- Modern Banner Section -->
    <PageBanner :title="$t('products.title') || '产品中心'" />
    <NavigationMenu :breadcrumb-items="breadcrumbItems" />
    <!-- Category Navigation -->
    <div class="category-navigation-wrapper py-8">
      <div class="container mx-auto">
        <div class="flex justify-center py-12">
          <div class="flex space-x-8 category-tabs">
            <button :class="selectedCategory === null ? 'category-tab active ' : 'category-tab '"
              @click="selectCategory(null)">
              {{ $t('products.allCategories') || '全部产品' }}
            </button>
            <button v-for="category in categories" :key="category.id"
              :class="selectedCategory === category.id.toString() ? 'category-tab active' : 'category-tab'"
              @click="selectCategory(category.id.toString())">
              {{ category.name }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 pt-16 pb-24">

      <div class="products-container">
        <!-- Products Content -->
        <div class="products-content">

          <!-- Modern Products Grid -->
          <div class="products-grid">
            <ProductCard v-for="product in paginatedProducts" :key="product.id" :product="product"
              :show-description="true" :show-arrow="true"
              :default-description="'Powerful suction with long battery life'" card-style="products"
              @card-click="handleProductClick" @title-click="handleProductClick" />
          </div>

          <!-- No Products Message -->
          <div v-if="filteredProducts.length === 0" class="no-products">
            <i class="fas fa-search text-6xl text-gray-400 mb-4"></i>
            <p class="text-xl text-gray-500">{{ $t('products.noProducts') || '暂无相关产品' }}</p>
          </div>

          <!-- Modern Pagination -->
          <div class="pagination-container">
            <el-pagination background layout="total, prev, pager, next, jumper" :total="filteredProducts.length"
              :page-size="12" :current-page="currentPage" @current-change="handleCurrentChange"
              class="modern-pagination">
            </el-pagination>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { handleImageError } from '../utils/imageUtils';
import { formatPrice } from '../utils/format';
import { addToCart } from '../utils/cartUtils';
import ProductCard from '../components/common/ProductCard.vue';
import PageBanner from '../components/common/PageBanner.vue';
import NavigationMenu from '@/components/common/NavigationMenu.vue';

export default {
  name: 'ProductsPage',
  components: {
    ProductCard,
    PageBanner,
    NavigationMenu
  },
  data() {
    return {
      products: [],
      categories: [],
      selectedCategory: null,
      sortOption: 'default',
      currentPage: 1,
      loading: false
    }
  },
  computed: {
    breadcrumbItems() {
      return [
        { text: this.$t('products.title') || '产品中心' }
      ];
    },
    filteredProducts() {
      if (!this.selectedCategory) {
        return this.products
      }
      return this.products.filter(product => product.category_id && product.category_id.toString() === this.selectedCategory)
    },
    sortedProducts() {
      const products = [...this.filteredProducts]
      
      switch(this.sortOption) {
        case 'price-asc':
          return products.sort((a, b) => a.price - b.price)
        case 'price-desc':
          return products.sort((a, b) => b.price - a.price)
        default:
          return products
      }
    },
    paginatedProducts() {
      const startIndex = (this.currentPage - 1) * 12
      return this.sortedProducts.slice(startIndex, startIndex + 12)
    }
  },
  created() {
    this.fetchCategories()
    this.fetchProducts()
    
    // 检查URL中是否有分类参数
    const categoryId = this.$route.query.category
    if (categoryId) {
      this.selectedCategory = categoryId.toString()
    }
  },
  methods: {
    formatPrice,
    handleImageError,
    handleProductClick(product) {
      // 产品点击事件处理，可以在这里添加额外的逻辑
      console.log('Product clicked:', product);
    },
    async fetchCategories() {
      try {
        this.loading = true
        const response = await this.$api.get('categories')
        this.categories = response.data || []
      } catch (error) {
        console.error('获取分类失败:', error)
        this.$messageHandler.showError(error, 'category.error.fetchFailed')
      } finally {
        this.loading = false
      }
    },
    async fetchProducts() {
      try {
        this.loading = true
        const response = await this.$api.get('products')
        this.products = (response.data && response.data.items) ? response.data.items : []
        //this.$messageHandler.showSuccess(response.message || '获取产品成功', 'product.success.fetchSuccess')
      } catch (error) {
        console.error('获取产品失败:', error)
        this.$messageHandler.showError(error, 'products.error.fetchFailed')
      } finally {
        this.loading = false
      }
    },
    selectCategory(categoryId) {
      this.selectedCategory = categoryId
      this.currentPage = 1
      
      // 更新URL参数
      if (categoryId === null) {
        this.$router.push({ query: {} })
      } else {
        this.$router.push({ query: { category: categoryId } })
      }
    },
    handleCurrentChange(page) {
      this.currentPage = page
      // 滚动到页面顶部
      window.scrollTo(0, 0)
    },
    async addToInquiry(product) {
      // 使用公共的购物车工具函数
      await addToCart(product, {
          store: this.$store,
          router: this.$router,
          api: this.$api,
          $t: this.$t,
          messageHandler: this.$messageHandler,
          $bus: this.$bus
        });
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';
@import '@/assets/styles/_mixins.scss';

/* 确保字体与全局保持一致 */
* {
  font-family: $font-family-base;
}

/* Element UI 组件样式穿透 */
:deep(.el-breadcrumb__inner a) {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
}

:deep(.el-breadcrumb__inner a:hover) {
  color: #ffffff;
}

:deep(.el-breadcrumb__separator) {
  color: rgba(255, 255, 255, 0.6);
}

:deep(.el-pagination) {
  --el-color-primary: #{$primary-color};
  font-size: $font-size-md;
  font-weight: $font-weight-medium;
}

:deep(.el-pagination .btn-next),
:deep(.el-pagination .btn-prev) {
  color: $primary-color;
  font-size: $font-size-md;
}

:deep(.el-pagination .el-pager li) {
  font-size: $font-size-md;
  font-weight: $font-weight-medium;
}

:deep(.el-pagination .el-pager li:hover) {
  color: $primary-color;
}

:deep(.el-pagination .el-pager li.is-active) {
  color: $primary-color;
  background-color: rgba(220, 38, 38, 0.1);
  font-weight: $font-weight-semibold;
}

:deep(.el-pagination .el-pagination__total) {
  font-size: $font-size-md;
  color: $text-secondary;
}

:deep(.el-pagination .el-pagination__jump) {
  font-size: $font-size-md;
  color: $text-secondary;
}

.promo-message {
  font-size: $font-size-xs;
  color: $error-color;
  background-color: rgba($error-color, 0.1);
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  margin-left: $spacing-sm;
}

/* Modern Tech Style for Products Page */
.products-page {
  min-height: 100vh;
  background-color: $white;
}

/* 确保PageBanner的遮罩效果正常显示 */
:deep(.page-banner::before) {
  background: rgba(0, 0, 0, 0.2) !important;
}



/* Container */
.container {
  @include container;
}

/* Products Container */
.products-container {
  margin-bottom: $spacing-xl;
}

/* Category Navigation */
.category-navigation {
  background: $white;
  border-radius: $border-radius-lg;
  padding: $spacing-xl;
  box-shadow: $shadow-md;
  border: 1px solid $gray-200;
}

.category-tab {
  padding: $spacing-sm $spacing-lg;
  border-radius: $border-radius-sm;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  color: $text-secondary;
  position: relative;
  transition: $transition-base;
  background: $white !important;
  background-color: $white !important;
}

.category-tab:hover {
  color: $primary-color;
}

.category-tab.active {
  color: $primary-color;
  font-weight: $font-weight-semibold;
}

.category-tab.active::after {
  content: "";
  position: absolute;
  bottom: -3px;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: $primary-color;
  border-radius: $border-radius-sm;
}

.category-navigation-wrapper {
  background: $white !important;
  background-color: $white !important;
}

.category-tabs {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.category-tabs::-webkit-scrollbar {
  display: none;
}

/* Products Content */
.products-content {
  padding: 0;
}

/* Modern Products Grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: $spacing-xl;
  margin-bottom: $spacing-xl;
}

/* Products页面特定的产品卡片样式覆盖 */
.products-style {
  /* 这些样式会应用到ProductCard组件上 */
}

/* No Products */
.no-products {
  text-align: center;
  padding: $spacing-4xl 0;
  color: $text-muted;
}

/* Modern Pagination */
.pagination-container {
  @include flex-center;
  margin-top: $spacing-xl;
  padding-top: $spacing-xl;
  border-top: 2px solid $gray-100;
}

.modern-pagination {
  --el-color-primary: #{$primary-color};
}

/* Responsive Design */
@include desktop {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@include tablet {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: $spacing-lg;
  }

  .category-navigation {
    padding: $spacing-lg;
  }

  .category-navigation .flex {
    gap: $spacing-lg;
  }

  .category-navigation button {
    padding: $spacing-sm $spacing-lg;
    font-size: $font-size-sm;
  }

  .products-header {
    @include flex-column;
    align-items: flex-start;
    gap: $spacing-lg;
  }
}

@include mobile {
  .banner-content h1 {
    font-size: $font-size-3xl;
  }

  .products-header {
    @include flex-column;
    gap: $spacing-lg;
    align-items: stretch;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: $spacing-lg;
  }

  .product-footer {
    @include flex-column;
    gap: $spacing-sm;
  }

  .add-to-cart-btn {
    width: 100%;
    justify-content: center;
  }
}

/* Utility Classes */
.mx-auto {
  margin-left: auto;
  margin-right: auto;
}

.px-4 {
  padding-left: $spacing-lg;
  padding-right: $spacing-lg;
}

.py-8 {
  padding-top: $spacing-xl;
  padding-bottom: $spacing-xl;
}

.text-red-600 {
  color: $primary-color;
}

.font-bold {
  font-weight: $font-weight-bold;
}

.w-full {
  width: 100%;
}

.h-full {
  height: 100%;
}

.object-cover {
  object-fit: cover;
}

.object-center {
  object-position: center;
}

.mr-2 {
  margin-right: $spacing-sm;
}
</style>
