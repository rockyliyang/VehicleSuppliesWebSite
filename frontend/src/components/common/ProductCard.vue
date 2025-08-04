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
        <span class="product-price">{{ $store.getters.formatPrice(product.price) }}</span>
        <div class="product-footer-right">
          <span v-if="product.promo_message" class="promo-message">{{ product.promo_message }}</span>
          <span v-if="showArrow" class="product-arrow">
            <i class="fas fa-arrow-right"></i>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { handleImageError } from '../../utils/imageUtils';

export default {
  name: 'ProductCard',
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
      default: 'Powerful suction with long battery life'
    },
    cardStyle: {
      type: String,
      default: 'default', // 'default' | 'home' | 'products'
      validator: value => ['default', 'home', 'products'].includes(value)
    }
  },
  computed: {
    cardStyleClass() {
      return {
        'home-style': this.cardStyle === 'home',
        'products-style': this.cardStyle === 'products'
      };
    }
  },
  methods: {
    handleImageError,
    handleCardClick() {
      this.$emit('card-click', this.product);
      this.$router.push(`/product/${this.product.id}`);
    },
    handleTitleClick() {
      this.$emit('title-click', this.product);
      this.$router.push(`/product/${this.product.id}`);
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';
@import '@/assets/styles/_mixins.scss';

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