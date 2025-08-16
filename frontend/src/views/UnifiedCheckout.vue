<template>
  <div class="unified-checkout">
    <!-- 页面横幅 -->
    <PageBanner :title="isOrderDetail ? ($t('order.detail') || '订单详情') : ($t('checkout.title') || '结算页面')" />

    <!-- Navigation Menu -->
    <NavigationMenu :breadcrumb-items="breadcrumbItems" />

    <div class="container mx-auto px-4">
      <div class="checkout-content">
        <!-- 订单信息 -->
        <section class="order-summary">
          <h2 class="section-title">
            <div class="title-content">
              <el-icon>
                <ShoppingCart />
              </el-icon>
              {{ $t('checkout.orderInfo') || '订单信息' }}
            </div>
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
              <template #default="{row}">{{ $store.getters.formatPrice(row.calculatedPrice || row.price) }}</template>
            </el-table-column>
            <el-table-column :label="$t('checkout.subtotal') || '小计'" width="120" align="right">
              <template #default="{row}">
                <span class="subtotal-price">{{ $store.getters.formatPrice((row.calculatedPrice || row.price) *
                  row.quantity) }}</span>
              </template>
            </el-table-column>
          </el-table>
          <div class="order-total">
            <span>{{ $t('checkout.total') || '总计' }}:</span>
            <span class="total-price">{{ $store.getters.formatPrice(orderTotal) }}</span>
          </div>
        </section>

        <!-- 收货信息 -->
        <section class="shipping-info">
          <h2 class="section-title">
            <div class="title-content">
              <el-icon>
                <Location />
              </el-icon>
              {{ $t('checkout.shippingInfo') || '收货信息' }}
            </div>
            <div class="shipping-header" v-if="!isOrderDetail">
              <el-button @click="showAddressDialog = true" type="primary" class="address-select-btn">
                {{ $t('address.selectFromBook') || '从地址簿选择' }}
              </el-button>
            </div>
          </h2>
          <el-form :model="shippingInfo" :rules="isOrderDetail ? {} : shippingRules" ref="shippingForm" label-width="0"
            class="shipping-form">
            <div class="form-row">
              <el-form-item prop="name">
                <el-input v-model="shippingInfo.name" :placeholder="$t('checkout.namePlaceholder') || '收货人姓名'"
                  :readonly="isOrderDetail" clearable />
              </el-form-item>
              <el-form-item prop="country">
                <el-select v-model="shippingInfo.country" :placeholder="$t('checkout.countryPlaceholder') || '选择国家'"
                  :disabled="isOrderDetail" clearable @change="handleCountryChange">
                  <el-option v-for="country in countries" :key="country.iso3" :label="country.name"
                    :value="country.name">
                  </el-option>
                </el-select>
              </el-form-item>
            </div>
            <div class="form-row">
              <el-form-item prop="state">
                <el-select v-if="currentStates.length > 0" v-model="shippingInfo.state"
                  :placeholder="$t('checkout.statePlaceholder') || '选择省份'"
                  :disabled="isOrderDetail || !shippingInfo.country" clearable @change="handleStateChange">
                  <el-option v-for="state in currentStates" :key="state.id" :label="state.name" :value="state.name">
                  </el-option>
                </el-select>
                <el-input v-else v-model="shippingInfo.state" :placeholder="$t('checkout.statePlaceholder') || '选择省份'"
                  :readonly="isOrderDetail" clearable />
              </el-form-item>
              <el-form-item prop="city">
                <el-input v-model="shippingInfo.city" :placeholder="$t('checkout.cityPlaceholder') || '城市'"
                  :readonly="isOrderDetail" clearable />
              </el-form-item>
            </div>
            <div class="form-row">
              <el-form-item class="phone-input-group">
                <el-select v-model="shippingInfo.phone_country_code"
                  :placeholder="$t('checkout.countryCodePlaceholder') || '区号'" :disabled="isOrderDetail" clearable
                  class="country-code-select">
                  <el-option v-for="country in countries" :key="country.iso3" :label="country.phone_code"
                    :value="country.phone_code">
                  </el-option>
                </el-select>
                <el-input v-model="shippingInfo.phone" :placeholder="$t('checkout.phonePlaceholder') || '手机号码'"
                  :readonly="isOrderDetail" clearable class="phone-number-input" />
              </el-form-item>
              <el-form-item>
                <el-input v-model="shippingInfo.email" :placeholder="$t('checkout.emailPlaceholder') || '邮箱地址'"
                  :readonly="isOrderDetail" clearable autocomplete="off" />
              </el-form-item>
            </div>
            <div class="form-row">
              <el-form-item prop="zipCode">
                <el-input v-model="shippingInfo.zipCode" :placeholder="$t('checkout.zipCodePlaceholder') || '邮政编码'"
                  :readonly="isOrderDetail" clearable />
              </el-form-item>
            </div>
            <el-form-item prop="address">
              <el-input v-model="shippingInfo.address" type="textarea" :rows="3"
                :placeholder="$t('checkout.addressPlaceholder') || '详细收货地址'" :readonly="isOrderDetail" />
            </el-form-item>
          </el-form>
        </section>

        <!-- 支付方式 -->
        <section class="payment-methods" v-if="!isOrderDetail || !isOrderPaid">
          <h2 class="section-title">
            <div class="title-content">
              <el-icon>
                <CreditCard />
              </el-icon>
              {{ $t('checkout.paymentMethod') || '支付方式' }}
            </div>
          </h2>
          <el-tabs v-model="activePaymentTab" @tab-click="onTabChange" class="payment-tabs">
            <el-tab-pane :label="$t('checkout.paypal') || 'PayPal/信用卡'" name="paypal">
              <div v-if="activePaymentTab === 'paypal'" class="paypal-container">
                <div id="paypal-button-container" ref="paypalButtonContainer"></div>
              </div>
            </el-tab-pane>
            <el-tab-pane :label="$t('checkout.alipay') || '支付宝'" name="alipay">
              <div class="qrcode-container">
                <div class="qrcode-content">
                  <div v-if="qrcodeUrl && activePaymentTab === 'alipay'" class="qrcode-display">
                    <div class="qrcode-image">
                      <img :src="qrcodeUrl" :alt="$t('checkout.alipayQrcode') || '支付宝支付二维码'">
                    </div>
                    <div class="qrcode-actions">
                      <el-button @click="refreshQrcode('alipay')" type="primary" class="refresh-qr-btn"
                        :loading="refreshing">
                        <el-icon>
                          <Refresh />
                        </el-icon>
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
                    <p class="qrcode-placeholder-text">{{ $t('checkout.clickToGenerate') || '点击下方按钮生成支付二维码' }}</p>
                    <el-button @click="generateQrcode('alipay')" type="primary" class="generate-qr-btn"
                      :loading="generating">
                      {{ $t('checkout.generateQrcode') || '生成支付二维码' }}
                    </el-button>
                  </div>
                </div>
              </div>
            </el-tab-pane>

          </el-tabs>
        </section>

        <!-- 订单状态信息（已支付订单） -->
        <section class="order-status" v-if="isOrderDetail && isOrderPaid">
          <h2 class="section-title">
            <div class="title-content">
              <el-icon>
                <SuccessFilled />
              </el-icon>
              {{ $t('order.status') || '订单状态' }}
            </div>
          </h2>
          <div class="status-card">
            <div class="status-info">
              <div class="status-item">
                <span class="status-label">{{ $t('order.orderNumber') || '订单号：' }}</span>
                <span class="status-value">{{ orderData?.order_number || orderData?.id }}</span>
              </div>
              <div class="status-item">
                <span class="status-label">{{ $t('order.paymentStatus') || '支付状态：' }}</span>
                <span class="status-value paid">{{ $t('order.paid') || '已支付' }}</span>
              </div>
              <div class="status-item" v-if="orderData?.payment_method">
                <span class="status-label">{{ $t('order.paymentMethod') || '支付方式：' }}</span>
                <span class="status-value">{{ getPaymentMethodText(orderData.payment_method) }}</span>
              </div>
              <div class="status-item" v-if="orderData?.created_at">
                <span class="status-label">{{ $t('order.orderTime') || '下单时间：' }}</span>
                <span class="status-value">{{ formatDate(orderData.created_at) }}</span>
              </div>
              <div class="status-item" v-if="orderData?.paid_at">
                <span class="status-label">{{ $t('order.paymentTime') || '支付时间：' }}</span>
                <span class="status-value">{{ formatDate(orderData.paid_at) }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- 地址选择对话框 -->
    <div v-if="showAddressDialog" class="custom-dialog-overlay">
      <div class="custom-dialog">
        <div class="custom-dialog-header">
          <h3 class="custom-dialog-title">{{ $t('address.selectTitle') || '选择地址' }}</h3>
          <button class="custom-dialog-close" @click="closeAddressDialog">
            <el-icon>
              <Close />
            </el-icon>
          </button>
        </div>
        <div class="custom-dialog-body">
          <div class="address-list">
            <div v-if="addressList.length === 0" class="no-address">
              <el-icon>
                <LocationInformation />
              </el-icon>
              <p>{{ $t('address.noAddresses') || '暂无地址' }}</p>
              <el-button type="primary" size="small" @click="goToAddressManagement">
                {{ $t('address.addNewAddress') || '添加新地址' }}
              </el-button>
            </div>
            <div v-else class="address-items">
              <div v-for="address in addressList" :key="address.id"
                :class="['address-item', { 'selected': selectedAddressId === address.id }]"
                @click="selectAndConfirmAddress(address)">
                <!-- 默认标志 -->
                <el-tag v-if="address.is_default" size="small" type="primary" class="default-tag">
                  {{ $t('address.default') || '默认' }}
                </el-tag>

                <div class="address-content">
                  <div class="address-row">
                    <div class="field-group">
                      <span class="field-label">{{ $t('checkout.recipientName') || '收件人' }}:</span>
                      <span class="field-value">{{ address.recipient_name }}</span>
                    </div>
                  </div>
                  <div class="address-row">
                    <div class="field-group">
                      <span class="field-label">{{ $t('checkout.country') || '国家' }}:</span>
                      <span class="field-value">{{ address.country }}</span>
                    </div>
                    <div class="field-group">
                      <span class="field-label">{{ $t('checkout.state') || '省份' }}:</span>
                      <span class="field-value">{{ address.state }}</span>
                    </div>
                  </div>
                  <div class="address-row">
                    <div class="field-group">
                      <span class="field-label">{{ $t('checkout.city') || '城市' }}:</span>
                      <span class="field-value">{{ address.city }}</span>
                    </div>
                    <div class="field-group">
                      <span class="field-label">{{ $t('checkout.postalCode') || '邮编' }}:</span>
                      <span class="field-value">{{ address.postal_code }}</span>
                    </div>
                  </div>
                  <div class="address-row">
                    <div class="field-group">
                      <span class="field-label">{{ $t('checkout.phone') || '联系电话' }}:</span>
                      <span class="field-value">{{ address.phone_country_code }} {{ address.phone }}</span>
                    </div>
                  </div>
                  <div class="address-row">
                    <div class="field-group">
                      <span class="field-label">{{ $t('checkout.address') || '地址' }}:</span>
                      <span class="field-value">{{ address.address }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 支付成功对话框 -->
    <el-dialog v-model="paySuccess" :title="$t('checkout.paymentSuccess') || '支付成功'" :width="$dialog-width-md"
      class="success-dialog" center>
      <div class="success-content">
        <div class="success-icon-wrapper">
          <div class="success-icon">✓</div>
        </div>
        <h3 class="success-title">{{ $t('checkout.paymentSuccessTitle') || '支付成功！' }}</h3>
        <p class="success-message">{{ $t('checkout.paymentSuccessMessage') || '您的订单已成功支付' }}</p>
        <div class="order-info">
          <span class="order-label">{{ $t('checkout.orderNumber') || '订单号：' }}</span>
          <span class="order-id">{{ orderId }}</span>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="goHome" class="home-btn">
            <el-icon>
              <House />
            </el-icon>
            {{ $t('checkout.backHome') || '返回首页' }}
          </el-button>
          <el-button type="primary" @click="goOrders" class="orders-btn">
            <el-icon>
              <Document />
            </el-icon>
            {{ $t('checkout.viewOrders') || '查看订单' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import PageBanner from '@/components/common/PageBanner.vue';
import NavigationMenu from '@/components/common/NavigationMenu.vue';
import { validateInternationalPhone } from '@/utils/validation.js';
import { 
  ShoppingCart, 
  Location, 
  LocationInformation,
  CreditCard, 
  Refresh, 
  SuccessFilled,
  House,
  Document,
  Close
} from '@element-plus/icons-vue';

export default {
  name: 'UnifiedCheckout',
  components: {
    PageBanner,
    NavigationMenu,
    ShoppingCart,
    Location,
    LocationInformation,
    CreditCard,
    Refresh,
    SuccessFilled,
    House,
    Document,
    Close
  },
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
      shippingInfo: { 
        name: '', 
        phone: '', 
        phone_country_code: '', 
        email: '', 
        address: '', 
        zipCode: '', 
        country: '',
        state: '',
        city: '' 
      },
      addressList: [], // 地址列表
      selectedAddressId: null, // 选中的地址ID
      showAddressDialog: false, // 显示地址选择对话框
      isOrderDetail: false, // 是否为订单详情模式
      orderData: null, // 订单详情数据
      isOrderPaid: false, // 订单是否已支付
      orderSource: 'cart', // 订单来源：'cart' 或 'inquiry'
      inquiryId: null, // 询价单ID（当orderSource为'inquiry'时使用）
      shippingRules: {
        name: [
          { required: true, message: this.$t('checkout.nameRequired') || '请输入收货人姓名', trigger: 'blur' },
          { min: 2, max: 20, message: this.$t('checkout.nameLength') || '姓名长度在 2 到 20 个字符', trigger: 'blur' }
        ],
        phone: [
          { required: true, message: this.$t('checkout.phoneRequired') || '请输入手机号码', trigger: 'blur' },
          { 
            validator: (rule, value, callback) => {
              if (!value) {
                callback(new Error(this.$t('checkout.phoneRequired') || '请输入手机号码'));
                return;
              }
              
              if (!validateInternationalPhone(value)) {
                callback(new Error(this.$t('checkout.phoneFormatInvalid') || '请输入正确的电话号码格式'));
                return;
              }
              
              callback();
            },
            trigger: 'blur'
          }
        ],
        email: [
          { type: 'email', message: this.$t('checkout.emailFormat') || '请输入正确的邮箱格式', trigger: 'blur' }
        ],
        address: [
          { required: true, message: this.$t('checkout.addressRequired') || '请输入收货地址', trigger: 'blur' },
          { min: 10, max: 200, message: this.$t('checkout.addressLength') || '地址长度在 10 到 200 个字符', trigger: 'blur' }
        ],
        zipCode: [
          { required: true, message: this.$t('checkout.zipCodeRequired') || '请输入邮政编码', trigger: 'blur' }
        ],
        country: [
          { required: true, message: this.$t('checkout.countryRequired') || '请选择国家', trigger: 'change' }
        ],
        state: [
          { required: true, message: this.$t('checkout.stateRequired') || '请选择省份', trigger: 'change' }
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
      currentPaymentMethod: '',
      isPollingRequest: false, // 支付状态轮询请求标志

    };
  },
  computed: {
    breadcrumbItems() {
      const items = [];
      if (this.isOrderDetail) {
        items.push({ text: this.$t('order.myOrders') || '我的订单', to: '/user/orders' });
        items.push({ text: this.$t('order.detail') || '订单详情' });
      } else {
        items.push({ text: this.$t('cart.title') || '购物车', to: '/cart' });
        items.push({ text: this.$t('checkout.title') || '结算' });
      }
      return items;
    },
    countries() {
      return this.$store.getters['countryState/countries'] || [];
    },
    currentStates() {
      if (!this.shippingInfo.country || !this.countries || this.countries.length === 0) {
        return [];
      }
      const country = this.countries.find(c => c.name === this.shippingInfo.country);
      if (!country) {
        return [];
      }
      return this.$store.getters['countryState/getStatesByCountry'](country.iso3) || [];
    }
  },
  created() {
    this.initOrderItems();
    this.fetchPayPalConfig();
    this.loadAddressList();
    this.loadCountryStateData();
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
    closeAddressDialog() {
      this.showAddressDialog = false;
    },
    async initOrderItems() {
      // 检查是否为订单详情模式
      const orderId = this.$route.query.orderId;
      if (orderId) {
        this.isOrderDetail = true;
        await this.fetchOrderDetail(orderId);
        return;
      }
      
      // 优先使用props传递的数据
      if (this.items && this.items.length > 0) {
        this.orderItems = this.items;
        this.calculateTotal();
        return;
      }
      
      // 从sessionStorage获取选中的购物车商品
      const selectedItemsStr = sessionStorage.getItem('selectedCartItems');
      if (selectedItemsStr) {
        try {
          this.orderItems = JSON.parse(selectedItemsStr);
          this.calculateTotal();
          
          // 检查是否来自询价单（通过检查商品数据结构或特殊标识）
          // 如果商品有inquiry相关字段或者URL中有inquiry参数，则认为是询价单订单
          const inquiryIdFromUrl = this.$route.query.inquiryId;
          const isFromInquiry = inquiryIdFromUrl || this.orderItems.some(item => item.inquiry_id);
          
          if (isFromInquiry) {
            this.orderSource = 'inquiry';
            this.inquiryId = inquiryIdFromUrl || this.orderItems[0]?.inquiry_id;
          } else {
            this.orderSource = 'cart';
            this.inquiryId = null;
          }
          
          // 使用后清除sessionStorage中的数据
          sessionStorage.removeItem('selectedCartItems');
          return;
        } catch (e) {
          console.error('解析sessionStorage中的订单数据失败:', e);
          sessionStorage.removeItem('selectedCartItems');
        }
      }
      
      // 兼容URL参数方式（向后兼容）
      const itemsQuery = this.$route.query.items;
      if (itemsQuery) {
        try {
          this.orderItems = JSON.parse(decodeURIComponent(itemsQuery));
          this.calculateTotal();
          return;
        } catch (e) {
          this.$messageHandler.showError('订单数据解析失败', 'checkout.error.parseError');
        }
      }
      
      // 如果没有找到任何订单数据，显示警告并跳转回购物车
      this.$messageHandler.showWarning('没有找到订单数据', 'checkout.warning.noOrderData');
      this.$router.push('/cart');
    },
    calculateTotal() {
      this.orderTotal = this.orderItems.reduce((sum, item) => sum + (item.calculatedPrice || item.price) * item.quantity, 0);
    },
    getPaymentMethodText(method) {
      const methodMap = {
        'paypal': 'PayPal',
        'alipay': this.$t('checkout.alipay') || '支付宝',
        'credit_card': this.$t('checkout.creditCard') || '信用卡'
      };
      return methodMap[method] || method;
    },
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
    async fetchOrderInfo() {
      try {
        const res = await this.$api.get('/cart');
        if (res.success) {
          this.orderItems = res.data.items || [];
          this.orderTotal = res.data.totalPrice || 0;
        } else {
          this.$messageHandler.showError('获取购物车信息失败', 'checkout.error.fetchCartFailed');
        }
      } catch (error) {
        console.error('获取购物车信息失败:', error);
        this.$messageHandler.showError(error, 'checkout.error.fetchCartFailed');
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
        this.$messageHandler.showError(error, 'checkout.error.fetchPaymentConfigFailed');
      }
    },
    async fetchOrderDetail(orderId) {
      try {
        const response = await this.$api.get(`/orders/${orderId}`);
        if (response.success) {
          this.orderData = response.data;
          this.orderItems = response.data.items || [];
          this.orderTotal = response.data.order.total_amount || 0;
          this.isOrderPaid = response.data.order.status === 'paid';
          
          // 填充收货信息（只读模式）
          if (response.data.order) {
            this.shippingInfo = {
              name: response.data.order.shipping_name || '',
              phone: response.data.order.shipping_phone || '',
              phone_country_code: response.data.order.shipping_phone_country_code || '',
              email: response.data.order.shipping_email || '',
              address: response.data.order.shipping_address || '',
              zipCode: response.data.order.shipping_zip_code || '',
              country: response.data.order.shipping_country || '',
              state: response.data.order.shipping_state || '',
              city: response.data.order.shipping_city || ''
            };
          }
        } else {
          this.$messageHandler.showError('获取订单详情失败', 'order.error.fetchFailed');
          this.$router.push('/user/orders');
        }
      } catch (error) {
        console.error('获取订单详情失败:', error);
        this.$messageHandler.showError(error, 'order.error.fetchDetailFailed');
        this.$router.push('/user/orders');
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
      // 增强配置验证
      if (!this.paypalConfig) {
        console.error('PayPal配置对象不存在');
        this.$messageHandler.showError('PayPal配置未加载，请刷新页面重试', 'checkout.error.paypalConfigMissing');
        return;
      }
      
      if (!this.paypalConfig.clientId || this.paypalConfig.clientId === 'test') {
        console.warn('PayPal Client ID无效:', this.paypalConfig.clientId);
        this.$messageHandler.showWarning('PayPal配置无效，请联系管理员', 'checkout.warning.paypalConfigInvalid');
        return;
      }
      
      if (!this.paypalConfig.scriptUrl) {
        console.error('PayPal Script URL未配置');
        this.$messageHandler.showError('PayPal脚本地址未配置', 'checkout.error.paypalScriptUrlMissing');
        return;
      }
      
      if (window.paypal) {
        console.log('PayPal SDK已存在，直接渲染按钮');
        this.renderPayPalButtons();
        return;
      }
      
      if (document.getElementById('paypal-sdk')) {
        console.log('PayPal SDK脚本已存在，等待加载完成');
        return;
      }
      
      console.log('开始加载PayPal SDK...');
      const script = document.createElement('script');
      script.id = 'paypal-sdk';
      
      // 构建PayPal SDK URL，添加locale参数指定英文语言
      const params = new URLSearchParams({
        'client-id': this.paypalConfig.clientId,
        'currency': this.paypalConfig.currency || 'USD',
        'intent': this.paypalConfig.intent || 'capture',
        'components': this.paypalConfig.components || 'buttons,funding-eligibility',
        'locale': 'en_US' // 指定英文语言
      });
      
      // 添加启用的资金来源
      if (this.paypalConfig.enableFunding) {
        params.append('enable-funding', this.paypalConfig.enableFunding);
      }
      
      // 添加禁用的资金来源
      if (this.paypalConfig.disableFunding) {
        params.append('disable-funding', this.paypalConfig.disableFunding);
      }
      
      script.src = `${this.paypalConfig.scriptUrl}?${params.toString()}`;
      console.log('PayPal SDK URL:', script.src);
      
      script.onload = () => {
        console.log('PayPal SDK加载成功');
        this.renderPayPalButtons();
      };
      
      script.onerror = (error) => {
        console.error('PayPal SDK加载失败:', error);
        console.error('PayPal SDK URL:', script.src);
        console.error('PayPal配置:', this.paypalConfig);
        this.$messageHandler.showError('PayPal SDK加载失败，请检查网络连接或联系管理员', 'checkout.error.paypalSDKLoadFailed');
        
        // 移除失败的脚本标签
        const failedScript = document.getElementById('paypal-sdk');
        if (failedScript) {
          failedScript.remove();
        }
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
          // 如果不是订单详情模式，验证收货信息
          if (!this.isOrderDetail) {
            const isValid = await this.validateShippingInfo();
            if (!isValid) {
              return Promise.reject(new Error(this.$t('checkout.shippingInfoInvalid') || '请完善收货信息'));
            }
          }
          
          try {
            let response;
            
            if (this.isOrderDetail && this.orderData) {
              // 已存在订单，调用重新支付接口
              console.log('orderData:', this.orderData)
              response = await this.$api.postWithErrorHandler('/payment/paypal/repay', {
                orderId: this.orderData.order.id
              });
            } else {
              // 新订单，调用创建订单接口
              const requestData = {
                shippingInfo: {
                  name: this.shippingInfo.name,
                  phone: this.shippingInfo.phone,
                  phone_country_code: this.shippingInfo.phone_country_code,
                  email: this.shippingInfo.email,
                  shipping_address: this.shippingInfo.address,
                  shipping_zip_code: this.shippingInfo.zipCode,
                  shipping_country: this.shippingInfo.country,
                  shipping_state: this.shippingInfo.state,
                  shipping_city: this.shippingInfo.city
                },
                orderItems: this.orderItems.map(item => ({
                  product_id: item.product_id,
                  product_code: item.product_code,
                  product_name: item.name,
                  quantity: item.quantity,
                  price: item.calculatedPrice || item.price
                }))
              };
              
              // 如果是询价单订单，添加orderSource和inquiryId参数
              if (this.orderSource === 'inquiry' && this.inquiryId) {
                requestData.orderSource = this.orderSource;
                requestData.inquiryId = this.inquiryId;
              }
              
              response = await this.$api.postWithErrorHandler('/payment/paypal/create', requestData);
            }
            
            if (response.success) {
              this.orderId = response.data.orderId || this.orderData?.id;
              return response.data.paypalOrderId || response.data.id || response.data.orderID;
            } else {
              throw new Error(response.message || '创建订单失败');
            }
          } catch (error) {
            this.$messageHandler.showError(error.message || '支付过程中出现错误', 'checkout.error.paymentError');
            throw error;
          }
        },
        onApprove: async (data, actions) => {
          try {
            // 捕获PayPal支付
            const response = await this.$api.postWithErrorHandler('/payment/paypal/capture', {
              paypalOrderId: data.orderID,
              orderId: this.orderId
            });
            
            if (response.success) {
              this.paySuccess = true;
              this.$messageHandler.showSuccess('支付成功！', 'payment.success.paymentSuccess');
              // 触发购物车更新事件
              if (this.$bus) {
                this.$bus.emit('cart-updated');
              }
            } else {
              throw new Error(response.message || '支付捕获失败');
            }
          } catch (error) {
            this.$messageHandler.showError('PayPal支付失败: ' + error.message, 'payment.error.paypalFailed');
            // 处理可恢复的错误
            if (error.message.includes('INSTRUMENT_DECLINED')) {
              return actions.restart();
            }
          }
        },
        onError: (err) => {
          this.$messageHandler.showError('PayPal支付失败: ' + (err.message || '未知错误'), 'payment.error.paypalFailed');
        },
        onCancel: () => {
          this.$messageHandler.showInfo('支付已取消', 'checkout.info.paymentCancelled');
        }
      }).render('#paypal-button-container').catch(err => {
        console.error('PayPal按钮渲染失败:', err);
        this.$messageHandler.showError(err, 'checkout.error.paypalButtonLoadFailed');
      });
    },
    async generateQrcode(paymentMethod) {
      // 对于订单详情页面，不需要验证收货信息
      if (!this.isOrderDetail) {
        const isValid = await this.validateShippingInfo();
        if (!isValid) {
          return;
        }
      }
      
      this.generating = true;
      this.currentPaymentMethod = paymentMethod;
      this.clearQrcodeTimers();
      this.qrcodeUrl = '';
      
      try {
        let orderId = this.orderId;
        
        // 如果不是订单详情页面，需要先创建订单
        if (!this.isOrderDetail) {
          const requestData = {
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
              price: item.calculatedPrice || item.price
            }))
          };
          
          // 如果是询价单订单，添加orderSource和inquiryId参数
          if (this.orderSource === 'inquiry' && this.inquiryId) {
            requestData.orderSource = this.orderSource;
            requestData.inquiryId = this.inquiryId;
          }
          
          const orderRes = await this.$api.postWithErrorHandler('/payment/common/create', requestData);
          
          if (!orderRes.success) {
            this.$messageHandler.showError('创建订单失败: ' + orderRes.message, 'checkout.error.createOrderFailed');
            return;
          }
          
          orderId = orderRes.data.orderId;
          this.orderId = orderId;
        } else {
          // 对于订单详情页面，使用现有的订单ID
          orderId = this.orderData?.order?.id || this.$route.query.orderId;
          this.orderId = orderId;
        }
        
        // 生成二维码
        const qrRes = await this.$api.postWithErrorHandler('/payment/qrcode', {
          orderId: orderId,
          paymentMethod
        });
        
        if (qrRes.success) {
          this.qrcodeUrl = qrRes.data.qrcodeUrl;
          this.startPaymentStatusPolling(orderId, paymentMethod);
          this.startQrcodeTimer();
          this.startAutoRefresh(paymentMethod);
          
          this.$messageHandler.showSuccess('二维码生成成功，请扫码支付', 'checkout.success.qrcodeGenerated');
        } else {
          this.$messageHandler.showError('生成二维码失败: ' + qrRes.message, 'checkout.error.qrcodeGenerateFailed');
        }
      } catch (error) {
        console.error('Error generating QR code:', error);
        this.$messageHandler.showError('生成二维码失败', 'checkout.error.qrcodeGenerateFailed');
      } finally {
        this.generating = false;
      }
    },
    startPaymentStatusPolling(orderId, paymentMethod) {
      this.clearPollingTimer();
      this.polling = true;
      this.isPollingRequest = false; // 添加请求状态标志
      
      const pollPaymentStatus = async () => {
        // 如果上一个请求还在进行中，跳过本次轮询
        if (this.isPollingRequest) {
          return;
        }
        
        this.isPollingRequest = true;
        
        try {
          const statusRes = await this.$api.post('/payment/check-status', {
            orderId,
            paymentMethod
          });
          
          if (statusRes.success && statusRes.data.status === 'paid') {
            this.clearPollingTimer();
            this.paySuccess = true;
            // 触发购物车更新事件
            if (this.$bus) {
              this.$bus.emit('cart-updated');
            }
          }
        } catch (error) {
          console.warn('Payment status check failed:', error);
          // 不显示错误消息，避免干扰用户体验
        } finally {
          this.isPollingRequest = false;
        }
      };
      
      this.pollingTimer = setInterval(pollPaymentStatus, 3000);
    },
    clearPollingTimer() {
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer);
        this.pollingTimer = null;
        this.polling = false;
        this.isPollingRequest = false;
      }
    },
    async refreshQrcode(paymentMethod) {
      let orderId = this.orderId;
      
      // 对于订单详情页面，确保获取正确的订单ID
      if (this.isOrderDetail && !orderId) {
        orderId = this.orderData?.order?.id || this.$route.query.orderId;
        this.orderId = orderId;
      }
      
      if (!orderId) {
        this.$messageHandler.showWarning('没有订单可以刷新', 'checkout.warning.noOrderToRefresh');
        return;
      }
      
      this.refreshing = true;
      this.clearQrcodeTimers();
      
      try {
        const qrRes = await this.$api.postWithErrorHandler('/payment/qrcode', {
          orderId: orderId,
          paymentMethod
        });
        
        if (qrRes.success) {
          this.qrcodeUrl = qrRes.data.qrcodeUrl;
          this.startQrcodeTimer();
          this.startAutoRefresh(paymentMethod);
          
          this.$messageHandler.showSuccess('二维码已刷新', 'checkout.success.qrcodeRefreshed');
        } else {
          this.$messageHandler.showError('刷新二维码失败: ' + qrRes.message, 'checkout.error.qrcodeRefreshFailed');
        }
      } catch (error) {
        console.error('Error refreshing QR code:', error);
        this.$messageHandler.showError('刷新二维码失败', 'checkout.error.qrcodeRefreshFailed');
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
          this.$messageHandler.showWarning('二维码已过期，请重新生成', 'checkout.warning.qrcodeExpired');
        }
      }, 1000);
    },
    startAutoRefresh(paymentMethod) {
      // 4分钟后自动刷新二维码
      this.autoRefreshTimer = setTimeout(() => {
        if (this.qrcodeUrl && !this.paySuccess) {
          this.refreshQrcode(paymentMethod);
        }
      }, 240000); // 4分钟后自动刷新
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
    async loadAddressList() {
      try {
        const response = await this.$api.getWithErrorHandler('/addresses', {
          fallbackKey: 'address.error.fetchFailed'
        });
        if (response.success) {
          this.addressList = response.data || [];
          // 如果有默认地址，自动选中
          const defaultAddress = this.addressList.find(addr => addr.is_default);
          if (defaultAddress) {
            this.selectedAddressId = defaultAddress.id;
            this.selectAddress(defaultAddress.id);
          }
        }
      } catch (error) {
        console.error('加载地址列表失败:', error);
      }
    },
    selectAddress(addressId) {
       if (!addressId) {
         // 清空地址信息
         this.shippingInfo.name = '';
         this.shippingInfo.phone = '';
         this.shippingInfo.phone_country_code = '';
         this.shippingInfo.address = '';
         this.shippingInfo.zipCode = '';
         this.shippingInfo.country = '';
         this.shippingInfo.state = '';
         this.shippingInfo.city = '';
         this.selectedAddressId = null;
         return;
       }
       
       const address = this.addressList.find(addr => addr.id === addressId);
       if (address) {
         this.shippingInfo.name = address.recipient_name || '';
         this.shippingInfo.phone = address.phone || '';
         this.shippingInfo.phone_country_code = address.phone_country_code || '';
         this.shippingInfo.address = address.address || '';
         this.shippingInfo.zipCode = address.postal_code || '';
         this.shippingInfo.country = address.country || '';
         this.shippingInfo.state = address.state || '';
         this.shippingInfo.city = address.city || '';
         this.selectedAddressId = addressId;
       }
     },
     getAddressLabel(address) {
       if (!address) return '';
       const name = address.recipient_name || '';
       const phone = address.phone || '';
       const addr = address.address || '';
       return `${name} ${phone} ${addr}`.trim();
     },
     selectAddressFromDialog(address) {
       this.selectedAddressId = address.id;
     },
     selectAndConfirmAddress(address) {
       this.selectedAddressId = address.id;
       this.selectAddress(address.id);
       this.showAddressDialog = false;
     },
     async loadCountryStateData() {
       try {
         await this.$store.dispatch('countryState/loadCountryStateData');
       } catch (error) {
         console.error('加载国家省份数据失败:', error);
       }
     },
     handleCountryChange(countryName) {
       if (countryName && this.countries && this.countries.length > 0) {
         const country = this.countries.find(c => c.name === countryName);
         if (country) {
           this.shippingInfo.phone_country_code = country.phone_code;
         }
       }
       this.shippingInfo.state = '';
       this.shippingInfo.city = '';
     },
     handleStateChange() {
       this.shippingInfo.city = '';
     },
     confirmAddressSelection() {
       if (this.selectedAddressId) {
         this.selectAddress(this.selectedAddressId);
         this.showAddressDialog = false;
       }
     },
     goToAddressManagement() {
       this.showAddressDialog = false;
       this.$router.push('/address');
     },
    async validateShippingInfo() {
      try {
        await this.$refs.shippingForm.validate();
        return true;
      } catch (error) {
        this.$messageHandler.showWarning('请完善收货信息', 'checkout.warning.shippingInfoInvalid');
        return false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';
@import '@/assets/styles/_mixins.scss';

/* 主容器 */
.unified-checkout {
  min-height: 100vh;
  background: $gray-50;
}

.container {
  @include container;
}

.checkout-content {

  padding-bottom: $spacing-2xl;
}

/* 通用区块样式 */
.order-summary,
.shipping-info,
.payment-methods {
  background: $white;
  margin-bottom: $spacing-xl;
  padding: $spacing-xl;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-sm;
  border: $border-width-sm solid $gray-200;
  transition: $transition-slow;
}

.order-summary:hover,
.shipping-info:hover,
.payment-methods:hover {
  box-shadow: $shadow-lg;
  transform: translateY($hover-transform-md);
}

/* 区块标题 */
.section-title {
  font-size: $font-size-2xl;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin: 0 0 $spacing-lg 0;
  padding-bottom: $spacing-md;
  border-bottom: $table-header-border-width solid $primary-color;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-content {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.title-content .el-icon {
  color: $error-color;
  font-size: $font-size-xl;
}

.title-content i {
  color: $error-color;
  font-size: $font-size-xl;
}

.shipping-header {
  display: flex;
  align-items: center;
}

/* 直接覆盖按钮内的所有span */
.section-title .shipping-header .address-select-btn :deep(span) {
  color: $white !important;
}



/* 订单表格 */
.order-table {
  border-radius: $border-radius-md;
  overflow: hidden;
}

.order-table :deep(.el-table__header) {
  background: $gray-50;
}

.order-table :deep(.el-table th) {
  background: $gray-50;
  color: $text-secondary;
  font-weight: $font-weight-semibold;
  border-bottom: 2px solid $gray-200;
}

.product-info {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.product-image {
  width: $product-image-size-sm;
  height: $product-image-size-sm;
  border-radius: $border-radius-md;
  overflow: hidden;
  border: $border-width-sm solid $gray-200;
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
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.product-code {
  font-size: $font-size-xs;
  color: $text-secondary;
}

.subtotal-price {
  font-size: $font-size-lg;
  font-weight: $font-weight-normal;
  color: $primary-color;
}

/* 订单总计 */
.order-total {
  text-align: right;
  font-size: $font-size-2xl;
  font-weight: $font-weight-bold;
  margin-top: $spacing-lg;
  padding: $spacing-md $spacing-lg;
  background: $gradient-primary;
  color: $white;
  border-radius: $border-radius-md;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-price {
  font-size: $font-size-2xl;
  font-weight: $font-weight-bold;
  color: $white;
}

/* 表单样式 */
.shipping-form {
  margin-top: $spacing-lg;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-xl;
  margin-bottom: $spacing-md;
}

.shipping-form :deep(.el-form-item) {
  margin-bottom: $spacing-lg;
}

.shipping-form :deep(.el-form-item__label) {
  font-size: $font-size-md;
  font-weight: $font-weight-medium;
  color: $text-primary;
  text-align: left;
  padding-right: $spacing-md;
  line-height: $form-input-height;
  width: $form-label-width;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.shipping-form :deep(.el-form-item__content) {
  line-height: $form-input-height;
  flex: 1;
}

.shipping-form :deep(.el-input) {
  width: 100%;
}

.shipping-form :deep(.el-input__wrapper) {
  border-radius: $border-radius-sm;
  border: $form-border-width solid $gray-200;
  transition: $transition-slow;
  box-shadow: none;
  padding: $spacing-sm $spacing-md;
  min-height: $form-input-height;
}

.shipping-form :deep(.el-input__wrapper:hover) {
  border-color: $gray-300;
}

.shipping-form :deep(.el-input__wrapper.is-focus) {
  border-color: $primary-color;
  box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
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
  border-radius: $border-radius-sm;
  border: $form-border-width solid $gray-200;
  transition: $transition-slow;
  padding: $spacing-md;
  resize: vertical;
}

.shipping-form :deep(.el-textarea__inner:hover) {
  border-color: $gray-300;
}

.shipping-form :deep(.el-textarea__inner:focus) {
  border-color: $primary-color;
  box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
  outline: none;
}

/* 统一下拉框样式 */
.shipping-form :deep(.el-select__wrapper) {
  border-radius: $border-radius-sm;
  border: $form-border-width solid $gray-200;
  transition: $transition-slow;
  box-shadow: none;
  padding: $spacing-sm $spacing-md;
  min-height: $form-input-height;
}

.shipping-form :deep(.el-select__wrapper:hover) {
  border-color: $gray-300;
}

.shipping-form :deep(.el-select__wrapper.is-focused) {
  border-color: $primary-color;
  box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
}

/* 修复表单项布局对齐问题 */
.shipping-form :deep(.el-form-item) {
  display: flex;
  align-items: flex-start;
  margin-bottom: $spacing-lg;
}

.shipping-form :deep(.el-form-item__label) {
  flex-shrink: 0;
  margin-right: 0;
}

/* 电话输入框组样式 */
.phone-input-group {
  display: flex;
  gap: $spacing-sm;
  width: 100%;

  .country-code-select {
    flex: 0 0 $spacing-8xl;

    :deep(.el-select__wrapper) {
      height: $form-input-height;
      min-height: $form-input-height;
      border-radius: $border-radius-md;
      border: $border-width-sm solid $border-light;
      transition: all 0.3s ease;

      &:hover {
        border-color: $primary-color;
      }

      &.is-focused {
        border-color: $primary-color;
        box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
      }
    }
  }

  .phone-number-input {
    flex: 1;

    :deep(.el-input__wrapper) {
      height: $form-input-height;
      min-height: $form-input-height;
      border-radius: $border-radius-md;
      border: $border-width-sm solid $border-light;
      transition: all 0.3s ease;

      &:hover {
        border-color: $primary-color;
      }

      &.is-focused {
        border-color: $primary-color;
        box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
      }
    }
  }
}

.shipping-form :deep(.el-form-item__content) {
  flex: 1;
  margin-left: 0;
}

/* 确保必填星号对齐 */
.shipping-form :deep(.el-form-item.is-required .el-form-item__label::before) {
  margin-right: $spacing-xs;
}

/* 支付方式标签页 */
.payment-tabs :deep(.el-tabs__header) {
  margin-bottom: $spacing-xl;
}

.payment-tabs :deep(.el-tabs__nav-wrap::after) {
  background: $gray-200;
}

.payment-tabs :deep(.el-tabs__item) {
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  color: $text-secondary;
  padding: 0 $spacing-xl;
  height: $spacing-4xl;
  line-height: $spacing-4xl;
}

.payment-tabs :deep(.el-tabs__item.is-active) {
  color: $primary-color;
}

.payment-tabs :deep(.el-tabs__active-bar) {
  background: $primary-color;
  height: $border-width-thick;
}

/* PayPal容器 */
.paypal-container {
  padding: $spacing-lg;
  background: $gray-50;
  border-radius: $border-radius-md;
  border: $border-width-md dashed $gray-200;
}

/* 二维码容器 */
.qrcode-container {
  padding: $spacing-xl;
  background: $gray-50;
  border-radius: $border-radius-lg;
  border: $border-width-sm solid $gray-200;
}

.qrcode-content {
  margin-bottom: $spacing-lg;
}

.qrcode-display {
  text-align: center;
}

.qrcode-image {
  margin: $spacing-lg 0;
  display: inline-block;
  padding: $spacing-lg;
  background: $white;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-md;
  border: $border-width-md solid $gray-200;
}

.qrcode-image img {
  max-width: $product-qrcode-max-width;
  border-radius: $border-radius-md;
  display: block;
}

.qrcode-actions {
  margin-top: $spacing-md;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-md;
}

.qrcode-placeholder {
  text-align: center;
  padding: $spacing-5xl $spacing-lg;
  color: $gray-400;
}

.qrcode-placeholder-icon {
  font-size: $font-size-5xl;
  margin-bottom: $spacing-md;
  display: block;
}

.qrcode-placeholder-text {
  font-size: $font-size-md;
  color: $text-secondary;
  margin: 0;
}

.qrcode-controls {
  text-align: center;
  margin-bottom: $spacing-lg;
}

.generate-qr-btn {
  background: $gradient-primary;
  border: none;
  padding: $spacing-md $spacing-xl;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  border-radius: $border-radius-md;
  transition: $transition-slow;
  min-width: $product-qrcode-min-width;
}

.generate-qr-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba($primary-color, 0.3);
}

.refresh-qr-btn {
  background: $gradient-primary;
  border: none;
  padding: $spacing-md $spacing-xl;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  border-radius: $border-radius-md;
  transition: $transition-slow;
  min-width: $product-qrcode-min-width;
  color: $white;
}

.refresh-qr-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba($primary-color, 0.3);
}

.refresh-qr-btn i {
  margin-right: $spacing-xs;
}

.qrcode-timer {
  font-size: $font-size-sm;
  color: $text-secondary;
  background: $gray-100;
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius-full;
  border: $border-width-sm solid $gray-200;
}

.polling-status {
  margin-top: $spacing-lg;
  color: $text-secondary;
  font-weight: $font-weight-medium;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
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
  border-radius: $border-radius-xl;
  overflow: hidden;
  box-shadow: $shadow-xl;
}

.success-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, $success-color, $success-dark);
  color: $white;
  padding: $spacing-lg $spacing-xl;
  margin: 0;
  text-align: center;
}

.success-dialog :deep(.el-dialog__title) {
  color: $white;
  font-weight: $font-weight-bold;
  font-size: $font-size-xl;
}

.success-content {
  text-align: center;
  padding: $spacing-2xl $spacing-xl $spacing-xl;
}

.success-icon-wrapper {
  width: $spacing-7xl;
  height: $spacing-7xl;
  background: $gradient-primary;
  border-radius: $border-radius-full;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto $spacing-lg;
  box-shadow: 0 8px 25px rgba($primary-color, 0.3);
}

.success-icon {
  font-size: $font-size-4xl;
  color: $white;
  font-weight: $font-weight-bold;
  line-height: 1;
}

.success-title {
  font-size: $font-size-2xl;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin: 0 0 $spacing-md 0;
}

.success-message {
  font-size: $font-size-md;
  color: $text-secondary;
  margin: 0 0 $spacing-lg 0;
  line-height: $line-height-normal;
}

.order-info {
  background: $gray-50;
  border: $border-width-md solid $gray-200;
  border-radius: $border-radius-lg;
  padding: $spacing-md $spacing-lg;
  margin: 0 auto;
  max-width: $spacing-8xl;
}

.order-label {
  font-size: $font-size-sm;
  color: $text-secondary;
  font-weight: $font-weight-medium;
}

.order-id {
  font-size: $font-size-md;
  color: $text-primary;
  font-weight: $font-weight-bold;
  font-family: $font-family-mono;
}

.dialog-footer {
  display: flex;
  gap: $spacing-md;
  justify-content: center;
  padding: 0 $spacing-xl $spacing-xl;
}

.home-btn,
.orders-btn {
  padding: $spacing-md $spacing-lg;
  border-radius: $border-radius-lg;
  font-weight: $font-weight-semibold;
  font-size: $font-size-sm;
  transition: $transition-slow;
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  min-width: $spacing-5xl;
  justify-content: center;
}

.home-btn {
  background: $white;
  border: 2px solid $gray-200;
  color: $text-secondary;
}

.home-btn:hover {
  background: $gray-50;
  border-color: $gray-300;
  transform: translateY(-2px);
  box-shadow: $shadow-md;
}

.orders-btn {
  background: $gradient-primary;
  border: none;
  color: $white;
}

.orders-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba($primary-color, 0.4);
}

/* 订单状态样式 */
.order-status {
  background: $white;
  border-radius: $border-radius-xl;
  padding: $spacing-2xl;
  margin-bottom: $spacing-2xl;
  box-shadow: $shadow-lg;
  border: 1px solid $gray-200;
}

.status-card {
  background: linear-gradient(135deg, $gray-50 0%, $white 100%);
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  border: 1px solid $gray-200;
}

.status-info {
  display: grid;
  gap: $spacing-md;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md 0;
  border-bottom: $border-width-sm solid $gray-200;
}

.status-item:last-child {
  border-bottom: none;
}

.status-label {
  font-size: $font-size-md;
  color: $text-primary;
  font-weight: $font-weight-medium;
}

.status-value {
  font-size: $font-size-md;
  color: $text-primary;
  font-weight: $font-weight-semibold;
}

.status-value.paid {
  color: $primary-color;
  background: $gradient-primary;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: $font-weight-bold;
}

/* 现代消息样式 */
:deep(.modern-message) {
  border-radius: $border-radius-sm;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: none;
}

:deep(.modern-message.el-message--success) {
  background: linear-gradient(135deg, $primary-color, $primary-dark);
  color: $white;
}

:deep(.modern-message.el-message--error) {
  background: linear-gradient(135deg, $error-light, $error-color);
  color: $white;
}

:deep(.modern-message.el-message--warning) {
  background: linear-gradient(135deg, $warning-light, $warning-color);
  color: $white;
}

/* 响应式设计 */
@media (max-width: $breakpoint-mobile) {
  .banner-content h1 {
    font-size: $font-size-xl;
  }

  .container {
    max-width: 100%;
    padding: 0 $spacing-xs;
  }

  .checkout-content {
    padding: 0;
  }

  .order-summary,
  .shipping-info,
  .payment-methods {
    padding: $spacing-sm;
    margin-bottom: $spacing-md;
    margin-left: $spacing-xs;
    margin-right: $spacing-xs;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: $spacing-sm;
    margin: 0;
    /* 移除margin以解决高度不一致问题 */
  }

  .order-total {
    font-size: $font-size-md;
    flex-direction: row;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    margin-top: $spacing-md;
  }

  .total-price {
    font-size: $font-size-lg;
  }

  .product-info {
    flex-direction: row;
    text-align: left;
    align-items: flex-start;
    gap: $spacing-sm;
  }

  .product-image {
    width: $spacing-4xl;
    height: $spacing-4xl;
    margin: 0;
    flex-shrink: 0;
  }

  .product-details {
    flex: 1;
    min-width: 0;
  }

  .product-name {
    font-size: $font-size-sm;
    margin-bottom: $spacing-xs;
    line-height: 1.3;
  }

  .product-code {
    font-size: $font-size-xs;
    line-height: 1.2;
  }

  .section-title {
    font-size: $font-size-lg;
    margin-bottom: $spacing-sm;
  }

  /* 优化表格在手机端的显示 */
  .order-table {
    width: 100%;
    overflow-x: auto;
  }

  .order-table :deep(.el-table) {
    font-size: $font-size-xs;
    min-width: 100%;
  }

  .order-table :deep(.el-table th) {
    padding: $spacing-xs $spacing-xs;
    font-size: $font-size-xs;
    white-space: nowrap;
  }

  .order-table :deep(.el-table td) {
    padding: $spacing-xs $spacing-xs;
  }

  .order-table :deep(.el-table .cell) {
    padding: 0;
    line-height: 1.3;
    overflow: visible;
    text-overflow: clip;
    white-space: normal;
  }

  /* 确保产品信息列有足够宽度 */
  .order-table :deep(.el-table-column--selection) {
    width: auto;
  }

  .order-table :deep(.el-table th:first-child),
  .order-table :deep(.el-table td:first-child) {
    min-width: $spacing-10xl;
  }

  .subtotal-price {
    font-size: $font-size-sm;
  }

  /* 移动端表单优化 */
  .shipping-form :deep(.el-form-item) {
    display: block;
    margin-bottom: $spacing-lg;
    /* 统一间距 */
  }

  .shipping-form :deep(.el-form-item__label) {
    width: 100% !important;
    text-align: left;
    margin-bottom: $spacing-sm;
    /* 统一标签间距 */
    padding-right: 0;
    line-height: 1.4;
    font-size: $font-size-md;
    /* 统一字体大小 */
    font-weight: $font-weight-semibold;
    color: $text-primary;
  }

  .shipping-form :deep(.el-form-item__content) {
    margin-left: 0 !important;
    line-height: 1.4;
  }

  /* 统一所有输入框样式 */
  .shipping-form :deep(.el-input__wrapper) {
    padding: $spacing-md $spacing-lg;
    /* 统一内边距 */
    font-size: $font-size-md;
    /* 统一字体大小 */
    height: $form-input-height;
    min-height: $form-input-height;
    /* 统一高度 */
    border-radius: $border-radius-md;
    /* 统一圆角 */
    border: $border-width-sm solid $border-color;
    transition: all $transition-duration ease;
  }

  .shipping-form :deep(.el-input__wrapper:hover) {
    border-color: $border-dark;
  }

  .shipping-form :deep(.el-input__wrapper.is-focus) {
    border-color: $primary-color;
    box-shadow: 0 0 0 $spacing-xs rgba($primary-color, 0.1);
  }

  .shipping-form :deep(.el-input__inner) {
    font-size: $font-size-md;
    /* 统一字体大小 */
    line-height: $line-height-normal;
    color: $text-secondary;
  }

  /* 统一下拉框样式 */
  .shipping-form :deep(.el-select__wrapper) {
    padding: $spacing-md $spacing-lg;
    /* 统一内边距 */
    font-size: $font-size-md;
    /* 统一字体大小 */
    height: $form-input-height;
    min-height: $form-input-height;
    /* 统一高度 */
    border-radius: $border-radius-md;
    /* 统一圆角 */
    border: $border-width-sm solid $border-color;
    transition: all $transition-duration ease;
  }

  .shipping-form :deep(.el-select__wrapper:hover) {
    border-color: $border-dark;
  }

  .shipping-form :deep(.el-select__wrapper.is-focused) {
    border-color: $primary-color;
    box-shadow: 0 0 0 $spacing-xs rgba($primary-color, 0.1);
  }

  .shipping-form :deep(.el-select__selected-item) {
    font-size: $font-size-md;
    /* 统一字体大小 */
    line-height: $line-height-normal;
    color: $text-secondary;
  }

  .shipping-form :deep(.el-select__placeholder) {
    font-size: $font-size-md;
    /* 统一字体大小 */
    color: $border-dark;
  }

  /* 统一文本域样式 */
  .shipping-form :deep(.el-textarea__inner) {
    padding: $spacing-md $spacing-lg;
    /* 统一内边距 */
    font-size: $font-size-md;
    /* 统一字体大小 */
    min-height: $spacing-6xl;
    /* 统一高度 */
    border-radius: $border-radius-md;
    /* 统一圆角 */
    border: $border-width-sm solid $border-color;
    line-height: $line-height-normal;
    resize: vertical;
    transition: all $transition-duration ease;
  }

  .shipping-form :deep(.el-textarea__inner:hover) {
    border-color: $border-dark;
  }

  .shipping-form :deep(.el-textarea__inner:focus) {
    border-color: $primary-color;
    box-shadow: 0 0 0 $spacing-xs rgba($primary-color, 0.1);
    outline: none;
  }

  /* 电话输入框组特殊处理 */
  .phone-input-group {
    display: flex;
    gap: $spacing-sm;
    width: 100%;

    .country-code-select {
      flex: 0 0 $spacing-7xl;

      :deep(.el-select__wrapper) {
        height: $form-input-height;
        min-height: $form-input-height;
        /* 统一高度 */
        font-size: $font-size-md;
        /* 统一字体大小 */
        padding: $spacing-md $spacing-lg;
        /* 统一内边距 */
      }
    }

    .phone-number-input {
      flex: 1;

      :deep(.el-input__wrapper) {
        height: $form-input-height;
        min-height: $form-input-height;
        /* 统一高度 */
        font-size: $font-size-md;
        /* 统一字体大小 */
        padding: $spacing-md $spacing-lg;
        /* 统一内边距 */
      }
    }
  }

  /* 移动端支付方式优化 */
  .payment-tabs :deep(.el-tabs__item) {
    font-size: $font-size-sm;
    padding: 0 $spacing-sm;
    height: $spacing-3xl;
    line-height: $spacing-3xl;
  }

  .qrcode-container {
    padding: $spacing-md;
  }

  .qrcode-image {
    padding: $spacing-sm;
  }

  .qrcode-image img {
    max-width: $spacing-10xl;
  }

  .generate-qr-btn,
  .refresh-qr-btn {
    width: 100%;
    padding: $spacing-sm $spacing-md;
    font-size: $font-size-sm;
    min-height: $spacing-3xl;
  }

  /* 移动端订单状态优化 */
  .status-item {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-xs;
    padding: $spacing-sm 0;
  }

  .status-label,
  .status-value {
    font-size: $font-size-xs;
    line-height: 1.3;
  }

  .status-card {
    padding: $spacing-md;
  }

  /* 移动端对话框优化 */
  .success-dialog :deep(.el-dialog) {
    width: 95% !important;
    max-width: $spacing-12xl !important;
    margin: 0 auto;
    border-radius: $border-radius-lg;
  }

  .success-dialog :deep(.el-dialog__header) {
    padding: $spacing-lg $spacing-md;
  }

  .success-dialog :deep(.el-dialog__title) {
    font-size: $font-size-lg;
  }

  .success-content {
    padding: $spacing-lg $spacing-md $spacing-md;
  }

  .success-icon-wrapper {
    width: $spacing-5xl;
    height: $spacing-5xl;
    margin: 0 auto $spacing-md;
  }

  .success-icon {
    font-size: $font-size-2xl;
  }

  .success-title {
    font-size: $font-size-xl;
    margin: 0 0 $spacing-sm 0;
  }

  .success-message {
    font-size: $font-size-sm;
    margin: 0 0 $spacing-md 0;
  }

  .order-info {
    padding: $spacing-sm $spacing-md;
    margin: 0 auto $spacing-md;
  }

  .order-label {
    font-size: $font-size-xs;
  }

  .order-id {
    font-size: $font-size-sm;
    word-break: break-all;
  }

  .dialog-footer {
    flex-direction: column;
    gap: $spacing-sm;
    padding: 0 $spacing-md $spacing-lg;
  }

  .home-btn,
  .orders-btn {
    width: 100%;
    min-height: 44px;
    padding: $spacing-sm $spacing-md;
    font-size: $font-size-sm;
  }
}

/* 地址选择对话框样式 */
.address-dialog :deep(.el-dialog) {
  border-radius: $border-radius-lg;
  box-shadow: $shadow-lg;
}

.address-dialog :deep(.el-dialog__header) {
  padding: $spacing-lg $spacing-xl;
  border-bottom: 1px solid $gray-200;
}

.address-dialog :deep(.el-dialog__title) {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $text-primary;
}

.address-dialog :deep(.el-dialog__body) {
  padding: $spacing-lg $spacing-xl;
  max-height: 60vh;
  overflow-y: auto;
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  max-height: 400px;
  overflow-y: auto;
}

/* 移动端取消高度限制 */
@media (max-width: 768px) {
  .address-list {
    max-height: none;
  }
}

.address-items {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  max-height: 350px;
  overflow-y: auto;
}

.address-item {
  border: 2px solid $gray-200;
  border-radius: $border-radius-md;
  padding: $spacing-lg;
  cursor: pointer;
  transition: $transition-slow;
  background: $white;
  position: relative;
  display: flex;
  align-items: center;
  gap: $spacing-lg;
}

.address-item:hover {
  border-color: $primary-color;
  box-shadow: $shadow-sm;
}

.address-item.selected {
  border-color: $primary-color;
  background: rgba($primary-color, 0.05);
}

.default-tag {
  position: absolute;
  top: $spacing-md;
  right: $spacing-md;
  z-index: 1;
}

.address-default-badge {
  background: $primary-color;
  color: $white;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
}

.address-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.address-row {
  display: flex;
  gap: $spacing-lg;
  align-items: flex-start;
  margin-bottom: $spacing-sm;
}

.address-row:last-child {
  margin-bottom: 0;
}

.field-group {
  display: flex;
  align-items: flex-start;
  flex: 1;
  min-width: 0;
  margin-left: $spacing-sm;
}

.field-label {
  font-size: $font-size-lg;
  color: $text-secondary;
  font-weight: $font-weight-medium;
  text-align: right;
  width: 120px;
  flex-shrink: 0;
  margin-right: $spacing-md;
  line-height: $line-height-normal;
  white-space: nowrap;
}

.field-value {
  font-size: $font-size-lg;
  color: $text-primary;
  line-height: $line-height-normal;
  word-break: break-word;
  flex: 1;
}

.address-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.address-actions .el-icon {
  font-size: $font-size-xl;
  color: $primary-color;
}

.no-address {
  text-align: center;
  padding: $spacing-5xl $spacing-lg;
  color: $text-secondary;
}

.no-address-icon {
  font-size: $font-size-5xl;
  color: $gray-300;
  margin-bottom: $spacing-lg;
}

.no-address-text {
  font-size: $font-size-lg;
  margin-bottom: $spacing-lg;
}

.add-address-btn {
  border-radius: $border-radius-md;
  padding: $spacing-md $spacing-xl;
  font-weight: $font-weight-medium;
}





/* 自定义对话框样式 */
.custom-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-lg;
}

.custom-dialog {
  background: white;
  border-radius: $spacing-md;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 900px;
  max-height: 150vh;
  display: flex;
  flex-direction: column;
}

.custom-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-lg $spacing-4xl;
  border-bottom: $border-width-md solid $border-color;
  flex-shrink: 0;
  background: linear-gradient(135deg, $gray-50 0%, $white 100%);
  border-radius: $spacing-md $spacing-md 0 0;
}

.custom-dialog-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-semibold;
  color: $text-primary;
  margin: 0;
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.custom-dialog-title::before {
  content: '📍';
  font-size: $spacing-2xl;
}

.custom-dialog-close {
  background: none;
  border: none;
  font-size: $font-size-lg;
  color: $text-muted;
  cursor: pointer;
  padding: $spacing-xs;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $border-radius-xs;
  transition: all $transition-duration;
}

.custom-dialog-close:hover {
  background-color: $gray-50;
  color: $text-secondary;
}

.custom-dialog-body {
  padding: $spacing-xl $spacing-2xl;
  flex: 1;
  overflow-y: auto;
}

/* 移动端自定义对话框优化 */
@media (max-width: 768px) {
  .custom-dialog-overlay {
    padding: 0;
    align-items: stretch;
    justify-content: stretch;
  }

  .custom-dialog {
    width: 100vw;
    max-width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    margin: 0;
  }

  .custom-dialog-header {
    padding: $spacing-md $spacing-xl;
    border-bottom: $border-width-sm solid $border-light;
  }

  .custom-dialog-title {
    font-size: $font-size-lg;
  }

  .custom-dialog-body {
    padding: 0;
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
    /* 允许flex子元素收缩 */
  }

  .address-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: $spacing-md $spacing-lg;
    min-height: 0;
    /* 允许flex子元素收缩 */
    height: 100%;
    /* 确保占满可用高度 */
  }

  .address-items {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
    min-height: 0;
    /* 允许flex子元素收缩 */
    overflow-y: auto;
    /* 确保可以滚动 */
    padding-bottom: $spacing-lg;
    /* 底部留一些空间 */
    height: calc(100vh - $spacing-6xl);
    /* 设置具体高度，减去头部和padding的空间 */
    max-height: calc(100vh - $spacing-6xl);
    /* 限制最大高度 */

    /* 自定义滚动条样式 */
    scrollbar-width: thin;
    scrollbar-color: #c1c1c1 transparent;

    &::-webkit-scrollbar {
      width: $spacing-sm;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background-color: $gray-400;
      border-radius: $border-radius-sm;
      transition: background-color $transition-duration ease;
    }

    &::-webkit-scrollbar-thumb:hover {
      background-color: $gray-500;
    }
  }

  .address-item {
    padding: $spacing-md $spacing-md;
    border: 1px solid $border-color;
    border-radius: $border-radius-md;
    background: $white;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
    min-height: auto;
  }

  .address-item:hover {
    border-color: $primary-color;
    box-shadow: 0 $spacing-xs $spacing-lg rgba($primary-color, 0.1);
  }

  .address-item.selected {
    border-color: $primary-color;
    background-color: rgba($primary-color, 0.05);
  }

  .address-content {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    width: 100%;
  }

  .address-row {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    width: 100%;
  }

  /* 移除所有行的特殊布局，确保全部单列排列 */
  .address-row:nth-child(1),
  .address-row:nth-child(2),
  .address-row:nth-child(3),
  .address-row:nth-child(4) {
    flex-direction: column;
    gap: $spacing-sm;
  }

  .field-inline {
    font-size: $font-size-lg;
    line-height: $line-height-normal;
    color: $text-secondary;
    width: 100%;
    display: block;
    margin-bottom: $spacing-xs;
  }

  .field-inline strong {
    color: $text-primary;
    font-weight: $font-weight-medium;
    margin-right: $spacing-sm;
    display: inline-block;
    min-width: 80px;
    font-size: $font-size-md;
  }

  /* 确保字段名称和字段值在同一行显示 */
  .field-group {
    display: flex;
    align-items: flex-start;
    width: 100%;
    margin-bottom: $spacing-2xs;
    gap: $spacing-2xs;
  }

  .field-label {
    font-size: $font-size-md;
    color: $text-muted;
    font-weight: $font-weight-medium;
    display: inline-block;
    min-width: 80px;
    flex-shrink: 0;
    text-align: right;
  }

  .field-value {
    font-size: $font-size-md;
    color: $text-primary;
    line-height: $line-height-normal;
    word-break: break-word;
    flex: 1;
  }

  .default-tag {
    position: absolute;
    top: $spacing-sm;
    right: $spacing-sm;
    z-index: 1;
  }
}
</style>