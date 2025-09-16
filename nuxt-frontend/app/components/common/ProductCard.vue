<template>
  <div class="product-card" :class="cardStyleClass" @click="handleCardClick">
    <div class="product-image">
      <img :src="product.thumbnail_url" :alt="product.name" @error="handleImageError"
        class="w-full h-full object-cover object-center">
    </div>
    <div class="product-info">
      <h3 class="product-title" @click.stop="handleTitleClick">{{ product.name }}</h3>
      <p v-if="showDescription" class="product-description">{{ product.description || defaultDescription }}</p>
      <div class="product-footer">
        <span class="product-price">{{ displayPrice }}</span>
        <div class="product-footer-right">
          <span v-if="product.promo_message" class="promo-message">{{ product.promo_message }}</span>
          <span v-if="showArrow" class="product-arrow">
            <i class="fas fa-arrow-right"></i>
          </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div v-if="showActionButtons" class="action-buttons">
        <el-button type="primary" size="small" @click.stop="handleChatNow" class="chat-btn">
          <i class="fas fa-comments"></i>
          <span class="button-text">{{ $t('product.inquiry') || 'Chat Now' }}</span>
        </el-button>
        <el-button type="success" size="small" @click.stop="handleAddToCart" :loading="addingToCart" class="cart-btn">
          <i class="fas fa-shopping-cart"></i>
          <span class="button-text">{{ $t('product.addToCart') || 'Add to Cart' }}</span>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { handleImageError } from '../../utils/imageUtils';
import { useMainStore } from '~/stores/index'
import { navigateTo } from '#app'

export default {
  name: 'ProductCard',
  setup() {
    const store = useMainStore()
    return {
      store
    }
  },
  components: {
  },
  props: {
    product: {
      type: Object,
      required: true
    },
    showDescription: {
      type: Boolean,
      default: true
    },
    showArrow: {
      type: Boolean,
      default: false
    },
    defaultDescription: {
      type: String,
      default: ''
    },
    cardStyle: {
      type: String,
      default: 'default', // 'default' | 'home' | 'products'
      validator: value => ['default', 'home', 'products'].includes(value)
    },
    showActionButtons: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      addingToCart: false
    };
  },
  computed: {
    cardStyleClass() {
      return {
        'home-style': this.cardStyle === 'home',
        'products-style': this.cardStyle === 'products'
      };
    },
    displayPrice() {
      // 如果有价格范围，显示价格范围
      if (this.product.price_ranges && Array.isArray(this.product.price_ranges) && this.product.price_ranges.length > 0) {
        const prices = this.product.price_ranges.map(range => parseFloat(range.price));
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        const symbol = this.store.currencySymbol;
        
        if (minPrice === maxPrice) {
          return `${symbol}${minPrice.toFixed(2)}`;
        } else {
          return `${symbol}${minPrice.toFixed(2)} - ${symbol}${maxPrice.toFixed(2)}`;
        }
      }
      
      // 如果没有价格范围，显示默认价格
      return this.store.formatPrice(this.product.price);
    }
  },
  methods: {
    handleImageError,
    async handleCardClick() {
      this.$emit('card-click', this.product);
      await navigateTo(`/product/${this.product.id}`);
    },
    async handleTitleClick() {
      this.$emit('title-click', this.product);
      await navigateTo(`/Product/${this.product.id}`);
    },
    
    handleChatNow() {
      // 触发事件，让父组件处理询价逻辑（包括登录检查）
      this.$emit('chat-now', {
        product: this.product
      });
    },
    
    handleAddToCart() {
      if (this.addingToCart) return;
      
      // 触发事件，让父组件处理添加到购物车逻辑（包括登录检查）
      this.$emit('add-to-cart', {
        product: this.product
      });
    }
  }
}
</script>

<style lang="scss" scoped>
@use '~/assets/styles/_variables.scss' as *;
@use '~/assets/styles/_mixins.scss' as *;

/* 基础产品卡片样式 */
.product-card {
  background-color: $white;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-md;
  overflow: hidden;
  transition: $transition-base;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;

  &:hover {
    box-shadow: $shadow-xl;
    transform: translateY(-$spacing-xs);
  }
}

/* 产品图片容器 */
.product-image {
  position: relative;
  width: 100%;
  height: 16rem;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    transition: $transition-base;
  }

  .product-card:hover & img {
    transform: scale(1.05);
  }
}

/* 产品信息区域 */
.product-info {
  padding: $spacing-lg;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 产品标题 */
.product-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  margin-bottom: $spacing-sm;
  color: $text-primary;
  cursor: pointer;
  transition: $transition-base;
  line-height: $line-height-tight;
  @include text-ellipsis-multiline(2);

  &:hover {
    color: $primary-color;
  }
}

/* 产品描述 */
.product-description {
  color: $text-secondary;
  font-size: $font-size-sm;
  margin-bottom: $spacing-md;
  line-height: $line-height-relaxed;
  flex: 1;
  @include text-ellipsis-multiline(2);
}

/* 产品底部信息 */
.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-sm;
  margin-top: auto;
  margin-bottom: $spacing-md;
}

.product-footer-right {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

/* 产品价格 */
.product-price {
  font-size: $font-size-xl;
  font-weight: $font-weight-normal;
  color: $primary-color;
}

/* 促销信息 */
.promo-message {
  font-size: $font-size-xs;
  color: $error-color;
  background-color: rgba($error-color, 0.1);
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  white-space: nowrap;
}

/* 箭头图标 */
.product-arrow {
  color: $primary-color;
  font-size: $font-size-lg;
  transition: $transition-base;

  &:hover {
    color: $primary-dark;
  }
}

/* 操作按钮区域 */
.action-buttons {
  display: flex;
  gap: $spacing-sm;
  margin-top: auto;
  flex-wrap: wrap;

  .el-button {
    flex: 1;
    min-width: 0;
    font-size: $font-size-xs;
    padding: $spacing-xs $spacing-sm;
    border-radius: 8px;
    transition: all 0.2s ease;

    i {
      margin-right: $spacing-xs;
      font-size: $font-size-sm;
    }
  }

  .chat-btn {
    background-color: white;
    border: 1px solid #d1d5db;
    color: #374151;

    &:hover {
      background-color: #dc2626;
      border-color: #dc2626;
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }

  .cart-btn {
    background-color: white;
    border: 1px solid #d1d5db;
    color: #374151;

    &:hover {
      background-color: #dc2626;
      border-color: #dc2626;
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }


}

/* Home页面样式变体 */
.product-card.home-style {
  .product-image {
    aspect-ratio: 1;
    height: auto;

    img {
      object-fit: cover;
    }
  }

  .product-title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-semibold;
    color: $text-primary;
  }

  .product-description {
    font-size: $font-size-md;
    color: $text-secondary;
    line-height: $line-height-relaxed;
  }

  .product-price {
    font-size: $font-size-lg;
    font-weight: $font-weight-normal;
    color: $primary-color;
  }

  .product-arrow {
    color: $primary-color;

    i {
      font-size: $font-size-lg;
    }
  }
}

/* Products页面样式变体 */
.product-card.products-style {
  .product-image {
    aspect-ratio: 1;
    height: auto;

    img {
      object-fit: cover;
    }
  }

  .product-title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-semibold;
    color: $text-primary;
  }

  .product-description {
    font-size: $font-size-md;
    color: $text-secondary;
    line-height: $line-height-relaxed;
  }

  .product-price {
    font-size: $font-size-lg;
    font-weight: $font-weight-normal;
    color: $primary-color;
  }

  .product-arrow {
    color: $primary-color;

    i {
      font-size: $font-size-lg;
    }
  }
}

/* 响应式设计 */
@include mobile {
  .product-image {
    height: 12rem;
  }

  .product-info {
    padding: $spacing-md;
  }

  .product-title {
    font-size: $font-size-md;
  }

  .product-description {
    font-size: $font-size-xs;
  }

  .product-price {
    font-size: $font-size-lg;
  }

  .action-buttons {
    gap: $spacing-xs;

    .el-button {
      font-size: $font-size-xs;
      padding: $spacing-xs;
      min-width: 40px;
      justify-content: center;

      i {
        margin-right: 0;
        font-size: $font-size-sm;
      }

      .button-text {
        display: none; // 手机端隐藏按钮文字
      }
    }
  }
}

/* 工具类 */
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
</style>