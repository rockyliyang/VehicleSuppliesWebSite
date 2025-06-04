<template>
  <div class="checkout-complete-page">
    <!-- Page Banner -->
    <div class="page-banner">
      <div class="banner-content">
        <h1 class="banner-title">
          {{ $t('checkout.complete.title') || '支付结果' }}
        </h1>
        <div class="banner-divider"></div>
      </div>
    </div>

    <!-- Checkout Complete Section -->
    <div class="checkout-complete-container">
      <div class="form-wrapper">
        <div class="result-card" :class="{ 'success': isSuccess, 'error': !isSuccess }">
          <div class="result-header">
            <img :src="logoUrl" alt="AUTO EASE EXPERT CO., LTD" class="logo">
            <div v-if="isSuccess" class="success-icon">✓</div>
            <div v-else class="error-icon">✗</div>

            <h1 class="result-title">{{ pageTitle }}</h1>
            <p class="result-message">{{ pageMessage }}</p>
          </div>

          <div v-if="isSuccess" class="order-details">
            <h2 class="details-title">{{ $t('checkout.complete.orderDetails') || '订单详情' }}</h2>
            <div class="detail-row">
              <span class="detail-label">{{ $t('checkout.complete.orderId') || '订单号:' }}</span>
              <span class="detail-value">{{ orderId }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ $t('checkout.complete.transactionId') || '交易ID:' }}</span>
              <span class="detail-value">{{ transactionId }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ $t('checkout.complete.date') || '日期:' }}</span>
              <span class="detail-value">{{ formattedDate }}</span>
            </div>
          </div>

          <div class="actions">
            <router-link to="/" class="btn home-btn">
              {{ $t('checkout.complete.backToHome') || '返回首页' }}
            </router-link>
            <router-link v-if="isSuccess" to="/user/orders" class="btn orders-btn">
              {{ $t('checkout.complete.viewOrders') || '查看我的订单' }}
            </router-link>
            <router-link v-else to="/checkout4" class="btn retry-btn">
              {{ $t('checkout.complete.retryPayment') || '重试支付' }}
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
    name: 'CheckoutComplete',
    data() {
        return {
            status: '',
            orderId: '',
            transactionId: '',
            pageTitle: this.$t('checkout.complete.processing') || '处理中...',
            pageMessage: this.$t('checkout.complete.processingMessage') || '正在确认您的支付状态...',
            logoUrl: '/static/images/logo.png'
        };
    },
    computed: {
        isSuccess() {
            return this.status === 'success';
        },
        formattedDate() {
            return new Date().toLocaleString();
        }
    },
    mounted() {
        // 从URL获取支付状态
        const urlParams = new URLSearchParams(window.location.search);
        this.status = urlParams.get('status') || '';
        this.orderId = urlParams.get('orderId') || '';
        this.transactionId = urlParams.get('transactionId') || '';
        
        // 设置页面标题和消息
        if (this.isSuccess) {
            this.pageTitle = this.$t('checkout.complete.success.title') || '支付成功!';
            this.pageMessage = this.$t('checkout.complete.success.message') || '感谢您的购买，您的订单已成功处理。';
            
            // 在实际应用中，这里可能需要向后端确认支付状态
            this.confirmOrderWithBackend();
        } else {
            this.pageTitle = this.$t('checkout.complete.error.title') || '支付未完成';
            this.pageMessage = this.$t('checkout.complete.error.message') || '您的支付过程中断或出现错误。如果您支付成功但看到此消息，请联系我们的客服。';
        }
    },
    methods: {
        confirmOrderWithBackend() {
            // 这里应该是一个向后端确认支付的API调用
            console.log('向后端确认订单:', {
                orderId: this.orderId,
                transactionId: this.transactionId
            });
            
            // 在真实应用中，这里会调用后端API
            // 例如: this.$api.post('/orders/confirm', { orderId: this.orderId, transactionId: this.transactionId })
        }
    }
};
</script>

<style scoped>
/* Page Banner */
.page-banner {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  padding: 60px 0;
  text-align: center;
  width: 100%;
}

.banner-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.banner-title {
  font-family: Arial, sans-serif;
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
  margin: 0 0 1rem 0;
}

.banner-divider {
  width: 6rem;
  height: 0.25rem;
  background-color: white;
  margin: 0 auto;
}

/* Checkout Complete Container */
.checkout-complete-container {
  padding: 80px 0;
  background: #f8f9fa;
  min-height: calc(100vh - 200px);
  width: 100%;
}

.form-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: center;
}

.result-card {
  max-width: 700px;
  margin: 0 auto;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 40px;
  transition: box-shadow 0.3s ease;
  text-align: center;
}

.result-card:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.success {
  border-top: 5px solid #dc2626;
}

.error {
  border-top: 5px solid #dc2626;
}

.result-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  width: 200px;
  height: auto;
  max-height: 100px;
  margin: 0 auto 20px auto;
  object-fit: contain;
  display: block;
}

.success-icon,
.error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 0 auto 20px;
  font-size: 40px;
  color: white;
  font-weight: bold;
}

.success-icon {
  background-color: #dc2626;
}

.error-icon {
  background-color: #dc2626;
}

.result-title {
  font-size: 2rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 0.5rem;
  font-family: Arial, sans-serif;
}

.result-message {
  color: #6b7280;
  margin-bottom: 2rem;
  font-size: 1.125rem;
  font-family: Arial, sans-serif;
  line-height: 1.6;
}

/* Order Details */
.order-details {
  margin: 40px 0;
  padding: 30px;
  background: #f8f9fa;
  border-radius: 0.5rem;
  text-align: left;
  border: 1px solid #e5e7eb;
}

.details-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 1.5rem;
  font-family: Arial, sans-serif;
  text-align: center;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 15px 0;
  padding: 15px 0;
  border-bottom: 1px solid #e5e7eb;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 600;
  color: #374151;
  font-family: Arial, sans-serif;
  font-size: 1rem;
}

.detail-value {
  color: #1f2937;
  font-family: Arial, sans-serif;
  font-size: 1rem;
  font-weight: 500;
}

/* Actions */
.actions {
  margin-top: 40px;
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 24px;
  border-radius: 0.375rem;
  text-decoration: none;
  font-weight: 600;
  font-family: Arial, sans-serif;
  font-size: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  min-width: 140px;
  text-align: center;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.home-btn {
  background-color: #6b7280;
  color: white;
}

.home-btn:hover {
  background-color: #4b5563;
}

.orders-btn {
  background-color: #dc2626;
  color: white;
}

.orders-btn:hover {
  background-color: #b91c1c;
}

.retry-btn {
  background-color: #dc2626;
  color: white;
}

.retry-btn:hover {
  background-color: #b91c1c;
}

/* Responsive Design */
@media (max-width: 768px) {
  .result-card {
    margin: 0 1rem;
    padding: 30px 20px;
  }

  .page-banner {
    padding: 40px 0;
  }

  .banner-title {
    font-size: 2rem;
  }

  .checkout-complete-container {
    padding: 40px 0;
  }

  .actions {
    flex-direction: column;
    align-items: center;
  }

  .btn {
    width: 100%;
    max-width: 300px;
    margin-bottom: 10px;
  }

  .result-title {
    font-size: 1.5rem;
  }

  .result-message {
    font-size: 1rem;
  }

  .order-details {
    padding: 20px;
    margin: 30px 0;
  }

  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .detail-label {
    font-size: 0.875rem;
  }

  .detail-value {
    font-size: 0.875rem;
    font-weight: 600;
  }
}

@media (max-width: 640px) {

  .success-icon,
  .error-icon {
    width: 60px;
    height: 60px;
    font-size: 30px;
  }

  .logo {
    width: 150px;
    max-height: 80px;
  }
}
</style>