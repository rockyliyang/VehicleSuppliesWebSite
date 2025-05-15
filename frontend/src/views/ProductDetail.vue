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
      <div class="product-detail-main">
        <!-- 左侧分类导航 -->
        <div class="side-categories">
          <h3>Products</h3>
          <ul>
            <li v-for="cat in categories" :key="cat.id" :class="{ active: cat.id === product.category_id }">
              <router-link :to="`/products?category=${cat.id}`">{{ cat.name }}</router-link>
            </li>
          </ul>
        </div>
        <!-- 主体内容 -->
        <div class="product-detail-content">
          <div class="product-gallery-block">
            <div class="main-image" 
                 ref="mainImage"
                 @mousemove="handleMouseMove"
                 @mouseenter="showZoom = true"
                 @mouseleave="showZoom = false">
              <img :src="activeImage || product.thumbnail_url" :alt="product.name" @error="handleImageError" ref="mainImgEl" @load="updateMainImgSize">
              <div v-if="showZoom" class="zoom-lens" :style="zoomLensStyle"></div>
            </div>
            <div v-if="showZoom && mainImgWidth > 0 && mainImgHeight > 0" class="zoom-window" :style="zoomWindowStyle">
              <img :src="activeImage || product.thumbnail_url" :style="zoomImgStyle" />
            </div>
            <div class="thumbnail-list">
              <div
                v-for="(img, idx) in galleryImages"
                :key="idx"
                :class="['thumbnail', activeImage === img ? 'active' : '']"
                @click="activeImage = img"
              >
                <img :src="img" :alt="product.name" @error="handleImageError">
              </div>
            </div>
          </div>
          <div class="product-info-block">
            <h1 class="product-title">{{ product.name }}</h1>
            <div class="product-meta">
              <span class="product-id">产品编号: {{ product.product_code }}</span>
              <span class="product-category">分类: {{ categoryName }}</span>
            </div>
            <div class="product-price">¥{{ formatPrice(product.price) }}</div>
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
      </div>

      <div class="product-tabs">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="产品详情" name="description">
            <div class="product-description" v-html="product.full_description || '暂无详细描述'">
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

      <!-- 相关产品区，放在询价表单后面 -->
      <div class="related-products">
        <h2 class="related-title">Related Products</h2>
        <div class="related-products-row">
          <div v-for="item in relatedProducts" :key="item.id" class="related-product-card">
            <router-link :to="`/product/${item.id}`">
              <div class="related-product-image">
                <img :src="item.thumbnail_url" :alt="item.name" @error="handleImageError">
              </div>
              <div class="related-product-title">{{ item.name }}</div>
            </router-link>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
// 使用全局注册的$api替代axios
import { handleImageError } from '../utils/imageUtils';

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
      activeImage: '',
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
      },
      showZoom: false,
      zoom: 2,
      zoomPos: { x: 0, y: 0 },
      lensSize: 100,
      mainImgWidth: 0,
      mainImgHeight: 0,
    }
  },
  computed: {
    categoryName() {
      if (!this.product.category_id || !this.categories.length) return ''
      const category = this.categories.find(cat => cat.id === this.product.category_id)
      return category ? category.name : ''
    },
    galleryImages() {
      // 主图和所有详情图（image_type=0 和 1）
      const arr = []
      if (this.product.thumbnail_url) arr.push(this.product.thumbnail_url)
      if (this.product.detail_images && Array.isArray(this.product.detail_images)) {
        arr.push(...this.product.detail_images.filter(url => url && url !== this.product.thumbnail_url))
      }
      return arr
    },
    zoomLensStyle() {
      return {
        width: this.lensSize + 'px',
        height: this.lensSize + 'px',
        left: (this.zoomPos.x - this.lensSize / 2) + 'px',
        top: (this.zoomPos.y - this.lensSize / 2) + 'px',
      }
    },
    zoomWindowStyle() {
      return {
        width: this.lensSize * this.zoom + 'px',
        height: this.lensSize * this.zoom + 'px',
      }
    },
    zoomImgStyle() {
      // 容错处理，防止NaN
      const width = Number(this.mainImgWidth) > 0 ? this.mainImgWidth * this.zoom : 0;
      const height = Number(this.mainImgHeight) > 0 ? this.mainImgHeight * this.zoom : 0;
      const left = Number.isFinite(this.zoomPos.x) ? -(this.zoomPos.x * this.zoom - this.lensSize / 2 * this.zoom) : 0;
      const top = Number.isFinite(this.zoomPos.y) ? -(this.zoomPos.y * this.zoom - this.lensSize / 2 * this.zoom) : 0;
      return {
        position: 'absolute',
        left: left + 'px',
        top: top + 'px',
        width: width + 'px',
        height: height + 'px',
        display: 'block',
      }
    }
  },
  watch: {
    product(val) {
      // 切换产品时重置主图
      this.activeImage = val.thumbnail_url || ''
    },
    // 监听路由参数变化，切换产品时重新获取数据
    '$route.params.id'(newId) {
      this.productId = parseInt(newId)
      this.fetchProduct()
    }
  },
  created() {
    this.productId = parseInt(this.$route.params.id)
    this.fetchCategories()
    this.fetchProduct()
  },
  mounted() {
    this.updateMainImgSize();
    window.addEventListener('resize', this.updateMainImgSize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateMainImgSize);
  },
  methods: {
    handleImageError,
    formatPrice(price) {
      const n = Number(price)
      return isNaN(n) ? '--' : n.toFixed(2)
    },
    async fetchCategories() {
      try {
        const response = await this.$api.get('categories')
        this.categories = response.data || []
      } catch (error) {
        console.error('获取分类失败:', error)
        this.$message.error(error.response?.data?.message || '获取分类失败')
      }
    },
    async fetchProduct() {
      try {
        this.loading = true
        const response = await this.$api.get(`products/${this.productId}`)
        this.product = response.data || {}
        
        // 获取相关产品（同类别的其他产品）
        this.fetchRelatedProducts()
      } catch (error) {
        console.error('获取产品详情失败:', error)
        this.$message.error(error.response?.data?.message || '获取产品详情失败')
      } finally {
        this.loading = false
      }
    },
    async fetchRelatedProducts() {
      if (!this.product.category_id) return
      try {
        const response = await this.$api.get('products', { params: { category_id: this.product.category_id, status: 'on_shelf' } })
        const items = (response.data && response.data.items) ? response.data.items : []
        this.relatedProducts = items.filter(p => p.id !== this.product.id).slice(0, 4)
      } catch (error) {
        console.error('获取相关产品失败:', error)
        this.$message.error(error.response?.data?.message || '获取相关产品失败')
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
    },
    updateMainImgSize() {
      this.$nextTick(() => {
        const img = this.$refs.mainImgEl;
        if (img) {
          this.mainImgWidth = img.naturalWidth || img.width;
          this.mainImgHeight = img.naturalHeight || img.height;
        }
      });
    },
    handleMouseMove(e) {
      const rect = this.$refs.mainImage.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;
      // 限制 lens 不超出图片
      x = Math.max(this.lensSize / 2, Math.min(x, rect.width - this.lensSize / 2));
      y = Math.max(this.lensSize / 2, Math.min(y, rect.height - this.lensSize / 2));
      this.zoomPos = { x, y };
    },
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

.product-detail-main {
  display: flex;
  gap: 40px;
  margin-bottom: 40px;
}

.side-categories {
  width: 220px;
  background: #f8f8f8;
  border-radius: 4px;
  padding: 20px 0 20px 0;
  min-height: 400px;
}

.side-categories h3 {
  font-size: 18px;
  font-weight: bold;
  color: #b00;
  margin-bottom: 20px;
  text-align: center;
}

.side-categories ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.side-categories li {
  padding: 12px 30px;
  cursor: pointer;
  color: #222;
  font-size: 16px;
  border-left: 4px solid transparent;
  transition: all 0.2s;
}

.side-categories li.active,
.side-categories li:hover {
  background: #fff;
  color: #e60012;
  border-left: 4px solid #e60012;
}

.product-detail-content {
  flex: 1;
  display: flex;
  gap: 40px;
}

.product-gallery-block {
  width: 350px;
  position: relative;
}

.main-image {
  width: 100%;
  height: 350px;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  margin-bottom: 16px;
  overflow: hidden;
  position: relative;
}

.main-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.thumbnail-list {
  display: flex;
  gap: 10px;
}

.thumbnail {
  width: 60px;
  height: 60px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border 0.2s;
}

.thumbnail.active,
.thumbnail:hover {
  border: 2px solid #e60012;
}

.thumbnail img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.product-info-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.product-title {
  font-size: 28px;
  font-weight: bold;
  color: #222;
  margin-bottom: 10px;
}

.product-meta {
  color: #888;
  font-size: 15px;
  margin-bottom: 10px;
}

.product-meta .product-category {
  margin-left: 20px;
}

.product-price {
  font-size: 22px;
  color: #e60012;
  font-weight: bold;
  margin-bottom: 10px;
}

.product-stock {
  margin-bottom: 10px;
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

.specs-table th,
.specs-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.specs-table th {
  width: 150px;
  background-color: #f9f9f9;
}

.related-products {
  margin-top: 20px;
}

.related-products-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: flex-start;
}

.related-product-card {
  width: 160px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  text-align: center;
  padding: 10px 10px 18px 10px;
  transition: box-shadow 0.2s;
}

.related-product-card:hover {
  box-shadow: 0 5px 15px rgba(230, 0, 18, 0.08);
}

.related-product-image {
  width: 100%;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.related-product-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.related-product-title {
  font-size: 15px;
  color: #222;
  font-weight: bold;
  margin-top: 6px;
  height: 38px;
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

.product-detail-extra {
  margin: 40px 0;
}
.detail-images-block {
  display: flex;
  flex-direction: column;
  gap: 30px;
  margin-bottom: 30px;
}
.detail-image-row {
  width: 100%;
  text-align: center;
}
.detail-image-row img {
  max-width: 100%;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}
.specification-html-block {
  margin: 30px 0;
  background: #fff;
  border-radius: 6px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.related-title {
  font-size: 22px;
  font-weight: bold;
  color: #e60012;
  margin: 30px 0 18px 0;
  text-align: left;
}

.zoom-lens {
  position: absolute;
  border: 2px solid #e60012;
  background: rgba(230,0,18,0.08);
  pointer-events: none;
  z-index: 2;
}
.zoom-window {
  position: absolute;
  left: 100%;
  top: 0;
  margin-left: 20px;
  background: #fff;
  border: 1px solid #ccc;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 10;
}
.zoom-window img {
  position: absolute;
  /* 由js控制left/top/size */
}

@media (max-width: 768px) {
  .product-detail-main {
    flex-direction: column;
  }

  .product-gallery-block {
    max-width: 100%;
  }

  .product-actions {
    flex-wrap: wrap;
  }
}
</style>