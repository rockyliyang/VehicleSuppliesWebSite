<template>
  <div class="products-page">
    <!-- Modern Banner Section -->
    <div class="page-banner">
      <div class="banner-content">
        <h1 class="text-4xl font-bold mb-4">{{ $t('products.title') || '产品中心' }}</h1>
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">{{ $t('nav.home') || '首页' }}</el-breadcrumb-item>
            <el-breadcrumb-item>{{ $t('nav.products') || '产品中心' }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </div>
    </div>

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
            <div v-for="product in paginatedProducts" :key="product.id" class="product-card">
              <!-- 在HTML部分，移除product-overlay div -->
              <div class="product-image" @click="$router.push(`/product/${product.id}`)">
                <img :src="product.thumbnail_url" :alt="product.name" @error="handleImageError"
                  class="w-full h-full object-cover object-center">
              </div>
              <div class="product-info">
                <h3 @click="$router.push(`/product/${product.id}`)" class="product-title">{{ product.name }}</h3>
                <div class="product-footer">
                  <span class="product-price">${{ formatPrice(product.price) }}</span>
                  <span v-if="product.promo_message" class="promo-message">{{ product.promo_message }}</span>
                </div>
              </div>
            </div>
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
export default {
  name: 'ProductsPage',
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
    async fetchCategories() {
      try {
        this.loading = true
        const response = await this.$api.get('categories')
        this.categories = response.data || []
      } catch (error) {
        console.error('获取分类失败:', error)
        this.$message.error(error.response?.data?.message || '获取分类失败')
      } finally {
        this.loading = false
      }
    },
    async fetchProducts() {
      try {
        this.loading = true
        const response = await this.$api.get('products')
        this.products = (response.data && response.data.items) ? response.data.items : []
        this.$message.success(response.message || '获取产品成功')
      } catch (error) {
        console.error('获取产品失败:', error)
        this.$message.error('获取产品失败')
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
        router: this.$router,
        message: this.$message,
        api: this.$api
      });
    }
  }
}
</script>

<style scoped>
@import '../assets/styles/shared.css';

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
  --el-color-primary: #dc2626;
}

:deep(.el-pagination .btn-next),
:deep(.el-pagination .btn-prev) {
  color: #dc2626;
}

:deep(.el-pagination .el-pager li:hover) {
  color: #dc2626;
}

:deep(.el-pagination .el-pager li.is-active) {
  color: #dc2626;
  background-color: rgba(220, 38, 38, 0.1);
}

.promo-message {
  font-size: 0.8rem;
  color: #e53e3e;
  /* Red color for promo message */
  background-color: #fff0f0;
  /* Light red background */
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  margin-left: 0.5rem;
}

/* Modern Tech Style for Products Page */
.products-page {
  min-height: 100vh;
  background-color: #ffffff;
}

/* Modern Banner */
.page-banner {
  height: 500px;
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.page-banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('../assets/images/banner1.jpg') center/cover;
  opacity: 0.1;
}

.banner-content {
  position: relative;
  z-index: 2;
}

.banner-content h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

/* Container */
.container {
  max-width: 100%;
}

/* Products Container */
.products-container {
  margin-bottom: 2rem;
}

/* Category Navigation */
.category-navigation {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.category-tab {
  padding: 0.75rem 1.5rem;
  border-radius: 0.25rem;
  font-size: 1rem;
  font-weight: 500;
  color: #4b5563;
  position: relative;
  transition: color 0.2s ease;
  background: #ffffff !important;
  background-color: #ffffff !important;
}

.category-tab:hover {
  color: #dc2626;
}

.category-tab.active {
  color: #dc2626;
  font-weight: 600;
}

.category-tab.active::after {
  content: "";
  position: absolute;
  bottom: -3px;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: #dc2626;
  border-radius: 2px;
}

.category-navigation-wrapper {
  background: #ffffff !important;
  background-color: #ffffff !important;
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
  /* Adjusted minmax for smaller cards */
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* Products页面特有的产品卡片样式覆盖 */
.products-grid .product-card:hover {
  transform: translateY(-0.25rem);
}

.product-image {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  transition: transform 0.5s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.product-info {
  padding: 1rem;
}

.product-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1f2937;
  cursor: pointer;
  transition: color 0.3s ease;
  line-height: 1.4;
  height: auto;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-title:hover {
  color: #dc2626;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.add-to-cart-btn {
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
}

.add-to-cart-btn:hover {
  background: #991b1b;
  transform: translateY(-1px);
}

/* No Products */
.no-products {
  text-align: center;
  padding: 4rem 0;
  color: #6b7280;
}

/* Modern Pagination */
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #f3f4f6;
}

.modern-pagination {
  --el-color-primary: #dc2626;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }

  .category-navigation {
    padding: 1rem;
  }

  .category-navigation .flex {
    gap: 1rem;
  }

  .category-navigation button {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .products-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .banner-content h1 {
    font-size: 2rem;
  }

  .products-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .product-footer {
    flex-direction: column;
    gap: 0.5rem;
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
  padding-left: 1rem;
  padding-right: 1rem;
}

.py-8 {
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.text-red-600 {
  color: #dc2626;
}

.font-bold {
  font-weight: 700;
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
  margin-right: 0.5rem;
}
</style>
