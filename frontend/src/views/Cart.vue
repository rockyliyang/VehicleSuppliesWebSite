<template>
  <div class="cart-page">
    <PageBanner :title="$t('cart.title') || '购物车'" />

    <!-- Navigation Menu -->
    <NavigationMenu :breadcrumb-items="breadcrumbItems" />

    <div class="cart-container">
      <!-- Shopping Cart Section -->
      <div class="cart-content" v-loading="loading">
        <div v-if="cartItems.length > 0" class="cart-items">
          <!-- Cart Table -->
          <div class="cart-table-wrapper">
            <table class="cart-table">
              <thead>
                <tr class="cart-table-header">
                  <th class="checkbox-column">
                    <input type="checkbox" class="cart-checkbox" @change="selectAll" v-model="allSelected">
                  </th>
                  <th class="product-column">{{ $t('cart.product') || '商品' }}</th>
                  <th class="price-column">{{ $t('cart.unitPrice') || '单价' }}</th>
                  <th class="quantity-column">{{ $t('cart.quantity') || '数量' }}</th>
                  <th class="subtotal-column">{{ $t('cart.subtotal') || '小计' }}</th>
                  <th class="actions-column">{{ $t('cart.actions') || '操作' }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in cartItems" :key="item.id" class="cart-table-row">
                  <td class="checkbox-cell">
                    <input type="checkbox" class="cart-checkbox" v-model="item.selected" @change="updateSelectedItems">
                  </td>
                  <td class="product-cell">
                    <div class="product-info">
                      <div class="product-image">
                        <img :src="item.image_url || require('@/assets/images/default-image.svg')" :alt="item.name"
                          @error="handleImageError">
                      </div>
                      <div class="product-details">
                        <router-link :to="`/product/${item.product_id}`" class="product-name">
                          {{ item.name }}
                        </router-link>
                        <div class="product-code">
                          {{ $t('cart.productCode') || '产品编号' }}: {{ item.product_code }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="price-cell">¥{{ formatPrice(item.price) }}</td>
                  <td class="quantity-cell">
                    <div class="quantity-controls">
                      <button class="quantity-btn" @click="decreaseQuantity(item)">-</button>
                      <input type="text" class="quantity-input" v-model="item.quantity"
                        @blur="updateQuantity(item.id, item.quantity)">
                      <button class="quantity-btn" @click="increaseQuantity(item)">+</button>
                    </div>
                  </td>
                  <td class="subtotal-cell">¥{{ formatPrice(item.price * item.quantity) }}</td>
                  <td class="actions-cell">
                    <div class="action-buttons">
                      <button class="remove-btn" @click="removeItem(item.id)">
                        {{ $t('cart.remove') || '删除' }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Cart Summary -->
          <div class="cart-summary">
            <div class="cart-total">
              <span>{{ $t('cart.total') || '总计' }}:</span>
              <span class="total-price">¥{{ formatPrice(selectedTotal) }}</span>
            </div>
            <div class="cart-actions">
              <button class="continue-shopping-btn" @click="$router.push('/products')">
                {{ $t('cart.continueShopping') || '继续购物' }}
              </button>
              <button class="clear-cart-btn" @click="clearCart">
                {{ $t('cart.clearCart') || '清空购物车' }}
              </button>
              <button class="inquiry-btn" @click="addSelectedToInquiry">
                {{ $t('cart.inquiry') || '询价' }}
              </button>
              <button class="checkout-btn" @click="checkout4">
                <i class="material-icons">payment</i>
                {{ $t('cart.checkout') || '结算' }}
              </button>
            </div>
          </div>
        </div>

        <div v-else class="empty-cart">
          <div class="empty-cart-content">
            <p class="empty-cart-message">{{ $t('cart.empty') || '您的购物车是空的' }}</p>
            <button class="go-shopping-btn" @click="$router.push('/products')">
              {{ $t('cart.goShopping') || '去购物' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Inquiries Section -->
      <InquiryPanel :cart-items="cartItems" :inquired-product-ids="inquiredProductIds"
        @update-inquired-products="updateInquiredProductIds" @inquiry-created="handleInquiryCreated"
        ref="inquiryPanel" />
    </div>
  </div>
</template>

<script>
import { handleImageError } from '../utils/imageUtils';
import { formatPrice } from '../utils/format';
import PageBanner from '@/components/common/PageBanner.vue';
import NavigationMenu from '@/components/common/NavigationMenu.vue';
import InquiryPanel from '@/components/common/InquiryPanel.vue';

export default {
  name: 'CartPage',
  components: {
    PageBanner,
    NavigationMenu,
    InquiryPanel
  },
  data() {
    return {
      cartItems: [],
      selectedItems: [],
      loading: false,
      totalPrice: 0,
      // Inquiry system data
      inquiredProductIds: new Set()
    };
  },
  computed: {
    breadcrumbItems() {
      return [
        { text: this.$t('cart.title') || '购物车' }
      ];
    },
    
    allSelected: {
      get() {
        return this.cartItems.length > 0 && this.cartItems.every(item => item.selected);
      },
      set(value) {
        this.cartItems.forEach(item => {
          item.selected = value;
        });
        this.updateSelectedItems();
      }
    },
    
    selectedTotal() {
      return this.selectedItems.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
    },
    
    activeInquiry() {
      return this.inquiries.find(inquiry => inquiry.id === this.activeInquiryId);
    },
    
    canAddNewInquiry() {
      return this.inquiries.length < this.maxInquiries;
    }
  },
  created() {
    this.fetchCart();
  },
  mounted() {
    this.fetchCart();
  },
  methods: {
    handleImageError,
    formatPrice,
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
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
          this.$bus.emit('cart-updated')
          this.calculateTotal();
        }
      } catch (error) {
        console.error('更新数量失败:', error);
        this.$messageHandler.showError(error, 'cart.error.updateFailed');
        this.fetchCart();
      }
    },
    async removeItem(cartItemId) {
      try {
        const response = await this.$api.delete(`/cart/item/${cartItemId}`);
        if (response.success) {
          this.$messageHandler.showSuccess('商品已从购物车中移除', 'cart.success.itemRemoved');
          this.$bus.emit('cart-updated')
          this.cartItems = this.cartItems.filter(item => item.id !== cartItemId);
          this.calculateTotal();
        }
      } catch (error) {
        console.error('移除商品失败:', error);
        this.$messageHandler.showError(error, 'cart.error.removeFailed');
      }
    },
    async clearCart() {
      try {
        await this.$messageHandler.confirm({
          message: this.$t('cart.clearConfirmMessage') || '确定要清空购物车吗？这将移除所有商品，此操作不可撤销。',
          translationKey: 'cart.confirm.clearCart'
        });
        try {
          const response = await this.$api.delete('/cart/clear');
          if (response.success) {
            this.$messageHandler.showSuccess(this.$t('cart.clearSuccess') || '购物车已清空', 'cart.success.clearSuccess');
            this.cartItems = [];
            this.totalPrice = 0;
            this.$bus.emit('cart-updated')
          }
        } catch (error) {
          console.error('清空购物车失败:', error);
          this.$messageHandler.showError(error.response?.data?.message || this.$t('cart.clearError') || '清空购物车失败', 'cart.error.clearFailed');
        }
      } catch {
        // 用户取消操作
      }
    },
    calculateTotal() {
      // 更新选中的商品列表
      this.updateSelectedItems();
    },
    checkout4() {
      if (!this.selectedItems.length) {
        this.$messageHandler.showWarning(this.$t('cart.selectItemsFirst') || '请先选择要结算的商品', 'cart.warning.selectItemsFirst');
        return;
      }
      sessionStorage.setItem('selectedCartItems', JSON.stringify(this.selectedItems));
      this.$router.push({
        name: 'UnifiedCheckout'
      });
    },
    
    // Selection methods
    selectAll() {
      this.cartItems.forEach(item => {
        item.selected = this.allSelected;
      });
      this.updateSelectedItems();
    },
    
    toggleItemSelection(item) {
      item.selected = !item.selected;
      this.updateSelectedItems();
    },
    
    updateSelectedItems() {
      this.selectedItems = this.cartItems.filter(item => item.selected);
    },
    
    decreaseQuantity(item) {
      if (item.quantity > 1) {
        item.quantity--;
        this.updateQuantity(item.id, item.quantity);
      }
    },
    
    increaseQuantity(item) {
      if (item.quantity < item.stock) {
        item.quantity++;
        this.updateQuantity(item.id, item.quantity);
      }
    },
    
    // Method to update inquired product IDs from InquiryPanel
    updateInquiredProductIds(inquiredIds) {
      this.inquiredProductIds = new Set(inquiredIds);
    },
    
    // Method to handle inquiry creation from InquiryPanel
    handleInquiryCreated() {
      // This method can be used to handle any cart-specific logic when an inquiry is created
      console.log('Inquiry created from cart page');
    },
    
    // Check if a product is already in inquiry
    isProductInInquiry(productId) {
      return this.inquiredProductIds.has(productId);
    },
    
    // Add product to inquiry
    addToInquiry(item) {
      if (this.isProductInInquiry(item.product_id)) {
        this.$messageHandler.showWarning(
          this.$t('cart.productAlreadyInInquiry') || '该商品已在询价单中',
          'CART.PRODUCT.ALREADY_IN_INQUIRY'
        );
        return;
      }
      
      // Delegate to InquiryPanel component
      if (this.$refs.inquiryPanel) {
        this.$refs.inquiryPanel.addToInquiry(item);
      }
    },
    
    // Add selected products to inquiry
    async addSelectedToInquiry() {
      if (!this.selectedItems.length) {
        this.$messageHandler.showWarning(
          this.$t('cart.selectItemsFirst') || '请先选择要询价的商品',
          'CART.SELECT_ITEMS_FIRST'
        );
        return;
      }
      
      // Delegate to InquiryPanel component to add multiple items
      // Let InquiryPanel handle the logic of checking current inquiry
      if (this.$refs.inquiryPanel) {
        await this.$refs.inquiryPanel.addMultipleToInquiry(this.selectedItems);
      }
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

.cart-container {
  @include container;
  margin: 0 auto;
  padding: 24px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;

  @include tablet {
    grid-template-columns: 2fr 1fr;
    gap: 32px;
  }
}

.cart-content {
  @include card;
  border: 1px solid $gray-200;
  padding: 24px;
}

// Cart table styles based on Cart-new.html
.cart-table-wrapper {
  overflow-x: auto;
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.cart-table {
  width: 100%;
  border-collapse: collapse;
  background: $white;
  border-radius: 8px;
  overflow: hidden;
}

.cart-table-header {
  background-color: $gray-100;

  th {
    padding: 16px 12px;
    font-weight: 600;
    color: $text-primary;
    font-size: 14px;
    text-align: left;
    border: none;

    &.checkbox-column {
      width: 50px;
    }

    &.product-column {
      width: 40%;
    }

    &.price-column,
    &.quantity-column,
    &.subtotal-column,
    &.actions-column {
      width: 15%;
    }

    &.actions-column {
      text-align: center;
    }
  }
}

.cart-table-row {
  border-bottom: 1px solid $gray-200;
  transition: background-color 0.15s ease-in-out;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: $gray-50;
  }

  td {
    padding: 16px 12px;
    vertical-align: middle;
    border: none;

    &.actions-cell {
      text-align: center;
    }
  }
}

// Checkbox styles
.cart-checkbox {
  width: 18px;
  height: 18px;
  accent-color: $primary-color;
  cursor: pointer;
}

.product-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.product-image {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid $gray-200;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.product-details {
  flex: 1;
}

.product-name {
  font-size: 14px;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 4px;
  line-height: 1.25;
  text-decoration: none;
  display: block;
  transition: color 0.15s ease-in-out;

  &:hover {
    color: $primary-color;
  }
}

.product-code {
  font-size: 12px;
  color: $text-secondary;
  font-weight: 400;
}

.price-cell,
.subtotal-cell {
  font-size: 16px;
  font-weight: 600;
  color: $primary-color;
}

// Quantity controls
.quantity-controls {
  display: flex;
  align-items: center;
  border: 1px solid $gray-300;
  border-radius: 6px;
  overflow: hidden;
  width: fit-content;
}

.quantity-btn {
  background: $gray-100;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
  transition: background-color 0.15s ease-in-out;

  &:hover {
    background: $gray-200;
  }

  &:active {
    background: $gray-300;
  }
}

.quantity-input {
  border: none;
  padding: 8px 12px;
  width: 60px;
  text-align: center;
  font-size: 14px;
  background: $white;

  &:focus {
    outline: none;
    background: $gray-50;
  }
}

// Action buttons
.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.remove-btn {
  background: #ef4444;
  color: $white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease-in-out;

  &:hover {
    background: #dc2626;
    transform: translateY(-1px);
  }
}

.inquire-btn {
  background: #3b82f6;
  color: $white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease-in-out;

  &:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-1px);
  }

  &:disabled,
  &.disabled {
    background: $gray-400;
    cursor: not-allowed;
    opacity: 0.5;

    &:hover {
      transform: none;
    }
  }
}

// Cart summary
.cart-summary {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid $gray-200;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.cart-total {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: linear-gradient(135deg, $gray-50 0%, $white 100%);
  border-radius: 8px;
  border: 2px solid $primary-color;
  box-shadow: 0 4px 15px rgba($primary-color, 0.1);
  font-size: 18px;
  font-weight: 600;
  color: $text-primary;
}

.total-price {
  font-size: 20px;
  font-weight: 700;
  color: $primary-color;
}

.cart-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.continue-shopping-btn,
.clear-cart-btn,
.inquiry-btn,
.checkout-btn {
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  border: none;
  white-space: nowrap;
}

.continue-shopping-btn {
  background: $gray-200;
  color: $gray-700;

  &:hover {
    background: $gray-300;
  }
}

.clear-cart-btn {
  background: $primary-color;
  color: $white;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

.inquiry-btn {
  background: #3b82f6;
  color: $white;

  &:hover {
    background: #2563eb;
  }
}

.checkout-btn {
  background: #10b981;
  color: $white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: #059669;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
  }

  &:disabled {
    background: $gray-300;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .material-icons {
    font-size: 18px;
  }
}

// Empty cart
.empty-cart {
  text-align: center;
  padding: 64px 24px;
}

.empty-cart-message {
  font-size: 18px;
  color: $text-secondary;
  margin-bottom: 24px;
}

.go-shopping-btn {
  background: $primary-color;
  color: $white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease-in-out;

  &:hover {
    background: darken($primary-color, 10%);
    transform: translateY(-2px);
  }
}


// 所有inquiry相关的CSS已移至InquiryPanel.vue组件中

// Responsive design
@include mobile {
  .cart-container {
    padding: 16px;
    grid-template-columns: 1fr;
  }

  .cart-content {
    padding: 16px;
  }

  .cart-summary {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .cart-actions {
    flex-direction: column;
    width: 100%;
  }

  .continue-shopping-btn,
  .clear-cart-btn,
  .checkout-btn {
    width: 100%;
  }

  .product-info {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }

  .inquiry-content {
    grid-template-columns: 1fr;
  }

  .inquiry-item {
    flex-direction: column;
    align-items: stretch;
  }

  .item-info {
    margin-bottom: 12px;
  }

  .item-controls {
    flex-direction: column;
    width: 100%;
    gap: 8px;
  }

  .control-group {
    width: 100%;
  }

  .item-actions {
    margin-top: 8px;
    justify-content: center;
  }
}
</style>