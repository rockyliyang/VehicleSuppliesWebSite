<template>
  <div class="orders-page">
    <PageBanner :title="$t('orders.title') || '我的订单'" />

    <!-- Navigation Menu -->
    <NavigationMenu :breadcrumb-items="breadcrumbItems" />

    <div class="container mx-auto px-4">
      <div class="orders-content" v-loading="loading">
        <div v-if="orders.length > 0" class="orders-list">
          <!-- Desktop Table View -->
          <div class="desktop-only">
            <el-table :data="orders" style="width: 100%" v-loading="loading" @row-click="handleRowClick"
              class="clickable-table">
              <el-table-column prop="id" :label="$t('orders.orderNumber') || 'Order Number'" width="150">
                <template #default="scope">
                  <span class="order-number">{{ scope.row.id }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('orders.orderDate') || '下单时间'" width="280">
                <template #default="{row}">
                  <span class="order-date">{{ formatDateWithTimezone(row.created_at_local , row.create_time_zone)
                    }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('orders.totalAmount') || '订单金额'" width="150">
                <template #default="{row}">
                  <span class="order-amount">{{ $store.formatPrice(row.total_amount) }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('orders.status') || '订单状态'" width="150">
                <template #default="{row}">
                  <el-tag :type="getStatusType(row.status)" class="status-tag">{{ getStatusText(row.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column :label="$t('orders.paymentMethod') || '支付方式'">
                <template #default="{row}">
                  <span class="payment-method">{{ getPaymentMethodText(row.payment_method) }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('orders.paidDate') || '支付时间'" width="280">
                <template #default="{row}">
                  <span class="order-date">{{ row.paid_at_local ? formatDateWithTimezone(row.paid_at_local,
                    row.paid_time_zone) :
                    '-' }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- Mobile Card View -->
          <div class="mobile-only">
            <div class="orders-cards">
              <div v-for="order in orders" :key="order.id" class="order-card" @click="handleRowClick(order)">
                <div class="order-card-header">
                  <div class="order-number">{{ order.id }}</div>
                  <el-tag :type="getStatusType(order.status)" class="status-tag">{{ getStatusText(order.status)
                    }}</el-tag>
                </div>
                <div class="order-card-body">
                  <div class="order-info-row">
                    <span class="label">{{ $t('orders.orderDate') || '下单时间' }}:</span>
                    <span class="value">{{ formatDateWithTimezone(order.created_at_local || order.created_at,
                      order.create_time_zone) }}</span>
                  </div>
                  <div class="order-info-row" v-if="order.paid_at">
                    <span class="label">{{ $t('orders.paidDate') || '支付时间' }}:</span>
                    <span class="value">{{ formatDateWithTimezone(order.paid_at, order.paid_time_zone) }}</span>
                  </div>
                  <div class="order-info-row">
                    <span class="label">{{ $t('orders.totalAmount') || '订单金额' }}:</span>
                    <span class="value amount">{{ $store.formatPrice(order.total_amount) }}</span>
                  </div>
                  <div class="order-info-row">
                    <span class="label">{{ $t('orders.paymentMethod') || '支付方式' }}:</span>
                    <span class="value">{{ getPaymentMethodText(order.payment_method) }}</span>
                  </div>
                </div>
                <div class="order-card-footer">
                  <i class="el-icon-arrow-right"></i>
                </div>
              </div>
            </div>
          </div>

          <div class="pagination-container">
            <!-- Desktop Pagination -->
            <div class="desktop-only">
              <el-pagination @current-change="handlePageChange" :current-page="currentPage" :page-size="pageSize"
                layout="total, prev, pager, next, jumper" :total="total" class="modern-pagination">
              </el-pagination>
            </div>
            <!-- Mobile Pagination -->
            <div class="mobile-only">
              <el-pagination @current-change="handlePageChange" :current-page="currentPage" :page-size="pageSize"
                layout="prev, pager, next" :total="total" class="modern-pagination mobile-pagination">
              </el-pagination>
            </div>
          </div>
        </div>

        <div v-else class="empty-orders">
          <el-empty :description="$t('orders.noOrders') || '您还没有订单'">
            <el-button type="primary" @click="navigateTo('/products')">{{ $t('orders.goShopping') || '去购物'
              }}</el-button>
          </el-empty>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
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
    formatDate(dateString) {
      if (!dateString) return '';
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
    formatDateWithTimezone(dateString, timezone) {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      const formattedDate = date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      //console.log(`dateString: ${dateString},formattedDate: ${formattedDate}`);
      return timezone ? `${formattedDate} (${timezone})` : formattedDate;
    },
    getStatusText(status) {
      const statusMap = {
        'pending': this.$t('orders.status.pending') || '待支付',
        'paid': this.$t('orders.status.paid') || '已支付',
        'shipped': this.$t('orders.status.shipped') || '已发货',
        'delivered': this.$t('orders.status.delivered') || '已送达',
        'cancelled': this.$t('orders.status.cancelled') || '已取消',
        'pay_timeout': this.$t('orders.status.payTimeout') || '支付超时'
      };
      return statusMap[status] || status;
    },
    getStatusType(status) {
      const typeMap = {
        'pending': 'warning',
        'paid': 'success',
        'shipped': 'primary',
        'delivered': 'success',
        'cancelled': 'danger',
        'pay_timeout': 'danger'
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
      if (!this.$store.auth.isLoggedIn) {
        navigateTo({
          path: 'Login',
          query: { redirect: '/UserOrders'}
          });
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
       navigateTo({
            path: '/OrderPayment',
            params: { orderId: row.id },
            query: { from: 'orders', orderId: row.id }
          });
    }
  }
};
</script>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;
@use '../assets/styles/mixins' as *;

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

/* 桌面端和移动端显示控制 */
.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
}

/* 移动端卡片样式 */
.orders-cards {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.order-card {
  background: $white;
  border: 1px solid $gray-200;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: $shadow-sm;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-md;
    border-color: $primary-color;
  }

  &:active {
    transform: translateY(0);
  }
}

.order-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;
  padding-bottom: $spacing-md;
  border-bottom: 1px solid $gray-100;

  .order-number {
    font-weight: $font-weight-semibold;
    color: $primary-color;
    font-size: $font-size-lg;
  }
}

.order-card-body {
  margin-bottom: $spacing-md;
}

.order-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-sm;

  &:last-child {
    margin-bottom: 0;
  }

  .label {
    color: $text-secondary;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
  }

  .value {
    color: $text-primary;
    font-size: $font-size-sm;
    text-align: right;
    flex: 1;
    margin-left: $spacing-md;

    &.amount {
      color: $success-color;
      font-weight: $font-weight-semibold;
      font-size: $font-size-md;
    }
  }
}

.order-card-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-top: $spacing-md;
  border-top: 1px solid $gray-100;

  i {
    color: $text-secondary;
    font-size: $font-size-lg;
  }
}

/* 响应式设计 */
@include mobile {
  .desktop-only {
    display: none !important;
  }

  .mobile-only {
    display: block !important;
  }

  .container {
    padding: $spacing-lg $spacing-sm;
  }

  .orders-content {
    padding: $spacing-lg;
    border-radius: $border-radius-md;
  }

  .pagination-container {
    margin-top: $spacing-xl;
  }

  .orders-cards {
    gap: $spacing-md;
  }

  .order-card {
    padding: $spacing-md;
    border-radius: $border-radius-md;
  }

  .order-card-header {
    margin-bottom: $spacing-sm;
    padding-bottom: $spacing-sm;

    .order-number {
      font-size: $font-size-md;
    }
  }

  .order-card-body {
    margin-bottom: $spacing-sm;
  }

  .order-info-row {
    margin-bottom: $spacing-xs;

    .label {
      font-size: $font-size-xs;
    }

    .value {
      font-size: $font-size-xs;

      &.amount {
        font-size: $font-size-sm;
      }
    }
  }

  .order-card-footer {
    padding-top: $spacing-sm;

    i {
      font-size: $font-size-md;
    }
  }

  :deep(.modern-pagination) {

    .el-pagination__total,
    .el-pagination__jump {
      font-size: $font-size-sm;
    }

    .el-pager li {
      min-width: 32px;
      height: 32px;
      line-height: 30px;
      font-size: $font-size-sm;
    }

    .btn-prev,
    .btn-next {
      min-width: 32px;
      height: 32px;
      line-height: 30px;
      font-size: $font-size-sm;
    }

    &.mobile-pagination {
      .el-pager {
        li {
          min-width: 28px;
          height: 28px;
          line-height: 26px;
          font-size: $font-size-xs;
          margin: 0 1px;
        }
      }

      .btn-prev,
      .btn-next {
        min-width: 28px;
        height: 28px;
        line-height: 26px;
        font-size: $font-size-xs;
        padding: 0;

        .el-icon {
          font-size: $font-size-xs;
        }
      }
    }
  }

  .empty-orders {
    padding: $spacing-3xl 0;

    :deep(.el-empty__description) {
      font-size: $font-size-sm;
    }

    :deep(.el-button) {
      font-size: $font-size-sm;
      padding: $spacing-sm $spacing-lg;
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