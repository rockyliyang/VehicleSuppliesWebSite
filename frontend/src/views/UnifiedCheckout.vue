<template>
    <div class="unified-checkout">
        <section class="order-summary">
            <h2>订单信息</h2>
            <el-table :data="orderItems" style="width: 100%">
                <el-table-column label="商品" prop="name" />
                <el-table-column label="数量" prop="quantity" />
                <el-table-column label="单价" prop="price" />
                <el-table-column label="小计">
                    <template #default="{row}">
                        {{ formatPrice(row.price * row.quantity) }}
                    </template>
                </el-table-column>
            </el-table>
            <div class="order-total">总计: {{ formatPrice(orderTotal) }}</div>
        </section>
        <section class="shipping-info">
            <h2>收货信息</h2>
            <el-form :model="shippingInfo" label-width="80px" class="shipping-form">
                <el-form-item label="姓名"><el-input v-model="shippingInfo.name" /></el-form-item>
                <el-form-item label="电话"><el-input v-model="shippingInfo.phone" /></el-form-item>
                <el-form-item label="邮箱"><el-input v-model="shippingInfo.email" /></el-form-item>
                <el-form-item label="地址"><el-input v-model="shippingInfo.address" /></el-form-item>
                <el-form-item label="邮编"><el-input v-model="shippingInfo.zipCode" /></el-form-item>
            </el-form>
        </section>
        <section class="payment-methods">
            <h2>支付方式</h2>
            <el-tabs v-model="activePaymentTab" @tab-click="onTabChange">
                <el-tab-pane label="PayPal/信用卡" name="paypal">
                    <div v-if="activePaymentTab === 'paypal'" id="paypal-button-container" ref="paypalButtonContainer">
                    </div>
                </el-tab-pane>
                <el-tab-pane label="微信支付" name="wechat">
                    <div class="qrcode-container">
                        <div v-if="qrcodeUrl" class="qrcode-image">
                            <img :src="qrcodeUrl" alt="微信支付二维码">
                        </div>
                        <el-button @click="generateQrcode('wechat')" type="primary">生成支付二维码</el-button>
                        <div v-if="polling">正在检测支付状态...</div>
                    </div>
                </el-tab-pane>
                <el-tab-pane label="支付宝" name="alipay">
                    <div class="qrcode-container">
                        <div v-if="qrcodeUrl" class="qrcode-image">
                            <img :src="qrcodeUrl" alt="支付宝支付二维码">
                        </div>
                        <el-button @click="generateQrcode('alipay')" type="primary">生成支付二维码</el-button>
                        <div v-if="polling">正在检测支付状态...</div>
                    </div>
                </el-tab-pane>
            </el-tabs>
        </section>
        <el-dialog v-model="paySuccess" title="支付成功" width="30%">
            <span>支付成功，订单号：{{ orderId }}</span>
            <template #footer>
                <el-button @click="goHome">返回首页</el-button>
                <el-button type="primary" @click="goOrders">查看订单</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script>
export default {
  name: 'UnifiedCheckout',
  data() {
    return {
      orderItems: [],
      orderTotal: 0,
      shippingInfo: { name: '', phone: '', email: '', address: '', zipCode: '' },
      activePaymentTab: 'paypal',
      qrcodeUrl: '',
      polling: false,
      pollingTimer: null,
      paySuccess: false,
      orderId: '',
      paypalConfig: { clientId: '', currency: 'USD' },
      paypalScript: null
    };
  },
  created() {
    this.initOrderItems();
    this.fetchPayPalConfig();
  },
  mounted() {
    // 不做任何PayPal相关操作
  },
  methods: {
    initOrderItems() {
      const itemsQuery = this.$route.query.items;
      if (itemsQuery) {
        try {
          this.orderItems = JSON.parse(decodeURIComponent(itemsQuery));
          this.orderTotal = this.orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
          return;
        } catch (e) {
          this.$message.error('解析选中商品失败');
        }
      }
      this.fetchOrderInfo(); // fallback
    },
    formatPrice(price) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
    },
    async fetchOrderInfo() {
      try {
        const res = await this.$api.get('/cart');
        if (res.success) {
          this.orderItems = res.data.items || [];
          this.orderTotal = res.data.totalPrice || 0;
        } else {
          this.$message.error('获取购物车信息失败');
        }
      } catch (error) {
        console.error('获取购物车信息失败:', error);
        this.$message.error('获取购物车信息失败，请刷新页面重试');
      }
    },
    async fetchPayPalConfig() {
      try {
        const res = await this.$api.get('/payment-config/config');
        if (res.success) {
          this.paypalConfig = res.data.paypalConfig || { clientId: '', currency: 'USD' };
          if (this.activePaymentTab === 'paypal') {
            this.$nextTick(() => {
              this.loadPayPalSDK();
            });
          }
        }
      } catch (error) {
        console.error('获取PayPal配置失败:', error);
        this.$message.error('获取支付配置失败，请刷新页面重试');
      }
    },
    onTabChange() {
      this.$nextTick(() => {
        if (this.activePaymentTab === 'paypal') {
          this.loadPayPalSDK();
        } else {
          this.qrcodeUrl = '';
          this.clearPollingTimer();
        }
      });
    },
    loadPayPalSDK() {
      if (!this.paypalConfig || !this.paypalConfig.clientId || this.paypalConfig.clientId === 'test') {
        console.warn('PayPal配置无效，请检查环境变量');
        this.$message.warning('PayPal配置无效，请联系管理员');
        return;
      }
      
      if (window.paypal) {
        this.renderPayPalButtons();
        return;
      }
      
      if (document.getElementById('paypal-sdk')) {
        return;
      }
      
      const script = document.createElement('script');
      script.id = 'paypal-sdk';
      script.src = `${this.paypalConfig.scriptUrl}?client-id=${this.paypalConfig.clientId}&currency=${this.paypalConfig.currency}&intent=${this.paypalConfig.intent}&components=${this.paypalConfig.components}`;
      script.onload = () => {
        this.renderPayPalButtons();
      };
      script.onerror = () => {
        console.error('PayPal SDK加载失败');
        this.$message.error('PayPal SDK加载失败，请刷新页面重试');
      };
      document.head.appendChild(script);
    },
    renderPayPalButtons() {
      if (!window.paypal) {
        console.error('PayPal SDK未加载');
        return;
      }
      
      const paypalContainer = document.getElementById('paypal-button-container');
       if (!paypalContainer) {
         console.error('PayPal按钮容器未找到');
         return;
       }
       
       paypalContainer.innerHTML = '';
      window.paypal.Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' },
        enableFunding: window.paypal.FUNDING.PAYLATER,
        createOrder: async () => {
          try {
            // 调用后端创建PayPal订单
            const response = await this.$api.post('/payment/paypal/create', {
              shippingInfo: {
                name: this.shippingInfo.name,
                phone: this.shippingInfo.phone,
                email: this.shippingInfo.email,
                shipping_address: this.shippingInfo.address,
                shipping_zip_code: this.shippingInfo.zipCode
              },
              orderItems: this.orderItems.map(item => ({
                product_id: item.product_id,
                product_code: item.product_code,
                product_name: item.name,
                quantity: item.quantity,
                price: item.price
              })),
              orderId: this.$route.query.orderId || undefined
            });
            
            if (response.success) {
              this.orderId = response.data.orderId;
              return response.data.paypalOrderId || response.data.id || response.data.orderID;
            } else {
              throw new Error(response.message || '创建订单失败');
            }
          } catch (error) {
            this.$message.error('创建PayPal订单失败: ' + error.message);
            throw error;
          }
        },
        onApprove: async (data, actions) => {
          try {
            // 捕获PayPal支付
            const response = await this.$api.post('/payment/paypal/capture', {
              paypalOrderId: data.orderID,
              orderId: this.orderId
            });
            
            if (response.success) {
              this.paySuccess = true;
              this.$message.success('支付成功！');
            } else {
              throw new Error(response.message || '支付捕获失败');
            }
          } catch (error) {
            this.$message.error('PayPal支付失败: ' + error.message);
            // 处理可恢复的错误
            if (error.message.includes('INSTRUMENT_DECLINED')) {
              return actions.restart();
            }
          }
        },
        onError: (err) => {
          this.$message.error('PayPal支付失败: ' + (err.message || '未知错误'));
        },
        onCancel: () => {
          this.$message.info('支付已取消');
        }
      }).render('#paypal-button-container').catch(err => {
        console.error('PayPal按钮渲染失败:', err);
        this.$message.error('PayPal按钮加载失败，请刷新页面重试');
      });
    },
    async generateQrcode(paymentMethod) {
      this.qrcodeUrl = '';
      // 1. 创建订单
      const orderRes = await this.$api.post('/payment/common/create', {
        shippingInfo: {
          name: this.shippingInfo.name,
          phone: this.shippingInfo.phone,
          email: this.shippingInfo.email,
          shipping_address: this.shippingInfo.address,
          shipping_zip_code: this.shippingInfo.zipCode
        },
        paymentMethod,
        orderItems: this.orderItems.map(item => ({
          product_id: item.product_id,
          product_code: item.product_code,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        orderId: this.$route.query.orderId || undefined
      });
      if (orderRes.success) {
        this.orderId = orderRes.data.orderId;
        // 2. 生成二维码
        const qrRes = await this.$api.post('/payment/qrcode', {
          orderId: this.orderId,
          paymentMethod
        });
        if (qrRes.success) {
          this.qrcodeUrl = qrRes.data.qrcodeUrl;
          this.startPaymentStatusPolling(this.orderId, paymentMethod);
        }
      }
    },
    startPaymentStatusPolling(orderId, paymentMethod) {
      this.clearPollingTimer();
      this.polling = true;
      this.pollingTimer = setInterval(async () => {
        const statusRes = await this.$api.post('/payment/check-status', {
          orderId,
          paymentMethod
        });
        if (statusRes.success && statusRes.data.status === 'paid') {
          this.clearPollingTimer();
          this.paySuccess = true;
        }
      }, 3000);
    },
    clearPollingTimer() {
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer);
        this.pollingTimer = null;
        this.polling = false;
      }
    },
    goHome() {
      this.$router.push('/');
    },
    goOrders() {
      this.$router.push('/user/orders');
    }
  },
  beforeUnmount() {
    this.clearPollingTimer();
    if (this.paypalScript && this.paypalScript.parentNode) {
      this.paypalScript.parentNode.removeChild(this.paypalScript);
    }
  }
};
</script>

<style scoped>
.unified-checkout {
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
}

.order-summary,
.shipping-info,
.payment-methods {
    background: #f9f9f9;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
}

.order-total {
    font-weight: bold;
    font-size: 1.2em;
    margin-top: 10px;
}

.qrcode-container {
    margin-top: 20px;
    text-align: center;
}

.qrcode-image img {
    width: 180px;
    height: 180px;
}
</style>