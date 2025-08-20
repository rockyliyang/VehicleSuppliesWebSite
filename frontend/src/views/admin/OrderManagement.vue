<template>
  <div class="order-management">
    <div class="page-header">
      <h1>{{ $t('order.management.title', 'Order Management') }}</h1>
      <p v-if="!isAdmin" class="page-description">{{ $t("order.management.description.user", "View and manage your orders") }}</p>
      <p v-else class="page-description">{{ $t("order.management.description.admin", "Manage all orders and logistics")
        }}</p>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :model="filters" inline>
        <el-form-item :label="$t('order.filter.status', 'Status') || '状态'">
          <el-select v-model="filters.status" :placeholder="$t('order.filter.allStatus', 'All Status') || '选择状态'"
            clearable style="width: 150px;">
            <el-option value="pending" :label="$t('order.status.pending', 'Pending') || '待处理'" />
            <el-option value="confirmed" :label="$t('order.status.confirmed', 'Confirmed') || '已确认'" />
            <el-option value="shipped" :label="$t('order.status.shipped', 'Shipped') || '已发货'" />
            <el-option value="delivered" :label="$t('order.status.delivered', 'Delivered') || '已送达'" />
            <el-option value="cancelled" :label="$t('order.status.cancelled', 'Cancelled') || '已取消'" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="isAdmin" :label="$t('order.filter.user', 'User') || '用户'">
          <el-select v-model="filters.userId" :placeholder="$t('order.filter.userPlaceholder', 'Select user') || '选择用户'"
            clearable filterable remote :remote-method="handleUserSearch" :loading="userSearchLoading"
            style="width: 200px;">
            <el-option v-for="user in userOptions" :key="user.id" :label="`${user.username} (${user.email})`"
              :value="user.id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('order.filter.dateRange', 'Date Range') || '日期范围'">
          <el-date-picker v-model="dateRange" type="daterange" :range-separator="$t('order.filter.to', 'to') || '至'"
            :start-placeholder="$t('order.filter.startDate', 'Start Date') || '开始日期'"
            :end-placeholder="$t('order.filter.endDate', 'End Date') || '结束日期'" format="YYYY-MM-DD"
            value-format="YYYY-MM-DD" @change="handleDateRangeChange" />
        </el-form-item>

        <el-form-item>
          <el-button @click="resetFilters">{{ $t('common.reset') || '重置' }}</el-button>
          <el-button type="success" @click="refreshData" :loading="refreshing">
            <el-icon>
              <Refresh />
            </el-icon>
            {{ $t('common.refresh') || '刷新' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 订单列表 -->
    <el-card class="order-list-card">
      <el-table v-loading="loading" :data="orders" stripe :table-layout="'auto'" class="order-table">
        <el-table-column :label="$t('order.table.actions', 'Actions') || '操作'" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewOrderDetail(row)">{{ $t('order.action.view', 'View')
              || '查看' }}</el-button>
            <el-button v-if="isAdmin" type="success" size="small" @click="manageLogistics(row)">{{ 
              $t('order.action.logistics', 'Logistics') || '物流' }}</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="id" :label="$t('order.table.orderId', 'Order ID') || '订单号'" width="140" show-overflow-tooltip />
        <el-table-column :label="$t('order.table.customer', 'Customer') || '客户'" min-width="180">
          <template #default="{ row }">
            <div>
              <div class="customer-name">{{ row.username }}</div>
              <div class="customer-email">{{ row.email }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('order.table.totalAmount', 'Total Amount') || '总金额'" width="140" align="right">
          <template #default="{ row }">
            <span class="amount-text">${{ row.total_amount }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('order.table.status', 'Status') || '状态'" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ formatStatus(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" :label="$t('order.table.orderDate', 'Order Date') || '订单日期'" width="200">
          <template #default="{ row }">
            <span class="date-text">{{ formatDate(row.created_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('order.table.logisticsStatus', 'Logistics Status') || '物流状态'" width="140" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.shipping_status" :type="getLogisticsStatusType(row.shipping_status)" size="small">{{ 
              formatLogisticsStatus(row.shipping_status) }}</el-tag>
            <span v-else class="no-logistics">{{ $t('order.logistics.noLogistics', 'No Logistics') || '无物流' }}</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
          :total="totalOrders" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </el-card>



    <!-- 订单详情模态框 -->
    <div v-if="showOrderDetail" class="modal-overlay" @click="closeOrderDetail">
      <div class="modal-content order-detail-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-title">
            <h3>{{ $t('order.detail.title', 'Order Detail') }}</h3>
            <span class="order-id">#{{ selectedOrder.id }}</span>
          </div>
          <button @click="closeOrderDetail" class="close-btn">&times;</button>
        </div>

        <div class="modal-body">
          <div class="order-detail-grid">
            <!-- 订单基本信息卡片 -->
            <div class="detail-card order-info-card">
              <div class="card-header">
                <h4>{{ $t('order.detail.orderInfo', 'Order Information') }}</h4>
              </div>
              <div class="card-content">
                <div class="info-grid-five-column">
                  <div class="info-row">
                    <span class="info-label">{{ $t('order.detail.orderStatus', 'Order Status') }}</span>
                    <span :class="'status-badge status-' + selectedOrder.status">
                      {{ formatStatus(selectedOrder.status) }}
                    </span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">{{ $t('order.detail.orderDate', 'Order Date') }}</span>
                    <span class="info-value">{{ formatDate(selectedOrder.created_at) }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">{{ $t('order.detail.orderTotal', 'Order Total') }}</span>
                    <span class="info-value order-amount">${{ selectedOrder.total_amount }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">{{ $t('order.detail.zipCode', 'Zip Code') }}</span>
                    <span class="info-value">{{ selectedOrder.shipping_zip_code || '-' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">{{ $t('order.detail.paymentMethod', 'Payment Method') }}</span>
                    <span class="info-value">{{ selectedOrder.payment_method || '-' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">{{ $t('order.detail.paymentId', 'Payment ID') }}</span>
                    <span class="info-value">{{ selectedOrder.payment_id || '-' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">{{ $t('order.detail.shippingName', 'Shipping Name') }}</span>
                    <span class="info-value">{{ selectedOrder.shipping_name || '-' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">{{ $t('order.detail.shippingPhone', 'Shipping Phone') }}</span>
                    <span class="info-value">{{ selectedOrder.shipping_phone || '-' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">{{ $t('order.detail.shippingEmail', 'Shipping Email') }}</span>
                    <span class="info-value">{{ selectedOrder.shipping_email || '-' }}</span>
                  </div>
                  <div class="info-row full-width">
                    <span class="info-label">{{ $t('order.detail.address', 'Address') }}</span>
                    <span class="info-value">{{ selectedOrder.shipping_address || '-' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 物流信息卡片 -->
            <div class="detail-card logistics-info-card"
              v-if="selectedOrder.logistics_company_name || selectedOrder.shipping_no">
              <div class="card-header">
                <h4>{{ $t('order.detail.logisticsInfo', 'Logistics Information') }}</h4>
              </div>
              <div class="card-content">
                <div class="info-grid-two-column">
                  <div class="info-row" v-if="selectedOrder.logistics_company_name">
                    <span class="info-label">{{ $t('order.logistics.company', 'Company') }}</span>
                    <span class="info-value">{{ selectedOrder.logistics_company_name }}</span>
                  </div>
                  <div class="info-row" v-if="selectedOrder.shipping_status">
                    <span class="info-label">{{ $t('order.logistics.status', 'Status') }}</span>
                    <span :class="'status-badge logistics-' + selectedOrder.shipping_status">
                      {{ formatLogisticsStatus(selectedOrder.shipping_status) }}
                    </span>
                  </div>
                  <div class="info-row full-width" v-if="selectedOrder.shipping_no">
                    <span class="info-label">{{ $t('order.logistics.trackingNumber', 'Tracking Number') }}</span>
                    <span class="info-value tracking-number">{{ selectedOrder.shipping_no }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 订单商品 -->
          <div class="detail-card items-card">
            <div class="card-header">
              <h4>{{ $t('order.detail.orderItems', 'Order Items') }}</h4>
            </div>
            <div class="card-content">
              <div class="items-table-container">
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>{{ $t('order.detail.product', 'Product') }}</th>
                      <th>{{ $t('order.detail.quantity', 'Quantity') }}</th>
                      <th>{{ $t('order.detail.unitPrice', 'Unit Price') }}</th>
                      <th>{{ $t('order.detail.total', 'Total') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in selectedOrder.items" :key="item.product_id">
                      <td class="product-name">{{ item.product_name }}</td>
                      <td class="quantity">{{ item.quantity }}</td>
                      <td class="price">${{ item.price }}</td>
                      <td class="total">${{ (item.quantity * item.price).toFixed(2) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="order-total">
                <!-- 统计信息一行显示 -->
                <div class="total-summary-row">
                  <div class="total-item">
                    <span class="total-label">{{ $t('order.detail.subtotal', 'Subtotal') || '商品小计' }}</span>
                    <span class="total-amount">${{ calculateSubtotal(selectedOrder.items) }}</span>
                  </div>
                  <div class="total-item">
                    <span class="total-label">{{ $t('order.detail.shippingFee', 'Shipping Fee') || '运费' }}</span>
                    <span v-if="!isAdmin || !editingPrice" class="total-amount">${{ selectedOrder.shipping_fee || '0.00' }}</span>
                    <div v-else class="price-edit-container">
                      <input 
                        type="number" 
                        v-model.number="editableShippingFee" 
                        step="0.01" 
                        min="0" 
                        class="price-input"
                        @blur="updateShippingFee"
                        @keyup.enter="updateShippingFee"
                      />
                    </div>
                  </div>
                  <div class="total-item final-total">
                    <span class="total-label">{{ $t('order.detail.orderTotal', 'Order Total') }}</span>
                    <span v-if="!isAdmin || !editingPrice" class="total-amount">${{ selectedOrder.total_amount }}</span>
                    <div v-else class="price-edit-container">
                      <input 
                        type="number" 
                        v-model.number="editableTotalAmount" 
                        step="0.01" 
                        min="0" 
                        class="price-input"
                        @blur="updateTotalAmount"
                        @keyup.enter="updateTotalAmount"
                      />
                    </div>
                  </div>
                </div>
                <!-- 管理员价格编辑按钮 -->
                <div v-if="isAdmin" class="price-edit-actions">
                  <el-button v-if="!editingPrice" type="primary" size="large" @click="startEditingPrice">
                    {{ $t('order.action.editPrice', 'Edit Price') || '修改价格' }}
                  </el-button>
                  <div v-else class="edit-buttons">
                    <el-button type="success" size="small" @click="savePriceChanges">
                      {{ $t('common.save', 'Save') || '保存' }}
                    </el-button>
                    <el-button size="small" @click="cancelPriceEdit">
                      {{ $t('common.cancel', 'Cancel') || '取消' }}
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 物流管理模态框 -->
    <div v-if="showLogisticsModal" class="modal-overlay" @click="closeLogisticsModal">
      <div class="modal-content logistics-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-title">
            <h3>{{ $t('order.logistics.manageTitle', 'Manage Logistics') }}</h3>
            <span class="order-id" v-if="selectedOrder">#{{ selectedOrder.id }}</span>
          </div>
          <button @click="closeLogisticsModal" class="close-btn">&times;</button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="updateLogistics" class="logistics-form">
            <!-- 物流基本信息 -->
            <div class="form-section">
              <h4 class="section-title">{{ $t('order.logistics.basicInfo', 'Basic Information') }}</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label for="logistics-company" class="form-label">{{ $t('order.logistics.company', 'LogisticsCompany')
                    }}</label>
                  <select id="logistics-company" v-model="logisticsForm.logistics_company_id" required
                    class="form-control">
                    <option value="">{{ $t('order.logistics.selectCompany', 'Select a logistics company') }}</option>
                    <option v-for="company in logisticsCompanies" :key="company.id" :value="company.id">
                      {{ company.name }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="tracking-number" class="form-label">{{ $t('order.logistics.trackingNumber',
                    'TrackingNumber')
                    }}</label>
                  <input id="tracking-number" type="text" v-model="logisticsForm.shipping_no" class="form-control"
                    :placeholder="$t('order.logistics.trackingPlaceholder', 'Enter tracking number')">
                </div>

                <div class="form-group">
                  <label for="logistics-status" class="form-label">{{ $t('order.logistics.status', 'Logistics Status')
                    }}</label>
                  <select id="logistics-status" v-model="logisticsForm.shipping_status" required class="form-control">
                    <option value="">{{ $t('order.logistics.selectStatus', 'Select status') }}</option>
                    <option value="pending">{{ $t('order.logistics.statusPending', 'Pending') }}</option>
                    <option value="shipped">{{ $t('order.logistics.statusShipped', 'Shipped') }}</option>
                    <option value="in_transit">{{ $t('order.logistics.statusInTransit', 'In Transit') }}</option>
                    <option value="delivered">{{ $t('order.logistics.statusDelivered', 'Delivered') }}</option>
                    <option value="returned">{{ $t('order.logistics.statusReturned', 'Returned') }}</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- 收货人信息 -->
            <div class="form-section">
              <h4 class="section-title">{{ $t('order.logistics.recipientInfo', 'Recipient Information') }}</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label for="recipient-name" class="form-label">{{ $t('order.logistics.recipientName', 'RecipientName')
                    }}</label>
                  <input id="recipient-name" type="text" v-model="logisticsForm.shipping_name" class="form-control"
                    required :placeholder="$t('order.logistics.recipientNamePlaceholder', 'Enter recipient name')">
                </div>


                <div class="form-group">
                  <label for="shipping-country" class="form-label">{{ $t('checkout.country', 'Country') }}</label>
                  <select id="shipping-country" v-model="logisticsForm.shipping_country"
                    @change="handleCountryChange(logisticsForm.shipping_country)" class="form-control" required>
                    <option value="">{{ $t('checkout.countryPlaceholder', 'Select Country') }}</option>
                    <option v-for="country in countries" :key="country.iso3" :value="country.name">
                      {{ country.name }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="shipping-state" class="form-label">{{ $t('checkout.state', 'State/Province') }}</label>
                  <select id="shipping-state" v-model="logisticsForm.shipping_state" @change="handleStateChange()"
                    class="form-control" required>
                    <option value="">{{ $t('checkout.statePlaceholder', 'Select State/Province') }}</option>
                    <option v-for="state in currentStates" :key="state.name" :value="state.name">
                      {{ state.name }}
                    </option>
                  </select>
                </div>

                <div class="form-group phone-group">
                  <label for="recipient-phone" class="form-label">{{ $t('order.logistics.recipientPhone',
                    'RecipientPhone')
                    }}</label>
                  <div class="phone-input-group">
                    <input id="phone-country-code" type="text" v-model="logisticsForm.shipping_phone_country_code"
                      class="form-control country-code-input"
                      :placeholder="$t('order.logistics.phoneCountryCodePlaceholder', '+1')">
                    <input id="recipient-phone" type="text" v-model="logisticsForm.shipping_phone"
                      class="form-control phone-input" required
                      :placeholder="$t('order.logistics.recipientPhonePlaceholder', 'Enter recipient phone')">
                  </div>
                </div>

                <div class="form-group">
                  <label for="recipient-email" class="form-label">{{ $t('order.logistics.recipientEmail',
                    'RecipientEmail')
                    }}</label>
                  <input id="recipient-email" type="email" v-model="logisticsForm.shipping_email" class="form-control"
                    :placeholder="$t('order.logistics.recipientEmailPlaceholder', 'Enter recipient email')">
                </div>

                <div class="form-group">
                  <label for="postal-code" class="form-label">{{ $t('order.logistics.postalCode', 'Postal Code')
                    }}</label>
                  <input id="postal-code" type="text" v-model="logisticsForm.shipping_zip_code" class="form-control"
                    required :placeholder="$t('order.logistics.postalCodePlaceholder', 'Enter postal code')">
                </div>


                <div class="form-group">
                  <label for="shipping-city" class="form-label">{{ $t('checkout.city', 'City') }}</label>
                  <input id="shipping-city" type="text" v-model="logisticsForm.shipping_city" class="form-control"
                    required :placeholder="$t('checkout.cityPlaceholder', 'Enter city')">
                </div>
              </div>

              <div class="form-group full-width">
                <label for="delivery-address" class="form-label">{{ $t('order.logistics.deliveryAddress',
                  'DeliveryAddress')
                  }}</label>
                <textarea id="delivery-address" v-model="logisticsForm.shipping_address" class="form-control" required
                  :placeholder="$t('order.logistics.deliveryAddressPlaceholder', 'Enter delivery address')"
                  rows="3"></textarea>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" @click="closeLogisticsModal" class="btn btn-outline">
                {{ $t('common.cancel', 'Cancel') }}
              </button>
              <button type="submit" class="btn btn-primary" :disabled="isUpdating">
                {{ isUpdating ? $t('order.logistics.updating', 'Updating...') :
                $t('order.logistics.updateButton','UpdateLogistics') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>



    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <p>{{ $t('order.loading', 'Loading orders...') }}</p>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && orders.length === 0" class="empty-state">
      <p>{{ $t('order.noOrders', 'No orders found.') }}</p>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { Refresh } from '@element-plus/icons-vue'

export default {
  name: 'OrderManagement',
  components: {
    Refresh
  },
  data() {
    return {
      orders: [],
      logisticsCompanies: [],
      loading: false,
      refreshing: false,
      isUpdating: false,
      showOrderDetail: false,
      showLogisticsModal: false,
      selectedOrder: null,
      currentPage: 1,
      totalPages: 1,
      totalOrders: 0,
      pageSize: 20,
      dateRange: [],
      userOptions: [],
      userSearchLoading: false,
      filters: {
        status: '',
        userId: '',
        startDate: '',
        endDate: ''
      },
      logisticsForm: {
        logistics_company_id: '',
        shipping_no: '',
        shipping_status: 'pending',
        shipping_name: '',
        shipping_phone: '',
        shipping_phone_country_code: '',
        shipping_email: '',
        shipping_address: '',
        shipping_zip_code: '',
        shipping_country: '',
        shipping_state: '',
        shipping_city: ''
      },
      // 价格编辑相关
      editingPrice: false,
      editableShippingFee: 0,
      editableTotalAmount: 0,
      originalShippingFee: 0,
      originalTotalAmount: 0
    }
  },
  computed: {
    ...mapState(['user']),
    isAdmin() {
      return this.user && this.user.role === 'admin'
    },
    countries() {
      return this.$store.getters['countryState/countries'] || [];
    },
    currentStates() {
      if (!this.logisticsForm.shipping_country || !this.countries || this.countries.length === 0) {
        return [];
      }
      const country = this.countries.find(c => c.name === this.logisticsForm.shipping_country);
      if (!country) {
        return [];
      }
      return this.$store.getters['countryState/getStatesByCountry'](country.iso3) || [];
    }
  },
  watch: {
    // 监听筛选条件变化，自动重新加载数据
    'filters.status'() {
      this.currentPage = 1
      this.loadOrders()
    },
    'filters.userId'() {
      this.currentPage = 1
      this.loadOrders()
    }
  },
  mounted() {
    this.loadOrders()
    if (this.isAdmin) {
      this.loadLogisticsCompanies()
      this.loadUsers()
    }
    this.loadCountryStateData()
  },
  methods: {
    async loadOrders() {
      this.loading = true
      try {
        const params = new URLSearchParams({
          page: this.currentPage,
          limit: this.pageSize,
          ...this.filters
        })

        const response = await this.$api.getWithErrorHandler(`/order-management/orders?${params}`, {
          fallbackKey: 'order.error.fetchFailed'
        })

        if (response.success) {
          this.orders = response.data.orders
          this.totalPages = response.data.pagination.pages
          this.totalOrders = response.data.pagination.total || 0
        }
      } catch (error) {
        console.error('Error loading orders:', error)
      } finally {
        this.loading = false
      }
    },

    async loadLogisticsCompanies() {
      try {
        const response = await this.$api.getWithErrorHandler('/order-management/logistics-companies', {
          fallbackKey: 'logistics.error.fetchCompaniesFailed'
        })

        if (response.success) {
          this.logisticsCompanies = response.data
        }
      } catch (error) {
        console.error('Error loading logistics companies:', error)
      }
    },

    async viewOrderDetail(order) {
      try {
        const response = await this.$api.getWithErrorHandler(`/order-management/orders/${order.id}`, {
          fallbackKey: 'order.error.fetchDetailFailed'
        })

        if (response.success) {
          this.selectedOrder = response.data
          this.showOrderDetail = true
        }
      } catch (error) {
        console.error('Error loading order detail:', error)
      }
    },

    async manageLogistics(order) {
      try {
        // 重新获取最新的订单详情，确保物流信息是最新的
        const response = await this.$api.getWithErrorHandler(`/order-management/orders/${order.id}`, {
          fallbackKey: 'order.error.loadOrderDetailFailed'
        })

        if (response.success) {
          const latestOrder = response.data
          this.selectedOrder = latestOrder
          
          // 检查是否已有logistics信息（通过logistics_id或logistics_company_id判断）
          const hasLogisticsInfo = latestOrder.logistics_id || latestOrder.logistics_company_id
          
          if (hasLogisticsInfo) {
            // 已有logistics信息，使用logistics表的字段（带logistics_前缀的字段）
            this.logisticsForm = {
              logistics_company_id: latestOrder.logistics_company_id || '',
              shipping_no: latestOrder.shipping_no || '',
              shipping_status: latestOrder.shipping_status || 'pending',
              shipping_name: latestOrder.logistics_shipping_name || '',
              shipping_phone: latestOrder.logistics_shipping_phone || '',
              shipping_phone_country_code: latestOrder.logistics_shipping_phone_country_code || '',
              shipping_email: latestOrder.logistics_shipping_email || '',
              shipping_address: latestOrder.logistics_shipping_address || '',
              shipping_zip_code: latestOrder.logistics_shipping_zip_code || '',
              shipping_country: latestOrder.logistics_shipping_country || '',
              shipping_state: latestOrder.logistics_shipping_state || '',
              shipping_city: latestOrder.logistics_shipping_city || ''
            }
          } else {
            // 新建logistics信息，使用order表的收货信息填充
            this.logisticsForm = {
              logistics_company_id: '',
              shipping_no: '',
              shipping_status: 'pending',
              shipping_name: latestOrder.shipping_name || '',
              shipping_phone: latestOrder.shipping_phone || '',
              shipping_phone_country_code: latestOrder.shipping_phone_country_code || '',
              shipping_email: latestOrder.shipping_email || '',
              shipping_address: latestOrder.shipping_address || '',
              shipping_zip_code: latestOrder.shipping_zip_code || '',
              shipping_country: latestOrder.shipping_country || '',
              shipping_state: latestOrder.shipping_state || '',
              shipping_city: latestOrder.shipping_city || ''
            }
          }
          
          this.showLogisticsModal = true
        }
      } catch (error) {
        console.error('Error loading latest order data for logistics:', error)
        // 如果获取最新数据失败，仍然使用传入的order数据
        this.selectedOrder = order
        
        // 检查是否已有logistics信息（通过logistics_id或logistics_company_id判断）
        const hasLogisticsInfo = order.logistics_id || order.logistics_company_id
        
        if (hasLogisticsInfo) {
          // 已有logistics信息，使用logistics表的字段（带logistics_前缀的字段）
          this.logisticsForm = {
            logistics_company_id: order.logistics_company_id || '',
            shipping_no: order.shipping_no || '',
            shipping_status: order.shipping_status || 'pending',
            shipping_name: order.logistics_shipping_name || '',
            shipping_phone: order.logistics_shipping_phone || '',
            shipping_phone_country_code: order.logistics_shipping_phone_country_code || '',
            shipping_email: order.logistics_shipping_email || '',
            shipping_address: order.logistics_shipping_address || '',
            shipping_zip_code: order.logistics_shipping_zip_code || '',
            shipping_country: order.logistics_shipping_country || '',
            shipping_state: order.logistics_shipping_state || '',
            shipping_city: order.logistics_shipping_city || ''
          }
        } else {
          // 新建logistics信息，使用order表的收货信息填充
          this.logisticsForm = {
            logistics_company_id: '',
            shipping_no: '',
            shipping_status: 'pending',
            shipping_name: order.shipping_name || '',
            shipping_phone: order.shipping_phone || '',
            shipping_phone_country_code: order.shipping_phone_country_code || '',
            shipping_email: order.shipping_email || '',
            shipping_address: order.shipping_address || '',
            shipping_zip_code: order.shipping_zip_code || '',
            shipping_country: order.shipping_country || '',
            shipping_state: order.shipping_state || '',
            shipping_city: order.shipping_city || ''
          }
        }
        
        this.showLogisticsModal = true
      }
    },

    // 价格编辑相关方法
    startEditingPrice() {
      this.editingPrice = true
      this.editableShippingFee = this.selectedOrder.shipping_fee || 0
      this.editableTotalAmount = this.selectedOrder.total_amount || 0
      this.originalShippingFee = this.selectedOrder.shipping_fee || 0
      this.originalTotalAmount = this.selectedOrder.total_amount || 0
    },

    async savePriceChanges() {
      if (!this.selectedOrder) return

      try {
        const priceData = {
          shipping_fee: parseFloat(this.editableShippingFee) || 0,
          total_amount: parseFloat(this.editableTotalAmount) || 0
        }

        const response = await this.$api.putWithErrorHandler(`/order-management/orders/${this.selectedOrder.id}/update`, priceData, {
          fallbackKey: 'order.error.updatePriceFailed'
        })

        if (response.success) {
          this.$message.success(this.$t(response.message || 'order.success.priceUpdated'))
          
          // 更新本地数据
          this.selectedOrder.shipping_fee = priceData.shipping_fee
          this.selectedOrder.total_amount = priceData.total_amount
          
          // 更新订单列表中的数据
          const orderIndex = this.orders.findIndex(order => order.id === this.selectedOrder.id)
          if (orderIndex !== -1) {
            this.orders[orderIndex].shipping_fee = priceData.shipping_fee
            this.orders[orderIndex].total_amount = priceData.total_amount
          }
          
          this.editingPrice = false
        }
      } catch (error) {
        console.error('Error updating order price:', error)
        this.$message.error(this.$t('order.error.updatePriceFailed'))
      }
    },

    cancelPriceEdit() {
      this.editingPrice = false
      this.editableShippingFee = this.originalShippingFee
      this.editableTotalAmount = this.originalTotalAmount
    },

    async updateLogistics() {
      if (!this.selectedOrder) return

      this.isUpdating = true
      try {
        // 准备物流数据
        const logisticsData = { ...this.logisticsForm }
        
        // 自动状态更新逻辑
        let orderStatus = this.selectedOrder.status
        
        // 如果填写了物流单号，订单状态自动变为 shipped
        if (logisticsData.shipping_no && logisticsData.shipping_no.trim()) {
          orderStatus = 'shipped'
        }
        
        // 如果物流状态为 delivered，订单状态自动变为 delivered
        if (logisticsData.shipping_status === 'delivered') {
          orderStatus = 'delivered'
        }
        
        // 添加订单状态到请求数据中
        logisticsData.order_status = orderStatus

        const response = await this.$api.putWithErrorHandler(`/order-management/orders/${this.selectedOrder.id}/logistics`, logisticsData, {
          fallbackKey: 'order.error.updateLogisticsFailed'
        })

        if (response.success) {
          this.$message.success(this.$t(response.message))
          
          // 强制关闭物流模态框
          this.showLogisticsModal = false
          
          // 重置物流表单
          this.logisticsForm = {
            logistics_company_id: '',
            shipping_no: '',
            shipping_status: 'pending',
            shipping_name: '',
            shipping_phone: '',
            shipping_email: '',
            shipping_address: '',
            shipping_zip_code: ''
          }
          
          // 如果订单详情模态框是打开的，也需要关闭
          if (this.showOrderDetail) {
            this.showOrderDetail = false
            this.selectedOrder = null
          } else {
            // 如果订单详情模态框没有打开，直接清空selectedOrder
            this.selectedOrder = null
          }
          
          // 刷新订单列表
          await this.loadOrders()
        }
      } catch (error) {
        console.error('Error updating logistics:', error)
      } finally {
        this.isUpdating = false
      }
    },

    closeOrderDetail() {
      this.showOrderDetail = false
      this.selectedOrder = null
      // 重置编辑状态
      this.editingPrice = false
      this.editableShippingFee = 0
      this.editableTotalAmount = 0
      this.originalShippingFee = 0
      this.originalTotalAmount = 0
    },

    closeLogisticsModal() {
      this.showLogisticsModal = false
      // 只有在订单详情模态框也关闭时才清空selectedOrder
      if (!this.showOrderDetail) {
        this.selectedOrder = null
      }
      // 重置物流表单
      this.logisticsForm = {
        logistics_company_id: '',
        shipping_no: '',
        shipping_status: 'pending',
        shipping_name: '',
        shipping_phone: '',
        shipping_email: '',
        shipping_address: '',
        shipping_zip_code: ''
      }
    },

    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
        this.loadOrders()
      }
    },

    formatStatus(status) {
      const statusMap = {
        pending: 'Pending',
        confirmed: 'Confirmed',
        shipped: 'Shipped',
        delivered: 'Delivered',
        cancelled: 'Cancelled'
      }
      return statusMap[status] || status
    },

    formatLogisticsStatus(status) {
      const statusMap = {
        pending: 'Pending',
        picked_up: 'Picked Up',
        in_transit: 'In Transit',
        out_for_delivery: 'Out for Delivery',
        delivered: 'Delivered',
        failed: 'Failed',
        returned: 'Returned'
      }
      return statusMap[status] || status
    },



    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString()
    },

    // 获取状态对应的Element Plus tag类型
    getStatusType(status) {
      const typeMap = {
        pending: 'warning',
        confirmed: 'info',
        shipped: 'primary',
        delivered: 'success',
        cancelled: 'danger'
      }
      return typeMap[status] || 'info'
    },

    // 获取物流状态对应的Element Plus tag类型
    getLogisticsStatusType(status) {
      const typeMap = {
        pending: 'warning',
        picked_up: 'info',
        in_transit: 'primary',
        out_for_delivery: 'warning',
        delivered: 'success',
        failed: 'danger',
        returned: 'danger'
      }
      return typeMap[status] || 'info'
    },

    // 加载用户列表
    async loadUsers(query = '') {
      this.userSearchLoading = true
      try {
        const params = {
          limit: 20
        }
        if (query) {
          params.search = query
        }
        
        const response = await this.$api.getWithErrorHandler('/admin/users', {
          params,
          fallbackKey: 'admin.user.error.loadFailed'
        })
        
        this.userOptions = response.data.items
      } catch (error) {
        // 错误已经被统一处理
      } finally {
        this.userSearchLoading = false
      }
    },

    // 用户搜索处理
    handleUserSearch(query) {
      if (query !== '') {
        this.loadUsers(query)
      } else {
        this.loadUsers()
      }
    },

    // 计算订单商品小计
    calculateSubtotal(items) {
      if (!items || !Array.isArray(items)) {
        return '0.00'
      }
      const subtotal = items.reduce((total, item) => {
        const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)
        return total + itemTotal
      }, 0)
      return subtotal.toFixed(2)
    },

    // 日期范围变化处理
    handleDateRangeChange(dateRange) {
      if (dateRange && dateRange.length === 2) {
        this.filters.startDate = dateRange[0]
        this.filters.endDate = dateRange[1]
      } else {
        this.filters.startDate = ''
        this.filters.endDate = ''
      }
      this.currentPage = 1
      this.loadOrders()
    },

    // 重置过滤器
    resetFilters() {
      this.filters = {
        status: '',
        userId: '',
        startDate: '',
        endDate: ''
      }
      this.dateRange = []
      this.currentPage = 1
      this.loadOrders()
    },

    // 刷新数据
    async refreshData() {
      this.refreshing = true
      try {
        await this.loadOrders()
      } finally {
        this.refreshing = false
      }
    },

    // 分页大小变化处理
    handleSizeChange(newSize) {
      this.pageSize = newSize
      this.currentPage = 1
      this.loadOrders()
    },

    // 当前页变化处理
    handleCurrentChange(newPage) {
      this.currentPage = newPage
      this.loadOrders()
    },

    // 加载国家省份数据
    async loadCountryStateData() {
      try {
        await this.$store.dispatch('countryState/loadCountryStateData');
      } catch (error) {
        console.error('加载国家省份数据失败:', error);
      }
    },

    // 处理国家变化
    handleCountryChange(countryName) {
      if (countryName && this.countries && this.countries.length > 0) {
        const country = this.countries.find(c => c.name === countryName);
        if (country) {
          this.logisticsForm.shipping_phone_country_code = country.phone_code;
        }
      }
      this.logisticsForm.shipping_state = '';
      this.logisticsForm.shipping_city = '';
    },

    // 处理省份变化
    handleStateChange() {
      this.logisticsForm.shipping_city = '';
    }
  }
}
</script>

<style scoped>
.order-management {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  color: #333;
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.page-header p {
  color: #666;
  font-size: 14px;
  margin: 0;
}

/* Element Plus 卡片样式 */
.filter-card {
  margin-bottom: 20px;
}

.order-list-card {
  margin-bottom: 20px;
}

/* 分页样式 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 20px 0;
}

/* 表格中的辅助文本样式 */
.text-secondary {
  color: #6c757d;
  font-size: 12px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-success:hover {
  background-color: #1e7e34;
}

.orders-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  width: 100%;
  margin: 20px 0;
}

.orders-table {
  width: 100%;
  min-width: 1200px;
  border-collapse: collapse;
  margin: 0;
  table-layout: fixed;
}

.orders-table th,
.orders-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.orders-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.orders-table tbody tr:hover {
  background-color: #f8f9fa;
}

.table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
}

.table th,
.table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

.table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.table tbody tr:hover {
  background-color: #f8f9fa;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.status-pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-processing {
  background-color: #d1ecf1;
  color: #0c5460;
}

.status-shipped {
  background-color: #d4edda;
  color: #155724;
}

.status-delivered {
  background-color: #d1ecf1;
  color: #0c5460;
}

.status-cancelled {
  background-color: #f8d7da;
  color: #721c24;
}

/* 物流状态样式 */
.logistics-pending {
  background-color: #fff3cd;
  color: #856404;
}

.logistics-shipped {
  background-color: #cce5ff;
  color: #004085;
}

.logistics-in_transit {
  background-color: #d1ecf1;
  color: #0c5460;
}

.logistics-delivered {
  background-color: #d4edda;
  color: #155724;
}

.logistics-returned {
  background-color: #f8d7da;
  color: #721c24;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 900px;
  max-height: 95vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

/* 订单详情模态框样式 */
.order-detail-modal {
  max-width: 1200px;
  width: 95%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e9ecef;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-title h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.order-id {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: white;
  padding: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.modal-body {
  padding: 24px;
}

/* 订单详情网格布局 */
.order-detail-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 24px;
}

.order-info-card {
  width: 100%;
}

.logistics-info-card {
  width: 100%;
}

@media (max-width: 768px) {
  .order-detail-grid {
    gap: 16px;
  }
}

.detail-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.order-info-card,
.logistics-info-card {
  /* 每个卡片占据一列 */
}

.items-card {
  grid-column: 1 / -1;
  background: white;
  border: 1px solid #dee2e6;
}

.card-header {
  background: white;
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
}

.card-header h4 {
  margin: 0;
  color: #495057;
  font-size: 16px;
  font-weight: 600;
}

.card-content {
  padding: 20px;
}

.status-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.order-date {
  color: #6c757d;
  font-size: 14px;
}

.order-amount {
  color: #28a745;
  font-size: 16px;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-grid-two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
}

.info-grid-four-column {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px 16px;
}

.info-grid-five-column {
  display: grid;
  grid-template-columns: repeat(5, minmax(160px, 1fr));
  gap: 12px 16px;
  min-width: 0;
}

@media (max-width: 1200px) {
  .info-grid-five-column {
    grid-template-columns: repeat(4, minmax(140px, 1fr));
  }
}

@media (max-width: 900px) {
  .info-grid-five-column {
    grid-template-columns: repeat(3, minmax(120px, 1fr));
  }
}

@media (max-width: 768px) {
  .info-grid-four-column {
    grid-template-columns: 1fr 1fr;
  }
  .info-grid-five-column {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }
}

@media (max-width: 480px) {
  .info-grid-four-column {
    grid-template-columns: 1fr;
  }
  .info-grid-five-column {
    grid-template-columns: 1fr;
  }
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 8px;
  border-bottom: 1px solid #f0f0f0;
  min-width: 0;
}

.info-row.full-width {
  grid-column: 1 / -1;
}

.info-row:last-child {
  border-bottom: none;
}

.info-grid-two-column .info-row {
  margin-bottom: 0;
}

.info-label {
  font-weight: 600;
  color: #495057;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info-value {
  color: #212529;
  font-weight: 500;
  word-break: break-word;
  font-size: 13px;
  line-height: 1.4;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info-value.order-amount {
  color: #28a745;
  font-size: 16px;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.tracking-number {
  font-family: 'Courier New', monospace;
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

/* 订单表格样式 */
.order-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.customer-name {
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 2px;
}

.customer-email {
  font-size: 12px;
  color: #6c757d;
}

.amount-text {
  font-weight: 600;
  color: #28a745;
  font-size: 14px;
}

.date-text {
  color: #495057;
  font-size: 13px;
}

.no-logistics {
  color: #6c757d;
  font-size: 12px;
  font-style: italic;
}

/* 商品表格样式 */
.items-table-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
  background: white;
  table-layout: fixed;
}

.items-table th,
.items-table td {
  padding: 12px 8px;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
  overflow: hidden;
  text-overflow: ellipsis;
}

.items-table th {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  font-weight: 600;
  color: #495057;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 设置各列的具体宽度 */
.items-table th:nth-child(1),
.items-table td:nth-child(1) {
  width: 45%;
}

.items-table th:nth-child(2),
.items-table td:nth-child(2) {
  width: 15%;
  text-align: center;
}

.items-table th:nth-child(3),
.items-table td:nth-child(3) {
  width: 20%;
  text-align: right;
}

.items-table th:nth-child(4),
.items-table td:nth-child(4) {
  width: 20%;
  text-align: right;
}

.items-table .product-name {
  font-weight: 500;
  color: #495057;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.items-table .quantity {
  font-family: 'Segoe UI', Arial, sans-serif;
  font-weight: 600;
  color: #495057;
}

.items-table .price,
.items-table .total {
  font-family: 'Segoe UI', Arial, sans-serif;
  font-weight: 600;
  color: #28a745;
}

.items-table tbody tr:hover {
  background-color: #f8f9fa;
  transition: background-color 0.2s ease;
}

.order-total {
  margin-top: 24px;
  padding: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #e9ecef 100%);
  border-radius: 12px;
  border: 1px solid #dee2e6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.order-total::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #007bff 0%, #28a745 50%, #17a2b8 100%);
}

.total-summary-row {
  display: flex;
  gap: 20px;
  align-items: stretch;
  margin-bottom: 20px;
}

.total-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  border: 1px solid rgba(222, 226, 230, 0.5);
  transition: all 0.2s ease;
  text-align: center;
}

.total-item:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.total-item.final-total {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.total-item.final-total:hover {
  background: linear-gradient(135deg, #218838 0%, #1e7e34 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(40, 167, 69, 0.4);
}

.total-item.final-total .total-label {
  color: white;
  font-size: 16px;
  font-weight: 700;
}

.total-item.final-total .total-amount {
  color: white;
  font-size: 20px;
  font-weight: 800;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.total-label {
  font-size: 14px;
  font-weight: 600;
  color: #495057;
  margin-bottom: 8px;
  text-align: center;
}

.total-amount {
  font-size: 18px;
  font-weight: 700;
  color: #495057;
  font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  letter-spacing: 0.5px;
}

/* 价格编辑相关样式 */
.price-edit-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

.price-input {
  width: 100px;
  padding: 6px 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  background: white;
}

.price-input:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.price-edit-actions {
  text-align: center;
  margin-top: 20px;
}

.price-edit-actions .el-button {
  font-size: 16px;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
  transition: all 0.3s ease;
}

.price-edit-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 123, 255, 0.4);
}

/* 物流模态框样式 */
.logistics-modal {
  max-width: 1000px;
  width: 95%;
  max-height: 95vh;
  overflow-y: auto;
}

.logistics-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

.section-title {
  margin: 0 0 16px 0;
  color: #495057;
  font-size: 16px;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 2px solid #dee2e6;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-label {
  margin-bottom: 6px;
  font-weight: 500;
  color: #495057;
  font-size: 14px;
}

.form-input,
.form-select,
.form-textarea,
.form-control {
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus,
.form-control:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #dee2e6;
}

.form-actions .btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.form-actions .btn-outline {
  background: white;
  border: 2px solid #6c757d;
  color: #6c757d;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.form-actions .btn-outline:hover {
  background: #6c757d;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  gap: 10px;
}

.pagination button {
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  background: white;
  cursor: pointer;
  border-radius: 4px;
}

.pagination button:hover:not(:disabled) {
  background-color: #e9ecef;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination .current-page {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

.no-orders {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

/* 电话输入组样式 */
.phone-group {
  width: 100%;
}

.phone-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.country-code-input {
  flex: 0 0 80px;
  min-width: 80px;
  text-align: center;
  font-weight: 500;
}

.phone-input {
  flex: 1;
  min-width: 0;
}

.country-code-input:focus,
.phone-input:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  outline: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .order-detail-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    width: 95%;
    margin: 20px;
  }

  .status-display {
    flex-direction: column;
    align-items: flex-start;
  }

  .info-row {
    flex-direction: column;
    gap: 4px;
  }

  .info-value {
    text-align: left;
  }

  .total-summary-row {
    flex-direction: column;
    gap: 12px;
  }

  .total-item {
    padding: 12px;
  }

  .total-label {
    font-size: 13px;
  }

  .total-amount {
    font-size: 16px;
  }

  .total-item.final-total .total-label {
    font-size: 14px;
  }

  .total-item.final-total .total-amount {
    font-size: 18px;
  }

  .price-edit-actions .el-button {
    font-size: 14px;
    padding: 10px 20px;
  }
}
</style>