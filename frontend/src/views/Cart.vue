<template>
  <div class="cart-page">
    <PageBanner :title="$t('cart.title') || '购物车'" />

    <!-- Navigation Menu -->
    <NavigationMenu :breadcrumb-items="breadcrumbItems" />

    <div class="container mx-auto px-4">
      <div class="cart-content" v-loading="loading">
        <div v-if="cartItems.length > 0" class="cart-items">
          <el-table :data="cartItems" style="width: 100%" @selection-change="handleSelectionChange" ref="cartTable">
            <el-table-column type="selection" width="55"></el-table-column>
            <el-table-column :label="$t('cart.product') || '商品'" width="400">
              <template #default="{row}">
                <div class="product-info">
                  <div class="product-image">
                    <img :src="row.image_url || require('@/assets/images/default-image.svg')" :alt="row.name"
                      @error="handleImageError">
                  </div>
                  <div class="product-details">
                    <router-link :to="`/product/${row.product_id}`" class="product-name">{{ row.name
                      }}</router-link>
                    <div class="product-code">{{ $t('cart.productCode') || '产品编号' }}: {{ row.product_code }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="$t('cart.unitPrice') || '单价'" width="160">
              <template #default="{row}">¥{{ formatPrice(row.price) }}</template>
            </el-table-column>
            <el-table-column :label="$t('cart.quantity') || '数量'" width="160">
              <template #default="{row}">
                <el-input-number v-model="row.quantity" :min="1" :max="row.stock" size="small"
                  @change="(value) => updateQuantity(row.id, value)"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column :label="$t('cart.subtotal') || '小计'" width="160">
              <template #default="{row}">¥{{ formatPrice(row.price * row.quantity) }}</template>
            </el-table-column>
            <el-table-column :label="$t('cart.actions') || '操作'">
              <template #default="{row}">
                <el-button type="danger" size="small" @click="removeItem(row.id)">{{ $t('cart.remove') || '删除'
                  }}</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="cart-summary">
            <div class="cart-total">
              <span>{{ $t('cart.total') || '总计' }}:</span>
              <span class="total-price">¥{{ formatPrice(totalPrice) }}</span>
            </div>
            <div class="cart-actions">
              <el-button @click="$router.push('/products')" class="continue-shopping-btn">{{ $t('cart.continueShopping')
                || '继续购物'
                }}</el-button>
              <el-button type="danger" @click="clearCart" class="clear-cart-btn">{{ $t('cart.clearCart') || '清空购物车'
                }}</el-button>
              <el-button type="primary" @click="checkout4" class="checkout-btn">{{ $t('cart.checkout') || '结算'
                }}</el-button>
            </div>
          </div>
        </div>

        <div v-else class="empty-cart">
          <el-empty :description="$t('cart.empty') || '您的购物车是空的'">
            <el-button type="primary" @click="$router.push('/products')" class="go-shopping-btn">{{
              $t('cart.goShopping') ||
              '去购物' }}</el-button>
          </el-empty>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { handleImageError } from '../utils/imageUtils';
import { formatPrice } from '../utils/format';
import PageBanner from '@/components/common/PageBanner.vue';
import NavigationMenu from '@/components/common/NavigationMenu.vue';

export default {
  name: 'CartPage',
  components: {
    PageBanner,
    NavigationMenu
  },
  data() {
    return {
      cartItems: [],
      selectedItems: [],
      loading: false,
      totalPrice: 0
    };
  },
  computed: {
    breadcrumbItems() {
      return [
        { text: this.$t('cart.title') || '购物车' }
      ];
    }
  },
  created() {
    this.fetchCart();
  },
  methods: {
    handleImageError,
    formatPrice,
    async fetchCart() {
      if (!this.$store.getters.isLoggedIn) {
        this.$router.push('/login?redirect=/cart');
        return;
      }

      this.loading = true;
      try {
        const response = await this.$api.get('/cart');
        if (response.success) {
          this.cartItems = response.data.items;
          this.totalPrice = response.data.totalPrice;
        }
      } catch (error) {
        console.error('获取购物车失败:', error);
        this.$messageHandler.showError(error, 'cart.error.fetchFailed');
      } finally {
        this.loading = false;
      }
    },
    async updateQuantity(cartItemId, quantity) {
      try {
        const response = await this.$api.put(`/cart/item/${cartItemId}`, { quantity });
        if (response.success) {
          this.$messageHandler.showSuccess('数量已更新', 'cart.success.quantityUpdated');
          // 触发购物车更新事件
          this.$bus.emit('cart-updated')
          // 更新总价
          this.calculateTotal();
        }
      } catch (error) {
        console.error('更新数量失败:', error);
        this.$messageHandler.showError(error, 'cart.error.updateFailed');
        // 刷新购物车
        this.fetchCart();
      }
    },
    async removeItem(cartItemId) {
      try {
        const response = await this.$api.delete(`/cart/item/${cartItemId}`);
        if (response.success) {
          this.$messageHandler.showSuccess('商品已从购物车中移除', 'cart.success.itemRemoved');
        // 触发购物车更新事件
        this.$bus.emit('cart-updated')
          // 从列表中移除
          this.cartItems = this.cartItems.filter(item => item.id !== cartItemId);
          // 更新总价
          this.calculateTotal();
        }
      } catch (error) {
        console.error('移除商品失败:', error);
        this.$messageHandler.showError(error, 'cart.error.removeFailed');
      }
    },
    async clearCart() {
      this.$confirm(
        this.$t('cart.clearConfirmMessage') || '确定要清空购物车吗？这将移除所有商品，此操作不可撤销。',
        this.$t('cart.clearConfirmTitle') || '清空购物车',
        {
          confirmButtonText: this.$t('cart.confirmClear') || '确定清空',
          cancelButtonText: this.$t('common.cancel') || '取消',
          type: 'warning',
          customClass: 'modern-confirm-dialog',
          dangerouslyUseHTMLString: false,
          showClose: true,
          closeOnClickModal: false,
          closeOnPressEscape: true,
          beforeClose: (action, instance, done) => {
            if (action === 'confirm') {
              instance.confirmButtonLoading = true;
              instance.confirmButtonText = this.$t('cart.clearing') || '清空中...';
              done();
            } else {
              done();
            }
          }
        }
      ).then(async () => {
        try {
          const response = await this.$api.delete('/cart/clear');
          if (response.success) {
            this.$messageHandler.showSuccess(this.$t('cart.clearSuccess') || '购物车已清空', 'cart.success.clearSuccess');
            this.cartItems = [];
            this.totalPrice = 0;
            // 触发购物车更新事件
            this.$bus.emit('cart-updated')
          }
        } catch (error) {
          console.error('清空购物车失败:', error);
          this.$messageHandler.showError(error.response?.data?.message || this.$t('cart.clearError') || '清空购物车失败', 'cart.error.clearFailed');
        }
      }).catch(() => {
        // 用户取消操作
      });
    },
    calculateTotal() {
      this.totalPrice = this.cartItems.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
    },
    checkout() {
      // 跳转到结算页面
      this.$router.push('/checkout');
    },
    checkout2() {
      // 跳转到结算页面
      this.$router.push('/Checkout3');
    },
    handleSelectionChange(val) {
      this.selectedItems = val;
    },
    checkout4() {
      if (!this.selectedItems.length) {
        this.$messageHandler.showWarning(this.$t('cart.selectItemsFirst') || '请先选择要结算的商品', 'cart.warning.selectItemsFirst');
        return;
      }
      // 将选中的商品数据存储到sessionStorage
      sessionStorage.setItem('selectedCartItems', JSON.stringify(this.selectedItems));
      this.$router.push({
        name: 'UnifiedCheckout'
      });
    }
  }
};
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';
@import '@/assets/styles/_mixins.scss';

.cart-page {
  min-height: 100vh;
  background-color: $gray-100;
}







.container {
  @include container;
}

.cart-content {
  @include card;
  border: 1px solid $gray-200;
}

.product-info {
  @include flex-start;
  gap: $spacing-md;
}

.product-image {
  width: $spacing-4xl;
  height: $spacing-4xl;
  border-radius: $border-radius-md;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid $gray-200;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-details {
  flex: 1;
}

/* 产品标题样式 - 参考ProductDetail.vue */
.product-name {
  font-size: $font-size-xl;
  font-weight: $font-weight-semibold;
  color: $text-primary;
  margin-bottom: $spacing-sm;
  line-height: $line-height-tight;
  letter-spacing: $letter-spacing-sm;
  text-decoration: none;
  display: block;
  transition: $transition-base;
}

.product-name:hover {
  color: $primary-color;
}

.product-code {
  font-size: $font-size-md;
  color: $text-secondary;
  font-weight: $font-weight-normal;
}

/* 价格样式 - 参考ProductDetail.vue */
.price {
  font-size: $font-size-xl;
  font-weight: $font-weight-semibold;
  color: $primary-color;
  letter-spacing: $letter-spacing-md;
}

.subtotal {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $primary-color;
  letter-spacing: 0.5px;
}

.cart-summary {
  margin-top: $spacing-2xl;
  padding-top: $spacing-xl;
  border-top: $table-header-border-width solid $gray-200;
  @include flex-between;
}

/* 购物车总计样式 - 参考Home.vue */
.cart-total {
  @include flex-between;
  padding: $spacing-lg;
  background: linear-gradient(135deg, $gray-50 0%, $white 100%);
  border-radius: $border-radius-lg;
  margin-bottom: $spacing-lg;
  border: 2px solid $primary-color;
  box-shadow: 0 4px 15px rgba($primary-color, 0.1);
  transition: $transition-slow;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  color: $text-primary;
}

.cart-total:hover {
  transform: translateY($hover-transform-md);
  box-shadow: 0 6px 20px rgba($primary-color, 0.15);
}

.total-price {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $primary-color;
  letter-spacing: $letter-spacing-xs;
  margin-left: $spacing-sm;
}

.cart-actions {
  @include flex-start;
  gap: $spacing-md;
}


/* 按钮样式优化 - 与Home.vue保持一致，使用:deep()覆盖el-button样式 */
:deep(.continue-shopping-btn) {
  @include button-base;
  background-color: $gray-200 !important;
  color: $gray-700 !important;
  padding: $spacing-md $spacing-xl !important;
  margin: 0 $spacing-xs;
  white-space: nowrap;
  font-size: $font-size-lg !important;
  font-weight: $font-weight-semibold !important;
  border: none !important;
  border-radius: $border-radius-md !important;
  transition: $transition-slow;
  height: auto !important;
  min-height: auto !important;

  &:hover:not(:disabled) {
    background-color: $gray-300 !important;
    border-color: transparent !important;
  }

  &:focus {
    background-color: $gray-200 !important;
    border-color: transparent !important;
  }
}

:deep(.clear-cart-btn) {
  @include button-base;
  background-color: $primary-color !important;
  color: $white !important;
  height: auto !important;
  min-height: auto !important;
  font-size: $font-size-lg !important;
  font-weight: $font-weight-semibold !important;
  padding: $spacing-md $spacing-xl !important;
  margin: 0 $spacing-xs;
  border: none !important;
  border-radius: $border-radius-md !important;
  transition: $transition-slow;

  &:hover:not(:disabled) {
    background-color: $primary-dark !important;
    border-color: transparent !important;
  }

  &:focus {
    background-color: $primary-color !important;
    border-color: transparent !important;
  }
}

:deep(.checkout-btn) {
  @include button-primary;
  height: auto !important;
  min-height: auto !important;
  padding: $spacing-md $spacing-xl !important;
  margin: 0 $spacing-xs;
  white-space: nowrap;
  font-size: $font-size-lg !important;
  font-weight: $font-weight-semibold !important;
  border: none !important;
  border-radius: $border-radius-md !important;
  background-color: $primary-color !important;
  color: $white !important;
  transition: $transition-slow;

  &:hover:not(:disabled) {
    background-color: $primary-dark !important;
    border-color: transparent !important;
  }

  &:focus {
    background-color: $primary-color !important;
    border-color: transparent !important;
  }
}

:deep(.go-shopping-btn) {
  @include button-primary;
  @include button-lg;
  height: auto !important;
  min-height: auto !important;
  margin-top: $spacing-lg;
  font-size: $font-size-lg !important;
  font-weight: $font-weight-semibold !important;
  background-color: $primary-color !important;
  color: $white !important;
  border: none !important;
  border-radius: $border-radius-md !important;
  padding: $spacing-md $spacing-lg !important;
  transition: $transition-slow;

  &:hover:not(:disabled) {
    background-color: $primary-dark !important;
    border-color: transparent !important;
  }

  &:focus {
    background-color: $primary-color !important;
    border-color: transparent !important;
  }
}

.go-shopping-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba($primary-color, 0.4);
  background: linear-gradient(135deg, $primary-dark 0%, $primary-darker 100%);
}

.empty-cart {
  text-align: center;
  padding: $spacing-4xl $spacing-xl;
}

/* Element UI 表格样式优化 */
:deep(.el-table) {
  border-radius: $border-radius-md;
  overflow: hidden;
  box-shadow: $shadow-sm;
}

:deep(.el-table th) {
  background-color: $gray-100;
  color: $text-primary;
  font-weight: $font-weight-semibold;
  border-bottom: $table-header-border-width solid $primary-color;
  font-size: $font-size-lg;
  padding: $spacing-lg $spacing-md;
}

:deep(.el-table td) {
  border-bottom: $table-border-width solid $gray-200;
  padding: $spacing-lg $spacing-md;
  font-size: $font-size-md;
}

:deep(.el-table tr:hover > td) {
  background-color: $gray-50;
}

:deep(.el-input-number) {
  width: $product-quantity-width;
}

:deep(.el-button--danger) {
  background-color: $error-color;
  border-color: $error-color;
  font-size: $font-size-md;
  padding: $spacing-md $spacing-lg;
  font-weight: $font-weight-medium;
}

:deep(.el-button--danger:hover) {
  background-color: $error-dark;
  border-color: $error-dark;
  transform: translateY($hover-transform-sm);
  box-shadow: 0 2px 8px rgba($error-color, 0.3);
}

/* 响应式设计 */
@include mobile {
  .container {
    padding: $spacing-xl $spacing-sm;
  }

  .cart-content {
    padding: $spacing-xl;
    border-radius: $border-radius-md;
  }

  .cart-summary {
    @include flex-column;
    gap: $spacing-xl;
    align-items: stretch;
  }

  .cart-actions {
    justify-content: center;
    flex-wrap: wrap;
  }

  .product-info {
    @include flex-column;
    text-align: center;
    gap: $spacing-sm;
  }

  .banner-content h1 {
    font-size: $font-size-2xl;
  }


  .cart-actions {
    @include flex-column;
    width: 100%;
  }

  .cart-actions .el-button {
    width: 100%;
  }
}

/* 现代风格确认对话框样式 */
:deep(.modern-confirm-dialog) {
  border-radius: $border-radius-xl;
  box-shadow: $shadow-xl;
  border: none;
  overflow: hidden;
}

:deep(.modern-confirm-dialog .el-message-box__header) {
  @include gradient-primary;
  color: $white;
  padding: $spacing-lg $spacing-lg $spacing-md;
  border-bottom: none;
}

:deep(.modern-confirm-dialog .el-message-box__title) {
  color: $white;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  margin: 0;
}

:deep(.modern-confirm-dialog .el-message-box__headerbtn) {
  top: $spacing-md;
  right: $spacing-md;
  color: rgba(255, 255, 255, 0.8);
  font-size: $font-size-lg;
}

:deep(.modern-confirm-dialog .el-message-box__headerbtn:hover) {
  color: $white;
}

:deep(.modern-confirm-dialog .el-message-box__content) {
  padding: $spacing-lg;
  background: $white;
}

:deep(.modern-confirm-dialog .el-message-box__message) {
  font-size: $font-size-md;
  color: $text-primary;
  line-height: $line-height-relaxed;
  margin: 0;
}

:deep(.modern-confirm-dialog .el-message-box__icon) {
  color: $warning-color;
  font-size: $font-size-2xl;
  margin-right: $spacing-md;
}

:deep(.modern-confirm-dialog .el-message-box__btns) {
  padding: $spacing-md $spacing-lg $spacing-lg;
  background: $gray-50;
  border-top: 1px solid $gray-200;
  text-align: right;
}

:deep(.modern-confirm-dialog .el-button) {
  border-radius: $border-radius-md;
  font-weight: $font-weight-medium;
  padding: $spacing-sm $spacing-md;
  margin-left: $spacing-sm;
  transition: $transition-base;
}

:deep(.modern-confirm-dialog .el-button--default) {
  background: $white;
  border-color: $gray-300;
  color: $text-primary;
}

:deep(.modern-confirm-dialog .el-button--default:hover) {
  background: $gray-100;
  border-color: $gray-400;
  color: $text-primary;
}

:deep(.modern-confirm-dialog .el-button--primary) {
  background: $primary-color;
  border-color: $primary-color;
  color: $white;
}

:deep(.modern-confirm-dialog .el-button--primary:hover) {
  background: $primary-dark;
  border-color: $primary-dark;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba($primary-color, 0.3);
}

:deep(.modern-confirm-dialog .el-button--primary.is-loading) {
  background: $primary-color;
  border-color: $primary-color;
  transform: none;
  box-shadow: none;
}

/* 现代风格消息提示样式 */
:deep(.modern-message) {
  border-radius: $border-radius-lg;
  box-shadow: $shadow-lg;
  border: none;
  padding: $spacing-md $spacing-md;
  min-width: $dialog-min-width;
}

:deep(.modern-message.el-message--success) {
  background: linear-gradient(135deg, $success-color 0%, darken($success-color, 10%) 100%);
  color: $white;
}

:deep(.modern-message.el-message--success .el-message__icon) {
  color: $white;
  font-size: $font-size-lg;
}

:deep(.modern-message.el-message--error) {
  background: linear-gradient(135deg, $error-color 0%, $primary-dark 100%);
  color: $white;
}

:deep(.modern-message.el-message--error .el-message__icon) {
  color: $white;
  font-size: $font-size-lg;
}

:deep(.modern-message .el-message__content) {
  color: inherit;
  font-weight: $font-weight-medium;
  font-size: $font-size-sm;
}

:deep(.modern-message .el-message__closeBtn) {
  color: rgba(255, 255, 255, 0.8);
  font-size: $font-size-md;
  top: 50%;
  transform: translateY(-50%);
}

:deep(.modern-message .el-message__closeBtn:hover) {
  color: $white;
}

/* 动画效果 */
:deep(.modern-confirm-dialog) {
  animation: modernDialogFadeIn $animation-duration-fast ease-out;
}

@keyframes modernDialogFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-$spacing-lg);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

:deep(.modern-message) {
  animation: modernMessageSlideIn $animation-duration-normal ease-out;
}

@keyframes modernMessageSlideIn {
  from {
    opacity: 0;
    transform: translateY(-$spacing-xl) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>