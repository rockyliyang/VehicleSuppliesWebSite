<template>
  <div class="unified-checkout">
    <!-- 页面横幅 -->
    <div class="page-banner">
      <div class="banner-content">
        <h1 class="text-3xl font-bold mb-2">
          {{ $t('checkout.title') || '结算页面' }}
        </h1>
        <div class="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">{{ $t('nav.home') || '首页' }}</el-breadcrumb-item>
            <el-breadcrumb-item :to="{ path: '/cart' }">{{ $t('cart.title') || '购物车' }}</el-breadcrumb-item>
            <el-breadcrumb-item>{{ $t('checkout.title') || '结算' }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4">
      <div class="checkout-content">
        <!-- 订单信息 -->
        <section class="order-summary">
          <h2 class="section-title">
            <i class="el-icon-shopping-cart-2"></i>
            {{ $t('checkout.orderInfo') || '订单信息' }}
          </h2>
          <el-table :data="orderItems" class="order-table">
            <el-table-column :label="$t('checkout.product') || '商品'" min-width="200">
              <template #default="{row}">
                <div class="product-info">
                  <div class="product-image">
                    <img :src="row.image_url || require('@/assets/images/default-image.svg')" :alt="row.name">
                  </div>
                  <div class="product-details">
                    <div class="product-name">{{ row.name }}</div>
                    <div class="product-code">{{ $t('checkout.productCode') || '产品编号' }}: {{ row.product_code }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="$t('checkout.quantity') || '数量'" prop="quantity" width="100" align="center" />
            <el-table-column :label="$t('checkout.unitPrice') || '单价'" width="120" align="right">
              <template #default="{row}">{{ formatPrice(row.price) }}</template>
            </el-table-column>
            <el-table-column :label="$t('checkout.subtotal') || '小计'" width="120" align="right">
              <template #default="{row}">
                <span class="subtotal-price">{{ formatPrice(row.price * row.quantity) }}</span>
              </template>
            </el-table-column>
          </el-table>
          <div class="order-total">
            <span>{{ $t('checkout.total') || '总计' }}:</span>
            <span class="total-price">{{ formatPrice(orderTotal) }}</span>
          </div>
        </section>

        <!-- 收货信息 -->
        <section class="shipping-info">
          <h2 class="section-title">
            <i class="el-icon-location"></i>
            {{ $t('checkout.shippingInfo') || '收货信息' }}
          </h2>
          <el-form :model="shippingInfo" :rules="shippingRules" ref="shippingForm" label-width="100px"
            class="shipping-form">
            <div class="form-row">
              <el-form-item :label="$t('checkout.name') || '姓名'" prop="name">
                <el-input v-model="shippingInfo.name" :placeholder="$t('checkout.namePlaceholder') || '请输入收货人姓名'"
                  clearable />
              </el-form-item>
              <el-form-item :label="$t('checkout.phone') || '电话'" prop="phone">
                <el-input v-model="shippingInfo.phone" :placeholder="$t('checkout.phonePlaceholder') || '请输入手机号码'"
                  clearable />
              </el-form-item>
            </div>
            <div class="form-row">
              <el-form-item :label="$t('checkout.email') || '邮箱'" prop="email">
                <el-input v-model="shippingInfo.email" :placeholder="$t('checkout.emailPlaceholder') || '请输入邮箱地址'"
                  clearable />
              </el-form-item>
              <el-form-item :label="$t('checkout.zipCode') || '邮编'" prop="zipCode">
                <el-input v-model="shippingInfo.zipCode" :placeholder="$t('checkout.zipCodePlaceholder') || '请输入邮政编码'"
                  clearable />
              </el-form-item>
            </div>
            <el-form-item :label="$t('checkout.address') || '地址'" prop="address">
              <el-input v-model="shippingInfo.address" type="textarea" :rows="3"
                :placeholder="$t('checkout.addressPlaceholder') || '请输入详细收货地址'" />
            </el-form-item>
          </el-form>
        </section>

        <!-- 支付方式 -->
        <section class="payment-methods">
          <h2 class="section-title">
            <i class="el-icon-credit-card"></i>
            {{ $t('checkout.paymentMethod') || '支付方式' }}
          </h2>
          <el-tabs v-model="activePaymentTab" @tab-click="onTabChange" class="payment-tabs">
            <el-tab-pane :label="$t('checkout.paypal') || 'PayPal/信用卡'" name="paypal">
              <div v-if="activePaymentTab === 'paypal'" class="paypal-container">
                <div id="paypal-button-container" ref="paypalButtonContainer"></div>
              </div>
            </el-tab-pane>
            <el-tab-pane :label="$t('checkout.wechat') || '微信支付'" name="wechat">
              <div class="qrcode-container">
                <div class="qrcode-content">
                  <div v-if="qrcodeUrl" class="qrcode-display">
                    <div class="qrcode-image">
                      <img :src="qrcodeUrl" :alt="$t('checkout.wechatQrcode') || '微信支付二维码'">
                    </div>
                    <div class="qrcode-actions">
                      <el-button @click="refreshQrcode('wechat')" type="default" class="refresh-qr-btn"
                        :loading="refreshing">
                        <i class="el-icon-refresh"></i>
                        {{ $t('checkout.refreshQrcode') || '刷新二维码' }}
                      </el-button>
                      <div class="qrcode-timer" v-if="qrcodeTimer > 0">
                        {{ $t('checkout.qrcodeExpire') || '二维码将在' }} {{ qrcodeTimer }}{{ $t('checkout.secondsExpire') ||
                        '秒后过期'
                        }}
                      </div>
                    </div>
                  </div>
                  <div v-else class="qrcode-placeholder">
                    <i class="el-icon-picture-outline qrcode-placeholder-icon"></i>
                    <p class="qrcode-placeholder-text">{{ $t('checkout.clickToGenerate') || '点击下方按钮生成支付二维码' }}</p>
                  </div>
                </div>
                <div class="qrcode-controls">
                  <el-button @click="generateQrcode('wechat')" type="primary" class="generate-qr-btn"
                    :loading="generating">
                    {{ qrcodeUrl ? ($t('checkout.regenerateQrcode') || '重新生成二维码') : ($t('checkout.generateQrcode') ||
                    '生成支付二维码')
                    }}
                  </el-button>
                </div>
                <div v-if="polling" class="polling-status">
                  <i class="el-icon-loading"></i>
                  {{ $t('checkout.checkingPayment') || '正在检测支付状态...' }}
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane :label="$t('checkout.alipay') || '支付宝'" name="alipay">
              <div class="qrcode-container">
                <div class="qrcode-content">
                  <div v-if="qrcodeUrl" class="qrcode-display">
                    <div class="qrcode-image">
                      <img :src="qrcodeUrl" :alt="$t('checkout.alipayQrcode') || '支付宝支付二维码'">
                    </div>
                    <div class="qrcode-actions">
                      <el-button @click="refreshQrcode('alipay')" type="default" class="refresh-qr-btn"
                        :loading="refreshing">
                        <i class="el-icon-refresh"></i>
                        {{ $t('checkout.refreshQrcode') || '刷新二维码' }}
                      </el-button>
                      <div class="qrcode-timer" v-if="qrcodeTimer > 0">
                        {{ $t('checkout.qrcodeExpire') || '二维码将在' }} {{ qrcodeTimer }}{{ $t('checkout.secondsExpire') ||
                        '秒后过期'
                        }}
                      </div>
                    </div>
                  </div>
                  <div v-else class="qrcode-placeholder">
                    <i class="el-icon-picture-outline qrcode-placeholder-icon"></i>
                    <p class="qrcode-placeholder-text">{{ $t('checkout.clickToGenerate') || '点击下方按钮生成支付二维码' }}</p>
                  </div>
                </div>
                <div class="qrcode-controls">
                  <el-button @click="generateQrcode('alipay')" type="primary" class="generate-qr-btn"
                    :loading="generating">
                    {{ qrcodeUrl ? ($t('checkout.regenerateQrcode') || '重新生成二维码') : ($t('checkout.generateQrcode') ||
                    '生成支付二维码')
                    }}
                  </el-button>
                </div>
                <div v-if="polling" class="polling-status">
                  <i class="el-icon-loading"></i>
                  {{ $t('checkout.checkingPayment') || '正在检测支付状态...' }}
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </section>
      </div>
    </div>

    <!-- 支付成功对话框 -->
    <el-dialog v-model="paySuccess" :title="$t('checkout.paymentSuccess') || '支付成功'" width="400px"
      class="success-dialog">
      <div class="success-content">
        <i class="el-icon-success success-icon"></i>
        <p>{{ $t('checkout.paymentSuccessMessage') || '支付成功，订单号：' }}{{ orderId }}</p>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="goHome" class="home-btn">{{ $t('checkout.backHome') || '返回首页' }}</el-button>
          <el-button type="primary" @click="goOrders" class="orders-btn">{{ $t('checkout.viewOrders') || '查看订单'
            }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'UnifiedCheckout',
  props: {
    items: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      orderItems: [],
      orderTotal: 0,
      shippingInfo: { name: '', phone: '', email: '', address: '', zipCode: '' },
      shippingRules: {
        name: [
          { required: true, message: this.$t('checkout.nameRequired') || '请输入收货人姓名', trigger: 'blur' },
          { min: 2, max: 20, message: this.$t('checkout.nameLength') || '姓名长度在 2 到 20 个字符', trigger: 'blur' }
        ],
        phone: [
          { required: true, message: this.$t('checkout.phoneRequired') || '请输入手机号码', trigger: 'blur' },
          { pattern: /^1[3-9]\d{9}$/, message: this.$t('checkout.phoneFormat') || '请输入正确的手机号码格式', trigger: 'blur' }
        ],
        email: [
          { required: true, message: this.$t('checkout.emailRequired') || '请输入邮箱地址', trigger: 'blur' },
          { type: 'email', message: this.$t('checkout.emailFormat') || '请输入正确的邮箱格式', trigger: 'blur' }
        ],
        address: [
          { required: true, message: this.$t('checkout.addressRequired') || '请输入收货地址', trigger: 'blur' },
          { min: 10, max: 200, message: this.$t('checkout.addressLength') || '地址长度在 10 到 200 个字符', trigger: 'blur' }
        ],
        zipCode: [
          { required: true, message: this.$t('checkout.zipCodeRequired') || '请输入邮政编码', trigger: 'blur' },
          { pattern: /^\d{6}$/, message: this.$t('checkout.zipCodeFormat') || '请输入正确的邮政编码格式', trigger: 'blur' }
        ]
      },
      activePaymentTab: 'paypal',
      qrcodeUrl: '',
      polling: false,
      pollingTimer: null,
      paySuccess: false,
      orderId: '',
      paypalConfig: { clientId: '', currency: 'USD' },
      paypalScript: null,
      generating: false,
      refreshing: false,
      qrcodeTimer: 0,
      qrcodeTimerInterval: null,
      autoRefreshTimer: null,
      currentPaymentMethod: ''
    };
  },
  created() {
    this.initOrderItems();
    this.fetchPayPalConfig();
  },
  mounted() {
    // 不做任何PayPal相关操作
  },
  beforeUnmount() {
    this.clearPollingTimer();
    this.clearQrcodeTimers();
    if (this.paypalScript && this.paypalScript.parentNode) {
      this.paypalScript.parentNode.removeChild(this.paypalScript);
    }
  },
  methods: {
    initOrderItems() {
      // 优先使用props传递的数据
      if (this.items && this.items.length > 0) {
        this.orderItems = this.items;
        this.calculateTotal();
        return;
      }
      
      // 兼容URL参数方式（向后兼容）
      const itemsQuery = this.$route.query.items;
      if (itemsQuery) {
        try {
          this.orderItems = JSON.parse(decodeURIComponent(itemsQuery));
          this.calculateTotal();
          return;
        } catch (e) {
          this.$message({
            message: this.$t('checkout.parseError') || '订单数据解析失败',
            type: 'error',
            customClass: 'modern-message'
          });
        }
      } else {
        this.$message({
          message: this.$t('checkout.noOrderData') || '没有找到订单数据',
          type: 'warning',
          customClass: 'modern-message'
        });
        this.$router.push('/cart');
      }
      this.fetchOrderInfo(); // fallback
    },
    calculateTotal() {
      this.orderTotal = this.orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
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
          this.qrcodeUrl = '';
          this.clearPollingTimer();
          this.clearQrcodeTimers();
        } else {
          this.qrcodeUrl = '';
          this.clearPollingTimer();
          this.clearQrcodeTimers();
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
          // 验证收货信息
          const isValid = await this.validateShippingInfo();
          if (!isValid) {
            return Promise.reject(new Error(this.$t('checkout.shippingInfoInvalid') || '请完善收货信息'));
          }
          
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
              }))
            });
            
            if (response.success) {
              this.orderId = response.data.orderId;
              return response.data.paypalOrderId || response.data.id || response.data.orderID;
            } else {
              throw new Error(response.message || '创建订单失败');
            }
          } catch (error) {
            this.$message({
              message: error.message || this.$t('checkout.paymentError') || '支付过程中出现错误',
              type: 'error',
              customClass: 'modern-message'
            });
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
      // 验证收货信息
      const isValid = await this.validateShippingInfo();
      if (!isValid) {
        return;
      }
      
      this.generating = true;
      this.currentPaymentMethod = paymentMethod;
      this.clearQrcodeTimers();
      this.qrcodeUrl = '';
      
      try {
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
          }))
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
            this.startQrcodeTimer();
            this.startAutoRefresh(paymentMethod);
            
            this.$message({
              message: this.$t('checkout.qrcodeGenerated') || '二维码生成成功，请扫码支付',
              type: 'success',
              customClass: 'modern-message'
            });
          } else {
            this.$message({
              message: this.$t('checkout.qrcodeGenerateFailed') || '生成二维码失败: ' + qrRes.message,
              type: 'error',
              customClass: 'modern-message'
            });
          }
        } else {
          this.$message({
            message: this.$t('checkout.createOrderFailed') || '创建订单失败: ' + orderRes.message,
            type: 'error',
            customClass: 'modern-message'
          });
        }
      } catch (error) {
        console.error('Error generating QR code:', error);
        this.$message({
          message: this.$t('checkout.qrcodeGenerateFailed') || '生成二维码失败',
          type: 'error',
          customClass: 'modern-message'
        });
      } finally {
        this.generating = false;
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
    async refreshQrcode(paymentMethod) {
      if (!this.orderId) {
        this.$message({
          message: this.$t('checkout.noOrderToRefresh') || '没有订单可以刷新',
          type: 'warning',
          customClass: 'modern-message'
        });
        return;
      }
      
      this.refreshing = true;
      this.clearQrcodeTimers();
      
      try {
        const qrRes = await this.$api.post('/payment/qrcode', {
          orderId: this.orderId,
          paymentMethod
        });
        
        if (qrRes.success) {
          this.qrcodeUrl = qrRes.data.qrcodeUrl;
          this.startQrcodeTimer();
          this.startAutoRefresh(paymentMethod);
          
          this.$message({
            message: this.$t('checkout.qrcodeRefreshed') || '二维码已刷新',
            type: 'success',
            customClass: 'modern-message'
          });
        } else {
          this.$message({
            message: this.$t('checkout.qrcodeRefreshFailed') || '刷新二维码失败: ' + qrRes.message,
            type: 'error',
            customClass: 'modern-message'
          });
        }
      } catch (error) {
        console.error('Error refreshing QR code:', error);
        this.$message({
          message: this.$t('checkout.qrcodeRefreshFailed') || '刷新二维码失败',
          type: 'error',
          customClass: 'modern-message'
        });
      } finally {
        this.refreshing = false;
      }
    },
    startQrcodeTimer() {
      this.qrcodeTimer = 300; // 5分钟倒计时
      this.qrcodeTimerInterval = setInterval(() => {
        this.qrcodeTimer--;
        if (this.qrcodeTimer <= 0) {
          this.clearQrcodeTimers();
          this.$message({
            message: this.$t('checkout.qrcodeExpired') || '二维码已过期，请重新生成',
            type: 'warning',
            customClass: 'modern-message'
          });
        }
      }, 1000);
    },
    startAutoRefresh(paymentMethod) {
      // 4分钟后自动刷新二维码
      this.autoRefreshTimer = setTimeout(() => {
        if (this.qrcodeUrl && !this.paySuccess) {
          this.refreshQrcode(paymentMethod);
        }
      }, 240000);
    },
    clearQrcodeTimers() {
      if (this.qrcodeTimerInterval) {
        clearInterval(this.qrcodeTimerInterval);
        this.qrcodeTimerInterval = null;
      }
      if (this.autoRefreshTimer) {
        clearTimeout(this.autoRefreshTimer);
        this.autoRefreshTimer = null;
      }
      this.qrcodeTimer = 0;
    },
    goHome() {
      this.$router.push('/');
    },
    goOrders() {
      this.$router.push('/user/orders');
    },
    async validateShippingInfo() {
      try {
        await this.$refs.shippingForm.validate();
        return true;
      } catch (error) {
        this.$message({
          message: this.$t('checkout.shippingInfoInvalid') || '请完善收货信息',
          type: 'warning',
          customClass: 'modern-message'
        });
        return false;
      }
    }
  }
};
</script>

<style scoped>
/* 页面横幅 */
.page-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 60px 0;
  text-align: center;
  margin-bottom: 40px;
}

.banner-content h1 {
  color: white;
  margin-bottom: 16px;
}

.breadcrumb {
  margin-top: 20px;
}

.breadcrumb :deep(.el-breadcrumb__inner) {
  color: rgba(255, 255, 255, 0.8);
}

.breadcrumb :deep(.el-breadcrumb__inner:hover) {
  color: white;
}

/* 主容器 */
.unified-checkout {
  min-height: 100vh;
  background: #f8fafc;
}

.checkout-content {
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 40px;
}

/* 通用区块样式 */
.order-summary,
.shipping-info,
.payment-methods {
  background: white;
  margin-bottom: 30px;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.order-summary:hover,
.shipping-info:hover,
.payment-methods:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* 区块标题 */
.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e53e3e;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title i {
  color: #e53e3e;
  font-size: 22px;
}

/* 订单表格 */
.order-table {
  border-radius: 8px;
  overflow: hidden;
}

.order-table :deep(.el-table__header) {
  background: #f7fafc;
}

.order-table :deep(.el-table th) {
  background: #f7fafc;
  color: #4a5568;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-image {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-details {
  flex: 1;
}

.product-name {
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 4px;
}

.product-code {
  font-size: 12px;
  color: #718096;
}

.subtotal-price {
  font-weight: 600;
  color: #e53e3e;
}

/* 订单总计 */
.order-total {
  text-align: right;
  font-size: 20px;
  font-weight: 700;
  margin-top: 20px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #e53e3e, #c53030);
  color: white;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-price {
  font-size: 24px;
}

/* 表单样式 */
.shipping-form {
  margin-top: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 20px;
}

.shipping-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.shipping-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: #4a5568;
  text-align: left;
  padding-right: 16px;
  line-height: 40px;
  width: 100px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.shipping-form :deep(.el-form-item__content) {
  line-height: 40px;
  flex: 1;
}

.shipping-form :deep(.el-input) {
  width: 100%;
}

.shipping-form :deep(.el-input__wrapper) {
  border-radius: 8px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
  box-shadow: none;
  padding: 8px 12px;
}

.shipping-form :deep(.el-input__wrapper:hover) {
  border-color: #cbd5e0;
}

.shipping-form :deep(.el-input__wrapper.is-focus) {
  border-color: #e53e3e;
  box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1);
}

.shipping-form :deep(.el-input__inner) {
  border: none;
  box-shadow: none;
  padding: 0;
  height: auto;
  line-height: 1.5;
}

.shipping-form :deep(.el-textarea) {
  width: 100%;
}

.shipping-form :deep(.el-textarea__inner) {
  border-radius: 8px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
  padding: 12px;
  resize: vertical;
}

.shipping-form :deep(.el-textarea__inner:hover) {
  border-color: #cbd5e0;
}

.shipping-form :deep(.el-textarea__inner:focus) {
  border-color: #e53e3e;
  box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1);
  outline: none;
}

/* 修复表单项布局对齐问题 */
.shipping-form :deep(.el-form-item) {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
}

.shipping-form :deep(.el-form-item__label) {
  flex-shrink: 0;
  margin-right: 0;
}

.shipping-form :deep(.el-form-item__content) {
  flex: 1;
  margin-left: 0;
}

/* 确保必填星号对齐 */
.shipping-form :deep(.el-form-item.is-required .el-form-item__label::before) {
  margin-right: 4px;
}

/* 支付方式标签页 */
.payment-tabs :deep(.el-tabs__header) {
  margin-bottom: 30px;
}

.payment-tabs :deep(.el-tabs__nav-wrap::after) {
  background: #e2e8f0;
}

.payment-tabs :deep(.el-tabs__item) {
  font-weight: 600;
  color: #718096;
  padding: 0 30px;
  height: 50px;
  line-height: 50px;
}

.payment-tabs :deep(.el-tabs__item.is-active) {
  color: #e53e3e;
}

.payment-tabs :deep(.el-tabs__active-bar) {
  background: #e53e3e;
  height: 3px;
}

/* PayPal容器 */
.paypal-container {
  padding: 20px;
  background: #f7fafc;
  border-radius: 8px;
  border: 2px dashed #e2e8f0;
}

/* 二维码容器 */
.qrcode-container {
  padding: 30px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.qrcode-content {
  margin-bottom: 24px;
}

.qrcode-display {
  text-align: center;
}

.qrcode-image {
  margin: 20px 0;
  display: inline-block;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid #e2e8f0;
}

.qrcode-image img {
  max-width: 200px;
  border-radius: 8px;
  display: block;
}

.qrcode-actions {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.qrcode-placeholder {
  text-align: center;
  padding: 60px 20px;
  color: #a0aec0;
}

.qrcode-placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
}

.qrcode-placeholder-text {
  font-size: 16px;
  margin: 0;
}

.qrcode-controls {
  text-align: center;
  margin-bottom: 20px;
}

.generate-qr-btn {
  background: linear-gradient(135deg, #e53e3e, #c53030);
  border: none;
  padding: 12px 30px;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s ease;
  min-width: 160px;
}

.generate-qr-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(229, 62, 62, 0.3);
}

.refresh-qr-btn {
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  color: #4a5568;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.3s ease;
  font-size: 14px;
}

.refresh-qr-btn:hover {
  border-color: #cbd5e0;
  background: #edf2f7;
}

.refresh-qr-btn i {
  margin-right: 4px;
}

.qrcode-timer {
  font-size: 14px;
  color: #718096;
  background: #edf2f7;
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
}

.polling-status {
  margin-top: 20px;
  color: #718096;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.polling-status i {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* 支付成功对话框 */
.success-dialog :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

.success-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
  padding: 20px 30px;
  margin: 0;
}

.success-dialog :deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
}

.success-content {
  text-align: center;
  padding: 30px 20px 20px;
}

.success-icon {
  font-size: 48px;
  color: #48bb78;
  margin-bottom: 16px;
  display: block;
}

.success-content p {
  font-size: 16px;
  color: #4a5568;
  margin: 0;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 20px;
}

.home-btn,
.orders-btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.home-btn {
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  color: #4a5568;
}

.home-btn:hover {
  background: #edf2f7;
  border-color: #cbd5e0;
}

.orders-btn {
  background: linear-gradient(135deg, #e53e3e, #c53030);
  border: none;
}

.orders-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(229, 62, 62, 0.3);
}

/* 现代消息样式 */
:deep(.modern-message) {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: none;
}

:deep(.modern-message.el-message--success) {
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
}

:deep(.modern-message.el-message--error) {
  background: linear-gradient(135deg, #f56565, #e53e3e);
  color: white;
}

:deep(.modern-message.el-message--warning) {
  background: linear-gradient(135deg, #ed8936, #dd6b20);
  color: white;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-banner {
    padding: 40px 0;
  }

  .banner-content h1 {
    font-size: 24px;
  }

  .checkout-content {
    padding: 0 16px;
  }

  .order-summary,
  .shipping-info,
  .payment-methods {
    padding: 20px;
    margin-bottom: 20px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .order-total {
    font-size: 16px;
    flex-direction: column;
    gap: 8px;
  }

  .total-price {
    font-size: 20px;
  }

  .product-info {
    flex-direction: column;
    text-align: center;
  }

  .product-image {
    width: 80px;
    height: 80px;
    margin: 0 auto;
  }
}
</style>