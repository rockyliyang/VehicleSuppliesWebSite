<template>
  <div class="communication-section" :class="{ 'mobile-communication': isMobile }">
    <div class="chat-history" ref="chatHistory">
      <div v-for="message in allMessages" :key="message.id" class="chat-message"
        :class="{ 'user-message': message.isUser }">
        <p class="message-sender">
          {{ message.sender }} ({{ formatTime(message) }}):
        </p>
        <p class="message-content">{{ message.content }}</p>
      </div>
      <p v-if="allMessages.length === 0" class="no-messages">
        {{ $t('cart.noMessages') || '暂无消息。' }}
      </p>
    </div>
    <div class="chat-input-section">
      <textarea v-model="newMessage" class="chat-input" rows="3"
        :placeholder="$t('cart.typeMessage') || 'Type your message...'" ref="messageInput"
        @input="updateMessage($event.target.value)"></textarea>
    </div>
    <div class="action-buttons-section">
      <button class="send-btn" @click="handleSendMessage">
        {{ $t('cart.send') || 'Send' }}
      </button>
      <button v-if="!isCheckoutMode" class="checkout-btn" @click="handleCheckout" :disabled="itemsCount === 0 || status === 'Checkouted'"
        :class="{ 'checkouted': status === 'Checkouted' }">
        <i class="material-icons">{{ status === 'Checkouted' ? 'check_circle' : 'payment' }}</i>
        {{ status === 'Checkouted' ? ($t('cart.checkouted') || 'Checkouted') : ($t('cart.checkout') ||
        'Checkout') }}
      </button>
    </div>
  </div>
</template>

<script>
import InquiryPolling from '@/utils/inquiryPolling';

export default {
  name: 'CommunicationSection',
  props: {
    messages: {
      type: Array,
      default: () => []
    },
    inquiryId: {
      type: [String, Number],
      required: true
    },
    itemsCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      default: ''
    },
    initialMessage: {
      type: String,
      default: ''
    },
    isMobile: {
      type: Boolean,
      default: false
    },
    isCheckoutMode: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update-message', 'checkout', 'new-messages'],
  data() {
    return {
      newMessage: this.initialMessage || '',
      pollingConnection: null,
      localMessages: [] // 本地消息列表，用于直接管理消息显示
    };
  },
  computed: {
    allMessages() {
      // 使用 Map 来去重，以 id 为键
      const messageMap = new Map();
      
      // 确保 messages 是数组，防止 forEach 错误
      const messagesArray = Array.isArray(this.messages) ? this.messages : [];
      const localMessagesArray = Array.isArray(this.localMessages) ? this.localMessages : [];
      
      // 先添加原有消息
      messagesArray.forEach(msg => {
        console.log('Existing message:', msg);
        messageMap.set(msg.id, msg);
      });
      
      // 再添加本地新消息，如果 ID 相同则覆盖
      localMessagesArray.forEach(msg => {
        console.log('Local new message:', msg);
        messageMap.set(msg.id, msg);
      });
      
      // 转换为数组并按时间戳排序
      const result = Array.from(messageMap.values()).sort((a, b) => {
        const timeA = a.timestamp || a.created_at;
        const timeB = b.timestamp || b.created_at;
        return new Date(timeA) - new Date(timeB);
      });
      
      console.log('allMessages final result:', result);
      return result;
    }
  },
  watch: {
    initialMessage: {
      handler(newValue) {
        this.newMessage = newValue || '';
      },
      immediate: true
    },
    allMessages: {
      handler() {
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      },
      deep: true
    },
    inquiryId: {
      handler(newId, oldId) {
        // 停止之前的轮询
        if (oldId && this.pollingConnection) {
          console.log(`CommunicationSection: Stop polling for inquiry ${oldId}`);
          this.pollingConnection.stopPolling(oldId);
        }
        
        // 清理本地消息列表（切换询价单时）
        if (newId !== oldId) {
          this.localMessages = [];
        }
        
        // 开始新的轮询
        if (newId && this.pollingConnection) {
          this.pollingConnection.startPolling(newId);
          console.log(`CommunicationSection: Start polling for inquiry ${newId}`);
        }
      },
      immediate: true
    }
  },
  mounted() {
    this.scrollToBottom();
    this.initPolling();
  },
  beforeUnmount() {
    this.cleanupPolling();
  },
  methods: {
    formatTime(messageObj) {
      // 支持传入消息对象或时间戳
      let timestamp;
      if (typeof messageObj === 'object' && messageObj !== null) {
        // 如果是消息对象，尝试获取时间戳字段
        timestamp = messageObj.timestamp || messageObj.created_at;
      } else {
        // 如果直接传入时间戳
        timestamp = messageObj;
      }
      
      // 调试信息
     // console.log('formatTime received timestamp:', timestamp, 'type:', typeof timestamp);
      
      if (!timestamp) {
        return this.$t('common.unknownTime') || 'Unknown Time';
      }
      
      // 尝试解析时间戳
      let date;
      if (typeof timestamp === 'string') {
        // 如果是字符串，尝试解析
        date = new Date(timestamp);
      } else if (typeof timestamp === 'number') {
        // 如果是数字，检查是否是毫秒时间戳
        date = new Date(timestamp);
      } else {
        return this.$t('common.invalidTime') || 'Invalid Time';
      }
      
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        console.error('Invalid timestamp:', timestamp);
        return this.$t('common.invalidTime') || 'Invalid Time';
      }
      
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    async handleSendMessage() {
      if (!this.newMessage.trim()) {
        return;
      }
      
      const messageContent = this.newMessage.trim();
      this.newMessage = ''; // 立即清空输入框
      
      try {
        // 直接调用后端 API 发送消息
        const response = await this.$api.postWithErrorHandler(`/inquiries/${this.inquiryId}/messages`, {
          message: messageContent
        }, {
          fallbackKey: 'INQUIRY.SEND_MESSAGE.FAILED'
        });
        
        if (response.success) {
          // 创建消息对象并添加到本地消息列表
          const newMessage = {
            id: response.data.id || Date.now(),
            sender: this.getSenderName('user'),
            content: messageContent,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
            isUser: true,
            sender_type: 'user',
            message_type: 'text',
            is_read: false
          };
          
          // 直接添加到本地消息列表
          this.localMessages.push(newMessage);
          
          // 滚动到底部显示新消息
          this.$nextTick(() => {
            this.scrollToBottom();
          });
          
          console.log('CommunicationSection: Message sent successfully');
          
          // 检查轮询是否因为失败次数过多而停止，如果是则重新启动
          if (this.pollingConnection && !this.pollingConnection.isPollingInquiry(this.inquiryId)) {
            console.log(`CommunicationSection: Detected polling stopped, restarting polling for inquiry ${this.inquiryId}`);
            // 使用强制重启参数，确保能够重新启动轮询
            this.pollingConnection.startPolling(this.inquiryId, true);
          }
        }
        
      } catch (error) {
        console.error('CommunicationSection: Failed to send message:', error);
        // 如果发送失败，恢复消息内容到输入框
        this.newMessage = messageContent;
      }
    },
    updateMessage(value) {
      this.newMessage = value;
      this.$emit('update-message', this.inquiryId, value);
    },
    handleCheckout() {
      this.$emit('checkout', this.inquiryId);
    },
    scrollToBottom() {
      if (this.$refs.chatHistory) {
        this.$refs.chatHistory.scrollTop = this.$refs.chatHistory.scrollHeight;
      }
    },
    
    // 长轮询相关方法
    initPolling() {
      try {
        this.pollingConnection = InquiryPolling;
        
        // 设置API实例
        if (this.$api) {
          this.pollingConnection.setApiInstance(this.$api);
        }
        
        // 监听新消息
        this.pollingConnection.on('new_messages', (data) => {
          if (data.inquiryId === this.inquiryId) {
            this.handleNewMessages(data);
          }
        });
        
        // 监听轮询错误
        this.pollingConnection.on('polling_error', (error) => {
          console.error('CommunicationSection polling error:', error);
        });
        
        // 如果已有inquiryId，立即开始轮询
        if (this.inquiryId) {
          this.pollingConnection.startPolling(this.inquiryId);
          console.log(`CommunicationSection: Initialize polling for inquiry ${this.inquiryId}`);
        }
        
        console.log('CommunicationSection: Long polling initialization completed');
        
      } catch (error) {
        console.error('CommunicationSection: Failed to initialize long polling:', error);
      }
    },
    
    cleanupPolling() {
      if (this.pollingConnection && this.inquiryId) {
        this.pollingConnection.stopPolling(this.inquiryId);
        console.log(`CommunicationSection: Stop polling for inquiry ${this.inquiryId}`);
      }
    },
    
    handleNewMessages(data) {
      try {
        const { messages } = data;
        
        console.log('CommunicationSection: Received new message data:', data);
        
        if (messages && messages.length > 0) {
          // 标准化消息格式，处理字段名差异
          const normalizedMessages = messages.map(msg => {
            const normalizedMsg = {
              id: msg.id,
              content: msg.content || msg.message, // 处理 content/message 字段差异
              sender: this.getSenderName(msg.sender_type),
              isUser: msg.sender_type === 'user',
              timestamp: msg.timestamp || msg.created_at, // 处理时间戳字段差异
              created_at: msg.created_at,
              sender_type: msg.sender_type,
              message_type: msg.message_type,
              is_read: msg.is_read
            };
            
            //console.log('Normalized message:', normalizedMsg);
            return normalizedMsg;
          });
          
          // 过滤掉已存在的消息，避免重复
          const newMessages = normalizedMessages.filter(newMsg => {
            return !this.allMessages.some(existingMsg => 
              existingMsg.id === newMsg.id || 
              (existingMsg.timestamp === newMsg.timestamp && existingMsg.content === newMsg.content)
            );
          });
          
          if (newMessages.length > 0) {
            // 直接添加到本地消息列表
            this.localMessages.push(...newMessages);
            
            // 同时通知父组件有新消息（保持向后兼容）
            this.$emit('new-messages', {
              inquiryId: this.inquiryId,
              messages: newMessages
            });
            
            console.log(`CommunicationSection: Directly displayed ${newMessages.length} new messages`);
            
            // 滚动到底部显示新消息
            this.$nextTick(() => {
              this.scrollToBottom();
            });
          }
        }
        
      } catch (error) {
        console.error('CommunicationSection: Failed to handle new messages:', error);
      }
    },
    
    getSenderName(senderType) {
      switch (senderType) {
        case 'user':
          return this.$t('common.user') || 'User';
        case 'admin':
          return this.$t('common.admin') || 'Admin';
        case 'system':
          return this.$t('common.system') || 'System';
        default:
          return senderType || this.$t('common.unknown') || 'Unknown';
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';

/* 销售沟通区域 */
.communication-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.chat-history {
  height: 400px;
  /* 固定高度 */
  overflow-y: auto;
  border: $border-width-sm solid $border-light;
  border-radius: $border-radius-md;
  padding: $spacing-md;
  background: $gray-50;
  flex-shrink: 0;
  /* 防止被压缩 */
}

.chat-message {
  margin-bottom: $spacing-sm;
  padding: $spacing-sm $spacing-sm;
  border-radius: $spacing-sm;
  max-width: 70%;
  word-wrap: break-word;
}

.chat-message.user-message {
  background: $info-light;
  color: $info-dark;

  margin-left: 0;
  text-align: left;
}

.chat-message:not(.user-message) {
  background: $gray-100;
  color: $text-primary;
  margin-left: auto;
  margin-right: 0;
  text-align: right;
}

.message-sender {
  font-size: $font-size-xs;
  opacity: 0.8;
  font-weight: $font-weight-medium;
  margin: 0 0 $spacing-xs 0;
}

.user-message .message-sender {
  color: rgba($info-dark, 0.7);
}

.chat-message:not(.user-message) .message-sender {
  color: $text-secondary;
}

.message-content {
  font-size: $font-size-sm;
  margin: 0;
  line-height: $line-height-tight;
  word-wrap: break-word;
}

.no-messages {
  text-align: center;
  color: $text-secondary;
  font-style: italic;
  margin: 0;
}

.chat-input-section {
  background: $white;
  flex: 1;
  /* 占据剩余空间 */
  display: flex;
  flex-direction: column;
  min-height: 80px;
}

.chat-input {
  width: 100%;
  padding: $spacing-sm;
  border: $border-width-sm solid $gray-300;
  border-radius: $border-radius-sm;
  resize: none;
  flex: 1;
  min-height: 40px;
  font-family: inherit;
  font-size: $font-size-sm;
}

.chat-input:focus {
  outline: none;
  border-color: $info-color;
  box-shadow: 0 0 0 2px rgba($info-color, 0.25);
}

/* Action按钮区域 */
.action-buttons-section {
  display: flex;
  gap: $spacing-sm;
  align-items: center;
  padding: $spacing-sm 0;
  flex-shrink: 0;
  height: 60px;
  /* 固定高度 */
}

.send-btn {
  padding: $spacing-md $spacing-lg;
  background: $info-color;
  color: $white;
  border: none;
  border-radius: $border-radius-sm;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: $transition-base;
  min-height: 44px;
  flex: 1;
}

.send-btn:hover {
  background: $info-dark;
}

.send-btn:active {
  background: darken($info-dark, 10%);
}

.checkout-btn {
  padding: $spacing-md $spacing-lg;
  background: $success-color;
  color: $white;
  border: none;
  border-radius: $border-radius-sm;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  transition: $transition-base;
  min-height: 44px;
  flex: 1;
}

.checkout-btn:hover:not(:disabled) {
  background: $success-dark;
  transform: translateY($hover-transform-sm);
}

.checkout-btn:disabled {
  background: $gray-500;
  cursor: not-allowed;
  transform: none;
}

.checkout-btn.checkouted {
  background: $info-color;
  color: $white;
}

.checkout-btn.checkouted:disabled {
  background: $info-color;
  opacity: 0.8;
}

.checkout-btn .material-icons {
  font-size: $font-size-xl;
}

/* 手机端专用样式 */
.mobile-communication {
  height: 100%;
  padding: $spacing-sm;

  .chat-history {
    height: 250px;
    /* 移动端固定高度 */
    margin-bottom: $spacing-sm;
    border-radius: $border-radius-sm;
    flex-shrink: 0;
  }

  .chat-input-section {
    margin-bottom: $spacing-sm;
    flex: 1;
    /* 占据剩余空间 */
    min-height: 60px;
  }

  .chat-input {
    flex: 1;
    min-height: 40px;
    font-size: $font-size-sm;
  }

  .action-buttons-section {
    padding: 0;
    gap: $spacing-xs;
  }

  .send-btn,
  .checkout-btn {
    min-height: 40px;
    padding: $spacing-sm $spacing-md;
    font-size: $font-size-sm;
  }

  .chat-message {
    max-width: 85%;
    padding: $spacing-xs $spacing-sm;
    margin-bottom: $spacing-xs;
  }

  .message-sender {
    font-size: $font-size-xs;
  }

  .message-content {
    font-size: $font-size-xs;
  }
}

/* 响应式设计 */
@media (max-width: $breakpoint-mobile) {
  .chat-input-section {
    flex-direction: column;
    align-items: stretch;
  }

  .send-btn {
    align-self: flex-end;
    width: 80px;
  }

  .action-buttons-section {
    flex-direction: column;
    gap: $spacing-sm;
  }

  .send-btn,
  .checkout-btn {
    width: 100%;
  }
}
</style>