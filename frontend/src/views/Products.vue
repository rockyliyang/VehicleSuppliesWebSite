<template>
  <div class="products-page">
    <div class="page-banner">
      <div class="banner-content">
        <h1>产品中心</h1>
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>产品中心</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="products-container">
        <div class="filter-sidebar">
          <h3>产品分类</h3>
          <ul class="category-list">
            <li v-for="category in categories" :key="category.id"
              :class="{ active: selectedCategory === category.id.toString() }"
              @click="selectCategory(category.id.toString())">
              {{ category.name }}
            </li>
          </ul>
        </div>

        <div class="products-content">
          <div class="products-header">
            <div class="products-count">
              共 <span>{{ filteredProducts.length }}</span> 个产品
            </div>
            <div class="products-sort">
              <el-select v-model="sortOption" placeholder="排序方式" size="small">
                <el-option label="默认排序" value="default"></el-option>
                <el-option label="价格从低到高" value="price-asc"></el-option>
                <el-option label="价格从高到低" value="price-desc"></el-option>
              </el-select>
            </div>
          </div>

          <div class="products-grid">
            <div v-for="product in sortedProducts" :key="product.id" class="product-card">
              <div class="product-image" @click="$router.push(`/product/${product.id}`)" style="cursor: pointer;">
                <img :src="product.thumbnail_url || require('../assets/images/default-image.svg')" :alt="product.name"
                  @error="handleImageError">
              </div>
              <div class="product-info">
                <h3 @click="$router.push(`/product/${product.id}`)" style="cursor: pointer;">{{ product.name }}</h3>
                <div class="product-price">¥{{ formatPrice(product.price) }}</div>
              </div>
              <div class="product-actions">
                <el-button type="primary" size="small" @click="addToInquiry(product)">加入购物车</el-button>
              </div>
            </div>
          </div>

          <div v-if="filteredProducts.length === 0" class="no-products">
            <i class="el-icon-warning-outline"></i>
            <p>暂无相关产品</p>
          </div>

          <div class="pagination-container">
            <el-pagination background layout="prev, pager, next" :total="filteredProducts.length" :page-size="12"
              @current-change="handleCurrentChange"></el-pagination>
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
      this.$router.push({ query: { category: categoryId } })
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
.products-page {
  min-height: 100vh;
}

.page-banner {
  height: 200px;
  background-color: #f5f5f5;
  background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('../assets/images/banner1.jpg');
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
  margin-bottom: 40px;
}

.banner-content h1 {
  font-size: 32px;
  margin-bottom: 10px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

.products-container {
  display: flex;
  gap: 30px;
  margin-bottom: 40px;
}

.filter-sidebar {
  width: 250px;
  flex-shrink: 0;
}

.filter-sidebar h3 {
  font-size: 18px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.category-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.category-list li {
  padding: 10px 0;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  transition: all 0.3s;
}

.category-list li:hover {
  color: #409EFF;
}

.category-list li.active {
  color: #409EFF;
  font-weight: bold;
}

.products-content {
  flex: 1;
}

.products-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.products-count span {
  font-weight: bold;
  color: #409EFF;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.product-card:hover {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transform: translateY(-5px);
}

.product-image {
  height: 200px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.product-info {
  padding: 15px;
}

.product-info h3 {
  font-size: 16px;
  margin-bottom: 12px;
  height: 40px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-price {
  font-size: 18px;
  color: #f56c6c;
  font-weight: bold;
  margin-bottom: 10px;
}

.product-actions {
  padding: 0 15px 15px;
  display: flex;
  justify-content: center;
}

.product-card {
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.3s;
  background-color: white;
  display: flex;
  flex-direction: column;
}

.product-info {
  padding: 15px;
  flex-grow: 1;
  text-align: center;
}

.no-products {
  text-align: center;
  padding: 50px 0;
  color: #909399;
}

.no-products i {
  font-size: 48px;
  margin-bottom: 10px;
}

.pagination-container {
  text-align: center;
  margin-top: 30px;
}

@media (max-width: 768px) {
  .products-container {
    flex-direction: column;
  }

  .filter-sidebar {
    width: 100%;
    margin-bottom: 20px;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}
</style>
