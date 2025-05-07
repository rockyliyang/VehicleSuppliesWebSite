<template>
  <div class="product-detail-page">
    <div class="page-banner">
      <div class="banner-content">
        <h1>产品详情</h1>
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item :to="{ path: '/products' }">产品中心</el-breadcrumb-item>
            <el-breadcrumb-item>{{ product.name }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </div>
    </div>

    <div class="container" v-loading="loading">
      <div v-if="product.id" class="product-detail">
        <div class="product-gallery">
          <div class="main-image">
            <img :src="product.thumbnail_url" :alt="product.name">
          </div>
          <div class="thumbnail-list">
            <div class="thumbnail active">
              <img :src="product.thumbnail_url" :alt="product.name">
            </div>
            <!-- 实际项目中会有多张产品图片 -->
          </div>
        </div>

        <div class="product-info">
          <h1 class="product-title">{{ product.name }}</h1>
          <div class="product-meta">
            <span class="product-id">产品编号: {{ product.id }}</span>
            <span class="product-category">分类: {{ categoryName }}</span>
          </div>
          <div class="product-price">¥{{ product.price ? product.price.toFixed(2) : '0.00' }}</div>
          <div class="product-stock">
            <span :class="['stock-status', product.stock > 0 ? 'in-stock' : 'out-of-stock']">
              {{ product.stock > 0 ? '有货' : '缺货' }}
            </span>
            <span class="stock-number">库存: {{ product.stock }}</span>
          </div>
          <div class="product-short-desc">
            <p>{{ product.short_description }}</p>
          </div>
          <div class="product-actions">
            <el-input-number v-model="quantity" :min="1" :max="product.stock" size="small"></el-input-number>
            <el-button type="primary" @click="addToInquiry" :disabled="product.stock <= 0">加入询价单</el-button>
            <el-button @click="contactUs">联系我们</el-button>
          </div>
          <div class="product-share">
            <span>分享到:</span>
            <div class="share-icons">
              <i class="el-icon-s-platform"></i>
              <i class="el-icon-s-promotion"></i>
              <i class="el-icon-picture-outline"></i>
              <i class="el-icon-s-custom"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="product-tabs">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="产品详情" name="description">
            <div class="product-description" v-html="product.description || '暂无详细描述'">
            </div>
          </el-tab-pane>
          <el-tab-pane label="规格参数" name="specifications">
            <div class="product-specifications">
              <table class="specs-table">
                <tbody>
                  <tr>
                    <th>品牌</th>
                    <td>AUTO EASE</td>
                  </tr>
                  <tr>
                    <th>型号</th>
                    <td>{{ product.name }}</td>
                  </tr>
                  <tr>
                    <th>颜色</th>
                    <td>黑色/白色</td>
                  </tr>
                  <tr>
                    <th>材质</th>
                    <td>ABS塑料</td>
                  </tr>
                  <tr>
                    <th>产品尺寸</th>
                    <td>30 x 10 x 8 cm</td>
                  </tr>
                  <tr>
                    <th>重量</th>
                    <td>0.5 kg</td>
                  </tr>
                  <tr>
                    <th>保修期</th>
                    <td>12个月</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </el-tab-pane>
          <el-tab-pane label="相关产品" name="related">
            <div class="related-products">
              <div class="products-grid">
                <div v-for="item in relatedProducts" :key="item.id" class="product-card">
                  <router-link :to="`/product/${item.id}`">
                    <div class="product-image">
                      <img :src="item.thumbnail_url" :alt="item.name">
                    </div>
                    <div class="product-info">
                      <h3>{{ item.name }}</h3>
                      <p class="product-desc">{{ item.short_description }}</p>
                      <div class="product-price">¥{{ item.price.toFixed(2) }}</div>
                    </div>
                  </router-link>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <div class="inquiry-form">
        <h2>产品询价</h2>
        <el-form :model="inquiryForm" :rules="inquiryRules" ref="inquiryForm" label-width="100px">
          <el-form-item label="姓名" prop="name">
            <el-input v-model="inquiryForm.name"></el-input>
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="inquiryForm.email"></el-input>
          </el-form-item>
          <el-form-item label="电话" prop="phone">
            <el-input v-model="inquiryForm.phone"></el-input>
          </el-form-item>
          <el-form-item label="询价内容" prop="message">
            <el-input type="textarea" v-model="inquiryForm.message" rows="4"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="submitInquiry">提交询价</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'ProductDetail',
  data() {
    return {
      productId: null,
      product: {},
      categories: [],
      quantity: 1,
      activeTab: 'description',
      loading: false,
      relatedProducts: [],
      inquiryForm: {
        name: '',
        email: '',
        phone: '',
        message: ''
      },
      inquiryRules: {
        name: [
          { required: true, message: '请输入您的姓名', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入您的邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ],
        phone: [
          { required: true, message: '请输入您的电话', trigger: 'blur' }
        ],
        message: [
          { required: true, message: '请输入询价内容', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    categoryName() {
      if (!this.product.category_id || !this.categories.length) return ''
      const category = this.categories.find(cat => cat.id === this.product.category_id)
      return category ? category.name : ''
    }
  },
  created() {
    this.productId = parseInt(this.$route.params.id)
    this.fetchCategories()
    this.fetchProduct()
  },
  methods: {
    async fetchCategories() {
      try {
        const response = await axios.get('/api/categories')
        this.categories = response.data.data
      } catch (error) {
        console.error('获取分类失败:', error)
      }
    },
    async fetchProduct() {
      try {
        this.loading = true
        const response = await axios.get(`/api/products/${this.productId}`)
        this.product = response.data.data
        
        // 获取相关产品（同类别的其他产品）
        this.fetchRelatedProducts()
      } catch (error) {
        console.error('获取产品详情失败:', error)
        this.$message.error('获取产品详情失败')
      } finally {
        this.loading = false
      }
    },
    async fetchRelatedProducts() {
      if (!this.product.category_id) return
      
      try {
        const response = await axios.get(`/api/products/category/${this.product.category_id}`)
        // 过滤掉当前产品
        this.relatedProducts = response.data.data.filter(p => p.id !== this.product.id).slice(0, 4)
      } catch (error) {
        console.error('获取相关产品失败:', error)
      }
    },
    addToInquiry() {
      const productWithQuantity = {
        ...this.product,
        quantity: this.quantity
      }
      this.$store.commit('addToCart', productWithQuantity)
      this.$message.success(`已将 ${this.quantity} 个 ${this.product.name} 添加到询价单`)
    },
    contactUs() {
      this.$router.push('/contact')
    },
    submitInquiry() {
      this.$refs.inquiryForm.validate(valid => {
        if (valid) {
          // 实际项目中会发送到后端API
          this.$message.success('询价信息已提交，我们会尽快与您联系')
          this.$refs.inquiryForm.resetFields()
        }
      })
    }
  },
  watch: {
    // 监听路由参数变化，切换产品时重新获取数据
    '$route.params.id'(newId) {
      this.productId = parseInt(newId)
      this.fetchProduct()
    }
  }
}
</script>

<style scoped>
.product-detail-page {
  min-height: 100vh;
}

.page-banner {
  height: 200px;
  background-color: #f5f5f5;
  background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('../assets/images/banner1.jpg');
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

.product-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  margin-bottom: 40px;
}

.product-gallery {
  flex: 1;
  min-width: 300px;
  max-width: 500px;
}

.main-image {
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.main-image img {
  width: 100%;
  height: auto;
  display: block;
}

.thumbnail-list {
  display: flex;
  gap: 10px;
}

.thumbnail {
  width: 80px;
  height: 80px;
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.thumbnail.active {
  border-color: #409EFF;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  flex: 1;
  min-width: 300px;
}

.product-title {
  font-size: 24px;
  margin-bottom: 15px;
}

.product-meta {
  display: flex;
  gap: 20px;
  color: #666;
  margin-bottom: 15px;
}

.product-price {
  font-size: 24px;
  color: #f56c6c;
  font-weight: bold;
  margin-bottom: 15px;
}

.product-stock {
  margin-bottom: 15px;
}

.stock-status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 14px;
  margin-right: 10px;
}

.in-stock {
  background-color: #67c23a;
  color: white;
}

.out-of-stock {
  background-color: #f56c6c;
  color: white;
}

.product-short-desc {
  margin-bottom: 20px;
  line-height: 1.6;
  color: #666;
}

.product-actions {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  align-items: center;
}

.product-share {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.share-icons {
  display: flex;
  gap: 15px;
}

.share-icons i {
  font-size: 20px;
  cursor: pointer;
  color: #666;
  transition: color 0.3s;
}

.share-icons i:hover {
  color: #409EFF;
}

.product-tabs {
  margin-bottom: 40px;
}

.product-description {
  line-height: 1.8;
}

.specs-table {
  width: 100%;
  border-collapse: collapse;
}

.specs-table th, .specs-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.specs-table th {
  width: 150px;
  background-color: #f9f9f9;
}

.related-products .products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.product-card {
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.3s;
}

.product-card:hover {
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  transform: translateY(-5px);
}

.product-card .product-image {
  height: 200px;
  overflow: hidden;
}

.product-card .product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.product-card .product-info {
  padding: 15px;
}

.product-card .product-info h3 {
  font-size: 16px;
  margin-bottom: 8px;
  height: 40px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-card .product-desc {
  color: #666;
  font-size: 14px;
  margin-bottom: 10px;
  height: 40px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.inquiry-form {
  background-color: #f9f9f9;
  padding: 30px;
  border-radius: 4px;
  margin-bottom: 40px;
}

.inquiry-form h2 {
  font-size: 20px;
  margin-bottom: 20px;
  text-align: center;
}

@media (max-width: 768px) {
  .product-detail {
    flex-direction: column;
  }
  
  .product-gallery {
    max-width: 100%;
  }
  
  .product-actions {
    flex-wrap: wrap;
  }
}
</style>