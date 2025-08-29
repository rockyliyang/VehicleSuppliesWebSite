<template>
  <div class="cart-page">
    <PageBanner :title="$t('cart.title') || '购物车'" />

    <!-- Navigation Menu -->
    <NavigationMenu :breadcrumb-items="breadcrumbItems" />

    <div class="cart-container">
      <!-- Shopping Cart Section -->
      <div class="cart-content" v-loading="loading">
        <div v-if="cartItems.length > 0" class="cart-items">
          <!-- Desktop Table View -->
          <div class="cart-table-wrapper desktop-only">
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
                          {{ item.product_name }}
                        </router-link>
                        <div class="product-code">
                          {{ $t('cart.productType') || '产品类型' }}: {{ item.category_name }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="price-cell">{{ $store.getters.formatPrice(item.calculatedPrice || item.price) }}</td>
                  <td class="quantity-cell">
                    <div class="quantity-controls">
                      <button class="quantity-btn" @click="decreaseQuantity(item)">-</button>
                      <input type="text" class="quantity-input" v-model="item.quantity"
                        @blur="updateQuantity(item.id, item.quantity)">
                      <button class="quantity-btn" @click="increaseQuantity(item)">+</button>
                    </div>
                  </td>
                  <td class="subtotal-cell">{{ $store.getters.formatPrice((item.calculatedPrice || item.price) *
                    item.quantity) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile Card View -->
          <div class="cart-cards mobile-only">
            <div class="select-all-mobile">
              <input type="checkbox" class="cart-checkbox" @change="selectAll" v-model="allSelected">
              <span>{{ $t('cart.selectAll') || '全选' }}</span>
            </div>
            <div v-for="item in cartItems" :key="item.id" class="cart-card">
              <div class="card-header">
                <input type="checkbox" class="cart-checkbox" v-model="item.selected" @change="updateSelectedItems">
                <div class="product-info-mobile">
                  <div class="product-image-mobile">
                    <img :src="item.image_url || require('@/assets/images/default-image.svg')" :alt="item.product_name"
                      @error="handleImageError">
                  </div>
                  <div class="product-details-mobile">
                    <router-link :to="`/product/${item.product_id}`" class="product-name-mobile">
                      {{ item.product_name }}
                    </router-link>
                    <div class="product-code-mobile">
                      {{ $t('cart.productType') || '产品类型' }}: {{ item.category_name }}
                    </div>
                  </div>
                </div>
              </div>
              <div class="card-body">
                <div class="price-info">
                  <span class="price-label">{{ $t('cart.unitPrice') || '单价' }}:</span>
                  <span class="price-value">{{ $store.getters.formatPrice(item.calculatedPrice || item.price) }}</span>
                </div>
                <div class="quantity-section">
                  <span class="quantity-label">{{ $t('cart.quantity') || '数量' }}:</span>
                  <div class="quantity-controls">
                    <button class="quantity-btn" @click="decreaseQuantity(item)">-</button>
                    <input type="text" class="quantity-input" v-model="item.quantity"
                      @blur="updateQuantity(item.id, item.quantity)">
                    <button class="quantity-btn" @click="increaseQuantity(item)">+</button>
                  </div>
                </div>
                <div class="subtotal-info">
                  <span class="subtotal-label">{{ $t('cart.subtotal') || '小计' }}:</span>
                  <span class="subtotal-value">{{ $store.getters.formatPrice((item.calculatedPrice || item.price) *
                    item.quantity) }}</span>
                </div>
              </div>
              <!-- 移除手机端单个商品的删除按钮 -->
              <div class="card-footer" style="display: none;">
              </div>
            </div>
          </div>

          <!-- Cart Summary -->
          <div class="cart-summary">
            <div class="cart-total">
              <span>{{ $t('cart.total') || '总计' }}:</span>
              <span class="total-price">{{ $store.getters.formatPrice(selectedTotal) }}</span>
            </div>

            <div class="cart-actions">
              <button class="checkout-btn" @click="handleCheckout">
                <i class="material-icons">payment</i>
                {{ $t('cart.checkout') || '结算' }}
              </button>
              <button class="inquiry-btn" @click="addSelectedToInquiry">
                {{ $t('cart.inquiry') || '询价' }}
              </button>
              <button class="remove-selected-btn" @click="removeSelectedItems">
                {{ $t('cart.removeSelected') || '删除选中商品' }}
              </button>
              <button class="continue-shopping-btn" @click="$router.push('/products')">
                {{ $t('cart.continueShopping') || '继续购物' }}
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

      <!-- Inquiries Section - 仅在桌面端显示 -->
      <div class="desktop-only">
        <InquiryPanel :cart-items="cartItems" :inquired-product-ids="inquiredProductIds"
          @update-inquired-products="updateInquiredProductIds" @inquiry-created="handleInquiryCreated"
          ref="inquiryPanel" />
      </div>
    </div>
  </div>
</template>

<script>
import { handleImageError } from '../utils/imageUtils';
import { updateItemCalculatedPrice, updateAllItemsCalculatedPrice } from '@/utils/priceUtils';
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
        return total + ((item.calculatedPrice || item.price) * item.quantity);
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
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    
    // 更新商品的计算价格
    updateItemPrice(item) {
      updateItemCalculatedPrice(item);
    },
    
    // 更新所有商品的计算价格
    updateAllItemPrices() {
      updateAllItemsCalculatedPrice(this.cartItems);
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
          // 为每个商品添加selected属性
          this.cartItems.forEach(item => {
            if (item.selected === undefined) {
              item.selected = false;
            }
          });
          // 计算所有商品的价格
          this.updateAllItemPrices();
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
        // 找到对应的购物车项目
        const cartItem = this.cartItems.find(item => item.id === cartItemId);
        if (!cartItem) {
          console.error('找不到购物车项目');
          return;
        }

        const response = await this.$api.put(`/cart/item/${cartItemId}`, { 
          quantity
        });
        
        if (response.success) {
          // 更新本地数据
          cartItem.quantity = quantity;
          // 重新计算该商品的价格
          this.updateItemPrice(cartItem);
          
          //this.$messageHandler.showSuccess('数量已更新', 'cart.success.quantityUpdated');
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
          //this.$messageHandler.showSuccess('商品已从购物车中移除', 'cart.success.itemRemoved');

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
            //this.$messageHandler.showSuccess(this.$t('cart.clearSuccess') || '购物车已清空', 'cart.success.clearSuccess');

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
    
    async removeSelectedItems() {
      if (!this.selectedItems.length) {
        this.$messageHandler.showWarning(this.$t('cart.selectItemsFirst') || '请先选择要删除的商品');
        return;
      }
      
      try {
        await this.$messageHandler.confirm({
          message: this.$t('cart.removeSelectedConfirmMessage') || `确定要删除选中的 ${this.selectedItems.length} 个商品吗？此操作不可撤销。`,
          translationKey: 'cart.confirm.removeSelected'
        });
        
        try {
          // 批量删除选中的商品
          const deletePromises = this.selectedItems.map(item => 
            this.$api.delete(`/cart/item/${item.id}`)
          );
          
          await Promise.all(deletePromises);
          /*
          this.$messageHandler.showSuccess(
            this.$t('cart.removeSelectedSuccess') || `已成功删除 ${this.selectedItems.length} 个商品`, 
            'cart.success.removeSelectedSuccess'
          );*/
          
          // 从本地数组中移除已删除的商品
          const selectedIds = this.selectedItems.map(item => item.id);
          this.cartItems = this.cartItems.filter(item => !selectedIds.includes(item.id));
          this.selectedItems = [];
          this.calculateTotal();
          this.$bus.emit('cart-updated');
          
        } catch (error) {
          console.error('删除选中商品失败:', error);
          this.$messageHandler.showError(
            error.response?.data?.message || this.$t('cart.removeSelectedError') || '删除选中商品失败', 
            'cart.error.removeSelectedFailed'
          );
          // 重新获取购物车数据以确保数据一致性
          this.fetchCart();
        }
      } catch {
        // 用户取消操作
      }
    },
    calculateTotal() {
      // 更新选中的商品列表
      this.updateSelectedItems();
    },
    handleCheckout() {
      if (!this.selectedItems.length) {
        this.$messageHandler.showWarning(this.$t('cart.selectItemsFirst') || '请先选择要结算的商品');
        return;
      }
      const checkoutData = this.selectedItems.map(item => {return {
          id: item.id,
          product_id: item.product_id,
          product_code: item.product_code,
          name: item.name,
          image_url: item.thumbnail_url || item.image_url,
          quantity: item.quantity,
          price: item.calculatedPrice,
          // 添加产品尺寸重量信息用于运费计算
          length: item.product_length || 0,
          width: item.product_width || 0,
          height: item.product_height || 0,
          weight: item.product_weight || 0
        }});
      sessionStorage.setItem('selectedCartItems', JSON.stringify(checkoutData) );
      this.$router.push({
        name: 'UnifiedCheckout',
        query: { from: 'cart' }
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
        // 立即更新价格显示
        this.updateItemPrice(item);
        this.updateQuantity(item.id, item.quantity);
      }
    },
    
    increaseQuantity(item) {
      // 只对自营商品判断库存，代销商品不限制库存
      if (item.product_type === 'self_operated') {
        if (item.quantity < item.stock) {
          item.quantity++;
          // 立即更新价格显示
          this.updateItemPrice(item);
          this.updateQuantity(item.id, item.quantity);
        }
      } else {
        // 代销商品直接增加数量
        item.quantity++;
        // 立即更新价格显示
        this.updateItemPrice(item);
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
      const isMobile = window.innerWidth <= 767;
      
      if (isMobile) {
        // 移动端：直接跳转到询价管理页面
        this.$router.push('/inquiry-management');
        return;
      }
      
      // 桌面端：检查商品是否已在询价单中
      if (this.isProductInInquiry(item.product_id)) {
        this.$messageHandler.showWarning(
          this.$t('cart.productAlreadyInInquiry') || '该商品已在询价单中',
          'CART.PRODUCT.ALREADY_IN_INQUIRY'
        );
        return;
      }
      
      // 桌面端：使用InquiryPanel组件
      if (this.$refs.inquiryPanel) {
        this.$refs.inquiryPanel.addToInquiry(item);
      }
    },
    
    // Add selected products to inquiry
    async addSelectedToInquiry() {
      if (!this.selectedItems.length) {
        this.$messageHandler.showWarning(
          this.$t('cart.selectItemsFirst') || '请先选择要询价的商品');
        return;
      }
      
      // 检查是否为移动端
      const isMobile = window.innerWidth <= 767;
      
      if (isMobile) {
        // 移动端：直接创建询价单并跳转
        try {
          // 创建新的询价单
          const titlePrefix = this.$t('cart.inquiryTitlePrefix') || '询价单';
          const response = await this.$api.postWithErrorHandler('/inquiries', {
            titlePrefix: titlePrefix
          }, {
            fallbackKey: 'INQUIRY.CREATE.FAILED'
          });
          
          if (response.success) {
            const inquiryId = response.data.id;
            
            // 将选中的商品添加到询价单（不传递单价，由管理员后续设置）
            const addPromises = this.selectedItems.map(item => 
              this.$api.postWithErrorHandler(`/inquiries/${inquiryId}/items`, {
                product_id: item.product_id,
                quantity: item.quantity
              }, {
                fallbackKey: 'INQUIRY.ADD_ITEM.FAILED'
              })
            );
            
            await Promise.all(addPromises);
            
            /*this.$messageHandler.showSuccess(
              this.$t('cart.inquiryCreatedSuccess') || '询价单创建成功，正在跳转...',
              'CART.INQUIRY.CREATED_SUCCESS'
            );*/
            
            // 跳转到询价管理页面
            this.$router.push('/inquiry-management');
          }
        } catch (error) {
          console.error('创建询价单失败:', error);
          this.$messageHandler.showError(
            error.response?.data?.message || this.$t('cart.inquiryCreateError') || '创建询价单失败',
            'CART.INQUIRY.CREATE_FAILED'
          );
        }
      } else {
        // 桌面端：使用原有的InquiryPanel逻辑
        if (this.$refs.inquiryPanel) {
          await this.$refs.inquiryPanel.addMultipleToInquiry(this.selectedItems);
        }
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
      width: 45%;
    }

    &.price-column {
      width: 18%;
    }

    &.quantity-column {
      width: 18%;
    }

    &.subtotal-column {
      width: 19%;
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
.remove-selected-btn,
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

.remove-selected-btn {
  background: #ef4444;
  color: $white;

  &:hover {
    background: #dc2626;
  }

  &:disabled {
    background: $gray-400;
    cursor: not-allowed;
    opacity: 0.5;
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
  .desktop-only {
    display: none !important;
  }

  .mobile-only {
    display: block !important;
  }

  .cart-table-wrapper {
    display: none !important;
  }

  .cart-cards {
    display: flex !important;
  }

  .cart-page {
    overflow-x: hidden;
  }

  .cart-container {
    padding: 12px;
    grid-template-columns: 1fr;
    max-width: 100vw;
    box-sizing: border-box;
  }

  .cart-content {
    padding: 12px;
    max-width: 100%;
    box-sizing: border-box;
  }

  .cart-summary {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    max-width: 100%;
    box-sizing: border-box;
  }

  .cart-actions {
    flex-direction: column;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .continue-shopping-btn,
  .remove-selected-btn,
  .inquiry-btn,
  .checkout-btn {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    text-align: center;
    justify-content: center;
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

// Desktop only styles
.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
}

// 确保在桌面端正确显示
@include desktop {
  .desktop-only {
    display: block !important;
  }

  .mobile-only {
    display: none !important;
  }

  .cart-table-wrapper {
    display: block !important;
  }

  .cart-cards {
    display: none !important;
  }
}

// Mobile card styles
.cart-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 100%;
  box-sizing: border-box;
}

.select-all-mobile {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: $gray-50;
  border-radius: 8px;
  border: 1px solid $gray-200;
  font-weight: 500;
  color: $text-primary;
  max-width: 100%;
  box-sizing: border-box;
}

.cart-card {
  background: $white;
  border: 1px solid $gray-200;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 100%;
  box-sizing: border-box;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid $gray-200;
  max-width: 100%;
  box-sizing: border-box;
}

.product-info-mobile {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  min-width: 0; // 允许flex子元素收缩
  max-width: 100%;
  box-sizing: border-box;
}

.product-image-mobile {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid $gray-200;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.product-details-mobile {
  flex: 1;
  min-width: 0; // 允许文本截断
  max-width: 100%;
  box-sizing: border-box;
}

.product-name-mobile {
  font-size: 16px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 6px;
  line-height: 1.3;
  text-decoration: none;
  display: block;
  transition: color 0.15s ease-in-out;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;

  &:hover {
    color: $primary-color;
  }
}

.product-code-mobile {
  font-size: 13px;
  color: $text-secondary;
  font-weight: 400;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

.card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 100%;
  box-sizing: border-box;
}

.price-info,
.quantity-section,
.subtotal-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 100%;
  box-sizing: border-box;
}

.price-label,
.quantity-label,
.subtotal-label {
  font-size: 14px;
  color: $text-secondary;
  font-weight: 500;
  flex-shrink: 0;
}

.price-value,
.subtotal-value {
  font-size: 16px;
  font-weight: 600;
  color: $primary-color;
  flex-shrink: 0;
}

.quantity-section {
  .quantity-controls {
    margin-left: auto;
    flex-shrink: 0;
  }
}

.card-footer {
  padding: 12px 16px;
  background: $gray-50;
  border-top: 1px solid $gray-200;
  display: flex;
  justify-content: flex-end;
  max-width: 100%;
  box-sizing: border-box;
}

.remove-btn-mobile {
  background: #ef4444;
  color: $white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  flex-shrink: 0;

  &:hover {
    background: #dc2626;
    transform: translateY(-1px);
  }
}
</style>