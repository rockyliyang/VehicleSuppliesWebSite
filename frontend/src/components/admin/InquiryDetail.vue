<template>
  <div class="inquiry-detail" v-loading="loading">
    <div v-if="inquiry">
      <!-- 询价基本信息 -->
      <el-card class="inquiry-info-card">
        <template #header>
          <div class="card-header">
            <span>{{ $t('inquiry.detail.title') || '询价详情' }}</span>
            <el-tag :type="getStatusType(inquiry.status)">{{ getStatusText(inquiry.status) }}</el-tag>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="info-item">
              <label>{{ $t('inquiry.detail.inquiry_id') || '询价单号' }}:</label>
              <span>{{ inquiry.user_inquiry_id }}</span>
            </div>
            <div class="info-item">
              <label>{{ $t('inquiry.detail.title') || '标题' }}:</label>
              <span>{{ inquiry.title }}</span>
            </div>
            <div class="info-item">
              <label>{{ $t('inquiry.detail.user') || '用户' }}:</label>
              <span>{{ inquiry.username }} ({{ inquiry.email }})</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <label>{{ $t('admin.inquiry.detail.phone') || '联系电话' }}:</label>
              <span>{{ inquiry.phone || $t('admin.inquiry.detail.noPhone') || '未提供' }}</span>
            </div>
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

        <!-- 状态操作 -->
        <div class="status-actions">
          <el-button-group>
            <el-button type="success" size="small" @click="updateStatus('approved')"
              :disabled="inquiry.status !== 'inquiried'">
              {{ $t('admin.inquiry.action.approve') || '批准' }}
            </el-button>
            <el-button type="danger" size="small" @click="updateStatus('rejected')"
              :disabled="inquiry.status !== 'inquiried'">
              {{ $t('admin.inquiry.action.reject') || '拒绝' }}
            </el-button>
          </el-button-group>
        </div>
      </el-card>

      <!-- 询价商品列表 -->
      <el-card class="inquiry-items-card">
        <template #header>
          <span>{{ $t('inquiry.detail.products') || '商品列表' }} ({{ items.length }})</span>
        </template>
        <el-table :data="items" stripe>
          <el-table-column :label="$t('inquiry.detail.product_name') || '商品名称'" min-width="200">
            <template #default="{ row }">
              <div class="product-info">
                <img v-if="row.image_url" :src="row.image_url" :alt="row.product_name" class="product-image" />
                <div class="product-details">
                  <div class="product-name">{{ row.product_name }}</div>
                  <div class="product-code">{{ $t('inquiry.detail.product_code') || '产品编号' }}: {{ row.product_code }}
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="$t('admin.inquiry.detail.originalPrice') || '原价'" width="100">
            <template #default="{ row }">
              ${{ Number(row.original_price).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column :label="$t('inquiry.detail.quantity') || '数量'" width="80">
            <template #default="{ row }">
              {{ row.quantity }}
            </template>
          </el-table-column>
          <el-table-column :label="$t('inquiry.detail.unit_price') || '单价'" width="120">
            <template #default="{ row }">
              <el-input-number v-model="row.unit_price" :min="0" :precision="2" :step="0.01" size="small"
                @change="updateItemQuote(row)" :disabled="inquiry.status === 'approved' || inquiry.status === 'rejected'" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('inquiry.detail.total_price') || '总价'" width="100">
            <template #default="{ row }">
              <span v-if="row.unit_price">${{ (row.quantity * row.unit_price).toFixed(2) }}</span>
              <span v-else class="text-muted">{{ $t('admin.inquiry.detail.notQuoted') || '未报价' }}</span>
            </template>
          </el-table-column>
        </el-table>

        <!-- 总计 -->
        <div class="total-section">
          <el-row>
            <el-col :span="12" :offset="12">
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
            </el-col>
          </el-row>
        </div>
      </el-card>

      <!-- 消息记录 -->
      <el-card class="messages-card">
        <template #header>
          <span>{{ $t('inquiry.detail.messages') || '消息记录' }} ({{ messages.length }})</span>
        </template>

        <!-- 消息列表 -->
        <div class="messages-list" ref="messagesList">
          <div v-for="message in messages" :key="message.id" class="message-item"
            :class="{ 'admin-message': message.sender_type === 'admin' }">
            <div class="message-header">
              <span class="sender-name">{{ message.sender_name || $t('admin.inquiry.detail.admin') || '管理员' }}</span>
              <span class="message-time">{{ formatDate(message.created_at) }}</span>
            </div>
            <div class="message-content">{{ message.message }}</div>
          </div>
          <div v-if="messages.length === 0" class="no-messages">
            {{ $t('admin.inquiry.detail.noMessages') || '暂无消息记录' }}
          </div>
        </div>

        <!-- 发送消息 -->
        <div class="send-message-section">
          <el-input v-model="newMessage" type="textarea" :rows="3"
            :placeholder="$t('inquiry.detail.message_placeholder') || '输入回复消息...'"
            :disabled="inquiry.status === 'approved' || inquiry.status === 'rejected'" />
          <div class="send-actions">
            <el-button type="primary" @click="sendMessage"
              :disabled="!newMessage.trim() || inquiry.status === 'approved' || inquiry.status === 'rejected'" :loading="sendingMessage">
              {{ $t('inquiry.detail.send_message') || '发送消息' }}
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import InquiryPolling from '@/utils/inquiryPolling';

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
      return this.items.reduce((total, item) => total + (item.quantity * item.original_price), 0)
    },
    
    totalQuotedPrice() {
      return this.items.reduce((total, item) => {
        if (item.unit_price) {
          return total + (item.quantity * item.unit_price)
        }
        return total
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
          // 开始新的轮询
          this.startCurrentInquiryPolling();
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
        
        // 滚动到消息底部
        this.$nextTick(() => {
          // 确保组件仍然挂载
          if (this.$el) {
            this.scrollToBottom()
          }
        })
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
        this.$messageHandler.showSuccess(
          this.$t('admin.inquiry.success.statusUpdated') || '状态更新成功',
          'admin.inquiry.success.statusUpdated'
        )
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
        
        this.$messageHandler.showSuccess(
          this.$t('admin.inquiry.success.quoteUpdated') || '报价更新成功',
          'admin.inquiry.success.quoteUpdated'
        )
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
        this.$messageHandler.showSuccess(
          this.$t('admin.inquiry.success.messageSent') || '消息发送成功',
          'admin.inquiry.success.messageSent'
        )
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
        this.pollingConnection = InquiryPolling;
        
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
        
        console.log('长轮询初始化完成');
        
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
      if (this.pollingConnection && this.inquiry?.id) {
        this.pollingConnection.startPolling(this.inquiry.id);
        console.log(`开始轮询询价单 ${this.inquiry.id}`);
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
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_mixins.scss';

.inquiry-detail {
  .inquiry-info-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .info-item {
      margin-bottom: 12px;

      label {
        display: inline-block;
        width: 100px;
        font-weight: 600;
        color: #606266;
      }

      span {
        color: #303133;
      }
    }

    .status-actions {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ebeef5;
    }
  }

  .inquiry-items-card {
    margin-bottom: 20px;

    .product-info {
      display: flex;
      align-items: center;

      .product-image {
        width: 50px;
        height: 50px;
        object-fit: cover;
        border-radius: 4px;
        margin-right: 12px;
      }

      .product-details {
        .product-name {
          font-weight: 600;
          color: #303133;
          margin-bottom: 4px;
        }

        .product-code {
          font-size: 12px;
          color: #909399;
        }
      }
    }

    .text-muted {
      color: #c0c4cc;
    }

    .total-section {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ebeef5;

      .total-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;

        label {
          font-weight: 600;
          color: #606266;
        }

        .total-quoted {
          font-size: 18px;
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

  .messages-card {
    .messages-list {
      max-height: 400px;
      overflow-y: auto;
      margin-bottom: 20px;

      .message-item {
        margin-bottom: 16px;
        padding: 12px;
        background-color: #f5f7fa;
        border-radius: 8px;

        &.admin-message {
          background-color: #e1f3d8;
          margin-left: 20px;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;

          .sender-name {
            font-weight: 600;
            color: #303133;
          }

          .message-time {
            font-size: 12px;
            color: #909399;
          }
        }

        .message-content {
          color: #606266;
          line-height: 1.5;
          white-space: pre-wrap;
        }
      }

      .no-messages {
        text-align: center;
        color: #c0c4cc;
        padding: 40px 0;
      }
    }

    .send-message-section {
      .send-actions {
        margin-top: 12px;
        text-align: right;
      }
    }
  }
}

@include mobile {
  .inquiry-detail {
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