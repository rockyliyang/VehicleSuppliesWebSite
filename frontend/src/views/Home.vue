<template>
  <div class="home">
    <!-- Banner轮播图 -->
    <div class="banner-container">
      <el-carousel height="500px" indicator-position="outside">
        <el-carousel-item v-for="(item, index) in banners" :key="index">
          <div class="banner-item" :style="{ backgroundImage: `url(${item.image_url})` }">
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

    <!-- Products Section -->
    <section class="py-16 bg-white">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold mb-2">
            Our <span class="text-red-600">Products</span>
          </h2>
          <div class="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
          <p class="text-gray-600 max-w-3xl mx-auto">
            {{ $t('products.description') || defaultProductDescription}}
          </p>
        </div>

        <!-- Product Categories Tabs -->
        <div class="mb-10">
          <div class="flex flex-wrap justify-center gap-2 mb-8">
            <button v-for="category in categories" :key="category.id"
              :class="activeCategory === category.id.toString() ? 'px-6 py-2 bg-red-600 text-white rounded-md !rounded-button whitespace-nowrap cursor-pointer' : 'px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 !rounded-button whitespace-nowrap cursor-pointer'"
              @click="activeCategory = category.id.toString()">
              {{ category.name }}
            </button>
            <button
              class="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 !rounded-button whitespace-nowrap cursor-pointer">
              {{ $t('products.more') || 'More' }}
            </button>
          </div>
        </div>

        <!-- Product Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div v-for="product in displayProducts" :key="product.id"
            class="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
            <router-link :to="`/product/${product.id}`">
              <div class="h-64 overflow-hidden">
                <img :src="product.thumbnail_url" :alt="product.name" @error="handleImageError"
                  class="w-full h-full object-cover object-center">
              </div>
              <div class="p-4">
                <h3 class="text-lg font-semibold mb-2">{{ product.name }}</h3>
                <p class="text-gray-600 text-sm mb-3">{{ product.description || 'Powerful suction with long batter life'
                  }}</p>
                <div class="flex justify-between items-center">
                  <span class="text-red-600 font-bold">${{ product.price || '59.99' }}</span>
                  <button class="text-red-600 hover:text-red-800 !rounded-button whitespace-nowrap cursor-pointer">
                    <i class="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            </router-link>
          </div>
        </div>

        <div class="text-center mt-12">
          <router-link to="/products">
            <button
              class="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition duration-300 !rounded-button whitespace-nowrap cursor-pointer">
              {{ $t('products.viewAll') || 'View All Products' }} <i class="fas fa-arrow-right ml-2"></i>
            </button>
          </router-link>
        </div>
      </div>
    </section>

    <!-- About Us Section -->
    <section class="py-16 bg-gray-100">
      <div class="container mx-auto px-4">
        <div class="flex flex-col md:flex-row items-center gap-12">
          <div class="md:w-1/2">
            <h2 class="text-3xl font-bold mb-2">
              About <span class="text-red-600">Us</span>
            </h2>
            <div class="w-24 h-1 bg-red-600 mb-6"></div>
            <p class="text-gray-700 mb-6">
              {{ $t('about.description1') ||
              '我们是一家专业的汽车电子产品制造商，致力于为客户提供高品质的汽车吸尘器、充气泵、启动电源等产品。我们拥有先进的生产设备和专业的技术团队，确保每一款产品都能满足客户的需求。' }}
            </p>
            <p class="text-gray-700 mb-6">
              {{ $t('about.description2') || '我们的产品以卓越的性能、可靠的品质和创新的设计而闻名，已经获得了众多客户的信赖和好评。我们不断追求技术创新和产品改进，为客户提供更好的产品和服务。'
              }}
            </p>
            <router-link to="/about">
              <button
                class="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition duration-300 !rounded-button whitespace-nowrap cursor-pointer">
                {{ $t('about.learnMore') || '了解更多' }} <i class="fas fa-arrow-right ml-2"></i>
              </button>
            </router-link>
          </div>
          <div class="md:w-1/2">
            <img src="https://via.placeholder.com/600x400/f3f4f6/6b7280?text=About+Us" alt="About Us"
              class="rounded-lg shadow-lg w-full h-auto" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
// import axios from 'axios';
import { handleImageError } from '../utils/imageUtils';

export default {
  name: 'HomePage',
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

<style scoped>
/* Banner轮播图样式 */
.banner-container {
  width: 100%;
  height: 500px;
}

.banner-item {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* 基础样式 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Grid 样式 */
.grid {
  display: grid;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.gap-8 {
  gap: 2rem;
}

/* 响应式网格 */
@media (min-width: 640px) {
  .sm\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
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