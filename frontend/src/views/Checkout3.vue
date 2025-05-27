<template>
    <div class="checkout-container">
        <h1>结账</h1>

        <div class="order-summary">
            <h2>订单详情</h2>
            <div class="order-items">
                <div v-for="item in orderItems" :key="item.id" class="order-item">
                    <span class="item-name">{{ item.name }}</span>
                    <span class="item-quantity">x {{ item.quantity }}</span>
                    <span class="item-price">{{ formatPrice(item.price * item.quantity) }}</span>
                </div>
            </div>

            <div class="order-total">
                <span>总计:</span>
                <span>{{ formatPrice(orderTotal) }}</span>
            </div>
        </div>

        <!-- PayPal按钮容器 -->
        <div class="payment-methods">
            <h2>付款方式</h2>
            <div id="paypal-button-container" ref="paypalButtonContainer"></div>
        </div>

        <!-- 错误信息显示区域 -->
        <div id="paypal-errors" class="error-message" v-if="errorMessage">
            {{ errorMessage }}
        </div>

        <!-- 调试信息区域 -->
        <div class="debug-info" v-if="showDebug">
            <div class="debug-title">调试信息:</div>
            <div id="debug-log" class="debug-log" ref="debugLog"></div>
        </div>
    </div>
</template>

<script>
export default {
  name: 'CheckoutThree',
    data() {
        return {
            loading: false,
            errorMessage: '',
            showDebug: true, // 开发环境显示调试信息
            // 模拟订单数据
            orderItems: [
                { id: 1, name: '产品 A', price: 29.99, quantity: 1 },
                { id: 2, name: '产品 B', price: 49.99, quantity: 2 }
            ],
            // 模拟订单ID（实际中应从后端获取）
            orderId: 'ORDER-' + Math.floor(Math.random() * 100000),
            // PayPal SDK配置
            paypalConfig: {
                clientId: 'AUzpZlYjrjpH0aiJ_6Nuxt8Pf5K0WWsREys-eXRRw-e8TjPbASpGPIlGy1O_U1EmpD8t0-ZkeZwIW3UC',
                currency: 'USD'
            },
            // 保存PayPal SDK脚本元素的引用
            paypalScript: null,
            // 保存消息处理函数的引用
            messageHandler: null
        };
    },
    computed: {
        orderTotal() {
            return this.orderItems.reduce((total, item) => {
                return total + (item.price * item.quantity);
            }, 0);
        }
    },
    mounted() {
        // 添加Content-Security-Policy meta标签
        this.addCSPMetaTag();
        
        // 添加全局错误处理
        window.addEventListener('error', this.handleGlobalError);
        
        // 设置消息监听器
        this.setupMessageListener();
        
        // 加载PayPal SDK
        this.loadPayPalSDK();
        
        this.logDebug('组件已挂载');
    },
    beforeUnmount() {
        // 移除全局错误处理
        window.removeEventListener('error', this.handleGlobalError);
        
        // 移除消息监听器
        if (this.messageHandler) {
            window.removeEventListener('message', this.messageHandler);
        }
        
        // 移除PayPal脚本
        if (this.paypalScript && this.paypalScript.parentNode) {
            this.paypalScript.parentNode.removeChild(this.paypalScript);
        }
        
        this.logDebug('组件已卸载');
    },
    methods: {
        // 添加Content-Security-Policy meta标签
        addCSPMetaTag() {
            const meta = document.createElement('meta');
            meta.httpEquiv = 'Content-Security-Policy';
            meta.content = "default-src 'self' https://*.paypal.com https://*.paypalobjects.com; " +
                          "script-src 'self' 'unsafe-inline' https://*.paypal.com; " +
                          "frame-src https://*.paypal.com; " +
                          "connect-src 'self' /api https://*.paypal.com; " +
                          "style-src 'self' 'unsafe-inline' https://*.paypalobjects.com; " +
                          "img-src 'self' data: https://*.paypalobjects.com;";
            document.head.appendChild(meta);
            this.logDebug('已添加CSP meta标签');
        },
        
        // 调试日志函数
        logDebug(message, data) {
            if (!this.showDebug) return;
            
            const logElement = this.$refs.debugLog;
            if (!logElement) return;
            
            const timestamp = new Date().toLocaleTimeString();
            let logMsg = `[${timestamp}] ${message}`;
            if (data) {
                if (typeof data === 'object') {
                    try {
                        logMsg += `: ${JSON.stringify(data)}`;
                    } catch (e) {
                        logMsg += `: [无法序列化的对象]`;
                    }
                } else {
                    logMsg += `: ${data}`;
                }
            }
            
            console.log(message, data);
            logElement.innerHTML += logMsg + '<br/>';
            
            // 自动滚动到底部
            logElement.scrollTop = logElement.scrollHeight;
        },
        
        // 处理全局错误
        handleGlobalError(event) {
            const errorMsg = event.error?.message || '未知错误';
            this.logDebug(`全局错误: ${errorMsg}`);
            this.errorMessage = `发生错误: ${errorMsg}`;
            
            // 更新错误显示区域
            const errorElement = document.getElementById('paypal-errors');
            if (errorElement) {
                errorElement.textContent = this.errorMessage;
            }
        },
        
        // 设置消息监听器
        setupMessageListener() {
            
            this.messageHandler = (event) => {
                this.logDebug('Message event received. Origin:', event.origin, 'Data:', event.data);
                // 接受来自PayPal域的所有消息
                if (event.origin.includes('paypal.com')) {
                    try {
                        // 尝试解析消息数据
                        let messageData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                        this.logDebug(`收到PayPal消息`, messageData);
                        
                        // 处理postrobot消息
                        if (messageData && typeof messageData === 'object') {
                            // 检查是否是postrobot消息
                            const postRobotKey = Object.keys(messageData).find(key => key.includes('post_robot'));
                            
                            if (postRobotKey) {
                                const messages = messageData[postRobotKey];
                                
                                if (Array.isArray(messages)) {
                                    messages.forEach(msg => {
                                        if (msg.name === 'postrobot_message_request' || msg.name === 'postrobot_method') {
                                            // 处理特定的请求
                                            if (msg.data && msg.data.name === 'getPageUrl') {
                                                this.handleGetPageUrl(event, msg);
                                            } else if (msg.data && msg.data.name === 'get' && 
                                                     msg.data.args && msg.data.args[0] === '__confirm_paypal_payload__') {
                                                this.handleGetConfirmPayload(event, msg);
                                            } else {
                                                // 对于其他请求，发送通用确认
                                                this.sendAcknowledgment(event, msg);
                                            }
                                        }
                                    });
                                }
                            }
                            // 如果消息有messageName属性，发送确认
                            else if (messageData.messageName) {
                                this.sendMessageAcknowledgment(event, messageData);
                            }
                        }
                    } catch (err) {
                        this.logDebug(`处理PayPal消息失败: ${err.message}`);
                    }
                }
            };
            
            window.addEventListener('message', this.messageHandler);
            this.logDebug('消息监听器已设置');
        },
        
        // 处理getPageUrl请求
        handleGetPageUrl(event, msg) {
            try {
                const response = {
                    id: msg.id,
                    origin: window.location.origin,
                    type: 'postrobot_message_response',
                    hash: msg.hash,
                    name: 'postrobot_method',
                    ack: true,
                    data: {
                        result: window.location.href
                    }
                };
                
                const wrapper = {};
                const key = Object.keys(event.data)[0];
                wrapper[key] = [response];
                
                this.logDebug('Attempting to send getPageUrl ack. Target origin:', event.origin, 'Payload:', wrapper);
                event.source.postMessage(wrapper, event.origin);
                this.logDebug('getPageUrl ack sent.');
            } catch (err) {
                this.logDebug(`发送getPageUrl响应失败: ${err.message}`);
            }
        },
        
        // 处理get(__confirm_paypal_payload__)请求
        handleGetConfirmPayload(event, msg) {
            try {
                const response = {
                    id: msg.id,
                    origin: window.location.origin,
                    type: 'postrobot_message_response',
                    hash: msg.hash,
                    name: 'postrobot_method',
                    ack: true,
                    data: {
                        result: true
                    }
                };
                
                const wrapper = {};
                const key = Object.keys(event.data)[0];
                wrapper[key] = [response];
                
                this.logDebug('发送confirm_payload响应', wrapper);
                event.source.postMessage(wrapper, event.origin);
            } catch (err) {
                this.logDebug(`发送confirm_payload响应失败: ${err.message}`);
            }
        },
        
        // 发送通用确认
        sendAcknowledgment(event, msg) {
            try {
                const response = {
                    id: msg.id,
                    origin: window.location.origin,
                    type: 'postrobot_message_response',
                    hash: msg.hash,
                    name: msg.name,
                    ack: true
                };
                
                const wrapper = {};
                const key = Object.keys(event.data)[0];
                wrapper[key] = [response];
                
                this.logDebug('发送通用确认', wrapper);
                event.source.postMessage(wrapper, event.origin);
            } catch (err) {
                this.logDebug(`发送通用确认失败: ${err.message}`);
            }
        },
        
        // 发送消息确认
        sendMessageAcknowledgment(event, messageData) {
            try {
                // 构建确认消息
                const ackMessage = {
                    messageName: messageData.messageName + '_ack',
                    data: {}
                };
                
                this.logDebug(`发送消息确认`, ackMessage);
                
                // 发送确认消息回PayPal
                event.source.postMessage(JSON.stringify(ackMessage), event.origin);
            } catch (err) {
                this.logDebug(`发送消息确认失败: ${err.message}`);
            }
        },
        
        // 加载PayPal SDK
        loadPayPalSDK() {
            this.logDebug('开始加载PayPal SDK...');
            
            // 清除可能存在的旧脚本
            const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
            if (existingScript) {
                this.logDebug('移除已存在的PayPal脚本');
                existingScript.parentNode.removeChild(existingScript);
            }
            
            // 创建新脚本
            const script = document.createElement('script');
            script.src = `https://www.paypal.com/sdk/js?client-id=${this.paypalConfig.clientId}&currency=${this.paypalConfig.currency}&components=buttons&enable-funding=paylater,card`;
            script.crossOrigin = 'anonymous'; // 关键：添加跨域属性
            script.async = true;
            script.defer = true;
            script.setAttribute('data-page-type', 'checkout');
            
            // 设置超时处理
            const timeoutId = setTimeout(() => {
                if (!window.paypal) {
                    this.logDebug('PayPal SDK加载超时');
                    this.errorMessage = 'PayPal加载超时，请刷新页面重试';
                }
            }, 10000);
            
            script.onload = () => {
                clearTimeout(timeoutId);
                this.logDebug('PayPal SDK脚本加载完成');
                
                if (window.paypal) {
                    try {
                        this.logDebug('开始渲染PayPal按钮');
                        this.renderPayPalButtons();
                    } catch (error) {
                        this.logDebug(`渲染PayPal按钮失败: ${error}`);
                        this.errorMessage = 'PayPal初始化失败';
                    }
                } else {
                    this.logDebug('PayPal SDK未能正确加载 - window.paypal未定义');
                    this.errorMessage = 'PayPal加载失败';
                }
            };
            
            script.onerror = () => {
                clearTimeout(timeoutId);
                this.logDebug('PayPal SDK加载失败');
                this.errorMessage = 'PayPal加载失败';
            };
            
            this.logDebug('添加PayPal脚本到文档');
            document.body.appendChild(script);
            this.paypalScript = script;
        },
        
        // 渲染PayPal按钮
        renderPayPalButtons() {
            if (!window.paypal || !window.paypal.Buttons) {
                this.logDebug('PayPal Buttons API不可用');
                return;
            }
            
            const buttonContainer = this.$refs.paypalButtonContainer;
            if (!buttonContainer) {
                this.logDebug('PayPal按钮容器不存在');
                return;
            }
            
            try {
                window.paypal.Buttons({
                    // 明确设置style以避免默认样式问题
                    style: {
                        layout: 'vertical',
                        color: 'gold',
                        shape: 'rect',
                        label: 'pay'
                    },
                    // 创建订单
                    createOrder: (data, actions) => {
  // In Checkout3.vue, createOrder method
this.logDebug('createOrder被调用 - ' + new Date().toISOString());
try {
    const orderIDPromise = actions.order.create({
        purchase_units: [{
            amount: {
                value: '10.00'
            }
        }]
    });
    this.logDebug('actions.order.create promise obtained - ' + new Date().toISOString());

    orderIDPromise.then(orderID => {
        this.logDebug('PayPal Order ID received from SDK: ' + orderID + ' - ' + new Date().toISOString());
    }).catch(err => {
        this.logDebug('Error from actions.order.create: ' + JSON.stringify(err) + ' - ' + new Date().toISOString());
        // 考虑在这里也调用 this.showPayPalError(err);
    });

    return orderIDPromise;
} catch (error) {
    this.logDebug('Synchronous error in createOrder: ' + JSON.stringify(error) + ' - ' + new Date().toISOString());
    this.showPayPalError('同步错误：无法创建PayPal订单。');
    throw error; // 重新抛出错误，让PayPal SDK的onError处理
}
                    },
                    // 支付批准
                    onApprove: (data, actions) => {
                        this.logDebug('onApprove被调用', data);
                        return actions.order.capture().then((orderData) => {
                            this.logDebug('支付捕获成功', orderData);
                            this.errorMessage = ''; // 清除错误信息
                            
                            // 这里可以添加成功后的处理逻辑，如重定向到订单确认页面
                            // this.$router.push('/checkout-complete?orderId=' + orderData.id);
                            
                            // 显示成功消息
                            alert('支付成功! 订单ID: ' + orderData.id);
                        });
                    },
                    // 错误处理
                    onError: (err) => {
                        this.logDebug('PayPal按钮错误', err);
                        this.errorMessage = '支付过程中出现错误: ' + (err.message || '请稍后重试');
                    }
                }).render('#paypal-button-container').then(() => {
                    this.logDebug('PayPal按钮渲染成功');
                }).catch((error) => {
                    this.logDebug('PayPal按钮渲染失败', error);
                });
            } catch (error) {
                this.logDebug('渲染PayPal按钮时发生异常', error);
                this.errorMessage = '初始化支付选项时出错';
            }
        },
        
        // 格式化价格显示
        formatPrice(price) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: this.paypalConfig.currency
            }).format(price);
        }
    }
};
</script>

<style scoped>
.checkout-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

h1,
h2 {
    color: #333;
}

.order-summary {
    margin: 30px 0;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 5px;
}

.order-items {
    margin-bottom: 20px;
}

.order-item {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #eee;
}

.order-total {
    display: flex;
    justify-content: space-between;
    padding-top: 15px;
    font-weight: bold;
    font-size: 1.2em;
}

.payment-methods {
    margin: 30px 0;
}

#paypal-button-container {
    width: 100%;
    max-width: 500px;
    margin: 20px auto;
    min-height: 200px;
}

.error-message {
    color: #721c24;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    padding: 12px;
    margin: 20px 0;
    border-radius: 4px;
}

.debug-info {
    margin-top: 30px;
    padding: 10px;
    border: 1px solid #ccc;
    background-color: #f9f9f9;
}

.debug-title {
    font-weight: bold;
    margin-bottom: 10px;
}

.debug-log {
    height: 200px;
    overflow-y: auto;
    border: 1px solid #ddd;
    padding: 5px;
    font-family: monospace;
    font-size: 12px;
    background-color: #f5f5f5;
}
</style>