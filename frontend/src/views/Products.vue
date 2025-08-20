<template>
  <div class="products-page">
    <!-- Modern Banner Section -->
    <PageBanner :title="$t('products.title') || '产品中心'" />
    <NavigationMenu :breadcrumb-items="breadcrumbItems" />
    <!-- Category Navigation & Products Container -->
    <div class="container mx-auto px-4">
      <!-- Category Navigation -->
      <div class="category-navigation-section">
        <div class="flex justify-center category-tabs">
          <button :class="selectedCategory === null ? 'category-tab active' : 'category-tab'"
            @click="selectCategory(null)">
            {{ $t('products.allCategories') || '全部产品' }}
          </button>
          <button v-for="category in categories" :key="category.id"
            :class="selectedCategory === category.id.toString() ? 'category-tab active' : 'category-tab'"
            @click="selectCategory(category.id.toString())">
            {{ category.name }}
          </button>
        </div>
      </div>

      <!-- Products Content -->
      <div class="products-section">
        <!-- Modern Products Grid -->
        <div class="products-grid">
          <ProductCard v-for="product in products" :key="product.id" :product="product" :show-description="true"
            :show-arrow="true" :show-quantity-input="true" :show-action-buttons="true"
            :default-description="product.short_description || ''" card-style="products"
            @card-click="handleProductClick" @title-click="handleProductClick" @chat-now="handleChatNowEvent"
            @add-to-cart="handleAddToCartEvent" />
        </div>

        <!-- No Products Message -->
        <div v-if="products.length === 0" class="no-products">
          <i class="fas fa-search text-6xl text-gray-400 mb-4"></i>
          <p class="text-xl text-gray-500">{{ $t('products.noProducts') || '暂无相关产品' }}</p>
        </div>

        <!-- Modern Pagination -->
        <div class="pagination-container" v-if="totalProducts > pageSize">
          <el-pagination background layout="total, prev, pager, next, jumper" :total="totalProducts"
            :page-size="pageSize" :current-page="currentPage" @current-change="handlePageChange"
            class="modern-pagination">
          </el-pagination>
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
          <InquiryDetailPanel :inquiry="currentInquiry" :is-mobile="isMobile"
            @update-message="handleUpdateInquiryMessage" @checkout-inquiry="handleInquiryCheckout"
            @new-messages-received="handleNewMessages" />
        </div>
      </div>
    </div>

    <!-- 登录对话框 -->
    <div v-if="loginDialogVisible" class="login-dialog-overlay">
      <div class="login-dialog-container">
        <LoginDialog :show-close-button="true" @login-success="handleLoginSuccessEvent"
          @close="loginDialogVisible = false" />
      </div>
    </div>
  </div>
</template>

<script>
import { handleImageError } from '../utils/imageUtils';
import { handleChatNow, handleAddToCart, handleLoginSuccess, loadInquiryMessages } from '../utils/productUtils';
import ProductCard from '../components/common/ProductCard.vue';
import PageBanner from '../components/common/PageBanner.vue';
import NavigationMenu from '@/components/common/NavigationMenu.vue';
import InquiryDetailPanel from '../components/common/InquiryDetailPanel.vue';
import LoginDialog from '../components/common/LoginDialog.vue';
import { FullScreen, Close } from '@element-plus/icons-vue';

export default {
  name: 'ProductsPage',
  components: {
    ProductCard,
    PageBanner,
    NavigationMenu,
    InquiryDetailPanel,
    LoginDialog,
    FullScreen,
    Close
  },
  data() {
    return {
      products: [],
      categories: [],
      selectedCategory: null,
      currentPage: 1,
      loading: false,
      totalProducts: 0,
      pageSize: 10,
      // 询价相关状态
      showInquiryDialog: false,
      currentInquiryId: null,
      inquiryMessages: [],
      inquiryStatus: 'active',
      initialInquiryMessage: '',
      // 登录相关状态
      loginDialogVisible: false,
      pendingAction: null,
      pendingProduct: null,
      pendingQuantity: 1
    }
  },
  computed: {
    breadcrumbItems() {
      return [
        { text: this.$t('products.title') || '产品中心' }
      ];
    },
    isMobile() {
      return window.innerWidth <= 768;
    },
    // 构建当前询价对象，供InquiryDetailPanel使用
    currentInquiry() {
      if (!this.currentInquiryId || !this.pendingProduct) return null;
      
      return {
        id: this.currentInquiryId,
        status: this.inquiryStatus,
        inquiry_type: 'single', // 产品页面的询价通常是单个产品
        messages: this.inquiryMessages,
        items: [{
          id: 1,
          productId: this.pendingProduct.id,
          product_id: this.pendingProduct.id,
          name: this.pendingProduct.name,
          product_name: this.pendingProduct.name,
          imageUrl: this.pendingProduct.thumbnail_url,
          image_url: this.pendingProduct.thumbnail_url,
          quantity: this.pendingQuantity,
          unit_price: this.pendingProduct.price,
          product_code: this.pendingProduct.product_code
        }]
      };
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
    handleImageError,
    handleProductClick(product) {
      // 产品点击事件处理，可以在这里添加额外的逻辑
      console.log('Product clicked:', product);
    },
    async fetchCategories() {
      try {
        this.loading = true
        const response = await this.$api.get('categories')
        this.categories = response.data || []
      } catch (error) {
        console.error('获取分类失败:', error)
        this.$messageHandler.showError(error, 'category.error.fetchFailed')
      } finally {
        this.loading = false
      }
    },
    async fetchProducts() {
      this.loading = true
      try {
        const params = {
          page: this.currentPage,
          limit: this.pageSize,
          sort_by: 'sort_order',
          sort_order: 'desc'
        }
        
        // 添加分类筛选
        if (this.selectedCategory) {
          params.category_id = this.selectedCategory
        }
        
        const response = await this.$api.get('products', { params })
        this.products = response.data?.items || []
        this.totalProducts = response.data?.total || 0
        //this.$messageHandler.showSuccess(response.message || '获取产品成功', 'product.success.fetchSuccess')
      } catch (error) {
        console.error('获取产品失败:', error)
        this.$messageHandler.showError(error, 'products.error.fetchFailed')
      } finally {
        this.loading = false
      }
    },
    selectCategory(categoryId) {
      this.selectedCategory = categoryId
      this.currentPage = 1
      
      // 更新URL参数
      if (categoryId === null) {
        this.$router.push({ query: {} })
      } else {
        this.$router.push({ query: { category: categoryId } })
      }
      
      // 重新获取产品数据
      this.fetchProducts()
    },
    async addToInquiry(product) {
      // 使用公共的handleAddToCart工具函数
      await handleAddToCart(
        product, 
        this, 
        this.showLoginDialog, 
        () => {
          // 设置加载状态的回调
        }
      );
    },
    
    // 处理分页变化
    handlePageChange(page) {
      this.currentPage = page
      this.fetchProducts()
      // 滚动到页面顶部
      window.scrollTo(0, 0)
    },

    // 处理 Chat Now 事件
    async handleChatNowEvent(data) {
      const { product } = data;
      
      const success = await handleChatNow(
        product, 
        this, 
        this.showLoginDialog, 
        this.showInquiryDialogWithData
      );
      
      if (!success) {
        // 如果失败，可能是需要登录
        this.pendingProduct = product;
        this.pendingQuantity = 1;
      }
    },

    // 处理 Add to Cart 事件
    async handleAddToCartEvent(data) {
      const { product } = data;
      
      const success = await handleAddToCart(
        product, 
        this, 
        this.showLoginDialog, 
        () => {
          // 这里可以设置产品卡片的加载状态，但由于ProductCard已经简化，暂时不处理
        }
      );
      
      if (!success) {
        // 如果失败，可能是需要登录
        this.pendingProduct = product;
        this.pendingQuantity = 1;
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
      this.pendingProduct = data.product; // 设置产品信息
      this.initialInquiryMessage = '';
      this.showInquiryDialog = true;
      
      // 如果是新询价单，加载消息
      if (!data.isNew) {
        this.loadInquiryMessagesData();
      }
    },

    // 加载询价消息
    async loadInquiryMessagesData() {
      if (!this.currentInquiryId) return;
      
      const result = await loadInquiryMessages(this.currentInquiryId, this);
      this.inquiryMessages = result.messages;
      this.inquiryStatus = result.status;
    },

    // 处理登录成功事件
    async handleLoginSuccessEvent() {
      this.loginDialogVisible = false;
      
      if (this.pendingAction && this.pendingProduct) {
        await handleLoginSuccess(
          this.pendingAction,
          this.pendingProduct,
          this,
          this.showInquiryDialogWithData,
          () => {
            // 设置加载状态的回调
          }
        );
      }
      
      // 清除待执行的操作
      this.pendingAction = null;
      this.pendingProduct = null;
      this.pendingQuantity = 1;
    },

    // 关闭询价对话框
    closeInquiryDialog() {
      this.showInquiryDialog = false;
      this.currentInquiryId = null;
      this.inquiryMessages = [];
    },

    // 展开询价对话框
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

    // 处理更新询价消息
    handleUpdateInquiryMessage(message) {
      console.log('更新询价消息:', message);
    },

    // 处理询价结算
    handleInquiryCheckout() {
      console.log('询价结算');
    },

    // 处理新消息
    handleNewMessages(messages) {
      this.inquiryMessages = messages;
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';
@import '@/assets/styles/_mixins.scss';

/* 确保字体与全局保持一致 */
* {
  font-family: $font-family-base;
}

/* Element UI 组件样式穿透 */
:deep(.el-breadcrumb__inner a) {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
}

:deep(.el-breadcrumb__inner a:hover) {
  color: #ffffff;
}

:deep(.el-breadcrumb__separator) {
  color: rgba(255, 255, 255, 0.6);
}

:deep(.el-pagination) {
  --el-color-primary: #{$primary-color};
  font-size: $font-size-md;
  font-weight: $font-weight-medium;
}

:deep(.el-pagination .btn-next),
:deep(.el-pagination .btn-prev) {
  color: $primary-color;
  font-size: $font-size-md;
}

:deep(.el-pagination .el-pager li) {
  font-size: $font-size-md;
  font-weight: $font-weight-medium;
}

:deep(.el-pagination .el-pager li:hover) {
  color: $primary-color;
}

:deep(.el-pagination .el-pager li.is-active) {
  color: $primary-color;
  background-color: rgba(220, 38, 38, 0.1);
  font-weight: $font-weight-semibold;
}

:deep(.el-pagination .el-pagination__total) {
  font-size: $font-size-md;
  color: $text-secondary;
}

:deep(.el-pagination .el-pagination__jump) {
  font-size: $font-size-md;
  color: $text-secondary;
}

.promo-message {
  font-size: $font-size-xs;
  color: $error-color;
  background-color: rgba($error-color, 0.1);
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  margin-left: $spacing-sm;
}

/* Modern Tech Style for Products Page */
.products-page {
  min-height: 100vh;
  background-color: $white;
}

/* 确保PageBanner的遮罩效果正常显示 */
:deep(.page-banner::before) {
  background: rgba(0, 0, 0, 0.2) !important;
}



/* Container */
.container {
  @include container;
}

/* Products Container */
.products-container {
  margin-bottom: $spacing-xl;
}

/* Category Navigation Section */
.category-navigation-section {
  background: $white;
  padding: $spacing-lg 0 $spacing-md 0;
}

.category-tabs {
  display: flex;
  gap: $spacing-lg;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.category-tabs::-webkit-scrollbar {
  display: none;
}

.category-tab {
  padding: $spacing-sm $spacing-lg;
  border-radius: $border-radius-sm;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  color: $text-secondary;
  position: relative;
  transition: $transition-base;
  background: $white !important;
  background-color: $white !important;
}

.category-tab:hover {
  color: $primary-color;
}

.category-tab.active {
  color: $primary-color;
  font-weight: $font-weight-semibold;
}

.category-tab.active::after {
  content: "";
  position: absolute;
  bottom: -3px;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: $primary-color;
  border-radius: $border-radius-sm;
}

/* Products Section */
.products-section {
  padding: $spacing-md 0 $spacing-4xl 0;
}

/* Modern Products Grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
}

/* Products页面特定的产品卡片样式覆盖 */
.products-style {
  /* 这些样式会应用到ProductCard组件上 */
}

/* No Products */
.no-products {
  text-align: center;
  padding: $spacing-4xl 0;
  color: $text-muted;
}

/* Modern Pagination */
.pagination-container {
  @include flex-center;
  margin-top: $spacing-xl;
  padding-top: $spacing-xl;
  border-top: 2px solid $gray-100;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

@media (min-width: 1200px) {
  .product-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

.modern-pagination {
  --el-color-primary: #{$primary-color};
}

/* Responsive Design */
@include desktop {
  .products-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: $spacing-lg;
  }
}

@include tablet {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: $spacing-lg;
  }

  .category-navigation {
    padding: $spacing-lg;
  }

  .category-navigation .flex {
    gap: $spacing-lg;
  }

  .category-navigation button {
    padding: $spacing-sm $spacing-lg;
    font-size: $font-size-sm;
  }

  .products-header {
    @include flex-column;
    align-items: flex-start;
    gap: $spacing-lg;
  }
}

@include mobile {
  .banner-content h1 {
    font-size: $font-size-3xl;
  }

  .products-header {
    @include flex-column;
    gap: $spacing-lg;
    align-items: stretch;
  }

  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-sm;
    margin-bottom: $spacing-xl;
  }

  .product-footer {
    @include flex-column;
    gap: $spacing-sm;
  }

  .add-to-cart-btn {
    width: 100%;
    justify-content: center;
  }

  /* 移动端分类导航容器优化 */
  .category-navigation-section {
    padding: $spacing-md 0 $spacing-sm 0 !important;
  }

  /* 移动端分类标签样式优化 */
  .category-tabs {
    flex-wrap: nowrap !important;
    overflow-x: auto !important;
    overflow-y: visible !important;
    justify-content: flex-start !important;
    padding: 0 $spacing-md $spacing-sm $spacing-md !important;
    gap: $spacing-md !important;
    min-height: 50px !important;
  }

  .category-tab {
    white-space: nowrap !important;
    flex-shrink: 0 !important;
    padding: $spacing-sm $spacing-md !important;
    font-size: $font-size-lg !important;
    min-width: auto !important;
    position: relative !important;
    margin-bottom: $spacing-sm !important;
  }

  .category-tab.active::after {
    content: "" !important;
    position: absolute !important;
    bottom: -8px !important;
    left: 0 !important;
    width: 100% !important;
    height: 3px !important;
    background-color: $primary-color !important;
    border-radius: $border-radius-sm !important;
    display: block !important;
    z-index: 10 !important;
  }

  /* 移动端产品区域间距调整 */
  .products-section {
    padding: $spacing-sm 0 $spacing-4xl 0 !important;
  }
}

/* Utility Classes */
.mx-auto {
  margin-left: auto;
  margin-right: auto;
}

.px-4 {
  padding-left: $spacing-lg;
  padding-right: $spacing-lg;
}

.py-8 {
  padding-top: $spacing-xl;
  padding-bottom: $spacing-xl;
}

.text-red-600 {
  color: $primary-color;
}

.font-bold {
  font-weight: $font-weight-bold;
}

.w-full {
  width: 100%;
}

.h-full {
  height: 100%;
}

.object-cover {
  object-fit: cover;
}

.object-center {
  object-position: center;
}

.mr-2 {
  margin-right: $spacing-sm;
}

/* 询价浮动窗口样式 */
.inquiry-floating-window {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 580px;
  height: 600px;
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
    height: 500px;

    &.show {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }

  .inquiry-window-header {
    padding: $spacing-md;

    .header-title {
      font-size: $font-size-lg;
    }
  }
}

/* 登录对话框样式 */
.login-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.login-dialog-container {
  background: $white;
  border-radius: $border-radius-lg;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

/* 移动端登录对话框适配 */
@media (max-width: 768px) {
  .login-dialog-container {
    max-width: 95%;
    width: 95%;
    margin: $spacing-md;
  }
}
</style>
