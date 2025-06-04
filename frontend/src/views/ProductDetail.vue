<template>
  <div class="product-detail-page">
    <div class="page-banner">
      <div class="banner-content">
        <h1>{{ $t('productDetail.title') }}</h1>
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">{{ $t('breadcrumb.home') }}</el-breadcrumb-item>
            <el-breadcrumb-item :to="{ path: '/products' }">{{ $t('breadcrumb.products') }}</el-breadcrumb-item>
            <el-breadcrumb-item>{{ product.name }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </div>
    </div>

    <div class="container mx-auto" v-loading=" loading">
      <!-- 路径导航菜单 -->
      <div class="navigation-menu">
        <div class="nav-content">
          <el-breadcrumb separator=">" class="nav-breadcrumb" id="product-breadcrumb-nav">
            <el-breadcrumb-item :to="{ path: '/' }">{{ $t('breadcrumb.home') }}</el-breadcrumb-item>
            <el-breadcrumb-item id="product-breadcrumb-level2" v-if="categoryName"
              :to="{ path: '/products', query: { category: product.category_id } }">{{ categoryName
              }}</el-breadcrumb-item>
            <el-breadcrumb-item>{{ product.name }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </div>
      <div class="product-detail-main">
        <!-- 主体内容 -->
        <div class="product-detail-content">
          <div class="product-gallery-block">
            <div class="main-image" ref="mainImage" @mousemove="handleMouseMove" @mouseenter="showZoom = true"
              @mouseleave="showZoom = false">
              <img :src="activeImage || product.thumbnail_url" :alt="product.name" @error="handleImageError"
                ref="mainImgEl" @load="updateMainImgSize">
              <div v-if="showZoom" class="zoom-lens" :style="zoomLensStyle"></div>
            </div>
            <div v-if="showZoom && mainImgWidth > 0 && mainImgHeight > 0" class="zoom-window" :style="zoomWindowStyle">
              <img :src="activeImage || product.thumbnail_url" :style="zoomImgStyle" />
            </div>
            <div class="thumbnail-list">
              <div v-for="(img, idx) in galleryImages" :key="idx"
                :class="['thumbnail', activeImage === img ? 'active' : '']" @click="activeImage = img">
                <img :src="img" :alt="product.name" @error="handleImageError">
              </div>
            </div>
          </div>
          <div class="product-info-block">
            <h1 class="product-title">{{ product.name }}</h1>
            <div class="product-meta">
              <span class="product-id">{{ $t('productDetail.productCode') }}: {{ product.product_code }}</span>
              <span class="product-category">{{ $t('productDetail.category') }}: {{ categoryName }}</span>
            </div>
            <div class="product-price">¥{{ formatPrice(product.price) }}</div>
            <div class="product-stock">
              <span :class="['stock-status', product.stock > 0 ? 'in-stock' : 'out-of-stock']">
                {{ product.stock > 0 ? $t('productDetail.inStock') : $t('productDetail.outOfStock') }}
              </span>
              <span class="stock-number">{{ $t('productDetail.stock') }}: {{ product.stock }}</span>
            </div>
            <div class="product-short-desc">
              <p>{{ product.short_description }}</p>
            </div>
            <div class="product-actions">
              <el-input-number v-model="quantity" :min="1" :max="product.stock" size="small"></el-input-number>
              <el-button type="primary" @click="addToCart" :disabled="product.stock <= 0">{{ $t('buttons.addToCart')
                }}</el-button>
              <el-button @click="addToInquiry" :disabled="product.stock <= 0">{{ $t('buttons.addToInquiry')
                }}</el-button>
              <el-button @click="contactUs">{{ $t('buttons.contactUs') }}</el-button>
            </div>
            <div class="product-share">
              <span>{{ $t('productDetail.shareTo') }}:</span>
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
          <el-tab-pane name="description">
            <template #label>
              <span class="custom-tab-label">
                {{ $t('productDetail.tabs.description').split(' ')[0] }}
                <span class="text-red-600">{{ $t('productDetail.tabs.description').split(' ').slice(1).join(' ')
                  }}</span>
              </span>
            </template>
            <div class="product-description" v-html="product.full_description || $t('productDetail.noDescription')">
            </div>
          </el-tab-pane>

        </el-tabs>
      </div>

      <!-- 相关产品区，放在询价表单后面 -->
      <div class="related-products">
        <h2 class="related-title">{{ $t('productDetail.related') }} <span class="text-red-600">{{
            $t('productDetail.products') }}</span></h2>
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
import { formatPrice } from '../utils/format';
import { addToCart as addProductToCart } from '../utils/cartUtils';

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
          { required: true, message: this.$t('validation.nameRequired'), trigger: 'blur' }
        ],
        email: [
          { required: true, message: this.$t('validation.emailRequired'), trigger: 'blur' },
          { type: 'email', message: this.$t('validation.emailFormat'), trigger: 'blur' }
        ],
        phone: [
          { required: true, message: this.$t('validation.phoneRequired'), trigger: 'blur' }
        ],
        message: [
          { required: true, message: this.$t('validation.messageRequired'), trigger: 'blur' }
        ]
      },
      showZoom: false,
      zoom: 2,
      zoomPos: { x: 0, y: 0 },
      lensSize: 100,
      mainImgWidth: 0,
      mainImgHeight: 0,
      mainImageContainerWidth: 0,
      mainImageContainerHeight: 0,
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
      const mainImgW = Number(this.mainImgWidth);
      const mainImgH = Number(this.mainImgHeight);
      const lensS = Number(this.lensSize);
      const zoomF = Number(this.zoom);
      const zoomPosX = Number(this.zoomPos.x);
      const zoomPosY = Number(this.zoomPos.y);
      const containerW = Number(this.mainImageContainerWidth);
      const containerH = Number(this.mainImageContainerHeight);

      let left = 0;
      let top = 0;
      const width = mainImgW > 0 ? mainImgW * zoomF : 0;
      const height = mainImgH > 0 ? mainImgH * zoomF : 0;

      if (Number.isFinite(zoomPosX) && Number.isFinite(zoomPosY) &&
          mainImgW > 0 && mainImgH > 0 &&
          containerW > 0 && containerH > 0 &&
          lensS > 0 && zoomF > 0) {
        
        const scaleX = mainImgW / containerW;
        const scaleY = mainImgH / containerH;

        const originalImgLensCenterX = zoomPosX * scaleX;
        const originalImgLensCenterY = zoomPosY * scaleY;

        left = (lensS / 2 - originalImgLensCenterX) * zoomF;
        top = (lensS / 2 - originalImgLensCenterY) * zoomF;
      }

      return {
        position: 'absolute',
        left: left + 'px',
        top: top + 'px',
        width: width + 'px',
        height: height + 'px',
        display: 'block',
      };
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
    console.log('ProductDetail created, this.$api =', this.$api)
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
    formatPrice,
    async fetchCategories() {
      try {
        const response = await this.$api.get('categories')
        this.categories = response.data || []
      } catch (error) {
        console.error('获取分类失败:', error)
        this.$errorHandler.showError(error, 'category.error.fetchFailed')
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
        this.$errorHandler.showError(error, 'product.error.fetchFailed')
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
        this.$errorHandler.showError(error, 'product.error.fetchRelatedFailed')
      }
    },
    addToInquiry() {
      const productWithQuantity = {
        ...this.product,
        quantity: this.quantity
      }
      this.$store.commit('addToCart', productWithQuantity)
      this.$errorHandler.showSuccess(this.$t('messages.addToInquirySuccess', { quantity: this.quantity, name: this.product.name }), 'product.success.addToInquirySuccess')
    },
    contactUs() {
      this.$router.push('/contact');
    },
    
    async addToCart() {
      // 使用公共的购物车工具函数
      await addProductToCart(this.product, {
        router: this.$router,
        message: this.$message,
        api: this.$api
      }, this.quantity);
    },
    submitInquiry() {
      this.$refs.inquiryForm.validate(valid => {
        if (valid) {
          // 实际项目中会发送到后端API
          this.$errorHandler.showSuccess(this.$t('messages.inquirySubmitted'), 'product.success.inquirySubmitted')
          this.$refs.inquiryForm.resetFields()
        }
      })
    },
    updateMainImgSize() {
      this.$nextTick(() => {
        const imgEl = this.$refs.mainImgEl;
        const containerEl = this.$refs.mainImage;

        if (imgEl && containerEl) {
          this.mainImgWidth = imgEl.naturalWidth || imgEl.width;
          this.mainImgHeight = imgEl.naturalHeight || imgEl.height;

          const rect = containerEl.getBoundingClientRect();
          this.mainImageContainerWidth = rect.width;
          this.mainImageContainerHeight = rect.height;
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
@import '../assets/styles/shared.css';

.product-detail-page {
  min-height: 100vh;
}

.page-banner {
  height: 500px;
  /* 与其他页面Banner高度保持一致 */
  background-color: #f5f5f5;
  background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('../assets/images/banner1.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
  margin-bottom: 0;
  /* 移除底部间距，由导航菜单统一控制 */
}

.banner-content h1 {
  font-size: 2.5rem;
  /* Tailwind text-4xl 约等于 2.25rem, text-3xl 约等于 1.875rem。调整为与Home.vue section title类似大小 */
  font-weight: bold;
  margin-bottom: 1rem;
  color: white;
  /* 保持白色以在背景图上清晰显示 */
}

.breadcrumb {
  /* 将面包屑的样式移到 .banner-content 内部，确保其在 banner 内 */
}

:deep(.el-breadcrumb__inner a),
:deep(.el-breadcrumb__inner.is-link) {
  color: #d1d5db;
  /* Tailwind gray-300, 适应深色背景 */
  font-weight: normal;
}

:deep(.el-breadcrumb__inner a:hover),
:deep(.el-breadcrumb__inner.is-link:hover) {
  color: #ffffff;
  /* Hover时为纯白 */
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #ffffff;
  /* 当前页面面包屑为纯白 */
}

/* 路径导航菜单样式 */
.navigation-menu {
  background: #ffffff;
  padding: 12px 0;
  margin-top: 15px;
  margin-bottom: 15px;
}

.nav-content {
  padding: 0;
}

.nav-breadcrumb {
  font-size: 14px;
}

:deep(.nav-breadcrumb .el-breadcrumb__inner) {
  color: #666666;
  font-weight: normal;
}

:deep(.nav-breadcrumb .el-breadcrumb__inner a) {
  color: #666666;
  text-decoration: none;
  transition: color 0.3s;
}

:deep(#product-breadcrumb-nav .el-breadcrumb__item .el-breadcrumb__inner.is-link:hover) {
  color: #dc2626 !important;
  text-decoration: none !important;
}

:deep(.nav-breadcrumb .el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #dc2626;
  font-weight: 500;
}

:deep(.nav-breadcrumb .el-breadcrumb__separator) {
  color: #999999;
  margin: 0 8px;
}

.container {
  max-width: 100%;
  margin: 0 auto;

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
  align-items: flex-start;
  /* 确保两列顶部对齐 */
}

.product-gallery-block {
  width: 480px;
  /* 增加宽度从350px到480px */
  position: relative;
  flex-shrink: 0;
  /* 防止被压缩 */
}

.main-image {
  width: 100%;
  /* 确保宽度与父容器一致 */
  height: 480px;
  position: relative;
  background: #f8f8f8;
  border-radius: 8px;
  margin-bottom: 1rem;
  overflow: hidden;
  cursor: crosshair;
  /* display: flex; */
  /* 移除flex布局 */
  /* justify-content: center; */
  /* align-items: center; */
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* 修改: 改为cover以填充容器，可能会裁剪图片 */
  display: block;
}

.thumbnail-list {
  display: flex;
  gap: 0.75rem;
  /* 12px */
  justify-content: flex-start;
  /* 修改: 缩略图左对齐 */
}

.thumbnail {
  width: 70px;
  /* 略微增大缩略图尺寸 */
  height: 70px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  /* Tailwind gray-200 */
  border-radius: 6px;
  /* 更圆润的边角 */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  /* 确保图片不超出边框 */
}

.thumbnail img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
  /* 保持与主图一致的object-fit */
}

.thumbnail.active,
.thumbnail:hover {
  border-color: #dc2626;
  /* 主题红色 Red-600 */
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.3);
  /* 添加轻微的红色外发光效果 */
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
  font-size: 2rem;
  /* Tailwind text-3xl 约等于 1.875rem, text-4xl 约等于 2.25rem. */
  font-weight: bold;
  color: #1f2937;
  /* Tailwind gray-800 */
  margin-bottom: 0.75rem;
  /* 12px */
}

.product-meta {
  color: #6b7280;
  /* Tailwind gray-500 */
  font-size: 0.9rem;
  /* 14.4px */
  margin-bottom: 0.75rem;
}

.product-meta .product-category {
  margin-left: 1.25rem;
  /* 20px */
}

/* ProductDetail页面特有的产品价格样式覆盖 */
.product-detail-page .product-price {
  font-size: 1.75rem;
  /* Tailwind text-2xl 约等于 1.5rem, text-3xl 约等于 1.875rem */
  margin-bottom: 1rem;
}

.product-stock {
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

/* 库存状态样式已移至shared.css */

.product-short-desc {
  margin-bottom: 1.5rem;
  /* 24px */
  line-height: 1.65;
  color: #4b5563;
  /* Tailwind gray-600 */
  font-size: 0.95rem;
}

.product-actions {
  display: flex;
  gap: 1rem;
  /* 16px */
  margin-bottom: 1.5rem;
  /* 24px */
  align-items: center;
}

/* 统一按钮样式，使其与Home.vue的按钮风格一致 */
:deep(.el-button) {
  border-radius: 0.375rem !important;
  /* Tailwind rounded-md */
  padding: 0.75rem 1.5rem !important;
  /* 调整padding */
  font-size: 0.95rem !important;
}

:deep(.el-button--primary) {
  background-color: #dc2626 !important;
  /* 主题红色 Red-600 */
  border-color: #dc2626 !important;
}

:deep(.el-button--primary:hover) {
  background-color: #b91c1c !important;
  /* 主题红色 Red-700 */
  border-color: #b91c1c !important;
}

:deep(.el-input-number) {
  width: 120px;
}

:deep(.el-input-number .el-input__inner) {
  border-radius: 0.375rem;
  border-color: #d1d5db;
}

:deep(.el-input-number .el-input__inner:focus) {
  border-color: #dc2626;
}

.product-share {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  /* 12px */
  margin-top: 1.5rem;
  /* 24px */
  padding-top: 1.5rem;
  /* 24px */
  border-top: 1px solid #e5e7eb;
  /* Tailwind gray-200 */
  font-size: 0.9rem;
  color: #4b5563;
  /* Tailwind gray-600 */
}

.share-icons {
  display: flex;
  gap: 1rem;
  /* 16px */
}

.share-icons i {
  font-size: 1.25rem;
  /* 20px */
  cursor: pointer;
  color: #6b7280;
  /* Tailwind gray-500 */
  transition: color 0.3s ease;
}

.share-icons i:hover {
  color: #dc2626;
  /* 主题红色 Red-600 */
}

.product-tabs {
  margin-bottom: 2.5rem;
  /* 40px */
}

:deep(.el-tabs__nav-wrap::after) {
  background-color: #e5e7eb;
  /* Tailwind gray-200, 底部线条颜色 */
}

/* 标签页样式已移至shared.css */

.product-description {
  line-height: 1.75;
  color: #374151;
  /* Tailwind gray-700 */
  font-size: 0.95rem;
  padding: 1rem 0;
  /* 给内容区域一些上下padding */
}

.specs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  margin-top: 1rem;
}

.specs-table th,
.specs-table td {
  padding: 0.875rem 1rem;
  /* 14px 16px */
  text-align: left;
  border: 1px solid #e5e7eb;
  /* Tailwind gray-200, 使用完整边框 */
}

.specs-table th {
  width: 200px;
  /* 适当加宽表头 */
  background-color: #f9fafb;
  /* Tailwind gray-50 */
  font-weight: 600;
  color: #374151;
  /* Tailwind gray-700 */
}

.specs-table td {
  color: #4b5563;
  /* Tailwind gray-600 */
}

.related-products {
  margin-top: 2.5rem;
  /* 40px */
  padding-top: 2rem;
  /* 32px, 与上方内容分隔 */
  border-top: 1px solid #e5e7eb;
  /* Tailwind gray-200, 添加一个分隔线 */
}

.related-products-row {
  display: grid;
  /* 改为grid布局，方便控制列数和间距 */
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  /* 响应式列，最小180px */
  gap: 1.5rem;
  /* 24px */
}

/* 相关产品卡片样式已移至shared.css，这里只保留ProductDetail特有的样式 */
.related-product-card {
  text-align: left;
  /* 文字左对齐 */
  padding: 1rem;
  /* 16px */
}

.related-product-card:hover {
  transform: translateY(-4px);
}

.related-product-image {
  width: 100%;
  padding-top: 100%;
  /* 实现1:1的宽高比，即正方形 */
  position: relative;
  background-color: #f9fafb;
  /* Tailwind gray-50 */
  border-radius: 0.375rem;
  /* 6px, Tailwind rounded-md */
  margin-bottom: 0.75rem;
  /* 12px */
  overflow: hidden;
}

.related-product-image img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* 或 contain */
}

.related-product-title {
  font-size: 0.95rem;
  /* 约15px */
  color: #1f2937;
  /* Tailwind gray-800 */
  font-weight: 600;
  /* semibold */
  line-height: 1.4;
  height: 2.8em;
  /* 约两行的高度 */
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 0.25rem;
  /* 4px */
}

/* 可以为相关产品添加价格显示 */
.related-product-price {
  font-size: 0.9rem;
  color: #dc2626;
  /* 主题红色 Red-600 */
  font-weight: bold;
}

.inquiry-form {
  background-color: #f9fafb;
  /* Tailwind gray-50 */
  padding: 2rem;
  /* 32px */
  border-radius: 0.5rem;
  /* 8px, Tailwind rounded-lg */
  margin-bottom: 2.5rem;
  /* 40px */
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  /* Tailwind shadow-sm */
}

.inquiry-form h2 {
  font-size: 1.5rem;
  /* Tailwind text-2xl */
  font-weight: bold;
  color: #1f2937;
  /* Tailwind gray-800 */
  margin-bottom: 1.5rem;
  /* 24px */
  text-align: center;
}

/* 统一Element UI表单项样式 */
:deep(.el-form-item__label) {
  color: #374151;
  /* Tailwind gray-700 */
  font-weight: 500;
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  border-radius: 0.375rem;
  /* Tailwind rounded-md */
  border-color: #d1d5db;
  /* Tailwind gray-300 */
}

:deep(.el-input__inner:focus),
:deep(.el-textarea__inner:focus) {
  border-color: #dc2626;
  /* 主题红色 Red-600 */
  box-shadow: 0 0 0 1px #dc2626;
}

:deep(.el-button--primary) {
  background-color: #dc2626 !important;
  /* 主题红色 Red-600 */
  border-color: #dc2626 !important;
  border-radius: 0.375rem !important;
  /* Tailwind rounded-md */
  padding: 0.625rem 1.25rem !important;
  /* 10px 20px */
  font-size: 0.95rem !important;
}

:deep(.el-button--primary:hover) {
  background-color: #b91c1c !important;
  /* 主题红色 Red-700 */
  border-color: #b91c1c !important;
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
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.specification-html-block {
  margin: 30px 0;
  background: #fff;
  border-radius: 6px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.related-title {
  font-size: 1.875rem;
  /* Equivalent to Tailwind's text-3xl, like 'About Us' */
  font-weight: bold;
  /* color: #1f2937; */
  /* Color will be handled by spans in HTML */
  margin-bottom: 1.5rem;
  /* 24px */
  text-align: left;
  /* padding-bottom: 0.75rem; */
  /* Border removed */
  /* border-bottom: 2px solid #dc2626; */
  /* Border removed */
  /* display: inline-block; */
  /* Not needed if no border */
}

.zoom-lens {
  position: absolute;
  border: 2px solid #e60012;
  background: rgba(230, 0, 18, 0.08);
  pointer-events: none;
  z-index: 2;
}

.zoom-window {
  position: absolute;
  left: calc(100% + 20px);
  /* 修改: 使用calc确保间距 */
  top: 0;
  /* margin-left: 20px; */
  /* 移除，改用left: calc() */
  background: #fff;
  border: 1px solid #ccc;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
  pointer-events: none;
  /* 新增: 防止放大窗口干扰鼠标事件 */
}

.zoom-window img {
  position: absolute;
  /* 由js控制left/top/size */
  display: block;
  /* 确保img是块级元素 */
}

.custom-tab-label {
  font-size: 1.875rem;
  /* 30px, text-3xl */
  font-weight: bold;
}

/* Ensure the tab itself has enough padding if needed */
:deep(.el-tabs__item) {
  height: auto;
  /* Adjust if content makes it too tall */
  line-height: normal;
  /* Reset line-height if custom font size causes issues */
  padding-top: 10px;
  /* Example padding */
  padding-bottom: 10px;
  /* Example padding */
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