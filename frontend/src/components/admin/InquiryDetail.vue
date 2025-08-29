<template>
  <div class="inquiry-detail" v-loading="loading">
    <div v-if="inquiry" class="inquiry-content">
      <!-- 顶部信息区域 -->
      <div class="top-section">
        <!-- 询价基本信息 -->
        <el-card class="inquiry-info-card">
          <template #header>
            <div class="card-header">
              <span>{{ $t('inquiry.detail.title') || '询价详情' }}</span>
              <div class="header-actions">
                <el-tag :type="getStatusType(inquiry.status)">{{ getStatusText(inquiry.status) }}</el-tag>
              </div>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="info-item">
                <label>{{ $t('inquiry.detail.inquiry_id') || '询价单号' }}:</label>
                <span>{{ inquiry.user_inquiry_id }}</span>
              </div>
              <div class="info-item">
                <label>{{ $t('inquiry.detail.title') || '标题' }}:</label>
                <span>{{ inquiry.title }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>{{ $t('inquiry.detail.user') || '用户' }}:</label>
                <span>{{ inquiry.username }} ({{ inquiry.email }})</span>
              </div>
              <div class="info-item">
                <label>{{ $t('admin.inquiry.detail.phone') || '联系电话' }}:</label>
                <span>{{ inquiry.phone || $t('admin.inquiry.detail.noPhone') || '未提供' }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>{{ $t('admin.inquiry.detail.createdAt') || '创建时间' }}:</label>
                <span>{{ formatDate(inquiry.created_at) }}</span>
              </div>
              <div class="info-item">
                <label>{{ $t('admin.inquiry.detail.updatedAt') || '更新时间' }}:</label>
                <span>{{ formatDate(inquiry.updated_at) }}</span>
              </div>

            </el-col>
          </el-row>
        </el-card>
      </div>

      <!-- 主要内容区域 -->
      <div class="main-section">
        <!-- 左侧：商品列表 -->
        <div class="left-panel">
          <el-card class="inquiry-items-card">
            <template #header>
              <div class="products-header">
                <span class="products-title">{{ $t('inquiry.detail.products') || '商品列表' }} ({{ items.length }})</span>
                <span v-if="inquiry.update_price_time" class="last-quote-time">
                  {{ $t('admin.inquiry.detail.lastQuoteTime') || '上次报价时间' }}: {{ formatDate(inquiry.update_price_time) }}
                </span>
              </div>
            </template>
            <!-- 桌面端表格显示 -->
            <div class="items-table-container desktop-only">
              <el-table :data="items" stripe size="small" height="100%">
                <el-table-column :label="$t('inquiry.detail.product_name') || '商品名称'" min-width="180">
                  <template #default="{ row }">
                    <div class="product-info">
                      <img v-if="row.image_url" :src="row.image_url" :alt="row.product_name" class="product-image" />
                      <div class="product-details">
                        <div class="product-name">{{ row.product_name }}</div>
                        <div class="product-code">{{ $t('inquiry.detail.product_code') || '产品编号' }}: {{ row.product_code
                          }}</div>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column :label="$t('admin.inquiry.detail.originalPrice') || '原价'" width="100">
                  <template #default="{ row }">
                    {{ getPriceRangeDisplay(row) }}
                  </template>
                </el-table-column>
                <el-table-column :label="$t('inquiry.detail.quantity') || '数量'" width="80">
                  <template #default="{ row }">
                    <span>{{ row.quantity }}</span>
                  </template>
                </el-table-column>
                <el-table-column :label="$t('inquiry.detail.unit_price') || '单价'" width="130">
                  <template #default="{ row }">
                    <el-input-number v-model="row.unit_price" :min="0" :precision="2" :step="0.01" size="small"
                      @change="updateItemQuote(row)"
                      :disabled="inquiry.status === 'approved' || inquiry.status === 'rejected'" />
                  </template>
                </el-table-column>
                <el-table-column :label="$t('inquiry.detail.total_price') || '总价'" width="80">
                  <template #default="{ row }">
                    <span v-if="row.unit_price">${{ (row.quantity * row.unit_price).toFixed(2) }}</span>
                    <span v-else class="text-muted">{{ $t('admin.inquiry.detail.notQuoted') || '未报价' }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <!-- 手机端卡片显示 -->
            <div class="mobile-only">
              <div class="product-cards">
                <div v-for="item in items" :key="item.id" class="product-card">
                  <div class="product-card-left">
                    <div class="product-image">
                      <img :src="item.image_url || require('@/assets/images/default-image.svg')" :alt="item.product_name">
                    </div>
                  </div>
                  <div class="product-card-right">
                    <div class="product-info-top">
                      <div class="product-name">{{ item.product_name }}</div>
                      <div class="product-code">{{ $t('inquiry.detail.product_code') || '产品编号' }}: {{ item.product_code }}</div>
                      <div class="product-original-price">{{ $t('admin.inquiry.detail.originalPrice') || '原价' }}: {{ getPriceRangeDisplay(item) }}</div>
                    </div>
                    <div class="product-quote-section">
                      <div class="quantity-info">
                        <span class="field-label">{{ $t('inquiry.detail.quantity') || '数量' }}:</span>
                        <span class="field-value">{{ item.quantity }}</span>
                      </div>
                      <div class="price-input-section">
                        <label class="price-label">{{ $t('inquiry.detail.unit_price') || '单价' }}:</label>
                        <el-input-number 
                          v-model="item.unit_price" 
                          :min="0" 
                          :precision="2" 
                          :step="0.01" 
                          size="small"
                          @change="updateItemQuote(item)"
                          :disabled="inquiry.status === 'approved' || inquiry.status === 'rejected'"
                          class="mobile-price-input" />
                      </div>
                      <div class="total-price-section">
                        <span class="field-label">{{ $t('inquiry.detail.total_price') || '总价' }}:</span>
                        <span v-if="item.unit_price" class="field-value total-price">${{ (item.quantity * item.unit_price).toFixed(2) }}</span>
                        <span v-else class="field-value text-muted">{{ $t('admin.inquiry.detail.notQuoted') || '未报价' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 总计 -->
            <div class="total-section">
              <div class="total-item">
                <label>{{ $t('admin.inquiry.detail.totalOriginal') || '原价总计' }}:</label>
                <span>${{ totalOriginalPrice.toFixed(2) }}</span>
              </div>
              <div class="total-item">
                <label>{{ $t('admin.inquiry.detail.totalQuoted') || '报价总计' }}:</label>
                <span class="total-quoted">${{ totalQuotedPrice.toFixed(2) }}</span>
              </div>
              <div class="total-item" v-if="totalQuotedPrice > 0">
                <label>{{ $t('admin.inquiry.detail.discount') || '折扣' }}:</label>
                <span
                  :class="{ 'discount-positive': discountPercentage > 0, 'discount-negative': discountPercentage < 0 }">
                  {{ discountPercentage.toFixed(1) }}%
                </span>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 右侧：消息记录 -->
        <div class="right-panel">
          <el-card class="messages-card">
            <template #header>
              <span>{{ $t('inquiry.detail.messages') || '消息记录' }} ({{ messages.length }})</span>
            </template>

            <!-- 消息列表 -->
            <div class="messages-list" ref="messagesList">
              <div v-for="message in messages" :key="message.id" class="message-wrapper"
                :class="{ 'admin-message-wrapper': message.sender_type === 'admin', 'user-message-wrapper': message.sender_type === 'user' }">
                <div class="message-item"
                  :class="{ 'admin-message': message.sender_type === 'admin', 'user-message': message.sender_type === 'user' }">
                  <div class="message-header">
                    <span class="sender-name">
                      {{ message.sender_type === 'admin' ? ($t('common.admin') || '管理员') : (message.sender_name ||
                      $t('common.customer') || '客户') }}
                    </span>
                    <span class="message-time">{{ formatDate(message.created_at) }}</span>
                  </div>
                  <div class="message-content">{{ message.message }}</div>
                </div>
              </div>
              <div v-if="messages.length === 0" class="no-messages">
                {{ $t('admin.inquiry.detail.noMessages') || '暂无消息记录' }}
              </div>
            </div>

            <!-- 发送消息 -->
            <div class="send-message-section">
              <el-input v-model="newMessage" type="textarea" :rows="2"
                :placeholder="$t('inquiry.detail.message_placeholder') || '输入回复消息...'"
                :disabled="inquiry.status === 'approved' || inquiry.status === 'rejected'" />
              <div class="send-actions">
                <el-button type="primary" size="small" @click="sendMessage"
                  :disabled="!newMessage.trim() || inquiry.status === 'approved' || inquiry.status === 'rejected'"
                  :loading="sendingMessage">
                  {{ $t('inquiry.detail.send_message') || '发送消息' }}
                </el-button>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import InquiryPolling from '@/utils/inquiryPolling';
import {getPriceByRange, getPriceRangeDisplayUtil } from '@/utils/priceUtils';

export default {
  name: 'InquiryDetail',
  props: {
    inquiryId: {
      type: [String, Number],
      required: true
    }
  },
  emits: ['status-updated', 'quote-updated'],
  beforeUnmount() {
    // 清理可能的异步操作
    this.loading = false
    this.sendingMessage = false
    this.cleanupPolling();
  },
  data() {
    return {
      loading: false,
      inquiry: null,
      items: [],
      messages: [],
      newMessage: '',
      sendingMessage: false,
      pollingConnection: null
    }
  },
  computed: {
     totalOriginalPrice() {
       if (!this.items || this.items.length === 0) {
         return 0
       }
       return this.items.reduce((total, item) => {
         // 使用getPriceByRange计算出的价格
         const priceRange = getPriceByRange(item)
         return total + (priceRange * item.quantity)
       }, 0)
     },
    
    totalQuotedPrice() {
      return this.items.reduce((total, item) => {
        if (item.unit_price) {
          return total + (item.quantity * item.unit_price)
        } 
        const priceRange = getPriceByRange(item)
         return total + (priceRange * item.quantity)

      }, 0)
    },
    
    discountPercentage() {
      if (this.totalOriginalPrice === 0) return 0
      return ((this.totalOriginalPrice - this.totalQuotedPrice) / this.totalOriginalPrice) * 100
    }
  },
  mounted() {
    this.initPolling();
  },

  watch: {
    inquiryId: {
      immediate: true,
      handler(newId, oldId) {
        // 停止之前的轮询
        if (oldId && this.pollingConnection) {
          this.pollingConnection.stopPolling(oldId);
        }
        
        if (newId) {
          this.loadInquiryDetail();
        }
      }
    }
  },
  methods: {
    async loadInquiryDetail() {
      this.loading = true
      try {
        const response = await this.$api.getWithErrorHandler(`/admin/inquiries/${this.inquiryId}`, {
          fallbackKey: 'admin.inquiry.error.loadDetailFailed'
        })
        
        this.inquiry = response.data.inquiry
        this.items = response.data.items
        this.messages = response.data.messages
        
        // 标记消息为已读
        await this.markMessagesAsRead()
        
        // 滚动到消息底部
        this.$nextTick(() => {
          // 确保组件仍然挂载
          if (this.$el) {
            this.scrollToBottom()
          }
        })
        
        // 在数据加载完成后启动轮询
        this.startCurrentInquiryPolling();
      } catch (error) {
        // 错误已经被统一处理
      } finally {
        this.loading = false
      }
    },
    
    async updateStatus(newStatus) {
      try {
        await this.$api.putWithErrorHandler(`/admin/inquiries/${this.inquiryId}/status`, {
          status: newStatus
        }, {
          fallbackKey: 'admin.inquiry.error.statusUpdateFailed'
        })
        
        this.inquiry.status = newStatus
        /*this.$messageHandler.showSuccess(
          this.$t('admin.inquiry.success.statusUpdated') || '状态更新成功',
          'admin.inquiry.success.statusUpdated'
        )*/
        this.$emit('status-updated')
      } catch (error) {
        // 错误已经被统一处理
      }
    },
    
    async updateItemQuote(item) {
      try {
        await this.$api.putWithErrorHandler(`/admin/inquiries/items/${item.id}/quote`, {
          quotedPrice: item.unit_price
        }, {
          fallbackKey: 'admin.inquiry.error.quoteUpdateFailed'
        })
        
        /*this.$messageHandler.showSuccess(
          this.$t('admin.inquiry.success.quoteUpdated') || '报价更新成功',
          'admin.inquiry.success.quoteUpdated'
        )*/
        this.$emit('quote-updated')
      } catch (error) {
        // 错误已经被统一处理
      }
    },
    
    async sendMessage() {
      if (!this.newMessage.trim()) return
      
      this.sendingMessage = true
      try {
        await this.$api.postWithErrorHandler(`/admin/inquiries/${this.inquiryId}/messages`, {
          content: this.newMessage.trim()
        }, {
          fallbackKey: 'admin.inquiry.error.messageSendFailed'
        })
        
        this.newMessage = ''
        // 重新加载消息列表
        await this.loadInquiryDetail()
        /*this.$messageHandler.showSuccess(
          this.$t('admin.inquiry.success.messageSent') || '消息发送成功',
          'admin.inquiry.success.messageSent'
        )*/
      } catch (error) {
        // 错误已经被统一处理
      } finally {
        this.sendingMessage = false
      }
    },
    
    scrollToBottom() {
      // 添加组件状态检查，避免在组件卸载时访问refs
      if (this.$el && this.$refs && this.$refs.messagesList) {
        const messagesList = this.$refs.messagesList
        try {
          messagesList.scrollTop = messagesList.scrollHeight
        } catch (error) {
          // 忽略在组件卸载过程中可能出现的错误
          console.warn('ScrollToBottom failed:', error)
        }
      }
    },
    
    // 长轮询相关方法
    initPolling() {
      try {
        // 创建 InquiryPolling 实例
        this.pollingConnection = new InquiryPolling();
        
        // 设置API实例
        this.pollingConnection.setApiInstance(this.$api);
        
        // 监听新消息
        this.pollingConnection.on('new_messages', (data) => {
          if (data.inquiryId === this.inquiry?.id) {
            this.handleNewMessages(data);
          }
        });
        
        // 监听轮询错误
        this.pollingConnection.on('polling_error', (error) => {
          console.error('轮询错误:', error);
        });
        
        console.log('长轮询初始化完成', this.pollingConnection);
        
      } catch (error) {
        console.error('初始化长轮询失败:', error);
      }
    },
    
    cleanupPolling() {
      if (this.pollingConnection && this.inquiry?.id) {
        this.pollingConnection.stopPolling(this.inquiry.id);
        this.pollingConnection = null;
      }
    },
    
    // 开始轮询当前询价单
    startCurrentInquiryPolling() {
      console.log('startCurrentInquiryPolling 被调用', {
        hasPollingConnection: !!this.pollingConnection,
        hasInquiry: !!this.inquiry,
        inquiryId: this.inquiry?.id,
        inquiryIdProp: this.inquiryId
      });
      
      if (this.pollingConnection && this.inquiry?.id) {
        console.log(`开始轮询询价单 ${this.inquiry.id}`);
        this.pollingConnection.startPolling(this.inquiry.id);
      } else {
        console.warn('无法启动轮询:', {
          pollingConnection: !!this.pollingConnection,
          inquiry: !!this.inquiry,
          inquiryId: this.inquiry?.id
        });
      }
    },
    
    handleNewMessages(data) {
      try {
        const { messages } = data;
        
        // 处理每条新消息
        messages.forEach(messageData => {
          // 构建消息对象
          const newMessage = {
            id: messageData.id,
            sender_id: messageData.sender_id,
            sender_type: messageData.sender_type,
            sender_name: messageData.sender_name,
            sender_email: messageData.sender_email,
            content: messageData.message,
            message_type: messageData.message_type || 'text',
            created_at: messageData.created_at
          };
          
          // 检查消息是否已存在（避免重复）
          const existingMessage = this.messages.find(msg => msg.id === newMessage.id);
          if (!existingMessage) {
            this.messages.push(newMessage);
            
            // 显示新消息提示（如果不是当前用户发送的）
            if (messageData.sender_id !== this.$store.state.user?.id) {
              this.$message.success(`收到来自 ${messageData.sender_name} 的新消息`);
            }
          }
        });
        
        // 滚动到底部
        this.$nextTick(() => {
          this.scrollToBottom();
        });
        
      } catch (error) {
        console.error('处理新消息失败:', error);
      }
    },
    
    getStatusType(status) {
      const statusMap = {
        inquiried: 'warning',
        approved: 'success',
        rejected: 'danger'
      }
      return statusMap[status] || 'info'
    },
    
    getStatusText(status) {
      const statusMap = {
        'inquiried': this.$t('inquiry.status.inquiried') || '已询价',
        'approved': this.$t('inquiry.status.approved') || '已批准',
        'rejected': this.$t('inquiry.status.rejected') || '已拒绝'
      }
      return statusMap[status] || status
    },
    
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    // 获取价格范围显示文本
    getPriceRangeDisplay(item) {
      const formatPrice = this.$store.getters.formatPrice;
      return getPriceRangeDisplayUtil(item, formatPrice);
    },
    
    async markMessagesAsRead() {
       try {
         await this.$api.putWithErrorHandler(`/admin/inquiries/${this.inquiryId}/messages/read`, {}, {
           fallbackKey: 'admin.inquiry.error.markReadFailed'
         })
         
         // 通知父组件更新数据
         this.$emit('messages-read')
       } catch (error) {
         // 错误已经被统一处理，不影响主流程
         console.warn('标记消息已读失败:', error)
       }
     }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_mixins.scss';

.inquiry-detail {
  height: 100%;
  display: flex;
  flex-direction: column;

  .inquiry-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .top-section {
    flex-shrink: 0;

    .inquiry-info-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;

          .status-actions {
            margin: 0;
          }
        }
      }

      .info-item {
        margin-bottom: 8px;

        label {
          display: inline-block;
          width: 80px;
          font-weight: 600;
          color: #606266;
          font-size: 12px;
        }

        span {
          color: #303133;
          font-size: 12px;
        }
      }
    }
  }

  .main-section {
    flex: 1;
    display: flex;
    gap: 15px;
    min-height: 0;

    .left-panel {
      flex: 1.2;
      display: flex;
      flex-direction: column;
      min-height: 0;

      .inquiry-items-card {
        height: 100%;
        display: flex;
        flex-direction: column;

        .el-card__body {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 15px;
          max-height: 400px;
          overflow-y: auto;
        }

        .products-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 15px;

          .products-title {
            font-weight: 600;
            color: #303133;
          }

          .last-quote-time {
            font-size: 12px;
            color: #909399;
            font-weight: normal;
          }
        }

        .desktop-only {
          @include mobile {
            display: none;
          }
        }

        .mobile-only {
          display: none;
          
          @include mobile {
            display: block;
          }
        }

        .items-table-container {
          flex: 1;
          min-height: 0;
        }

        .product-info {
          display: flex;
          align-items: center;

          .product-image {
            width: 24px;
            height: 24px;
            object-fit: cover;
            border-radius: 3px;
            margin-right: 6px;
          }

          .product-details {
            .product-name {
              font-weight: 600;
              color: #303133;
              margin-bottom: 2px;
              font-size: 12px;
            }

            .product-code {
              font-size: 11px;
              color: #909399;
            }
          }
        }

        // 手机端卡片样式
        .product-cards {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .product-card {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 12px;
          background: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: box-shadow 0.2s ease;
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;

          &:hover {
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          }
        }

        .product-card-left {
          width: 60px;
          flex-shrink: 0;

          .product-image {
            width: 60px;
            height: 60px;
            border-radius: 4px;
            overflow: hidden;

            img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
          }
        }

        .product-card-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
          overflow: hidden;
        }

        .product-info-top {
          .product-name {
            font-size: 14px;
            font-weight: 600;
            line-height: 1.4;
            margin-bottom: 6px;
            color: #333333;
          }

          .product-code {
            font-size: 12px;
            color: #666666;
            margin-bottom: 4px;
          }

          .product-original-price {
            font-size: 12px;
            color: #888888;
            font-weight: 500;
          }
        }

        .product-quote-section {
          display: flex;
          flex-direction: column;
          gap: 8px;

          .quantity-info,
          .total-price-section {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .field-label {
              font-size: 12px;
              color: #666666;
              font-weight: 500;
            }

            .field-value {
              font-size: 14px;
              font-weight: 600;
              color: #333333;

              &.total-price {
                color: #409eff;
              }

              &.text-muted {
                color: #999999;
                font-weight: normal;
              }
            }
          }

          .price-input-section {
            display: flex;
            align-items: center;
            gap: 8px;

            .price-label {
              font-size: 12px;
              color: #666666;
              font-weight: 500;
              min-width: 40px;
            }

            .mobile-price-input {
              flex: 1;
              max-width: 120px;
            }
          }
        }

        .text-muted {
          color: #c0c4cc;
        }

        .total-section {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #ebeef5;
          flex-shrink: 0;

          .total-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;

            label {
              font-weight: 600;
              color: #606266;
              font-size: 12px;
            }

            span {
              font-size: 12px;
            }

            .total-quoted {
              font-size: 14px;
              font-weight: 700;
              color: #409eff;
            }

            .discount-positive {
              color: #67c23a;
            }

            .discount-negative {
              color: #f56c6c;
            }
          }
        }
      }
    }

    .right-panel {
      flex: 0.8;
      display: flex;
      flex-direction: column;
      min-height: 0;

      .messages-card {
        height: 100%;
        display: flex;
        flex-direction: column;

        .el-card__body {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 15px;
        }

        .messages-list {
          flex: 1;
          overflow-y: auto;
          margin-bottom: 15px;
          padding-right: 5px;
          max-height: 400px;

          .message-wrapper {
            margin-bottom: 12px;
            display: flex;

            &.admin-message-wrapper {
              justify-content: flex-end;
            }

            &.user-message-wrapper {
              justify-content: flex-start;
            }

            .message-item {
              max-width: 70%;
              padding: 10px;
              border-radius: 12px;
              position: relative;

              &.admin-message {
                background-color: #409eff;
                color: white;
                border-bottom-right-radius: 4px;

                .message-header .sender-name {
                  color: #e6f3ff;
                }

                .message-header .message-time {
                  color: #b3d9ff;
                }

                .message-content {
                  color: white;
                }
              }

              &.user-message {
                background-color: #f5f7fa;
                color: #303133;
                border-bottom-left-radius: 4px;

                .message-header .sender-name {
                  color: #303133;
                }

                .message-header .message-time {
                  color: #909399;
                }

                .message-content {
                  color: #606266;
                }
              }

              .message-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 6px;

                .sender-name {
                  font-weight: 600;
                  font-size: 12px;
                }

                .message-time {
                  font-size: 11px;
                }
              }

              .message-content {
                line-height: 1.4;
                white-space: pre-wrap;
                font-size: 12px;
              }
            }
          }

          .no-messages {
            text-align: center;
            color: #c0c4cc;
            padding: 30px 0;
            font-size: 12px;
          }
        }

        .send-message-section {
          flex-shrink: 0;

          .send-actions {
            margin-top: 8px;
            text-align: right;
          }
        }
      }
    }

    // 移动端响应式样式已移至 @include mobile 中
  }
}

@include mobile {
  .inquiry-detail {
    .inquiry-content {
      gap: 10px;
    }

    .top-section {
      flex-direction: column;
      gap: 10px;
      
      .inquiry-info-card {
        .card-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;

          .header-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }
      }
    }

    .main-section {
      flex-direction: column;
      gap: 10px;
    }

    .left-panel {
      flex: none;
      height: auto;
      min-height: 300px;
      
      .inquiry-items-card {
        .el-card__body {
          padding: 10px;
        }

        .product-info {
          .product-image {
            width: 30px;
            height: 30px;
            margin-right: 6px;
          }

          .product-details {
            .product-name {
              font-size: 11px;
            }

            .product-code {
              font-size: 10px;
            }
          }
        }

        .total-section {
          margin-top: 10px;
          padding-top: 10px;

          .total-item {
            margin-bottom: 4px;

            label,
            span {
              font-size: 11px;
            }

            .total-quoted {
              font-size: 12px;
            }
          }
        }
      }
    }

    .right-panel {
      flex: none;
      height: 400px;
      min-height: 400px;
      display: block !important;
      
      .messages-card {
        height: 100%;
        display: flex;
        flex-direction: column;
        
        .el-card__body {
          padding: 10px;
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .messages-list {
          flex: 1;
          margin-bottom: 10px;
          overflow-y: auto;
          max-height: none;
          height: 100%;
          padding-right: 5px;
          width: 100%;
          box-sizing: border-box;

          .message-wrapper {
            margin-bottom: 8px;
            width: 100%;
            box-sizing: border-box;
            
            .message-item {
              padding: 8px;
              max-width: 75%;
              word-wrap: break-word;
              word-break: break-word;
              overflow-wrap: break-word;

              .message-header {
                margin-bottom: 4px;

                .sender-name {
                  font-size: 11px;
                }

                .message-time {
                  font-size: 10px;
                }
              }

              .message-content {
                font-size: 11px;
                line-height: 1.3;
                white-space: pre-wrap;
                word-wrap: break-word;
                word-break: break-word;
                overflow-wrap: break-word;
              }
            }

            &.admin-message-wrapper {
              margin-left: 5px;
            }

            &.user-message-wrapper {
              margin-right: 5px;
            }
          }

          .no-messages {
            padding: 20px 0;
            font-size: 11px;
            text-align: center;
          }
        }

        .send-message-section {
          flex-shrink: 0;
          
          .send-actions {
            margin-top: 6px;
          }
        }
      }
    }

    .inquiry-info-card {
      .info-item {
        label {
          width: 80px;
          font-size: 12px;
        }
      }

      .status-actions {
        .el-button-group {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;

          .el-button {
            flex: 1;
            min-width: 80px;
          }
        }
      }
    }

    .inquiry-items-card {
      .product-info {
        .product-image {
          width: 40px;
          height: 40px;
        }

        .product-details {
          .product-name {
            font-size: 14px;
          }

          .product-code {
            font-size: 11px;
          }
        }
      }
    }

    .messages-card {
      .messages-list {
        max-height: 300px;

        .message-item {
          &.admin-message {
            margin-left: 10px;
          }

          .message-header {
            .sender-name {
              font-size: 14px;
            }

            .message-time {
              font-size: 11px;
            }
          }

          .message-content {
            font-size: 14px;
          }
        }
      }
    }
  }
}
</style>