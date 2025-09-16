<template>
  <div class="inquiries-section">
    <div class="inquiry-layout">
      <!-- Inquiry List Sidebar -->
      <div class="inquiry-sidebar">
        <div class="inquiry-list-header">
          <div class="header-buttons">
            <button class="add-inquiry-btn" :disabled="!canAddNewInquiry" @click="addInquiry">
              <i class="material-icons">add_circle_outline</i>
              {{ $t('cart.newInquiry') || '新建询价单' }}
            </button>
            <button class="refresh-btn" @click="refreshInquiries" :title="$t('cart.refreshInquiries') || '刷新询价单'">
              <i class="material-icons">refresh</i>
            </button>
          </div>
        </div>

        <div class="inquiry-list-container">
          <!-- Tab切换 -->
          <div class="inquiry-tabs">
            <button class="tab-btn" :class="{ 'active': activeTab === 'unpaid' }" @click="switchPaymentTab('unpaid')">
              {{ $t('cart.unpaidInquiries') || '未支付' }}
              <span v-if="activeTab === 'unpaid' && totalUnreadCount > 0" class="tab-unread-badge">{{ totalUnreadCount
                }}</span>
            </button>
            <button class="tab-btn" :class="{ 'active': activeTab === 'paid' }" @click="switchPaymentTab('paid')">
              {{ $t('cart.paidInquiries') || '已支付' }}
              <span v-if="activeTab === 'paid' && totalUnreadCount > 0" class="tab-unread-badge">{{ totalUnreadCount
                }}</span>
            </button>
          </div>

          <div class="inquiry-list-wrapper" ref="inquiryListWrapper">
            <div class="inquiry-list" ref="inquiryList">
              <div v-for="inquiry in filteredInquiries" :key="inquiry.id" class="inquiry-list-item"
                :class="{ 'active': activeInquiryId === inquiry.id }" @click="switchTab(inquiry.id)">
                <div class="inquiry-item-content">
                  <div class="inquiry-item-header">
                    <div v-if="editingInquiry === inquiry.id" class="inquiry-edit-form">
                      <input v-model="editInquiryTitle" class="inquiry-title-input"
                        @keyup.enter="saveInquiryTitle(inquiry.id)" @keyup.esc="cancelEditInquiry()"
                        placeholder="请输入询价单名称">
                      <div class="inquiry-edit-actions">
                        <button class="save-btn" @click="saveInquiryTitle(inquiry.id)">
                          <i class="material-icons">check</i>
                        </button>
                        <button class="cancel-btn" @click="cancelEditInquiry()">
                          <i class="material-icons">close</i>
                        </button>
                      </div>
                    </div>
                    <div v-else class="inquiry-title-display">
                      <h4 class="inquiry-item-title">{{ inquiry.title }}</h4>
                      <div class="inquiry-item-actions">
                        <span v-if="inquiry.unread_count > 0 && activeInquiryId !== inquiry.id" class="unread-badge">{{
                          inquiry.unread_count }}</span>
                        <button class="edit-inquiry-btn" @click.stop="startEditInquiry(inquiry)"
                          :title="$t('cart.editInquiry') || 'Edit Inquiry'">
                          <i class="material-icons">edit</i>
                        </button>
                        <button class="delete-inquiry-btn" @click.stop="confirmDeleteInquiry(inquiry.id)"
                          :title="$t('cart.deleteInquiry') || 'Delete Inquiry'">
                          <i class="material-icons">delete</i>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div class="inquiry-item-preview">
                    <div class="inquiry-products-preview">
                      <div v-for="(item) in inquiry.items.slice(0, 5)" :key="item.product_id" class="preview-product">
                        <img :src="item.image_url" :alt="item.product_name" class="preview-image">
                      </div>
                      <div v-if="inquiry.items.length > 5" class="more-products">
                        +{{ inquiry.items.length - 5 }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="filteredInquiries.length === 0" class="no-inquiries">
                <p v-if="activeTab === 'paid'">{{ $t('cart.noPaidInquiries') || '暂无已支付询价单' }}</p>
                <p v-else>{{ $t('cart.noUnpaidInquiries') || '暂无未支付询价单' }}</p>
              </div>
            </div>
          </div>

          <!-- Scroll arrows -->
          <div v-if="showScrollArrows" class="scroll-arrows">
            <button class="scroll-arrow scroll-arrow-up" @mouseenter="startScrolling('up')" @mouseleave="stopScrolling"
              :disabled="!canScrollUp">
              ▲
            </button>
            <button class="scroll-arrow scroll-arrow-down" @mouseenter="startScrolling('down')"
              @mouseleave="stopScrolling" :disabled="!canScrollDown">
              ▼
            </button>
          </div>
        </div>
      </div>

      <!-- Inquiry Detail Panel -->
      <InquiryDetailPanel ref="inquiryDetailPanel" :inquiry-id="activeInquiryId" @remove-item="handleItemRemoved"
        @item-added="handleItemAdded" @update-message="updateInquiryMessage" @checkout-inquiry="handleCheckoutInquiry"
        @new-messages-received="handleNewMessagesReceived" />
    </div>
  </div>
</template>

<script>
import InquiryDetailPanel from './InquiryDetailPanel.vue';

export default {
  name: 'InquiryPanel',
  components: {
    InquiryDetailPanel
  },
  props: {
    inquiredProductIds: {
      type: Set,
      default: () => new Set()
    }
  },
  data() {
    return {
      inquiries: [],
      activeInquiryId: null,
      maxCustomInquiries: 10, // custom类型询价单限制
      // Scroll control data
      showScrollArrows: false,
      canScrollUp: false,
      canScrollDown: false,
      scrollInterval: null,
      // Tab control data
      activeTab: 'unpaid', // 'paid' or 'unpaid'
      // 定时刷新
      refreshTimer: null,
      // 编辑询价单
      editingInquiry: null,
      editInquiryTitle: ''
    };
  },
  computed: {
    activeInquiry() {
      return this.inquiries.find(inquiry => inquiry.id === this.activeInquiryId);
    },
    
    canAddNewInquiry() {
      // 计算未支付的custom类型询价单数量
      const unpaidCustomInquiries = this.inquiries.filter(inquiry => 
        inquiry.status !== 'paid' && inquiry.inquiry_type === 'custom'
      );
      
      // custom类型限制10个未支付询价单，single类型不限制
      return unpaidCustomInquiries.length < this.maxCustomInquiries;
    },
    
    filteredInquiries() {
      return this.inquiries.filter(inquiry => {
        if (this.activeTab === 'paid') {
          return inquiry.status === 'paid';
        } else {
          return inquiry.status !== 'paid';
        }
      });
    },
    
    // 计算当前标签页的总未读消息数
    totalUnreadCount() {
      return this.filteredInquiries.reduce((total, inquiry) => {
        return total + (parseInt(inquiry.unread_count) || 0);
      }, 0);
    }
  },
  mounted() {
    this.initializeInquiries();
    this.checkScrollNeed();
    
    // 启动定时刷新，每30秒刷新一次
    this.refreshTimer = setInterval(() => {
      this.refreshInquiriesData();
    }, 30000);
  },
  updated() {
    this.checkScrollNeed();
  },
  beforeUnmount() {
    // 清理定时器
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    // 清理滚动定时器
    this.stopScrolling();
  },
  methods: {
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    
    async initializeInquiries() {
      await this.fetchInquiries();
    },
    
    async refreshInquiries() {
      try {
        //MessageHandler.showInfo(this.$t('cart.refreshingInquiries') || '正在刷新询价单...', 'INQUIRY.REFRESHING');
        await this.fetchInquiries();
        
        // 如果有激活的询价单，也刷新详情面板
        if (this.activeInquiryId && this.$refs.inquiryDetailPanel) {
          await this.$refs.inquiryDetailPanel.fetchInquiryDetails();
        }
        
        //MessageHandler.showSuccess(this.$t('cart.inquiriesRefreshed') || '询价单已刷新', 'INQUIRY.REFRESHED');
      } catch (error) {
        console.error('刷新询价单失败:', error);
        this.$messageHandler.showError(this.$t('cart.refreshInquiriesFailed') || '刷新询价单失败', 'INQUIRY.REFRESH.FAILED');
      }
    },
    
    async fetchInquiries() {
      try {
        const { $api } = useNuxtApp()
        const response = await $api.getWithErrorHandler('/inquiries', {
          fallbackKey: 'INQUIRY.FETCH.FAILED'
        });
        
        if (response.success) {
          this.inquiries = response.data.inquiries;
          this.inquiries.message = [];
          this.inquiries.newMessage = '';
          /*this.inquiries = response.data.inquiries.map(inquiry => ({
            id: inquiry.id,
            name: inquiry.title,
            title: inquiry.title,
            status: inquiry.status,
            inquiry_type: inquiry.inquiry_type || 'custom', // 默认为custom类型
            unread_count: inquiry.unread_count || 0, // 添加未读消息数
            items: (inquiry.items || []).map(item => ({
              id: item.id,
              productId: item.product_id,
              product_id: item.product_id,
              name: item.product_name,
              product_name: item.product_name,
              imageUrl: item.image_url || require('@/assets/images/default-image.svg'),
              image_url: item.image_url,
              quantity: item.quantity,
              unit_price: item.unit_price,
              price: item.price || item.unit_price,
              price_ranges: item.price_ranges
            })),
            messages: [],
            newMessage: ''
          }));*/
          
          // 更新已询价商品ID集合并通知父组件
          const updatedInquiredProductIds = new Set();
          this.inquiries.forEach(inquiry => {
            inquiry.items.forEach(item => {
              updatedInquiredProductIds.add(item.productId);
            });
          });
          this.$emit('update-inquired-products', updatedInquiredProductIds);
          
          // 如果有询价单，设置第一个为活跃状态并加载详情
          if (this.inquiries.length > 0) {
            this.activeInquiryId = this.inquiries[0].id;
          }
        }
      } catch (error) {
        console.error('获取询价列表失败:', error);
      }
    },
    
    async addInquiry() {
      // 检查custom类型未支付询价单数量限制
      const unpaidCustomInquiries = this.inquiries.filter(inquiry => 
        inquiry.status !== 'paid' && inquiry.inquiry_type === 'custom'
      );
      
      if (unpaidCustomInquiries.length >= this.maxCustomInquiries) {
        this.$messageHandler.showWarning(
          this.$t('cart.maxCustomInquiriesReached') || `最多只能创建 ${this.maxCustomInquiries} 个未支付的custom类型询价单`, 
          'cart.warning.maxCustomInquiriesReached'
        );
        return null;
      }
      
      try {
        const titlePrefix = this.$t('cart.inquiryTitlePrefix') || '询价单';
        const { $api } = useNuxtApp()
        const response = await $api.postWithErrorHandler('/inquiries', {
          titlePrefix: titlePrefix
        }, {
          fallbackKey: 'INQUIRY.CREATE.FAILED'
        });
        
        if (response.success) {
          const newInquiry = {
            id: response.data.id,
            name: response.data.title,
            items: [],
            messages: [],
            newMessage: ''
          };
          
          this.inquiries.unshift(newInquiry);
          this.activeInquiryId = newInquiry.id;
          
          //MessageHandler.showSuccess(this.$t('inquiry.createSuccess') || '询价单创建成功');
          this.$emit('inquiry-created', newInquiry.id);
          return newInquiry.id;
        }
      } catch (error) {
        console.error('创建询价单失败:', error);
        return null;
      }
    },
    
    async confirmDeleteInquiry(inquiryId) {
      try {
        await this.$messageHandler.confirm({
          message: this.$t('cart.deleteInquiryConfirm') || '确定要删除这个询价单吗？',
          translationKey: 'cart.deleteInquiryConfirm'
        });
        this.deleteInquiry(inquiryId);
      } catch {
        // User cancelled
      }
    },
    
    async deleteInquiry(inquiryId) {
      try {
        const { $api } = useNuxtApp()
        const response = await $api.deleteWithErrorHandler(`/inquiries/${inquiryId}`, {
          fallbackKey: 'INQUIRY.DELETE.FAILED'
        });
        
        if (response.success) {
          const inquiryIndex = this.inquiries.findIndex(inquiry => inquiry.id === inquiryId);
          if (inquiryIndex !== -1) {
            const inquiry = this.inquiries[inquiryIndex];
            
            // Remove products from inquired set and notify parent
            const updatedInquiredProductIds = new Set(this.inquiredProductIds);
            inquiry.items.forEach(item => {
              updatedInquiredProductIds.delete(item.productId);
            });
            this.$emit('update-inquired-products', updatedInquiredProductIds);
            
            this.inquiries.splice(inquiryIndex, 1);
            
            // Switch to first inquiry if current was deleted
            if (this.activeInquiryId === inquiryId) {
              this.activeInquiryId = this.inquiries[0]?.id || null;
            }
            
            //MessageHandler.showSuccess(this.$t('inquiry.deleteSuccess') || '询价单删除成功');
          }
        }
      } catch (error) {
        console.error('删除询价单失败:', error);
      }
    },

    startEditInquiry(inquiry) {
      this.editingInquiry = inquiry.id;
      this.editInquiryTitle = inquiry.title;
    },

    cancelEditInquiry() {
      this.editingInquiry = null;
      this.editInquiryTitle = '';
    },

    async saveInquiryTitle(inquiryId) {
      if (!this.editInquiryTitle.trim()) {
        this.$messageHandler.showWarning('询价单名称不能为空');
        return;
      }

      try {
        const { $api } = useNuxtApp()
        const response = await $api.putWithErrorHandler(`/inquiries/${inquiryId}`, {
          title: this.editInquiryTitle.trim()
        }, {
          fallbackKey: 'INQUIRY.UPDATE.FAILED'
        });

        if (response.success) {
          const inquiry = this.inquiries.find(inq => inq.id === inquiryId);
          if (inquiry) {
            inquiry.title = this.editInquiryTitle.trim();
          }
          this.editingInquiry = null;
          this.editInquiryTitle = '';
        }
      } catch (error) {
        console.error('修改询价单名称失败:', error);
      }
    },
    
    async switchTab(inquiryId) {
      this.activeInquiryId = inquiryId;
      
      // 标记该询价单的消息为已读
      await this.markInquiryMessagesAsRead(inquiryId);

    },
    
    async addToInquiry(cartItem) {
      // 如果没有激活的询价单，自动创建一个
      if (!this.activeInquiryId || this.inquiries.length === 0) {
        const newInquiryId = await this.addInquiry();
        if (!newInquiryId) {
          return;
        }
      }
      
      if (this.inquiredProductIds.has(cartItem.product_id)) {
        this.$messageHandler.showWarning(this.$t('cart.productAlreadyInInquiry') || `商品 "${cartItem.name}" 已在其他询价单中`, 'cart.warning.productAlreadyInInquiry');
        return;
      }
      console.log('cartItem',cartItem);
      try {
        const { $api } = useNuxtApp()
        const response = await $api.postWithErrorHandler(`/inquiries/${this.activeInquiryId}/items`, {
          productId: cartItem.product_id,
          quantity: cartItem.quantity || 1,
          unitPrice: cartItem.price
        }, {
          fallbackKey: 'INQUIRY.ADD_ITEM.FAILED'
        });
        
        if (response.success) {
          const activeInquiry = this.inquiries.find(inquiry => inquiry.id === this.activeInquiryId);
          if (activeInquiry) {
            const inquiryItem = response.data;

            activeInquiry.items.push(inquiryItem);
            console.log('activeInquiry is :', activeInquiry);
            // 更新已询价商品ID集合并通知父组件
            const updatedInquiredProductIds = new Set(this.inquiredProductIds);
            updatedInquiredProductIds.add(cartItem.product_id);
            this.$emit('update-inquired-products', updatedInquiredProductIds);
            
            //MessageHandler.showSuccess(this.$t('cart.productAddedToInquiry') || `商品 "${cartItem.name}" 已添加到询价单`);
          }
        }
      } catch (error) {
        console.error('添加商品到询价单失败:', error);
      }
    },
    
    async addMultipleToInquiry(cartItems) {
      if (!cartItems || cartItems.length === 0) {
        return;
      }
      
      // 如果没有激活的询价单，自动创建一个
      if (!this.activeInquiryId || this.inquiries.length === 0) {
        const newInquiryId = await this.addInquiry();
        if (!newInquiryId) {
          return;
        }
      }
      
      // 获取当前询价单中已有的商品ID
      const activeInquiry = this.inquiries.find(inquiry => inquiry.id === this.activeInquiryId);
      if (activeInquiry.inquiry_type === 'single') {
        console.log('This is single inquiry');
        return;
      }
      const currentInquiryProductIds = new Set(
        activeInquiry ? activeInquiry.items.map(item => item.productId) : []
      );
      
      // 过滤掉当前询价单中已存在的商品
      const itemsToAdd = cartItems.filter(item => !currentInquiryProductIds.has(item.product_id));
      
      if (itemsToAdd.length === 0) {
        this.$messageHandler.showWarning(
          this.$t('cart.allSelectedInCurrentInquiry') || '所选商品都已在当前询价单中',
          'CART.ALL_SELECTED_IN_CURRENT_INQUIRY'
        );
        return;
      }
      
      if (itemsToAdd.length < cartItems.length) {
        const skippedCount = cartItems.length - itemsToAdd.length;
        this.$messageHandler.showInfo(
          this.$t('cart.someItemsSkippedInCurrentInquiry', { count: skippedCount }) || `${skippedCount}个商品已在当前询价单中，将跳过`,
          'CART.SOME_ITEMS_SKIPPED_IN_CURRENT_INQUIRY'
        );
      }
      
      //let successCount = 0;
      let failedItems = [];
      console.log('addMultipleToInquiry:',itemsToAdd)
      for (const cartItem of itemsToAdd) {
        try {
          const { $api } = useNuxtApp()
          const response = await $api.post(`/inquiries/${this.activeInquiryId}/items`, {
            productId: cartItem.product_id,
            quantity: cartItem.quantity || 1,
            unitPrice: cartItem.price
          }, {
            fallbackKey: 'INQUIRY.ADD_ITEM.FAILED'
          });
          
          if (response.success) {
            if (activeInquiry) {
              const inquiryItem = {
                id: response.data.id,
                product_id: response.data.product_id,
                product_name: response.data.product_name,
                image_url: response.data.image_url || '/images/default-image.svg',
                quantity: response.data.quantity,
                unit_price: response.data.unit_price,
                price_ranges: response.data.price_ranges || []
              };
              
              activeInquiry.items.push(inquiryItem);
              
              // 立即通知 InquiryDetailPanel 添加新商品
              if (this.$refs.inquiryDetailPanel && this.$refs.inquiryDetailPanel.inquiry && this.$refs.inquiryDetailPanel.inquiry.id === this.activeInquiryId) {
                this.$refs.inquiryDetailPanel.inquiry.items.push(inquiryItem);
              }
              
              // 更新已询价商品ID集合
              const updatedInquiredProductIds = new Set(this.inquiredProductIds);
              updatedInquiredProductIds.add(cartItem.product_id);
              this.$emit('update-inquired-products', updatedInquiredProductIds);
              
              //successCount++;
            }
          }
        } catch (error) {
          console.error(`添加商品 ${cartItem.name} 到询价单失败:`, error);
          failedItems.push(cartItem.name);
        }
      }
      
      // 移除批量刷新，因为现在每个商品添加后都会立即更新
      // 显示结果消息
      //if (successCount > 0) {
        //MessageHandler.showSuccess(
          //this.$t('cart.multipleItemsAddedToInquiry', { count: successCount }) || `成功添加 ${successCount} 个商品到询价单`
        //);
      //}
      
      /*if (failedItems.length > 0) {
        this.$messageHandler.showWarning(
          this.$t('cart.someItemsFailedToAdd', { items: failedItems.join(', ') }) || `以下商品添加失败: ${failedItems.join(', ')}`,
          'INQUIRY.ADD_MULTIPLE_ITEMS.PARTIAL_FAILED'
        );
      }*/
    },
    
    // 处理添加商品事件
    handleItemAdded(newItem) {
      const activeInquiry = this.inquiries.find(inquiry => inquiry.id === this.activeInquiryId);
      if (activeInquiry) {
        activeInquiry.items.push(newItem);
        
        // 更新已询价商品ID集合并通知父组件
        const updatedInquiredProductIds = new Set(this.inquiredProductIds);
        updatedInquiredProductIds.add(newItem.productId);
        this.$emit('update-inquired-products', updatedInquiredProductIds);
      }
    },
    
    // 处理商品删除事件（仅更新已询价商品ID集合）
    handleItemRemoved(inquiryId, itemId, productId) {
      // 从前端数据中移除商品
      const inquiry = this.inquiries.find(inquiry => inquiry.id === inquiryId);
      if (inquiry) {
        const itemIndex = inquiry.items.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
          inquiry.items.splice(itemIndex, 1);
          
          // 更新已询价商品ID集合并通知父组件
          const updatedInquiredProductIds = new Set(this.inquiredProductIds);
          updatedInquiredProductIds.delete(productId);
          this.$emit('update-inquired-products', updatedInquiredProductIds);
        }
      }
    },
    

    
    updateInquiryMessage(inquiryId, message) {
      console.log('更新询价消息', inquiryId, message);
      /*const inquiry = this.inquiries.find(inq => inq.id === inquiryId);
      if (inquiry) {
        inquiry.newMessage = message;
      }*/
    },
    
    // 处理新消息接收事件
    handleNewMessagesReceived(newMessages) {
      console.log('处理新消息接收事件', newMessages);
      /*if (!newMessages || newMessages.length === 0) return;
      
      // 更新当前活跃的询价单
      const activeInquiry = this.inquiries.find(inquiry => inquiry.id === this.activeInquiryId);
      if (activeInquiry) {
        activeInquiry.messages.push(...newMessages);
      }*/
    },
    
   
    // 滚动控制方法
    checkScrollNeed() {
      this.$nextTick(() => {
        const wrapper = this.$refs.inquiryListWrapper;
        const list = this.$refs.inquiryList;
        if (!wrapper || !list) return;

        this.showScrollArrows = list.scrollHeight > wrapper.clientHeight;
        this.updateScrollButtons();

        // 添加滚动事件监听
        wrapper.addEventListener('scroll', this.updateScrollButtons);
      });
    },
    
    updateScrollButtons() {
      const wrapper = this.$refs.inquiryListWrapper;
      if (!wrapper) return;

      this.canScrollUp = wrapper.scrollTop > 0;
      this.canScrollDown = wrapper.scrollTop < (wrapper.scrollHeight - wrapper.clientHeight);
    },

    startScrolling(direction) {
      this.stopScrolling(); // 清除之前的定时器
      
      const wrapper = this.$refs.inquiryListWrapper;
      if (!wrapper) return;

      this.scrollInterval = setInterval(() => {
        const scrollAmount = 2; // 每次滚动的像素
        if (direction === 'up') {
          wrapper.scrollTop -= scrollAmount;
          if (wrapper.scrollTop <= 0) {
            this.stopScrolling();
          }
        } else {
          wrapper.scrollTop += scrollAmount;
          if (wrapper.scrollTop >= wrapper.scrollHeight - wrapper.clientHeight) {
            this.stopScrolling();
          }
        }
        this.updateScrollButtons();
      }, 16); // 约60fps
    },

    stopScrolling() {
      if (this.scrollInterval) {
        clearInterval(this.scrollInterval);
        this.scrollInterval = null;
      }
    },
    
    // 处理询价单Checkout事件
    handleCheckoutInquiry(inquiryId) {
       console.log('处理询价单Checkout事件', inquiryId);
    },
    
    // 切换支付状态tab
    switchPaymentTab(tab) {
      this.activeTab = tab;
      
      // 如果当前激活的询价单不在新的过滤列表中，切换到第一个可用的询价单
      const filteredInquiries = this.inquiries.filter(inquiry => {
        if (tab === 'paid') {
          return inquiry.status === 'paid';
        } else {
          return inquiry.status !== 'paid';
        }
      });
      
      if (filteredInquiries.length > 0) {
        const currentInquiryInFilter = filteredInquiries.find(inquiry => inquiry.id === this.activeInquiryId);
        if (!currentInquiryInFilter) {
          this.switchTab(filteredInquiries[0].id);
        }
      } else {
        this.activeInquiryId = null;
      }
    },
    
    // 设置活跃的tab（供外部调用）
    setActiveTab(tab) {
      this.switchPaymentTab(tab);
    },
    
    // 根据ID选择询价单（供外部调用）
    async selectInquiryById(inquiryId) {
      const targetInquiry = this.inquiries.find(inquiry => inquiry.id == inquiryId);
      if (targetInquiry) {
        // 根据询价单状态切换到对应的tab
        if (targetInquiry.status === 'paid') {
          this.switchPaymentTab('paid');
        } else {
          this.switchPaymentTab('unpaid');
        }
        
        // 切换到指定的询价单
        await this.switchTab(inquiryId);
        
        return true;
      }
      return false;
    },
    
    // 标记询价单消息为已读
    async markInquiryMessagesAsRead(inquiryId) {
      try {
        const { $api } = useNuxtApp()
        const response = await $api.putWithErrorHandler(`/inquiries/${inquiryId}/messages/read`, {}, {
          fallbackKey: 'INQUIRY.MARK_READ.FAILED'
        });
        
        if (response.success) {
          // 更新本地数据，将该询价单的未读消息数设为0
          const inquiry = this.inquiries.find(inq => inq.id === inquiryId);
          if (inquiry) {
            inquiry.unread_count = 0;
          }
        }
      } catch (error) {
        console.error('标记消息为已读失败:', error);
      }
    },
    
    // 定时刷新询价数据（保持当前选中状态）
    async refreshInquiriesData() {
      try {
        console.log('开始定时刷新询价数据...');
        const currentActiveId = this.activeInquiryId;
        const { $api } = useNuxtApp()
        const response = await $api.getWithErrorHandler('/inquiries', {
          fallbackKey: 'INQUIRY.FETCH.FAILED'
        });
        
        
        
        if (response.success) {
          // 创建新的询价数据映射
          const newInquiriesData = response.data.inquiries;
          
                    
          // 更新现有询价数据或添加新的询价
          newInquiriesData.forEach(newInquiry => {
            const existingIndex = this.inquiries.findIndex(inq => inq.id === newInquiry.id);
            if (existingIndex !== -1) {
              //console.log(`询价单 ${newInquiry.id} 未读消息数: ${this.inquiries[existingIndex].unread_count} -> ${newInquiry.unread_count}`);
              
              // 在Vue 3中直接更新对象属性
              Object.assign(this.inquiries[existingIndex], newInquiry);
            } else {
              // 添加新的询价
              //console.log(`添加新询价单 ${newInquiry.id}, 未读消息数: ${newInquiry.unread_count}`);
              this.inquiries.push(newInquiry);
            }
          });
          
          // 移除不存在的询价
          const newInquiryIds = new Set(newInquiriesData.map(inq => inq.id));
          this.inquiries = this.inquiries.filter(inq => newInquiryIds.has(inq.id));
          
          // 保持当前选中的inquiry不变
          if (currentActiveId && this.inquiries.find(inq => inq.id === currentActiveId)) {
            this.activeInquiryId = currentActiveId;
          } else if (this.inquiries.length > 0) {
            // 如果当前选中的inquiry不存在了，选择第一个
            this.activeInquiryId = this.inquiries[0].id;
          }
        }
      } catch (error) {
        console.error('定时刷新询价数据失败:', error);
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@use '~/assets/styles/_variables.scss' as *;
@use '~/assets/styles/_mixins.scss' as *;

/* 询价单区域样式 */
.inquiries-section {
  margin-top: $spacing-xl;
  padding: $spacing-lg;
  background: $background-light;
  border-radius: $border-radius-md;
}

.inquiries-title {
  font-size: $font-size-2xl;
  font-weight: $font-weight-semibold;
  color: $text-primary;
  margin-bottom: $spacing-lg;
  text-align: center;
}

.inquiry-layout {
  display: flex;
  gap: $spacing-lg;
  height: 600px;
}

/* 询价单侧边栏 */
.inquiry-sidebar {
  flex: 0 0 220px;
  background: $white;
  border-radius: $border-radius-md;
  box-shadow: $shadow-md;
  display: flex;
  flex-direction: column;
}

.inquiry-list-header {
  padding: $spacing-md;
  border-bottom: $border-width-sm solid $border-light;
}

.header-buttons {
  display: flex;
  gap: $spacing-xs;
  align-items: center;
}

.add-inquiry-btn {
  flex: 1;
  padding: $spacing-sm;
  background: $info-color;
  color: $white;
  border: none;
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-xs;
  transition: $transition-base;
  min-width: 0; // 允许按钮收缩
}

.add-inquiry-btn:hover:not(:disabled) {
  background: $info-dark;
}

.add-inquiry-btn:disabled {
  background: $gray-300;
  cursor: not-allowed;
}

.refresh-btn {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  padding: 0;
  background: $success-color;
  color: $white;
  border: none;
  border-radius: $border-radius-sm;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: $transition-base;
}

.refresh-btn:hover {
  background: $success-dark;
}

.refresh-btn .material-icons {
  font-size: $font-size-lg;
}

.inquiry-list-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Tab切换样式 */
.inquiry-tabs {
  display: flex;
  border-bottom: $border-width-sm solid $border-light;
  background: $white;
}

.tab-btn {
  flex: 1;
  padding: $spacing-sm $spacing-md;
  background: none;
  border: none;
  color: $text-secondary;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  cursor: pointer;
  transition: $transition-base;
  border-bottom: 2px solid transparent;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-xs;
}

.tab-btn:hover {
  color: $text-primary;
  background: $background-light;
}

.tab-btn.active {
  color: $info-color;
  border-bottom-color: $info-color;
  background: $white;
}

.tab-unread-badge {
  background: $error-color;
  color: white;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  margin-left: $spacing-xs;
}

.inquiry-list-wrapper {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
  /* 填充整个容器高度 */
  position: relative;
  /* 隐藏滚动条 */
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* IE and Edge */
}

.inquiry-list-wrapper::-webkit-scrollbar {
  display: none;
  /* Chrome, Safari and Opera */
}

.inquiry-list {
  padding: 0;
  margin: 0;
}

.inquiry-list-item {
  margin-bottom: $spacing-sm;
  padding: $spacing-sm;
  background: $background-light;
  border: 2px solid transparent;
  border-radius: $border-radius-md;
  cursor: pointer;
  transition: $transition-slow;
}

.inquiry-list-item:hover {
  background: $gray-200;
  border-color: $info-color;
}

.inquiry-list-item.active {
  background: $info-light;
  border-color: $info-color;
}

.inquiry-item-content {
  width: 100%;
}

.inquiry-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-xs;
}

.inquiry-item-title {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $text-primary;
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inquiry-item-actions {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.unread-badge {
  background: $error-color;
  color: white;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.delete-inquiry-btn {
  background: none;
  border: none;
  color: $error-color;
  cursor: pointer;
  padding: $spacing-xs;
  border-radius: $border-radius-xs;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: $transition-base;
}

.delete-inquiry-btn:hover {
  background: rgba($error-color, 0.1);
}

.delete-inquiry-btn .material-icons {
  font-size: $font-size-lg;
}

.edit-inquiry-btn {
  background: none;
  border: none;
  color: $info-color;
  cursor: pointer;
  padding: $spacing-xs;
  border-radius: $border-radius-xs;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: $transition-base;
}

.edit-inquiry-btn:hover {
  background: rgba($info-color, 0.1);
}

.edit-inquiry-btn .material-icons {
  font-size: $font-size-lg;
}

.inquiry-edit-form {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  width: 100%;
}

.inquiry-title-input {
  flex: 1;
  padding: $spacing-xs;
  border: 1px solid $gray-300;
  border-radius: $border-radius-xs;
  font-size: $font-size-sm;
  outline: none;
  transition: $transition-base;
}

.inquiry-title-input:focus {
  border-color: $info-color;
  box-shadow: 0 0 0 2px rgba($info-color, 0.2);
}

.inquiry-edit-actions {
  display: flex;
  gap: $spacing-xs;
}

.save-btn,
.cancel-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: $spacing-xs;
  border-radius: $border-radius-xs;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: $transition-base;
}

.save-btn {
  color: $success-color;
}

.save-btn:hover {
  background: rgba($success-color, 0.1);
}

.cancel-btn {
  color: $error-color;
}

.cancel-btn:hover {
  background: rgba($error-color, 0.1);
}

.save-btn .material-icons,
.cancel-btn .material-icons {
  font-size: $font-size-lg;
}

.inquiry-title-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.inquiry-item-preview {
  margin-top: $spacing-xs;
}

.inquiry-products-preview {
  display: flex;
  gap: 3px;
  align-items: center;
  flex-wrap: wrap;
}

.preview-product {
  width: 28px;
  height: 28px;
  border-radius: 3px;
  overflow: hidden;
  border: $border-width-sm solid $gray-300;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.more-products {
  font-size: $font-size-xs;
  color: $text-secondary;
  background: $gray-200;
  padding: 2px 6px;
  border-radius: $border-radius-xs;
  white-space: nowrap;
}

.no-inquiries {
  text-align: center;
  padding: $spacing-4xl $spacing-lg;
  color: $text-secondary;
}

/* 滚动箭头样式 */
.scroll-arrows {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.scroll-arrow {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 40px;
  background: rgba($info-color, 0.9);
  color: $white;
  border: none;
  border-radius: $border-radius-full;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: $transition-base;
  font-size: 20px;
  font-weight: bold;
  line-height: 1;
  pointer-events: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.scroll-arrow:hover:not(:disabled) {
  background: rgba($info-color, 1);
  transform: translateX(-50%) scale(1.1);
}

.scroll-arrow:disabled {
  background: rgba($black, 0.3);
  cursor: not-allowed;
  opacity: 0.5;
}

.scroll-arrow-up {
  top: 10px;
}

.scroll-arrow-up:hover:not(:disabled) {
  transform: translateX(-50%) scale(1.1);
}

.scroll-arrow-down {
  bottom: 10px;
}

.scroll-arrow-down:hover:not(:disabled) {
  transform: translateX(-50%) scale(1.1);
}



/* 响应式设计 */
@media (max-width: $breakpoint-mobile) {
  .inquiry-layout {
    flex-direction: column;
    gap: $spacing-md;
  }

  .inquiry-sidebar {
    flex: none;
    max-height: 300px;
  }
}
</style>