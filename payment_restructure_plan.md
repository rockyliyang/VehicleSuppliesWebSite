# 支付流程重构方案

## 1. 现状分析

### 1.1 前端现状

目前系统存在多个结算页面和实现方式：

- **Cart.vue**: 包含两个结算按钮，分别路由到不同的结算页面
- **Checkout.vue**: 传统的多步骤结算流程
- **Checkout3.vue**: 使用PayPal SDK的实现方式
- **CheckoutV2.vue**: 通过重定向到独立页面处理支付

存在的问题：
- 多个结算页面导致代码重复和维护困难
- PayPal SDK集成存在兼容性问题
- 不同支付方式的处理逻辑分散
- 用户体验不一致

### 1.2 后端现状

后端支付相关代码分布在多个文件中：

- **orderController.js**: 处理订单创建和支付处理
- **paypalController.js**: 处理PayPal支付
- **orderRoutes.js**: 订单相关路由
- **orderRoutes3.js**: PayPal示例代码

存在的问题：
- 支付逻辑分散在不同控制器中
- 订单创建逻辑重复
- 不同支付方式的处理不统一
- 使用了旧版的PayPal SDK (@paypal/checkout-server-sdk)

## 2. 重构目标

1. 统一前端结算页面，提供一致的用户体验
2. 整合所有支付方式（PayPal、信用卡、微信、支付宝）到一个页面
3. 统一后端订单创建和支付处理逻辑
4. 升级PayPal SDK到@paypal/paypal-server-sdk
5. 优化错误处理和状态管理

## 3. 前端重构方案

### 3.1 新建统一结算页面

创建新的`UnifiedCheckout.vue`组件，整合所有支付方式：

```vue
<!-- 组件结构示意 -->
<template>
  <div class="unified-checkout">
    <!-- 订单信息区域 -->
    <section class="order-summary">
      <!-- 订单商品列表 -->
    </section>
    
    <!-- 收货信息区域 -->
    <section class="shipping-info">
      <!-- 收货地址表单 -->
    </section>
    
    <!-- 支付方式选择区域 -->
    <section class="payment-methods">
      <el-tabs v-model="activePaymentTab">
        <!-- PayPal支付选项卡 -->
        <el-tab-pane label="PayPal" name="paypal">
          <div id="paypal-button-container" ref="paypalButtonContainer"></div>
        </el-tab-pane>
        
        <!-- 信用卡支付选项卡 -->
        <el-tab-pane label="信用卡" name="card">
          <div id="card-button-container" ref="cardButtonContainer"></div>
        </el-tab-pane>
        
        <!-- 微信支付选项卡 -->
        <el-tab-pane label="微信支付" name="wechat">
          <div class="qrcode-container">
            <div v-if="qrcodeUrl" class="qrcode-image">
              <img :src="qrcodeUrl" alt="微信支付二维码">
            </div>
            <el-button @click="generateQrcode('wechat')" type="primary">生成支付二维码</el-button>
          </div>
        </el-tab-pane>
        
        <!-- 支付宝选项卡 -->
        <el-tab-pane label="支付宝" name="alipay">
          <div class="qrcode-container">
            <div v-if="qrcodeUrl" class="qrcode-image">
              <img :src="qrcodeUrl" alt="支付宝支付二维码">
            </div>
            <el-button @click="generateQrcode('alipay')" type="primary">生成支付二维码</el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </section>
  </div>
</template>
```

### 3.2 PayPal集成优化

采用Checkout3.vue的实现方式，但进行以下优化：

1. 使用动态加载PayPal SDK
2. 添加适当的错误处理和重试机制
3. 解决跨域和CSP问题
4. 优化按钮渲染逻辑，确保在支付方式切换时正确显示/隐藏

```javascript
// PayPal SDK加载和按钮渲染逻辑
loadPayPalSDK() {
  // 清除可能存在的旧脚本
  const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
  if (existingScript) {
    existingScript.parentNode.removeChild(existingScript);
  }
  
  // 创建新脚本
  const script = document.createElement('script');
  script.src = `https://www.paypal.com/sdk/js?client-id=${this.paypalConfig.clientId}&currency=${this.paypalConfig.currency}&components=buttons&enable-funding=paylater,card`;
  script.crossOrigin = 'anonymous';
  script.async = true;
  script.defer = true;
  
  script.onload = () => {
    if (window.paypal) {
      this.renderPayPalButtons();
    }
  };
  
  document.body.appendChild(script);
  this.paypalScript = script;
},

// 监听支付方式切换，确保PayPal按钮正确显示
watchPaymentMethod() {
  this.$watch('activePaymentTab', (newVal, oldVal) => {
    if (newVal === 'paypal' && oldVal !== 'paypal') {
      // 切换到PayPal时，确保按钮已渲染
      this.$nextTick(() => {
        if (!document.querySelector('#paypal-button-container button')) {
          this.renderPayPalButtons();
        }
      });
    }
  });
}
```

### 3.3 二维码支付实现

```javascript
// 生成支付二维码
async generateQrcode(paymentMethod) {
  try {
    // 1. 创建订单
    const orderData = {
      shippingInfo: this.shippingInfo,
      paymentMethod: paymentMethod
    };
    
    const orderResponse = await this.$api.post('/api/orders/common-create', orderData);
    
    if (orderResponse.success) {
      const orderId = orderResponse.data.orderId;
      this.orderId = orderId;
      
      // 2. 生成二维码
      const qrcodeResponse = await this.$api.post('/api/orders/qrcode', {
        orderId: orderId,
        paymentMethod: paymentMethod
      });
      
      if (qrcodeResponse.success) {
        this.qrcodeUrl = qrcodeResponse.data.qrcodeUrl;
        
        // 3. 开始轮询支付状态
        this.startPaymentStatusPolling(orderId, paymentMethod);
      }
    }
  } catch (error) {
    this.handleError(error);
  }
},

// 轮询支付状态
startPaymentStatusPolling(orderId, paymentMethod) {
  this.clearPollingTimer();
  
  this.pollingTimer = setInterval(async () => {
    try {
      const statusResponse = await this.$api.post('/api/orders/check-status', {
        orderId: orderId,
        paymentMethod: paymentMethod
      });
      
      if (statusResponse.success && statusResponse.data.status === 'paid') {
        // 支付成功，跳转到订单完成页面
        this.clearPollingTimer();
        this.$router.push({
          path: '/checkout-complete',
          query: { orderId: orderId }
        });
      }
    } catch (error) {
      console.error('检查支付状态失败:', error);
    }
  }, 3000); // 每3秒检查一次
},

clearPollingTimer() {
  if (this.pollingTimer) {
    clearInterval(this.pollingTimer);
    this.pollingTimer = null;
  }
}
```

## 4. 后端重构方案

### 4.1 统一订单控制器

创建新的`PaymentController.js`，整合所有支付相关逻辑：

```javascript
const db = require('../db/db');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

// 引入PayPal SDK
const {
  Client,
  Environment,
  OrdersController
} = require("@paypal/paypal-server-sdk");

// 初始化PayPal客户端
function getPayPalClient() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal配置不完整');
  }
  
  // 根据环境变量决定使用沙箱还是生产环境
  const environment = process.env.NODE_ENV === 'production'
    ? Environment.Live
    : Environment.Sandbox;
  
  return new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: clientId,
      oAuthClientSecret: clientSecret,
    },
    environment: environment
  });
}

// 统一的订单初始化方法
async function initOrder(userId, cartItems, shippingInfo, paymentMethod, connection) {
  // 1. 计算订单总金额
  let totalAmount = 0;
  for (const item of cartItems) {
    totalAmount += item.price * item.quantity;
  }

  // 2. 创建订单记录
  const orderGuid = uuidv4();
  const [orderResult] = await connection.query(
    `INSERT INTO orders 
     (user_id, total_amount, status, payment_method, order_guid, 
      shipping_name, shipping_phone, shipping_email, shipping_address, shipping_zip_code) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      totalAmount,
      'pending', // 初始状态为待支付
      paymentMethod,
      orderGuid,
      shippingInfo.name,
      shippingInfo.phone,
      shippingInfo.email,
      `${shippingInfo.region.join(',')} ${shippingInfo.address}`,
      shippingInfo.zipCode
    ]
  );

  const orderId = orderResult.insertId;

  // 3. 创建订单项
  for (const item of cartItems) {
    await connection.query(
      `INSERT INTO order_items 
       (order_id, product_id, quantity, price, product_name, product_code) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        item.product_id,
        item.quantity,
        item.price,
        item.name,
        item.product_code
      ]
    );

    // 4. 更新产品库存
    await connection.query(
      `UPDATE products SET stock = stock - ? WHERE id = ? AND deleted = 0`,
      [item.quantity, item.product_id]
    );
  }

  return { orderId, orderGuid, totalAmount };
}

// 创建PayPal订单
exports.createPayPalOrder = async (req, res) => {
  const { shippingInfo } = req.body;
  const userId = req.user.id; // 从JWT获取用户ID

  // 开始数据库事务
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // 1. 获取用户购物车
    const [cartItems] = await connection.query(
      `SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.product_code, p.stock 
       FROM cart_items ci 
       JOIN products p ON ci.product_id = p.id 
       WHERE ci.user_id = ? AND ci.deleted = 0 AND p.deleted = 0`,
      [userId]
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: '购物车为空，无法创建订单'
      });
    }

    // 2. 初始化订单
    const { orderId, totalAmount } = await initOrder(userId, cartItems, shippingInfo, 'paypal', connection);

    // 3. 创建PayPal订单
    const client = getPayPalClient();
    const ordersController = new OrdersController(client);

    const request = {
      body: {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: totalAmount.toFixed(2)
            }
          }
        ]
      }
    };

    const { body } = await ordersController.createOrder(request);
    const paypalOrderData = JSON.parse(body);

    // 4. 更新订单记录，添加PayPal订单ID
    await connection.query(
      `UPDATE orders SET paypal_order_id = ? WHERE id = ?`,
      [paypalOrderData.id, orderId]
    );

    // 5. 提交事务
    await connection.commit();
    connection.release();

    // 6. 清空购物车
    await db.query(
      `UPDATE cart_items SET deleted = 1 WHERE user_id = ? AND deleted = 0`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: 'PayPal订单创建成功',
      data: {
        orderId: orderId,
        paypalOrderId: paypalOrderData.id
      }
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('创建PayPal订单失败:', error);
    return res.status(500).json({
      success: false,
      message: '创建PayPal订单失败',
      error: error.message
    });
  }
};

// 捕获PayPal支付
exports.capturePayPalPayment = async (req, res) => {
  const { paypalOrderId, orderId } = req.body;

  try {
    // 1. 验证订单存在
    const [orders] = await db.query(
      `SELECT id, status FROM orders WHERE id = ? AND paypal_order_id = ?`,
      [orderId, paypalOrderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: '订单不存在或PayPal订单ID不匹配'
      });
    }

    const order = orders[0];

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '订单状态不正确，无法捕获支付'
      });
    }

    // 2. 捕获PayPal支付
    const client = getPayPalClient();
    const ordersController = new OrdersController(client);

    const request = {
      id: paypalOrderId
    };

    const { body } = await ordersController.captureOrder(request);
    const captureData = JSON.parse(body);

    // 3. 更新订单状态
    await db.query(
      `UPDATE orders SET status = ?, payment_id = ? WHERE id = ?`,
      ['paid', captureData.id, orderId]
    );

    return res.status(200).json({
      success: true,
      message: 'PayPal支付捕获成功',
      data: {
        orderId: orderId,
        paymentId: captureData.id
      }
    });
  } catch (error) {
    console.error('捕获PayPal支付失败:', error);
    return res.status(500).json({
      success: false,
      message: '捕获PayPal支付失败',
      error: error.message
    });
  }
};

// 创建普通订单（微信/支付宝）
exports.createCommonOrder = async (req, res) => {
  const { shippingInfo, paymentMethod } = req.body;
  const userId = req.user.id; // 从JWT获取用户ID

  if (!['wechat', 'alipay'].includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      message: '不支持的支付方式'
    });
  }

  // 开始数据库事务
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // 1. 获取用户购物车
    const [cartItems] = await connection.query(
      `SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.product_code, p.stock 
       FROM cart_items ci 
       JOIN products p ON ci.product_id = p.id 
       WHERE ci.user_id = ? AND ci.deleted = 0 AND p.deleted = 0`,
      [userId]
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: '购物车为空，无法创建订单'
      });
    }

    // 2. 初始化订单
    const { orderId } = await initOrder(userId, cartItems, shippingInfo, paymentMethod, connection);

    // 3. 提交事务
    await connection.commit();
    connection.release();

    return res.status(200).json({
      success: true,
      message: '订单创建成功',
      data: {
        orderId: orderId
      }
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('创建订单失败:', error);
    return res.status(500).json({
      success: false,
      message: '创建订单失败',
      error: error.message
    });
  }
};

// 生成支付二维码
exports.generateQrcode = async (req, res) => {
  const { orderId, paymentMethod } = req.body;

  try {
    // 1. 验证订单存在
    const [orders] = await db.query(
      `SELECT id, total_amount, status FROM orders WHERE id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    const order = orders[0];

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '订单状态不正确，无法生成支付二维码'
      });
    }

    // 2. 生成支付链接（实际项目中应调用微信/支付宝API）
    let paymentUrl;
    if (paymentMethod === 'wechat') {
      // 这里应该调用微信支付API生成支付链接
      paymentUrl = `https://example.com/wechat-pay?orderId=${orderId}&amount=${order.total_amount}`;
    } else if (paymentMethod === 'alipay') {
      // 这里应该调用支付宝API生成支付链接
      paymentUrl = `https://example.com/alipay?orderId=${orderId}&amount=${order.total_amount}`;
    } else {
      return res.status(400).json({
        success: false,
        message: '不支持的支付方式'
      });
    }

    // 3. 生成二维码
    const qrcodeDataUrl = await QRCode.toDataURL(paymentUrl);

    return res.status(200).json({
      success: true,
      message: '二维码生成成功',
      data: {
        qrcodeUrl: qrcodeDataUrl
      }
    });
  } catch (error) {
    console.error('生成二维码失败:', error);
    return res.status(500).json({
      success: false,
      message: '生成二维码失败',
      error: error.message
    });
  }
};

// 检查支付状态
exports.checkPaymentStatus = async (req, res) => {
  const { orderId, paymentMethod } = req.body;

  try {
    // 查询订单状态
    const [orders] = await db.query(
      `SELECT id, status FROM orders WHERE id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    const order = orders[0];

    return res.status(200).json({
      success: true,
      message: '获取支付状态成功',
      data: {
        orderId: orderId,
        status: order.status
      }
    });
  } catch (error) {
    console.error('检查支付状态失败:', error);
    return res.status(500).json({
      success: false,
      message: '检查支付状态失败',
      error: error.message
    });
  }
};

// 支付成功回调（微信/支付宝）
exports.paymentCallback = async (req, res) => {
  const { orderId, paymentMethod, paymentId, status } = req.body;

  try {
    // 1. 验证订单存在
    const [orders] = await db.query(
      `SELECT id, status FROM orders WHERE id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    const order = orders[0];

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '订单状态不正确，无法更新支付状态'
      });
    }

    // 2. 更新订单状态
    let newStatus;
    if (status === 'success') {
      newStatus = 'paid';
    } else if (status === 'fail') {
      newStatus = 'cancelled';
    } else if (status === 'cancel') {
      newStatus = 'cancelled';
    } else {
      return res.status(400).json({
        success: false,
        message: '不支持的支付状态'
      });
    }

    await db.query(
      `UPDATE orders SET status = ?, payment_id = ? WHERE id = ?`,
      [newStatus, paymentId, orderId]
    );

    return res.status(200).json({
      success: true,
      message: '支付状态更新成功',
      data: {
        orderId: orderId,
        status: newStatus
      }
    });
  } catch (error) {
    console.error('支付回调处理失败:', error);
    return res.status(500).json({
      success: false,
      message: '支付回调处理失败',
      error: error.message
    });
  }
};
```

### 4.2 统一路由设计

创建新的`paymentRoutes.js`：

```javascript
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/jwt');

// 所有支付路由都需要用户认证（除了回调接口）
router.use('/callback', (req, res, next) => next()); // 跳过回调接口的认证
router.use((req, res, next) => {
  if (req.path.startsWith('/callback')) {
    return next();
  }
  return verifyToken(req, res, next);
});

// PayPal相关接口
router.post('/paypal/create', paymentController.createPayPalOrder);
router.post('/paypal/capture', paymentController.capturePayPalPayment);

// 普通支付相关接口
router.post('/common/create', paymentController.createCommonOrder);
router.post('/qrcode', paymentController.generateQrcode);
router.post('/check-status', paymentController.checkPaymentStatus);

// 支付回调接口
router.post('/callback/wechat', paymentController.paymentCallback);
router.post('/callback/alipay', paymentController.paymentCallback);

module.exports = router;
```

## 5. 实施步骤

### 5.1 前端实施步骤

1. 创建新的`UnifiedCheckout.vue`组件
2. 修改`Cart.vue`中的结算按钮，路由到新的结算页面
3. 在`router/index.js`中添加新的路由配置
4. 实现PayPal SDK集成
5. 实现微信/支付宝二维码支付
6. 添加支付状态轮询和错误处理
7. 测试各种支付方式

### 5.2 后端实施步骤

1. 创建新的`paymentController.js`
2. 实现统一的订单初始化方法
3. 实现PayPal支付相关接口
4. 实现微信/支付宝支付相关接口
5. 创建新的`paymentRoutes.js`
6. 在`server.js`中注册新的路由
7. 测试各种支付接口

## 6. 注意事项

1. 保留原有的支付实现，确保系统平稳过渡
2. 确保数据库事务的正确使用，避免订单和库存不一致
3. 添加适当的日志记录，方便问题排查
4. 确保支付安全，避免敏感信息泄露
5. 添加适当的错误处理和重试机制
6. 考虑支付超时和取消的处理
7. 确保前后端接口的一致性和兼容性