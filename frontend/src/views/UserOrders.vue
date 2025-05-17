<template>
    <div class="orders-page">
        <div class="page-banner">
            <div class="banner-content">
                <h1>我的订单</h1>
                <div class="breadcrumb">
                    <el-breadcrumb separator="/">
                        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
                        <el-breadcrumb-item>我的订单</el-breadcrumb-item>
                    </el-breadcrumb>
                </div>
            </div>
        </div>

        <div class="container">
            <div class="orders-content" v-loading="loading">
                <div v-if="orders.length > 0" class="orders-list">
                    <el-table :data="orders" style="width: 100%">
                        <el-table-column label="订单号" prop="order_guid" width="220"></el-table-column>
                        <el-table-column label="下单时间" width="180">
                            <template #default="{row}">
                                {{ formatDate(row.created_at) }}
                            </template>
                        </el-table-column>
                        <el-table-column label="订单金额" width="120">
                            <template #default="{row}">¥{{ formatPrice(row.total_amount) }}</template>
                        </el-table-column>
                        <el-table-column label="订单状态" width="120">
                            <template #default="{row}">
                                <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="收货人" prop="shipping_name" width="120"></el-table-column>
                        <el-table-column label="操作">
                            <template #default="{row}">
                                <el-button type="primary" size="small" @click="viewOrderDetail(row.id)">查看详情</el-button>
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
                    <el-empty description="您还没有订单">
                        <el-button type="primary" @click="$router.push('/products')">去购物</el-button>
                    </el-empty>
                </div>
            </div>
        </div>

        <!-- 订单详情对话框 -->
        <el-dialog title="订单详情" v-model="dialogVisible" width="70%">
            <div v-if="orderDetail" class="order-detail">
                <div class="detail-section">
                    <h3>订单信息</h3>
                    <div class="detail-item">
                        <span class="label">订单号:</span>
                        <span class="value">{{ orderDetail.order.order_guid }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">下单时间:</span>
                        <span class="value">{{ formatDate(orderDetail.order.created_at) }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">订单状态:</span>
                        <span class="value">
                            <el-tag :type="getStatusType(orderDetail.order.status)">{{
                                getStatusText(orderDetail.order.status)
                                }}</el-tag>
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="label">支付方式:</span>
                        <span class="value">{{ getPaymentMethodText(orderDetail.order.payment_method) }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">订单金额:</span>
                        <span class="value price">¥{{ formatPrice(orderDetail.order.total_amount) }}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>收货信息</h3>
                    <div class="detail-item">
                        <span class="label">收货人:</span>
                        <span class="value">{{ orderDetail.order.shipping_name }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">联系电话:</span>
                        <span class="value">{{ orderDetail.order.shipping_phone }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">邮箱地址:</span>
                        <span class="value">{{ orderDetail.order.shipping_email }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">收货地址:</span>
                        <span class="value">{{ orderDetail.order.shipping_address }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">邮政编码:</span>
                        <span class="value">{{ orderDetail.order.shipping_zip_code }}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>商品信息</h3>
                    <el-table :data="orderDetail.items" style="width: 100%">
                        <el-table-column label="商品名称" prop="product_name"></el-table-column>
                        <el-table-column label="商品编号" prop="product_code" width="180"></el-table-column>
                        <el-table-column label="单价" width="120">
                            <template #default="{row}">¥{{ formatPrice(row.price) }}</template>
                        </el-table-column>
                        <el-table-column label="数量" prop="quantity" width="80"></el-table-column>
                        <el-table-column label="小计" width="120">
                            <template #default="{row}">¥{{ formatPrice(row.price * row.quantity) }}</template>
                        </el-table-column>
                    </el-table>
                </div>

                <div v-if="orderDetail.logistics && orderDetail.logistics.length > 0" class="detail-section">
                    <h3>物流信息</h3>
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
        'pending': '待支付',
        'paid': '已支付',
        'shipped': '已发货',
        'delivered': '已送达',
        'cancelled': '已取消'
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
        'card': '信用卡支付',
        'alipay': '支付宝',
        'wechat': '微信支付',
        'paypal': 'PayPal'
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
        this.$message.error(error.response?.data?.message || '获取订单列表失败');
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
        this.$message.error(error.response?.data?.message || '获取订单详情失败');
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.orders-page {
    min-height: 70vh;
}

.page-banner {
    background-color: #f5f5f5;
    padding: 30px 0;
    margin-bottom: 30px;
}

.banner-content {
    width: 90%;
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
}

.banner-content h1 {
    margin: 0 0 10px;
    font-size: 28px;
    color: #333;
}

.container {
    width: 90%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px 0 50px;
}

.orders-content {
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    padding: 20px;
}

.pagination-container {
    margin-top: 20px;
    text-align: center;
}

.order-detail {
    padding: 0 20px;
}

.detail-section {
    margin-bottom: 30px;
}

.detail-section h3 {
    font-size: 18px;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
}

.detail-item {
    display: flex;
    margin-bottom: 10px;
}

.detail-item .label {
    width: 100px;
    color: #666;
}

.detail-item .value {
    flex: 1;
}

.detail-item .price {
    color: #f56c6c;
    font-weight: 500;
}

.logistics-location {
    color: #999;
    font-size: 12px;
    margin-top: 5px;
}
</style>