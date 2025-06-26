<template>
  把 <div class="orders-page">
    <PageBanner :title="$t('orders.title') || '我的订单'" />

    <!-- Navigation Menu -->
    <NavigationMenu :breadcrumb-items="breadcrumbItems" />

    <div class="container mx-auto px-4">
      <div class="orders-content" v-loading="loading">
        <div v-if="orders.length > 0" class="orders-list">
          <el-table :data="orders" style="width: 100%" v-loading="loading" @row-click="handleRowClick"
            class="clickable-table">
            <el-table-column prop="id" :label="$t('orders.orderNumber') || 'Order Number'" width="200">
              <template #default="scope">
                <span class="order-number">{{ scope.row.id }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('orders.orderDate') || '下单时间'" width="260">
              <template #default="{row}">
                <span class="order-date">{{ formatDate(row.created_at) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('orders.totalAmount') || '订单金额'" width="220">
              <template #default="{row}">
                <span class="order-amount">¥{{ formatPrice(row.total_amount) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('orders.status') || '订单状态'" width="200">
              <template #default="{row}">
                <el-tag :type="getStatusType(row.status)" class="status-tag">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="$t('orders.paymentMethod') || '支付方式'">
              <template #default="{row}">
                <span class="payment-method">{{ getPaymentMethodText(row.payment_method) }}</span>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-container">
            <el-pagination @current-change="handlePageChange" :current-page="currentPage" :page-size="pageSize"
              layout="total, prev, pager, next, jumper" :total="total" class="modern-pagination">
            </el-pagination>
          </div>
        </div>

        <div v-else class="empty-orders">
          <el-empty :description="$t('orders.noOrders') || '您还没有订单'">
            <el-button type="primary" @click="$router.push('/products')">{{ $t('orders.goShopping') || '去购物'
              }}</el-button>
          </el-empty>
        </div>
      </div>
    </div>


  </div>
</template>

<script>
import { formatPrice } from '../utils/format';
import PageBanner from '@/components/common/PageBanner.vue';
import NavigationMenu from '@/components/common/NavigationMenu.vue';

export default {
  name: 'UserOrdersPage',
  components: {
    PageBanner,
    NavigationMenu
  },
  data() {
    return {
      loading: false,
      orders: [],
      total: 0,
      currentPage: 1,
      pageSize: 10
    };
  },
  computed: {
    breadcrumbItems() {
      return [
        { text: this.$t('orders.title') || '我的订单' }
      ];
    }
  },
  created() {
    this.fetchOrders();
  },
  methods: {
    formatPrice,
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    },
    getStatusText(status) {
      const statusMap = {
        'pending': this.$t('orders.status.pending') || '待支付',
        'paid': this.$t('orders.status.paid') || '已支付',
        'shipped': this.$t('orders.status.shipped') || '已发货',
        'delivered': this.$t('orders.status.delivered') || '已送达',
        'cancelled': this.$t('orders.status.cancelled') || '已取消'
      };
      return statusMap[status] || status;
    },
    getStatusType(status) {
      const typeMap = {
        'pending': 'warning',
        'paid': 'success',
        'shipped': 'primary',
        'delivered': 'success',
        'cancelled': 'danger'
      };
      return typeMap[status] || 'info';
    },
    getPaymentMethodText(method) {
      const methodMap = {
        'card': this.$t('orders.payment.card') || '信用卡支付',
        'alipay': this.$t('orders.payment.alipay') || '支付宝',
        'wechat': this.$t('orders.payment.wechat') || '微信支付',
        'paypal': this.$t('orders.payment.paypal') || 'PayPal'
      };
      return methodMap[method] || method;
    },
    getLogisticsIconType(status) {
      const typeMap = {
        'processing': 'warning',
        'shipped': 'primary',
        'delivered': 'success'
      };
      return typeMap[status] || 'info';
    },
    async fetchOrders() {
      if (!this.$store.getters.isLoggedIn) {
        this.$router.push('/login?redirect=/user/orders');
        return;
      }

      this.loading = true;
      try {
        const response = await this.$api.get('/orders', {
          params: {
            page: this.currentPage,
            pageSize: this.pageSize
          }
        });
        if (response.success) {
          this.orders = response.data.list;
          this.total = response.data.total;
        }
      } catch (error) {
        console.error('获取订单列表失败:', error);
        this.$messageHandler.showError(error, 'orders.error.fetchFailed');
      } finally {
        this.loading = false;
      }
    },
    handlePageChange(page) {
      this.currentPage = page;
      this.fetchOrders();
    },
    handleRowClick(row) {
      // 点击行时查看订单详情
      this.$router.push({
        path: '/unified-checkout',
        query: { orderId: row.id }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
@import '../assets/styles/variables';
@import '../assets/styles/mixins';

.orders-page {
  min-height: 100vh;
  background-color: $gray-100;
}

.container {
  @include container;
}

.orders-content {
  @include card;
  border: 1px solid $gray-200;
}

.pagination-container {
  margin-top: $spacing-2xl;
  text-align: center;
}

/* 表格内容样式 */
.order-number {
  font-weight: $font-weight-semibold;
  color: $primary-color;
  font-size: $font-size-md;
}

.order-date {
  color: $text-secondary;
  font-size: $font-size-md;
}

.order-amount {
  font-weight: $font-weight-semibold;
  color: $success-color;
  font-size: $font-size-md;
}

.payment-method {
  color: $text-primary;
  font-size: $font-size-md;
}

.status-tag {
  font-weight: $font-weight-medium;
  font-size: $font-size-sm;
}

/* 可点击表格样式 */
.clickable-table {
  :deep(.el-table__row) {
    cursor: pointer;
    transition: background-color 0.2s ease;
    height: 48px; // 减少行高

    &:hover {
      background-color: $gray-50 !important;
    }
  }

  :deep(.el-table__cell) {
    padding: $spacing-sm $spacing-md; // 减少单元格内边距
  }

  :deep(.el-table__header) {
    .el-table__cell {
      background-color: $gray-50;
      font-weight: $font-weight-semibold;
      color: $text-primary;
      padding: $spacing-sm $spacing-md;
    }
  }
}

.order-detail {
  max-height: $modal-max-height;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: $spacing-2xl;
  padding-bottom: $spacing-xl;
  border-bottom: 1px solid $gray-200;

  &:last-child {
    border-bottom: none;
  }

  h3 {
    color: $gray-800;
    margin-bottom: $spacing-lg;
    font-size: $font-size-xl;
    font-weight: $font-weight-semibold;
  }
}

.detail-item {
  display: flex;
  margin-bottom: $spacing-md;
  align-items: center;

  .label {
    width: $spacing-5xl;
    color: $gray-500;
    font-weight: $font-weight-medium;
    flex-shrink: 0;
  }

  .value {
    color: $gray-800;
    flex: 1;

    &.price {
      color: $red-600;
      font-weight: $font-weight-bold;
      font-size: $font-size-lg;
    }
  }
}

.logistics-location {
  color: $gray-400;
  font-size: $font-size-sm;
  margin-top: $spacing-xs;
}

.empty-orders {
  padding: $spacing-5xl 0;
}

/* 响应式设计 */
@include mobile {
  .container {
    padding: $spacing-xl $spacing-sm;
  }

  .orders-content {
    padding: $spacing-xl;
    border-radius: $border-radius-md;
  }

  .pagination-container {
    margin-top: $spacing-xl;
  }

  :deep(.el-table) {
    font-size: $font-size-sm;
  }

  :deep(.el-table th) {
    padding: $spacing-md $spacing-sm;
    font-size: $font-size-md;
  }

  :deep(.el-table td) {
    padding: $spacing-md $spacing-sm;
    font-size: $font-size-sm;
  }

  .order-number,
  .order-date,
  .order-amount,
  .payment-method {
    font-size: $font-size-sm;
  }

  .action-btn {
    font-size: $font-size-xs;
    padding: $spacing-xs $spacing-sm;
  }

  :deep(.modern-pagination) {

    .el-pagination__total,
    .el-pagination__jump {
      font-size: $font-size-sm;
    }
  }
}

/* Element UI 表格样式优化 */
:deep(.el-table) {
  border-radius: $border-radius-md;
  overflow: hidden;
  box-shadow: $shadow-sm;
}

:deep(.el-table th) {
  background-color: $gray-100;
  color: $text-primary;
  font-weight: $font-weight-semibold;
  border-bottom: $table-header-border-width solid $primary-color;
  font-size: $font-size-lg;
  padding: $spacing-lg $spacing-md;
}

:deep(.el-table td) {
  border-bottom: $table-border-width solid $gray-200;
  padding: $spacing-lg $spacing-md;
  font-size: $font-size-md;
}

:deep(.el-table tr:hover > td) {
  background-color: $gray-50;
}

:deep(.el-button--primary) {
  background-color: $primary-color;
  border-color: $primary-color;
  font-size: $font-size-md;
  padding: $spacing-md $spacing-lg;
  font-weight: $font-weight-medium;
  border-radius: $border-radius-md;
  transition: $transition-base;

  &:hover {
    background-color: $primary-dark;
    border-color: $primary-dark;
    transform: translateY($hover-transform-sm);
    box-shadow: 0 2px 8px rgba($primary-color, 0.3);
  }
}

/* 现代化分页样式 */
:deep(.modern-pagination) {
  .el-pagination__total {
    color: $text-secondary;
    font-size: $font-size-md;
    font-weight: $font-weight-medium;
  }

  .el-pager li {
    background-color: $white;
    border: 1px solid $gray-300;
    color: $text-primary;
    font-weight: $font-weight-medium;
    margin: 0 2px;
    border-radius: $border-radius-sm;
    transition: $transition-base;

    &:hover {
      background-color: $primary-light;
      border-color: $primary-color;
      color: $primary-color;
    }

    &.is-active {
      background-color: $primary-color;
      border-color: $primary-color;
      color: $white;
    }
  }

  .btn-prev,
  .btn-next {
    background-color: $white;
    border: 1px solid $gray-300;
    color: $text-primary;
    border-radius: $border-radius-sm;
    transition: $transition-base;

    &:hover {
      background-color: $primary-light;
      border-color: $primary-color;
      color: $primary-color;
    }
  }

  .el-pagination__jump {
    color: $text-secondary;
    font-size: $font-size-md;

    .el-input__inner {
      border-radius: $border-radius-sm;
      border-color: $gray-300;
      transition: $transition-base;

      &:focus {
        border-color: $primary-color;
        box-shadow: 0 0 0 2px rgba($primary-color, 0.2);
      }
    }
  }
}

:deep(.el-tag--success) {
  background-color: $success-light;
  color: $success-dark;
  border-color: $success-color;
}

:deep(.el-tag--warning) {
  background-color: $warning-light;
  color: $warning-dark;
  border-color: $warning-color;
}

:deep(.el-tag--danger) {
  background-color: $error-light;
  color: $error-dark;
  border-color: $error-color;
}

:deep(.el-tag--info) {
  background-color: $info-light;
  color: $info-dark;
  border-color: $info-color;
}
</style>