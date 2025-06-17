<template>
  <div class="orders-page">
    <div class="page-banner">
      <div class="banner-content">
        <h1 class="text-3xl font-bold mb-2">
          {{ $t('orders.title') || '我的订单' }}
        </h1>
        <div class="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">{{ $t('nav.home') || '首页' }}</el-breadcrumb-item>
            <el-breadcrumb-item>{{ $t('orders.title') || '我的订单' }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4">
      <div class="orders-content" v-loading="loading">
        <div v-if="orders.length > 0" class="orders-list">
          <el-table :data="orders" style="width: 100%" @row-dblclick="handleRowDoubleClick">
            <el-table-column :label="$t('orders.orderNumber') || '订单号'" prop="order_guid" width="220"></el-table-column>
            <el-table-column :label="$t('orders.orderTime') || '下单时间'" width="180">
              <template #default="{row}">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column :label="$t('orders.orderAmount') || '订单金额'" width="120">
              <template #default="{row}">¥{{ formatPrice(row.total_amount) }}</template>
            </el-table-column>
            <el-table-column :label="$t('orders.orderStatus') || '订单状态'" width="120">
              <template #default="{row}">
                <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="$t('orders.recipient') || '收货人'" prop="shipping_name"
              width="120"></el-table-column>
          </el-table>

          <div class="pagination-container">
            <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize"
              v-model:current-page="currentPage" @current-change="handlePageChange">
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

    <!-- 订单详情对话框 -->
    <el-dialog :title="$t('orders.orderDetail') || '订单详情'" v-model="dialogVisible" width="70%">
      <div v-if="orderDetail" class="order-detail">
        <div class="detail-section">
          <h3>{{ $t('orders.orderInfo') || '订单信息' }}</h3>
          <div class="detail-item">
            <span class="label">{{ $t('orders.orderNumber') || '订单号' }}:</span>
            <span class="value">{{ orderDetail.order.order_guid }}</span>
          </div>
          <div class="detail-item">
            <span class="label">{{ $t('orders.orderTime') || '下单时间' }}:</span>
            <span class="value">{{ formatDate(orderDetail.order.created_at) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">{{ $t('orders.orderStatus') || '订单状态' }}:</span>
            <span class="value">
              <el-tag :type="getStatusType(orderDetail.order.status)">{{ getStatusText(orderDetail.order.status)
                }}</el-tag>
            </span>
          </div>
          <div class="detail-item">
            <span class="label">{{ $t('orders.paymentMethod') || '支付方式' }}:</span>
            <span class="value">{{ getPaymentMethodText(orderDetail.order.payment_method) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">{{ $t('orders.orderAmount') || '订单金额' }}:</span>
            <span class="value price">¥{{ formatPrice(orderDetail.order.total_amount) }}</span>
          </div>
        </div>

        <div class="detail-section">
          <h3>{{ $t('orders.shippingInfo') || '收货信息' }}</h3>
          <div class="detail-item">
            <span class="label">{{ $t('orders.recipient') || '收货人' }}:</span>
            <span class="value">{{ orderDetail.order.shipping_name }}</span>
          </div>
          <div class="detail-item">
            <span class="label">{{ $t('orders.phone') || '联系电话' }}:</span>
            <span class="value">{{ orderDetail.order.shipping_phone }}</span>
          </div>
          <div class="detail-item">
            <span class="label">{{ $t('orders.email') || '邮箱地址' }}:</span>
            <span class="value">{{ orderDetail.order.shipping_email }}</span>
          </div>
          <div class="detail-item">
            <span class="label">{{ $t('orders.address') || '收货地址' }}:</span>
            <span class="value">{{ orderDetail.order.shipping_address }}</span>
          </div>
          <div class="detail-item">
            <span class="label">{{ $t('orders.zipCode') || '邮政编码' }}:</span>
            <span class="value">{{ orderDetail.order.shipping_zip_code }}</span>
          </div>
        </div>

        <div class="detail-section">
          <h3>{{ $t('orders.productInfo') || '商品信息' }}</h3>
          <el-table :data="orderDetail.items" style="width: 100%">
            <el-table-column :label="$t('orders.productName') || '商品名称'" prop="product_name"></el-table-column>
            <el-table-column :label="$t('orders.productCode') || '商品编号'" prop="product_code"
              width="180"></el-table-column>
            <el-table-column :label="$t('orders.unitPrice') || '单价'" width="120">
              <template #default="{row}">¥{{ formatPrice(row.price) }}</template>
            </el-table-column>
            <el-table-column :label="$t('orders.quantity') || '数量'" prop="quantity" width="80"></el-table-column>
            <el-table-column :label="$t('orders.subtotal') || '小计'" width="120">
              <template #default="{row}">¥{{ formatPrice(row.price * row.quantity) }}</template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="orderDetail.logistics && orderDetail.logistics.length > 0" class="detail-section">
          <h3>{{ $t('orders.logisticsInfo') || '物流信息' }}</h3>
          <el-timeline>
            <el-timeline-item v-for="(activity, index) in orderDetail.logistics" :key="index"
              :timestamp="formatDate(activity.created_at)" :type="getLogisticsIconType(activity.status)">
              {{ activity.description }}
              <div v-if="activity.location" class="logistics-location">{{ activity.location }}</div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { formatPrice } from '../utils/format';

export default {
  name: 'UserOrdersPage',
  data() {
    return {
      loading: false,
      orders: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      dialogVisible: false,
      orderDetail: null
    };
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
    async viewOrderDetail(orderId) {
      // 跳转到UnifiedCheckout页面查看订单详情
      this.$router.push({
        path: '/checkout-unified',
        query: { orderId: orderId }
      });
    },
    handleRowDoubleClick(row) {
      // 双击行时查看订单详情
      this.viewOrderDetail(row.id);
    }
  }
};
</script>

<style lang="scss" scoped>
@import '../assets/styles/variables';

.orders-page {
  min-height: 100vh;
  background-color: $gray-50;
}

.breadcrumb {
  margin-top: $spacing-lg;
}

.container {
  width: 90%;
  max-width: $container-max-width;
  margin: 0 auto;
  padding: $spacing-lg 0 $spacing-4xl;
}

.orders-content {
  background: $white;
  border-radius: $border-radius-lg;
  padding: $spacing-2xl;
  box-shadow: $shadow-lg;
  margin-top: $spacing-2xl;
}

.pagination-container {
  margin-top: $spacing-2xl;
  text-align: center;
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

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: $border-radius-md;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: $gray-50;
  color: $gray-700;
  font-weight: $font-weight-semibold;
}

:deep(.el-button--primary) {
  background-color: $primary-color;
  border-color: $primary-color;

  &:hover {
    background-color: $primary-dark;
    border-color: $primary-dark;
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