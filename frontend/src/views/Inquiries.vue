<template>
  <div class="inquiry-management-page">
    <PageBanner :title="$t('inquiry.management.title') || '询价单管理'" />

    <!-- Navigation Menu -->
    <NavigationMenu :breadcrumb-items="breadcrumbItems" />

    <div class="inquiry-management-container">
      <!-- Desktop Layout - 保持原有布局 -->
      <div class="desktop-only">
        <InquiryPanel :cart-items="[]" :inquired-product-ids="inquiredProductIds"
          @update-inquired-products="updateInquiredProductIds" @inquiry-created="handleInquiryCreated"
          ref="inquiryPanel" />
      </div>

      <!-- Mobile Layout -->
      <div class="mobile-only">
        <!-- 卡片视图 -->
        <div v-if="currentView === 'cards'" class="mobile-cards">
          <div class="mobile-inquiry-cards">
            <!-- 新建询价单卡片 -->
            <div class="inquiry-card create-inquiry-card" @click="createNewInquiry">
              <div class="card-icon">
                <i class="material-icons">add_circle_outline</i>
              </div>
              <div class="card-content">
                <h3 class="card-title">{{ $t('inquiry.mobile.createNew') || '新建询价单' }}</h3>
                <p class="card-description">{{ $t('inquiry.mobile.createDescription') || '添加商品，设置期望价格和购买数量' }}</p>
              </div>
              <div class="card-arrow">
                <i class="material-icons">arrow_forward_ios</i>
              </div>
            </div>

            <!-- 已支付询价单列表卡片 -->
            <div class="inquiry-card paid-inquiry-card" @click="showPaidInquiries">
              <div class="card-icon">
                <i class="material-icons">payment</i>
              </div>
              <div class="card-content">
                <h3 class="card-title">{{ $t('inquiry.mobile.paidInquiries') || '已支付询价单' }}</h3>
                <p class="card-description">{{ $t('inquiry.mobile.paidDescription') || '查看已支付的询价单和历史记录' }}</p>
                <div class="card-badge" v-if="paidInquiriesCount > 0">{{ paidInquiriesCount }}</div>
              </div>
              <div class="card-arrow">
                <i class="material-icons">arrow_forward_ios</i>
              </div>
            </div>

            <!-- 未支付询价单详情卡片 -->
            <div class="inquiry-card unpaid-inquiry-card" @click="showUnpaidInquiries">
              <div class="card-icon">
                <i class="material-icons">pending_actions</i>
              </div>
              <div class="card-content">
                <h3 class="card-title">{{ $t('inquiry.mobile.unpaidInquiries') || '未支付询价单' }}</h3>
                <p class="card-description">{{ $t('inquiry.mobile.unpaidDescription') || '查看未支付的询价单详情' }}</p>
                <div class="card-badge" v-if="unpaidInquiriesCount > 0">{{ unpaidInquiriesCount }}</div>
              </div>
              <div class="card-arrow">
                <i class="material-icons">arrow_forward_ios</i>
              </div>
            </div>
          </div>
        </div>

        <!-- 询价单列表视图 -->
        <div v-else-if="currentView === 'list'" class="mobile-inquiry-list">
          <div class="list-header">
            <button class="back-button" @click="backToCards">
              <i class="material-icons">arrow_back</i>
            </button>
            <h3 class="list-title">{{ currentListTitle }}</h3>
          </div>

          <div class="inquiry-list-items">
            <div v-for="inquiry in currentInquiryList" :key="inquiry.id" class="inquiry-list-item"
              @click="selectInquiry(inquiry)">
              <div class="inquiry-item-header">
                <h4 class="inquiry-title">{{ inquiry.title }}</h4>
                <div class="inquiry-header-right">
                  <span v-if="inquiry.unread_count > 0" class="mobile-unread-badge">{{ inquiry.unread_count }}</span>
                  <span class="inquiry-status" :class="inquiry.status">
                    {{ inquiry.status === 'paid' ? ($t('inquiry.status.paid') || '已支付') : ($t('inquiry.status.unpaid') ||
                    '未支付') }}
                  </span>
                </div>
              </div>
              <div class="inquiry-item-meta">
                <span class="inquiry-date">{{ formatDate(inquiry.created_at) }}</span>
                <span class="inquiry-items-count">{{ inquiry.items.length }} {{ $t('inquiry.itemsCount') || '个商品'
                  }}</span>
              </div>
              <div class="inquiry-item-preview">
                <div class="preview-products">
                  <img v-for="(item, index) in inquiry.items.slice(0, 3)" :key="index"
                    :src="item.image_url || require('@/assets/images/default-image.svg')" :alt="item.product_name"
                    class="preview-image">
                  <span v-if="inquiry.items.length > 3" class="more-count">
                    +{{ inquiry.items.length - 3 }}
                  </span>
                </div>
              </div>
            </div>

            <div v-if="currentInquiryList.length === 0" class="no-inquiries">
              <i class="material-icons">assignment</i>
              <p>{{ currentListType === 'paid' ? ($t('inquiry.noPaidInquiries') || '暂无已支付询价单') :
                ($t('inquiry.noUnpaidInquiries') || '暂无未支付询价单') }}</p>
            </div>
          </div>
        </div>

        <!-- 询价单详情视图 -->
        <div v-else-if="currentView === 'detail'" class="mobile-inquiry-detail">
          <div class="detail-header">
            <button class="back-button" @click="backToList">
              <i class="material-icons">arrow_back</i>
            </button>
            <h3 class="detail-title">{{ selectedMobileInquiry ? selectedMobileInquiry.title :
              ($t('inquiry.mobile.createNew') || '新建询价单') }}</h3>
          </div>

          <InquiryDetailPanel :inquiry="selectedMobileInquiry" :is-mobile="true" @remove-item="handleRemoveItem"
            @send-message="handleSendMessage" @update-message="handleUpdateMessage"
            @checkout-inquiry="handleCheckoutInquiry" @item-added="handleMobileItemAdded"
            @new-messages-received="handleNewMessagesReceived" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PageBanner from '@/components/common/PageBanner.vue';
import NavigationMenu from '@/components/common/NavigationMenu.vue';
import InquiryPanel from '@/components/common/InquiryPanel.vue';
import InquiryDetailPanel from '@/components/common/InquiryDetailPanel.vue';

export default {
  name: 'InquiryManagement',
  components: {
    PageBanner,
    NavigationMenu,
    InquiryPanel,
    InquiryDetailPanel
  },
  data() {
    return {
      // Inquiry system data
      inquiredProductIds: new Set(),
      // Mobile inquiry counts
      paidInquiriesCount: 0,
      unpaidInquiriesCount: 0,
      // Mobile view state
      currentView: 'cards', // 'cards', 'list', 'detail'
      currentListType: null, // 'paid', 'unpaid'
      inquiries: [],
      selectedMobileInquiry: null,
      isNewInquiry: false,
      // 定时刷新
      refreshTimer: null
    };
  },
  computed: {
    breadcrumbItems() {
      return [
        { text: this.$t('inquiry.management.title') || '询价单管理' }
      ];
    },
    currentInquiryList() {
      if (!this.currentListType) return [];
      return this.inquiries.filter(inquiry => {
        if (this.currentListType === 'paid') {
          return inquiry.status === 'paid';
        } else {
          return inquiry.status !== 'paid';
        }
      });
    },
    currentListTitle() {
      return this.currentListType === 'paid' ? (this.$t('inquiry.mobile.paidInquiries') || '已支付询价单') : (this.$t('inquiry.mobile.unpaidInquiries') || '未支付询价单');
    }
  },
  created() {
    // 检查用户是否已登录
    if (!this.$store.getters.isLoggedIn) {
      this.$router.push('/login?redirect=/inquiry-management');
      return;
    }
    
    // 加载询价单统计数据
    this.loadInquiryCounts();
  },
  
  mounted() {
    // 检查路由参数，决定是否显示桌面布局
    this.handleRouteParams();
    // 启动定时刷新
    this.startRefreshTimer();
  },
  
  beforeUnmount() {
    // 停止定时刷新
    this.stopRefreshTimer();
    // 移除事件监听器
    window.removeEventListener('resize', this.handleResize);
  },
  
  watch: {
    '$route'() {
      this.handleRouteParams();
    }
  },
  methods: {
    // Method to update inquired product IDs from InquiryPanel
    updateInquiredProductIds(inquiredIds) {
      this.inquiredProductIds = new Set(inquiredIds);
    },
    
    // Method to handle inquiry creation from InquiryPanel
    handleInquiryCreated(inquiryId) {
      console.log('新询价单已创建:', inquiryId);
      // 重新加载统计数据
      this.loadInquiryCounts();
    },
    
    // 加载询价单数据
    async loadInquiries() {
      try {
        const response = await this.$api.getWithErrorHandler('/inquiries', {
          fallbackKey: 'inquiry.fetchError'
        });
        
        if (response.success) {
          this.inquiries = (response.data.inquiries || []).map(inquiry => ({
            ...inquiry,
            unread_count: inquiry.unread_count || 0 // 添加未读消息数
          }));
          this.paidInquiriesCount = this.inquiries.filter(inquiry => inquiry.status === 'paid').length;
          this.unpaidInquiriesCount = this.inquiries.filter(inquiry => inquiry.status !== 'paid').length;
        }
      } catch (error) {
        console.error('Failed to load inquiry data:', error);
      }
    },
    
    // 加载询价单统计数据（保持兼容性）
    async loadInquiryCounts() {
      await this.loadInquiries();
    },
    
    // 新建询价单 - 直接进入详情页
    createNewInquiry() {
      this.selectedMobileInquiry = {
        id: null,
        title: this.$t('inquiry.mobile.createNew') || '新建询价单',
        status: 'inquiried',
        items: [],
        messages: [],
        newMessage: ''
      };
      this.isNewInquiry = true;
      this.currentView = 'detail';
    },
    
    // 显示已支付询价单列表
    showPaidInquiries() {
      this.currentListType = 'paid';
      this.currentView = 'list';
    },
    
    // 显示未支付询价单列表
    showUnpaidInquiries() {
      this.currentListType = 'unpaid';
      this.currentView = 'list';
    },
    
    // 选择询价单进入详情
    async selectInquiry(inquiry) {
      // 标记该询价单的消息为已读
      await this.markInquiryMessagesAsRead(inquiry.id);
      
      // 加载询价单详情
      await this.loadInquiryDetail(inquiry.id);
      this.selectedMobileInquiry = this.inquiries.find(inq => inq.id === inquiry.id);
      this.isNewInquiry = false;
      this.currentView = 'detail';
    },
    
    // 返回卡片视图
    backToCards() {
      this.currentView = 'cards';
      this.currentListType = null;
      this.selectedMobileInquiry = null;
    },
    
    // 从详情返回列表
    backToList() {
      if (this.isNewInquiry) {
        // 如果是新建询价单，直接返回卡片视图
        this.backToCards();
      } else {
        // 否则返回列表视图
        this.currentView = 'list';
        this.selectedMobileInquiry = null;
      }
    },
    
    // 加载询价单详情
    async loadInquiryDetail(inquiryId) {
      try {
        const response = await this.$api.getWithErrorHandler(`/inquiries/${inquiryId}`, {
          fallbackKey: 'inquiry.fetchError'
        });
        
        if (response.success) {
          const inquiry = this.inquiries.find(inq => inq.id === inquiryId);
          if (inquiry) {
            inquiry.items = response.data.items.map(item => ({
              id: item.id,
              productId: item.product_id,
              product_id: item.product_id,
              name: item.product_name,
              product_name: item.product_name,
              imageUrl: item.image_url || require('@/assets/images/default-image.svg'),
              image_url: item.image_url,
              quantity: item.quantity,
              unit_price: item.unit_price,
              price: item.price || item.unit_price
            }));
            /*
            inquiry.messages = response.data.messages.map(msg => ({
              id: msg.id,
              sender: msg.sender_type === 'user' ? this.$t('inquiry.you') || '您' : this.$t('inquiry.salesRep') || '销售代表',
              content: msg.message,
              timestamp: new Date(msg.created_at).getTime(),
              isUser: msg.sender_type === 'user'
            }));*/
          }
        }
      } catch (error) {
          console.error('Failed to get inquiry details:', error);
        }
    },
    
    // 处理手机端添加商品事件
    async handleMobileItemAdded(newItem) {
      // 如果是新建询价单且ID为空，先创建询价单
      if (this.isNewInquiry && this.selectedMobileInquiry.id === null) {
        try {
          const titlePrefix = this.$t('cart.inquiryTitlePrefix') || '询价单';
          const response = await this.$api.postWithErrorHandler('/inquiries', {
            titlePrefix: titlePrefix
          }, {
            fallbackKey: 'INQUIRY.CREATE.FAILED'
          });
          
          if (response.success) {
            this.selectedMobileInquiry.id = response.data.id;
            this.selectedMobileInquiry.title = response.data.title;
            this.isNewInquiry = false;
            
            // 添加到本地询价单列表
            this.inquiries.push({
              id: response.data.id,
              title: response.data.title,
              status: 'inquiried',
              items: [],
              messages: [],
              created_at: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Failed to create inquiry:', error);
          return;
        }
      }
      
      // 添加商品到询价单
      this.selectedMobileInquiry.items.push(newItem);
      
      // 更新本地数据
      const localInquiry = this.inquiries.find(inq => inq.id === this.selectedMobileInquiry.id);
      if (localInquiry) {
        localInquiry.items.push(newItem);
      }
      
      // 重新加载询价单列表以更新统计
      await this.loadInquiries();
    },
    
    // 处理移除商品事件
    handleRemoveItem(inquiryId, itemId) {
      if (this.selectedMobileInquiry) {
        const itemIndex = this.selectedMobileInquiry.items.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
          this.selectedMobileInquiry.items.splice(itemIndex, 1);
        }
      }
      
      // 更新本地数据
      const localInquiry = this.inquiries.find(inq => inq.id === inquiryId);
      if (localInquiry) {
        const itemIndex = localInquiry.items.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
          localInquiry.items.splice(itemIndex, 1);
        }
      }
    },
    
    // 处理发送消息事件
    handleSendMessage(inquiryId, message) {
      if (this.selectedMobileInquiry) {
        const newMessage = {
          id: Date.now(),
          sender: this.$t('inquiry.you') || '您',
          content: message,
          timestamp: Date.now(),
          isUser: true
        };
        this.selectedMobileInquiry.messages.push(newMessage);
      }
    },
    
    // 处理更新消息事件
    handleUpdateMessage(inquiryId, value) {
      if (this.selectedMobileInquiry) {
        this.selectedMobileInquiry.newMessage = value;
      }
    },
    
    // 处理结账事件
    handleCheckoutInquiry(inquiryId) {
      // 更新询价单状态
      if (this.selectedMobileInquiry) {
        this.selectedMobileInquiry.status = 'checkouted';
      }
      
      const localInquiry = this.inquiries.find(inq => inq.id === inquiryId);
      if (localInquiry) {
        localInquiry.status = 'checkouted';
      }
    },
    
    // 处理新消息接收事件
    handleNewMessagesReceived(newMessages) {
      if (!newMessages || newMessages.length === 0) return;
      
      // 更新当前选中的询价单
      if (this.selectedMobileInquiry) {
        this.selectedMobileInquiry.messages.push(...newMessages);
      }
      
      // 更新本地询价单列表中的消息
      const localInquiry = this.inquiries.find(inq => inq.id === this.selectedMobileInquiry?.id);
      if (localInquiry) {
        localInquiry.messages = localInquiry.messages || [];
        localInquiry.messages.push(...newMessages);
      }
    },
    
    // 格式化日期
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },
    
    // 处理路由参数
    async handleRouteParams() {
      const { action, filter, inquiryId } = this.$route.query;
      
      // 如果有inquiryId参数，自动定位到对应的inquiry
      if (inquiryId) {
        await this.loadInquiries(); // 确保询价单数据已加载
        
        const targetInquiry = this.inquiries.find(inquiry => inquiry.id == inquiryId);
        if (targetInquiry) {
          // 在移动端，直接跳转到详情页
          if (window.innerWidth <= 768) {
            await this.selectInquiry(targetInquiry);
          } else {
            // 在桌面端，显示桌面布局并通知InquiryPanel组件
            this.$nextTick(() => {
              this.showDesktopLayout();
              if (this.$refs.inquiryPanel) {
                this.$refs.inquiryPanel.selectInquiryById(inquiryId);
              }
            });
          }
        } else {
          // 如果找不到对应的inquiry，显示提示信息
          this.$messageHandler.showWarning('未找到指定的询价单', 'inquiry.notFound');
        }
        return;
      }
      
      if (action === 'create' || filter === 'paid' || filter === 'unpaid') {
        // 如果有这些参数，在移动端显示桌面布局
        this.$nextTick(() => {
          this.showDesktopLayout();
          
          // 如果有过滤参数，通知InquiryPanel组件
          if (this.$refs.inquiryPanel && filter) {
            this.$refs.inquiryPanel.setActiveTab(filter);
          }
        });
      }
    },
    
    // 显示桌面布局
    showDesktopLayout() {
      // 在移动端强制显示桌面布局
      if (this.$refs.inquiryManagementContainer) {
        this.$refs.inquiryManagementContainer.classList.add('force-desktop-layout');
      }
    },
    
    // 返回移动端卡片视图
    backToMobileCards() {
      if (this.$refs.inquiryManagementContainer) {
        this.$refs.inquiryManagementContainer.classList.remove('force-desktop-layout');
      }
    },
    
    // 标记询价单消息为已读
    async markInquiryMessagesAsRead(inquiryId) {
      try {
        await this.$api.postWithErrorHandler(`/inquiries/${inquiryId}/mark-read`);
        // 更新本地数据中的未读消息数
        const inquiry = this.inquiries.find(inq => inq.id === inquiryId);
        if (inquiry) {
          inquiry.unread_count = 0;
        }
      } catch (error) {
        console.error('标记消息已读失败:', error);
      }
    },

    // 定时刷新询价数据
    async refreshInquiriesData() {
      try {
        const response = await this.$api.getWithErrorHandler('/inquiries');
        if (response && response.data && response.data.inquiries) {
          // 保存当前选中的询价ID
          const currentSelectedId = this.selectedMobileInquiry?.id;
          
          // 更新询价数据，保持未读消息数
           const newInquiries = response.data.inquiries.map(newInquiry => {
             return {
               ...newInquiry,
               unread_count: newInquiry.unread_count || 0
             };
           });
          
          this.inquiries = newInquiries;
          
          // 如果当前有选中的询价，保持选中状态
          if (currentSelectedId) {
            this.selectedMobileInquiry = this.inquiries.find(inq => inq.id === currentSelectedId);
          }
        }
      } catch (error) {
        console.error('定时刷新询价数据失败:', error);
      }
    },

    // 启动定时刷新
    startRefreshTimer() {
      this.refreshTimer = setInterval(() => {
        this.refreshInquiriesData();
      }, 30000); // 每30秒刷新一次
    },

    // 停止定时刷新
    stopRefreshTimer() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';
@import '@/assets/styles/_mixins.scss';

.inquiry-management-page {
  min-height: 100vh;
  background-color: $gray-100;
  width: 100%;
  overflow-x: hidden;
}

.inquiry-management-container {
  @include container;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;

  @include tablet {
    grid-template-columns: 2fr 1fr;
    gap: 32px;
  }
}

// 桌面端和移动端显示控制
.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
}

// 移动端返回按钮
.mobile-back-button {
  display: none;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 16px;
  transition: all 0.2s ease;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }

  i {
    font-size: 20px;
    color: #6b7280;
  }

  span {
    font-size: 14px;
    color: #374151;
    font-weight: 500;
  }
}

// 移动端卡片布局
.mobile-inquiry-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.inquiry-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }

  .card-icon {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 24px;
      color: white;
    }
  }

  .card-content {
    flex: 1;
    position: relative;

    .card-title {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }

    .card-description {
      margin: 0;
      font-size: 14px;
      color: #6b7280;
      line-height: 1.4;
    }

    .card-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #ef4444;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
    }
  }

  .card-arrow {
    flex-shrink: 0;
    color: #9ca3af;

    i {
      font-size: 18px;
    }
  }

  // 不同卡片的主题色
  &.create-inquiry-card .card-icon {
    background: linear-gradient(135deg, #10b981, #059669);
  }

  &.paid-inquiry-card .card-icon {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
  }

  &.unpaid-inquiry-card .card-icon {
    background: linear-gradient(135deg, #f59e0b, #d97706);
  }
}

@include mobile {
  .desktop-only {
    display: none !important;
  }

  .mobile-only {
    display: block !important;
  }

  .mobile-back-button {
    position: fixed;
    top: 20px;
    left: 20px;
    z-index: 1000;
    background: white;
    border: 1px solid #ddd;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;

    &:hover {
      background: #f5f5f5;
    }
  }

  .inquiry-management-container {
    padding: 0;
    gap: 0;
    width: 100%;
    max-width: 100vw;
    overflow-x: hidden;

    // 强制显示桌面布局时的样式
    &.force-desktop-layout {
      .desktop-only {
        display: block;
      }

      .mobile-only {
        display: none;
      }

      .mobile-back-button {
        display: flex;
      }
    }
  }

  // 手机端卡片视图
  .mobile-cards {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 100vw;
    box-sizing: border-box;
  }

  // 手机端列表视图
  .mobile-inquiry-list {
    .list-header {
      background: white;
      padding: 16px 20px;
      border-bottom: 1px solid #eee;
      display: flex;
      align-items: center;
      gap: 12px;

      .back-button {
        background: none;
        border: none;
        font-size: 20px;
        color: #007bff;
        cursor: pointer;
        padding: 4px;
      }

      .list-title {
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }
    }

    .inquiry-list-items {
      .inquiry-list-item {
        background: white;
        border-bottom: 1px solid #eee;
        padding: 16px 20px;
        cursor: pointer;
        transition: background-color 0.2s ease;

        &:hover {
          background: #f8f9fa;
        }

        .inquiry-item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;

          .inquiry-title {
            font-size: 16px;
            font-weight: 600;
            color: #333;
            flex: 1;
          }

          .inquiry-header-right {
            display: flex;
            align-items: center;
            gap: 8px;

            .mobile-unread-badge {
              background: #ef4444;
              color: white;
              border-radius: 50%;
              width: 20px;
              height: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              font-weight: 600;
              min-width: 20px;
              flex-shrink: 0;
            }

            .inquiry-status {
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 500;

              &.inquiried {
                background: #e3f2fd;
                color: #1976d2;
              }

              &.checkouted {
                background: #e8f5e8;
                color: #2e7d32;
              }
            }
          }
        }

        .inquiry-item-meta {
          display: flex;
          gap: 16px;
          margin-bottom: 8px;

          .inquiry-date {
            font-size: 14px;
            color: #666;
          }

          .inquiry-items-count {
            font-size: 14px;
            color: #007bff;
            font-weight: 500;
          }
        }

        .inquiry-item-preview {
          .preview-products {
            display: flex;
            align-items: center;
            gap: 8px;

            .preview-image {
              width: 32px;
              height: 32px;
              border-radius: 4px;
              object-fit: cover;
            }

            .more-count {
              font-size: 12px;
              color: #666;
              background: #f5f5f5;
              padding: 2px 6px;
              border-radius: 10px;
            }
          }
        }
      }

      .no-inquiries {
        text-align: center;
        padding: 40px 20px;
        color: #666;

        i {
          font-size: 48px;
          color: #ddd;
          margin-bottom: 16px;
        }

        p {
          font-size: 16px;
          margin: 0;
        }
      }
    }
  }

  // 手机端详情视图
  .mobile-inquiry-detail {
    .detail-header {
      background: white;
      padding: 16px 20px;
      border-bottom: 1px solid #eee;
      display: flex;
      align-items: center;
      gap: 12px;

      .back-button {
        background: none;
        border: none;
        font-size: 20px;
        color: #007bff;
        cursor: pointer;
        padding: 4px;
      }

      .detail-title {
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }
    }
  }

  .mobile-inquiry-cards {
    padding: 16px;
    gap: 12px;
    width: 100%;
    max-width: 100vw;
    box-sizing: border-box;
  }

  .inquiry-card {
    padding: 16px;
    gap: 12px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden;

    .card-icon {
      width: 40px;
      height: 40px;
      flex-shrink: 0;

      i {
        font-size: 20px;
      }
    }

    .card-content {
      flex: 1;
      min-width: 0; // 允许内容收缩

      .card-title {
        font-size: 15px;
        margin: 0 0 4px 0;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }

      .card-description {
        font-size: 13px;
        margin: 0;
        word-wrap: break-word;
        overflow-wrap: break-word;
        line-height: 1.4;
      }

      .card-badge {
        width: 18px;
        height: 18px;
        font-size: 11px;
        flex-shrink: 0;
      }
    }

    .card-arrow {
      flex-shrink: 0;

      i {
        font-size: 16px;
      }
    }
  }
}
</style>