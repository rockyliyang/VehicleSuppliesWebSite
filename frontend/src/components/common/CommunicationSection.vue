<template>
  <div class="communication-section" :class="{ 'mobile-communication': isMobile }">
    <div class="chat-history" ref="chatHistory">
      <div v-for="message in messages" :key="message.id" class="chat-message"
        :class="{ 'user-message': message.isUser }">
        <p class="message-sender">
          {{ message.sender }} ({{ formatTime(message.timestamp) }}):
        </p>
        <p class="message-content">{{ message.content }}</p>
      </div>
      <p v-if="messages.length === 0" class="no-messages">
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
      <button class="checkout-btn" @click="handleCheckout" :disabled="itemsCount === 0 || status === 'Checkouted'"
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
    }
  },
  emits: ['send-message', 'update-message', 'checkout', 'new-messages'],
  data() {
    return {
      newMessage: this.initialMessage || '',
      pollingConnection: null
    };
  },
  watch: {
    initialMessage: {
      handler(newValue) {
        this.newMessage = newValue || '';
      },
      immediate: true
    },
    messages: {
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
          this.pollingConnection.stopPolling(oldId);
        }
        
        // 开始新的轮询
        if (newId && this.pollingConnection) {
          this.pollingConnection.startPolling(newId);
          console.log(`CommunicationSection: 开始轮询询价单 ${newId}`);
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
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    handleSendMessage() {
      if (this.newMessage.trim()) {
        this.$emit('send-message', this.inquiryId, this.newMessage);
        this.newMessage = '';
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
          console.error('CommunicationSection 轮询错误:', error);
        });
        
        // 如果已有inquiryId，立即开始轮询
        if (this.inquiryId) {
          this.pollingConnection.startPolling(this.inquiryId);
          console.log(`CommunicationSection: 初始化轮询询价单 ${this.inquiryId}`);
        }
        
        console.log('CommunicationSection: 长轮询初始化完成');
        
      } catch (error) {
        console.error('CommunicationSection: 初始化长轮询失败:', error);
      }
    },
    
    cleanupPolling() {
      if (this.pollingConnection && this.inquiryId) {
        this.pollingConnection.stopPolling(this.inquiryId);
        console.log(`CommunicationSection: 停止轮询询价单 ${this.inquiryId}`);
      }
    },
    
    handleNewMessages(data) {
      try {
        const { messages } = data;
        
        if (messages && messages.length > 0) {
          // 通知父组件有新消息
          this.$emit('new-messages', {
            inquiryId: this.inquiryId,
            messages: messages
          });
          
          console.log(`CommunicationSection: 收到 ${messages.length} 条新消息`);
        }
        
      } catch (error) {
        console.error('CommunicationSection: 处理新消息失败:', error);
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
  flex: 1;
  overflow-y: auto;
  border: $border-width-sm solid $border-light;
  border-radius: $border-radius-md;
  padding: $spacing-md;
  background: $gray-50;
  min-height: 0;
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
  margin-left: auto;
  margin-right: 0;
  text-align: right;
}

.chat-message:not(.user-message) {
  background: $gray-100;
  color: $text-primary;
  margin-left: 0;
  margin-right: auto;
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

  flex-shrink: 0;
}

.chat-input {
  width: 100%;
  padding: $spacing-sm;
  border: $border-width-sm solid $gray-300;
  border-radius: $border-radius-sm;
  resize: none;
  height: 60px;
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
    flex: 1;
    min-height: 200px;
    margin-bottom: $spacing-sm;
    border-radius: $border-radius-sm;
  }
  
  .chat-input-section {
    margin-bottom: $spacing-sm;
  }
  
  .chat-input {
    height: 50px;
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