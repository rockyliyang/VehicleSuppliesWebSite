<template>
    <div class="checkout-complete-container">
        <div class="result-card" :class="{ 'success': isSuccess, 'error': !isSuccess }">
            <div v-if="isSuccess" class="success-icon">✓</div>
            <div v-else class="error-icon">✗</div>
            
            <h1>{{ pageTitle }}</h1>
            <p>{{ pageMessage }}</p>
            
            <div v-if="isSuccess" class="order-details">
                <h2>订单详情</h2>
                <div class="detail-row">
                    <span>订单号:</span>
                    <span>{{ orderId }}</span>
                </div>
                <div class="detail-row">
                    <span>交易ID:</span>
                    <span>{{ transactionId }}</span>
                </div>
                <div class="detail-row">
                    <span>日期:</span>
                    <span>{{ formattedDate }}</span>
                </div>
            </div>
            
            <div class="actions">
                <router-link to="/" class="btn home-btn">返回首页</router-link>
                <router-link v-if="isSuccess" to="/user/orders" class="btn orders-btn">查看我的订单</router-link>
                <router-link v-else to="/checkout2" class="btn retry-btn">重试支付</router-link>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            status: '',
            orderId: '',
            transactionId: '',
            pageTitle: '处理中...',
            pageMessage: '正在确认您的支付状态...'
        };
    },
    computed: {
        isSuccess() {
            return this.status === 'success';
        },
        formattedDate() {
            return new Date().toLocaleString();
        }
    },
    mounted() {
        // 从URL获取支付状态
        const urlParams = new URLSearchParams(window.location.search);
        this.status = urlParams.get('status') || '';
        this.orderId = urlParams.get('orderId') || '';
        this.transactionId = urlParams.get('transactionId') || '';
        
        // 设置页面标题和消息
        if (this.isSuccess) {
            this.pageTitle = '支付成功!';
            this.pageMessage = '感谢您的购买，您的订单已成功处理。';
            
            // 在实际应用中，这里可能需要向后端确认支付状态
            this.confirmOrderWithBackend();
        } else {
            this.pageTitle = '支付未完成';
            this.pageMessage = '您的支付过程中断或出现错误。如果您支付成功但看到此消息，请联系我们的客服。';
        }
    },
    methods: {
        confirmOrderWithBackend() {
            // 这里应该是一个向后端确认支付的API调用
            console.log('向后端确认订单:', {
                orderId: this.orderId,
                transactionId: this.transactionId
            });
            
            // 在真实应用中，这里会调用后端API
            // 例如: this.$api.post('/orders/confirm', { orderId: this.orderId, transactionId: this.transactionId })
        }
    }
};
</script>

<style scoped>
.checkout-complete-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
    padding: 20px;
}

.result-card {
    width: 100%;
    max-width: 600px;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    text-align: center;
    background-color: white;
}

.success {
    border-top: 5px solid #28a745;
}

.error {
    border-top: 5px solid #dc3545;
}

.success-icon, .error-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    margin: 0 auto 20px;
    font-size: 32px;
    color: white;
}

.success-icon {
    background-color: #28a745;
}

.error-icon {
    background-color: #dc3545;
}

h1 {
    margin-bottom: 10px;
    color: #333;
}

p {
    margin-bottom: 20px;
    color: #555;
    font-size: 16px;
}

.order-details {
    margin: 30px 0;
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 5px;
    text-align: left;
}

.detail-row {
    display: flex;
    justify-content: space-between;
    margin: 10px 0;
    padding: 5px 0;
    border-bottom: 1px solid #eee;
}

.actions {
    margin-top: 30px;
    display: flex;
    justify-content: center;
    gap: 15px;
}

.btn {
    padding: 12px 20px;
    border-radius: 4px;
    text-decoration: none;
    font-weight: bold;
    transition: background-color 0.3s;
}

.home-btn {
    background-color: #6c757d;
    color: white;
}

.home-btn:hover {
    background-color: #5a6268;
}

.orders-btn {
    background-color: #28a745;
    color: white;
}

.orders-btn:hover {
    background-color: #218838;
}

.retry-btn {
    background-color: #007bff;
    color: white;
}

.retry-btn:hover {
    background-color: #0069d9;
}

@media (max-width: 768px) {
    .actions {
        flex-direction: column;
    }
    
    .btn {
        width: 100%;
        margin-bottom: 10px;
    }
}
</style> 