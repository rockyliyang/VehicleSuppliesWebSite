<template>
    <div class="paypal-test-page">
        <h1>PayPal 支付测试</h1>
        <p class="description">
            这个页面用于测试PayPal支付功能，无需登录即可访问。
        </p>

        <div class="test-options">
            <h2>测试选项</h2>
            <div class="option-group">
                <label>
                    支付金额:
                    <input type="number" v-model="amount" step="0.01" min="1" @change="updateConfig" />
                </label>

                <label>
                    货币:
                    <select v-model="currency" @change="updateConfig">
                        <option value="USD">美元 (USD)</option>
                        <option value="EUR">欧元 (EUR)</option>
                        <option value="CNY">人民币 (CNY)</option>
                        <option value="JPY">日元 (JPY)</option>
                    </select>
                </label>

                <button @click="reloadIframe" class="reload-btn">重新加载</button>
            </div>
        </div>

        <div class="paypal-container">
            <!-- PayPal iframe 集成 -->
            <iframe ref="paypalFrame" :src="iframeSrc" class="paypal-iframe" @load="handleIframeLoad"></iframe>
        </div>

        <div class="log-container">
            <h2>事件日志</h2>
            <pre ref="logElement" class="log-content"></pre>
        </div>
    </div>
</template>

<script>
export default {
  name: 'PayPalTestView',
  data() {
    return {
      amount: '100.00',
      currency: 'USD',
      iframeLoaded: false,
      messageHandler: null
    };
  },
  computed: {
    iframeSrc() {
      // 使用process.env.BASE_URL确保正确的路径解析
      return `${process.env.BASE_URL}paypal-test.html`;
    }
  },
  mounted() {
    this.setupMessageListener();
    this.log('组件已挂载');
  },
  beforeUnmount() {
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
    }
    this.log('组件已卸载');
  },
  methods: {
    log(message, data) {
      const logElement = this.$refs.logElement;
      if (!logElement) return;
      
      const timestamp = new Date().toISOString();
      let logMsg = `${timestamp} - ${message}`;
      if (data) {
        if (typeof data === 'object') {
          logMsg += `: ${JSON.stringify(data)}`;
        } else {
          logMsg += `: ${data}`;
        }
      }
      
      console.log(message, data);
      logElement.textContent += logMsg + '\n';
      
      // 自动滚动到底部
      logElement.scrollTop = logElement.scrollHeight;
    },
    
    setupMessageListener() {
      this.messageHandler = (event) => {
        // 检查消息来源
        const iframe = this.$refs.paypalFrame;
        if (!iframe) return;
        
        try {
          if (event.source === iframe.contentWindow) {
            this.log('收到iframe消息', event.data);
            
            // 处理各种消息类型
            if (event.data.type === 'IFRAME_LOADED') {
              this.iframeLoaded = true;
              this.log('iframe已完全加载');
              this.updateConfig();
            } else if (event.data.type === 'PAYMENT_SUCCESS') {
              this.log('支付成功!', {
                orderId: event.data.orderId
              });
            } else if (event.data.type === 'PAYMENT_ERROR') {
              this.log('支付错误', event.data.error);
            }
          }
        } catch (error) {
          this.log('处理消息时出错', error.message);
        }
      };
      
      window.addEventListener('message', this.messageHandler);
      this.log('消息监听器已设置');
    },
    
    handleIframeLoad() {
      this.log('iframe DOM已加载');
      
      // 延迟发送配置，确保iframe内容完全加载
      setTimeout(() => {
        if (!this.iframeLoaded) {
          this.log('等待iframe内容完全加载...');
        }
      }, 1000);
    },
    
    updateConfig() {
      this.log('更新配置', {
        amount: this.amount,
        currency: this.currency
      });
      
      const iframe = this.$refs.paypalFrame;
      if (!iframe || !this.iframeLoaded) {
        this.log('iframe未准备好，无法发送配置');
        return;
      }
      
      try {
        iframe.contentWindow.postMessage({
          type: 'CONFIGURE',
          config: {
            amount: this.amount,
            currency: this.currency
          }
        }, '*');
        
        this.log('配置已发送到iframe');
      } catch (error) {
        this.log('发送配置时出错', error.message);
      }
    },
    
    reloadIframe() {
      this.log('重新加载iframe');
      this.iframeLoaded = false;
      
      const iframe = this.$refs.paypalFrame;
      if (iframe) {
        // 使用相同的URL但添加时间戳以强制重新加载
        const timestamp = new Date().getTime();
        iframe.src = `${this.iframeSrc}?t=${timestamp}`;
      }
    }
  }
};
</script>

<style scoped>
.paypal-test-page {
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
}

h1 {
    color: #333;
    margin-bottom: 20px;
}

.description {
    margin-bottom: 20px;
    color: #666;
}

.test-options {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f5f5f5;
    border-radius: 8px;
}

.option-group {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    align-items: center;
}

label {
    display: flex;
    align-items: center;
    gap: 8px;
}

input,
select {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.reload-btn {
    padding: 8px 16px;
    background: #4285f4;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.paypal-container {
    margin: 20px 0;
    padding: 10px;
    border: 2px dashed #ccc;
    border-radius: 8px;
}

.paypal-iframe {
    width: 100%;
    height: 500px;
    border: 1px solid #eee;
}

.log-container {
    margin-top: 20px;
}

.log-content {
    background: #f8f8f8;
    border: 1px solid #ddd;
    padding: 10px;
    height: 200px;
    overflow: auto;
    font-family: monospace;
    font-size: 12px;
}
</style>