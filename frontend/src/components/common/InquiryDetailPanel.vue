<template>
  <div class="inquiry-detail-panel">
    <div v-if="inquiry" class="inquiry-detail-content">
      <!-- Inquiry Items -->
      <div class="inquiry-items-section">
        <h4 class="section-title">{{ $t('cart.inquiryItems') || '询价商品' }}</h4>
        <div class="inquiry-items">
          <div v-for="item in inquiry.items" :key="item.productId" class="inquiry-item"
            :data-product-id="item.productId">
            <!-- 第一行：图片和商品名 -->
            <div class="item-row-1">
              <img :src="item.imageUrl" :alt="item.name" class="item-image">
              <div class="item-details">
                <p class="item-name">{{ item.name }}</p>
                <p class="item-code">{{ $t('cart.productCode') || '产品编号' }}: {{ item.productId }}</p>
              </div>
            </div>
            <!-- 第二行：数量、单价和删除按钮 -->
            <div class="item-row-2">
              <div class="item-controls">
                <div class="control-group">
                  <label class="control-label">{{ $t('cart.quantity') || '数量' }}</label>
                  <input type="number" class="control-input" v-model="item.quantity" min="1" readonly>
                </div>
                <div class="control-group">
                  <label class="control-label">{{ $t('cart.unitPrice') || '期望价格' }}</label>
                  <input type="number" class="control-input" v-model="item.unit_price" step="0.01" placeholder="0.00"
                    readonly>
                </div>
              </div>
              <div class="item-actions">
                <button class="remove-item-btn remove-inquiry-item-btn"
                  @click="$emit('remove-item', inquiry.id, item.id, item.productId)" :data-product-id="item.productId"
                  :title="$t('cart.removeFromInquiry') || '从询价单中移除'">
                  <i class="material-icons">remove_circle_outline</i>
                </button>
              </div>
            </div>
          </div>
          <p v-if="inquiry.items.length === 0" class="no-items-message">
            {{ $t('cart.noItemsInInquiry') || '此询价单中没有商品，请从购物车添加商品。' }}
          </p>
        </div>
      </div>

      <!-- Sales Communication -->
      <CommunicationSection
        :messages="inquiry.messages"
        :inquiry-id="inquiry.id"
        :items-count="inquiry.items.length"
        :status="inquiry.status"
        :initial-message="newMessage"
        @send-message="handleSendMessage"
        @update-message="updateMessage"
        @checkout="handleCheckout"
      />
    </div>

    <div v-else class="no-inquiry-selected">
      <div class="no-inquiry-content">
        <i class="material-icons">assignment</i>
        <p>{{ $t('cart.selectInquiry') || '请选择一个询价单查看详情' }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import CommunicationSection from './CommunicationSection.vue';

export default {
  name: 'InquiryDetailPanel',
  components: {
    CommunicationSection
  },
  props: {
    inquiry: {
      type: Object,
      default: null
    }
  },
  emits: ['remove-item', 'send-message', 'update-message', 'checkout-inquiry'],
  data() {
    return {
      newMessage: ''
    };
  },
  watch: {
    inquiry: {
      handler(newInquiry) {
        if (newInquiry && newInquiry.newMessage !== undefined) {
          this.newMessage = newInquiry.newMessage;
        }
      },
      immediate: true
    }
  },
  methods: {
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    handleSendMessage(inquiryId, message) {
      this.$emit('send-message', inquiryId, message);
      this.newMessage = '';
    },
    updateMessage(inquiryId, value) {
      this.newMessage = value;
      this.$emit('update-message', inquiryId, value);
    },
    handleCheckout(inquiryId) {
      const inquiry = inquiryId ? this.inquiry : this.inquiry;
      if (inquiry && inquiry.items.length > 0) {
        // 将询价单商品转换为购物车格式，确保字段名称与UnifiedCheckout期望的格式一致
        const cartItems = this.inquiry.items.map(item => ({
          id: item.id,
          product_id: item.productId,
          product_code: item.product_code || '',
          name: item.name,
          image_url: item.imageUrl || require('@/assets/images/default-image.svg'),
          quantity: item.quantity,
          price: item.unit_price || 0, // UnifiedCheckout期望的是price字段，不是unit_price
          selected: true
        }));
        
        // 为每个商品添加inquiry_id标识，用于UnifiedCheckout识别订单来源
        const cartItemsWithInquiry = cartItems.map(item => ({
          ...item,
          inquiry_id: this.inquiry.id
        }));
        
        // 将商品数据存储到sessionStorage，供UnifiedCheckout页面使用
        sessionStorage.setItem('selectedCartItems', JSON.stringify(cartItemsWithInquiry));
        
        // 发出checkout事件，更新询价单状态为Checkouted
        this.$emit('checkout-inquiry', this.inquiry.id);
        
        // 跳转到UnifiedCheckout页面，并传递inquiryId参数
        this.$router.push({
          name: 'UnifiedCheckout',
          query: { inquiryId: this.inquiry.id }
        });
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';

/* 询价详情面板 */
.inquiry-detail-panel {
  flex: 1;
  background: $white;
  border-radius: $border-radius-md;
  box-shadow: $shadow-md;
  display: flex;
  flex-direction: column;
}

.inquiry-detail-content {
  padding: $spacing-lg;
  height: 100%;
  display: flex;
  flex-direction: row;
  gap: $spacing-lg;
}

.section-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-semibold;
  color: $text-primary;
  margin-bottom: $spacing-md;
  padding-bottom: $spacing-sm;
  border-bottom: $border-width-md solid $info-color;
}

/* 询价商品区域 */
.inquiry-items-section {
  flex: 0 0 45%;
  display: flex;
  flex-direction: column;
}

.inquiry-items {
  flex: 1;
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: $spacing-md;
  padding-bottom: $spacing-md;
}

.inquiry-item {
  background: $background-light;
  border: $border-width-sm solid $border-light;
  border-radius: $border-radius-md;
  padding: $spacing-md;
  margin-bottom: $spacing-sm;
  transition: $transition-slow;
}

.inquiry-item:hover {
  box-shadow: $shadow-md;
}

.item-row-1 {
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;
  margin-bottom: $spacing-sm;
}

.item-image {
  width: $product-thumbnail-size;
  height: $product-thumbnail-size;
  object-fit: cover;
  border-radius: $border-radius-sm;
  border: $border-width-sm solid $gray-300;
}

.item-details {
  flex: 1;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: $text-primary;
  margin: 0 0 $spacing-xs 0;
  line-height: $line-height-tight;
}

.item-code {
  font-size: $font-size-xs;
  color: $text-secondary;
  margin: 0;
}

.item-row-2 {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.item-controls {
  display: flex;
  gap: $spacing-md;
  flex: 1;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.control-label {
  font-size: $font-size-xs;
  color: $text-secondary;
  font-weight: $font-weight-medium;
}

.control-input {
  width: 80px;
  padding: $spacing-sm $spacing-sm;
  border: $border-width-sm solid $gray-300;
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;
  background: $background-light;
}

.item-actions {
  display: flex;
  align-items: center;
}

.remove-item-btn {
  background: none;
  border: none;
  color: $error-color;
  cursor: pointer;
  padding: $spacing-sm;
  border-radius: $border-radius-full;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: $transition-base;
}

.remove-item-btn:hover {
  background: rgba($error-color, 0.1);
}

.remove-item-btn .material-icons {
  font-size: $font-size-xl;
}

.no-items-message {
  text-align: center;
  color: $text-secondary;
  font-style: italic;
  padding: $spacing-4xl $spacing-lg;
  margin: 0;
}

/* Action按钮区域 */
.action-buttons-section {
  display: flex;
  gap: $spacing-sm;
  align-items: center;
  padding: $spacing-sm 0;
  border-top: $border-width-sm solid $border-light;
  margin-top: $spacing-sm;
}

.checkout-btn {
  padding: $spacing-md $spacing-lg;
  background: $success-color;
  color: $white;
  border: none;
  border-radius: $border-radius-sm;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  transition: $transition-base;
  min-height: 44px;
  flex: 1;
}

.checkout-btn:hover:not(:disabled) {
  background: $success-dark;
  transform: translateY($hover-transform-sm);
}

.checkout-btn:disabled {
  background: $gray-500;
  cursor: not-allowed;
  transform: none;
}

.checkout-btn.checkouted {
  background: $info-color;
  color: $white;
}

.checkout-btn.checkouted:disabled {
  background: $info-color;
  opacity: 0.8;
}

.checkout-btn .material-icons {
  font-size: $font-size-xl;
}



/* 无选中询价单状态 */
.no-inquiry-selected {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-secondary;
}

.no-inquiry-content {
  text-align: center;
}

.no-inquiry-content .material-icons {
  font-size: $spacing-5xl;
  color: $gray-300;
  margin-bottom: $spacing-sm;
}

.no-inquiry-content p {
  font-size: $font-size-xl;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: $breakpoint-mobile) {
  .inquiry-detail-content {
    padding: $spacing-md;
  }

  .item-row-2 {
    flex-direction: column;
    gap: $spacing-sm;
    align-items: stretch;
  }

  .item-controls {
    justify-content: space-between;
  }

  .control-input {
    width: 100px;
  }
}
</style>