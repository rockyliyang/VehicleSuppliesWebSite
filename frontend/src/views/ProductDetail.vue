<template>
  <div class="product-detail-page">
    <PageBanner :title="product.name || '产品详情'" />

    <!-- 路径导航菜单 -->
    <NavigationMenu :breadcrumb-items="breadcrumbItems" />

    <div class="container mx-auto" v-loading=" loading">
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
              <!-- 数量选择器单独一行 -->
              <div class="quantity-selector">
                <label class="quantity-label">{{ $t('productDetail.quantity') || '数量' }}:</label>
                <el-input-number v-model="quantity" :min="1" :max="product.stock" size="medium"></el-input-number>
              </div>

              <!-- 按钮组单独一行 -->
              <div class="action-buttons">
                <el-button type="primary" @click="addToCart" :disabled="product.stock <= 0">{{ $t('buttons.addToCart')
                  }}</el-button>
                <el-button class="inquiry-button" @click="addToInquiry" :disabled="product.stock <= 0">{{
                  $t('buttons.addToInquiry')
                  }}</el-button>
                <el-button class="contact-button" @click="contactUs">{{ $t('buttons.contactUs') }}</el-button>
              </div>
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

      <!-- 产品描述区域 -->
      <div class="description-section">
        <h2 class="description-title">
          {{ $t('productDetail.tabs.description').split(' ')[0] }}
          <span class="highlight">{{ $t('productDetail.tabs.description').split(' ').slice(1).join(' ') }}</span>
        </h2>
        <div class="section-divider"></div>
        <div class="product-description" v-html="product.full_description || $t('productDetail.noDescription')">
        </div>
      </div>

      <!-- 相关产品区，放在询价表单后面 -->
      <div class="related-products">
        <h2 class="related-title">{{ $t('productDetail.related') }} <span class="highlight">{{
            $t('productDetail.products') }}</span></h2>
        <div class="section-divider"></div>
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
import { addToCart } from '../utils/cartUtils';
import PageBanner from '@/components/common/PageBanner.vue';
import NavigationMenu from '@/components/common/NavigationMenu.vue';

export default {
  name: 'ProductDetail',
  components: {
    PageBanner,
    NavigationMenu
  },
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
    breadcrumbItems() {
      const items = [];
      
      if (this.categoryName) {
        items.push({
          text: this.categoryName,
          to: { path: '/products', query: { category: this.product.category_id } }
        });
      }
      
      items.push({ text: this.product.name });
      
      return items;
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
        this.$messageHandler.showError(error, 'category.error.fetchFailed')
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
        this.$messageHandler.showError(error, 'product.error.fetchFailed')
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
        this.$messageHandler.showError(error, 'product.error.fetchRelatedFailed')
      }
    },
    addToInquiry() {
      // 在这里添加添加到询价的逻辑      
      this.$messageHandler.showSuccess(this.$t('messages.addToInquirySuccess', { quantity: this.quantity, name: this.product.name }), 'product.success.addToInquirySuccess')
        // 触发购物车更新事件
        this.$bus.emit('cart-updated')
    },
    contactUs() {
      this.$router.push('/contact');
    },
    
    async addToCart() {
      // 使用公共的购物车工具函数
      await addToCart(this.product, {
          store: this.$store,
          router: this.$router,
          api: this.$api,
          $t: this.$t,
          messageHandler: this.$messageHandler,
          $bus: this.$bus
        }, this.quantity);
    },
    submitInquiry() {
      this.$refs.inquiryForm.validate(valid => {
        if (valid) {
          // 实际项目中会发送到后端API
          this.$messageHandler.showSuccess(this.$t('messages.inquirySubmitted'), 'product.success.inquirySubmitted')
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

<style lang="scss" scoped>
@import '@/assets/styles/_variables';
@import '@/assets/styles/_mixins';
@import '@/assets/styles/shared.scss';

.more-button {
  @include button-base;
  background-color: $gray-200;
  color: $gray-700;
  padding: $spacing-md $spacing-xl;
  /* 与category-button一致 */
  margin: 0 $spacing-xs;
  white-space: nowrap;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;

  &:hover:not(:disabled) {
    background-color: $gray-300;
  }
}

.product-detail-page {
  min-height: 100vh;
}

/* 恢复PageBanner的背景图片显示 */
:deep(.page-banner) {
  background-image: url('@/assets/images/banner1.jpg');
  background-size: cover;
  background-position: center;
}



.breadcrumb {
  font-size: $font-size-md;
  color: $gray-300;
  font-weight: $font-weight-normal;
  transition: $transition-base;

  a {
    color: $gray-300;
    text-decoration: none;
    transition: $transition-base;

    &:hover {
      color: $white;
    }
  }

  &:last-child {
    color: $white;
    font-weight: $font-weight-normal;
  }

  .separator {
    color: $text-muted;
    margin: 0 $spacing-sm;
  }
}

:deep(.el-breadcrumb__inner a),
:deep(.el-breadcrumb__inner.is-link) {
  color: $gray-300;
  font-weight: $font-weight-normal;
}

:deep(.el-breadcrumb__inner a:hover),
:deep(.el-breadcrumb__inner.is-link:hover) {
  color: $white;
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: $white;
}

.container {
  @include container;

}

.product-detail-main {
  display: flex;
  gap: $spacing-4xl;
  margin-bottom: $spacing-4xl;
}

.side-categories {
  width: 220px;
  background: $gray-100;
  border-radius: $border-radius-sm;
  padding: $spacing-lg 0;
  min-height: 400px;
}

.side-categories h3 {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $red-700;
  margin-bottom: $spacing-lg;
  text-align: center;
}

.side-categories ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.side-categories li {
  padding: $spacing-sm $spacing-xl;
  cursor: pointer;
  color: $gray-800;
  font-size: $font-size-base;
  border-left: 4px solid transparent;
  transition: $transition-base;
}

.side-categories li.active,
.side-categories li:hover {
  background: $white;
  color: $primary-color;
  border-left: 4px solid $primary-color;
}

.product-detail-content {
  flex: 1;
  display: flex;
  gap: $spacing-4xl;
  align-items: flex-start;
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
  height: 480px;
  position: relative;
  background: $gray-100;
  border: 1px solid $gray-200;
  border-radius: $border-radius-md;
  margin-bottom: $spacing-md;
  overflow: hidden;
  cursor: crosshair;
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
  gap: $spacing-sm;
  justify-content: flex-start;
}

.thumbnail {
  width: 70px;
  height: 70px;
  background: $white;
  border: 1px solid $gray-200;
  border-radius: $border-radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: $transition-base;
  overflow: hidden;
}

.thumbnail img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
  /* 保持与主图一致的object-fit */
}

.thumbnail.active,
.thumbnail:hover {
  border-color: $primary-color;
  box-shadow: 0 0 0 2px rgba(229, 62, 62, 0.3);
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
  padding: $spacing-lg;
  background-color: $white;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-sm;
}

.product-title {
  font-size: $font-size-4xl;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin-bottom: $spacing-lg;
  line-height: $line-height-tight;
}

.product-meta {
  color: $text-secondary;
  font-size: $font-size-lg;
  font-weight: $font-weight-normal;
  margin-bottom: $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;

  .product-id,
  .product-category {
    display: block;
  }
}

/* ProductDetail页面特有的产品价格样式覆盖 */
.product-detail-page .product-price {
  font-size: $font-size-3xl;
  font-weight: $font-weight-bold;
  color: $primary-color;
  margin-bottom: $spacing-lg;
}

.product-stock {
  margin-bottom: $spacing-lg;
  font-size: $font-size-lg;
  font-weight: $font-weight-normal;
  color: $text-secondary;
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

/* 库存状态样式已移至shared.scss */

.product-short-desc {
  margin-bottom: $spacing-xl;
  line-height: $line-height-relaxed;
  color: $text-secondary;
  font-size: $font-size-lg;
  font-weight: $font-weight-normal;
  padding: $spacing-lg;
  background-color: $gray-50;
  border-radius: $border-radius-md;
  border-left: 4px solid $primary-color;
}

.product-actions {
  margin-bottom: $spacing-lg;
}

.quantity-selector {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;

  .quantity-label {
    font-size: $font-size-lg;
    font-weight: $font-weight-medium;
    color: $text-primary;
    min-width: 60px;
  }
}

.action-buttons {
  display: flex;
  gap: $spacing-md;
  flex-wrap: wrap;
  align-items: center;
}

/* Add to Inquiry 按钮样式 - 与Home页面more按钮一致 */
:deep(.inquiry-button) {
  @include button-base;
  background-color: $gray-200 !important;
  color: $gray-700 !important;
  border-color: $gray-200 !important;
  padding: $spacing-md $spacing-xl !important;
  font-size: $font-size-lg !important;
  font-weight: $font-weight-semibold !important;

  &:hover:not(:disabled) {
    background-color: $gray-300 !important;
    border-color: $gray-300 !important;
  }
}

/* Contact Us 按钮样式 - 与Home页面more按钮一致 */
:deep(.contact-button) {
  @include button-base;
  background-color: $gray-200 !important;
  color: $gray-700 !important;
  border-color: $gray-200 !important;
  padding: $spacing-md $spacing-xl !important;
  font-size: $font-size-lg !important;
  font-weight: $font-weight-semibold !important;

  &:hover:not(:disabled) {
    background-color: $gray-300 !important;
    border-color: $gray-300 !important;
  }
}

/* 按钮样式已在shared.scss中统一定义，这里不再重复定义 */



:deep(.el-button--primary:hover) {
  background-color: $primary-dark !important;
  border-color: $primary-dark !important;
}

:deep(.el-input-number) {
  width: 120px;
}

:deep(.el-input-number .el-input__inner) {
  border-radius: $border-radius-md;
  border-color: $gray-300;
}

:deep(.el-input-number .el-input__inner:focus) {
  border-color: $primary-color;
}

.product-share {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-top: $spacing-lg;
  padding-top: $spacing-lg;
  border-top: 1px solid $gray-200;
  font-size: $font-size-sm;
  color: $text-secondary;
}

.share-icons {
  display: flex;
  gap: $spacing-md;
}

.share-icons i {
  font-size: $font-size-xl;
  cursor: pointer;
  color: $text-muted;
  transition: $transition-base;
}

.share-icons i:hover {
  color: $primary-color;
}

.product-tabs {
  margin-bottom: $spacing-4xl;
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}

/* 标签页样式已移至shared.scss */

.product-description {
  line-height: $line-height-relaxed;
  color: $text-secondary;
  font-size: $font-size-lg;
  font-weight: $font-weight-normal;
  padding: $spacing-md 0;
}

.specs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: $font-size-lg;
  margin-top: 1rem;
}

.specs-table th,
.specs-table td {
  padding: 0.875rem 1rem;
  text-align: left;
  border: 1px solid $gray-200;
}

.specs-table th {
  width: 200px;
  background-color: $gray-50;
  font-weight: $font-weight-normal;
  color: $text-secondary;
}

.specs-table td {
  color: $text-secondary;
  font-weight: $font-weight-normal;
}

.related-products {
  margin-top: $spacing-4xl;
  padding-top: $spacing-xl;
  border-top: 1px solid $gray-200;
}

.related-products-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: $spacing-lg;
}

/* 相关产品卡片样式已移至shared.scss，这里只保留ProductDetail特有的样式 */
.related-product-card {
  text-align: left;
  padding: $spacing-md;
}

.related-product-card:hover {
  transform: translateY(-4px);
}

.related-product-image {
  width: 100%;
  padding-top: 100%;
  position: relative;
  background-color: $gray-50;
  border-radius: $border-radius-md;
  margin-bottom: $spacing-sm;
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
  font-size: $font-size-lg;
  color: $text-secondary;
  font-weight: $font-weight-normal;
  line-height: $line-height-normal;
  height: 2.8em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: $spacing-xs;
}

/* 可以为相关产品添加价格显示 */
.related-product-price {
  font-size: $font-size-sm;
  color: $primary-color;
  font-weight: $font-weight-bold;
}

.inquiry-form {
  background-color: $gray-50;
  padding: 2rem;
  border-radius: $border-radius-lg;
  margin-bottom: 2.5rem;
  box-shadow: $shadow-sm;
}

.inquiry-form h2 {
  font-size: $font-size-2xl;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin-bottom: 1.5rem;
  text-align: center;
}

/* 统一Element UI表单项样式 */
:deep(.el-form-item__label) {
  color: $text-secondary;
  font-weight: $font-weight-normal;
  font-size: $font-size-lg;
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  border-radius: $border-radius-md;
  border-color: $gray-300;
  font-size: $font-size-lg;
}

:deep(.el-input__inner:focus),
:deep(.el-textarea__inner:focus) {
  border-color: $primary-color;
  box-shadow: 0 0 0 1px $primary-color;
}

:deep(.el-button--primary) {
  @include button-primary;
  @include button-lg;
  font-size: $font-size-lg;
  font-weight: 600;
}

:deep(.el-button--primary:hover) {
  background-color: $primary-dark !important;
  border-color: $primary-dark !important;
}

.product-detail-extra {
  margin: $spacing-2xl 0;
}

.detail-images-block {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
  margin-bottom: $spacing-xl;
}

.detail-image-row {
  width: 100%;
  text-align: center;
}

.detail-image-row img {
  max-width: 100%;
  border-radius: $border-radius-sm;
  box-shadow: $shadow-md;
}

.specification-html-block {
  margin: $spacing-xl 0;
  background: $white;
  border-radius: $border-radius-sm;
  padding: $spacing-xl;
  box-shadow: $shadow-sm;
}

.related-title {
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

.zoom-lens {
  position: absolute;
  border: 2px solid $primary-color;
  background: rgba($primary-color, 0.08);
  pointer-events: none;
  z-index: 2;
}

.zoom-window {
  position: absolute;
  left: calc(100% + #{$spacing-lg});
  top: 0;
  background: $white;
  border: 1px solid $gray-300;
  overflow: hidden;
  box-shadow: $shadow-lg;
  z-index: 10;
  pointer-events: none;
}

.zoom-window img {
  position: absolute;
  /* 由js控制left/top/size */
  display: block;
  /* 确保img是块级元素 */
}

.description-section {
  padding: 0;
}

.description-title {
  font-size: $font-size-4xl;
  font-weight: $font-weight-bold;
  margin-bottom: $spacing-sm;
  text-align: left;

  .highlight {
    color: $primary-color;
  }
}

/* Ensure the tab itself has enough padding if needed */
:deep(.el-tabs__item) {
  height: auto;
  /* Adjust if content makes it too tall */
  line-height: normal;
  /* Reset line-height if custom font size causes issues */
  padding-top: $spacing-sm;
  /* Example padding */
  padding-bottom: $spacing-sm;
  /* Example padding */
}

/* 确认对话框样式已移至全局样式文件 elegant-messages.scss */

@media (max-width: 768px) {
  .product-detail-main {
    flex-direction: column;
  }

  .product-gallery-block {
    max-width: 100%;
  }

  .product-actions {
    .quantity-selector {
      flex-direction: column;
      align-items: flex-start;
      gap: $spacing-sm;

      .quantity-label {
        min-width: auto;
      }
    }

    .action-buttons {
      flex-direction: column;
      align-items: stretch;

      .el-button {
        width: 100%;
        margin-bottom: $spacing-sm;
      }
    }
  }

  /* 移动端对话框样式已移至全局样式文件 elegant-messages.scss */
}
</style>