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

        <div class="payment-methods">
            <h2>付款方式</h2>
            <button @click="proceedToPaypal" :disabled="loading" class="paypal-button">
                <span v-if="loading">处理中...</span>
                <span v-else>使用 PayPal 支付</span>
            </button>
        </div>

        <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            loading: false,
            errorMessage: '',
            // 模拟订单数据
            orderItems: [
                { id: 1, name: '产品 A', price: 29.99, quantity: 1 },
                { id: 2, name: '产品 B', price: 49.99, quantity: 2 }
            ],
            // 模拟订单ID（实际中应从后端获取）
            orderId: 'ORDER-' + Math.floor(Math.random() * 100000)
        };
    },
    computed: {
        orderTotal() {
            return this.orderItems.reduce((total, item) => {
                return total + (item.price * item.quantity);
            }, 0);
        },
        // 构建PayPal结账URL
        paypalCheckoutUrl() {
            const baseUrl = `${window.location.origin}/paypal-checkout.html`;
            const params = new URLSearchParams({
                amount: this.orderTotal.toFixed(2),
                currency: 'USD',
                orderId: this.orderId,
                returnUrl: `${window.location.origin}/checkout-complete`
            });
            
            return `${baseUrl}?${params.toString()}`;
        }
    },
    methods: {
        formatPrice(price) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(price);
        },
        
        proceedToPaypal() {
            this.loading = true;
            this.errorMessage = '';
            
            try {
                console.log('重定向到PayPal结账页面:', this.paypalCheckoutUrl);
                
                // 可以在这里添加操作，例如保存订单到后端
                
                // 重定向到PayPal结账页面
                window.location.href = this.paypalCheckoutUrl;
            } catch (error) {
                console.error('处理付款时出错:', error);
                this.errorMessage = '处理付款请求时出错，请稍后再试。';
                this.loading = false;
            }
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

.paypal-button {
    padding: 12px 24px;
    background-color: #0070ba;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    display: block;
    width: 100%;
    max-width: 300px;
    margin: 0 auto;
}

.paypal-button:hover {
    background-color: #005ea6;
}

.paypal-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

.error-message {
    color: #721c24;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    padding: 12px;
    margin: 20px 0;
    border-radius: 4px;
}
</style>
