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
                      <button class="inquire-btn add-to-inquiry"
                        :class="{ 'disabled': isProductInInquiry(item.product_id) }"
                        :disabled="isProductInInquiry(item.product_id)" @click="addToInquiry(item)"
                        :data-product-id="item.product_id" :data-product-name="item.name">
                        {{ $t('cart.inquire') || '询价' }}
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
              <button class="checkout-btn" @click="checkout4">
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
      <div class="inquiries-section">
        <h2 class="inquiries-title">{{ $t('cart.inquiries') || '询价单' }}</h2>

        <!-- Inquiry Tabs -->
        <div class="inquiry-tabs-container">
          <nav class="inquiry-tabs" id="inquiryTabs">
            <div v-for="inquiry in inquiries" :key="inquiry.id" class="tab-container group"
              :data-tab-container-id="inquiry.id">
              <a href="#" class="inquiry-tab" :class="{ 'tab-active': activeInquiryId === inquiry.id }"
                :data-tab="inquiry.id" @click="switchTab(inquiry.id)">
                {{ inquiry.name }}
              </a>
              <button class="close-tab-btn" @click.stop="confirmDeleteInquiry(inquiry.id)" :data-inquiry-id="inquiry.id"
                :title="$t('cart.closeInquiry') || 'Close Inquiry'">
                <i class="material-icons">close</i>
              </button>
            </div>
            <button class="add-inquiry-btn" id="addInquiryTab" :disabled="!canAddNewInquiry" @click="addInquiry">
              <i class="material-icons">add_circle_outline</i>
              {{ $t('cart.newInquiry') || '新建询价单' }}
            </button>
          </nav>
        </div>

        <!-- Inquiry Panels -->
        <div class="inquiry-panels" id="inquiryPanels">
          <div v-for="inquiry in inquiries" :key="inquiry.id" :id="inquiry.id" class="inquiry-panel"
            :class="{ 'active': activeInquiryId === inquiry.id }">
            <div class="inquiry-content">
              <!-- Inquiry Items -->
              <div class="inquiry-items-section">
                <div class="inquiry-items" :id="inquiry.id + '-items'">
                  <div v-for="item in inquiry.items" :key="item.productId" class="inquiry-item"
                    :data-product-id="item.productId">
                    <div class="item-info">
                      <img :src="item.imageUrl" :alt="item.name" class="item-image">
                      <div class="item-details">
                        <p class="item-name">{{ item.name }}</p>
                        <p class="item-code">{{ $t('cart.productCode') || '产品编号' }}: {{ item.productId }}</p>
                      </div>
                    </div>
                    <div class="item-controls">
                      <div class="control-group">
                        <label class="control-label">{{ $t('cart.quantity') || '数量' }}</label>
                        <input type="number" class="control-input" v-model="item.quantity" min="1" readonly>
                      </div>
                      <div class="control-group">
                        <label class="control-label">{{ $t('cart.unitPrice') || '期望价格' }}</label>
                        <input type="number" class="control-input" v-model="item.unit_price" step="0.01"
                          placeholder="0.00" readonly>
                      </div>
                    </div>
                    <div class="item-actions">
                      <button class="remove-item-btn remove-inquiry-item-btn"
                        @click="removeFromInquiry(inquiry.id, item.id, item.productId)"
                        :data-product-id="item.productId" :title="$t('cart.removeFromInquiry') || '从询价单中移除'">
                        <i class="material-icons">remove_circle_outline</i>
                      </button>
                    </div>
                  </div>
                  <p v-if="inquiry.items.length === 0" class="no-items-message">
                    {{ $t('cart.noItemsInInquiry') || '此询价单中没有商品，请从购物车添加商品。' }}
                  </p>
                </div>
              </div>

              <!-- Sales Communication -->
              <div class="communication-section">
                <h4 class="section-title">{{ $t('cart.salesCommunication') || '销售沟通' }}</h4>
                <div class="chat-history" :id="inquiry.id + '-chat-history'" ref="chatHistory">
                  <div v-for="message in inquiry.messages" :key="message.id" class="chat-message"
                    :class="{ 'user-message': message.isUser }">
                    <p class="message-sender">
                      {{ message.sender }} ({{ formatTime(message.timestamp) }}):
                    </p>
                    <p class="message-content">{{ message.content }}</p>
                  </div>
                  <p v-if="inquiry.messages.length === 0" class="no-messages">
                    {{ $t('cart.noMessages') || '暂无消息。' }}
                  </p>
                </div>
                <div class="chat-input-section">
                  <textarea v-model="inquiry.newMessage" class="chat-input" rows="3"
                    :placeholder="$t('cart.typeMessage') || 'Type your message...'" :id="inquiry.id + '-chat-message'"
                    ref="messageInput"></textarea>
                  <button class="send-btn" @click="sendMessage(inquiry.id)" :id="inquiry.id + '-send-chat'"
                    :data-inquiry-id="inquiry.id">
                    {{ $t('cart.send') || 'Send' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
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
import api from '@/utils/api';
import MessageHandler from '@/utils/messageHandler';

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
      totalPrice: 0,
      // Inquiry system data
      inquiries: [],
      activeInquiryId: null,
      inquiryCounter: 0,
      maxInquiries: 5,
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
    this.initializeInquiries();
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
    
    // Inquiry system methods
    async initializeInquiries() {
      // 从后端获取用户的询价列表
      await this.fetchInquiries();
    },
    
    async fetchInquiries() {
      try {
        const response = await api.getWithErrorHandler('/inquiries', {
          fallbackKey: 'INQUIRY.FETCH.FAILED'
        });
        
        if (response.success) {
          this.inquiries = response.data.inquiries.map(inquiry => ({
            id: inquiry.id,
            name: inquiry.title, // 使用title作为name显示在UI上
            title: inquiry.title,
            status: inquiry.status,
            items: [], // 将在获取详情时加载
            messages: [], // 将在获取详情时加载
            newMessage: ''
          }));
          
          // 如果有询价单，设置第一个为活跃状态并加载详情
          if (this.inquiries.length > 0) {
            this.activeInquiryId = this.inquiries[0].id;
            await this.fetchInquiryDetail(this.inquiries[0].id);
          }
        }
      } catch (error) {
        console.error('获取询价列表失败:', error);
      }
    },
    
    async fetchInquiryDetail(inquiryId) {
      try {
        const response = await api.getWithErrorHandler(`/inquiries/${inquiryId}`, {
          fallbackKey: 'INQUIRY.FETCH.FAILED'
        });
        
        if (response.success) {
          const inquiry = this.inquiries.find(inq => inq.id === inquiryId);
          if (inquiry) {
            inquiry.items = response.data.items.map(item => ({
              id: item.id,
              productId: item.product_id,
              name: item.product_name,
              imageUrl: item.image_url || require('@/assets/images/default-image.svg'),
              quantity: item.quantity,
              expectedPrice: item.unit_price || ''
            }));
            
            inquiry.messages = response.data.messages.map(msg => ({
              id: msg.id,
              sender: msg.sender_type === 'user' ? this.$t('inquiry.you') || '您' : this.$t('inquiry.salesRep') || '销售代表',
              content: msg.message,
              timestamp: new Date(msg.created_at).getTime(),
              isUser: msg.sender_type === 'user'
            }));
            
            // 更新已询价商品ID集合
            inquiry.items.forEach(item => {
              this.inquiredProductIds.add(item.productId);
            });
            this.updateAllInquireButtonStates();
          }
        }
      } catch (error) {
        console.error('获取询价详情失败:', error);
      }
    },
    
    async addInquiry() {
      if (this.inquiries.length >= this.maxInquiries) {
        this.$messageHandler.showWarning(this.$t('cart.maxInquiriesReached') || `最多只能创建 ${this.maxInquiries} 个询价单`, 'cart.warning.maxInquiriesReached');
        return null;
      }
      
      try {
        const titlePrefix = this.$t('cart.inquiryTitlePrefix') || '询价单';
        const response = await api.postWithErrorHandler('/inquiries', {
          titlePrefix: titlePrefix
        }, {
          fallbackKey: 'INQUIRY.CREATE.FAILED'
        });
        
        if (response.success) {
          const newInquiry = {
            id: response.data.id,
            name: response.data.title,
            items: [],
            messages: [],
            newMessage: ''
          };
          
          this.inquiries.push(newInquiry);
          this.activeInquiryId = newInquiry.id;
          
          MessageHandler.showSuccess(this.$t('inquiry.createSuccess') || '询价单创建成功');
          return newInquiry.id;
        }
      } catch (error) {
        console.error('创建询价单失败:', error);
        return null;
      }
    },
    
    async confirmDeleteInquiry(inquiryId) {
      try {
        await this.$messageHandler.confirm({
          message: this.$t('cart.deleteInquiryConfirm') || '确定要删除这个询价单吗？',
          translationKey: 'cart.deleteInquiryConfirm'
        });
        this.deleteInquiry(inquiryId);
      } catch {
        // User cancelled
      }
    },
    
    async deleteInquiry(inquiryId) {
      try {
        const response = await api.deleteWithErrorHandler(`/inquiries/${inquiryId}`, {
          fallbackKey: 'INQUIRY.DELETE.FAILED'
        });
        
        if (response.success) {
          const inquiryIndex = this.inquiries.findIndex(inquiry => inquiry.id === inquiryId);
          if (inquiryIndex !== -1) {
            const inquiry = this.inquiries[inquiryIndex];
            
            // Remove products from inquired set
            inquiry.items.forEach(item => {
              this.inquiredProductIds.delete(item.productId);
            });
            
            this.inquiries.splice(inquiryIndex, 1);
            
            // Switch to first inquiry if current was deleted
            if (this.activeInquiryId === inquiryId) {
              this.activeInquiryId = this.inquiries[0]?.id || null;
            }
            
            this.updateAllInquireButtonStates();
            MessageHandler.showSuccess(this.$t('inquiry.deleteSuccess') || '询价单删除成功');
          }
        }
      } catch (error) {
        console.error('删除询价单失败:', error);
      }
    },
    
    async switchTab(inquiryId) {
      this.activeInquiryId = inquiryId;
      
      // 如果该询价单的详情还未加载，则加载详情
      const inquiry = this.inquiries.find(inq => inq.id === inquiryId);
      if (inquiry && inquiry.items.length === 0 && inquiry.messages.length === 0) {
        await this.fetchInquiryDetail(inquiryId);
      }
    },
    
    async addToInquiry(cartItem) {
      // 如果没有激活的询价单，自动创建一个
      if (!this.activeInquiryId || this.inquiries.length === 0) {
        const newInquiryId = await this.addInquiry();
        if (!newInquiryId) {
          // 创建询价单失败，不继续执行
          return;
        }
      }
      
      if (this.inquiredProductIds.has(cartItem.product_id)) {
        this.$messageHandler.showWarning(this.$t('cart.productAlreadyInInquiry') || `商品 "${cartItem.name}" 已在其他询价单中`, 'cart.warning.productAlreadyInInquiry');
        return;
      }
      
      try {
        const response = await api.postWithErrorHandler(`/inquiries/${this.activeInquiryId}/items`, {
          productId: cartItem.product_id,
          quantity: cartItem.quantity || 1,
          unitPrice: cartItem.price
        }, {
          fallbackKey: 'INQUIRY.ADD_ITEM.FAILED'
        });
        
        if (response.success) {
          const activeInquiry = this.inquiries.find(inquiry => inquiry.id === this.activeInquiryId);
          if (activeInquiry) {
            // 使用后端返回的完整数据结构
            const inquiryItem = {
              id: response.data.id,
              productId: response.data.product_id,
              name: response.data.product_name,
              imageUrl: response.data.image_url || require('@/assets/images/default-image.svg'),
              quantity: response.data.quantity,
              unit_price: response.data.unit_price
            };
            
            activeInquiry.items.push(inquiryItem);
            this.inquiredProductIds.add(cartItem.product_id);
            
            this.updateAllInquireButtonStates();
            MessageHandler.showSuccess(this.$t('cart.productAddedToInquiry') || `商品 "${cartItem.name}" 已添加到询价单`);
          }
        }
      } catch (error) {
        console.error('添加商品到询价单失败:', error);
      }
    },
    
    async removeFromInquiry(inquiryId, itemId, productId) {
      try {
        await api.deleteWithErrorHandler(`/inquiries/${inquiryId}/items/${itemId}`, {
          fallbackKey: 'INQUIRY.ITEM.DELETE.FAILED'
        });
        
        // 从前端数据中移除商品
        const inquiry = this.inquiries.find(inquiry => inquiry.id === inquiryId);
        if (inquiry) {
          const itemIndex = inquiry.items.findIndex(item => item.id === itemId);
          if (itemIndex !== -1) {
            inquiry.items.splice(itemIndex, 1);
            this.inquiredProductIds.delete(productId);
            this.updateAllInquireButtonStates();
          }
        }
        
        this.$messageHandler.showSuccess(this.$t('cart.itemRemovedFromInquiry') || '商品已从询价单中移除', 'INQUIRY.ITEM.DELETE.SUCCESS');
      } catch (error) {
        console.error('删除询价商品失败:', error);
        this.$messageHandler.showError(this.$t('cart.removeFromInquiryFailed') || '删除询价商品失败', 'INQUIRY.ITEM.DELETE.FAILED');
      }
    },
    
    isProductInInquiry(productId) {
      return this.inquiredProductIds.has(productId);
    },
    
    updateAllInquireButtonStates() {
      // This method updates the state of all inquire buttons
      // The actual button state is handled by the isProductInInquiry method
    },
    
    async sendMessage(inquiryId) {
      const inquiry = this.inquiries.find(inquiry => inquiry.id === inquiryId);
      if (!inquiry || !inquiry.newMessage.trim()) return;
      
      const messageContent = inquiry.newMessage.trim();
      inquiry.newMessage = ''; // 清空输入框
      
      try {
        const response = await api.postWithErrorHandler(`/inquiries/${inquiryId}/messages`, {
          message: messageContent
        }, {
          fallbackKey: 'INQUIRY.SEND_MESSAGE.FAILED'
        });
        
        if (response.success) {
          const message = {
            id: response.data.id || Date.now(),
            sender: this.$t('inquiry.you') || '您',
            content: messageContent,
            timestamp: Date.now(),
            isUser: true
          };
          
          inquiry.messages.push(message);
          
          // Scroll to bottom
          this.$nextTick(() => {
            const chatHistory = this.$refs.chatHistory;
            if (chatHistory && chatHistory.length) {
              const activeChat = chatHistory.find(el => 
                el.closest('.inquiry-panel.active')
              );
              if (activeChat) {
                activeChat.scrollTop = activeChat.scrollHeight;
              }
            }
          });
        }
      } catch (error) {
        console.error('发送消息失败:', error);
        // 如果发送失败，恢复消息内容
        inquiry.newMessage = messageContent;
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
  max-width: 1200px;
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
  font-size: 16px;
  font-weight: 600;
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

// Inquiries section - based on Cart-new.html design
.inquiries-section {
  @include card;
  border: 1px solid $gray-200;
  padding: 24px;
}

.inquiries-title {
  font-size: 20px;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 16px;
}

// Inquiry tabs - pixel-perfect based on Cart-new.html
.inquiry-tabs-container {
  border-bottom: 1px solid $gray-200;
  margin-bottom: 24px;
}

.inquiry-tabs {
  display: flex;
  align-items: center;
  gap: 0;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.tab-container {
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.inquiry-tab {
  white-space: nowrap;
  padding: 12px 32px 12px 12px;
  border-bottom: 2px solid transparent;
  font-weight: 500;
  font-size: 14px;
  display: block;
  color: $gray-500;
  text-decoration: none;
  transition: all 0.15s ease-in-out;

  &:hover {
    color: $gray-700;
    border-bottom-color: $gray-300;
  }

  &.tab-active {
    color: #ef4444;
    border-bottom-color: #ef4444;
  }
}

.close-tab-btn {
  position: absolute;
  top: 50%;
  right: 6px;
  transform: translateY(-50%);
  padding: 2px;
  border-radius: 50%;
  background: none;
  border: none;
  color: $gray-400;
  cursor: pointer;
  opacity: 0;
  transition: all 0.15s ease-in-out;
  z-index: 10;

  .material-icons {
    font-size: 16px;
    line-height: 1;
  }

  &:hover {
    background: #ef4444;
    color: $white;
  }
}

.tab-container.group:hover .close-tab-btn {
  opacity: 1;
}

.add-inquiry-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  background: #3b82f6;
  color: $white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  white-space: nowrap;
  margin-left: 8px;

  &:hover:not(:disabled) {
    background: #2563eb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .material-icons {
    font-size: 18px;
  }
}

// Inquiry panels
.inquiry-panels {
  position: relative;
}

.inquiry-panel {
  display: none;

  &.active {
    display: block;
  }
}

.inquiry-content {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 24px;

  @include mobile {
    grid-template-columns: 1fr;
  }
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 12px;
}

// Inquiry items - based on Cart-new.html pixel-perfect design
.inquiry-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.inquiry-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid $gray-300;
  border-radius: 8px;
  background: $gray-50;
  gap: 12px;

  @include mobile {
    flex-direction: column;
    align-items: flex-start;
  }
}

.item-info {
  display: flex;
  align-items: center;
  width: 40%; // 2/5 of container width
  gap: 12px;

  @include mobile {
    width: 100%;
  }
}

.item-image {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
}

.item-details {
  flex: 1;
}

.item-name {
  font-weight: 600;
  color: $text-primary;
  font-size: 14px;
  margin-bottom: 2px;
  line-height: 1.2;
}

.item-code {
  font-size: 12px;
  color: $text-secondary;
  line-height: 1.2;
}

.item-controls {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  width: auto;
  flex: 1;

  @include mobile {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
  }
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 80px;
  flex-shrink: 0;

  @include mobile {
    width: 100%;
  }
}

.control-label {
  font-size: 12px;
  font-weight: 500;
  color: $gray-600;
  margin-bottom: 2px;
}

.control-input {
  padding: 6px 8px;
  border: 1px solid $gray-300;
  border-radius: 6px;
  font-size: 14px;
  width: 100%;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.15s ease-in-out;

  &:focus {
    outline: none;
    border-color: #ef4444;
    box-shadow: 0 0 0 1px #ef4444;
  }
}

.item-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  width: auto;
  margin-top: 0;
  align-self: center;
  flex-shrink: 0;

  @include mobile {
    width: 100%;
    margin-top: 8px;
  }
}

.remove-inquiry-item-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 6px;
  background: #fef2f2;
  color: #ef4444;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease-in-out;

  &:hover {
    background: #fecaca;
    color: #dc2626;
  }

  .material-icons {
    font-size: 18px;
    line-height: 1;
  }
}

.remove-item-btn {
  background: #ef4444;
  color: $white;
  border: none;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease-in-out;

  &:hover {
    background: #dc2626;
  }

  .material-icons {
    font-size: 18px;
  }
}

.no-items-message {
  text-align: center;
  color: $text-secondary;
  font-style: italic;
  padding: 24px;
}

// Communication section
.communication-section {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-history {
  background: $gray-50;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid $gray-200;
  flex-grow: 1;
  height: 320px;
  overflow-y: auto;
  margin-bottom: 12px;
}

.chat-message {
  margin-bottom: 10px;

  &.user-message {
    text-align: right;

    .message-content {
      background: #dcfce7;
      color: #166534;
    }
  }
}

.message-sender {
  font-size: 12px;
  color: $text-secondary;
  margin-bottom: 2px;
}

.message-content {
  font-size: 14px;
  padding: 8px;
  border-radius: 8px;
  display: inline-block;
  max-width: 75%;
  word-wrap: break-word;
  background: #dbeafe;
  color: #1e40af;
}

.no-messages {
  font-size: 14px;
  color: $gray-400;
  font-style: italic;
  text-align: center;
  padding: 24px;
}

.chat-input-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid $gray-300;
  border-radius: 8px;
  font-size: 16px;
  min-height: 80px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #ef4444;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
  }
}

.send-btn {
  background: #3b82f6;
  color: $white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  align-self: flex-end;
  transition: all 0.15s ease-in-out;
  min-width: 120px;

  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
}

// Responsive design
@include mobile {
  .cart-container {
    padding: 16px;
    grid-template-columns: 1fr;
  }

  .cart-content,
  .inquiries-section {
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