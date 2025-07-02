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
              <!-- 显示视频或图片 -->
              <video v-if="isActiveMediaVideo" :src="activeImage" :alt="product.name" controls 
                ref="mainVideoEl" class="main-video" @loadedmetadata="updateMainImgSize">
                您的浏览器不支持视频播放。
              </video>
              <img v-else :src="activeImage || product.thumbnail_url" :alt="product.name" @error="handleImageError"
                ref="mainImgEl" @load="updateMainImgSize">
              <div v-if="showZoom && !isActiveMediaVideo" class="zoom-lens" :style="zoomLensStyle"></div>
            </div>
            <div v-if="showZoom && mainImgWidth > 0 && mainImgHeight > 0 && !isActiveMediaVideo" class="zoom-window" :style="zoomWindowStyle">
              <img :src="activeImage || product.thumbnail_url" :style="zoomImgStyle" />
            </div>
            <div class="thumbnail-container">
              <div class="thumbnail-scroll-wrapper" ref="thumbnailWrapper">
                <div class="thumbnail-list" ref="thumbnailList">
                  <div v-for="(media, idx) in galleryImages" :key="idx"
                    :class="['thumbnail', activeImage === media.url ? 'active' : '']" @click="setActiveMedia(media)">
                    <!-- 视频缩略图显示播放图标 -->
                    <div v-if="media.type === 'video'" class="video-thumbnail">
                      <video :src="media.url" :alt="product.name" @error="handleImageError" muted>
                        您的浏览器不支持视频播放。
                      </video>
                      <div class="play-icon">
                        <i class="el-icon-video-play"></i>
                      </div>
                    </div>
                    <img v-else :src="media.url" :alt="product.name" @error="handleImageError">
                  </div>
                </div>
              </div>
              <div v-if="showScrollArrows" class="scroll-arrows">
                <button 
                  class="scroll-arrow scroll-arrow-left" 
                  @mouseenter="startScrolling('left')"
                  @mouseleave="stopScrolling"
                  :disabled="!canScrollLeft">
                  ‹
                </button>
                <button 
                  class="scroll-arrow scroll-arrow-right" 
                  @mouseenter="startScrolling('right')"
                  @mouseleave="stopScrolling"
                  :disabled="!canScrollRight">
                  ›
                </button>
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
                <el-input-number v-model="quantity" :min="1" :max="product.stock" size="default"></el-input-number>
              </div>

              <!-- 按钮组单独一行 -->
              <div class="action-buttons">
                <el-button type="primary" @click="addToCart" :disabled="product.stock <= 0" :loading="addingToCart"
                  class="add-to-cart-btn">
                  <span v-if="!addingToCart">{{ $t('buttons.addToCart') }}</span>
                  <span v-else>{{ $t('buttons.adding') || '添加中...' }}</span>
                </el-button>
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
      addingToCart: false,
      // 滚动相关状态
      showScrollArrows: false,
      canScrollLeft: false,
      canScrollRight: false,
      scrollInterval: null,
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
      // 轮播图只包含详情图（image_type=1），支持图片和视频
      const arr = []
      
      // 添加详情图片，detail_images是字符串数组
      if (this.product.detail_images && Array.isArray(this.product.detail_images)) {
        arr.push(...this.product.detail_images
          .filter(imageUrl => imageUrl && imageUrl.trim())
          .map(imageUrl => ({
            url: imageUrl,
            type: this.getMediaType(imageUrl)
          }))
        )
      }
      return arr
    },
    isActiveMediaVideo() {
      return this.getMediaType(this.activeImage) === 'video'
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
    },
    // 监听图片列表变化，重新检查滚动需求
    galleryImages() {
      this.$nextTick(() => {
        this.checkScrollNeed();
      });
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
    this.$nextTick(() => {
      this.checkScrollNeed();
      window.addEventListener('resize', this.checkScrollNeed);
    });
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateMainImgSize);
    window.removeEventListener('resize', this.checkScrollNeed);
    
    // 移除滚动事件监听器
    const wrapper = this.$refs.thumbnailWrapper;
    if (wrapper) {
      wrapper.removeEventListener('scroll', this.updateScrollButtons);
    }
    
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
    }
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
      if (this.addingToCart) return;
      
      this.addingToCart = true;
      
      try {
        // 使用公共的购物车工具函数
        await addToCart(this.product, {
            store: this.$store,
            router: this.$router,
            api: this.$api,
            messageHandler: this.$messageHandler,
            $bus: this.$bus
          }, this.quantity);
          
        // 添加成功后的视觉反馈
        this.$nextTick(() => {
          const button = this.$el.querySelector('.add-to-cart-btn');
          if (button) {
            button.classList.add('success-animation');
            setTimeout(() => {
              button.classList.remove('success-animation');
            }, 1000);
          }
        });
      } catch (error) {
        console.error('添加到购物车失败:', error);
      } finally {
        this.addingToCart = false;
      }
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
        // 确保组件仍然挂载
        if (this.$el && this.$refs && this.$refs.mainImage) {
          const mediaEl = this.$refs.mainImgEl || this.$refs.mainVideoEl;
          const containerEl = this.$refs.mainImage;

          if (mediaEl && containerEl) {
            try {
              if (this.isActiveMediaVideo) {
                // 视频元素
                this.mainImgWidth = mediaEl.videoWidth || mediaEl.clientWidth;
                this.mainImgHeight = mediaEl.videoHeight || mediaEl.clientHeight;
              } else {
                // 图片元素
                this.mainImgWidth = mediaEl.naturalWidth || mediaEl.width;
                this.mainImgHeight = mediaEl.naturalHeight || mediaEl.height;
              }

              const rect = containerEl.getBoundingClientRect();
              this.mainImageContainerWidth = rect.width;
              this.mainImageContainerHeight = rect.height;
            } catch (error) {
              console.warn('Update main media size failed:', error);
            }
          }
        }
      });
    },
    handleMouseMove(e) {
      // 确保组件仍然挂载且refs存在
      if (this.$el && this.$refs && this.$refs.mainImage) {
        try {
          const rect = this.$refs.mainImage.getBoundingClientRect();
          let x = e.clientX - rect.left;
          let y = e.clientY - rect.top;
          // 限制 lens 不超出图片
          x = Math.max(this.lensSize / 2, Math.min(x, rect.width - this.lensSize / 2));
          y = Math.max(this.lensSize / 2, Math.min(y, rect.height - this.lensSize / 2));
          this.zoomPos = { x, y };
        } catch (error) {
          console.warn('Handle mouse move failed:', error);
        }
      }
    },
    // 判断媒体类型
    getMediaType(url) {
      if (!url) return 'image'
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.mkv']
      const extension = url.toLowerCase().substring(url.lastIndexOf('.'))
      return videoExtensions.includes(extension) ? 'video' : 'image'
    },
    // 设置当前活动媒体
    setActiveMedia(media) {
      this.activeImage = media.url
      // 如果是视频，停止放大功能
      if (media.type === 'video') {
        this.showZoom = false
      }
    },
    // 检查是否需要显示滚动箭头
    checkScrollNeed() {
      this.$nextTick(() => {
        const wrapper = this.$refs.thumbnailWrapper;
        const list = this.$refs.thumbnailList;
        if (wrapper && list) {
          const wrapperWidth = wrapper.clientWidth;
          const listWidth = list.scrollWidth;
          this.showScrollArrows = listWidth > wrapperWidth;
          this.updateScrollButtons();
          
          // 添加滚动事件监听器
          wrapper.addEventListener('scroll', this.updateScrollButtons);
        }
      });
    },
    // 更新滚动按钮状态
    updateScrollButtons() {
      const wrapper = this.$refs.thumbnailWrapper;
      if (wrapper) {
        this.canScrollLeft = wrapper.scrollLeft > 0;
        this.canScrollRight = wrapper.scrollLeft < (wrapper.scrollWidth - wrapper.clientWidth);
      }
    },
    // 开始滚动
    startScrolling(direction) {
      if (this.scrollInterval) {
        clearInterval(this.scrollInterval);
      }
      
      const wrapper = this.$refs.thumbnailWrapper;
      if (!wrapper) return;
      
      const scrollSpeed = 2; // 滚动速度
      
      this.scrollInterval = setInterval(() => {
        if (direction === 'left') {
          wrapper.scrollLeft -= scrollSpeed;
          if (wrapper.scrollLeft <= 0) {
            this.stopScrolling();
          }
        } else {
          wrapper.scrollLeft += scrollSpeed;
          if (wrapper.scrollLeft >= (wrapper.scrollWidth - wrapper.clientWidth)) {
            this.stopScrolling();
          }
        }
        this.updateScrollButtons();
      }, 16); // 约60fps
    },
    // 停止滚动
    stopScrolling() {
      if (this.scrollInterval) {
        clearInterval(this.scrollInterval);
        this.scrollInterval = null;
      }
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



.product-detail-content {
  flex: 1;
  display: flex;
  gap: $spacing-4xl;
  align-items: flex-start;
}

.product-gallery-block {
  width: $product-gallery-width;
  /* 增加宽度从350px到480px */
  position: relative;
  flex-shrink: 0;
  /* 防止被压缩 */
}

.main-image {
  width: 100%;
  height: $product-main-image-height;
  position: relative;
  background: $gray-100;
  border: 1px solid $gray-200;
  border-radius: $border-radius-md;
  margin-bottom: $spacing-md;
  overflow: hidden;
  cursor: crosshair;
}

.main-image img,
.main-image video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* 修改: 改为cover以填充容器，可能会裁剪图片 */
  display: block;
}

.main-video {
  background: #000;
}

.video-thumbnail {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.video-thumbnail video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  pointer-events: none;
}

.play-icon i {
  margin-left: 2px; /* 调整播放图标位置 */
}

.thumbnail-container {
  position: relative;
  width: 100%;
}

.thumbnail-scroll-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari and Opera */
  }
}

.thumbnail-list {
  display: flex;
  gap: $spacing-sm;
  justify-content: flex-start;
  min-width: min-content;
}

.thumbnail {
  width: $product-thumbnail-size;
  height: $product-thumbnail-size;
  background: $white;
  border: 1px solid $gray-200;
  border-radius: $border-radius-sm;
  display: flex;
  align-items: center;
  flex-shrink: 0; /* 防止缩略图被压缩 */
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

:deep(.scroll-arrows) {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
  z-index: 2;
}

:deep(.scroll-arrow) {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: $transition-base;
  pointer-events: auto;
  font-size: 18px;
  font-weight: bold;
  
  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.7);
    transform: scale(1.1);
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

:deep(.scroll-arrow-left) {
  margin-left: -12px;
}

:deep(.scroll-arrow-right) {
  margin-right: -12px;
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
    min-width: $quantity-min-width;
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
  width: $product-quantity-width;
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
  border-top: $table-border-width solid $gray-200;
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
  margin-top: $spacing-lg;
}

.specs-table th,
.specs-table td {
  padding: $spacing-md $spacing-lg;
  text-align: left;
  border: $table-border-width solid $gray-200;
}

.specs-table th {
  width: $product-specs-table-width;
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
  border-top: $table-border-width solid $gray-200;
}

.related-products-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax($related-product-min-width, 1fr));
  gap: $spacing-lg;
}

/* 相关产品卡片样式已移至shared.scss，这里只保留ProductDetail特有的样式 */
.related-product-card {
  text-align: left;
  padding: $spacing-md;
}

.related-product-card:hover {
  transform: translateY($hover-transform-lg);
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
  height: $product-title-height;
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
  padding: $spacing-2xl;
  border-radius: $border-radius-lg;
  margin-bottom: $spacing-3xl;
  box-shadow: $shadow-sm;
}

.inquiry-form h2 {
  font-size: $font-size-2xl;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin-bottom: $spacing-xl;
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
  width: $divider-width;
  height: $divider-height;
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

/* 购物车按钮动画效果 */
.add-to-cart-btn {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.add-to-cart-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(229, 62, 62, 0.3);
}

.add-to-cart-btn.success-animation {
  background-color: #67c23a !important;
  border-color: #67c23a !important;
  transform: scale(1.05);
}

.add-to-cart-btn.success-animation::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 18px;
  color: white;
  animation: checkmark 0.6s ease-in-out;
}

@keyframes checkmark {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0);
  }

  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2);
  }

  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
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