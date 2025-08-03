<template>
  <div class="inquiries-section">
    <div class="inquiry-layout">
      <!-- Inquiry List Sidebar -->
      <div class="inquiry-sidebar">
        <div class="inquiry-list-header">
          <button class="add-inquiry-btn" :disabled="!canAddNewInquiry" @click="addInquiry">
            <i class="material-icons">add_circle_outline</i>
            {{ $t('cart.newInquiry') || '新建询价单' }}
          </button>
        </div>

        <div class="inquiry-list-container">
          <!-- Tab切换 -->
          <div class="inquiry-tabs">
            <button class="tab-btn" :class="{ 'active': activeTab === 'unpaid' }" @click="switchPaymentTab('unpaid')">
              {{ $t('cart.unpaidInquiries') || '未支付' }}
            </button>
            <button class="tab-btn" :class="{ 'active': activeTab === 'paid' }" @click="switchPaymentTab('paid')">
              {{ $t('cart.paidInquiries') || '已支付' }}
            </button>
          </div>

          <div class="inquiry-list" ref="inquiryList">
            <div v-for="inquiry in filteredInquiries" :key="inquiry.id" class="inquiry-list-item"
              :class="{ 'active': activeInquiryId === inquiry.id }" @click="switchTab(inquiry.id)">
              <div class="inquiry-item-content">
                <div class="inquiry-item-header">
                  <h4 class="inquiry-item-title">{{ inquiry.name }}</h4>
                  <button class="delete-inquiry-btn" @click.stop="confirmDeleteInquiry(inquiry.id)"
                    :title="$t('cart.closeInquiry') || 'Close Inquiry'">
                    <i class="material-icons">close</i>
                  </button>
                </div>
                <div class="inquiry-item-preview">
                  <div class="inquiry-products-preview">
                    <div v-for="(item) in inquiry.items.slice(0, 5)" :key="item.productId" class="preview-product">
                      <img :src="item.imageUrl" :alt="item.name" class="preview-image">
                    </div>
                    <div v-if="inquiry.items.length > 5" class="more-products">
                      +{{ inquiry.items.length - 5 }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="filteredInquiries.length === 0" class="no-inquiries">
              <p v-if="activeTab === 'paid'">{{ $t('cart.noPaidInquiries') || '暂无已支付询价单' }}</p>
              <p v-else>{{ $t('cart.noUnpaidInquiries') || '暂无未支付询价单' }}</p>
            </div>
          </div>

          <!-- Scroll buttons -->
          <div class="scroll-controls" v-if="showScrollControls">
            <button class="scroll-btn scroll-up" @click="scrollInquiryList('up')" :disabled="!canScrollUp">
              <i class="material-icons">keyboard_arrow_up</i>
            </button>
            <button class="scroll-btn scroll-down" @click="scrollInquiryList('down')" :disabled="!canScrollDown">
              <i class="material-icons">keyboard_arrow_down</i>
            </button>
          </div>
        </div>
      </div>

      <!-- Inquiry Detail Panel -->
      <InquiryDetailPanel :inquiry="activeInquiry" @remove-item="removeFromInquiry" @send-message="sendMessage" @item-added="handleItemAdded"
        @update-message="updateInquiryMessage" @checkout-inquiry="handleCheckoutInquiry" />
    </div>
  </div>
</template>

<script>
import api from '@/utils/api';
import MessageHandler from '@/utils/messageHandler';
import InquiryPolling from '@/utils/inquiryPolling';
import InquiryDetailPanel from './InquiryDetailPanel.vue';

export default {
  name: 'InquiryPanel',
  components: {
    InquiryDetailPanel
  },
  props: {
    inquiredProductIds: {
      type: Set,
      default: () => new Set()
    }
  },
  data() {
    return {
      inquiries: [],
      activeInquiryId: null,
      maxInquiries: 5,
      pollingConnection: null,
      // Scroll control data
      showScrollControls: false,
      canScrollUp: false,
      canScrollDown: false,
      // Tab control data
      activeTab: 'unpaid' // 'paid' or 'unpaid'
    };
  },
  computed: {
    activeInquiry() {
      return this.inquiries.find(inquiry => inquiry.id === this.activeInquiryId);
    },
    
    canAddNewInquiry() {
      return this.inquiries.length < this.maxInquiries;
    },
    
    filteredInquiries() {
      return this.inquiries.filter(inquiry => {
        if (this.activeTab === 'paid') {
          return inquiry.status === 'paid';
        } else {
          return inquiry.status !== 'paid';
        }
      });
    }
  },
  mounted() {
    this.initPolling();
    this.initializeInquiries();
    this.$nextTick(() => {
      this.checkScrollControls();
    });
  },
  updated() {
    this.$nextTick(() => {
      this.checkScrollControls();
    });
  },
  beforeUnmount() {
    this.cleanupPolling();
  },
  methods: {
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    
    async initializeInquiries() {
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
            name: inquiry.title,
            title: inquiry.title,
            status: inquiry.status,
            items: (inquiry.items || []).map(item => ({
              id: item.id,
              productId: item.product_id,
              product_id: item.product_id,
              name: item.product_name,
              product_name: item.product_name,
              imageUrl: item.image_url || require('@/assets/images/default-image.svg'),
              image_url: item.image_url,
              quantity: item.quantity,
              unit_price: item.unit_price,
              price: item.price || item.unit_price
            })),
            messages: [],
            newMessage: ''
          }));
          
          // 更新已询价商品ID集合并通知父组件
          const updatedInquiredProductIds = new Set();
          this.inquiries.forEach(inquiry => {
            inquiry.items.forEach(item => {
              updatedInquiredProductIds.add(item.productId);
            });
          });
          this.$emit('update-inquired-products', updatedInquiredProductIds);
          
          // 如果有询价单，设置第一个为活跃状态并加载详情
          if (this.inquiries.length > 0) {
            this.activeInquiryId = this.inquiries[0].id;
            await this.fetchInquiryDetail(this.inquiries[0].id);
            this.startInquiryPolling(this.inquiries[0].id);
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
              product_id: item.product_id,
              name: item.product_name,
              product_name: item.product_name,
              imageUrl: item.image_url || require('@/assets/images/default-image.svg'),
              image_url: item.image_url,
              quantity: item.quantity,
              unit_price: item.unit_price,
              price: item.price || item.unit_price
            }));
            
            inquiry.messages = response.data.messages.map(msg => ({
              id: msg.id,
              sender: msg.sender_type === 'user' ? this.$t('inquiry.you') || '您' : this.$t('inquiry.salesRep') || '销售代表',
              content: msg.message,
              timestamp: new Date(msg.created_at).getTime(),
              isUser: msg.sender_type === 'user'
            }));
            
            // 更新已询价商品ID集合并通知父组件
            const updatedInquiredProductIds = new Set(this.inquiredProductIds);
            inquiry.items.forEach(item => {
              updatedInquiredProductIds.add(item.productId);
            });
            this.$emit('update-inquired-products', updatedInquiredProductIds);
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
          this.$emit('inquiry-created', newInquiry.id);
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
            
            // Remove products from inquired set and notify parent
            const updatedInquiredProductIds = new Set(this.inquiredProductIds);
            inquiry.items.forEach(item => {
              updatedInquiredProductIds.delete(item.productId);
            });
            this.$emit('update-inquired-products', updatedInquiredProductIds);
            
            this.inquiries.splice(inquiryIndex, 1);
            
            // Switch to first inquiry if current was deleted
            if (this.activeInquiryId === inquiryId) {
              this.activeInquiryId = this.inquiries[0]?.id || null;
            }
            
            MessageHandler.showSuccess(this.$t('inquiry.deleteSuccess') || '询价单删除成功');
          }
        }
      } catch (error) {
        console.error('删除询价单失败:', error);
      }
    },
    
    async switchTab(inquiryId) {
      // 停止之前的轮询
      if (this.activeInquiryId && this.activeInquiryId !== inquiryId) {
        this.stopInquiryPolling(this.activeInquiryId);
      }
      
      this.activeInquiryId = inquiryId;
      
      // 如果该询价单的详情还未加载，则加载详情
      const inquiry = this.inquiries.find(inq => inq.id === inquiryId);
      if (inquiry && inquiry.items.length === 0 && inquiry.messages.length === 0) {
        await this.fetchInquiryDetail(inquiryId);
      }
      
      // 开始新的轮询
      this.startInquiryPolling(inquiryId);
    },
    
    async addToInquiry(cartItem) {
      // 如果没有激活的询价单，自动创建一个
      if (!this.activeInquiryId || this.inquiries.length === 0) {
        const newInquiryId = await this.addInquiry();
        if (!newInquiryId) {
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
            const inquiryItem = {
              id: response.data.id,
              productId: response.data.product_id,
              name: response.data.product_name,
              imageUrl: response.data.image_url || require('@/assets/images/default-image.svg'),
              quantity: response.data.quantity,
              unit_price: response.data.unit_price
            };
            
            activeInquiry.items.push(inquiryItem);
            
            // 更新已询价商品ID集合并通知父组件
            const updatedInquiredProductIds = new Set(this.inquiredProductIds);
            updatedInquiredProductIds.add(cartItem.product_id);
            this.$emit('update-inquired-products', updatedInquiredProductIds);
            
            MessageHandler.showSuccess(this.$t('cart.productAddedToInquiry') || `商品 "${cartItem.name}" 已添加到询价单`);
          }
        }
      } catch (error) {
        console.error('添加商品到询价单失败:', error);
      }
    },
    
    async addMultipleToInquiry(cartItems) {
      if (!cartItems || cartItems.length === 0) {
        return;
      }
      
      // 如果没有激活的询价单，自动创建一个
      if (!this.activeInquiryId || this.inquiries.length === 0) {
        const newInquiryId = await this.addInquiry();
        if (!newInquiryId) {
          return;
        }
      }
      
      // 获取当前询价单中已有的商品ID
      const activeInquiry = this.inquiries.find(inquiry => inquiry.id === this.activeInquiryId);
      const currentInquiryProductIds = new Set(
        activeInquiry ? activeInquiry.items.map(item => item.productId) : []
      );
      
      // 过滤掉当前询价单中已存在的商品
      const itemsToAdd = cartItems.filter(item => !currentInquiryProductIds.has(item.product_id));
      
      if (itemsToAdd.length === 0) {
        this.$messageHandler.showWarning(
          this.$t('cart.allSelectedInCurrentInquiry') || '所选商品都已在当前询价单中',
          'CART.ALL_SELECTED_IN_CURRENT_INQUIRY'
        );
        return;
      }
      
      if (itemsToAdd.length < cartItems.length) {
        const skippedCount = cartItems.length - itemsToAdd.length;
        this.$messageHandler.showInfo(
          this.$t('cart.someItemsSkippedInCurrentInquiry', { count: skippedCount }) || `${skippedCount}个商品已在当前询价单中，将跳过`,
          'CART.SOME_ITEMS_SKIPPED_IN_CURRENT_INQUIRY'
        );
      }
      
      let successCount = 0;
      let failedItems = [];
      
      for (const cartItem of itemsToAdd) {
        try {
          const response = await api.postWithErrorHandler(`/inquiries/${this.activeInquiryId}/items`, {
            productId: cartItem.product_id,
            quantity: cartItem.quantity || 1,
            unitPrice: cartItem.price
          }, {
            fallbackKey: 'INQUIRY.ADD_ITEM.FAILED'
          });
          
          if (response.success) {
            if (activeInquiry) {
              const inquiryItem = {
                id: response.data.id,
                productId: response.data.product_id,
                name: response.data.product_name,
                imageUrl: response.data.image_url || require('@/assets/images/default-image.svg'),
                quantity: response.data.quantity,
                unit_price: response.data.unit_price
              };
              
              activeInquiry.items.push(inquiryItem);
              
              // 更新已询价商品ID集合
              const updatedInquiredProductIds = new Set(this.inquiredProductIds);
              updatedInquiredProductIds.add(cartItem.product_id);
              this.$emit('update-inquired-products', updatedInquiredProductIds);
              
              successCount++;
            }
          }
        } catch (error) {
          console.error(`添加商品 ${cartItem.name} 到询价单失败:`, error);
          failedItems.push(cartItem.name);
        }
      }
      
      // 显示结果消息
      if (successCount > 0) {
        MessageHandler.showSuccess(
          this.$t('cart.multipleItemsAddedToInquiry', { count: successCount }) || `成功添加 ${successCount} 个商品到询价单`
        );
      }
      
      if (failedItems.length > 0) {
        this.$messageHandler.showWarning(
          this.$t('cart.someItemsFailedToAdd', { items: failedItems.join(', ') }) || `以下商品添加失败: ${failedItems.join(', ')}`,
          'INQUIRY.ADD_MULTIPLE_ITEMS.PARTIAL_FAILED'
        );
      }
    },
    
    // 处理添加商品事件
    handleItemAdded(newItem) {
      const activeInquiry = this.inquiries.find(inquiry => inquiry.id === this.activeInquiryId);
      if (activeInquiry) {
        activeInquiry.items.push(newItem);
        
        // 更新已询价商品ID集合并通知父组件
        const updatedInquiredProductIds = new Set(this.inquiredProductIds);
        updatedInquiredProductIds.add(newItem.productId);
        this.$emit('update-inquired-products', updatedInquiredProductIds);
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
            
            // 更新已询价商品ID集合并通知父组件
            const updatedInquiredProductIds = new Set(this.inquiredProductIds);
            updatedInquiredProductIds.delete(productId);
            this.$emit('update-inquired-products', updatedInquiredProductIds);
          }
        }
        
        this.$messageHandler.showSuccess(this.$t('cart.itemRemovedFromInquiry') || '商品已从询价单中移除', 'INQUIRY.ITEM.DELETE.SUCCESS');
      } catch (error) {
        console.error('删除询价商品失败:', error);
        this.$messageHandler.showError(this.$t('cart.removeFromInquiryFailed') || '删除询价商品失败', 'INQUIRY.ITEM.DELETE.FAILED');
      }
    },
    
    async sendMessage(inquiryId, messageContent) {
      const inquiry = this.inquiries.find(inquiry => inquiry.id === inquiryId);
      if (!inquiry || !messageContent || !messageContent.trim()) return;
      
      const trimmedMessage = messageContent.trim();
      inquiry.newMessage = '';
      
      try {
        const response = await api.postWithErrorHandler(`/inquiries/${inquiryId}/messages`, {
          message: trimmedMessage
        }, {
          fallbackKey: 'INQUIRY.SEND_MESSAGE.FAILED'
        });
        
        if (response.success) {
          const message = {
            id: response.data.id || Date.now(),
            sender: this.$t('inquiry.you') || '您',
            content: trimmedMessage,
            timestamp: Date.now(),
            isUser: true
          };
          
          inquiry.messages.push(message);
          
          this.$nextTick(() => {
            if (this.$refs.chatHistory) {
              this.$refs.chatHistory.scrollTop = this.$refs.chatHistory.scrollHeight;
            }
          });
        }
      } catch (error) {
        console.error('发送消息失败:', error);
        inquiry.newMessage = trimmedMessage;
      }
    },
    
    updateInquiryMessage(inquiryId, message) {
      const inquiry = this.inquiries.find(inq => inq.id === inquiryId);
      if (inquiry) {
        inquiry.newMessage = message;
      }
    },
    
    // 长轮询相关方法
    initPolling() {
      try {
        this.pollingConnection = InquiryPolling;
        this.pollingConnection.setApiInstance(this.$api);
        
        this.pollingConnection.on('new_messages', (data) => {
          this.handleNewMessages(data);
        });
        
        this.pollingConnection.on('polling_error', (error) => {
          console.error('轮询错误:', error);
        });
        
        console.log('长轮询初始化完成');
      } catch (error) {
        console.error('初始化长轮询失败:', error);
      }
    },
    
    cleanupPolling() {
      if (this.pollingConnection) {
        this.pollingConnection.stopAllPolling();
      }
    },
    
    startInquiryPolling(inquiryId) {
      if (this.pollingConnection) {
        this.pollingConnection.startPolling(inquiryId);
      }
    },
    
    stopInquiryPolling(inquiryId) {
      if (this.pollingConnection) {
        this.pollingConnection.stopPolling(inquiryId);
      }
    },
    
    handleNewMessages(data) {
      const inquiry = this.inquiries.find(inq => inq.id === data.inquiryId);
      if (inquiry && data.messages) {
        data.messages.forEach(msg => {
          const existingMessage = inquiry.messages.find(m => m.id === msg.id);
          if (!existingMessage) {
            inquiry.messages.push({
              id: msg.id,
              sender: msg.sender_type === 'user' ? this.$t('inquiry.you') || '您' : this.$t('inquiry.salesRep') || '销售代表',
              content: msg.message,
              timestamp: new Date(msg.created_at).getTime(),
              isUser: msg.sender_type === 'user'
            });
          }
        });
        
        this.$nextTick(() => {
          if (this.$refs.chatHistory) {
            this.$refs.chatHistory.scrollTop = this.$refs.chatHistory.scrollHeight;
          }
        });
      }
    },
    
    // 滚动控制方法
    checkScrollControls() {
      const inquiryList = this.$refs.inquiryList;
      if (inquiryList) {
        this.showScrollControls = inquiryList.scrollHeight > inquiryList.clientHeight;
        this.canScrollUp = inquiryList.scrollTop > 0;
        this.canScrollDown = inquiryList.scrollTop < inquiryList.scrollHeight - inquiryList.clientHeight;
      }
    },
    
    scrollInquiryList(direction) {
      const inquiryList = this.$refs.inquiryList;
      if (inquiryList) {
        const scrollAmount = 100;
        if (direction === 'up') {
          inquiryList.scrollTop -= scrollAmount;
        } else {
          inquiryList.scrollTop += scrollAmount;
        }
        this.$nextTick(() => {
          this.checkScrollControls();
        });
      }
    },
    
    // 处理询价单Checkout事件
    handleCheckoutInquiry(inquiryId) {
      // 更新询价单状态为Checkouted
      const inquiry = this.inquiries.find(inq => inq.id === inquiryId);
      if (inquiry) {
        inquiry.status = 'Checkouted';
        // 如果当前显示的是这个询价单，也更新activeInquiry
        if (this.activeInquiry && this.activeInquiry.id === inquiryId) {
          this.activeInquiry.status = 'Checkouted';
        }
      }
    },
    
    // 切换支付状态tab
    switchPaymentTab(tab) {
      this.activeTab = tab;
      
      // 如果当前激活的询价单不在新的过滤列表中，切换到第一个可用的询价单
      const filteredInquiries = this.inquiries.filter(inquiry => {
        if (tab === 'paid') {
          return inquiry.status === 'paid';
        } else {
          return inquiry.status !== 'paid';
        }
      });
      
      if (filteredInquiries.length > 0) {
        const currentInquiryInFilter = filteredInquiries.find(inquiry => inquiry.id === this.activeInquiryId);
        if (!currentInquiryInFilter) {
          this.switchTab(filteredInquiries[0].id);
        }
      } else {
        this.activeInquiryId = null;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';

/* 询价单区域样式 */
.inquiries-section {
  margin-top: $spacing-xl;
  padding: $spacing-lg;
  background: $background-light;
  border-radius: $border-radius-md;
}

.inquiries-title {
  font-size: $font-size-2xl;
  font-weight: $font-weight-semibold;
  color: $text-primary;
  margin-bottom: $spacing-lg;
  text-align: center;
}

.inquiry-layout {
  display: flex;
  gap: $spacing-lg;
  min-height: 600px;
}

/* 询价单侧边栏 */
.inquiry-sidebar {
  flex: 0 0 220px;
  background: $white;
  border-radius: $border-radius-md;
  box-shadow: $shadow-md;
  display: flex;
  flex-direction: column;
}

.inquiry-list-header {
  padding: $spacing-md;
  border-bottom: $border-width-sm solid $border-light;
}

.add-inquiry-btn {
  width: 100%;
  padding: $spacing-sm;
  background: $info-color;
  color: $white;
  border: none;
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-xs;
  transition: $transition-base;
}

.add-inquiry-btn:hover:not(:disabled) {
  background: $info-dark;
}

.add-inquiry-btn:disabled {
  background: $gray-300;
  cursor: not-allowed;
}

.inquiry-list-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Tab切换样式 */
.inquiry-tabs {
  display: flex;
  border-bottom: $border-width-sm solid $border-light;
  background: $white;
}

.tab-btn {
  flex: 1;
  padding: $spacing-sm $spacing-md;
  background: none;
  border: none;
  color: $text-secondary;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  cursor: pointer;
  transition: $transition-base;
  border-bottom: 2px solid transparent;
}

.tab-btn:hover {
  color: $text-primary;
  background: $background-light;
}

.tab-btn.active {
  color: $info-color;
  border-bottom-color: $info-color;
  background: $white;
}

.inquiry-list {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-sm;
}

.inquiry-list-item {
  margin-bottom: $spacing-sm;
  padding: $spacing-sm;
  background: $background-light;
  border: 2px solid transparent;
  border-radius: $border-radius-md;
  cursor: pointer;
  transition: $transition-slow;
}

.inquiry-list-item:hover {
  background: $gray-200;
  border-color: $info-color;
}

.inquiry-list-item.active {
  background: $info-light;
  border-color: $info-color;
}

.inquiry-item-content {
  width: 100%;
}

.inquiry-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-xs;
}

.inquiry-item-title {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $text-primary;
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-inquiry-btn {
  background: none;
  border: none;
  color: $error-color;
  cursor: pointer;
  padding: $spacing-xs;
  border-radius: $border-radius-xs;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: $transition-base;
}

.delete-inquiry-btn:hover {
  background: rgba($error-color, 0.1);
}

.delete-inquiry-btn .material-icons {
  font-size: $font-size-lg;
}

.inquiry-item-preview {
  margin-top: $spacing-xs;
}

.inquiry-products-preview {
  display: flex;
  gap: 3px;
  align-items: center;
  flex-wrap: wrap;
}

.preview-product {
  width: 28px;
  height: 28px;
  border-radius: 3px;
  overflow: hidden;
  border: $border-width-sm solid $gray-300;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.more-products {
  font-size: $font-size-xs;
  color: $text-secondary;
  background: $gray-200;
  padding: 2px 6px;
  border-radius: $border-radius-xs;
  white-space: nowrap;
}

.no-inquiries {
  text-align: center;
  padding: $spacing-4xl $spacing-lg;
  color: $text-secondary;
}

/* 滚动控制按钮 */
.scroll-controls {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.scroll-btn {
  width: 30px;
  height: 30px;
  background: rgba($info-color, 0.8);
  color: $white;
  border: none;
  border-radius: $border-radius-full;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: $transition-base;
}

.scroll-btn:hover:not(:disabled) {
  background: rgba($info-color, 1);
}

.scroll-btn:disabled {
  background: rgba($black, 0.2);
  cursor: not-allowed;
}

.scroll-btn .material-icons {
  font-size: $font-size-lg;
}



/* 响应式设计 */
@media (max-width: $breakpoint-mobile) {
  .inquiry-layout {
    flex-direction: column;
    gap: $spacing-md;
  }

  .inquiry-sidebar {
    flex: none;
    max-height: 300px;
  }
}
</style>