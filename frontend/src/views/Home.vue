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
        <h2>Our <span>Products</span></h2>
        <div class="title-underline"></div>
      </div>

      <div class="product-categories">
        <div class="category-tabs">
          <el-tabs v-model="activeCategory">
            <el-tab-pane v-for="category in categories" :key="category.id" :label="category.name" :name="category.id.toString()"></el-tab-pane>
          </el-tabs>
        </div>

        <div class="product-grid">
          <div v-for="product in displayProducts" :key="product.id" class="product-card">
            <router-link :to="`/product/${product.id}`">
              <div class="product-image">
                <img :src="product.thumbnail_url" :alt="product.name" @error="handleImageError">
              </div>
              <div class="product-info">
                <h3>{{ product.name }}</h3>
              </div>
            </router-link>
          </div>
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
      activeCategory: '1',
      banners: [
        { image_url: require('../assets/images/banner1.jpg') },
        { image_url: require('../assets/images/banner2.jpg') },
        { image_url: require('../assets/images/banner3.jpg') }
      ],
      categories: [
        { id: 1, name: '汽车吸尘器' },
        { id: 2, name: '车载充电器' },
        { id: 3, name: '汽车应急启动电源' },
        { id: 4, name: '其他' }
      ],
      products: [
        { 
          id: 1, 
          category_id: 1, 
          name: 'XWC-001 Car Vacuum Cleaner', 
          thumbnail_url: require('../assets/images/product1.jpg')
        },
        { 
          id: 2, 
          category_id: 1, 
          name: 'XWC-002 Vacuum Cleaner', 
          thumbnail_url: require('../assets/images/product2.jpg')
        },
        { 
          id: 3, 
          category_id: 1, 
          name: 'XWC-003 Car Vacuum Cleaner', 
          thumbnail_url: require('../assets/images/product3.jpg')
        },
        { 
          id: 4, 
          category_id: 1, 
          name: 'XWC-004 Car Vacuum Cleaner', 
          thumbnail_url: require('../assets/images/product4.jpg')
        },
        { 
          id: 5, 
          category_id: 3, 
          name: 'F-39 4000A 12V&24V Jump Starter', 
          thumbnail_url: require('../assets/images/product5.jpg')
        },
        { 
          id: 6, 
          category_id: 3, 
          name: 'F-25 2000A Jump Starter', 
          thumbnail_url: require('../assets/images/product6.jpg')
        },
        { 
          id: 7, 
          category_id: 3, 
          name: 'F-18 Wireless Charger Jump Starter', 
          thumbnail_url: require('../assets/images/product7.jpg')
        },
        { 
          id: 8, 
          category_id: 3, 
          name: 'F-8 12V Jump Starter', 
          thumbnail_url: require('../assets/images/product8.jpg')
        }
      ]
    }
  },
  computed: {
    displayProducts() {
      return this.products.filter(product => product.category_id.toString() === this.activeCategory)
    }
  },
  mounted() {
    // 在实际项目中，这里会从API获取数据
    // this.fetchBanners()
    // this.fetchCategories()
    // this.fetchProducts()
  },
  methods: {
    handleImageError,
    // 这些方法在实际项目中会调用API
    fetchBanners() {
      // axios.get('/api/banners').then(response => {
      //   this.banners = response.data
      // })
    },
    fetchCategories() {
      // axios.get('/api/categories').then(response => {
      //   this.categories = response.data
      //   if (this.categories.length > 0) {
      //     this.activeCategory = this.categories[0].id.toString()
      //   }
      // })
    },
    fetchProducts() {
      // axios.get('/api/products').then(response => {
      //   this.products = response.data
      // })
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

.section-title h2 {
  font-size: 28px;
  font-weight: bold;
}

.section-title span {
  color: #e60012;
}

.title-underline {
  width: 60px;
  height: 3px;
  background-color: #e60012;
  margin: 15px auto;
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
  transition: all 0.3s ease;
}

.product-card:hover {
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
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
  transition: transform 0.3s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.product-info {
  padding: 15px;
  text-align: center;
}

.product-info h3 {
  font-size: 16px;
  margin: 0;
  color: #333;
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
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
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