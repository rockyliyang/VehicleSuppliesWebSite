<template>
  <div class="home">
    <!-- Banner轮播图 -->
    <div class="banner-container">
      <el-carousel height="500px" indicator-position="outside">
        <el-carousel-item v-for="(item, index) in banners" :key="index">
          <div class="banner-item" :style="{ backgroundImage: `url(${item.image_url})` }">
            <div class="banner-content">
              <h2 v-if="index === 0">CAR VACUUM CLEANER</h2>
              <div v-if="index === 0" class="banner-features">
                <div class="feature">
                  <i class="el-icon-success"></i>
                  <span>STRONG SUCTION</span>
                </div>
                <div class="feature">
                  <i class="el-icon-time"></i>
                  <span>LONG BATTERY LIFE</span>
                </div>
              </div>
              <div v-if="index === 0" class="banner-slogan">
                <h3>STRONG SUCTION</h3>
                <p>EASY TO CLEAN ALL KINDS OF GARBAGE</p>
              </div>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

    <!-- 产品展示部分 -->
    <div class="products-section">
      <div class="section-title">
        <h2><span class="section-title-main">Our</span> <span class="section-title-red">Products</span></h2>
        <div class="title-underline"></div>
        <div class="section-subtitle">Your Car, Our Expert Care: Nurturing Automotive Excellence</div>
      </div>

      <div class="product-categories">
        <div class="category-btn-group">
          <button
            v-for="category in categories"
            :key="category.id"
            :class="['category-btn', activeCategory === category.id.toString() ? 'active' : '']"
            @click="activeCategory = category.id.toString()"
          >
            {{ category.name }}
          </button>
          <button class="category-btn more-btn">More</button>
        </div>
      </div>

      <div class="product-grid">
        <div v-for="product in displayProducts" :key="product.id" class="product-card">
          <router-link :to="`/product/${product.id}`">
            <div class="product-image">
              <img :src="product.thumbnail_url" :alt="product.name" @error="handleImageError">
            </div>
            <div class="product-info">
              <h3 class="product-title">{{ product.name }}</h3>
            </div>
          </router-link>
        </div>
      </div>
    </div>

    <!-- 关于我们部分 -->
    <div class="about-section">
      <div class="section-title">
        <h2>About <span>Us</span></h2>
        <div class="title-underline"></div>
      </div>

      <div class="about-content">
        <div class="about-text">
          <p>我们是一家专业从事汽车用品研发、生产和销售的公司，拥有多年的行业经验和专业技术。我们致力于为客户提供高品质、高性能的汽车用品，包括汽车吸尘器、车载充电器和汽车应急启动电源等产品。</p>
          <p>我们的产品以卓越的性能、可靠的品质和创新的设计而闻名，已经获得了众多客户的信赖和好评。我们不断追求技术创新和产品改进，为客户提供更好的产品和服务。</p>
          <router-link to="/about" class="more-btn">了解更多</router-link>
        </div>
        <div class="about-image">
          <img src="../assets/images/about-car.jpg" alt="About Us">
        </div>
      </div>
    </div>
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
      products: []
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
.home {
  width: 100%;
}

/* Banner样式 */
.banner-container {
  width: 100%;
  margin-bottom: 40px;
}

.banner-item {
  height: 100%;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  padding-left: 10%;
  color: white;
}

.banner-content {
  max-width: 600px;
}

.banner-content h2 {
  font-size: 36px;
  margin-bottom: 20px;
  font-weight: bold;
}

.banner-features {
  display: flex;
  margin-bottom: 30px;
}

.feature {
  display: flex;
  align-items: center;
  margin-right: 30px;
}

.feature i {
  margin-right: 10px;
  font-size: 20px;
}

.banner-slogan h3 {
  font-size: 32px;
  margin-bottom: 10px;
  font-weight: bold;
}

.banner-slogan p {
  font-size: 18px;
}

/* 产品部分样式 */
.products-section {
  padding: 40px 5%;
}

.section-title {
  text-align: center;
  margin-bottom: 30px;
}

.section-title-main {
  font-size: 28px;
  font-weight: bold;
  color: #222;
}
.section-title-red {
  font-size: 28px;
  font-weight: bold;
  color: #e60012;
}
.section-subtitle {
  color: #888;
  font-size: 16px;
  margin-top: 10px;
  margin-bottom: 10px;
}

.title-underline {
  width: 60px;
  height: 3px;
  background-color: #e60012;
  margin: 15px auto;
}

.category-btn-group {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
}
.category-btn {
  padding: 10px 28px;
  border: 1px solid #ddd;
  background: #fff;
  color: #222;
  font-size: 16px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s;
}
.category-btn.active {
  background: #e60012;
  color: #fff;
  border-color: #e60012;
}
.category-btn.more-btn {
  background: #fff;
  color: #222;
  border: 1px solid #ddd;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-top: 30px;
}

.product-card {
  border: 1px solid #eee;
  border-radius: 5px;
  overflow: hidden;
  background: #fff;
  transition: box-shadow 0.2s;
  box-shadow: none;
}
.product-card:hover {
  box-shadow: 0 5px 15px rgba(230, 0, 18, 0.08);
  transform: translateY(-3px);
}
.product-image {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  overflow: hidden;
}
.product-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease;
}
.product-card:hover .product-image img {
  transform: scale(1.05);
}
.product-info {
  padding: 15px;
  text-align: center;
}
.product-title {
  font-size: 18px;
  font-weight: bold;
  color: #222;
  margin: 0;
}

/* 关于我们部分 */
.about-section {
  padding: 40px 5%;
  background-color: #f8f8f8;
}

.about-content {
  display: flex;
  align-items: center;
  gap: 40px;
}

.about-text {
  flex: 1;
}

.about-text p {
  margin-bottom: 15px;
  line-height: 1.6;
}

.about-image {
  flex: 1;
}

.about-image img {
  width: 100%;
  border-radius: 5px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.more-btn {
  display: inline-block;
  padding: 10px 25px;
  background-color: #e60012;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  margin-top: 15px;
  transition: background-color 0.3s ease;
}

.more-btn:hover {
  background-color: #c5000f;
}

@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .about-content {
    flex-direction: column;
  }

  .banner-content h2 {
    font-size: 28px;
  }

  .banner-slogan h3 {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .product-grid {
    grid-template-columns: 1fr;
  }
}
</style>