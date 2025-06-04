<template>
  <div class="cart-page">
    <div class="page-banner">
      <div class="banner-content">
        <h1 class="text-3xl font-bold mb-2">
          {{ $t('cart.title') || '购物车' }}
        </h1>
        <div class="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">{{ $t('nav.home') || '首页' }}</el-breadcrumb-item>
            <el-breadcrumb-item>{{ $t('cart.title') || '购物车' }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </div>
    </div>

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
            <el-table-column :label="$t('cart.unitPrice') || '单价'" width="120">
              <template #default="{row}">¥{{ formatPrice(row.price) }}</template>
            </el-table-column>
            <el-table-column :label="$t('cart.quantity') || '数量'" width="150">
              <template #default="{row}">
                <el-input-number v-model="row.quantity" :min="1" :max="row.stock" size="small"
                  @change="(value) => updateQuantity(row.id, value)"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column :label="$t('cart.subtotal') || '小计'" width="120">
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

export default {
  name: 'CartPage',
  data() {
    return {
      cartItems: [],
      selectedItems: [],
      loading: false,
      totalPrice: 0
    };
  },
  created() {
    this.fetchCart();
  },
  methods: {
    handleImageError,
    formatPrice,
    async fetchCart() {
      if (!localStorage.getItem('user_token')) {
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
        this.$errorHandler.showError(error, 'cart.error.fetchFailed');
      } finally {
        this.loading = false;
      }
    },
    async updateQuantity(cartItemId, quantity) {
      try {
        const response = await this.$api.put(`/cart/item/${cartItemId}`, { quantity });
        if (response.success) {
          this.$errorHandler.showSuccess('数量已更新', 'cart.success.quantityUpdated');
          // 更新总价
          this.calculateTotal();
        }
      } catch (error) {
        console.error('更新数量失败:', error);
        this.$errorHandler.showError(error, 'cart.error.updateFailed');
        // 刷新购物车
        this.fetchCart();
      }
    },
    async removeItem(cartItemId) {
      try {
        const response = await this.$api.delete(`/cart/item/${cartItemId}`);
        if (response.success) {
          this.$errorHandler.showSuccess('商品已从购物车中移除', 'cart.success.itemRemoved');
          // 从列表中移除
          this.cartItems = this.cartItems.filter(item => item.id !== cartItemId);
          // 更新总价
          this.calculateTotal();
        }
      } catch (error) {
        console.error('移除商品失败:', error);
        this.$errorHandler.showError(error, 'cart.error.removeFailed');
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
            this.$message({
              message: this.$t('cart.clearSuccess') || '购物车已清空',
              type: 'success',
              customClass: 'modern-message',
              duration: 3000,
              showClose: true
            });
            this.cartItems = [];
            this.totalPrice = 0;
          }
        } catch (error) {
          console.error('清空购物车失败:', error);
          this.$message({
            message: error.response?.data?.message || this.$t('cart.clearError') || '清空购物车失败',
            type: 'error',
            customClass: 'modern-message',
            duration: 4000,
            showClose: true
          });
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
        this.$message({
          message: this.$t('cart.selectItemsFirst') || '请先选择要结算的商品',
          type: 'warning',
          customClass: 'modern-message',
          duration: 3000,
          showClose: true
        });
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

<style scoped>
.cart-page {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.page-banner {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  color: white;
  padding: 80px 0;
  text-align: center;
}

.banner-content {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.banner-content h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  font-weight: 700;
  color: white;
}

.breadcrumb {
  margin-top: 1.5rem;
}

.breadcrumb :deep(.el-breadcrumb__inner) {
  color: rgba(255, 255, 255, 0.8);
}

.breadcrumb :deep(.el-breadcrumb__inner:hover) {
  color: white;
}

.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1rem;
}

.cart-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid #e5e7eb;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-details {
  flex: 1;
}

.product-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  text-decoration: none;
  display: block;
  margin-bottom: 0.5rem;
  transition: color 0.3s ease;
}

.product-name:hover {
  color: #dc2626;
}

.product-code {
  font-size: 0.875rem;
  color: #6b7280;
}

.price,
.subtotal {
  font-size: 1rem;
  font-weight: 600;
  color: #dc2626;
}

.cart-summary {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart-total {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.total-price {
  color: #dc2626;
  font-size: 1.75rem;
  font-weight: 700;
  margin-left: 0.75rem;
}

.cart-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.continue-shopping-btn {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #374151;
  font-weight: 500;
  transition: all 0.3s ease;
}

.continue-shopping-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
  color: #1f2937;
}

.clear-cart-btn {
  font-weight: 500;
  transition: all 0.3s ease;
}

.checkout-btn {
  background: #dc2626;
  border-color: #dc2626;
  font-weight: 600;
  padding: 0.75rem 2rem;
  transition: all 0.3s ease;
}

.checkout-btn:hover {
  background: #b91c1c;
  border-color: #b91c1c;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

.go-shopping-btn {
  background: #dc2626;
  border-color: #dc2626;
  font-weight: 600;
  padding: 0.75rem 2rem;
  transition: all 0.3s ease;
}

.go-shopping-btn:hover {
  background: #b91c1c;
  border-color: #b91c1c;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

.empty-cart {
  text-align: center;
  padding: 4rem 1.5rem;
}

/* Element UI 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

:deep(.el-table th) {
  background: #f9fafb;
  color: #374151;
  font-weight: 600;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.el-table td) {
  border-bottom: 1px solid #f3f4f6;
}

:deep(.el-table tr:hover > td) {
  background: #f9fafb;
}

:deep(.el-input-number) {
  width: 120px;
}

:deep(.el-button--danger) {
  background: #ef4444;
  border-color: #ef4444;
  transition: all 0.3s ease;
}

:deep(.el-button--danger:hover) {
  background: #dc2626;
  border-color: #dc2626;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 1.5rem 0.5rem;
  }

  .cart-content {
    padding: 1.5rem;
    border-radius: 8px;
  }

  .cart-summary {
    flex-direction: column;
    gap: 1.5rem;
    align-items: stretch;
  }

  .cart-actions {
    justify-content: center;
    flex-wrap: wrap;
  }

  .product-info {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }

  .banner-content h1 {
    font-size: 2rem;
  }

  .page-banner {
    padding: 3rem 0;
  }
}

@media (max-width: 480px) {
  .cart-actions {
    flex-direction: column;
    width: 100%;
  }

  .cart-actions .el-button {
    width: 100%;
  }
}

/* Tailwind CSS 兼容性 */
.text-3xl {
  font-size: 1.875rem;
  line-height: 2.25rem;
}

.font-bold {
  font-weight: 700;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.w-24 {
  width: 6rem;
}

.h-1 {
  height: 0.25rem;
}

.bg-red-600 {
  background-color: #dc2626;
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}

.mb-6 {
  margin-bottom: 1.5rem;
}

.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}

/* 现代风格确认对话框样式 */
:deep(.modern-confirm-dialog) {
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  border: none;
  overflow: hidden;
}

:deep(.modern-confirm-dialog .el-message-box__header) {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  color: white;
  padding: 24px 24px 20px;
  border-bottom: none;
}

:deep(.modern-confirm-dialog .el-message-box__title) {
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

:deep(.modern-confirm-dialog .el-message-box__headerbtn) {
  top: 20px;
  right: 20px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 18px;
}

:deep(.modern-confirm-dialog .el-message-box__headerbtn:hover) {
  color: white;
}

:deep(.modern-confirm-dialog .el-message-box__content) {
  padding: 24px;
  background: white;
}

:deep(.modern-confirm-dialog .el-message-box__message) {
  font-size: 1rem;
  color: #374151;
  line-height: 1.6;
  margin: 0;
}

:deep(.modern-confirm-dialog .el-message-box__icon) {
  color: #f59e0b;
  font-size: 24px;
  margin-right: 16px;
}

:deep(.modern-confirm-dialog .el-message-box__btns) {
  padding: 20px 24px 24px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  text-align: right;
}

:deep(.modern-confirm-dialog .el-button) {
  border-radius: 8px;
  font-weight: 500;
  padding: 10px 20px;
  margin-left: 12px;
  transition: all 0.3s ease;
}

:deep(.modern-confirm-dialog .el-button--default) {
  background: white;
  border-color: #d1d5db;
  color: #374151;
}

:deep(.modern-confirm-dialog .el-button--default:hover) {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #1f2937;
}

:deep(.modern-confirm-dialog .el-button--primary) {
  background: #dc2626;
  border-color: #dc2626;
  color: white;
}

:deep(.modern-confirm-dialog .el-button--primary:hover) {
  background: #b91c1c;
  border-color: #b91c1c;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

:deep(.modern-confirm-dialog .el-button--primary.is-loading) {
  background: #dc2626;
  border-color: #dc2626;
  transform: none;
  box-shadow: none;
}

/* 现代风格消息提示样式 */
:deep(.modern-message) {
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border: none;
  padding: 16px 20px;
  min-width: 300px;
}

:deep(.modern-message.el-message--success) {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

:deep(.modern-message.el-message--success .el-message__icon) {
  color: white;
  font-size: 18px;
}

:deep(.modern-message.el-message--error) {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

:deep(.modern-message.el-message--error .el-message__icon) {
  color: white;
  font-size: 18px;
}

:deep(.modern-message .el-message__content) {
  color: inherit;
  font-weight: 500;
  font-size: 0.95rem;
}

:deep(.modern-message .el-message__closeBtn) {
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  top: 50%;
  transform: translateY(-50%);
}

:deep(.modern-message .el-message__closeBtn:hover) {
  color: white;
}

/* 动画效果 */
:deep(.modern-confirm-dialog) {
  animation: modernDialogFadeIn 0.3s ease-out;
}

@keyframes modernDialogFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

:deep(.modern-message) {
  animation: modernMessageSlideIn 0.4s ease-out;
}

@keyframes modernMessageSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>