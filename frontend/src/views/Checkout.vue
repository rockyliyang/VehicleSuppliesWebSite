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
                <el-radio label="card">信用卡支付</el-radio>
                <div class="payment-icons">
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
              <div class="payment-method-item">
                <el-radio label="paypal">PayPal</el-radio>
                <div class="payment-icons">
                  <i class="payment-icon paypal"></i>
                </div>
              </div>
            </el-radio-group>

            <!-- 信用卡支付表单 -->
            <div v-if="paymentMethod === 'card'" class="card-payment-form">
              <el-form :model="cardInfo" :rules="cardRules" ref="cardForm" label-width="100px">
                <div class="card-form">
                  <div class="form-group">
                    <el-form-item label="卡号" prop="cardNumber">
                      <el-input id="card-number" v-model="cardInfo.cardNumber" placeholder="请输入卡号" maxlength="19"
                        @input="formatCardNumber">
                        <template #suffix>
                          <span v-if="cardType" class="card-type-icon" :class="cardType"></span>
                        </template>
                      </el-input>
                    </el-form-item>
                  </div>
                  <div class="form-row">
                    <div class="form-group expiry-date">
                      <label>过期时间 <span class="required">*</span></label>
                      <div class="expiry-selects">
                        <el-form-item prop="expiryMonth" style="margin-bottom: 0;">
                          <el-select v-model="cardInfo.expiryMonth" placeholder="月份">
                            <el-option v-for="month in 12" :key="month" :label="month < 10 ? '0' + month : month"
                              :value="month < 10 ? '0' + month : String(month)"></el-option>
                          </el-select>
                        </el-form-item>
                        <el-form-item prop="expiryYear" style="margin-bottom: 0;">
                          <el-select v-model="cardInfo.expiryYear" placeholder="年份">
                            <el-option v-for="year in 10" :key="year" :label="(new Date().getFullYear() + year - 1)"
                              :value="String(new Date().getFullYear() + year - 1)"></el-option>
                          </el-select>
                        </el-form-item>
                      </div>
                    </div>
                    <div class="form-group security-code">
                      <el-form-item label="安全码" prop="securityCode">
                        <el-input id="security-code" v-model="cardInfo.securityCode" placeholder="CVV/CVC"
                          maxlength="4"></el-input>
                        <div class="security-code-help">
                          <el-tooltip content="安全码是卡背面签名条上的最后3位数字" placement="top">
                            <span class="help-text">什么是安全码?</span>
                          </el-tooltip>
                        </div>
                      </el-form-item>
                    </div>
                  </div>
                  <div class="form-group remember-card">
                    <el-checkbox v-model="cardInfo.rememberCard">记住此卡，以便下次使用</el-checkbox>
                  </div>
                </div>
                <div id="card-errors" role="alert" class="error-message"></div>
              </el-form>
            </div>

            <!-- PayPal支付表单 -->
            <div v-if="paymentMethod === 'paypal'" class="paypal-payment-form">
              <div id="paypal-button-container">
                <!-- PayPal按钮将在这里渲染 -->
              </div>
              <div id="paypal-errors" role="alert"></div>
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
      stripe: null,
      cardElement: null,
      paymentMethod: 'card',
      cardType: '',
      paymentConfig: null,
      cardInfo: {
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        securityCode: '',
        rememberCard: false
      },
      cardRules: {
        cardNumber: [
          { required: true, message: '请输入卡号', trigger: 'blur' },
          { pattern: /^[0-9\s]{13,19}$/, message: '请输入有效的卡号', trigger: 'blur' }
        ],
        expiryMonth: [
          { required: true, message: '请选择到期月份', trigger: 'change' }
        ],
        expiryYear: [
          { required: true, message: '请选择到期年份', trigger: 'change' }
        ],
        securityCode: [
          { required: true, message: '请输入安全码', trigger: 'blur' },
          { pattern: /^[0-9]{3,4}$/, message: '安全码必须是3-4位数字', trigger: 'blur' }
        ]
      },
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
      regionOptions: [] // 省市区数据
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
    this.fetchPaymentConfig();
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
          // 加载支付SDK
          this.loadStripe();
          this.loadPayPal();
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
    loadStripe() {
      // 从配置中获取Stripe公钥和脚本URL
      const { publicKey, scriptUrl } = this.paymentConfig?.stripeConfig || {};
      
      if (!publicKey || !scriptUrl) {
        console.error('Stripe配置不完整');
        return;
      }
      
      // 加载 Stripe.js
      if (window.Stripe) {
        this.stripe = window.Stripe(publicKey);
        this.setupStripeElements();
      } else {
        // 如果 Stripe.js 还没有加载，添加脚本
        const script = document.createElement('script');
        script.src = scriptUrl;
        script.onload = () => {
          this.stripe = window.Stripe(publicKey);
          this.setupStripeElements();
        };
        document.head.appendChild(script);
      }
    },
    loadPayPal() {
      // 从配置中获取PayPal客户端ID、货币和脚本URL
      const { clientId, currency, scriptUrl } = this.paymentConfig?.paypalConfig || {};
      
      if (!clientId || !currency || !scriptUrl) {
        console.error('PayPal配置不完整');
        return;
      }
      
      // 只在需要时加载PayPal SDK
      if (window.paypal) {
        return;
      }
      
      const script = document.createElement('script');
      script.src = `${scriptUrl}?client-id=${clientId}&currency=${currency}`;
      script.async = true;
      document.head.appendChild(script);
    },
    
    renderPayPalButton() {
      // 确保PayPal SDK已加载
      if (!window.paypal) {
        setTimeout(() => this.renderPayPalButton(), 100);
        return;
      }
      
      // 清空容器
      const container = document.getElementById('paypal-button-container');
      if (!container) return;
      container.innerHTML = '';
      
      // 计算订单项
      const orderItems = this.cartItems.map(item => ({
        name: item.name,
        product_code: item.product_code,
        price: item.price,
        quantity: item.quantity
      }));
      
      // 渲染PayPal按钮
      window.paypal.Buttons({
        createOrder: async () => {
          try {
            // 调用后端创建PayPal订单
            const response = await this.$api.post('/paypal/create-order', {
              totalAmount: this.totalPrice,
              orderItems,
              currency: this.paymentConfig?.paypalConfig?.currency || 'USD'
            });
            
            if (response.success) {
              return response.data.orderId;
            } else {
              const errorElement = document.getElementById('paypal-errors');
              errorElement.textContent = response.message || '创建PayPal订单失败';
              throw new Error(response.message);
            }
          } catch (error) {
            console.error('创建PayPal订单失败:', error);
            const errorElement = document.getElementById('paypal-errors');
            errorElement.textContent = error.response?.data?.message || '创建PayPal订单失败';
            throw error;
          }
        },
        onApprove: async (data) => {
          try {
            this.loading = true;
            // 调用后端捕获PayPal支付
            const paymentResult = await this.$api.post('/paypal/capture-payment', {
              paypalOrderId: data.orderID,
              shippingInfo: this.shippingInfo
            });
            
            if (paymentResult.success) {
              // 支付成功，获取订单ID
              this.orderId = paymentResult.data.orderId;
              this.nextStep();
            } else {
              this.$message.error(paymentResult.message || 'PayPal支付失败');
            }
          } catch (error) {
            console.error('处理PayPal支付失败:', error);
            this.$message.error(error.response?.data?.message || '处理PayPal支付失败');
          } finally {
            this.loading = false;
          }
        },
        onError: (err) => {
          console.error('PayPal错误:', err);
          const errorElement = document.getElementById('paypal-errors');
          errorElement.textContent = '处理PayPal支付时发生错误';
          this.$message.error('处理PayPal支付时发生错误');
          this.loading = false;
        }
      }).render('#paypal-button-container');
    },
    
    setupStripeElements() {
      if (this.stripe && this.activeStep === 2) {
        const elements = this.stripe.elements();
        this.cardElement = elements.create('card', {
          style: {
            base: {
              fontSize: '16px',
              color: '#32325d',
              fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
              '::placeholder': {
                color: '#aab7c4'
              }
            },
            invalid: {
              color: '#fa755a',
              iconColor: '#fa755a'
            }
          }
        });
        
        // 在下一个 tick 中挂载元素，确保 DOM 已更新
        this.$nextTick(() => {
          const cardElement = document.getElementById('card-element');
          if (cardElement) {
            this.cardElement.mount('#card-element');
            this.cardElement.on('change', (event) => {
              const displayError = document.getElementById('card-errors');
              if (event.error) {
                displayError.textContent = event.error.message;
              } else {
                displayError.textContent = '';
              }
            });
          }
        });
      }
    },
    nextStep() {
      if (this.activeStep < 3) {
        this.activeStep++;
        // 如果进入支付步骤，设置支付元素
        if (this.activeStep === 2) {
          this.$nextTick(() => {
            if (this.paymentMethod === 'card') {
              this.setupStripeElements();
            } else if (this.paymentMethod === 'paypal') {
              this.renderPayPalButton();
            }
          });
        }
      }
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
    formatCardNumber(value) {
      // 移除所有非数字字符
      let v = value.replace(/\D/g, '');
      // 每4位数字后添加空格
      v = v.replace(/(.{4})/g, '$1 ').trim();
      // 更新模型值
      this.cardInfo.cardNumber = v;
      
      // 清除之前的错误信息
      const errorElement = document.getElementById('card-errors');
      if (errorElement) {
        errorElement.textContent = '';
      }
      
      // 验证卡号长度
      if (v.length > 0 && v.replace(/\s/g, '').length < 13) {
        if (errorElement) {
          errorElement.textContent = '信用卡号长度不足';
        }
      }
      
      // 检测并更新卡类型
      this.cardType = this.detectCardType(v);
    },
    
    // 检测信用卡类型
    detectCardType(cardNumber) {
      // 移除空格
      const number = cardNumber.replace(/\s+/g, '');
      let type = '';
      
      // Visa卡以4开头，长度为13、16或19位
      if (/^4\d{12}(\d{3}|\d{6})?$/.test(number)) {
        type = 'visa';
      }
      // MasterCard卡以51-55开头，长度为16位
      else if (/^5[1-5]\d{14}$/.test(number)) {
        type = 'mastercard';
      }
      // American Express卡以34或37开头，长度为15位
      else if (/^3[47]\d{13}$/.test(number)) {
        type = 'amex';
      }
      // Discover卡以6011开头或以65开头，长度为16位
      else if (/^(6011|65\d{2})\d{12}$/.test(number)) {
        type = 'discover';
      }
      
      return type;
    },
    
    // 验证卡号是否有效（使用Luhn算法）
    validateCardNumber(cardNumber) {
      const number = cardNumber.replace(/\s+/g, '');
      if (!/^\d+$/.test(number)) return false;
      
      let sum = 0;
      let shouldDouble = false;
      
      // 从右向左遍历
      for (let i = number.length - 1; i >= 0; i--) {
        let digit = parseInt(number.charAt(i));
        
        if (shouldDouble) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        
        sum += digit;
        shouldDouble = !shouldDouble;
      }
      
      return (sum % 10) === 0;
    },
    
    validateCardInfo() {
      return new Promise((resolve) => {
        this.$refs.cardForm.validate((valid) => {
          if (valid) {
            const errorElement = document.getElementById('card-errors');
            // 清除之前的错误信息
            errorElement.textContent = '';
            
            // 检查信用卡号是否有效
            const cardNumber = this.cardInfo.cardNumber.replace(/\s+/g, '');
            if (!this.validateCardNumber(cardNumber)) {
              errorElement.textContent = '无效的信用卡号';
              resolve(false);
              return;
            }
            
            // 检测卡类型
            const cardType = this.detectCardType(cardNumber);
            if (!cardType) {
              errorElement.textContent = '不支持的信用卡类型';
              resolve(false);
              return;
            }
            
            // 检查信用卡有效期是否已过期
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth() + 1;
            
            const expiryYear = parseInt(this.cardInfo.expiryYear);
            const expiryMonth = parseInt(this.cardInfo.expiryMonth);
            
            if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
              errorElement.textContent = '信用卡已过期';
              resolve(false);
            } else {
              resolve(true);
            }
          } else {
            resolve(false);
          }
        });
      });
    },
    
    async processPayment() {
      this.loading = true;
      try {
        let paymentResult;
        
        if (this.paymentMethod === 'card') {
          // 验证信用卡信息
          const isValid = await this.validateCardInfo();
          if (!isValid) {
            this.loading = false;
            return;
          }
          
          // 构建信用卡令牌数据
          const cardToken = {
            card_number: this.cardInfo.cardNumber.replace(/\s+/g, ''),
            expiry: `${this.cardInfo.expiryMonth}/${this.cardInfo.expiryYear.slice(-2)}`,
            security_code: this.cardInfo.securityCode,
            name: this.shippingInfo.name
          };
          
          // 发送支付信息到后端
          paymentResult = await this.$api.post('/orders/payment', {
            paymentMethod: this.paymentMethod,
            token: cardToken,
            shippingInfo: this.shippingInfo,
            orderItems: this.cartItems.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price
            }))
          });
        } else if (this.paymentMethod === 'paypal') {
          // PayPal支付在按钮点击时已处理，这里不需要额外操作
          // 显示PayPal按钮
          this.renderPayPalButton();
          return; // 中断后续流程，由PayPal按钮处理
        } else {
          // 处理其他支付方式
          paymentResult = await this.$api.post('/orders/payment', {
            paymentMethod: this.paymentMethod,
            shippingInfo: this.shippingInfo
          });
        }
        
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
      } catch (error) {
        console.error('支付处理失败:', error);
        this.$message.error(error.response?.data?.message || '支付处理失败');
      } finally {
        this.loading = false;
      }
    }
  }
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

/* 信用卡表单样式 */
.card-payment-form {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.card-form {
  max-width: 500px;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 20px;
}

.expiry-date {
  flex: 1;
}

.expiry-selects {
  display: flex;
  gap: 10px;
}

.expiry-selects .el-select {
  flex: 1;
}

.expiry-selects .el-form-item {
  margin-right: 10px;
  width: 100%;
}

.security-code {
  flex: 1;
}

.security-code-help {
  margin-top: 5px;
}

.help-text {
  font-size: 12px;
  color: #409EFF;
  cursor: pointer;
}

.required {
  color: #f56c6c;
}

/* 错误信息样式 */
.error-message {
  color: #f56c6c;
  font-size: 14px;
  margin-top: 10px;
  min-height: 20px;
}

/* 信用卡表单特殊样式 */
.card-payment-form .el-form-item__label {
  font-weight: 500;
}

.card-payment-form .el-input__inner {
  height: 40px;
  line-height: 40px;
}

.card-payment-form .el-form-item.is-error .el-input__inner {
  border-color: #f56c6c;
}

/* 卡类型图标样式 */
.card-type-icon {
  display: inline-block;
  width: 32px;
  height: 20px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.card-type-icon.visa {
  background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1NzYgMzc3Ij48cGF0aCBkPSJNNTc2IDI4MS43YzAgNTIuMy00My4yIDk1LjMtOTYuNiA5NS4zSDk2LjZDNDMuMiAzNzcgMCAzMzQgMCAyODEuN1Y5NS4zQzAgNDMgNDMuMiAwIDk2LjYgMGgzODIuOEM1MzIuOCAwIDU3NiA0MyA1NzYgOTUuM3YxODYuNHoiIGZpbGw9IiMxNTY1YzAiLz48cGF0aCBkPSJNMzI0LjEgMTQ1LjFjMTIuNS0zLjIgMjUuNi0xLjEgMzYuOSA1LjZsLTYuMSAzOC4xYy0xMS4xLTUuOC0yNS45LTguMS0zOC42LTIuMS0xNi4yIDcuNS0yMS4yIDI4LjEtMTAuMyA0MS4yIDEwLjQgMTIuNiAzMC4yIDEzLjIgNDMuNSAzLjZsNi4xIDM1LjJjLTEzLjIgNS40LTI3LjkgNi43LTQxLjkgMy45LTM2LjYtNy4zLTU4LjMtNDYuNC00OS01MiA5LjgtNS45IDE5LjgtMTIuNSAyNi4zLTIyLjYgNi41LTEwLjEgOC40LTIyLjcgNi4xLTM0LjQtMi4zLTExLjgtOS4yLTIyLjItMTktMjkuNSA5LjUtMi4yIDE5LjUtMS4yIDI4LjQgMi45bDYuMSAzNS4yYy0xMy4yIDUuNC0yNy45IDYuNy00MS45IDMuOS0zNi42LTcuMy01OC4zLTQ2LjQtNDktNTIgOS44LTUuOSAxOS44LTEyLjUgMjYuMy0yMi42IDYuNS0xMC4xIDguNC0yMi43IDYuMS0zNC40LTIuMy0xMS44LTkuMi0yMi4yLTE5LTI5LjUgOS41LTIuMiAxOS41LTEuMiAyOC40IDIuOXoiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMzgzLjMgMjM1LjZjMC0zLjYgMi45LTYuNSA2LjUtNi41aDI2LjRjMy42IDAgNi41IDIuOSA2LjUgNi41djExLjhjMCA1LjUtNC41IDEwLTEwIDEwaC0xOS40Yy01LjUgMC0xMC00LjUtMTAtMTB2LTExLjh6TTQ2Mi4zIDE2Mi4yYzAtMy42IDIuOS02LjUgNi41LTYuNWgyNi40YzMuNiAwIDYuNSAyLjkgNi41IDYuNXYxMS44YzAgNS41LTQuNSAxMC0xMCAxMGgtMTkuNGMtNS41IDAtMTAtNC41LTEwLTEwdi0xMS44ek0zODMuMyAxNjIuMmMwLTMuNiAyLjktNi41IDYuNS02LjVoMjYuNGMzLjYgMCA2LjUgMi45IDYuNSA2LjV2MTEuOGMwIDUuNS00LjUgMTAtMTAgMTBoLTE5LjRjLTUuNSAwLTEwLTQuNS0xMC0xMHYtMTEuOHpNMTgxLjEgMTQ1LjFjMTIuNS0zLjIgMjUuNi0xLjEgMzYuOSA1LjZsLTYuMSAzOC4xYy0xMS4xLTUuOC0yNS45LTguMS0zOC42LTIuMS0xNi4yIDcuNS0yMS4yIDI4LjEtMTAuMyA0MS4yIDEwLjQgMTIuNiAzMC4yIDEzLjIgNDMuNSAzLjZsNi4xIDM1LjJjLTEzLjIgNS40LTI3LjkgNi43LTQxLjkgMy45LTM2LjYtNy4zLTU4LjMtNDYuNC00OS01MiA5LjgtNS45IDE5LjgtMTIuNSAyNi4zLTIyLjYgNi41LTEwLjEgOC40LTIyLjcgNi4xLTM0LjQtMi4zLTExLjgtOS4yLTIyLjItMTktMjkuNSA5LjUtMi4yIDE5LjUtMS4yIDI4LjQgMi45bDYuMSAzNS4yYy0xMy4yIDUuNC0yNy45IDYuNy00MS45IDMuOS0zNi42LTcuMy01OC4zLTQ2LjQtNDktNTIgOS44LTUuOSAxOS44LTEyLjUgMjYuMy0yMi42IDYuNS0xMC4xIDguNC0yMi43IDYuMS0zNC40LTIuMy0xMS44LTkuMi0yMi4yLTE5LTI5LjUgOS41LTIuMiAxOS41LTEuMiAyOC40IDIuOXoiIGZpbGw9IiNmZmYiLz48L3N2Zz4=');
}

.card-type-icon.mastercard {
  background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MDQgMzI0Ij48cGF0aCBkPSJNNTAzLjcgMzI0SDQ3LjhjLTI2LjQgMC00Ny44LTIxLjQtNDcuOC00Ny44VjQ3LjhDMCAyMS40IDIxLjQgMCA0Ny44IDBINDUzYzI2LjQgMCA0Ny44IDIxLjQgNDcuOCA0Ny44djIyOC40YzAgMjYuNC0yMS40IDQ3LjgtNDcuOCA0Ny44aC01MC43eiIgZmlsbD0iIzE2MzIwYyIvPjxwYXRoIGQ9Ik0zMDQuMiAxNjEuOWMwLTQ5LjQtNDAuMS04OS41LTg5LjUtODkuNXMtODkuNSA0MC4xLTg5LjUgODkuNSA0MC4xIDg5LjUgODkuNSA4OS41IDg5LjUtNDAuMSA4OS41LTg5LjV6IiBmaWxsPSIjZmY5ODAwIi8+PHBhdGggZD0iTTMzNy45IDE2MS45YzAtNDkuNC00MC4xLTg5LjUtODkuNS04OS41cy04OS41IDQwLjEtODkuNSA4OS41IDQwLjEgODkuNSA4OS41IDg5LjUgODkuNS00MC4xIDg5LjUtODkuNXoiIGZpbGw9IiNlYjAwMWIiLz48cGF0aCBkPSJNMjQ4LjQgMjE2LjdjLTMwLjIgMC01NC44LTI0LjYtNTQuOC01NC44czI0LjYtNTQuOCA1NC44LTU0LjggNTQuOCAyNC42IDU0LjggNTQuOC0yNC42IDU0LjgtNTQuOCA1NC44eiIgZmlsbD0iI2Y3OWUxYiIvPjwvc3ZnPg==');
}

.card-type-icon.amex {
  background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1NzYgMzc3Ij48cGF0aCBkPSJNNTc2IDI4MS43YzAgNTIuMy00My4yIDk1LjMtOTYuNiA5NS4zSDk2LjZDNDMuMiAzNzcgMCAzMzQgMCAyODEuN1Y5NS4zQzAgNDMgNDMuMiAwIDk2LjYgMGgzODIuOEM1MzIuOCAwIDU3NiA0MyA1NzYgOTUuM3YxODYuNHoiIGZpbGw9IiMwMDZmY2YiLz48cGF0aCBkPSJNMjMxLjYgMTQwLjdoMTEzLjV2MjIuN0gyMzEuNnYtMjIuN3ptLTIzLjEgMGg0NS44bDEwLjQgMjIuN2gtNTYuMnYtMjIuN3ptMTU5LjMgMGg0NS44djIyLjdoLTU2LjJsMTAuNC0yMi43em0tMTU5LjMgNDUuNGg0NS44bDEwLjQgMjIuN2gtNTYuMnYtMjIuN3ptMTU5LjMgMGg0NS44djIyLjdoLTU2LjJsMTAuNC0yMi43em0tMTM2LjIgNDUuNGg0NS44bDEwLjQgMjIuN2gtNTYuMnYtMjIuN3ptMTEzLjEgMGg0NS44djIyLjdoLTU2LjJsMTAuNC0yMi43eiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==');
}

.card-type-icon.discover {
  background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1NzYgMzc3Ij48cGF0aCBkPSJNNTc2IDI4MS43YzAgNTIuMy00My4yIDk1LjMtOTYuNiA5NS4zSDk2LjZDNDMuMiAzNzcgMCAzMzQgMCAyODEuN1Y5NS4zQzAgNDMgNDMuMiAwIDk2LjYgMGgzODIuOEM1MzIuOCAwIDU3NiA0MyA1NzYgOTUuM3YxODYuNHoiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMzA4LjEgMTU5LjJjMC0zNC4xIDI3LjYtNjEuNyA2MS43LTYxLjdzNjEuNyAyNy42IDYxLjcgNjEuNy0yNy42IDYxLjctNjEuNyA2MS43LTYxLjctMjcuNi02MS43LTYxLjd6IiBmaWxsPSIjZjI3MjEyIi8+PHBhdGggZD0iTTEyMC4xIDE5Ny4zaDIzLjJ2LTc2LjJoLTIzLjJ2NzYuMnptMzQuOC0zOC4xYzAgMjIuMSAxOC4xIDQwLjIgNDAuMiA0MC4yaDIzLjJ2LTIzLjJoLTIzLjJjLTkuNCAwLTE3LTcuNi0xNy0xN3M3LjYtMTcgMTctMTdoMjMuMnYtMjMuMmgtMjMuMmMtMjIuMSAwLTQwLjIgMTguMS00MC4yIDQwLjJ6bTEyNi4zLTM4LjFoLTIzLjJ2NzYuMmgyMy4ydi03Ni4yem0xMTQuNyA3Ni4yaDIzLjJ2LTc2LjJoLTIzLjJ2NzYuMnptLTU3LjQtNzYuMmgtMjMuMnY3Ni4yaDIzLjJ2LTc2LjJ6IiBmaWxsPSIjMDAwIi8+PC9zdmc+');
}


.payment-icon.paypal {
  background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAxcHgiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAxMDEgMzIiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaW5ZTWluIG1lZXQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZmlsbD0iIzAwMzA4NyIgZD0iTSAxMi4yMzcgMi40NDQgTCA0LjQzNyAyLjQ0NCBDIDMuOTM3IDIuNDQ0IDMuNDM3IDIuODQ0IDMuMzM3IDMuMzQ0IEwgMC4yMzcgMjMuMzQ0IEMgMC4xMzcgMjMuNzQ0IDAuNDM3IDI0LjA0NCAwLjgzNyAyNC4wNDQgTCA0LjUzNyAyNC4wNDQgQyA1LjAzNyAyNC4wNDQgNS41MzcgMjMuNjQ0IDUuNjM3IDIzLjE0NCBMIDYuNDM3IDE3Ljc0NCBDIDYuNTM3IDE3LjI0NCA2LjkzNyAxNi44NDQgNy41MzcgMTYuODQ0IEwgMTAuMDM3IDE2Ljg0NCBDIDE1LjEzNyAxNi44NDQgMTguMTM3IDE0LjM0NCAxOC45MzcgOS40NDQgQyAxOS4yMzcgNy4zNDQgMTguOTM3IDUuNjQ0IDE3LjkzNyA0LjQ0NCBDIDE2LjgzNyAzLjE0NCAxNC44MzcgMi40NDQgMTIuMjM3IDIuNDQ0IFogTSAxMy4xMzcgOS43NDQgQyAxMi43MzcgMTIuNTQ0IDEwLjUzNyAxMi41NDQgOC41MzcgMTIuNTQ0IEwgNy4zMzcgMTIuNTQ0IEwgOC4xMzcgNy4zNDQgQyA4LjEzNyA3LjA0NCA4LjQzNyA2Ljg0NCA4LjczNyA2Ljg0NCBMIDkuMjM3IDYuODQ0IEMgMTAuNjM3IDYuODQ0IDExLjkzNyA2Ljg0NCAxMi42MzcgNy42NDQgQyAxMy4xMzcgOC4wNDQgMTMuMzM3IDguNzQ0IDEzLjEzNyA5Ljc0NCBaIj48L3BhdGg+PHBhdGggZmlsbD0iIzAwMzA4NyIgZD0iTSAzNS40MzcgOS42NDQgTCAzMS43MzcgOS42NDQgQyAzMS40MzcgOS42NDQgMzEuMTM3IDkuODQ0IDMxLjEzNyAxMC4xNDQgTCAzMC45MzcgMTEuMTQ0IEwgMzAuNjM3IDEwLjc0NCBDIDI5LjgzNyA5LjU0NCAyOC4wMzcgOS4xNDQgMjYuMjM3IDkuMTQ0IEMgMjIuMTM3IDkuMTQ0IDE4LjYzNyAxMi4yNDQgMTcuOTM3IDE2LjY0NCBDIDE3LjUzNyAxOC44NDQgMTguMDM3IDIwLjk0NCAxOS4zMzcgMjIuMzQ0IEMgMjAuNDM3IDIzLjY0NCAyMi4xMzcgMjQuMjQ0IDI0LjAzNyAyNC4yNDQgQyAyNy4zMzcgMjQuMjQ0IDI5LjIzNyAyMi4xNDQgMjkuMjM3IDIyLjE0NCBMIDI5LjAzNyAyMy4xNDQgQyAyOC45MzcgMjMuNTQ0IDI5LjIzNyAyMy45NDQgMjkuNjM3IDIzLjk0NCBMIDM0LjAzNyAyMy45NDQgQyAzNC41MzcgMjMuOTQ0IDM1LjAzNyAyMy41NDQgMzUuMTM3IDIzLjA0NCBMIDM2LjkzNyAxMC4yNDQgQyAzNy4wMzcgOS44NDQgMzYuNzM3IDkuNjQ0IDM2LjQzNyA5LjY0NCBMIDM1LjQzNyA5LjY0NCBaIE0gMzAuMzM3IDE2Ljg0NCBDIDI5LjkzNyAxOC45NDQgMjguMzM3IDIwLjQ0NCAyNi4xMzcgMjAuNDQ0IEMgMjUuMDM3IDIwLjQ0NCAyNC4yMzcgMjAuMTQ0IDIzLjYzNyAxOS40NDQgQyAyMy4wMzcgMTguNzQ0IDIyLjgzNyAxNy44NDQgMjMuMDM3IDE2Ljc0NCBDIDI0LjgzNyAxMC45NDQgMzAuOTM3IDE0LjA0NCAzMC4zMzcgMTYuODQ0IFoiPjwvcGF0aD48cGF0aCBmaWxsPSIjMDAzMDg3IiBkPSJNIDU1LjMzNyA5LjY0NCBMIDU0LjkzNyA5LjY0NCBMIDUxLjYzNyA5LjY0NCBDIDU0LjkzNyA5LjY0NCA1MS4wMzcgOS42NDQgNTAuNjM3IDkuNjQ0IEMgNTAuMjM3IDkuNjQ0IDQ5LjgzNyA5Ljk0NCA0OS42MzcgMTAuMjQ0IEwgNDUuNTM3IDIwLjE0NCBMIDQzLjQzNyAxMC42NDQgQyA0My4zMzcgMTAuMTQ0IDQyLjgzNyA5LjY0NCA0Mi4zMzcgOS42NDQgTCAzOC42MzcgOS42NDQgQyAzOC4yMzcgOS42NDQgMzcuODM3IDEwLjA0NCAzOC4wMzcgMTAuNTQ0IEwgNDEuOTM3IDIyLjc0NCBMIDQxLjkzNyAyMi44NDQgTCAzOC4yMzcgMjguNzQ0IEMgMzcuOTM3IDI5LjE0NCAzOC4yMzcgMjkuNzQ0IDM4LjczNyAyOS43NDQgTCA0Mi40MzcgMjkuNzQ0IEMgNDIuODM3IDI5Ljc0NCA0My4xMzcgMjkuNTQ0IDQzLjMzNyAyOS4yNDQgTCA1NS44MzcgMTAuNTQ0IEMgNTYuMTM3IDEwLjE0NCA1NS44MzcgOS42NDQgNTUuMzM3IDkuNjQ0IFoiPjwvcGF0aD48cGF0aCBmaWxsPSIjMDA5Y2RlIiBkPSJNIDY3LjczNyAyLjQ0NCBMIDU5LjkzNyAyLjQ0NCBDIDU5LjQzNyAyLjQ0NCA1OC45MzcgMi44NDQgNTguODM3IDMuMzQ0IEwgNTUuNzM3IDIzLjM0NCBDIDU1LjYzNyAyMy43NDQgNTUuOTM3IDI0LjA0NCA1Ni4zMzcgMjQuMDQ0IEwgNjAuMzM3IDI0LjA0NCBDIDYwLjczNyAyNC4wNDQgNjEuMDM3IDIzLjc0NCA2MS4wMzcgMjMuMzQ0IEwgNjEuOTM3IDE3Ljc0NCBDIDY0LjUzNyAxNy43NDQgNjEuOTM3IDE3Ljc0NCA2Mi4wMzcgMTcuNzQ0IEMgNjIuMTM3IDE3LjI0NCA2Mi41MzcgMTYuODQ0IDYzLjEzNyAxNi44NDQgTCA2NS42MzcgMTYuODQ0IEMgNzAuNzM3IDE2Ljg0NCA3My43MzcgMTQuMzQ0IDc0LjUzNyA5LjQ0NCBDIDY1LjYzNyA5LjQ0NCA3NC41MzcgOS40NDQgNzQuNTM3IDkuNDQ0IEMgNzQuODM3IDcuMzQ0IDc0LjUzNyA1LjY0NCA3My41MzcgNC40NDQgQyA3Mi40MzcgMy4xNDQgNzAuMzM3IDIuNDQ0IDY3LjczNyAyLjQ0NCBaIE0gNjguNjM3IDkuNzQ0IEMgNjguMjM3IDEyLjU0NCA2Ni4wMzcgMTIuNTQ0IDY0LjAzNyAxMi41NDQgTCA2Mi44MzcgMTIuNTQ0IEwgNjMuNjM3IDcuMzQ0IEMgNjMuNjM3IDcuMDQ0IDYzLjkzNyA2Ljg0NCA2NC4yMzcgNi44NDQgTCA2NC43MzcgNi44NDQgQyA2Ni4xMzcgNi44NDQgNjcuNDM3IDYuODQ0IDY4LjEzNyA3LjY0NCBDIDY4LjYzNyA4LjA0NCA2OC43MzcgOC43NDQgNjguNjM3IDkuNzQ0IFoiPjwvcGF0aD48cGF0aCBmaWxsPSIjMDA5Y2RlIiBkPSJNIDkwLjkzNyA5LjY0NCBMIDg3LjIzNyA5LjY0NCBDIDU5LjQzNyAyLjQ0NCA4Ny4yMzcgOS42NDQgODYuOTM3IDkuNjQ0IEMgODYuNjM3IDkuNjQ0IDg2LjMzNyA5Ljg0NCA4Ni4zMzcgMTAuMTQ0IEwgODYuMTM3IDExLjE0NCBMIDg1LjgzNyAxMC43NDQgQyA4NS4wMzcgOS41NDQgODMuMjM3IDkuMTQ0IDgxLjQzNyA5LjE0NCBDIDU5LjQzNyAyLjQ0NCA4MS40MzcgOS4xNDQgODEuNDM3IDkuMTQ0IEMgNzcuMzM3IDkuMTQ0IDczLjgzNyAxMi4yNDQgNzMuMTM3IDE2LjY0NCBDIDU5LjQzNyAyLjQ0NCA3My4xMzcgMTYuNjQ0IDczLjEzNyAxNi42NDQgQyA3Mi43MzcgMTguODQ0IDczLjIzNyAyMC45NDQgNzQuNTM3IDIyLjM0NCBDIDU5LjQzNyAyLjQ0NCA3NC41MzcgMjIuMzQ0IDc0LjUzNyAyMi4zNDQgQyA3NS42MzcgMjMuNjQ0IDc3LjMzNyAyNC4yNDQgNzkuMjM3IDI0LjI0NCBDIDU5LjQzNyAyLjQ0NCA3OS4yMzcgMjQuMjQ0IDc5LjIzNyAyNC4yNDQgQyA4Mi41MzcgMjQuMjQ0IDg0LjQzNyAyMi4xNDQgODQuNDM3IDIyLjE0NCBMIDU5LjQzNyAyLjQ0NCA4NC40MzcgMjIuMTQ0IEwgODQuMjM3IDIzLjE0NCBDIDU5LjQzNyAyLjQ0NCA4NC4yMzcgMjMuMTQ0IDg0LjIzNyAyMy4xNDQgQyA4NC4xMzcgMjMuNTQ0IDg0LjQzNyAyMy45NDQgODQuODM3IDIzLjk0NCBMIDU5LjQzNyAyLjQ0NCA4NC44MzcgMjMuOTQ0IEwgODkuMjM3IDIzLjk0NCBDIDU5LjQzNyAyLjQ0NCA4OS4yMzcgMjMuOTQ0IDg5LjIzNyAyMy45NDQgQyA4OS43MzcgMjMuOTQ0IDkwLjIzNyAyMy41NDQgOTAuMzM3IDIzLjA0NCBMIDU5LjQzNyAyLjQ0NCA5MC4zMzcgMjMuMDQ0IEwgOTIuMTM3IDEwLjI0NCBDIDU5LjQzNyAyLjQ0NCA5Mi4xMzcgMTAuMjQ0IDkyLjEzNyAxMC4yNDQgQyA5Mi4yMzcgOS44NDQgOTEuOTM3IDkuNjQ0IDkxLjYzNyA5LjY0NCBMIDU5LjQzNyAyLjQ0NCA5MS42MzcgOS42NDQgTCA5MC45MzcgOS42NDQgWiBNIDg1LjUzNyAxNi44NDQgQyA4NS4xMzcgMTguOTQ0IDgzLjUzNyAyMC40NDQgODEuMzM3IDIwLjQ0NCBDIDU5LjQzNyAyLjQ0NCA4MS4zMzcgMjAuNDQ0IDgxLjMzNyAyMC40NDQgQyA4MC4yMzcgMjAuNDQ0IDc5LjQzNyAyMC4xNDQgNzguODM3IDE5LjQ0NCBDIDU5LjQzNyAyLjQ0NCA3OC44MzcgMTkuNDQ0IDc4LjgzNyAxOS40NDQgQyA3OC4yMzcgMTguNzQ0IDc4LjAzNyAxNy44NDQgNzguMjM3IDE2Ljc0NCBDIDU5LjQzNyAyLjQ0NCA3OC4yMzcgMTYuNzQ0IDc4LjIzNyAxNi43NDQgQyA3OC42MzcgMTQuNjQ0IDgwLjMzNyAxMy4xNDQgODIuNDM3IDEzLjE0NCBDIDU5LjQzNyAyLjQ0NCA4Mi40MzcgMTMuMTQ0IDgyLjQzNyAxMy4xNDQgQyA4My41MzcgMTMuMTQ0IDg0LjMzNyAxMy40NDQgODQuOTM3IDE0LjE0NCBDIDU5LjQzNyAyLjQ0NCA4NC45MzcgMTQuMTQ0IDg0LjkzNyAxNC4xNDQgQyA4NS41MzcgMTQuOTQ0IDg1LjczNyAxNS44NDQgODUuNTM3IDE2Ljg0NCBaIj48L3BhdGg+PHBhdGggZmlsbD0iIzAwOWNkZSIgZD0iTSA5NS4zMzcgMi45NDQgTCA5My4zMzcgMTcuMTQ0IEMgOTMuMjM3IDE3LjU0NCA5My41MzcgMTcuOTQ0IDkzLjkzNyAxNy45NDQgTCA5Ni43MzcgMTcuOTQ0IEMgOTcuMjM3IDE3Ljk0NCA5Ny43MzcgMTcuNTQ0IDk3LjgzNyAxNy4wNDQgTCA5OS44MzcgMy4xNDQgQyA5OS45MzcgMi43NDQgOTkuNjM3IDIuMzQ0IDk5LjIzNyAyLjM0NCBMIDk2LjAzNyAyLjM0NCBDIDU5LjQzNyAyLjQ0NCA5Ni4wMzcgMi4zNDQgOTYuMDM3IDIuMzQ0IEMgOTUuNjM3IDIuMzQ0IDk1LjQzNyAyLjU0NCA5NS4zMzcgMi45NDQgWiI+PC9wYXRoPjwvc3ZnPg==');
}

.paypal-payment-form {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.card-payment-form {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 4px;
}

#card-element {
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

#card-errors {
  color: #f56c6c;
  margin-top: 10px;
  min-height: 20px;
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
</style>