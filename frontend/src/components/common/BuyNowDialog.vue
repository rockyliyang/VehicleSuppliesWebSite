<template>
  <div v-if="visible" class="buy-now-dialog-overlay" @click="handleClose">
    <div class="buy-now-dialog" @click.stop>
      <div class="buy-now-header">
        <h3 class="buy-now-title">{{ $t('productDetail.buyNow.title') || '立即购买' }}</h3>
        <button class="buy-now-close" @click="handleClose">
          <el-icon>
            <Close />
          </el-icon>
        </button>
      </div>

      <div class="buy-now-content">
        <!-- 商品信息 -->
        <div class="product-summary">
          <div class="product-image-small">
            <img :src="product.thumbnail_url || require('@/assets/images/default-image.svg')" :alt="product.name">
          </div>
          <div class="product-info-small">
            <div class="product-name-small">{{ product.name }}</div>
            <div class="product-code-small">{{ $t('productDetail.productCode') }}: {{ product.product_code }}</div>
          </div>
        </div>

        <!-- 数量选择 -->
        <div class="quantity-section">
          <label class="quantity-label">{{ $t('productDetail.quantity') || '数量' }}:</label>
          <el-input-number v-model="quantity" :min="1" :max="maxQuantity" size="default" controls-position="right"
            @change="calculatePrice">
          </el-input-number>
        </div>

        <!-- 价格显示 -->
        <div class="price-section">
          <div class="price-breakdown">
            <div class="unit-price">
              <span class="price-label">{{ $t('productDetail.buyNow.unitPrice') || '单价' }}:</span>
              <span class="price-value">{{ $store.getters.formatPrice(unitPrice) }}</span>
            </div>
            <div class="total-price">
              <span class="price-label">{{ $t('productDetail.buyNow.totalPrice') || '总价' }}:</span>
              <span class="price-value total">{{ $store.getters.formatPrice(totalPrice) }}</span>
            </div>
          </div>
        </div>

        <!-- 阶梯价格提示 -->
        <div v-if="product.price_ranges && product.price_ranges.length > 0" class="tier-price-hint">
          <div class="tier-price-title">{{ $t('productDetail.buyNow.tierPrices') || '阶梯价格' }}:</div>
          <div class="tier-price-list">
            <div v-for="(range, index) in product.price_ranges" :key="index" class="tier-price-item">
              <span class="tier-quantity">
                <span v-if="range.max_quantity !== null && range.max_quantity !== undefined">
                  {{ range.min_quantity }} - {{ range.max_quantity }} {{ $t('productDetail.buyNow.pieces') || 'pieces'
                  }}
                </span>
                <span v-else>
                  >= {{ range.min_quantity }} {{ $t('productDetail.buyNow.pieces') || 'pieces' }}
                </span>
              </span>
              <span class="tier-price">{{ $store.getters.formatPrice(range.price) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="buy-now-footer">
        <el-button type="primary" @click="proceedToCheckout" :loading="processingCheckout">
          {{ processingCheckout ? ($t('productDetail.buyNow.processing') || '处理中...') :
          ($t('productDetail.buyNow.checkout') || '结算') }}
        </el-button>
        <el-button @click="handleClose">{{ $t('common.cancel') || '取消' }}</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { Close } from '@element-plus/icons-vue'

export default {
  name: 'BuyNowDialog',
  components: {
    Close
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    product: {
      type: Object,
      required: true
    },
    initialQuantity: {
      type: Number,
      default: 1
    }
  },
  emits: ['update:modelValue', 'checkout'],
  data() {
    return {
      quantity: 1,
      processingCheckout: false
    }
  },
  computed: {
    visible: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    },
    unitPrice() {
      return this.calculateUnitPrice(this.quantity)
    },
    totalPrice() {
      return this.unitPrice * this.quantity
    },
    maxQuantity() {
      // 如果商品类型是自营商品，需要检查库存限制
      if (this.product.productType === 'self_operated') {
        return this.product.stock || 999999
      }
      // 其他类型商品没有库存限制
      return 999999
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.quantity = this.initialQuantity
      }
    },
    initialQuantity(newVal) {
      this.quantity = newVal
    }
  },
  methods: {
    calculateUnitPrice(quantity) {
      // 如果有阶梯价格，根据数量计算单价
      if (this.product.price_ranges && this.product.price_ranges.length > 0) {
        // 按最小数量排序
        const sortedRanges = [...this.product.price_ranges].sort((a, b) => a.min_quantity - b.min_quantity)
        
        for (let i = sortedRanges.length - 1; i >= 0; i--) {
          const range = sortedRanges[i]
          if (quantity >= range.min_quantity) {
            // 如果有最大数量限制，检查是否在范围内
            if (range.max_quantity === null || range.max_quantity === undefined || quantity <= range.max_quantity) {
              return parseFloat(range.price)
            }
          }
        }
        
        // 如果没有匹配的阶梯价格，使用第一个价格
        return parseFloat(sortedRanges[0].price)
      }
      
      // 如果没有阶梯价格，使用默认价格
      return parseFloat(this.product.price)
    },
    
    calculatePrice() {
      // 触发计算，computed会自动更新
    },
    
    async proceedToCheckout() {
      try {
        this.processingCheckout = true
        
        // 构造符合UnifiedCheckout期望格式的数据
        const checkoutData = {
          id: this.product.id,
          product_id: this.product.id,
          product_code: this.product.product_code,
          name: this.product.name,
          image_url: this.product.thumbnail_url || this.product.image_url,
          quantity: this.quantity,
          price: this.unitPrice,
          calculatedPrice: this.unitPrice,
          selected: true
        }
        
        this.$emit('checkout', checkoutData)
        
      } catch (error) {
        console.error('结算失败:', error)
        this.$message.error(this.$t('productDetail.buyNow.checkoutError') || '结算失败，请重试')
      } finally {
        this.processingCheckout = false
      }
    },
    
    handleClose() {
      this.visible = false
      this.processingCheckout = false
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';
@import '@/assets/styles/_mixins.scss';

.buy-now-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.buy-now-dialog {
  background: $white;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-xl;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;

  .buy-now-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-lg;
    border-bottom: 1px solid $border-color;

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
      transition: $transition-base;

      &:hover {
        background-color: $gray-100;
        color: $text-primary;
      }
    }
  }

  .buy-now-content {
    padding: $spacing-lg;

    .product-summary {
      display: flex;
      gap: $spacing-md;
      margin-bottom: $spacing-lg;
      padding: $spacing-md;
      background-color: $gray-50;
      border-radius: $border-radius-md;

      .product-image-small {
        width: 80px;
        height: 80px;
        flex-shrink: 0;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: $border-radius-sm;
        }
      }

      .product-info-small {
        flex: 1;

        .product-name-small {
          font-size: $font-size-lg;
          font-weight: $font-weight-semibold;
          color: $text-primary;
          margin-bottom: $spacing-xs;
          @include text-ellipsis-multiline(2);
        }

        .product-code-small {
          font-size: $font-size-sm;
          color: $text-secondary;
        }
      }
    }

    .quantity-section {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      margin-bottom: $spacing-lg;

      .quantity-label {
        font-weight: $font-weight-medium;
        color: $text-primary;
        min-width: 60px;
      }
    }

    .price-section {
      margin-bottom: $spacing-lg;

      .price-breakdown {
        background-color: $gray-50;
        padding: $spacing-md;
        border-radius: $border-radius-md;

        .unit-price,
        .total-price {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: $spacing-sm;

          &:last-child {
            margin-bottom: 0;
          }

          .price-label {
            font-weight: $font-weight-medium;
            color: $text-primary;
          }

          .price-value {
            font-size: $font-size-lg;
            font-weight: $font-weight-semibold;
            color: $primary-color;

            &.total {
              font-size: $font-size-xl;
              color: $success-color;
            }
          }
        }

        .total-price {
          border-top: 1px solid $border-color;
          padding-top: $spacing-sm;
          margin-top: $spacing-sm;
          margin-bottom: 0;
        }
      }
    }

    .tier-price-hint {
      .tier-price-title {
        font-weight: $font-weight-semibold;
        color: $text-primary;
        margin-bottom: $spacing-sm;
      }

      .tier-price-list {
        background-color: $gray-50;
        padding: $spacing-md;
        border-radius: $border-radius-md;

        .tier-price-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: $spacing-xs;

          &:last-child {
            margin-bottom: 0;
          }

          .tier-quantity {
            font-size: $font-size-sm;
            color: $text-secondary;
          }

          .tier-price {
            font-weight: $font-weight-medium;
            color: $primary-color;
          }
        }
      }
    }
  }

  .buy-now-footer {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-sm;
    padding: $spacing-lg;
    border-top: 1px solid $border-color;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .buy-now-dialog {
    width: 95%;
    margin: $spacing-md;

    .buy-now-header {
      padding: $spacing-md;

      .buy-now-title {
        font-size: $font-size-lg;
      }
    }

    .buy-now-content {
      padding: $spacing-md;

      .product-summary {
        .product-image-small {
          width: 60px;
          height: 60px;
        }

        .product-info-small {
          .product-name-small {
            font-size: $font-size-base;
          }
        }
      }

      .quantity-section {
        flex-direction: column;
        align-items: flex-start;
        gap: $spacing-sm;

        .quantity-label {
          min-width: auto;
        }
      }
    }

    .buy-now-footer {
      padding: $spacing-md;
      flex-direction: column;
      gap: $spacing-sm;

      .el-button {
        width: 100%;
        margin: 0;
      }
    }
  }
}
</style>