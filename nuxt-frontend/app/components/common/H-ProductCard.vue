<template>
  <div class="product-cards-wrapper">
    <!-- 桌面端表格显示 -->
    <div v-if="!forceCardView" class="desktop-only">
      <el-table :data="items" class="product-table" :stripe="tableStripe" :size="tableSize">
        <el-table-column :label="$t('common.product') || '商品'" min-width="200">
          <template #default="{row}">
            <div class="product-info">
              <div class="product-image">
                <img :src="row.image_url || '/images/default-image.svg'" :alt="row.product_name">
              </div>
              <div class="product-details">
                <div class="product-name">{{ row.product_name }}</div>
                <div class="product-code">{{ productCodeLabel }}: {{ getProductCode(row) }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.quantity') || '数量'" prop="quantity" width="100" align="center" />
        <el-table-column :label="$t('common.unitPrice') || '单价'" width="120" align="right">
          <template #default="{row}">
            <slot name="unit-price" :row="row">
              ${{ getUnitPrice(row) }}
            </slot>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.subtotal') || '小计'" width="120" align="right">
          <template #default="{row}">
            <slot name="subtotal" :row="row">
              <span class="subtotal-price">${{ getSubtotal(row) }}</span>
            </slot>
          </template>
        </el-table-column>
        <!-- 额外的列插槽 -->
        <slot name="extra-columns" />
      </el-table>
    </div>

    <!-- 手机端卡片显示 -->
    <div :class="forceCardView ? 'card-view' : 'mobile-only'">
      <div class="product-cards">
        <div v-for="item in items" :key="getItemKey(item)" class="product-card">
          <div class="product-card-left">
            <div class="product-image">
              <img :src="item.image_url || '/images/default-image.svg'" :alt="item.product_name">
            </div>
          </div>
          <div class="product-card-right">
            <div class="product-info-top">
              <div class="product-name">{{ item.product_name }}</div>
              <div class="product-code">{{ productCodeLabel }}: {{ getProductCode(item) }}</div>
              <div v-if="item.product_type" class="product-type">{{ item.product_type }}</div>
              <!-- 额外信息插槽 -->
              <slot name="extra-info" :item="item" />
            </div>
            <div class="product-price-row">
              <slot name="price-row" :item="item">
                <span class="price-calc">${{ getUnitPrice(item) }} × {{ item.quantity }}</span>
                <span class="subtotal">${{ getSubtotal(item) }}</span>
              </slot>
            </div>
            <!-- 额外操作插槽 -->
            <slot name="extra-actions" :item="item" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProductCards',
  props: {
    // 商品数据
    items: {
      type: Array,
      required: true,
      default: () => []
    },
    // 强制使用卡片视图（即使在桌面端）
    forceCardView: {
      type: Boolean,
      default: false
    },
    // 表格条纹
    tableStripe: {
      type: Boolean,
      default: true
    },
    // 表格大小
    tableSize: {
      type: String,
      default: 'default'
    },
    // 产品编号标签
    productCodeLabel: {
      type: String,
      default: '产品类型'
    },
    // 单价字段名
    priceField: {
      type: String,
      default: 'price'
    },
    // 数量字段名
    quantityField: {
      type: String,
      default: 'quantity'
    },
    // 产品编号字段名
    productCodeField: {
      type: String,
      default: 'category_name'
    },
    // 唯一键字段名
    keyField: {
      type: String,
      default: 'id'
    }
  },
  methods: {
    getUnitPrice(item) {
      const price = item[this.priceField];
      return typeof price === 'number' ? price.toFixed(2) : (price || '0.00');
    },
    getSubtotal(item) {
      const price = parseFloat(item[this.priceField] || 0);
      const quantity = parseInt(item[this.quantityField] || 0);
      return (price * quantity).toFixed(2);
    },
    getProductCode(item) {
      return item[this.productCodeField] || item.product_code || 'N/A';
    },
    getItemKey(item) {
      return item[this.keyField] || item.id;
    }
  }
}
</script>

<style lang="scss" scoped>
@use '~/assets/styles/_mixins.scss' as *;
@use '~/assets/styles/_variables.scss' as *;

.product-cards-wrapper {
  width: 100%;
}

// 桌面端表格样式
.desktop-only {
  @media (max-width: $breakpoint-mobile) {
    display: none;
  }
}

.mobile-only {
  display: none;

  @media (max-width: $breakpoint-mobile) {
    display: block;
  }
}

.card-view {
  display: block;
}

.product-table {
  .product-info {
    display: flex;
    align-items: center;
    gap: $spacing-md;

    .product-image {
      width: $product-image-size-sm;
      height: $product-image-size-sm;
      border-radius: $border-radius-sm;
      overflow: hidden;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .product-details {
      flex: 1;
      min-width: 0;

      .product-name {
        font-weight: $font-weight-semibold;
        color: $text-primary;
        margin-bottom: $spacing-xs;
        font-size: $font-size-sm;
        line-height: $line-height-tight;
      }

      .product-code {
        font-size: $font-size-xs;
        color: $text-muted;
      }
    }
  }

  .subtotal-price {
    font-weight: $font-weight-semibold;
    color: $info-color;
  }
}

// 手机端卡片样式
.product-cards {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.product-card {
  display: flex;
  align-items: flex-start;
  gap: $spacing-md;
  padding: $spacing-md;
  background: $white;
  border: $border-width-sm solid $border-color;
  border-radius: $border-radius-md;
  box-shadow: $shadow-sm;
  transition: $transition-base;

  &:hover {
    box-shadow: $shadow-md;
  }
}

.product-card-left {
  width: $product-thumbnail-size + 24px;
  flex-shrink: 0;
}

.product-card-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  max-width: calc(100% - #{$product-thumbnail-size + 36px});
  min-width: 0;
}

.product-image {
  width: $product-thumbnail-size + 24px;
  height: $product-thumbnail-size + 24px;
  border-radius: $border-radius-sm;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.product-info-top {
  margin-bottom: $spacing-sm;
}

.product-name {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  line-height: $line-height-tight;
  margin-bottom: $spacing-xs;
  color: $text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.product-code {
  font-size: $font-size-xs;
  color: $text-secondary;
  margin-bottom: $spacing-2xs;
}

.product-type {
  font-size: $font-size-xs - 1px;
  color: $text-muted;
  font-style: italic;
}

.product-price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: $font-size-sm;

  .price-calc {
    color: $text-secondary;
    font-size: $font-size-sm - 1px;
  }

  .subtotal {
    color: $info-color;
    font-weight: $font-weight-semibold;
    font-size: $font-size-sm;
  }
}

// 响应式调整
@media (max-width: $mobile-breakpoint-sm) {
  .product-card {
    padding: $spacing-md;
    gap: $spacing-sm;
  }

  .product-card-left {
    width: $product-thumbnail-size;
  }

  .product-card-right {
    max-width: calc(100% - #{$product-thumbnail-size + $spacing-sm});
  }

  .product-image {
    width: $product-thumbnail-size;
    height: $product-thumbnail-size;
  }

  .product-name {
    font-size: $font-size-sm - 1px;
  }

  .product-code {
    font-size: $font-size-xs - 1px;
  }

  .product-price-row {
    font-size: $font-size-sm - 1px;

    .price-calc {
      font-size: $font-size-xs;
    }

    .subtotal {
      font-size: $font-size-sm - 1px;
    }
  }
}
</style>