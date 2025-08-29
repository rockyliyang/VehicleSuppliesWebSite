<template>
  <div class="unified-checkout">
    <!-- 页面横幅 -->
    <PageBanner :title="($t('checkout.title') || '结算页面')" />

    <!-- Navigation Menu -->
    <NavigationMenu :breadcrumb-items="breadcrumbItems" />

    <div class="container mx-auto px-4">
      <div class="checkout-content">
        <!-- 收货信息 -->
        <section class="shipping-info">
          <h2 class="section-title">
            <div class="title-content">
              <el-icon>
                <Location />
              </el-icon>
              {{ $t('checkout.shippingInfo') || '收货信息' }}
            </div>
            <div class="shipping-header" >
              <el-button @click="showAddressDialog = true" type="primary" class="address-select-btn">
                {{ $t('address.selectFromBook') || '从地址簿选择' }}
              </el-button>
              <el-button @click="handleInquiryClick" type="primary" class="inquiry-btn">
                {{ $t('checkout.inquiry') || 'Inquiry' }}
              </el-button>
            </div>
          </h2>
          <el-form :model="shippingInfo" :rules="shippingRules" ref="shippingForm" label-width="0"
            class="shipping-form">
            <div class="form-row">
              <el-form-item prop="name">
                <el-input v-model="shippingInfo.name" :placeholder="$t('checkout.namePlaceholder') || '收货人姓名'"
                   clearable />
              </el-form-item>
              <el-form-item prop="country">
                <el-select v-model="shippingInfo.country" :placeholder="$t('checkout.countryPlaceholder') || '选择国家'"
                   clearable @change="handleCountryChange">
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
                  :disabled=" !shippingInfo.country" clearable @change="handleStateChange">
                  <el-option v-for="state in currentStates" :key="state.id" :label="state.name" :value="state.name">
                  </el-option>
                </el-select>
                <el-input v-else v-model="shippingInfo.state" :placeholder="$t('checkout.statePlaceholder') || '选择省份'"
                   clearable />
              </el-form-item>
              <el-form-item prop="city">
                <el-input v-model="shippingInfo.city" :placeholder="$t('checkout.cityPlaceholder') || '城市'"
                   clearable />
              </el-form-item>
            </div>
            <div class="form-row">
              <el-form-item class="phone-input-group">
                <el-select v-model="shippingInfo.phone_country_code"
                  :placeholder="$t('checkout.countryCodePlaceholder') || '区号'"  clearable
                  class="country-code-select">
                  <el-option v-for="country in countries" :key="country.iso3" :label="country.phone_code"
                    :value="country.phone_code">
                  </el-option>
                </el-select>
                <el-input v-model="shippingInfo.phone" :placeholder="$t('checkout.phonePlaceholder') || '手机号码'"
                   clearable class="phone-number-input" />
              </el-form-item>
              <el-form-item>
                <el-input v-model="shippingInfo.email" :placeholder="$t('checkout.emailPlaceholder') || '邮箱地址'"
                   clearable autocomplete="off" />
              </el-form-item>
            </div>
            <div class="form-row">
              <el-form-item prop="zipCode">
                <el-input v-model="shippingInfo.zipCode" :placeholder="$t('checkout.zipCodePlaceholder') || '邮政编码'"
                   clearable />
              </el-form-item>
            </div>
            <el-form-item prop="address">
              <el-input v-model="shippingInfo.address" type="textarea" :rows="3"
                :placeholder="$t('checkout.addressPlaceholder') || '详细收货地址'"  />
            </el-form-item>
          </el-form>
        </section>

        <!-- 订单信息 -->
        <section class="order-summary">
          <h2 class="section-title">
            <div class="title-content">
              <el-icon>
                <ShoppingCart />
              </el-icon>
              {{ $t('checkout.orderInfo') || '订单信息' }}
            </div>
            <div class="order-header-actions" >
              <el-button @click="handleBackClick" type="default" class="back-btn">
                <el-icon>
                  <ArrowLeft />
                </el-icon>
                {{ $t('common.back') || '返回' }}
              </el-button>
              <el-button type="primary" size="large" @click="submitOrder" :loading="submitting" class="submit-btn">
                <el-icon>
                  <Document />
                </el-icon>
                {{ $t('checkout.submitOrder') || '提交订单' }}
              </el-button>
            </div>
          </h2>
          <!-- 桌面端表格显示 -->
          <div class="desktop-only">
            <el-table :data="orderItems" class="order-table">
              <el-table-column :label="$t('checkout.product') || '商品'" min-width="200">
                <template #default="{row}">
                  <div class="product-info">
                    <div class="product-image">
                      <img :src="row.image_url || require('@/assets/images/default-image.svg')" :alt="row.name">
                    </div>
                    <div class="product-details">
                      <div class="product-name">{{ row.product_name }}</div>
                      <div class="product-code">{{ $t('checkout.productType') || '产品类型' }}: {{ row.category_name }}
                      </div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column :label="$t('checkout.quantity') || '数量'" prop="quantity" width="100" align="center" />
              <el-table-column :label="$t('checkout.unitPrice') || '单价'" width="120" align="right">
                <template #default="{row}">{{ $store.getters.formatPrice(row.price) }}</template>
              </el-table-column>
              <el-table-column :label="$t('checkout.subtotal') || '小计'" width="120" align="right">
                <template #default="{row}">
                  <span class="subtotal-price">{{ $store.getters.formatPrice(row.price * row.quantity) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 手机端卡片显示 -->
          <div class="mobile-only">
            <HProductCard 
              :items="orderItems"
              :force-card-view="true"
              product-code-label="产品类型"
              product-code-field="category_name"
              price-field="calculatedPrice"
            />
          </div>
          <div class="order-total">
            <div class="total-container">
              <div class="total-row">
                <span>{{ $t('checkout.subtotal') || '商品小计' }}:</span>
                <span class="price">{{ $store.getters.formatPrice(orderTotal) }}</span>
              </div>
              <div class="total-row">
                <span>{{ $t('checkout.shippingFee') || '运费' }}:</span>
                <span class="price">{{ $store.getters.formatPrice(shippingFee) }}</span>
              </div>
              <div class="total-row grand-total">
                <span>{{ $t('checkout.total') || '总计' }}:</span>
                <span class="total-price">{{ $store.getters.formatPrice(orderTotal + shippingFee) }}</span>
              </div>
            </div>
          </div>
        </section>




        <!-- 订单状态信息（已支付订单） -->
        <section class="order-status" v-if="isOrderPaid">
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


    <!-- 询价浮动窗口 -->
    <div v-if="showInquiryDialog" class="inquiry-floating-window" :class="{ 'show': showInquiryDialog }">
      <div class="inquiry-window-content">
        <div class="inquiry-window-header">
          <h4 class="header-title">{{ $t('cart.salesCommunication') || 'Sales Communication' }}</h4>
          <div class="header-buttons">
            <button class="expand-btn" @click="expandInquiryDialog" title="放大窗口">
              <el-icon>
                <FullScreen />
              </el-icon>
            </button>
            <button class="close-btn" @click="closeInquiryDialog" title="关闭窗口">
              <el-icon>
                <Close />
              </el-icon>
            </button>
          </div>
        </div>
        <div class="inquiry-window-body">
          <!-- 沟通组件 -->
          <InquiryDetailPanel :inquiry-id="inquiryId" :is-mobile="isMobile" :is-checkout-mode="true"
            @update-message="handleUpdateInquiryMessage" @new-messages-received="handleNewMessages" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PageBanner from '@/components/common/PageBanner.vue';
import NavigationMenu from '@/components/common/NavigationMenu.vue';
import HProductCard from '@/components/common/H-ProductCard.vue';
import { validateInternationalPhone } from '@/utils/validation.js';
import { 
  ShoppingCart, 
  Location, 
  LocationInformation,
  SuccessFilled,

  Document,
  Close,
  FullScreen,
  ArrowLeft
} from '@element-plus/icons-vue';
import InquiryDetailPanel from '../components/common/InquiryDetailPanel.vue';

export default {
  name: 'UnifiedCheckout',
  components: {
    PageBanner,
    NavigationMenu,
    HProductCard,
    InquiryDetailPanel,
    ShoppingCart,
    Location,
    LocationInformation,
    SuccessFilled,

    Document,
    Close,
    FullScreen,
    ArrowLeft
  },
  props: {
    items: {
      type: Array,
      default: () => []
    }
  },
  watch: {
    selectedAddress: {
      handler(newAddress) {
        if (newAddress) {
          this.shippingInfo.name = `${newAddress.first_name} ${newAddress.last_name}`;
          this.shippingInfo.address = newAddress.address_line1;
          this.shippingInfo.city = newAddress.city;
          this.shippingInfo.state = newAddress.state;
          this.shippingInfo.zip = newAddress.postal_code;
          this.shippingInfo.country = newAddress.country;
          this.shippingInfo.phone = newAddress.phone_number;
          this.calculateShippingFee();
        }
      },
      deep: true,
      immediate: true
    },
  },
  data() {
    return {
      orderItems: [],
      orderTotal: 0,
      shippingFee: 0, // 运费
      logisticsCompany: null, // 物流公司信息
      shippingFeeRanges: [], // 运费范围
      shippingFeeFactors: [], // 运费系数
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
      //isOrderDetail: false, // 是否为订单详情模式
      orderData: null, // 订单详情数据
      isOrderPaid: false, // 订单是否已支付
      orderSource: 'cart', // 订单来源：'cart' 或 'inquiry'
      inquiryId: null, // 询价单ID（当orderSource为'inquiry'时使用）
      // 询价相关状态
      showInquiryDialog: false,
      currentInquiryData: null, // 存储完整的询价单数据
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
      submitting: false, // 提交订单状态
      paySuccess: false,
      orderId: '',

    };
  },
  computed: {
    breadcrumbItems() {
      const items = [];

        items.push({ text: this.$t('cart.title') || '购物车', to: '/cart' });
        items.push({ text: this.$t('checkout.title') || '结算' });
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
    },
    isMobile() {
      return window.innerWidth <= 768;
    }
  },
  created() {
    this.initOrderItems();
    this.loadAddressList();
    this.loadCountryStateData();
    this.fetchLogisticsData();
  },
  mounted() {
    // 页面挂载完成
  },
  beforeUnmount() {
    // 清理资源
  },
  methods: {
    closeAddressDialog() {
      this.showAddressDialog = false;
    },
    async initOrderItems() {
      // 检查是否为订单详情模式
      const orderId = this.$route.query.orderId;
      if (orderId) {
        //this.isOrderDetail = true;
        await this.fetchOrderDetail(orderId);
        // 从订单详情中获取inquiry_id
        if (this.orderData?.inquiry_id) {
          this.inquiryId = this.orderData.inquiry_id;
        }
        return;
      }
      
      // 优先使用props传递的数据
      if (this.items && this.items.length > 0) {
        this.orderItems = this.items;
        this.calculateTotal();
        // 检查props中是否有inquiry_id信息
        const inquiryIdFromUrl = this.$route.query.inquiryId;
        const isFromInquiry = inquiryIdFromUrl || this.items.some(item => item.inquiry_id);
        if (isFromInquiry) {
          this.orderSource = 'inquiry';
          this.inquiryId = inquiryIdFromUrl || this.items[0]?.inquiry_id;
        } else {
          this.orderSource = 'cart';
          this.inquiryId = null;
        }
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
          //sessionStorage.removeItem('selectedCartItems');
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
          // 检查URL参数中的inquiry_id
          const inquiryIdFromUrl = this.$route.query.inquiryId;
          if (inquiryIdFromUrl) {
            this.orderSource = 'inquiry';
            this.inquiryId = inquiryIdFromUrl;
          } else {
            this.orderSource = 'cart';
            this.inquiryId = null;
          }
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
    async fetchLogisticsData() {
      try {
        // 获取默认物流公司
        const companyRes = await this.$api.get('/admin/logistics/companies/default');
        if (!companyRes.success) {
          throw new Error(this.$t('checkout.error.fetchLogisticsFailed') || '获取物流公司信息失败');
        }
        this.logisticsCompany = companyRes.data;

        if (!this.logisticsCompany) {
          return;
        }

        // 获取运费范围
        const rangesRes = await this.$api.get(`/admin/logistics/companies/${this.logisticsCompany.id}/shipping-fee-ranges`);
        if (!rangesRes.success) {
          throw new Error(this.$t('checkout.error.fetchRangesFailed') || '获取运费范围失败');
        }
        this.shippingFeeRanges = rangesRes.data.ranges;

        // 获取运费系数
        const factorsRes = await this.$api.get(`/admin/logistics/companies/${this.logisticsCompany.id}/shipping-fee-factors`);
        if (!factorsRes.success) {
          throw new Error(this.$t('checkout.error.fetchFactorsFailed') || '获取运费系数失败');
        }
        this.shippingFeeFactors = factorsRes.data.factors;

        // 如果已经选择了国家，立即计算运费
        if (this.shippingInfo.country) {
          await this.calculateShippingFee();
        }
      } catch (error) {
        console.error('获取物流数据失败:', error);
        this.$messageHandler.showError(error, 'checkout.error.fetchLogisticsFailed');
      }
    },

    async calculateShippingFee() {
      if (!this.logisticsCompany || !this.shippingInfo.country) {
        return;
      }

      try {
        // 1. 根据国家查找运费范围
        let shippingRange = this.findShippingRange();
        if (!shippingRange) {
          console.warn('未找到匹配的运费范围');
          return;
        }

        // 2. 根据国家和标签查找运费系数
        let shippingFactor = this.findShippingFactor();
        if (!shippingFactor) {
          console.warn('未找到匹配的运费系数');
          return;
        }

        // 3. 计算总体积重量
        const throwRatioCoefficient = parseFloat(shippingFactor.throw_ratio_coefficient) || 5000;
        const volumeWeight = this.calculateVolumeWeight(throwRatioCoefficient);
        
        // 4. 计算总实际重量
        const actualWeight = this.calculateActualWeight();
        
        // 5. 使用较大的重量作为计算重量
        const calculationWeight = Math.max(volumeWeight, actualWeight);
        
        // 6. 计算运费
        // 基本公式: 运费=(首重费用 + (计算重量-首重) * 续重单价 + 附加费 + 附加费2) * 折扣 + 总费用
        let fee = 0;
        
        // 转换字符串类型为数字类型
        const initialWeight = parseFloat(shippingFactor.initial_weight) || 0;
        const initialFee = parseFloat(shippingFactor.initial_fee) || 0;
        const rangeFee = parseFloat(shippingRange.fee) || 0;
        const surcharge = parseFloat(shippingFactor.surcharge) || 0;
        const surcharge2 = parseFloat(shippingFactor.surcharge2) || 0;
        const discount = parseFloat(shippingFactor.discount) || 1;
        const otherFee = parseFloat(shippingFactor.other_fee) || 0;
        
        if (calculationWeight <= initialWeight) {
          // 如果在首重范围内
          fee = initialFee;
        } else {
          // 超过首重
          fee = initialFee + (calculationWeight * 2 -1) * rangeFee;
        }
        
        // 添加附加费
        fee += surcharge;
        fee += surcharge2;
        
        // 应用折扣
        if (discount > 0 && discount <= 1) {
          fee *= discount;
        }
        
        // 添加其他费用
        fee += otherFee;
        
        // 更新运费和总价
        this.shippingFee = fee;
        this.calculateTotal();
      } catch (error) {
        console.error('计算运费失败:', error);
        this.$messageHandler.showError(error, 'checkout.error.calculateShippingFeeFailed');
      }
    },

    findShippingRange() {
      if (!this.shippingFeeRanges || !this.shippingFeeRanges.length) {
        return null;
      }
      const countryId = this.getCountryId();
      // 1. 按国家查找
      let range = this.shippingFeeRanges.find(r => r.country_id === countryId);
      if (range) {
        return range;
      }
      // 2. 按标签查找
      if (this.logisticsCompany && this.logisticsCompany.code && this.shippingInfo.country) {
        const country = this.countries.find(c => c.name === this.shippingInfo.country);
        if (country && country.tags && Array.isArray(country.tags)) {
          const companyCode = this.logisticsCompany.code;
          const matchingTags = country.tags.filter(t => t.value && t.value.startsWith(companyCode));
          for (const tag of matchingTags) {
            const foundRange = this.shippingFeeRanges.find(r => parseInt(r.tags_id) === parseInt(tag.id));
            if (foundRange) {
              return foundRange;
            }
          }
        }
      }
      // 3. 查找默认
      return this.shippingFeeRanges.find(r => r.country_id === null && r.tags_id === null) || null;
    },

    findShippingFactor() {
      if (!this.shippingFeeFactors || !this.shippingFeeFactors.length) {
        return null;
      }
      const countryId = this.getCountryId();
      // 1. 按国家查找
      let factor = this.shippingFeeFactors.find(f => f.country_id === countryId);
      if (factor) {
        return factor;
      }
      // 2. 按标签查找
      if (this.logisticsCompany && this.logisticsCompany.code && this.shippingInfo.country) {
        const country = this.countries.find(c => c.name === this.shippingInfo.country);
        if (country && country.tags && Array.isArray(country.tags)) {
          const companyCode = this.logisticsCompany.code;
          const matchingTags = country.tags.filter(t => t.value && t.value.startsWith(companyCode));
          for (const tag of matchingTags) {
            const foundFactor = this.shippingFeeFactors.find(f => parseInt(f.tags_id) === parseInt(tag.id));
            if (foundFactor) {
              return foundFactor;
            }
          }
        }
      }
      // 3. 查找默认
      return this.shippingFeeFactors.find(f => f.country_id === null && f.tags_id === null) || null;
    },

    calculateVolumeWeight(volumeFactor) {
      return this.orderItems.reduce((total, item) => {
        if (!item.product_length || !item.product_width || !item.product_height) {
          return total;
        }
        // 确保尺寸数据为数字类型
        const length = parseFloat(item.product_length) || 0;
        const width = parseFloat(item.product_width) || 0;
        const height = parseFloat(item.product_height) || 0;
        const quantity = parseInt(item.quantity) || 0;
        
        const itemVolumeWeight = (length * width * height);
        return total + (itemVolumeWeight * quantity);
      }, 0) / volumeFactor;
    },

    calculateActualWeight() {
      return this.orderItems.reduce((total, item) => {
        // 确保重量和数量数据为数字类型
        const weight = parseFloat(item.product_weight) || 0;
        const quantity = parseInt(item.quantity) || 0;
        return total + (weight * quantity);
      }, 0);
    },

    getCountryId() {
      const country = this.countries.find(c => c.name === this.shippingInfo.country);
      return country ? country.id : null;
    },

    async submitOrder() {
      // 验证收货信息
      const isValid = await this.validateShippingInfo();
      if (!isValid) {
        this.$messageHandler.showError(this.$t('checkout.shippingInfoInvalid') || '请完善收货信息', 'checkout.error.shippingInfoInvalid');
        return;
      }

      this.submitting = true;
      try {
        // 检查是否有orderId参数，决定是修改订单还是创建订单
        const orderId = this.$route.query.orderId;
        
        if (orderId) {
          // 修改订单模式 - 只更新shipping information
          const updateData = {
            shipping_name: this.shippingInfo.name,
            shipping_phone: this.shippingInfo.phone,
            shipping_email: this.shippingInfo.email,
            shipping_address: this.shippingInfo.address,
            shipping_zip_code: this.shippingInfo.zipCode,
            shipping_country: this.shippingInfo.country,
            shipping_state: this.shippingInfo.state,
            shipping_city: this.shippingInfo.city,
            shipping_phone_country_code: this.shippingInfo.phone_country_code
          };
          
          const response = await this.$api.putWithErrorHandler(`/orders/${orderId}`, updateData);
          console.log('修改订单响应:', response);
          
          //this.$messageHandler.showSuccess(this.$t('checkout.orderUpdated') || '订单信息已更新', 'checkout.success.orderUpdated');
          
          // 跳转到支付页面
          this.$router.push({
            name: 'OrderPayment',
            params: { orderId: orderId },
            query: { from: 'checkout' }
          });
        } else {
          // 创建订单模式
          const requestData = {
            orderItems: this.orderItems,
            shipping_info: this.shippingInfo,
            total_amount: this.orderTotal,
            shipping_fee: this.shippingFee,
            create_time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone
          };

          // 如果是询价单订单，添加inquiry_id
          if (this.orderSource === 'inquiry' && this.inquiryId) {
            requestData.inquiry_id = this.inquiryId;
          }

          const response = await this.$api.postWithErrorHandler('/payment/common/create', requestData);
          console.log('创建订单响应:', response);
          this.orderId = response.data.orderId;
          
          // 如果是从购物车创建的订单，触发购物车更新事件
          if (this.orderSource === 'cart' && this.$bus) {
            this.$bus.emit('cart-updated');
          }
          
          // 跳转到支付页面
          this.$router.push({
            name: 'OrderPayment',
            params: { orderId: this.orderId },
            query: { from: 'checkout' }
          });
        }
      } catch (error) {
        console.error('订单操作失败:', error);
        const currentOrderId = this.$route.query.orderId;
        this.$messageHandler.showError(error, currentOrderId ? 'checkout.error.updateOrderFailed' : 'checkout.error.createOrderFailed');
      } finally {
        this.submitting = false;
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
     async handleInquiryClick() {
       // 获取当前订单的inquiry_id
       const inquiryId = this.inquiryId || this.$route.query.inquiryId;
       
       if (inquiryId) {
         // 如果有inquiry_id，直接打开现有的inquiry
         //await this.loadInquiryData(inquiryId);
         this.showInquiryDialog = true;
       } else {
         // 如果没有inquiry_id，创建新的custom类型inquiry
         await this.createCustomInquiry();
       }
     },
     async createCustomInquiry() {
       try {
         // 参考productUtils.js的createOrOpenInquiry方法
         const titlePrefix = this.$t('cart.inquiryTitlePrefix') || 'Inquiry';
         const createInquiryResponse = await this.$api.postWithErrorHandler('/inquiries', {
           titlePrefix: titlePrefix,
           inquiryType: 'custom'
         }, {
           fallbackKey: 'inquiry.error.createFailed'
         });
         
         if (createInquiryResponse.success) {
           
           // 从sessionStorage获取购物车商品数据
           const selectedCartItems = JSON.parse(sessionStorage.getItem('selectedCartItems') || '[]');
           
           // 如果有商品，批量添加到询价单
           if (selectedCartItems.length > 0) {
             const items = selectedCartItems.map(item => ({
               productId: item.product_id,
               quantity: item.quantity
             }));
             
             await this.$api.postWithErrorHandler(`/inquiries/${createInquiryResponse.data.id}/items/batch`, {
               items: items
             }, {
               fallbackKey: 'inquiry.error.addItemsFailed'
             });
             this.inquiryId = createInquiryResponse.data.id;
           }
           
           // 重新获取询价单详情（包含完整的商品信息）
           //await this.loadInquiryData(this.inquiryId);
           
           // 显示浮动窗口
           this.showInquiryDialog = true;
         }
       } catch (error) {
         console.error('创建inquiry失败:', error);
         this.$messageHandler.showError('创建咨询失败', 'inquiry.error.createFailed');
       }
     },
     /*async loadInquiryData(inquiryId) {
       try {
         const response = await this.$api.getWithErrorHandler(`/inquiries/${inquiryId}`, {
           fallbackKey: 'inquiry.fetchError'
         });
         
         if (response.success) {
           this.currentInquiryData = {
             ...response.data.inquiry,
             items: response.data.items || [],
           };
         }
       } catch (error) {
         console.error('加载inquiry数据失败:', error);
         this.$messageHandler.showError('加载咨询数据失败', 'inquiry.error.loadFailed');
       }
     },*/
     // 关闭询价对话框
     closeInquiryDialog() {
       this.showInquiryDialog = false;
       this.currentInquiryData = null;
     },
     // 展开询价对话框
     expandInquiryDialog() {
       if (this.inquiryId) {
         // 跳转到询价单管理页面，并传递当前询价单ID
         this.$router.push({
           path: '/inquiry-management',
           query: { inquiryId: this.inquiryId, mode: 'checkout' }
         });
       }
     },
     // 处理更新消息事件
     handleUpdateInquiryMessage(inquiryId, message) {
       // 可以在这里处理消息更新逻辑
       console.log('handleUpdateInquiryMessage:', inquiryId, message);
     },
     // 处理新消息接收事件
     handleNewMessages(newMessages) {
       // 可以在这里处理新消息接收逻辑
       console.log('handleNewMessages:', newMessages);
     },
     // 返回按钮点击处理
     handleBackClick() {
       this.$router.go(-1);
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

.order-header-actions {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.order-header-actions .back-btn {
  min-width: 100px;
  height: 40px;
  border: 2px solid $gray-400;
  background-color: $white;
  color: $gray-700;
  font-weight: $font-weight-medium;
  transition: all 0.3s ease;

  &:hover {
    border-color: $primary-color;
    color: $primary-color;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
  }
}

.order-header-actions .submit-btn {
  min-width: 120px;
  height: 40px;
  background-color: $primary-color;
  border-color: $primary-color;
  color: $white !important;
  font-weight: $font-weight-bold;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;

  &:hover {
    background-color: darken($primary-color, 10%);
    border-color: darken($primary-color, 10%);
    color: $white !important;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
    transform: translateY(-1px);
  }
}

/* 确保按钮内的所有文本都是白色 */
.order-header-actions .submit-btn :deep(span) {
  color: $white !important;
}

.shipping-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

/* 地址选择按钮样式 */
.address-select-btn {
  height: 40px;
  min-width: auto;
}

/* 直接覆盖按钮内的所有span */
.section-title .shipping-header .address-select-btn :deep(span) {
  color: $white !important;
}

.section-title .shipping-header .inquiry-btn :deep(span) {
  color: $white !important;
}

.inquiry-btn {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  height: 40px;
  min-width: auto;
  background-color: #67C23A !important;
  color: white !important;
  border-color: #67C23A !important;
  padding: $spacing-md $spacing-lg !important;
  font-size: $font-size-lg !important;
  border-radius: $border-radius-md !important;
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.3) !important;
  transition: all 0.3s ease !important;
}

.inquiry-btn:hover:not(:disabled) {
  background-color: #5daf34 !important;
  border-color: #5daf34 !important;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.4) !important;
  transform: translateY(-1px);
}

.inquiry-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(103, 194, 58, 0.3) !important;
}

.inquiry-btn i {
  font-size: $font-size-md;
}



/* 桌面端和手机端显示控制 */
.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
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
  border-radius: $border-radius-md;
  margin-top: $spacing-md;
  overflow: hidden;
  box-shadow: $shadow-sm;
}

.total-container {
  background: $white;
  padding: $spacing-lg;
  border: 1px solid $border-color;
  border-radius: $border-radius-md;

  .total-row {
    color: $text-primary;

    .price {
      color: $text-secondary;
      font-weight: $font-weight-medium;
    }

    &.grand-total {
      margin-top: $spacing-md;
      padding-top: $spacing-md;
      border-top: 1px solid $border-color;
      font-size: $font-size-lg;
      font-weight: $font-weight-bold;

      .total-price {
        color: $primary-color;
      }
    }
  }
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-sm;

  &:last-child {
    margin-bottom: 0;
  }
}

.total-price {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
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
      flex: 0 0 80px;
      /* 手机端区号选择框宽度调整为80px */

      :deep(.el-select__wrapper) {
        height: $form-input-height;
        min-height: $form-input-height;
        /* 统一高度 */
        font-size: $font-size-md;
        /* 统一字体大小 */
        padding: $spacing-md $spacing-sm;
        /* 减少内边距 */
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
@include mobile {
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
@include mobile {
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

/* 询价浮动窗口样式 */
.inquiry-floating-window {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 580px;
  height: 620px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: translateY(100%);
  opacity: 0;
  transition: all 0.3s ease-in-out;

  &.show {
    transform: translateY(0);
    opacity: 1;
  }

  .inquiry-window-content {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .inquiry-window-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    border-radius: 12px 12px 0 0;

    .header-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .header-buttons {
      display: flex;
      gap: 8px;

      button {
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;

        &:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .el-icon {
          font-size: 16px;
          color: #666;
        }
      }
    }
  }

  .inquiry-window-body {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
}

@include mobile {
  .inquiry-floating-window {
    /*bottom: 10px;
    right: 10px;
    width: calc(100vw - 20px);
    height: calc(100vh - 100px);*/
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    border-radius: 0;

    &.show {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }

  /* 手机端按钮适配 */
  .shipping-header {
    .address-select-btn {
      min-width: auto;
      width: 40px;
      height: 40px;
      padding: 0 !important;
      background: transparent !important;
      border: 1px solid $primary-color !important;
      color: $primary-color !important;

      :deep(span),
      :deep(.el-button__text) {
        display: none !important;
      }

      :deep(.el-icon) {
        display: none !important;
      }

      &::before {
        content: "📍";
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
      }

      &:hover {
        background: rgba($primary-color, 0.1) !important;
        border-color: $primary-color !important;
      }
    }

    .inquiry-btn {
      min-width: auto;
      width: 40px;
      height: 40px;
      padding: 0 !important;
      background: transparent !important;
      border: 1px solid $primary-color !important;
      color: $primary-color !important;

      :deep(span),
      :deep(.el-button__text) {
        display: none !important;
      }

      :deep(.el-icon) {
        display: none !important;
      }

      &::before {
        content: "?";
        font-size: 18px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
      }

      &:hover {
        background: rgba($primary-color, 0.1) !important;
        border-color: $primary-color !important;
      }
    }
  }

  /* 手机端隐藏back按钮 */
  .order-header-actions {
    .back-btn {
      display: none;
    }

    .submit-btn {
      width: 100%;
      justify-content: center;
    }
  }

  /* 手机端表格适配 */
  .order-table {
    font-size: 14px;
  }

  /* 手机端隐藏桌面端表格，显示卡片 */
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: block;
  }


}
</style>