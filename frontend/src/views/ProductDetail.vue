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
              <video v-if="isActiveMediaVideo" :src="activeImage" :alt="product.name" controls muted ref="mainVideoEl"
                class="main-video" @loadedmetadata="updateMainImgSize">
                您的浏览器不支持视频播放。
              </video>
              <img v-else :src="activeImage || product.thumbnail_url" :alt="product.name" @error="handleImageError"
                ref="mainImgEl" @load="updateMainImgSize">
              <div v-if="showZoom && !isActiveMediaVideo" class="zoom-lens" :style="zoomLensStyle"></div>
            </div>
            <div v-if="showZoom && mainImgWidth > 0 && mainImgHeight > 0 && !isActiveMediaVideo" class="zoom-window"
              :style="zoomWindowStyle">
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
                <button class="scroll-arrow scroll-arrow-left" @mouseenter="startScrolling('left')"
                  @mouseleave="stopScrolling" :disabled="!canScrollLeft">
                  ‹
                </button>
                <button class="scroll-arrow scroll-arrow-right" @mouseenter="startScrolling('right')"
                  @mouseleave="stopScrolling" :disabled="!canScrollRight">
                  ›
                </button>
              </div>
            </div>
          </div>
          <div class="product-info-block">
            <div class="product-header">
              <h1 class="product-title">{{ product.name }}</h1>
              <el-button v-if="isLoggedIn" :type="isFavorited ? 'danger' : 'default'" circle size="large"
                @click="toggleFavorite" :loading="favoriteLoading" class="favorite-btn"
                :title="isFavorited ? $t('productDetail.removeFromFavorites') : $t('productDetail.addToFavorites')">
                <el-icon :size="24">
                  <Star :style="{ color: isFavorited ? '#f56c6c' : '#909399' }" />
                </el-icon>
              </el-button>
            </div>
            <div class="product-meta">
              <span class="product-id">{{ $t('productDetail.productCode') }}: {{ product.product_code }}</span>
              <span class="product-category">{{ $t('productDetail.category') }}: {{ categoryName }}</span>
            </div>
            <div class="product-price">
              <!-- 如果有阶梯价格，显示阶梯价格 -->
              <div v-if="product.price_ranges && product.price_ranges.length > 0" class="price-ranges">
                <div v-for="(range, index) in product.price_ranges" :key="index" class="price-range-item">
                  <div class="quantity-range">
                    <span v-if="range.max_quantity !== null && range.max_quantity !== undefined">
                      {{ range.min_quantity }} - {{ range.max_quantity }} pieces
                    </span>
                    <span v-else>
                      >= {{ range.min_quantity }} pieces
                    </span>
                  </div>
                  <div class="range-price">{{ $store.getters.formatPrice(range.price) }}</div>
                </div>
              </div>
              <!-- 如果没有阶梯价格，显示普通价格 -->
              <div v-else class="single-price">
                {{ $store.getters.formatPrice(product.price) }}
              </div>
            </div>
            <div v-if="product.product_type === 'self_operated'" class="product-stock">
              <span :class="['stock-status', product.stock > 0 ? 'in-stock' : 'out-of-stock']">
                {{ product.stock > 0 ? $t('productDetail.inStock') : $t('productDetail.outOfStock') }}
              </span>
              <span class="stock-number">{{ $t('productDetail.stock') }}: {{ product.stock }}</span>
            </div>
            <div class="product-short-desc">
              <p>{{ product.short_description }}</p>
            </div>
            <div class="product-actions">
              <!-- 按钮组 -->
              <div class="action-buttons">
                <el-button type="primary" @click="addToCart"
                  :disabled="product.product_type === 'self_operated' && product.stock <= 0" :loading="addingToCart"
                  class="add-to-cart-btn">
                  <span v-if="!addingToCart">{{ $t('buttons.addToCart') }}</span>
                  <span v-else>{{ $t('buttons.adding') || '添加中...' }}</span>
                </el-button>
                <el-button type="success" @click="openBuyNowDialog"
                  :disabled="product.product_type === 'self_operated' && product.stock <= 0" class="buy-now-btn">
                  {{ $t('buttons.buyNow') || '立即购买' }}
                </el-button>
                <el-button class="chat-button" @click="createInquiry">{{
                  $t('buttons.chat') || 'Chat' }}</el-button>
                <el-button class="email-button" @click="openEmailDialog">{{
                  $t('buttons.sendToInquiry') || 'Send to Inquiry' }}</el-button>
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
      <!-- 一起购买组件 -->
      <div v-if="buyTogetherProducts.length > 0" class="buy-together-section">
        <h2 class="buy-together-title">{{ $t('productDetail.buyTogether.title') }}</h2>
        <div class="buy-together-content">
          <div class="buy-together-products">
            <!-- 当前商品 -->
            <div class="buy-together-item current-product">
              <div class="product-checkbox">
                <el-checkbox v-model="currentProductSelected" @change="updateTotalPrice">
                  <img :src="product.thumbnail_url" :alt="product.name" @error="handleImageError" class="product-image">
                </el-checkbox>
              </div>
            </div>

            <!-- 加号 -->
            <div class="plus-icon">+</div>

            <!-- 推荐商品 -->
            <div v-for="(item, index) in buyTogetherProducts" :key="item.id" class="buy-together-item">
              <div class="product-checkbox">
                <el-checkbox v-model="item.selected" @change="updateTotalPrice">
                  <img :src="item.thumbnail_url" :alt="item.name" @error="handleImageError" class="product-image">
                </el-checkbox>
              </div>
              <div v-if="index < buyTogetherProducts.length - 1" class="plus-icon">+</div>
            </div>
          </div>

          <!-- 总价和购买按钮 -->
          <div class="buy-together-summary">
            <!-- 商品详细信息列表 -->
            <div class="selected-products-info">
              <div v-if="currentProductSelected" class="product-info-item">
                <span class="product-name">{{ product.name }}</span>
                <span class="product-price">{{ $store.getters.formatPrice(getCurrentProductPrice()) }}</span>
              </div>
              <template v-for="item in buyTogetherProducts" :key="item.id">
                <div v-if="item.selected" class="product-info-item">
                  <span class="product-name">{{ item.name }}</span>
                  <span class="product-price">{{ $store.getters.formatPrice(item.price) }}</span>
                </div>
              </template>
            </div>

            <div class="total-and-button">
              <!-- 总价显示已隐藏 -->
              <div class="action-buttons">
                <el-button type="primary" size="large" @click="addAllToCart" :disabled="!hasSelectedProducts"
                  :loading="addingAllToCart" class="add-all-btn">
                  {{ $t('productDetail.buyTogether.addAllToCart') }}
                </el-button>
                <el-button type="success" size="large" @click="sendAllToInquiry" :disabled="!hasSelectedProducts"
                  :loading="sendingAllToInquiry" class="send-all-inquiry-btn">
                  {{ $t('productDetail.buyTogether.sendAllToInquiry') }}
                </el-button>
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

    <!-- 询价浮动窗口 -->
    <div v-if="showInquiryDialog" class="inquiry-floating-window" :class="{ 'show': showInquiryDialog }">
      <div class="inquiry-window-content">
        <div class="inquiry-window-header">
          <h4 class="header-title">{{ $t('cart.salesCommunication') || 'Sales Communication' }}</h4>
          <div class="header-buttons">
            <button class="expand-btn" @click="expandInquiryDialog" title="放大窗口">
              <el-icon>
                <FullScreen />
              </el-icon>
            </button>
            <button class="close-btn" @click="closeInquiryDialog" title="关闭窗口">
              <el-icon>
                <Close />
              </el-icon>
            </button>
          </div>
        </div>
        <div class="inquiry-window-body">
          <!-- 沟通组件 -->
          <CommunicationSection :messages="inquiryMessages" :inquiry-id="currentInquiryId" :items-count="1"
            :status="inquiryStatus" :initial-message="initialInquiryMessage" @send-message="handleSendInquiryMessage"
            @update-message="handleUpdateInquiryMessage" @checkout="handleInquiryCheckout"
            @new-messages="handleNewMessages" />
        </div>
      </div>
    </div>

    <!-- 邮件对话框 -->
    <MessageDialog v-model:visible="showEmailDialog" :product="product" @email-sent="handleEmailSent" />

    <!-- 登录对话框 -->
    <div v-if="loginDialogVisible" class="login-dialog-overlay">
      <div class="login-dialog-container">
        <LoginDialog :show-close-button="true" @login-success="handleLoginSuccess"
          @close="loginDialogVisible = false" />
      </div>
    </div>

    <!-- 立即购买对话框 -->
    <BuyNowDialog v-model="showBuyNowDialog" :product="product" :initial-quantity="1"
      @checkout="handleBuyNowCheckout" />
  </div>
</template>

<script>
// 使用全局注册的$api替代axios
import { handleImageError } from '../utils/imageUtils';
import { handleChatNow, handleAddToCart, handleLoginSuccess, loadInquiryMessages, addBrowsingHistory, checkFavoriteStatus } from '../utils/productUtils';
import PageBanner from '@/components/common/PageBanner.vue';
import NavigationMenu from '@/components/common/NavigationMenu.vue';
import CommunicationSection from '../components/common/CommunicationSection.vue'
import LoginDialog from '../components/common/LoginDialog.vue'

import BuyNowDialog from '@/components/common/BuyNowDialog.vue'
import MessageDialog from '@/components/common/MessageDialog.vue'
import { FullScreen, Close } from '@element-plus/icons-vue';

export default {
  name: 'ProductDetail',
  components: {
    PageBanner,
    NavigationMenu,
    CommunicationSection,
    LoginDialog,

    BuyNowDialog,
    MessageDialog,
    FullScreen,
    Close
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
      // 询价相关数据
      showInquiryDialog: false,
      currentInquiryId: null,
      inquiryMessages: [],
      inquiryStatus: 'pending',
      initialInquiryMessage: '',
      loginDialogVisible: false,
      pendingAction: null, // 'inquiry' 或 'addToCart'
      // 对话框状态
      showEmailDialog: false,
      // 收藏相关
      favoriteLoading: false,
      isFavorited: false,
      // 一起购买相关
      buyTogetherProducts: [],
      currentProductSelected: true,
      totalPrice: 0,
      addingAllToCart: false,
      sendingAllToInquiry: false
    }
  },
  computed: {
    isLoggedIn() {
      return this.$store.getters.isLoggedIn;
    },
    userInfo() {
      return this.$store.getters.user || {};
    },
    isMobile() {
      return window.innerWidth <= 768;
    },
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
    },
    // 一起购买相关计算属性
    hasSelectedProducts() {
      return this.currentProductSelected || this.buyTogetherProducts.some(item => item.selected);
    },
    showBuyNowDialog: {
      get() {
        return this.$store.state.showBuyNowDialog || false;
      },
      set(value) {
        this.$store.commit('setShowBuyNowDialog', value);
      }
    }
  },
  watch: {
    product(val) {
      // 切换产品时设置为第一个轮播图，如果没有轮播图则使用主图
      this.$nextTick(() => {
        if (this.galleryImages && this.galleryImages.length > 0) {
          this.setActiveMedia(this.galleryImages[0])
        } else {
          this.activeImage = val.thumbnail_url || ''
        }
      })
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
    // 确保页面从顶部开始显示
    window.scrollTo(0, 0);
    
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
        
        // 获取一起购买的商品
        this.fetchBuyTogetherProducts()
        
        // 如果用户已登录，添加浏览历史和检查收藏状态
        if (this.isLoggedIn) {
          await addBrowsingHistory(this.product.id, this)
          await this.checkFavoriteStatusLocal()
        }
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
    // 获取一起购买的商品
    async fetchBuyTogetherProducts() {
      if (!this.productId) return
      try {
        const response = await this.$api.getWithErrorHandler(`products/${this.productId}/buy-together`, {
          errorMessageKey: 'productDetail.buyTogether.loadError'
        })
        
        if (response && response.data) {
          // 为每个商品添加选中状态，默认选中
          this.buyTogetherProducts = response.data.map(item => ({
            ...item,
            selected: true
          }))
          
          // 初始化总价
          this.updateTotalPrice()
        }
      } catch (error) {
        console.error('获取一起购买商品失败:', error)
        // 错误已由getWithErrorHandler处理，这里不需要再次显示
      }
    },
    // 获取当前商品价格
    getCurrentProductPrice() {
      // 如果有阶梯价格，返回最低价格
      if (this.product.price_ranges && this.product.price_ranges.length > 0) {
        return Math.min(...this.product.price_ranges.map(range => range.price))
      }
      return this.product.price || 0
    },
    // 更新总价
    updateTotalPrice() {
      let total = 0
      
      // 当前商品价格
      if (this.currentProductSelected) {
        total += this.getCurrentProductPrice()
      }
      
      // 一起购买商品价格
      this.buyTogetherProducts.forEach(item => {
        if (item.selected) {
          total += item.price || 0
        }
      })
      
      this.totalPrice = total
    },
    // 全部加入购物车
    async addAllToCart() {
      if (this.addingAllToCart || !this.hasSelectedProducts) return
      
      // 检查用户是否登录
      if (!this.isLoggedIn) {
        this.pendingAction = 'addAllToCart'
        this.loginDialogVisible = true
        return
      }
      
      try {
        this.addingAllToCart = true
        const selectedProducts = []
        
        // 添加当前商品
        if (this.currentProductSelected) {
          selectedProducts.push({
            productId: this.product.id
          })
        }
        
        // 添加选中的一起购买商品
        this.buyTogetherProducts.forEach(item => {
          if (item.selected) {
            selectedProducts.push({
              productId: item.id
            })
          }
        })
        
        // 批量添加到购物车
        for (const productData of selectedProducts) {
          await this.$api.postWithErrorHandler('cart/add', productData, {
            fallbackKey: 'cart.error.addFailed'
          })
        }
        
        this.$messageHandler.showSuccess(
          this.$t('cart.addSuccess'),
          'cart.addSuccess'
        )
        
        // 更新购物车数量
        this.$store.dispatch('updateCartCount')
        
      } catch (error) {
        console.error('批量添加到购物车失败:', error)
        this.$messageHandler.showError(error, 'cart.addError')
      } finally {
        this.addingAllToCart = false
      }
    },
    
    // 全部发送询价
    async sendAllToInquiry() {
      if (this.sendingAllToInquiry || !this.hasSelectedProducts) return
      
      // 检查用户是否登录
      if (!this.isLoggedIn) {
        this.pendingAction = 'sendAllToInquiry'
        this.loginDialogVisible = true
        return
      }
      
      try {
        this.sendingAllToInquiry = true
        
        // 收集选中的商品
        const selectedProducts = []
        
        // 添加当前商品
        if (this.currentProductSelected) {
          selectedProducts.push({
            productId: this.product.id,
            quantity: 1,
            unitPrice: this.product.price
          })
        }
        
        // 添加选中的一起购买商品
        this.buyTogetherProducts.forEach(item => {
          if (item.selected) {
            selectedProducts.push({
              productId: item.id,
              quantity: 1,
              unitPrice: item.price
            })
          }
        })
        
        // 创建询价单 - 使用正确的API路径和参数
        const titlePrefix = this.$t('cart.inquiryTitlePrefix') || '询价单'
        const inquiryResponse = await this.$api.postWithErrorHandler('/inquiries', {
          titlePrefix: titlePrefix
        }, {
          fallbackKey: 'INQUIRY.CREATE.FAILED'
        })
        
        if (inquiryResponse.success) {
          const inquiryId = inquiryResponse.data.id
          
          // 将商品添加到询价单 - 使用正确的API路径和参数
          for (const product of selectedProducts) {
            await this.$api.postWithErrorHandler(`/inquiries/${inquiryId}/items`, {
              productId: product.productId,
              quantity: product.quantity,
              unitPrice: product.unitPrice
            }, {
              fallbackKey: 'INQUIRY.ADD_ITEM.FAILED'
            })
          }
          
          this.$messageHandler.showSuccess(
            this.$t('productDetail.buyTogether.sendToInquirySuccess'),
            'productDetail.buyTogether.sendToInquirySuccess'
          )
        }
        
      } catch (error) {
        console.error('批量发送询价失败:', error)
        this.$messageHandler.showError(error, 'productDetail.buyTogether.sendToInquiryError')
      } finally {
        this.sendingAllToInquiry = false
      }
    },
    
    async createInquiry() {
      const success = await handleChatNow(
        this.product, 
        this, 
        this.showLoginDialog, 
        this.showInquiryDialogWithData
      );
      
      if (!success) {
        // 如果失败，可能是需要登录
        this.pendingAction = 'inquiry';
      }
    },
    contactUs() {
      this.$router.push('/contact');
    },
    
    async addToCart() {
      if (this.addingToCart) return;
      
      const success = await handleAddToCart(
        this.product, 
        this, 
        this.showLoginDialog, 
        (loading) => {
          this.addingToCart = loading;
        }
      );
      
      if (!success) {
        // 如果失败，可能是需要登录
        this.pendingAction = 'addToCart';
      } else {
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
      // 如果是视频，停止放大功能并设置自动播放
      if (media.type === 'video') {
        this.showZoom = false
        this.$nextTick(() => {
          const videoEl = this.$refs.mainVideoEl
          if (videoEl) {
            videoEl.currentTime = 0 // 从头开始播放
            videoEl.loop = true // 循环播放
            videoEl.muted = true // 默认静音
            videoEl.play().catch(error => {
              console.warn('视频自动播放失败:', error)
            })
          }
        })
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
    // 关闭询价对话框
    closeInquiryDialog() {
      this.showInquiryDialog = false;
      // 清理数据
      this.currentInquiryId = null;
      this.inquiryMessages = [];
      this.inquiryStatus = 'pending';
      this.initialInquiryMessage = '';
    },
 
    // 处理更新询价消息
    handleUpdateInquiryMessage(inquiryId, message) {
      // 实时更新消息内容（可用于草稿保存等功能）
      console.log('Message updated:', inquiryId, message);
    },
    // 处理新消息
    handleNewMessages(data) {
      try {
        const { inquiryId, messages } = data;
        
        if (inquiryId === this.currentInquiryId && messages && messages.length > 0) {
          messages.forEach(messageData => {
            // 构建消息对象
            const newMessage = {
              id: messageData.id,
              content: messageData.message,
              sender: messageData.sender_name || (messageData.sender_type === 'user' ? '用户' : '客服'),
              timestamp: messageData.created_at,
              isUser: messageData.sender_type === 'user'
            };
            
            // 检查消息是否已存在（避免重复）
            const existingMessage = this.inquiryMessages.find(msg => msg.id === newMessage.id);
            if (!existingMessage) {
              this.inquiryMessages.push(newMessage);
              
              // 显示新消息提示（如果不是当前用户发送的）
              if (messageData.sender_id !== this.$store.state.user?.id) {
                this.$messageHandler.showSuccess(`收到来自 ${messageData.sender_name} 的新消息`, 'inquiry.success.newMessage');
              }
            }
          });
          
          console.log(`ProductDetail: 收到 ${messages.length} 条新消息`);
        }
        
      } catch (error) {
        console.error('ProductDetail: 处理新消息失败:', error);
      }
    },
    // 处理询价结账
    async handleInquiryCheckout(inquiryId) {
      try {
        await this.$api.post(`inquiries/${inquiryId}/checkout`);
        this.inquiryStatus = 'Checkouted';
        this.$messageHandler.showSuccess(this.$t('messages.checkoutSuccess') || '结账成功', 'inquiry.success.checkout');
        
        // 可以选择关闭对话框或跳转到订单页面
        setTimeout(() => {
          this.closeInquiryDialog();
        }, 2000);
      } catch (error) {
        console.error('结账失败:', error);
        this.$messageHandler.showError(error, 'inquiry.error.checkoutFailed');
      }
    },
    // 加载询价消息
    async loadInquiryMessages() {
      if (!this.currentInquiryId) return;
      
      const result = await loadInquiryMessages(this.currentInquiryId, this);
      this.inquiryMessages = result.messages;
      this.inquiryStatus = result.status;
    },
    // 放大询价窗口 - 跳转到My Inquiries页面
    expandInquiryDialog() {
      if (this.currentInquiryId) {
        // 跳转到询价单管理页面，并传递当前询价单ID
        this.$router.push({
          path: '/inquiry-management',
          query: { inquiryId: this.currentInquiryId }
        });
      } else {
        // 如果没有当前询价单ID，直接跳转到询价单管理页面
        this.$router.push('/inquiry-management');
      }
    },
    // 邮件对话框相关方法
    openEmailDialog() {
      this.showEmailDialog = true;
    },
    handleEmailSent() {
      this.showEmailDialog = false;
      this.$messageHandler.showSuccess(
        this.$t('productDetail.emailDialog.success'), 
        'productDetail.emailDialog.success'
      );
    },
    // 处理登录成功
     async handleLoginSuccess() {
       this.loginDialogVisible = false;
       
       if (this.pendingAction && this.product) {
         // 处理特殊的sendAllToInquiry操作
         if (this.pendingAction === 'sendAllToInquiry') {
           await this.sendAllToInquiry();
         } else if (this.pendingAction === 'addAllToCart') {
           await this.addAllToCart();
         } else {
           await handleLoginSuccess(
             this.pendingAction,
             this.product,
             this,
             this.showInquiryDialogWithData,
             (loading) => {
               this.addingToCart = loading;
             }
           );
         }
       }
       
       // 清除待执行的操作
       this.pendingAction = null;
       
       // 登录成功后添加浏览历史和检查收藏状态
       if (this.product && this.product.id) {
         await addBrowsingHistory(this.product.id, this);
         await this.checkFavoriteStatusLocal();
       }
     },
     
     // 显示登录对话框
     showLoginDialog(action) {
       this.pendingAction = action;
       this.loginDialogVisible = true;
     },

     // 显示询价对话框
     showInquiryDialogWithData(data) {
       this.currentInquiryId = data.inquiryId;
       this.initialInquiryMessage = '';
       this.showInquiryDialog = true;
       
       // 如果不是新询价单，加载消息
       if (!data.isNew) {
         this.loadInquiryMessages();
       }
     },
     
     // 检查收藏状态（本地方法）
     async checkFavoriteStatusLocal() {
       if (!this.isLoggedIn || !this.product.id) return;
       
       const result = await checkFavoriteStatus(this.product.id, this);
       this.isFavorited = result;
     },
     
     // 切换收藏状态
     async toggleFavorite() {
       if (this.favoriteLoading) return;
       
       // 检查用户是否已登录
       if (!this.isLoggedIn) {
         this.pendingAction = 'favorite';
         this.loginDialogVisible = true;
         return;
       }
       
       this.favoriteLoading = true;
       
       try {
         if (this.isFavorited) {
           // 取消收藏
           const checkResponse = await this.$api.get(`user-products/check/${this.product.id}`, {
             params: { type: 'favorite' }
           });
           
           if (checkResponse.data.exists && checkResponse.data.id) {
             await this.$api.delete(`user-products/${checkResponse.data.id}`);
             this.isFavorited = false;
             this.$messageHandler.showSuccess('已取消收藏', 'product.success.unfavorited');
           }
         } else {
           // 添加收藏
           await this.$api.post('user-products', {
             product_id: this.product.id,
             type: 'favorite'
           });
           this.isFavorited = true;
           this.$messageHandler.showSuccess('已添加到收藏', 'product.success.favorited');
         }
       } catch (error) {
         console.error('切换收藏状态失败:', error);
         this.$messageHandler.showError(error, 'product.error.toggleFavoriteFailed');
       } finally {
         this.favoriteLoading = false;
       }
     },
     
     // 立即购买相关方法
     openBuyNowDialog() {
       // 检查用户是否已登录
       if (!this.isLoggedIn) {
         this.pendingAction = 'buyNow';
         this.loginDialogVisible = true;
         return;
       }
       
       this.showBuyNowDialog = true;
     },
     
     // 处理结账事件
     handleCheckout(orderData) {
       this.showBuyNowDialog = false;
       
       // 将订单数据存储到sessionStorage，供UnifiedCheckout使用
       sessionStorage.setItem('selectedCartItems', JSON.stringify([orderData]));
       
       // 跳转到结算页面
       this.$router.push({
         name: 'UnifiedCheckout'
       });
     }
  }
}
</script>

<!-- Quill 全局样式 - 不能使用 scoped -->
<style lang="scss">
@import '@/assets/styles/_quill-global.scss';
</style>

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

/* 询价浮动窗口样式 */
.inquiry-floating-window {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 380px;
  height: 500px;
  background: $white;
  border-radius: $border-radius-lg;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 9999;
  transform: translateY(100%) scale(0.8);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  border: 1px solid $border-light;

  &.show {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.inquiry-window-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.inquiry-window-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md;
  border-bottom: $border-width-sm solid $border-light;
  background: $gray-50;
  min-height: 50px;

  .header-title {
    margin: 0;
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $text-primary;
  }

  .header-buttons {
    display: flex;
    gap: $spacing-xs;

    .expand-btn,
    .close-btn {
      background: none;
      border: none;
      font-size: $font-size-lg;
      color: $text-secondary;
      cursor: pointer;
      padding: $spacing-xs;
      border-radius: $border-radius-sm;
      transition: all 0.2s ease;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: $gray-200;
        color: $text-primary;
      }
    }
  }
}

.inquiry-window-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}



/* 移动端适配 */
@media (max-width: 768px) {
  .inquiry-floating-window {
    bottom: 10px;
    right: 10px;
    left: 10px;
    width: auto;
    height: 400px;

    &.show {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }

  .inquiry-window-header {
    padding: $spacing-md;

    h3 {
      font-size: $font-size-lg;
    }
  }
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
  margin-bottom: $spacing-sm;
}

.product-detail-content {
  flex: 1;
  display: flex;
  gap: $spacing-xl; /* 减少间距从64px到24px，给商品信息区域更多空间 */
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
  margin-left: 2px;
  /* 调整播放图标位置 */
}

.thumbnail-container {
  position: relative;
  width: 100%;
}

.thumbnail-scroll-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* IE and Edge */

  &::-webkit-scrollbar {
    display: none;
    /* Chrome, Safari and Opera */
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
  flex-shrink: 0;
  /* 防止缩略图被压缩 */
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

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-lg;
  gap: $spacing-md;
}

.product-title {
  font-size: $font-size-4xl;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin: 0;
  line-height: $line-height-tight;
  flex: 1;
}

.favorite-btn {
  flex-shrink: 0;
  width: 48px !important;
  height: 48px !important;
  border-radius: 50% !important;
  border: 2px solid $gray-300 !important;
  background-color: $white !important;
  transition: all 0.3s ease !important;

  &:hover {
    border-color: $primary-color !important;
    background-color: $gray-50 !important;
    transform: scale(1.05);
  }

  &.el-button--danger {
    border-color: #f56c6c !important;
    background-color: rgba(245, 108, 108, 0.1) !important;

    &:hover {
      background-color: rgba(245, 108, 108, 0.2) !important;
    }
  }

  :deep(.el-icon) {
    font-size: 24px !important;
  }
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
  margin-bottom: $spacing-md;
  text-align: left;
}

/* 阶梯价格样式 */
.price-ranges {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  background-color: transparent;
}

.price-range-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  min-width: 120px;
  flex: 1;
}

.quantity-range {
  font-size: 12px;
  color: #666;
  font-weight: 400;
  margin-bottom: 4px;
  text-align: left;
  line-height: 1.2;
}

.range-price {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  text-align: left;
}

.single-price {
  font-size: $font-size-3xl;
  font-weight: $font-weight-bold;
  color: $primary-color;
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
  gap: $spacing-sm; /* 减少按钮间距从16px到8px */
  flex-wrap: nowrap; /* 防止按钮换行 */
  align-items: center;
}

/* Add to Inquiry 按钮样式 - 与Home页面more按钮一致 */
:deep(.inquiry-button) {
  @include button-base;
  background-color: $gray-200 !important;
  color: $gray-700 !important;
  border-color: $gray-200 !important;
  padding: $spacing-md $spacing-lg !important; /* 减少水平padding */
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
  padding: $spacing-md $spacing-lg !important; /* 减少水平padding */
  font-size: $font-size-lg !important;
  font-weight: $font-weight-semibold !important;

  &:hover:not(:disabled) {
    background-color: $gray-300 !important;
    border-color: $gray-300 !important;
  }
}

/* Chat 和 Message 按钮样式 */
:deep(.chat-button) {
  @include button-base;
  background-color: #67C23A !important;
  color: white !important;
  border-color: #67C23A !important;
  padding: $spacing-md $spacing-lg !important; /* 减少水平padding */
  font-size: $font-size-lg !important;
  font-weight: $font-weight-semibold !important;
  border-radius: $border-radius-md !important;
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.3) !important;
  transition: all 0.3s ease !important;

  &:hover:not(:disabled) {
    background-color: #5daf34 !important;
    border-color: #5daf34 !important;
    box-shadow: 0 4px 12px rgba(103, 194, 58, 0.4) !important;
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(103, 194, 58, 0.3) !important;
  }
}

:deep(.email-button) {
  @include button-base;
  background-color: #409EFF !important;
  color: white !important;
  border-color: #409EFF !important;
  padding: $spacing-md $spacing-lg !important; /* 减少水平padding */
  font-size: $font-size-lg !important;
  font-weight: $font-weight-semibold !important;
  border-radius: $border-radius-md !important;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3) !important;
  transition: all 0.3s ease !important;

  &:hover:not(:disabled) {
    background-color: #337ecc !important;
    border-color: #337ecc !important;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4) !important;
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3) !important;
  }
}

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
  .container {
    padding: 0 $spacing-md;
  }

  .product-detail-main {
    flex-direction: column;
    gap: $spacing-lg;
    margin-bottom: $spacing-lg;
  }

  .product-detail-content {
    flex-direction: column;
    gap: $spacing-lg;
  }

  .product-gallery-block {
    width: 100%;
    max-width: 100%;
  }

  .main-image {
    height: 250px;
    margin-bottom: $spacing-md;
  }

  .thumbnail-container {
    .thumbnail-list {
      gap: $spacing-xs;
    }

    .thumbnail {
      width: 60px;
      height: 60px;
    }
  }

  .product-info-block {
    padding: $spacing-md;
  }

  .product-header {
    flex-direction: row;
    align-items: flex-start;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;
  }

  .product-title {
    font-size: $font-size-2xl;
    margin: 0;
    line-height: $line-height-normal;
  }

  .favorite-btn {
    width: 40px !important;
    height: 40px !important;

    :deep(.el-icon) {
      font-size: 20px !important;
    }
  }

  .product-meta {
    font-size: $font-size-md;
    margin-bottom: $spacing-md;
    flex-direction: column;
    gap: $spacing-xs;
  }

  .product-price {
    font-size: $font-size-2xl;
    margin-bottom: $spacing-md;
    text-align: left;
  }

  .product-stock {
    margin-bottom: $spacing-md;
    font-size: $font-size-sm;
  }

  .product-short-desc {
    font-size: $font-size-sm;
    margin-bottom: $spacing-md;
    line-height: $line-height-relaxed;
  }

  .product-actions {
    .quantity-selector {
      flex-direction: column;
      align-items: flex-start;
      gap: $spacing-sm;
      margin-bottom: $spacing-md;

      .quantity-label {
        min-width: auto;
        font-size: $font-size-md;
      }
    }

    .action-buttons {
      flex-direction: column;
      align-items: stretch;
      gap: $spacing-sm;
      width: 100%;

      .el-button {
        width: 100% !important;
        font-size: $font-size-md !important;
        padding: $spacing-md $spacing-lg !important;
        height: 48px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-radius: $border-radius-md !important;
        font-weight: $font-weight-medium !important;
        margin: 0 !important; /* 移除所有按钮的边距 */
      }

      :deep(.add-to-cart-btn) {
        background-color: $primary-color !important;
        border-color: $primary-color !important;
        color: white !important;
      }

      :deep(.buy-now-btn) {
        background-color: $success-color !important;
        border-color: $success-color !important;
        color: white !important;
      }

      :deep(.chat-button) {
        background-color: #67C23A !important;
        border-color: #67C23A !important;
        color: white !important;
        box-shadow: 0 2px 6px rgba(103, 194, 58, 0.25) !important;
      }

      :deep(.email-button) {
        background-color: #409EFF !important;
        border-color: #409EFF !important;
        color: white !important;
        box-shadow: 0 2px 6px rgba(64, 158, 255, 0.25) !important;
      }
    }
  }

  .product-share {
    margin-top: $spacing-md;
    font-size: $font-size-sm;

    .share-icons {
      gap: $spacing-sm;

      i {
        font-size: $font-size-lg;
      }
    }
  }

  .description-section {
    padding: $spacing-md;
    margin-top: $spacing-lg;
  }

  .description-title {
    font-size: $font-size-xl;
    margin-bottom: $spacing-sm;
  }

  .product-description {
    font-size: $font-size-sm;
    line-height: $line-height-relaxed;

    :deep(h1),
    :deep(h2),
    :deep(h3) {
      font-size: $font-size-lg;
      margin: $spacing-md 0 $spacing-sm 0;
    }

    :deep(p) {
      margin-bottom: $spacing-sm;
      font-size: $font-size-sm;
    }

    :deep(img) {
      max-width: 100%;
      height: auto;
      margin: $spacing-sm 0;
    }
  }

  .related-products {
    margin-top: $spacing-xl;
    padding: $spacing-md;
  }

  .related-title {
    font-size: $font-size-xl;
    margin-bottom: $spacing-sm;
  }

  .related-products-row {
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-md;
  }

  .related-product-card {
    .related-product-image {
      height: 120px;
    }

    .related-product-title {
      font-size: $font-size-xs;
      padding: $spacing-xs;
      line-height: $line-height-normal;
    }
  }

  /* 移动端对话框样式已移至全局样式文件 elegant-messages.scss */
}

/* 登录对话框样式 */
.login-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(5px);
}

.login-dialog-container {
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: auto;
  border-radius: 12px;
  background: white;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

/* 移动端登录对话框覆盖整个屏幕 */
@include mobile {
  .login-dialog-container {
    width: 100vw;
    height: 100vh;
    max-width: none;
    max-height: none;
    border-radius: 0;
    box-shadow: none;
  }
}

/* 立即购买弹窗样式 */
.buy-now-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(3px);
}

.buy-now-dialog {
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  background: $white;
  border-radius: $border-radius-lg;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.buy-now-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg;
  border-bottom: 1px solid $border-light;
  background: $gray-50;
}

.buy-now-title {
  margin: 0;
  font-size: $font-size-xl;
  font-weight: $font-weight-semibold;
  color: $text-primary;
}

.buy-now-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: $spacing-xs;
  border-radius: $border-radius-sm;
  color: $text-secondary;
  transition: all 0.2s ease;

  &:hover {
    background: $gray-200;
    color: $text-primary;
  }

  .el-icon {
    font-size: $font-size-lg;
  }
}

.buy-now-content {
  padding: $spacing-lg;
  flex: 1;
  overflow-y: auto;
}

.product-summary {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  background: $gray-50;
  border-radius: $border-radius-md;
  margin-bottom: $spacing-lg;
}

.product-image-small {
  width: 60px;
  height: 60px;
  border-radius: $border-radius-sm;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.product-info-small {
  flex: 1;
  min-width: 0;
}

.product-name-small {
  font-size: $font-size-md;
  font-weight: $font-weight-semibold;
  color: $text-primary;
  margin-bottom: $spacing-xs;
  line-height: $line-height-normal;
  word-wrap: break-word;
}

.product-code-small {
  font-size: $font-size-sm;
  color: $text-secondary;
  word-wrap: break-word;
}

.quantity-section {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
  border: 1px solid $border-light;
  border-radius: $border-radius-md;
  background: $white;
}

.quantity-label {
  font-size: $font-size-md;
  font-weight: $font-weight-medium;
  color: $text-primary;
  min-width: 60px;
}

/* 调整数量输入框宽度 */
.quantity-section :deep(.el-input-number) {
  width: 150px;
}

.quantity-section :deep(.el-input-number .el-input__inner) {
  text-align: center;
  font-size: $font-size-md;
  font-weight: $font-weight-medium;
}

.price-section {
  margin-bottom: $spacing-lg;
}

.price-breakdown {
  padding: $spacing-md;
  background: $gray-50;
  border-radius: $border-radius-md;
  border: 1px solid $border-light;
}

.unit-price,
.total-price {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-sm;

  &:last-child {
    margin-bottom: 0;
  }
}

.total-price {
  padding-top: $spacing-sm;
  border-top: 1px solid $border-light;
  margin-top: $spacing-sm;
}

.price-label {
  font-size: $font-size-md;
  color: $text-secondary;
  font-weight: $font-weight-medium;
}

.price-value {
  font-size: $font-size-md;
  font-weight: $font-weight-semibold;
  color: $primary-color;

  &.total {
    font-size: $font-size-lg;
    color: $success-color;
  }
}

.tier-price-hint {
  padding: $spacing-md;
  background: $info-light;
  border-radius: $border-radius-md;
  border: 1px solid $info-color;
  margin-bottom: $spacing-lg;
}

.tier-price-title {
  font-size: $font-size-md;
  font-weight: $font-weight-semibold;
  color: $text-primary;
  margin-bottom: $spacing-sm;
}

.tier-price-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.tier-price-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: $font-size-sm;
}

.tier-quantity {
  color: $text-secondary;
}

.tier-price {
  font-weight: $font-weight-semibold;
  color: $primary-color;
}

.buy-now-footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-md;
  padding: $spacing-lg;
  border-top: 1px solid $border-light;
  background: $gray-50;
}

.buy-now-btn {
  background: $success-color !important;
  border-color: $success-color !important;

  &:hover:not(:disabled) {
    background: darken($success-color, 10%) !important;
    border-color: darken($success-color, 10%) !important;
  }
}

/* 移动端立即购买弹窗样式 */
@include mobile {
  .buy-now-dialog {
    width: 100vw;
    height: 100vh;
    max-width: none;
    max-height: none;
    border-radius: 0;
    box-shadow: none;
  }

  .buy-now-content {
    padding: $spacing-md;
  }

  .product-summary {
    padding: $spacing-sm;
    margin-bottom: $spacing-md;
  }

  .quantity-section {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-sm;
    padding: $spacing-sm;
  }

  .quantity-label {
    min-width: auto;
  }

  .price-breakdown {
    padding: $spacing-sm;
  }

  .tier-price-hint {
    padding: $spacing-sm;
    margin-bottom: $spacing-md;
  }

  .buy-now-footer {
    padding: $spacing-md;
    flex-direction: column;
    gap: $spacing-sm;

    .el-button {
      width: 100%;
    }
  }
}

/* 一起购买组件样式 */
.buy-together-section {
  background: $white;
  border: 1px solid $border-light;
  border-radius: $border-radius-lg;
  padding: $spacing-xl;
  margin-bottom: $spacing-2xl;
  box-shadow: $shadow-sm;
}

.buy-together-title {
  font-size: $font-size-2xl;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin-bottom: $spacing-lg;
  text-align: left;
}

.buy-together-content {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.buy-together-products {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  flex-wrap: wrap;
}

.buy-together-item {
  flex: 0 0 auto;
  min-width: 100px;
  max-width: 120px;
}

.product-checkbox {
  border: none;
  border-radius: $border-radius-md;
  padding: $spacing-sm;
  background: transparent;
  transition: all 0.3s ease;
  text-align: center;

  &:hover {
    background: rgba($primary-color, 0.05);
  }
}

.product-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: $border-radius-sm;
  background: $gray-50;
  display: block;
  margin: 0 auto;
}

.plus-icon {
  font-size: $font-size-2xl;
  font-weight: $font-weight-bold;
  color: $text-secondary;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  flex-shrink: 0;
}

.buy-together-summary {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.selected-products-info {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;
}

.product-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-xs 0;
  background: transparent;
  border: none;

  .product-name {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $text-primary;
    flex: 1;
    margin-right: $spacing-md;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .product-price {
    font-size: $font-size-sm;
    font-weight: $font-weight-bold;
    color: $primary-color;
    flex-shrink: 0;
  }
}

.total-and-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md;
  background: $gray-50;
  border-radius: $border-radius-md;
  border: 1px solid $border-light;
}

.buy-together-summary .total-price {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.total-price {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.total-label {
  font-size: $font-size-lg;
  font-weight: $font-weight-medium;
  color: $text-secondary;
}

.total-amount {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $primary-color;
}

.action-buttons {
  display: flex;
  gap: $spacing-md;
  flex-wrap: wrap;
}

.add-all-btn {
  @include button-primary;
  @include button-lg;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  padding: $spacing-md $spacing-xl;
  flex: 1;
  min-width: 140px;

  &:hover:not(:disabled) {
    background-color: $primary-dark !important;
    border-color: $primary-dark !important;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.send-all-inquiry-btn {
  @include button-lg;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  padding: $spacing-md $spacing-xl;
  flex: 1;
  min-width: 140px;
  background-color: $success-color;
  border-color: $success-color;
  color: $white;

  &:hover:not(:disabled) {
    background-color: darken($success-color, 10%) !important;
    border-color: darken($success-color, 10%) !important;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.current-product .product-checkbox {
  background: rgba($primary-color, 0.1);
}

/* 移动端样式 */
@include mobile {
  .buy-together-section {
    padding: $spacing-md;
    margin-bottom: $spacing-lg;
    background: $white;
    border-radius: $border-radius-lg;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .buy-together-title {
    font-size: $font-size-lg;
    margin-bottom: $spacing-lg;
    text-align: center;
    color: $text-primary;
    font-weight: $font-weight-semibold;
  }

  .buy-together-products {
    flex-direction: column;
    gap: $spacing-md;
    align-items: center;
    margin-bottom: $spacing-lg;
  }

  .buy-together-item {
    width: 100%;
    max-width: 280px;
    display: flex;
    align-items: center;
    padding: $spacing-sm;
    border: 1px solid $border-light;
    border-radius: $border-radius-md;
    background: $gray-50;
  }

  .plus-icon {
    font-size: $font-size-xl;
    color: $primary-color;
    font-weight: $font-weight-bold;
    text-align: center;
    margin: $spacing-sm 0;
    transform: none; /* 移除旋转 */
  }

  .buy-together-summary {
    gap: $spacing-md;
  }

  .selected-products-info {
    margin-bottom: $spacing-lg;
  }

  .total-and-button {
    flex-direction: column;
    gap: $spacing-lg;
    text-align: center;
    padding: $spacing-lg;
    background: $gray-50;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
    gap: $spacing-md;
  }

  .add-all-btn,
  .send-all-inquiry-btn {
    width: 100%;
    min-width: unset;
    height: 48px;
    font-size: $font-size-md;
    font-weight: $font-weight-medium;
    border-radius: $border-radius-md;
    margin: 0 !important; /* 移除按钮边距 */
  }

  .product-image {
    width: 60px;
    height: 60px;
    border-radius: $border-radius-sm;
    object-fit: cover;
    margin-right: $spacing-md;
  }

  .product-info-item {
    padding: $spacing-sm 0;
    border-bottom: 1px solid $border-light;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &:last-child {
      border-bottom: none;
    }

    .product-name {
      font-size: $font-size-sm;
      color: $text-primary;
      font-weight: $font-weight-medium;
      flex: 1;
      margin-right: $spacing-md;
    }

    .product-price {
      font-size: $font-size-sm;
      color: $primary-color;
      font-weight: $font-weight-bold;
    }
  }

  .product-name {
    font-size: $font-size-md;
    color: $text-primary;
  }

  .product-price {
    font-size: $font-size-md;
    color: $primary-color;
    font-weight: $font-weight-bold;
  }

  /* 复选框样式优化 */
  :deep(.el-checkbox) {
    width: 100%;
    
    .el-checkbox__label {
      width: 100%;
      display: flex;
      align-items: center;
      padding-left: $spacing-md;
    }

    .el-checkbox__input {
      margin-right: $spacing-sm;
    }
  }
}

/* Element UI 复选框样式调整 */
:deep(.el-checkbox) {
  width: 100%;

  .el-checkbox__label {
    width: 100%;
    padding-left: $spacing-sm;
  }

  .el-checkbox__input {
    align-self: flex-start;
    margin-top: 2px;
  }
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: $primary-color;
  border-color: $primary-color;
}

:deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
  color: $text-primary;
}
</style>