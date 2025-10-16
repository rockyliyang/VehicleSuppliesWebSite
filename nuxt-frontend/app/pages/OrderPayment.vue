<template>
  <div class="order-payment">
    <!-- 页面横幅 -->
    <PageBanner :title="$t('payment.orderPayment')" :subtitle="$t('payment.orderPaymentSubtitle')" />

    <!-- 导航菜单 -->
    <NavigationMenu :breadcrumbItems="breadcrumbItems" />

    <div class="container mx-auto px-4" v-if="orderData">
      <!-- 订单信息 -->
      <div class="order-info-section">
        <h2 class="section-title">
          <div class="title-content">
            <el-icon>
              <Document />
            </el-icon>
            {{ $t('payment.orderInfo') }}
          </div>
          <div class="action-buttons">
            <el-button v-if="orderData.order.status === 'shipped'" @click="handleConfirmReceipt" type="primary"
              class="confirm-receipt-btn">
              {{ $t('payment.confirmReceipt') || 'Confirm Receipt' }}
            </el-button>
            <el-button
              v-if="['paid', 'shipped', 'delivered', 'refund_requested', 'refund_cancelled'].includes(orderData.order.status)"
              @click="handleRefundRequest" type="danger" class="refund-btn">
              {{ $t('payment.requestRefund') || 'Request Refund' }}
            </el-button>
            <el-button v-if="orderData.order.status === 'refund_requested'" @click="handleCancelRefundRequest"
              type="warning" class="cancel-refund-btn">
              {{ $t('payment.cancelRefundRequest') || 'Cancel Refund Request' }}
            </el-button>
            <el-button v-if="orderData.order.status === 'refund_approved'" @click="handleReturnLogistics" type="success"
              class="return-logistics-btn">
              {{ $t('payment.returnLogistics') || 'Return Logistics' }}
            </el-button>
            <el-button @click="handleInquiryClick" type="primary" class="inquiry-btn">
              {{ $t('checkout.inquiry') || 'Inquiry' }}
            </el-button>
          </div>
        </h2>
        <div class="order-summary">
          <div class="order-id">
            <span class="label">{{ $t('payment.orderId') }}:</span>
            <span class="value">{{ orderData.order.id }}</span>
          </div>
          <div class="order-amount">
            <span class="label">{{ $t('payment.totalAmount') }}:</span>
            <span class="value">${{ calculateOrderTotal() }}</span>
          </div>
          <div class="order-status">
            <span class="label">{{ $t('payment.orderStatus') || '订单状态' }}:</span>
            <span class="value" :class="getOrderStatusClass(orderData.order.status)">{{
              getOrderStatusText(orderData.order.status) }}</span>
          </div>
          <div class="order-time">
            <span class="label">{{ $t('payment.orderTime') || '订单时间' }}:</span>
            <span class="value">{{ orderData.order.created_at_local || formatDate(orderData.order.created_at) }}</span>
          </div>
          <div v-if="orderData.order.paid_at_local || orderData.order.paid_at" class="payment-time">
            <span class="label">{{ $t('payment.paidAt') || '支付时间' }}:</span>
            <span class="value">{{ orderData.order.paid_at_local || formatDateWithTimezone(orderData.order.paid_at,
              orderData.order.paid_time_zone) }}</span>
          </div>
        </div>

        <!-- 订单状态条 -->
        <OrderStatusBar :order-data="orderData.order" />
      </div>

      <!-- 商品信息 -->
      <div class="products-section">
        <h3 class="section-title">
          <el-icon>
            <ShoppingBag />
          </el-icon>
          {{ $t('payment.productInfo') }}
        </h3>

        <!-- 桌面端表格显示 -->
        <div class="desktop-only">
          <el-table :data="orderData.items" class="order-table">
            <el-table-column :label="$t('payment.product') || '商品'" min-width="200">
              <template #default="{row}">
                <div class="product-info">
                  <div class="product-image">
                    <img :src="row.image_url || require('@/assets/images/default-image.svg')" :alt="row.product_name">
                  </div>
                  <div class="product-details">
                    <div class="product-name">{{ row.product_name }}</div>
                    <div class="product-code">{{ $t('payment.productType') || '产品类型' }}: {{ row.category_name }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="$t('payment.quantity') || '数量'" prop="quantity" width="100" align="center" />
            <el-table-column :label="$t('payment.unitPrice') || '单价'" width="120" align="right">
              <template #default="{row}">${{ row.price }}</template>
            </el-table-column>
            <el-table-column :label="$t('payment.subtotal') || '小计'" width="120" align="right">
              <template #default="{row}">
                <span class="subtotal-price">${{ (row.price * row.quantity).toFixed(2) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 手机端卡片显示 -->
        <HProductCard :items="orderData.items" :force-card-view="false"
          :product-code-label="$t('payment.productType') || '产品类型'" :product-code-field="'category_name'"
          price-field="price" class="mobile-only" />
        <div class="order-total">
          <div class="total-container">
            <div class="total-row">
              <span>{{ $t('payment.subtotal') || '商品小计' }}:</span>
              <span class="price">${{ orderData.order.subtotal || calculateSubtotal() }}</span>
            </div>
            <div class="total-row">
              <span>{{ $t('payment.shippingFee') || '运费' }}:</span>
              <span class="price">${{ orderData.order.shipping_fee || '0.00' }}</span>
            </div>
            <div class="total-row grand-total">
              <span>{{ $t('payment.total') || '总计' }}:</span>
              <span class="total-price">${{ calculateOrderTotal() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 收货地址 -->
      <div class="shipping-section">
        <h3 class="section-title">
          <el-icon>
            <Location />
          </el-icon>
          {{ $t('payment.shippingInfo') }}
        </h3>
        <div class="shipping-info">
          <!-- 基本信息行 -->
          <div class="info-row">
            <div class="info-item">
              <span class="info-label">{{ $t('payment.recipientName') || '收货人' }}</span>
              <span class="info-value">{{ orderData.order.shipping_name }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('payment.email') || '邮箱' }}</span>
              <span class="info-value">{{ orderData.order.shipping_email }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('payment.phone') || '联系电话' }}</span>
              <span class="info-value">{{ orderData.order.shipping_phone_country_code || '' }} {{
                orderData.order.shipping_phone }}</span>
            </div>
          </div>

          <!-- 地址信息行 -->
          <div class="info-row">
            <div class="info-item">
              <span class="info-label">{{ $t('payment.country') || '国家' }}</span>
              <span class="info-value">{{ orderData.order.shipping_country || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('payment.state') || '省份' }}</span>
              <span class="info-value">{{ orderData.order.shipping_state || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('payment.city') || '城市' }}</span>
              <span class="info-value">{{ orderData.order.shipping_city || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('payment.zipCode') || '邮编' }}</span>
              <span class="info-value">{{ orderData.order.shipping_zip_code || 'N/A' }}</span>
            </div>
          </div>

          <!-- 详细地址行 -->
          <div class="info-row full-width">
            <div class="info-item full-width">
              <span class="info-label">{{ $t('payment.address') || '详细地址' }}</span>
              <span class="info-value">{{ orderData.order.shipping_address }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 物流信息 -->
      <div v-if="orderData.order.status === 'shipped' && orderData.logistics && orderData.logistics.length > 0"
        class="logistics-section">
        <h3 class="section-title">
          <div class="title-content">
            <el-icon>
              <Van />
            </el-icon>
            {{ $t('payment.logisticsInfo') || '物流信息' }}
          </div>
          <el-button @click="handleBackClick" type="default" class="back-btn">
            <el-icon>
              <ArrowLeft />
            </el-icon>
            {{ $t('common.back') || '返回' }}
          </el-button>
        </h3>
        <div class="logistics-info">
          <!-- 物流基本信息 -->
          <div class="info-row">
            <div class="info-item">
              <span class="info-label">{{ $t('payment.shippingNo') || '物流单号' }}</span>
              <span class="info-value">{{ orderData.logistics[0].shipping_no || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('payment.shippingStatus') || '物流状态' }}</span>
              <span class="info-value">{{ orderData.logistics[0].shipping_status || 'N/A' }}</span>
            </div>
            <div class="info-item" v-if="orderData.logistics[0].shipped_at_local || orderData.logistics[0].shipped_at">
              <span class="info-label">{{ $t('payment.shippedDate') || '发货时间' }}</span>
              <span class="info-value">{{ orderData.logistics[0].shipped_at_local || orderData.logistics[0].shipped_at
                ||
                'N/A' }}</span>
            </div>
          </div>

          <!-- 物流跟踪信息 -->
          <div v-if="orderData.logistics[0].tracking_info" class="info-row full-width">
            <div class="info-item full-width">
              <span class="info-label">{{ $t('payment.trackingInfo') || '跟踪信息' }}</span>
              <span class="info-value">{{ orderData.logistics[0].tracking_info }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 支付方式选择 - 只在pending状态显示 -->
      <div v-if="orderData.order.status === 'pending'" class="payment-section">
        <h3 class="section-title">
          <div class="title-content">
            <el-icon>
              <CreditCard />
            </el-icon>
            {{ $t('payment.selectPaymentMethod') }}
          </div>
          <el-button @click="handleBackClick" type="default" class="back-btn">
            <el-icon>
              <ArrowLeft />
            </el-icon>
            {{ $t('common.back') || '返回' }}
          </el-button>
        </h3>

        <!-- 待支付状态显示支付选项 -->
        <div class="payment-methods">
          <!-- PayPal 支付 -->
          <div class="payment-method paypal-method">
            <h4>{{ $t('payment.paypal') }}</h4>
            <div id="paypal-button-container"></div>
          </div>

          <!-- 支付宝支付 -->
          <div class="payment-method alipay-method">
            <div class="alipay-header">
              <h4>
                {{ $t('payment.alipay') }}
                <span v-if="cnyAmount" class="cny-amount">
                  (¥{{ cnyAmount }})
                </span>
                <span v-if="alipayDisabled" class="disabled-notice">
                  - {{ $t('payment.temporarilyUnavailable') || 'Temporarily Unavailable' }}
                </span>
              </h4>
            </div>

            <!-- 手机端支付宝支付按钮 -->
            <div v-if="isMobile" class="alipay-mobile-container">
              <el-button @click="handleMobileAlipayPayment" type="primary" size="large" class="alipay-mobile-btn"
                :loading="generating" :disabled="generating || alipayDisabled">
                <el-icon>
                  <CreditCard />
                </el-icon>
                {{ $t('payment.payWithAlipay') || '使用支付宝支付' }}
              </el-button>
            </div>


            <!-- 桌面端支付宝iframe显示 -->
            <div v-else-if="alipayFormData && !alipayDisabled" class="alipay-iframe-container">
              <div class="iframe-wrapper">
                <iframe ref="alipayIframe" :srcdoc="alipayFormData" class="alipay-iframe" frameborder="0"
                  scrolling="auto" sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation"></iframe>
              </div>
            </div>
            <!-- 支付宝不可用提示 -->
            <div v-else-if="alipayDisabled" class="alipay-disabled-notice">
              <p>{{ $t('payment.alipayTemporarilyDisabled')
                || 'Alipay payment is temporarily disabled due to exchange rate unavailability' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 支付成功提示 -->
    <div v-if="paySuccess" class="payment-success">
      <div class="success-content">
        <i class="fas fa-check-circle"></i>
        <h2>{{ $t('payment.paymentSuccess') }}</h2>
        <p>{{ $t('payment.paymentSuccessMessage') }}</p>
        <div class="success-actions">
          <button @click="goToOrders" class="btn-primary">
            {{ $t('payment.viewOrders') }}
          </button>
          <button @click="goHome" class="btn-secondary">
            {{ $t('payment.backToHome') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>{{ $t('common.loading') }}</span>
    </div>

    <!-- Inquiry 浮动窗口 -->
    <div v-if="showInquiryDialog" class="inquiry-floating-window" :class="{ 'show': showInquiryDialog }">
      <div class="inquiry-overlay" @click="closeInquiryDialog"></div>
      <div class="inquiry-content">
        <div class="inquiry-header">
          <h3>{{ $t('inquiry.title') || 'Inquiry Details' }}</h3>
          <div class="inquiry-actions">
            <el-button @click="expandInquiryDialog" type="text" class="expand-btn">
              <el-icon>
                <FullScreen />
              </el-icon>
            </el-button>
            <el-button @click="closeInquiryDialog" type="text" class="close-btn">
              <el-icon>
                <Close />
              </el-icon>
            </el-button>
          </div>
        </div>
        <InquiryDetailPanel :inquiry-id="inquiryId" :is-mobile="isMobile" :is-checkout-mode="true"
          @update-message="handleUpdateInquiryMessage" @close="closeInquiryDialog" />
      </div>
    </div>

    <!-- 退款申请对话框 -->
    <el-dialog v-model="showRefundDialog" :title="$t('refund.title')" width="650px"
      :before-close="handleRefundDialogClose" :close-on-click-modal="false" :close-on-press-escape="false"
      class="refund-dialog" center>
      <div class="refund-dialog-content">
        <!-- 订单信息 -->
        <div class="order-summary">
          <h4>{{ $t('refund.orderInfo') }}</h4>
          <div class="order-details">
            <p><strong>{{ $t('order.orderId') }}:</strong> {{ orderData.order?.id }}</p>
            <p><strong>{{ $t('order.totalAmount') }}:</strong> ¥{{ calculateOrderTotal() }}</p>
            <p><strong>{{ $t('order.status') }}:</strong> {{ getOrderStatusText(orderData.order?.status) }}</p>
            <p><strong>{{ $t('order.orderTime') }}:</strong> {{ formatDate(orderData.order?.created_at) }}</p>
          </div>
        </div>

        <!-- 退款原因 -->
        <div class="refund-reason">
          <h4>{{ $t('refund.reason') }}</h4>
          <el-input v-model="refundForm.reason" type="textarea" :rows="4" :placeholder="$t('refund.reasonPlaceholder')"
            maxlength="500" show-word-limit />
        </div>

        <!-- 图片上传 -->
        <div class="refund-images">
          <h4>{{ $t('refund.uploadImages') }}</h4>
          <el-upload ref="refundUpload" :action="uploadUrl" :headers="uploadHeaders" :data="uploadData"
            :file-list="refundForm.images" :on-success="handleUploadSuccess" :on-error="handleUploadError"
            :before-upload="beforeUpload" list-type="picture-card" :limit="5" accept="image/*">
            <el-icon>
              <Plus />
            </el-icon>
          </el-upload>
          <div class="upload-tip">
            {{ $t('refund.uploadTip') }}
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleRefundDialogCancel">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" @click="submitRefundRequest" :loading="refundSubmitting">
            {{ $t('refund.submit') }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 退货物流对话框 -->
    <el-dialog v-model="showReturnLogisticsDialog" :title="$t('returnLogistics.title')" width="650px"
      :before-close="handleReturnLogisticsDialogClose" :close-on-click-modal="false" :close-on-press-escape="false"
      class="refund-dialog" center>
      <div class="refund-dialog-content">
        <!-- 订单信息 -->
        <div class="order-summary">
          <h4>{{ $t('returnLogistics.orderInfo') }}</h4>
          <div class="order-details">
            <p><strong>{{ $t('order.orderId') }}:</strong> {{ orderData.order?.id }}</p>
            <p><strong>{{ $t('order.totalAmount') }}:</strong> ¥{{ calculateOrderTotal() }}</p>
            <p><strong>{{ $t('order.status') }}:</strong> {{ getOrderStatusText(orderData.order?.status) }}</p>
            <p><strong>{{ $t('order.orderTime') }}:</strong> {{ formatDate(orderData.order?.created_at) }}</p>
          </div>
        </div>

        <!-- 退货物流信息 -->
        <div class="refund-reason">
          <h4>{{ $t('returnLogistics.logisticsInfo') }}</h4>
          <el-input v-model="returnLogisticsForm.logisticsInfo" type="textarea" :rows="4"
            :placeholder="$t('returnLogistics.logisticsInfoPlaceholder')" maxlength="500" show-word-limit />
        </div>

        <!-- 图片上传 -->
        <div class="refund-images">
          <h4>{{ $t('returnLogistics.uploadImages') }}</h4>
          <el-upload ref="returnLogisticsUpload" :action="uploadUrl" :headers="uploadHeaders"
            :data="returnLogisticsUploadData" :file-list="returnLogisticsForm.images"
            :on-success="handleReturnLogisticsUploadSuccess" :on-error="handleReturnLogisticsUploadError"
            :before-upload="beforeUpload" list-type="picture-card" :limit="5" accept="image/*">
            <el-icon>
              <Plus />
            </el-icon>
          </el-upload>
          <div class="upload-tip">
            {{ $t('returnLogistics.uploadTip') }}
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleReturnLogisticsDialogCancel">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" @click="submitReturnLogistics" :loading="returnLogisticsSubmitting">
            {{ $t('returnLogistics.submit') }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import PageBanner from '@/components/common/PageBanner.vue';
import NavigationMenu from '@/components/common/NavigationMenu.vue';
import InquiryDetailPanel from '@/components/common/InquiryDetailPanel.vue';
import HProductCard from '@/components/common/H-ProductCard.vue';
import OrderStatusBar from '@/components/common/OrderStatusBar.vue';
import { getAuthToken } from '@/utils/api.js';
import { getOrderStatusKey, getOrderStatusClass } from '@/utils/orderUtils.js';
import { Document, ShoppingBag, Location, CreditCard, ArrowLeft, FullScreen, Close, Van, Money, Check, Clock, RefreshLeft, Select, Plus } from '@element-plus/icons-vue';

export default {
  name: 'OrderPayment',
  components: {
    PageBanner,
    NavigationMenu,
    InquiryDetailPanel,
    HProductCard,
    OrderStatusBar,
    Document,
    ShoppingBag,
    Location,
    CreditCard,
    ArrowLeft,
    FullScreen,
    Close,
    Van,
    Plus
  },
  data() {
    return {
      loading: true,
      orderData: null,
      orderId: null,
      breadcrumbItems: [],
      paypalConfig: null,
      qrcodeUrl: '',
      alipayFormData: '',
      generating: false,
      refreshing: false,
      qrcodeTimer: 0,
      alipayTimer: 0,
      qrcodeTimerInterval: null,
      alipayTimerInterval: null,
      autoRefreshTimer: null,
      polling: false,
      pollingTimer: null,
      paySuccess: false,
      isPollingRequest: false,
      pollingCount: 0,
      pollingPhase: 1, // 1: 3s间隔, 2: 5s间隔, 3: 10s间隔
      showInquiryDialog: false,
      currentInquiryData: null,
      inquiryId: null,
      exchangeRate: null,
      exchangeRateLoading: false,
      alipayDisabled: false,
      // 退款相关数据
      showRefundDialog: false,
      refundSubmitting: false,
      refundForm: {
        reason: '',
        images: []
      },
      // 退货物流相关数据
      showReturnLogisticsDialog: false,
      returnLogisticsSubmitting: false,
      returnLogisticsForm: {
        logisticsInfo: '',
        images: []
      },
      returnLogisticsUploadData: {},
      uploadUrl: '/api/orders/status-data/upload-image',
      uploadHeaders: {},
      uploadData: {}
    };
  },
  computed: {
    isMobile() {
      if (typeof window === 'undefined') {
        return false // 在SSR环境中默认返回false
      }
      return window.innerWidth <= 768;
    },
    cnyAmount() {
      console.log('exchangeRate',this.exchangeRate);
      if (!this.exchangeRate || !this.orderData || !this.orderData.order) {
        return null;
      }
      const usdAmount = this.calculateOrderTotal();
      if (isNaN(usdAmount)) {
        return null;
      }
      const cnyAmount = (usdAmount * this.exchangeRate).toFixed(2);
      return cnyAmount;
    }
  },
  async created() {
    this.orderId = this.$route.params.orderId || this.$route.query.orderId;
    if (!this.orderId) {
      this.$messageHandler.showError(this.$t('payment.orderIdRequired'), 'payment.error.orderIdRequired');
      navigateTo('/');
      return;
    }
    
    // 根据来源页面动态设置面包屑导航
    this.setBreadcrumbItems();
    
    await this.fetchOrderDetail();
    
    // 只有订单状态为pending时才初始化支付功能
    if (this.orderData && this.orderData.order && this.orderData.order.status === 'pending') {
      await this.fetchPayPalConfig();
      // 获取汇率
      await this.fetchExchangeRate();
      // 自动生成支付宝支付表单
      await this.generateAlipayForm('alipay');
    }
  },
  
  mounted() {
    // PayPal SDK在fetchPayPalConfig完成后加载
    if (this.paypalConfig) {
      this.loadPayPalSDK();
    }
  },
  beforeUnmount() {
    this.clearTimers();
    // 清理 PayPal 脚本
    const paypalScript = document.getElementById('paypal-sdk');
    if (paypalScript) {
      paypalScript.remove();
    }
  },
  methods: {
    setBreadcrumbItems() {
      // 检查来源页面，设置相应的面包屑导航
      const fromRoute = this.$route.query.from || this.$route.meta.from;
      if (fromRoute === 'checkout' || this.$route.name === 'OrderPayment' && this.$router.options.history.state.back?.includes('checkout')) {
        // 从结账页面进入，返回checkout时需要传递orderId
        this.breadcrumbItems = [
          { text: this.$t('cart.title') || '购物车', to: { path: '/cart' } },
          { text: this.$t('checkout.title') || 'Checkout', to: { path: '/unified-checkout', query: { orderId: this.orderId } } },
          { text: this.$t('payment.orderPayment') || 'Order Payment', to: null }
        ];
      } else if (fromRoute === 'orders' || this.$route.name === 'OrderPayment' && this.$router.options.history.state.back?.includes('orders')) {
        // 从订单列表页面进入
        this.breadcrumbItems = [
          { text: this.$t('orders.title') || 'My Orders', to: { path: '/UserOrders' } },
          { text: this.$t('payment.orderPayment') || 'Order Payment', to: null }
        ];
      } else {
        // 默认情况
        this.breadcrumbItems = [
          { text: this.$t('common.home') || 'Home', to: { path: '/' } },
          { text: this.$t('payment.orderPayment') || 'Order Payment', to: null }
        ];
      }
    },
    async fetchOrderDetail() {
      try {
        const response = await this.$api.get(`/orders/${this.orderId}`);
        if (response.success) {
          this.orderData = response.data;
          // 从订单数据中获取inquiry_id
          if (this.orderData.order && this.orderData.order.inquiry_id) {
            this.inquiryId = this.orderData.order.inquiry_id;
          }
        } else {
          this.$messageHandler.showError(response.message, 'payment.error.fetchOrderFailed');
          navigateTo('/');
        }
      } catch (error) {
        this.$messageHandler.showError(this.$t('payment.fetchOrderFailed'), 'payment.error.fetchOrderFailed');
        navigateTo('/');
      } finally {
        this.loading = false;
      }
    },
    calculateSubtotal() {
      if (!this.orderData || !this.orderData.items) return '0.00';
      const subtotal = this.orderData.items.reduce((sum, item) => {
        return sum + (parseFloat(item.price) * parseInt(item.quantity));
      }, 0);
      return subtotal.toFixed(2);
    },
    calculateOrderTotal() {
      if (!this.orderData || !this.orderData.order) return 0;
      const totalAmount = parseFloat(this.orderData.order.total_amount) || 0;
      const shippingFee = parseFloat(this.orderData.order.shipping_fee) || 0;
      return totalAmount + shippingFee;
    },
    async fetchPayPalConfig() {
      try {
        const response = await this.$api.get('/payment-config/config');
        if (response.success) {
          this.paypalConfig = response.data.paypalConfig;
          // 配置获取完成后加载PayPal SDK
          this.$nextTick(() => {
            this.loadPayPalSDK();
          });
        }
      } catch (error) {
        console.error('Failed to fetch PayPal config:', error);
      }
    },
    loadPayPalSDK() {
      if (!this.paypalConfig) {
        console.error('PayPal配置对象不存在');
        return;
      }
      
      if (!this.paypalConfig.clientId || this.paypalConfig.clientId === 'test') {
        console.warn('PayPal Client ID无效:', this.paypalConfig.clientId);
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
      
      const params = new URLSearchParams({
        'client-id': this.paypalConfig.clientId,
        'currency': this.paypalConfig.currency || 'USD',
        'intent': this.paypalConfig.intent || 'capture',
        'components': this.paypalConfig.components || 'buttons,funding-eligibility',
        'locale': 'en_US'
      });
      
      if (this.paypalConfig.enableFunding) {
        params.append('enable-funding', this.paypalConfig.enableFunding);
      }
      
      if (this.paypalConfig.disableFunding) {
        params.append('disable-funding', this.paypalConfig.disableFunding);
      }
      
      script.src = `${this.paypalConfig.scriptUrl}?${params.toString()}`;
      
      script.onload = () => {
        this.renderPayPalButtons();
      };
      
      script.onerror = (error) => {
        console.error('PayPal SDK加载失败:', error);
        this.$messageHandler.showError(this.$t('payment.paypalSDKLoadFailed'), 'payment.error.paypalSDKLoadFailed');
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
            const response = await this.$api.postWithErrorHandler('/payment/paypal/repay', {
              orderId: this.orderId
            });
            
            if (response.success) {
              return response.data.paypalOrderId || response.data.id || response.data.orderID;
            } else {
              throw new Error(response.message || '创建PayPal订单失败');
            }
          } catch (error) {
            this.$messageHandler.showError(error.message || '支付过程中出现错误', 'payment.error.paymentError');
            throw error;
          }
        },
        onApprove: async (data, actions) => {
          try {
            const response = await this.$api.postWithErrorHandler('/payment/paypal/capture', {
              paypalOrderId: data.orderID,
              orderId: this.orderId,
              paid_time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });
            
            if (response.success) {
              this.paySuccess = true;
              this.clearTimers();
              if (this.$bus) {
                this.$bus.emit('cart-updated');
              }
            } else {
              throw new Error(response.message || '支付捕获失败');
            }
          } catch (error) {
            this.$messageHandler.showError('PayPal支付失败: ' + error.message, 'payment.error.paypalFailed');
            if (error.message.includes('INSTRUMENT_DECLINED')) {
              return actions.restart();
            }
          }
        },
        onError: (err) => {
          this.$messageHandler.showError('PayPal支付失败: ' + (err.message || '未知错误'), 'payment.error.paypalFailed');
        },
        onCancel: () => {
          this.$messageHandler.showInfo(this.$t('payment.paymentCancelled'), 'payment.info.paymentCancelled');
        }
      }).render('#paypal-button-container').catch(err => {
        console.error('PayPal按钮渲染失败:', err);
        this.$messageHandler.showError(err, 'payment.error.paypalButtonLoadFailed');
      });
    },

    async generateAlipayForm(paymentMethod) {
      this.generating = true;
      this.clearAlipayTimers();
      this.alipayFormData = '';
      
      try {
        const formRes = await this.$api.postWithErrorHandler('/payment/qrcode', {
          orderId: this.orderId,
          paymentMethod,
          paidTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          exchangeRate: this.exchangeRate
        });
        
        if (formRes.success && formRes.data.paymentForm) {
          this.alipayFormData = formRes.data.paymentForm;
          this.startPaymentStatusPolling(this.orderId, paymentMethod);
          this.startAlipayTimer();
          this.startAutoRefreshAlipay(paymentMethod);
          // 等待iframe加载完成后处理内容
          this.$nextTick(() => {
            this.hideAlipayText();
          });
        } else {
          this.$messageHandler.showError(this.$t('payment.error.formGenerateFailedWithMessage', { message: formRes.message }), 'payment.error.formGenerateFailed');
        }
      } catch (error) {
        console.error('Error generating Alipay form:', error);
        this.$messageHandler.showError(this.$t('payment.formGenerateFailed'), 'payment.error.formGenerateFailed');
      } finally {
        this.generating = false;
      }
    },
    async refreshQrcode(paymentMethod) {
      this.refreshing = true;
      this.clearQrcodeTimers();
      
      try {
        const qrRes = await this.$api.postWithErrorHandler('/payment/qrcode', {
          orderId: this.orderId,
          paymentMethod,
          exchangeRate: this.exchangeRate
        });
        
        if (qrRes.success) {
          this.qrcodeUrl = qrRes.data.qrcodeUrl;
          this.startQrcodeTimer();
          this.startAutoRefresh(paymentMethod);
        } else {
          this.$messageHandler.showError(this.$t('payment.error.qrcodeRefreshFailedWithMessage', { message: qrRes.message }), 'payment.error.qrcodeRefreshFailed');
        }
      } catch (error) {
        console.error('Error refreshing QR code:', error);
        this.$messageHandler.showError(this.$t('payment.qrcodeRefreshFailed'), 'payment.error.qrcodeRefreshFailed');
      } finally {
        this.refreshing = false;
      }
    },
    async refreshAlipayForm(paymentMethod) {
      this.refreshing = true;
      this.clearAlipayTimers();
      
      try {
        const formRes = await this.$api.postWithErrorHandler('/payment/qrcode', {
          orderId: this.orderId,
          paymentMethod,
          exchangeRate: this.exchangeRate
        });
        
        if (formRes.success && formRes.data.paymentForm) {
          this.alipayFormData = formRes.data.paymentForm;
          this.startAlipayTimer();
          this.startAutoRefreshAlipay(paymentMethod);
          // 等待iframe加载完成后处理内容
          this.$nextTick(() => {
            this.hideAlipayText();
          });
        } else {
          this.$messageHandler.showError(this.$t('payment.error.formRefreshFailedWithMessage', { message: formRes.message }), 'payment.error.formRefreshFailed');
        }
      } catch (error) {
        console.error('Error refreshing Alipay form:', error);
        this.$messageHandler.showError(this.$t('payment.formRefreshFailed'), 'payment.error.formRefreshFailed');
      } finally {
        this.refreshing = false;
      }
    },
    startPaymentStatusPolling(orderId, paymentMethod) {
      this.clearPollingTimer();
      this.polling = true;
      this.isPollingRequest = false;
      this.pollingCount = 0;
      this.pollingPhase = 1;
      
      const pollPaymentStatus = async () => {
        if (this.isPollingRequest) {
          return;
        }
        
        this.isPollingRequest = true;
        this.pollingCount++;
        
        try {
          const statusRes = await this.$api.post('/payment/check-status', {
            orderId,
            paymentMethod
          });
          
          if (statusRes.success && statusRes.data.status === 'paid') {
            this.clearPollingTimer();
            this.paySuccess = true;
            this.clearQrcodeTimers();
            if (this.$bus) {
              this.$bus.emit('cart-updated');
            }
            return;
          }
        } catch (error) {
          console.warn('Payment status check failed:', error);
        } finally {
          this.isPollingRequest = false;
        }
        
        // 阶梯式延迟逻辑
        this.scheduleNextPoll(orderId, paymentMethod);
      };
      
      // 立即执行第一次检查
      pollPaymentStatus();
    },
    
    scheduleNextPoll(orderId, paymentMethod) {
      let delay;
      
      if (this.pollingPhase === 1 && this.pollingCount < 5) {
        // 第一阶段：3秒间隔，发5次
        delay = 3000;
      } else if (this.pollingPhase === 1 && this.pollingCount >= 5) {
        // 进入第二阶段
        this.pollingPhase = 2;
        delay = 5000;
      } else if (this.pollingPhase === 2 && this.pollingCount < 10) {
        // 第二阶段：5秒间隔，再发5次（总共10次）
        delay = 5000;
      } else if (this.pollingPhase === 2 && this.pollingCount >= 10) {
        // 进入第三阶段
        this.pollingPhase = 3;
        delay = 10000;
      } else {
        // 第三阶段：10秒间隔，持续发送
        delay = 10000;
      }
      
      this.pollingTimer = setTimeout(() => {
        if (this.polling) {
          this.startSinglePoll(orderId, paymentMethod);
        }
      }, delay);
    },
    
    async startSinglePoll(orderId, paymentMethod) {
      if (this.isPollingRequest) {
        return;
      }
      
      this.isPollingRequest = true;
      this.pollingCount++;
      
      try {
        const statusRes = await this.$api.post('/payment/check-status', {
          orderId,
          paymentMethod
        });
        
        if (statusRes.success && statusRes.data.status === 'paid') {
          this.clearPollingTimer();
          this.paySuccess = true;
          this.clearQrcodeTimers();
          if (this.$bus) {
            this.$bus.emit('cart-updated');
          }
          return;
        }
      } catch (error) {
        console.warn('Payment status check failed:', error);
      } finally {
        this.isPollingRequest = false;
      }
      
      // 继续下一次轮询
      this.scheduleNextPoll(orderId, paymentMethod);
    },
    clearPollingTimer() {
      if (this.pollingTimer) {
        clearTimeout(this.pollingTimer);
        this.pollingTimer = null;
      }
      this.polling = false;
      this.isPollingRequest = false;
      this.pollingCount = 0;
      this.pollingPhase = 1;
    },
    startQrcodeTimer() {
      this.qrcodeTimer = 300; // 5分钟倒计时
      this.qrcodeTimerInterval = setInterval(() => {
        this.qrcodeTimer--;
        if (this.qrcodeTimer <= 0) {
          this.clearQrcodeTimers();
          this.$messageHandler.showWarning(this.$t('payment.qrcodeExpired'), 'payment.warning.qrcodeExpired');
        }
      }, 1000);
    },
    startAlipayTimer() {
      this.alipayTimer = 300; // 5分钟倒计时
      this.alipayTimerInterval = setInterval(() => {
        this.alipayTimer--;
        if (this.alipayTimer <= 0) {
          this.clearAlipayTimers();
          this.$messageHandler.showWarning(this.$t('payment.formExpired'), 'payment.warning.formExpired');
        }
      }, 1000);
    },
    startAutoRefresh(paymentMethod) {
      this.autoRefreshTimer = setTimeout(() => {
        if (this.qrcodeUrl && !this.paySuccess) {
          this.refreshQrcode(paymentMethod);
        }
      }, 240000); // 4分钟后自动刷新
    },
    startAutoRefreshAlipay(paymentMethod) {
      this.autoRefreshTimer = setTimeout(() => {
        if (this.alipayFormData && !this.paySuccess) {
          this.refreshAlipayForm(paymentMethod);
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
    clearAlipayTimers() {
      if (this.alipayTimerInterval) {
        clearInterval(this.alipayTimerInterval);
        this.alipayTimerInterval = null;
      }
      if (this.autoRefreshTimer) {
        clearTimeout(this.autoRefreshTimer);
        this.autoRefreshTimer = null;
      }
      this.alipayTimer = 0;
    },
    clearTimers() {
      this.clearPollingTimer();
      this.clearQrcodeTimers();
      this.clearAlipayTimers();
    },
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },
    goToOrders() {
      navigateTo('/UserOrders');
    },
    goHome() {
      navigateTo('/');
    },
    hideAlipayText() {
      // 延迟执行，确保iframe完全加载
      setTimeout(() => {
        const iframe = this.$refs.alipayIframe;
        if (iframe && iframe.contentDocument) {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            // 创建样式来隐藏文本
            const style = iframeDoc.createElement('style');
            style.textContent = `
              /* 隐藏支付宝页面中的提示文字 */
              .alipay-qrcode-text,
              .qrcode-text,
              .pay-tip,
              .tip-text,
              [class*="tip"],
              [class*="text"],
              .pay-info,
              .scan-tip {
                display: none !important;
              }
              
              /* 隐藏包含特定文字的元素 */
              div:contains("使用手机支付宝扫码完成付款"),
              div:contains("扫码完成付款"),
              div:contains("手机支付宝"),
              span:contains("使用手机支付宝扫码完成付款"),
              span:contains("扫码完成付款"),
              span:contains("手机支付宝"),
              p:contains("使用手机支付宝扫码完成付款"),
              p:contains("扫码完成付款"),
              p:contains("手机支付宝") {
                display: none !important;
              }
            `;
            iframeDoc.head.appendChild(style);
            
            // 直接查找并隐藏包含特定文字的元素
            const allElements = iframeDoc.querySelectorAll('*');
            allElements.forEach(element => {
              if (element.textContent && (
                element.textContent.includes('使用手机支付宝扫码完成付款') ||
                element.textContent.includes('扫码完成付款') ||
                element.textContent.includes('手机支付宝')
              )) {
                element.style.display = 'none';
              }
            });
          } catch (error) {
            // 由于跨域限制，可能无法访问iframe内容
            console.log('无法访问iframe内容，可能由于跨域限制');
          }
        }
      }, 1000); // 延迟1秒执行
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
          this.inquiryId = createInquiryResponse.data.id;
           
          // 从订单数据中获取商品信息
          if (this.orderData && this.orderData.items && this.orderData.items.length > 0) {
            const items = this.orderData.items.map(item => ({
              productId: item.product_id,
              quantity: item.quantity
            }));
             
            await this.$api.postWithErrorHandler(`/inquiries/${this.inquiryId}/items/batch`, {
              items: items
            }, {
              fallbackKey: 'inquiry.error.addItemsFailed'
            });
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
    async loadInquiryData(inquiryId) {
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
    },
    closeInquiryDialog() {
      this.showInquiryDialog = false;
      this.currentInquiryData = null;
    },
    // 展开询价对话框
    expandInquiryDialog() {
      if (this.inquiryId) {
        // 跳转到询价单管理页面，并传递当前询价单ID
        navigateTo({
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
    // 处理确认收货
    async handleConfirmReceipt() {
      try {
        // 显示确认对话框
        await this.$messageHandler.confirm({
          message: this.$t('payment.confirmReceiptMessage') || 'Are you sure you want to confirm receipt of this order?',
          translationKey: 'payment.confirmReceiptMessage'
        });

        // 调用后端API更新订单状态为delivered
        const response = await this.$api.putWithErrorHandler(`/orders/${this.orderId}`, {
          status: 'delivered'
        }, {
          fallbackKey: 'payment.error.confirmReceiptFailed'
        });

        if (response.success) {
          // 更新本地订单状态
          this.orderData.order.status = 'delivered';
          this.orderData.order.delivered_at = new Date().toISOString();
          
          // 显示成功消息
          this.$messageHandler.showSuccess(
            this.$t('payment.confirmReceiptSuccess') || 'Order receipt confirmed successfully!',
            'payment.success.confirmReceipt'
          );
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('确认收货失败:', error);
          this.$messageHandler.showError(
            this.$t('payment.confirmReceiptError') || 'Failed to confirm receipt',
            'payment.error.confirmReceiptFailed'
          );
        }
      }
    },
    // 退款相关方法
    async handleRefundRequest() {
      // 设置上传参数
      this.uploadData = {
        orderId: this.orderData.order.id,
        status: 'refund'
      };
      
      // 设置完整的上传URL
      const apiBaseURL = this.$config.public.apiBase || 'http://localhost:3000/api';
      this.uploadUrl = `${apiBaseURL}/orders/status-data/upload-image`;
      
      // 设置认证头
      const token = getAuthToken();
      if (token) {
        this.uploadHeaders = {
          'Authorization': `Bearer ${token}`
        };
      }
      
      // 获取现有的退款状态数据
      await this.fetchRefundStatusData();
      
      this.showRefundDialog = true;
    },

    // 取消退款申请方法
    async handleCancelRefundRequest() {
      try {
        // 显示确认对话框
        await this.$messageHandler.confirm({
          message: this.$t('payment.cancelRefundConfirmMessage') || 'Are you sure you want to cancel the refund request?',
          translationKey: 'payment.cancelRefundConfirmMessage'
        });
        // 调用后端API更新订单状态为 refund_cancelled
        const response = await this.$api.putWithErrorHandler(`/orders/${this.orderData.order.id}`, {
          status: 'refund_cancelled'
        }, {
          fallbackKey: 'payment.error.cancelRefundFailed'
        });

        if (response.success) {
          // 更新本地订单状态
          this.orderData.order.status = 'refund_cancelled';
          
          // 显示成功消息
          this.$messageHandler.showSuccess(
            this.$t('payment.cancelRefundSuccess') || 'Refund request cancelled successfully!',
            'payment.success.cancelRefund'
          );
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('取消退款申请失败:', error);
          this.$messageHandler.showError(
            this.$t('payment.cancelRefundError') || 'Failed to cancel refund request',
            'payment.error.cancelRefundFailed'
          );
        }
      }
    },
    
    async fetchRefundStatusData() {
      try {
        const response = await this.$api.getWithErrorHandler(
          `/orders/${this.orderData.order.id}/status-data/refund`,
          {
            fallbackKey: 'refund.error.fetchDataFailed'
          }
        );
        
        if (response.success && response.data) {
          // 预填充退款原因
          if (response.data.comment) {
            this.refundForm.reason = response.data.comment;
          }
          
          // 预填充已上传的图片
          if (response.data.images && response.data.images.length > 0) {
            this.refundForm.images = response.data.images.map(imagePath => ({
              name: imagePath.split('/').pop() || 'image',
              url: imagePath,
              uid: Date.now() + Math.random()
            }));
          }
        }
      } catch (error) {
        console.error('获取退款状态数据失败:', error);
        // 不显示错误消息，因为可能是第一次申请退款，没有现有数据
      }
    },
    
    handleRefundDialogClose() {
      this.showRefundDialog = false;
      // 不清除表单数据，保持用户输入的内容
    },
    
    handleRefundDialogCancel() {
      this.resetRefundForm();
      this.handleRefundDialogClose();
    },
    
    resetRefundForm() {
      this.refundForm.reason = '';
      this.refundForm.images = [];
    },
    
    beforeUpload(file) {
      const isImage = file.type.startsWith('image/');
      const isLt5M = file.size / 1024 / 1024 < 5;
      
      if (!isImage) {
        this.$messageHandler.showError(this.$t('refund.onlyImageAllowed'), 'refund.error.onlyImageAllowed');
        return false;
      }
      if (!isLt5M) {
        this.$messageHandler.showError(this.$t('refund.imageSizeLimit'), 'refund.error.imageSizeLimit');
        return false;
      }
      return true;
    },
    
    handleUploadSuccess(response, file, fileList) {
      if (response.success) {
        this.refundForm.images = fileList;
        this.$messageHandler.showSuccess(this.$t('refund.uploadSuccess'), 'refund.success.upload');
      } else {
        this.$messageHandler.showError(response.message || this.$t('refund.uploadFailed'), 'refund.error.upload');
      }
    },
    
    handleUploadError(error, file, fileList) {
      console.error('图片上传失败:', error);
      this.$messageHandler.showError(this.$t('refund.uploadFailed'), 'refund.error.upload');
    },
    
    async submitRefundRequest() {
      if (!this.refundForm.reason.trim()) {
        this.$messageHandler.showError(this.$t('refund.reasonRequired'), 'refund.error.reasonRequired');
        return;
      }
      
      try {
        this.refundSubmitting = true;
        
        // 1. 首先保存退款状态数据
        const statusDataResponse = await this.$api.postWithErrorHandler('/orders/status-data', {
          orderId: this.orderData.order.id,
          status: 'refund_requested',
          comment: this.refundForm.reason,
          images: this.refundForm.images.map(img => img.response?.data?.url || img.url).filter(Boolean)
        });
        
        if (!statusDataResponse.success) {
          throw new Error('保存退款状态数据失败');
        }
        
        // 2. 然后更新订单状态为 refund_requested
        const updateOrderResponse = await this.$api.putWithErrorHandler(`/orders/${this.orderData.order.id}`, {
          status: 'refund_requested'
        });
        
        if (!updateOrderResponse.success) {
          throw new Error('更新订单状态失败');
        }
        
        this.$messageHandler.showSuccess(this.$t('refund.submitSuccess'), 'refund.success.submit');
        this.resetRefundForm();
        this.handleRefundDialogClose();
        
        // 刷新订单数据
        await this.fetchOrderDetail();
        
      } catch (error) {
        console.error('提交退款申请失败:', error);
        this.$messageHandler.showError(this.$t('refund.submitFailed'), 'refund.error.submit');
      } finally {
        this.refundSubmitting = false;
      }
    },
    
    // 退货物流相关方法
    async handleReturnLogistics() {
      // 设置上传参数
      this.returnLogisticsUploadData = {
        orderId: this.orderData.order.id,
        status: 'return_shipped'
      };
      
      // 设置完整的上传URL
      const apiBaseURL = this.$config.public.apiBase || 'http://localhost:3000/api';
      this.uploadUrl = `${apiBaseURL}/orders/status-data/upload-image`;
      
      // 设置认证头
      const token = getAuthToken();
      if (token) {
        this.uploadHeaders = {
          'Authorization': `Bearer ${token}`
        };
      }
      
      // 获取现有的退货物流状态数据
      await this.fetchReturnLogisticsStatusData();
      
      this.showReturnLogisticsDialog = true;
    },
    
    async fetchReturnLogisticsStatusData() {
      try {
        const response = await this.$api.getWithErrorHandler(
          `/orders/${this.orderData.order.id}/status-data/return_shipped`,
          {
            fallbackKey: 'returnLogistics.error.fetchDataFailed'
          }
        );
        
        if (response.success && response.data) {
          // 预填充退货物流信息
          if (response.data.comment) {
            this.returnLogisticsForm.logisticsInfo = response.data.comment;
          }
          
          // 预填充已上传的图片
          if (response.data.images && response.data.images.length > 0) {
            this.returnLogisticsForm.images = response.data.images.map(imagePath => ({
              name: imagePath.split('/').pop() || 'image',
              url: imagePath,
              uid: Date.now() + Math.random()
            }));
          }
        }
      } catch (error) {
        console.error('获取退货物流状态数据失败:', error);
        // 不显示错误消息，因为可能是第一次提交退货物流，没有现有数据
      }
    },
    
    handleReturnLogisticsDialogClose() {
      this.showReturnLogisticsDialog = false;
      // 不清除表单数据，保持用户输入的内容
    },
    
    handleReturnLogisticsDialogCancel() {
      this.resetReturnLogisticsForm();
      this.handleReturnLogisticsDialogClose();
    },
    
    resetReturnLogisticsForm() {
      this.returnLogisticsForm.logisticsInfo = '';
      this.returnLogisticsForm.images = [];
    },
    
    handleReturnLogisticsUploadSuccess(response, file, fileList) {
      if (response.success) {
        this.returnLogisticsForm.images = fileList;
        this.$messageHandler.showSuccess(this.$t('returnLogistics.uploadSuccess'), 'returnLogistics.success.upload');
      } else {
        this.$messageHandler.showError(response.message || this.$t('returnLogistics.uploadFailed'), 'returnLogistics.error.upload');
      }
    },
    
    handleReturnLogisticsUploadError(error, file, fileList) {
      console.error('退货物流图片上传失败:', error);
      this.$messageHandler.showError(this.$t('returnLogistics.uploadFailed'), 'returnLogistics.error.upload');
    },
    
    async submitReturnLogistics() {
      if (!this.returnLogisticsForm.logisticsInfo.trim()) {
        this.$messageHandler.showError(this.$t('returnLogistics.logisticsInfoRequired'), 'returnLogistics.error.logisticsInfoRequired');
        return;
      }
      
      try {
        this.returnLogisticsSubmitting = true;
        
        // 1. 首先保存退货物流状态数据
        const statusDataResponse = await this.$api.postWithErrorHandler('/orders/status-data', {
          orderId: this.orderData.order.id,
          status: 'return_shipped',
          comment: this.returnLogisticsForm.logisticsInfo,
          images: this.returnLogisticsForm.images.map(img => img.response?.data?.url || img.url).filter(Boolean)
        });
        
        if (!statusDataResponse.success) {
          throw new Error('保存退货物流状态数据失败');
        }
        
        // 2. 然后更新订单状态为 return_shipped
        const updateOrderResponse = await this.$api.putWithErrorHandler(`/orders/${this.orderData.order.id}`, {
          status: 'return_shipped'
        });
        
        if (!updateOrderResponse.success) {
          throw new Error('更新订单状态失败');
        }
        
        this.$messageHandler.showSuccess(this.$t('returnLogistics.submitSuccess'), 'returnLogistics.success.submit');
        this.resetReturnLogisticsForm();
        this.handleReturnLogisticsDialogClose();
        
        // 刷新订单数据
        await this.fetchOrderDetail();
        
      } catch (error) {
        console.error('提交退货物流失败:', error);
        this.$messageHandler.showError(this.$t('returnLogistics.submitFailed'), 'returnLogistics.error.submit');
      } finally {
        this.returnLogisticsSubmitting = false;
      }
    },
    
    // 处理新消息接收事件
    handleNewMessages(newMessages) {
      // 可以在这里处理新消息接收逻辑
      console.log('handleNewMessages:', newMessages);
    },
    async handleMobileAlipayPayment() {
      try {
        this.generating = true;
        
        // 调用后端接口获取支付宝HTML表单
        const response = await this.$api.postWithErrorHandler('/payment/qrcode', {
          orderId: this.orderId,
          paymentMethod: 'alipay',
          deviceType: 'mobile',
          exchangeRate: this.exchangeRate
        });
        
        if (response.success && response.data.paymentForm) {
          // 直接在当前页面处理表单提交，不跳转到AlipayPayment.vue
          this.submitAlipayForm(response.data.paymentForm);
          
          // 开始轮询支付状态
          this.startPaymentStatusPolling(this.orderId, 'alipay');
        } else {
          this.$messageHandler.showError(this.$t('payment.error.formGenerateFailedWithMessage', { message: response.message }), 'payment.error.formGenerateFailed');
        }
      } catch (error) {
        console.error('Error generating mobile Alipay payment:', error);
        this.$messageHandler.showError(this.$t('payment.formGenerateFailed'), 'payment.error.formGenerateFailed');
      } finally {
        this.generating = false;
      }
    },
    submitAlipayForm(paymentFormData) {
      try {
        // 创建临时div来解析HTML表单
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = paymentFormData;
        
        // 查找表单元素
        const form = tempDiv.querySelector('form');
        if (form) {
          // 将表单添加到页面
          document.body.appendChild(form);
          
          // 设置编码格式，保持与支付宝一致
          form.acceptCharset = 'UTF-8';
          
          console.log('OrderPayment - 准备提交支付宝表单');
          
          // 提交表单
          form.submit();
        } else {
          console.error('OrderPayment - 未找到支付宝表单');
          this.$messageHandler.showError(this.$t('payment.error.formFormatError'), 'payment.error.formFormatError');
        }
      } catch (error) {
        console.error('OrderPayment - 提交表单失败:', error);
        this.$messageHandler.showError(this.$t('payment.error.formSubmitFailed'), 'payment.error.formSubmitFailed');
      }
    },
    handleBackClick() {
      // 带上orderId跳转到UnifiedCheckout页面
      if (this.orderData && this.orderData.order && this.orderData.order.id) {
        navigateTo({
          name: 'UnifiedCheckout',
          query: { orderId: this.orderData.order.id }
        });
      } else {
        // 如果没有orderId，直接返回上一页
        this.$router.go(-1);
      }
    },
    async fetchExchangeRate() {
      try {
        this.exchangeRateLoading = true;
        const response = await this.$api.get('/payment/exchange-rate');
        
        if (response.success && response.data) {
          this.exchangeRate = parseFloat(response.data.rate);
          this.alipayDisabled = false;
        } else {
          console.warn('Failed to fetch exchange rate:', response.message);
          this.exchangeRate = null;
          this.alipayDisabled = true;
          //this.$messageHandler.showWarning(
           // this.$t('payment.exchangeRateUnavailable') || 'Exchange rate unavailable, Alipay payment temporarily disabled',
           // 'payment.warning.exchangeRateUnavailable'
          //);
        }
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
        this.exchangeRate = null;
        this.alipayDisabled = true;
        //this.$messageHandler.showWarning(
        //  this.$t('payment.exchangeRateUnavailable') || 'Exchange rate unavailable, Alipay payment temporarily disabled',
        //  'payment.warning.exchangeRateUnavailable'
       // );
      } finally {
        this.exchangeRateLoading = false;
      }
    },
    formatDateWithTimezone(dateStr, timezone) {
      if (!dateStr) return 'N/A';
      try {
        const date = new Date(dateStr);
        const formattedDate = date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        return timezone ? `${formattedDate} (${timezone})` : formattedDate;
      } catch (error) {
        console.error('Error formatting date:', error);
        return dateStr;
      }
    },
    getOrderStatusText(status) {
      const statusKey = getOrderStatusKey(status);

      return this.$t(statusKey) || status;
    },

    getOrderStatusClass(status) {
      return getOrderStatusClass(status);
    },


  }
};
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.order-payment {
  min-height: 100vh;
  background-color: $background-light;
  padding: 0;
}



.order-info-section,
.products-section,
.shipping-section,
.payment-section {
  @include card;
  margin-bottom: $spacing-lg;

  h2,
  h3 {
    margin: 0 0 $spacing-lg 0;
    color: $text-primary;
    font-size: $font-size-xl;
    font-weight: $font-weight-semibold;
    padding-bottom: $spacing-md;
  }
}



.section-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin: 0 0 $spacing-lg 0;
  padding-bottom: $spacing-md;
  border-bottom: 2px solid $primary-color;
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  .el-icon {
    color: $primary-color;
  }

  /* 当有多个子元素时，使用space-between布局 */
  &:has(.action-buttons),
  &:has(.inquiry-btn),
  &:has(.back-btn) {
    justify-content: space-between;
  }
}

.title-content {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}


.section-title .inquiry-btn :deep(span) {
  color: $white !important;
}

.section-title .confirm-receipt-btn :deep(span) {
  color: $white !important;
}

// 通用按钮样式 - 确保五个按钮有一致的字体、风格和大小
.confirm-receipt-btn,
.refund-btn,
.cancel-refund-btn,
.return-logistics-btn,
.inquiry-btn {
  min-width: 120px;
  height: 40px;
  font-size: $font-size-md;
  font-weight: $font-weight-semibold;
  border-radius: $border-radius-md;
  color: $white;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
  }
}

// 确认收货按钮 - 绿色背景
.confirm-receipt-btn {
  background: #67c23a;
  border: 2px solid #67c23a;
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.3);

  &:hover {
    background: #5daf34;
    border-color: #5daf34;
    box-shadow: 0 4px 12px rgba(103, 194, 58, 0.4);
  }
}

// 申请退货按钮 - 淡蓝色背景
.refund-btn {
  background: #60a5fa !important;
  border: 2px solid #60a5fa !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(96, 165, 250, 0.3);

  &:hover {
    background: #3b82f6 !important;
    border-color: #3b82f6 !important;
    color: #ffffff !important;
    box-shadow: 0 4px 12px rgba(96, 165, 250, 0.4);
  }

  // 确保内部文字为白色
  :deep(span),
  :deep(.el-button__text) {
    color: #ffffff !important;
  }
}

// 取消退款申请按钮 - 橙色背景
.cancel-refund-btn {
  background: #f59e0b !important;
  border: 2px solid #f59e0b !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);

  &:hover {
    background: #d97706 !important;
    border-color: #d97706 !important;
    color: #ffffff !important;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
  }

  // 确保内部文字为白色
  :deep(span),
  :deep(.el-button__text) {
    color: #ffffff !important;
  }
}

// 退货物流按钮 - 绿色背景
.return-logistics-btn {
  background: #67c23a !important;
  border: 2px solid #67c23a !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.3);

  &:hover {
    background: #5daf34 !important;
    border-color: #5daf34 !important;
    color: #ffffff !important;
    box-shadow: 0 4px 12px rgba(103, 194, 58, 0.4);
  }

  // 确保内部文字为白色
  :deep(span),
  :deep(.el-button__text) {
    color: #ffffff !important;
  }
}

// 询问按钮 - 使用主色调
.inquiry-btn {
  background: $primary-color !important;
  border: 2px solid $primary-color !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);

  &:hover {
    background: $primary-color !important;
    border-color: $primary-color !important;
    color: #ffffff !important;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  }

  // 确保内部文字为白色
  :deep(span),
  :deep(.el-button__text) {
    color: #ffffff !important;
  }

  @include mobile {
    min-width: auto;
    width: 40px;
    height: 40px;
    padding: 0 !important;

    :deep(span),
    :deep(.el-button__text) {
      display: none !important;
    }

    :deep(.el-icon) {
      display: none !important;
    }

    &::before {
      font-size: 18px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }

    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
}


// 移动端特定样式
.confirm-receipt-btn {
  @include mobile {
    background: transparent !important;
    border: 1px solid #67c23a !important;
    color: #67c23a !important;

    &::before {
      content: "✓";
      color: #67c23a;
    }

    &:hover {
      background: rgba(103, 194, 58, 0.1) !important;
      border-color: #67c23a !important;
    }
  }
}

.refund-btn {
  @include mobile {
    background: transparent !important;
    border: 1px solid #60a5fa !important;
    color: #60a5fa !important;

    &::before {
      content: "↩";
      color: #60a5fa;
    }

    &:hover {
      background: rgba(96, 165, 250, 0.1) !important;
      border-color: #60a5fa !important;
    }
  }
}

.cancel-refund-btn {
  @include mobile {
    background: transparent !important;
    border: 1px solid #f59e0b !important;
    color: #f59e0b !important;

    &::before {
      content: "✕";
      color: #f59e0b;
    }

    &:hover {
      background: rgba(245, 158, 11, 0.1) !important;
      border-color: #f59e0b !important;
    }
  }
}

.inquiry-btn {
  @include mobile {
    background: transparent !important;
    border: 1px solid var(--el-color-primary) !important;
    color: var(--el-color-primary) !important;

    &::before {
      content: "?";
      color: var(--el-color-primary);
    }

    &:hover {
      background: rgba(64, 158, 255, 0.1) !important;
      border-color: var(--el-color-primary) !important;
    }
  }
}

.back-btn {
  min-width: 120px;
  height: 40px;
  font-size: $font-size-md;
  font-weight: $font-weight-semibold;
  border-radius: $border-radius-md;
  background: $white;
  border: 2px solid $gray-400;
  color: $text-primary;
  box-shadow: 0 2px 8px rgba($gray-400, 0.2);
  transition: all 0.3s ease;

  &:hover {
    background: $gray-100;
    border-color: $gray-500;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba($gray-400, 0.3);
  }

  @include mobile {
    align-self: flex-end;
    min-width: 100px;
    height: 36px;
    font-size: $font-size-sm;
  }
}

.order-summary {
  @include flex-start;
  gap: $spacing-4xl;
  flex-wrap: wrap;

  @include mobile {
    flex-direction: column;
    gap: $spacing-md;
  }
}

.order-id,
.order-amount {
  @include flex-start;
  gap: $spacing-sm;
}

.label {
  font-weight: $font-weight-medium;
  color: $text-secondary;
}

.value {
  font-weight: $font-weight-semibold;
  color: $text-primary;
}

.order-amount .value {
  color: $primary-color;
  font-size: $font-size-xl;
}

/* 桌面端和手机端显示控制 */
.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
}

/* 产品表格样式 */
.order-table {
  margin-bottom: $spacing-lg;
  border-radius: $border-radius-md;
  overflow: hidden;
  box-shadow: $shadow-sm;
}

.product-info {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.product-image {
  width: 60px;
  height: 60px;
  border-radius: $border-radius-sm;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.product-details {
  flex: 1;
}

.product-name {
  font-size: $font-size-md;
  font-weight: $font-weight-semibold;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.product-code {
  font-size: $font-size-xs;
  color: $text-secondary;
}

.subtotal-price {
  font-size: $font-size-md;
  font-weight: $font-weight-semibold;

}

/* 订单总计样式 */
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

.product-details {
  @include flex-column;
  align-items: flex-end;
  gap: $spacing-xs;

  @include mobile {
    align-items: flex-start;
  }
}

.quantity {
  font-size: $font-size-sm;
  color: $text-secondary;
}

.price {
  font-weight: $font-weight-semibold;
  color: $primary-color;
  font-size: $font-size-lg;
}

/* 收货地址样式 */
.shipping-info {

  padding: $spacing-lg;
  border-radius: $border-radius-md;
  border: 1px solid $border-color;
}

/* 物流信息样式 */
.logistics-info {
  padding: $spacing-lg;
  border-radius: $border-radius-md;
  border: 1px solid $border-color;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);

  .info-item {
    background: $white;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .info-label {
      color: $text-secondary;
      font-weight: $font-weight-semibold;
    }

    .info-value {
      color: $text-primary;
      font-weight: $font-weight-medium;
    }
  }
}

.info-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: $spacing-lg;
  margin-bottom: $spacing-lg;

  &:last-child {
    margin-bottom: 0;
  }

  &.full-width {
    grid-template-columns: 1fr;
  }

  @include mobile {
    grid-template-columns: 1fr;
    gap: $spacing-md;
  }
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  padding: $spacing-md;
  background: $background-light;
  border-radius: $border-radius-sm;
  border: 1px solid $border-color;

  &.full-width {
    grid-column: 1 / -1;
  }
}

.info-label {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: $font-size-md;
  font-weight: $font-weight-semibold;
  color: $text-primary;
  word-break: break-word;
  line-height: $line-height-normal;
}

.payment-methods {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: $spacing-2xl;

  @include mobile {
    grid-template-columns: 1fr;
  }
}

.payment-method {
  border: 1px solid $border-color;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  background: $background-secondary;
  padding-top: $spacing-2md;

  h4 {
    margin: 0 0 $spacing-md 0;
    color: $text-primary;
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
  }

  .cny-amount {
    color: #e74c3c !important;
    font-weight: 600;
    font-size: 0.9em;
  }
}

.qrcode-container {
  margin-top: $spacing-lg;
  text-align: center;
}

.qrcode-image {
  max-width: 200px;
  border: 1px solid $border-color;
  border-radius: $border-radius-lg;
  margin-bottom: $spacing-md;
}

.qrcode-info p {
  margin: 0 0 $spacing-sm 0;
  color: $text-secondary;
  font-size: $font-size-sm;
}

.timer {
  color: $error-color;
  font-weight: $font-weight-medium;
  margin-bottom: $spacing-sm;
}

.refresh-button {
  @include button-base;
  background: $success-color;
  color: $white;
  padding: $spacing-xs $spacing-md;
  font-size: $font-size-xs;
  gap: $spacing-xs;
  margin: 0 auto;

  &:hover:not(:disabled) {
    background: $success-dark;
  }

  &:disabled {
    background: $gray-400;
    cursor: not-allowed;
  }
}

.alipay-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;

  h4 {
    margin: 0;
  }

  .refresh-button-header {
    @include button-base;
    background: $success-color;
    color: $white;
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-xs;
    border-radius: $border-radius-sm;
    min-width: auto;
    width: auto;
    height: 32px;

    &:hover:not(:disabled) {
      background: $success-dark;
    }

    &:disabled {
      background: $gray-400;
      cursor: not-allowed;
    }

    i {
      font-size: 14px;
    }
  }
}

.alipay-iframe-container {
  margin-top: $spacing-md;
  text-align: center;

  .iframe-wrapper {
    width: 160px;
    height: 160px; // 支付宝简约前置模式要求最小尺寸600x300px
    border: 1px solid $border-color;
    border-radius: $border-radius-md;
    margin: 0 auto; // 居中显示
    overflow: hidden;

    .alipay-iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }
  }
}

// 隐藏支付宝iframe中的提示文字
.alipay-iframe-container {
  :deep(iframe) {
    // 由于跨域限制，无法直接修改iframe内容的样式
    // 但可以尝试通过JavaScript在iframe加载后处理
  }
}

.payment-success {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  @include flex-center;
  z-index: $z-index-mobile-nav;
}

.success-content {
  @include card;
  text-align: center;
  max-width: 400px;
  width: 90%;
  padding: $spacing-4xl;

  i {
    font-size: 4rem;
    color: $success-color;
    margin-bottom: $spacing-lg;
  }

  h2 {
    margin: 0 0 $spacing-md 0;
    color: $text-primary;
    font-size: $font-size-2xl;
  }

  p {
    margin: 0 0 $spacing-2xl 0;
    color: $text-secondary;
    line-height: $line-height-normal;
  }
}

.success-actions {
  @include flex-center;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.btn-primary {
  @include button-primary;
  padding: $spacing-md $spacing-xl;
  font-size: $font-size-lg;
  min-height: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  flex: 1;
  min-width: 120px;
}

.btn-secondary {
  @include button-secondary;
  padding: $spacing-md $spacing-xl;
  font-size: $font-size-lg;
  min-height: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  flex: 1;
  min-width: 120px;
}

.loading {
  @include flex-center;
  gap: $spacing-sm;
  padding: $spacing-4xl;
  color: $text-secondary;

  i {
    font-size: $font-size-xl;
  }
}

.container {
  @include container;
}

/* Inquiry 浮动窗口样式 - 与UnifiedCheckout.vue保持一致 */
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

  @include mobile {
    bottom: 10px;
    right: 10px;
    left: 10px;
    width: auto;
    height: 70vh;
    max-height: 620px;
  }
}

.inquiry-overlay {
  display: none;
}

.inquiry-content {
  position: relative;
  width: 100%;
  height: 100%;
  background: $white;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.inquiry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg;
  border-bottom: 1px solid $border-color;
  background: $background-light;

  h3 {
    margin: 0;
    color: $text-primary;
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
  }
}

.inquiry-actions {
  display: flex;
  gap: $spacing-sm;
}

.expand-btn,
.close-btn {
  padding: $spacing-xs;
  color: $text-secondary;

  &:hover {
    color: $primary-color;
  }
}

@include mobile {
  .container {
    padding: 0 $spacing-md;
  }

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

  .order-info-section,
  .products-section,
  .shipping-section,
  .payment-section {
    padding: $spacing-md;
    margin-bottom: $spacing-md;
  }

  .order-summary {
    flex-direction: column;
    gap: $spacing-md;
  }

  .order-id,
  .order-amount {
    display: grid;
    grid-template-columns: 120px 1fr;
    gap: $spacing-xs;
    align-items: center;
  }

  /* 手机端隐藏back按钮 */
  .section-title .back-btn {
    display: none;
  }

  /* 手机端inquiry按钮调整已在主样式中定义 */

  .section-title {
    font-size: 18px;
    justify-content: flex-start;
    gap: 12px;

    .title-content {
      width: 100%;
    }
  }

  /* 手机端隐藏桌面端表格，显示卡片 */
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: block;
  }

  /* 手机端产品卡片样式已移至通用组件ProductCards.vue */

  /* 支付宝标题样式 */
  .alipay-header {
    h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;



      .disabled-notice {
        color: #999;
        font-weight: normal;
        font-size: 0.8em;
        font-style: italic;
      }
    }
  }

  /* 支付宝不可用提示 */
  .alipay-disabled-notice {
    padding: 16px;
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 8px;
    text-align: center;

    p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
  }

  /* 手机端支付宝按钮样式 */
  .alipay-mobile-container {
    width: 100%;

    .alipay-mobile-btn {
      width: 100%;
      min-height: 48px;
      font-size: 16px;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      font-weight: 600;
    }
  }

  /* 已支付状态样式 */
  .paid-status {
    text-align: center;
    padding: $spacing-2xl;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 2px solid #0ea5e9;
    border-radius: $border-radius-lg;
    margin: $spacing-lg 0;

    .paid-icon {
      font-size: 48px;
      color: #0ea5e9;
      margin-bottom: $spacing-md;
    }

    .paid-title {
      font-size: $font-size-2xl;
      font-weight: $font-weight-bold;
      color: #0ea5e9;
      margin-bottom: $spacing-sm;
    }

    .paid-subtitle {
      font-size: $font-size-md;
      color: $text-secondary;
      margin-bottom: $spacing-lg;
    }

    .payment-details {
      background: $white;
      border-radius: $border-radius-md;
      padding: $spacing-lg;
      border: 1px solid #e0f2fe;
      box-shadow: 0 2px 8px rgba(14, 165, 233, 0.1);

      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: $spacing-sm 0;
        border-bottom: 1px solid #f1f5f9;

        &:last-child {
          border-bottom: none;
        }

        .detail-label {
          font-weight: $font-weight-medium;
          color: $text-secondary;
        }

        .detail-value {
          font-weight: $font-weight-semibold;
          color: $text-primary;
        }
      }
    }

    @include mobile {
      padding: $spacing-lg;

      .paid-icon {
        font-size: 36px;
      }

      .paid-title {
        font-size: $font-size-xl;
      }
    }
  }
}

/* 物流信息部分样式 */
.logistics-section {
  @include card;
  margin-bottom: $spacing-lg;

  .section-title {
    .el-icon {
      font-size: 20px;
      color: $primary-color;
    }
  }
}

/* 退款对话框样式 */
.refund-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    overflow: hidden;
  }

  :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
    color: white;
    padding: 24px 32px;
    margin: 0;
    border-bottom: none;

    .el-dialog__title {
      font-size: 20px;
      font-weight: 600;
      color: white;
    }

    .el-dialog__headerbtn {
      top: 24px;
      right: 32px;

      .el-dialog__close {
        color: white;
        font-size: 20px;

        &:hover {
          color: rgba(255, 255, 255, 0.8);
        }
      }
    }
  }

  :deep(.el-dialog__body) {
    padding: 20px 32px;
    background: #ffffff;
  }

  :deep(.el-dialog__footer) {
    padding: 24px 32px;
    background: #f8f9fa;
    border-top: 1px solid #e9ecef;

    .el-button {
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 500;

      &.el-button--primary {
        background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
        border: none;

        &:hover {
          background: linear-gradient(135deg, #fc8181 0%, #9c1c1c 100%);
        }
      }
    }
  }
}

.refund-dialog-content {
  .order-summary {
    margin-bottom: 20px;
    padding: 16px;
    background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    position: relative;
    overflow: hidden;
    display: block !important;
    flex-direction: unset !important;
    gap: unset !important;
    flex-wrap: unset !important;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
    }

    h4 {
      margin: 0 0 12px 0 !important;
      color: #2d3748;
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;

      &::before {
        content: '📋';
        font-size: 14px;
      }
    }

    .order-details {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      grid-template-rows: auto auto !important;
      gap: 8px !important;
      align-items: start;
      flex-direction: unset !important;

      p {
        margin: 0 !important;
        padding: 8px 12px !important;
        background: white;
        border-radius: 6px;
        color: #4a5568;
        font-size: 13px;
        border: 1px solid #e2e8f0;
        transition: all 0.2s ease;
        display: flex !important;
        align-items: center;
        min-height: 36px;
        grid-template-columns: unset !important;

        &:hover {
          border-color: #e53e3e;
          box-shadow: 0 2px 8px rgba(229, 62, 62, 0.1);
        }

        strong {
          color: #2d3748;
          margin-right: 6px;
          font-weight: 600;
          flex-shrink: 0;
        }
      }
    }
  }

  .refund-reason {
    margin-bottom: 20px;

    h4 {
      margin: 0 0 16px 0;
      color: #2c3e50;
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;

      &::before {
        content: '💭';
        font-size: 16px;
      }
    }

    :deep(.el-textarea) {
      .el-textarea__inner {
        border-radius: 12px;
        border: 2px solid #e9ecef;
        padding: 16px;
        font-size: 14px;
        line-height: 1.6;
        transition: all 0.3s ease;

        &:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
      }
    }
  }

  .refund-images {
    h4 {
      margin: 0 0 16px 0;
      color: #2c3e50;
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;

      &::before {
        content: '📷';
        font-size: 16px;
      }
    }

    :deep(.el-upload) {
      .el-upload-dragger {
        border: 2px dashed #d1d5db;
        border-radius: 12px;
        background: #f9fafb;
        transition: all 0.3s ease;

        &:hover {
          border-color: #667eea;
          background: #f0f4ff;
        }

        .el-icon {
          font-size: 32px;
          color: #9ca3af;
          margin-bottom: 8px;
        }
      }

      .el-upload-list {
        .el-upload-list__item {
          border-radius: 8px;
          border: 1px solid #e9ecef;
          transition: all 0.2s ease;

          &:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
        }
      }
    }

    .upload-tip {
      margin-top: 12px;
      color: #6b7280;
      font-size: 13px;
      text-align: center;
      padding: 8px 16px;
      background: #f3f4f6;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
  }
}
</style>