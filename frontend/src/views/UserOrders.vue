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
          <el-table :data="orders" style="width: 100%">
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
            <el-table-column :label="$t('orders.actions') || '操作'">
              <template #default="{row}">
                <el-button type="primary" size="small" @click="viewOrderDetail(row.id)">{{ $t('orders.viewDetail') ||
                  '查看详情' }}</el-button>
              </template>
            </el-table-column>
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
      if (!localStorage.getItem('user_token')) {
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
        this.$message.error(error.response?.data?.message || this.$t('orders.fetchError') || '获取订单列表失败');
      } finally {
        this.loading = false;
      }
    },
    handlePageChange(page) {
      this.currentPage = page;
      this.fetchOrders();
    },
    async viewOrderDetail(orderId) {
      this.loading = true;
      try {
        const response = await this.$api.get(`/orders/${orderId}`);
        if (response.success) {
          this.orderDetail = response.data;
          this.dialogVisible = true;
        }
      } catch (error) {
        console.error('获取订单详情失败:', error);
        this.$message.error(error.response?.data?.message || this.$t('orders.fetchDetailError') || '获取订单详情失败');
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.orders-page {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.page-banner {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  padding: 80px 0;
  text-align: center;
}

.banner-content {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.banner-content h1 {
  color: white;
}

.breadcrumb {
  margin-top: 20px;
}

.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 0 50px;
}

.orders-content {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-top: 40px;
}

.pagination-container {
  margin-top: 32px;
  text-align: center;
}

.order-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.detail-section:last-child {
  border-bottom: none;
}

.detail-section h3 {
  color: #1f2937;
  margin-bottom: 20px;
  font-size: 1.25rem;
  font-weight: 600;
}

.detail-item {
  display: flex;
  margin-bottom: 16px;
  align-items: center;
}

.detail-item .label {
  width: 120px;
  color: #6b7280;
  font-weight: 500;
  flex-shrink: 0;
}

.detail-item .value {
  color: #1f2937;
  flex: 1;
}

.detail-item .value.price {
  color: #dc2626;
  font-weight: 700;
  font-size: 1.125rem;
}

.logistics-location {
  color: #9ca3af;
  font-size: 0.875rem;
  margin-top: 4px;
}

.empty-orders {
  padding: 60px 0;
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #f9fafb;
  color: #374151;
  font-weight: 600;
}

:deep(.el-button--primary) {
  background-color: #dc2626;
  border-color: #dc2626;
}

:deep(.el-button--primary:hover) {
  background-color: #b91c1c;
  border-color: #b91c1c;
}

:deep(.el-tag--success) {
  background-color: #dcfce7;
  color: #166534;
  border-color: #bbf7d0;
}

:deep(.el-tag--warning) {
  background-color: #fef3c7;
  color: #92400e;
  border-color: #fde68a;
}

:deep(.el-tag--danger) {
  background-color: #fee2e2;
  color: #991b1b;
  border-color: #fecaca;
}

:deep(.el-tag--info) {
  background-color: #e0f2fe;
  color: #0c4a6e;
  border-color: #bae6fd;
}
</style>