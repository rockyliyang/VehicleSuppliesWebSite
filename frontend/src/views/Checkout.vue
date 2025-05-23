<template>
  <div class="checkout-page">
    <div class="page-banner">
      <div class="banner-content">
        <h1>结算</h1>
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item :to="{ path: '/cart' }">购物车</el-breadcrumb-item>
            <el-breadcrumb-item>结算</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="checkout-content" v-loading="loading">
        <!-- 步骤条 -->
        <el-steps :active="activeStep" finish-status="success" simple>
          <el-step title="确认订单" icon="el-icon-shopping-cart-full"></el-step>
          <el-step title="填写收货信息" icon="el-icon-location"></el-step>
          <el-step title="选择支付方式" icon="el-icon-money"></el-step>
          <el-step title="完成订单" icon="el-icon-check"></el-step>
        </el-steps>

        <!-- 步骤1: 确认订单 -->
        <div v-if="activeStep === 0" class="step-content">
          <h2>确认订单信息</h2>
          <div class="order-items">
            <el-table :data="cartItems" style="width: 100%">
              <el-table-column label="商品" width="400">
                <template #default="{row}">
                  <div class="product-info">
                    <div class="product-image">
                      <img :src="row.image_url || require('@/assets/images/default-image.svg')" :alt="row.name"
                        @error="handleImageError">
                    </div>
                    <div class="product-details">
                      <router-link :to="`/product/${row.product_id}`" class="product-name">{{
                        row.name
                        }}</router-link>
                      <div class="product-code">产品编号: {{ row.product_code }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="单价" width="120">
                <template #default="{row}">¥{{ formatPrice(row.price) }}</template>
              </el-table-column>
              <el-table-column label="数量" width="120">
                <template #default="{row}">{{ row.quantity }}</template>
              </el-table-column>
              <el-table-column label="小计" width="120">
                <template #default="{row}">¥{{ formatPrice(row.price * row.quantity) }}</template>
              </el-table-column>
            </el-table>

            <div class="order-summary">
              <div class="order-total">
                <span>总计:</span>
                <span class="total-price">¥{{ formatPrice(totalPrice) }}</span>
              </div>
            </div>
          </div>
          <div class="step-actions">
            <el-button @click="$router.push('/cart')">返回购物车</el-button>
            <el-button type="primary" @click="nextStep">下一步</el-button>
          </div>
        </div>

        <!-- 步骤2: 填写收货信息 -->
        <div v-if="activeStep === 1" class="step-content">
          <h2>填写收货信息</h2>
          <el-form :model="shippingInfo" :rules="shippingRules" ref="shippingForm" label-width="100px">
            <el-form-item label="收货人" prop="name">
              <el-input v-model="shippingInfo.name" placeholder="请输入收货人姓名"></el-input>
            </el-form-item>
            <el-form-item label="手机号码" prop="phone">
              <el-input v-model="shippingInfo.phone" placeholder="请输入手机号码"></el-input>
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="shippingInfo.email" placeholder="请输入邮箱地址"></el-input>
            </el-form-item>
            <el-form-item label="省/市/区" prop="region">
              <el-cascader v-model="shippingInfo.region" :options="regionOptions" placeholder="请选择省/市/区"></el-cascader>
            </el-form-item>
            <el-form-item label="详细地址" prop="address">
              <el-input v-model="shippingInfo.address" type="textarea" placeholder="请输入详细地址"></el-input>
            </el-form-item>
            <el-form-item label="邮政编码" prop="zipCode">
              <el-input v-model="shippingInfo.zipCode" placeholder="请输入邮政编码"></el-input>
            </el-form-item>
          </el-form>
          <div class="step-actions">
            <el-button @click="prevStep">上一步</el-button>
            <el-button type="primary" @click="submitShippingInfo">下一步</el-button>
          </div>
        </div>

        <!-- 步骤3: 选择支付方式 -->
        <div v-if="activeStep === 2" class="step-content">
          <h2>选择支付方式</h2>
          <div class="payment-methods">
            <el-radio-group v-model="paymentMethod">
              <div class="payment-method-item">
                <el-radio label="paypal">PayPal(含信用卡及分期付款)</el-radio>
                <div class="payment-icons">
                  <i class="payment-icon paypal"></i>
                  <i class="payment-icon visa"></i>
                  <i class="payment-icon mastercard"></i>
                  <i class="payment-icon amex"></i>
                  <i class="payment-icon discover"></i>
                </div>
              </div>
              <div class="payment-method-item">
                <el-radio label="alipay">支付宝</el-radio>
                <div class="payment-icons">
                  <i class="payment-icon alipay"></i>
                </div>
              </div>
              <div class="payment-method-item">
                <el-radio label="wechat">微信支付</el-radio>
                <div class="payment-icons">
                  <i class="payment-icon wechat"></i>
                </div>
              </div>
            </el-radio-group>

            <!-- PayPal支付按钮 -->
            <div v-if="paymentMethod === 'paypal'" class="paypal-payment-form">
              <!-- PayPal脚本将在需要时直接加载到这里 -->
              <div v-if="paypalClientId" id="paypal-script-container"></div>
              <div id="paypal-button-container"></div>
              <div id="paypal-errors" role="alert" class="payment-error"></div>
            </div>

            <!-- 支付宝/微信支付二维码 -->
            <div v-if="paymentMethod === 'alipay' || paymentMethod === 'wechat'" class="qrcode-payment-form">
              <div v-if="qrcodeUrl">
                <img :src="qrcodeUrl" alt="支付二维码" style="width:220px;height:220px;" />
                <div class="qrcode-status">
                  <el-button type="primary" :loading="polling" @click="checkPaymentStatus">已完成支付</el-button>
                  <span v-if="polling">正在检测支付状态...</span>
                </div>
              </div>
              <div v-else>
                <el-button type="primary" @click="generateQrcode">生成二维码</el-button>
              </div>
              <div id="qrcode-errors" role="alert" class="payment-error"></div>
            </div>
          </div>
          <div class="step-actions">
            <el-button @click="prevStep">上一步</el-button>
            <el-button type="primary" @click="processPayment">确认支付</el-button>
          </div>
        </div>

        <!-- 步骤4: 完成订单 -->
        <div v-if="activeStep === 3" class="step-content">
          <div class="order-success">
            <el-result icon="success" title="订单提交成功" subTitle="感谢您的购买!">
              <template #extra>
                <div class="order-info">
                  <p>订单号: {{ orderId }}</p>
                  <p>订单金额: ¥{{ formatPrice(totalPrice) }}</p>
                  <p>支付方式: {{ paymentMethodText }}</p>
                </div>
                <div class="result-actions">
                  <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
                  <el-button @click="$router.push('/user/orders')">查看订单</el-button>
                </div>
              </template>
            </el-result>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { handleImageError } from '../utils/imageUtils';
import { formatPrice } from '../utils/format';

export default {
  name: 'CheckoutPage',
  data() {
    return {
      loading: false,
      activeStep: 0,
      cartItems: [],
      totalPrice: 0,
      orderId: '',
      paymentMethod: 'paypal', // 默认使用PayPal
      paymentConfig: null,
      paypalLoadInProgress: false, // 追踪PayPal SDK加载状态
      paypalButtonRendered: false, // 追踪PayPal按钮是否已渲染
      paypalClientId: null, // 存储PayPal客户端ID
      
      shippingInfo: {
        name: '',
        phone: '',
        email: '',
        region: [],
        address: '',
        zipCode: ''
      },
      shippingRules: {
        name: [
          { required: true, message: '请输入收货人姓名', trigger: 'blur' },
          { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
        ],
        phone: [
          { required: true, message: '请输入手机号码', trigger: 'blur' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入邮箱地址', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ],
        region: [
          { required: true, message: '请选择省/市/区', trigger: 'change' }
        ],
        address: [
          { required: true, message: '请输入详细地址', trigger: 'blur' },
          { min: 5, max: 100, message: '长度在 5 到 100 个字符', trigger: 'blur' }
        ],
        zipCode: [
          { required: true, message: '请输入邮政编码', trigger: 'blur' },
          { pattern: /^\d{6}$/, message: '请输入正确的邮政编码', trigger: 'blur' }
        ]
      },
      regionOptions: [], // 省市区数据
      qrcodeUrl: '',
      polling: false,
      pollingTimer: null,
      debug: false, // 调试模式
    };
  },
  computed: {
    paymentMethodText() {
      const methods = {
        card: '信用卡支付',
        alipay: '支付宝',
        wechat: '微信支付',
        paypal: 'PayPal'
      };
      return methods[this.paymentMethod] || '未知支付方式';
    }
  },
  created() {
    this.fetchCart();
    this.loadRegionData();
  },
  mounted() {
    // 先获取支付配置，然后加载支付SDK
    this.fetchCart();
    this.loadRegionData();
    this.fetchPaymentConfig();
  },
  
  watch: {
    // 监听支付方式变化，切换时重新渲染相应的支付表单
    paymentMethod(newValue) {
      if (this.activeStep === 2) {
        this.$nextTick(() => {
          if (newValue === 'paypal' && !this.paypalButtonRendered) {
            this.initPayPal();
          }
        });
      }
    },
    activeStep(newValue) {
      if (newValue === 2 && this.paymentMethod === 'paypal' && !this.paypalButtonRendered) {
        this.$nextTick(() => {
          this.initPayPal();
        });
      }
    }
  },
  methods: {
    handleImageError,
    formatPrice,
    async fetchCart() {
      if (!localStorage.getItem('user_token')) {
        this.$router.push('/login?redirect=/checkout');
        return;
      }

      this.loading = true;
      try {
        const response = await this.$api.get('/cart');
        if (response.success) {
          this.cartItems = response.data.items;
          this.totalPrice = response.data.totalPrice;
          
          // 如果购物车为空，返回购物车页面
          if (this.cartItems.length === 0) {
            this.$message.warning('购物车为空，请先添加商品');
            this.$router.push('/cart');
          }
        }
      } catch (error) {
        console.error('获取购物车失败:', error);
        this.$message.error(error.response?.data?.message || '获取购物车失败');
      } finally {
        this.loading = false;
      }
    },
    loadRegionData() {
      // 这里应该从后端获取省市区数据
      // 示例数据
      this.regionOptions = [
        {
          value: 'beijing',
          label: '北京',
          children: [
            {
              value: 'beijing',
              label: '北京市',
              children: [
                { value: 'haidian', label: '海淀区' },
                { value: 'chaoyang', label: '朝阳区' }
              ]
            }
          ]
        },
        {
          value: 'shanghai',
          label: '上海',
          children: [
            {
              value: 'shanghai',
              label: '上海市',
              children: [
                { value: 'pudong', label: '浦东新区' },
                { value: 'huangpu', label: '黄浦区' }
              ]
            }
          ]
        }
      ];
    },
    async fetchPaymentConfig() {
      this.loading = true;
      try {
        const response = await this.$api.get('/payment/config');
        if (response.success) {
          // 保存支付配置
          this.paymentConfig = response.data;
          // 提取PayPal客户端ID
          this.paypalClientId = this.paymentConfig?.paypalConfig?.clientId;
        } else {
          this.$message.error(response.message || '获取支付配置失败');
        }
      } catch (error) {
        console.error('获取支付配置失败:', error);
        this.$message.error(error.response?.data?.message || '获取支付配置失败');
      } finally {
        this.loading = false;
      }
    },
    
    // 完全重写的PayPal初始化方法 - 使用HTML中的script标签
    initPayPal() {
      // 清理容器
      const container = document.getElementById('paypal-button-container');
      const scriptContainer = document.getElementById('paypal-script-container');
      
      if (!container || !scriptContainer) {
        console.error('找不到PayPal容器元素');
        return;
      }
      
      // 清空容器内容
      container.innerHTML = '<div style="text-align:center;padding:10px;">正在加载PayPal...</div>';
      scriptContainer.innerHTML = '';
      
      // 检查客户端ID
      if (!this.paypalClientId) {
        container.innerHTML = '<div style="color:red;text-align:center;padding:10px;">PayPal配置无效</div>';
        return;
      }
      
      // 创建新的script元素
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${this.paypalClientId}`;
      script.dataset.namespace = "paypalCheckout";
      
      // 监听脚本加载完成事件
      script.onload = () => {
        if (window.paypalCheckout) {
          try {
            window.paypalCheckout.Buttons({
              // 创建订单
              createOrder: (data, actions) => {
                return actions.order.create({
                  purchase_units: [{
                    amount: {
                      value: this.totalPrice.toString()
                    }
                  }]
                });
              },
              // 支付完成
              onApprove: async (data) => {
                try {
                  this.loading = true;
                  
                  // 使用订单ID通知后端
                  const paymentResult = await this.$api.post('/paypal/capture-payment', {
                    paypalOrderId: data.orderID,
                    shippingInfo: this.shippingInfo
                  });
                  
                  if (paymentResult.success) {
                    this.orderId = paymentResult.data.orderId;
                    this.nextStep();
                  } else {
                    throw new Error(paymentResult.message || '处理支付失败');
                  }
                } catch (error) {
                  console.error('支付处理失败:', error);
                  this.$message.error(error.message || '支付处理失败');
                } finally {
                  this.loading = false;
                }
              }
            }).render('#paypal-button-container');
            
            this.paypalButtonRendered = true;
          } catch (error) {
            console.error('渲染PayPal按钮失败:', error);
            container.innerHTML = '<div style="color:red;text-align:center;padding:10px;">PayPal初始化失败</div>';
          }
        } else {
          console.error('PayPal SDK未能正确加载 - 命名空间未找到');
          container.innerHTML = '<div style="color:red;text-align:center;padding:10px;">PayPal加载失败</div>';
        }
      };
      
      // 处理加载错误
      script.onerror = () => {
        console.error('PayPal SDK加载失败');
        container.innerHTML = '<div style="color:red;text-align:center;padding:10px;">PayPal加载失败</div>';
      };
      
      // 添加脚本到容器
      scriptContainer.appendChild(script);
    },

    // 简化的清理方法
    cleanupPayPalSDK() {
      const scriptContainer = document.getElementById('paypal-script-container');
      if (scriptContainer) {
        scriptContainer.innerHTML = '';
      }

      this.paypalButtonRendered = false;
      this.paypalLoadInProgress = false;

      // 清除全局对象
      window.paypalCheckout = undefined;
    },

    nextStep() {
      if (this.activeStep < 3) { this.activeStep++; }
    },
    prevStep() {
      if (this.activeStep > 0) {
        this.activeStep--;
      }
    },
    submitShippingInfo() {
      this.$refs.shippingForm.validate(async (valid) => {
        if (valid) {
          // 保存收货信息
          try {
            // 这里可以调用 API 保存收货地址
            // const response = await this.$api.post('/user/shipping-address', this.shippingInfo);
            this.nextStep();
          } catch (error) {
            console.error('保存收货信息失败:', error);
            this.$message.error(error.response?.data?.message || '保存收货信息失败');
          }
        } else {
          return false;
        }
      });
    },

    async processPayment() {
      this.loading = true;
      try {
        if (this.paymentMethod === 'paypal') {
          // PayPal支付在按钮点击时已处理，这里不需要额外操作
          this.loading = false;
          // 直接显示错误提示，告知用户点击PayPal按钮
          this.$message.info('请点击PayPal按钮完成支付');
          return;
        } else {
          // 处理其他支付方式（支付宝、微信支付）
          const paymentResult = await this.$api.post('/orders/payment', {
            paymentMethod: this.paymentMethod,
            shippingInfo: this.shippingInfo,
            orderItems: this.cartItems.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price
            }))
          });

          if (paymentResult.success) {
            // 支付成功，获取订单ID
            this.orderId = paymentResult.data.orderId;
            // 清空购物车
            await this.$api.delete('/cart/clear');
            // 进入完成步骤
            this.nextStep();
          } else {
            this.$message.error(paymentResult.message || '支付失败');
          }
        }
      } catch (error) {
        console.error('支付处理失败:', error);
        this.$message.error(error.response?.data?.message || '支付处理失败');
      } finally {
        this.loading = false;
      }
    },
    async generateQrcode() {
      this.qrcodeUrl = '';
      try {
        const response = await this.$api.post('/orders/qrcode', {
          paymentMethod: this.paymentMethod,
          orderInfo: {
            items: this.cartItems,
            total: this.totalPrice,
            shipping: this.shippingInfo
          }
        });
        if (response.success) {
          this.qrcodeUrl = response.data.qrcodeUrl;
          this.polling = true;
          this.startPolling();
        } else {
          this.$message.error(response.message || '二维码生成失败');
        }
      } catch (error) {
        this.$message.error(error.response?.data?.message || '二维码生成失败');
      }
    },
    startPolling() {
      if (this.pollingTimer) clearInterval(this.pollingTimer);
      this.pollingTimer = setInterval(this.checkPaymentStatus, 3000);
    },
    async checkPaymentStatus() {
      try {
        const response = await this.$api.post('/orders/check-status', {
          orderId: this.orderId,
          paymentMethod: this.paymentMethod
        });
        if (response.success && response.data.paid) {
          clearInterval(this.pollingTimer);
          this.polling = false;
          this.nextStep();
        }
      } catch (error) {
        // 可选：处理异常
      }
    },
  },
  beforeUnmount() {
    if (this.pollingTimer) clearInterval(this.pollingTimer);

    // 清理PayPal相关资源
    this.cleanupPayPalSDK();
  },
};
</script>

<style scoped>
.checkout-page {
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

.checkout-content {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.step-content {
  margin-top: 30px;
}

.step-content h2 {
  margin-bottom: 20px;
  font-size: 20px;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.product-info {
  display: flex;
  align-items: center;
}

.product-image {
  width: 80px;
  height: 80px;
  margin-right: 15px;
  border: 1px solid #eee;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-name {
  color: #333;
  text-decoration: none;
  font-weight: 500;
  margin-bottom: 5px;
  display: block;
}

.product-code {
  color: #999;
  font-size: 12px;
}

.order-summary {
  margin-top: 20px;
  text-align: right;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.order-total {
  font-size: 18px;
  font-weight: 500;
}

.total-price {
  color: #f56c6c;
  margin-left: 10px;
  font-size: 20px;
}

.step-actions {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
}

.step-actions .el-button {
  margin-left: 10px;
}

.payment-methods {
  margin-top: 20px;
}

.payment-method-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.payment-icons {
  margin-left: 20px;
  display: flex;
}

.payment-icon {
  width: 40px;
  height: 25px;
  margin-right: 10px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.card-payment-form {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.paypal-payment-form {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #f9f9f9;
  width: 100%;
}

#paypal-button-container {
  width: 100%;
  max-width: 750px;
  margin: 0 auto;
  min-height: 150px;
}

.order-success {
  text-align: center;
  padding: 30px 0;
}

.order-info {
  margin: 20px 0;
  text-align: left;
  display: inline-block;
}

.order-info p {
  margin: 10px 0;
  color: #666;
}

.result-actions {
  margin-top: 20px;
}

/* 支付错误样式 */
.payment-error {
  color: #f56c6c;
  margin-top: 10px;
  font-size: 14px;
  min-height: 20px;
}

/* QR码支付表单样式 */
.qrcode-payment-form {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #f9f9f9;
  text-align: center;
}

.qrcode-status {
  margin-top: 15px;
}
</style>