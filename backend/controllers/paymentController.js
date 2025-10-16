const { query, getConnection } = require('../db/db');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const { getMessage } = require('../config/messages');
const { getManagedUserIds } = require('../utils/adminUserUtils');
const axios = require('axios');
const refundFailureLogger = require('../utils/refundFailureLogger');
const {
  ApiError,
  CheckoutPaymentIntent,
  Client,
  Environment,
  LogLevel,
  OrdersController,
  PaymentsController,
} = require('@paypal/paypal-server-sdk');
const {AlipaySdk} = require('alipay-sdk');
const fs = require('fs');
const path = require('path');

function getPayPalClient() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_SECRET;
  if (!clientId || !clientSecret) throw new Error('PayPal配置不完整');
  const environment = process.env.NODE_ENV === 'production' ? Environment.Production : Environment.Sandbox;
  return new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: clientId,
      oAuthClientSecret: clientSecret,
    },
    environment: environment
  });
}

// 获取支付宝客户端
function getAlipayClient() {
  const appId = process.env.ALIPAY_APP_ID;
  if (!appId) throw new Error(getMessage('PAYMENT.ALIPAY.CONFIG_MISSING'));
  
  // 根据APP_ID判断是生产环境还是沙箱环境
  // 生产环境APP_ID: 2021005185601490
  // 沙箱环境APP_ID: 9021000149687371
  const isProduction = appId === '2021005185601490';
  
  const privateKeyPath = isProduction ? 
    path.join(__dirname, '../public/keys/myPrivateKey.txt') : 
    path.join(__dirname, '../public/keys/myPrivateKey_dev.txt');
  const alipayPublicKeyPath = isProduction ? 
    path.join(__dirname, '../public/keys/alipayPublicKey_RSA2.txt') : 
    path.join(__dirname, '../public/keys/alipayPublicKey_RSA2_dev.txt');
  
  if (!fs.existsSync(privateKeyPath)) {
    throw new Error(getMessage('PAYMENT.ALIPAY.PRIVATE_KEY_NOT_FOUND'));
  }
  if (!fs.existsSync(alipayPublicKeyPath)) {
    throw new Error(getMessage('PAYMENT.ALIPAY.PUBLIC_KEY_NOT_FOUND'));
  }
  
  const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  const alipayPublicKey = fs.readFileSync(alipayPublicKeyPath, 'utf8');
  
  return new AlipaySdk({
    appId: appId,
    privateKey: privateKey,
    alipayPublicKey: alipayPublicKey,
    gateway: process.env.ALIPAY_GATEWAY,
    signType: 'RSA2',
    charset: 'utf-8',
    version: '1.0'
  });
}

// 获取PayPal访问令牌
async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_SECRET;
  const baseURL = process.env.PAYPAL_API_URL;
  
  if (!clientId || !clientSecret) throw new Error('PayPal配置不完整');
  if (!baseURL) throw new Error('PAYPAL_API_URL配置缺失');
  
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  try {
    const response = await axios.post(`${baseURL}/v1/oauth2/token`, 
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    return response.data.access_token;
  } catch (error) {
    console.error('获取PayPal访问令牌失败:', error);
    throw new Error('Failed to get PayPal access token');
  }
}

// 统一订单初始化
async function initOrder(userId, cartItems, shippingInfo, shippingFee, client, orderSource = 'cart', inquiryId = null, createTimeZone = null, frontendTotalAmount = null) {
  let totalAmount;
  
  // 如果前端传递了total_amount，直接使用；否则根据商品价格汇总计算
  if (frontendTotalAmount !== null && frontendTotalAmount !== undefined) {
    totalAmount = parseFloat(frontendTotalAmount);
  } else {
    totalAmount = shippingFee || 0;
    for (const item of cartItems) totalAmount += item.price * item.quantity;
  }
  const orderResult = await client.query(
    `INSERT INTO orders 
     (user_id, inquiry_id, total_amount, status, 
      shipping_name, shipping_phone, shipping_email, shipping_address, shipping_zip_code,
      shipping_country,shipping_state,shipping_city,shipping_phone_country_code,shipping_fee,
      create_time_zone, created_by, updated_by) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING id`,
    [
      userId,
      inquiryId,
      totalAmount,
      'pending',
      shippingInfo.name,
      shippingInfo.phone,
      shippingInfo.email,
      shippingInfo.address,
      shippingInfo.zipCode,
      shippingInfo.country,
      shippingInfo.state,
      shippingInfo.city,
      shippingInfo.phone_country_code,
      shippingFee || 0,
      createTimeZone,
      userId,
      userId
    ]
  );
  const orderId = orderResult.rows[0].id;
  for (const item of cartItems) {
    await client.query(
      `INSERT INTO order_items 
       (order_id, product_id, quantity, price, created_by, updated_by) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [orderId, item.product_id, item.quantity, item.price, userId, userId]
    );
    
    // 只对自营商品扣减库存
    await client.query(
      `UPDATE products SET stock = stock - $1, updated_by = $2 WHERE id = $3 AND deleted = false AND product_type = 'self_operated'`,
      [item.quantity, userId, item.product_id]
    );
    
    // 根据订单来源执行不同的操作
    if (orderSource === 'cart') {
      // 从购物车生成订单：删除购物车中对应的商品
      await client.query(
        `UPDATE cart_items SET deleted = true, updated_by = $1 WHERE user_id = $2 AND deleted = false and product_id = $3`,
        [userId, userId, item.product_id]
      );
    } else if (orderSource === 'inquiry' && inquiryId) {
      // 从询价单生成订单：将询价单状态设置为paid
      await client.query(
        `UPDATE inquiries SET status = 'paid', updated_by = $1 WHERE id = $2 AND user_id = $3`,
        [userId, inquiryId, userId]
      );
    }
  }
  return { orderId, totalAmount };
}

// PayPal订单创建
exports.createPayPalOrder = async (req, res) => {
  try {
    const { shippingInfo, orderItems, shipping_fee, orderSource, inquiryId, create_time_zone, total_amount } = req.body;
    const userId = req.userId;
    const connection = await getConnection();
    await connection.beginTransaction();
    try {
      let cartItems;
      let source = orderSource || 'cart'; // 默认为购物车订单
      
      if (orderItems && Array.isArray(orderItems) && orderItems.length > 0) {
        cartItems = orderItems;
        source = 'inquiry';
      } else {
        const dbCartItems = await connection.query(
          `SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.product_code, p.stock, p.product_type 
           FROM cart_items ci 
           JOIN products p ON ci.product_id = p.id 
           WHERE ci.user_id = $1 AND ci.deleted = false AND p.deleted = false`,
          [userId]
        );
        cartItems = dbCartItems.getRows();
        source = 'cart';
      }
      
      if (!cartItems || cartItems.length === 0) {
        await connection.rollback();
        connection.release();
        return res.json({ success: false, message: getMessage('CART.EMPTY'), data: null });
      }
      
      const { orderId, totalAmount } = await initOrder(userId, cartItems, shippingInfo, shipping_fee, connection, source, inquiryId, create_time_zone, total_amount);
      const paypalClient = getPayPalClient();
      const ordersController = new OrdersController(paypalClient);
      const request = {
        body: {
          intent: CheckoutPaymentIntent.Capture,
          purchaseUnits: [
            {
              amount: {
                currencyCode: 'USD',
                value: totalAmount.toFixed(2)
              }
            }
          ]
        },
        prefer: "return=minimal",
      };
      const { body } = await ordersController.createOrder(request);
      const paypalOrderData = JSON.parse(body);
      await connection.query(
        `UPDATE orders SET payment_id = $1, updated_by = $2 WHERE id = $3`,
        [paypalOrderData.id, req.userId, orderId]
      );
      await connection.commit();
      connection.release();
      
       return res.json({ success: true, message: getMessage('PAYMENT.PAYPAL_ORDER_CREATE_SUCCESS'), data: { orderId, paypalOrderId: paypalOrderData.id } });
    } catch (error) {
      console.error('PayPal order create error 1:', error);
      await connection.rollback();
      connection.release();
      return res.json({ success: false, message: error.message, data: null });
    }
  } catch (error) {
    console.error('PayPal order create error 2:', error);
    return res.json({ success: false, message: error.message, data: null });
  }
};

// PayPal支付捕获
exports.capturePayPalPayment = async (req, res) => {
  try {
    const { paypalOrderId, orderId, paid_time_zone } = req.body;
    const orders = await query(
      `SELECT id, status FROM orders WHERE id = $1 AND payment_id = $2`,
      [orderId, paypalOrderId]
    );
    if (orders.getRowCount() === 0) {
      return res.json({ success: false, message: getMessage('PAYMENT.ORDER_NOT_FOUND_OR_MISMATCH'), data: null });
    }
    const order = orders.getFirstRow();
    if (order.status !== 'pending') {
      return res.json({ success: false, message: getMessage('PAYMENT.INVALID_ORDER_STATUS'), data: null });
    }
    const client = getPayPalClient();
    const ordersController = new OrdersController(client);
    const request = { id: paypalOrderId };
    const { body } = await ordersController.captureOrder(request);
    const captureData = JSON.parse(body);
    await query(
      `UPDATE orders SET status = $1, payment_method = $2, paid_at = CURRENT_TIMESTAMP, paid_time_zone = $3, updated_by = $4 WHERE id = $5`,
      ['paid', 'paypal', paid_time_zone, req.userId, orderId]
    );
    return res.json({ success: true, message: getMessage('PAYMENT.PAYPAL_CAPTURE_SUCCESS'), data: { orderId, paymentId: captureData.id } });
  } catch (error) {
    return res.json({ success: false, message: error.message, data: null });
  }
};

// PayPal重新支付（为已存在的订单创建新的PayPal订单）
exports.repayPayPalOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.userId;
    
    // 验证订单是否存在且属于当前用户
    const orders = await query(
      `SELECT id, total_amount, shipping_fee, status, user_id FROM orders WHERE id = $1 AND user_id = $2 AND deleted = false`,
      [orderId, userId]
    );
    
    if (orders.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('PAYMENT.ORDER_NOT_FOUND_OR_NO_PERMISSION')
      });
    }
    
    const order = orders.getFirstRow();
    
    // 只有未支付的订单才能重新支付
    if (order.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: getMessage('PAYMENT.ORDER_ALREADY_PAID')
      });
    }
    
    // 创建PayPal订单
    const client = getPayPalClient();
    const ordersController = new OrdersController(client);
    
    const request = {
      body: {
        intent: CheckoutPaymentIntent.Capture,
        purchaseUnits: [
          {
            amount: {
              currencyCode: 'USD',
              value: (Number(order.total_amount) + Number(order.shipping_fee)).toFixed(2)
            }
          }
        ]
      },
      prefer: "return=minimal",
    };
    
    const { body } = await ordersController.createOrder(request);
    const paypalOrderData = JSON.parse(body);
    
    // 更新订单的PayPal订单ID
    await query(
      `UPDATE orders SET payment_id = $1, updated_by = $2 WHERE id = $3`,
      [paypalOrderData.id, req.userId, orderId]
    );
    
    return res.status(200).json({
      success: true,
      message: getMessage('PAYMENT.PAYPAL_REPAY_ORDER_CREATE_SUCCESS'),
      data: {
        orderId: orderId,
        paypalOrderId: paypalOrderData.id
      }
    });
    
  } catch (error) {
    console.error('PayPal重新支付失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('PAYMENT.PAYPAL_REPAY_FAILED'),
      error: error.message
    });
  }
};

// 创建普通订单（微信/支付宝）
exports.createCommonOrder = async (req, res) => {
  try {
    const { shipping_info, paymentMethod, orderItems, shipping_fee, orderSource, inquiryId, create_time_zone, total_amount } = req.body;
    const userId = req.userId;
    
    // 验证必要的参数
    /*if (!shipping_info) {
      return res.json({ success: false, message: getMessage('CHECKOUT.ADDRESS.REQUIRED'), data: null });
    }
    
    // 验证 shippingInfo 的必要字段
    if (!shipping_info.name || !shipping_info.phone || !shipping_info.email) {
      return res.json({ success: false, message: getMessage('PAYMENT.SHIPPING_INFO_INCOMPLETE'), data: null });
    }
    
    if (!shipping_info.address && !shipping_info.detail) {
      return res.json({ success: false, message: getMessage('PAYMENT.SHIPPING_ADDRESS_REQUIRED'), data: null });
    }*/
    
    // 移除支付方式限制，现在支持所有支付方式

    const connection = await getConnection();
    await connection.beginTransaction();
    try {
      let cartItems;
      let source = orderSource || 'cart'; // 默认为购物车订单

      
      if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
        await connection.rollback();
        connection.release();
        return res.json({ success: false, message: getMessage('CART.EMPTY'), data: null });
      }
      
      const { orderId } = await initOrder(userId, orderItems, shipping_info, shipping_fee, connection, source, inquiryId, create_time_zone, total_amount);
      await connection.commit();
      connection.release();
      
      return res.json({ success: true, message: getMessage('PAYMENT.ORDER_CREATE_SUCCESS'), data: { orderId } });
    } catch (error) {
      await connection.rollback();
      connection.release();
      return res.json({ success: false, message: error.message, data: null });
    }
  } catch (error) {
    return res.json({ success: false, message: error.message, data: null });
  }
};

// 生成支付二维码
exports.generateQrcode = async (req, res) => {
  try {
    const { orderId, paymentMethod, deviceType, paidTimeZone, exchangeRate } = req.body;
    const orders = await query(
      `SELECT id, total_amount, shipping_fee, status FROM orders WHERE id = $1`,
      [orderId]
    );
    if (orders.getRowCount() === 0) {
      return res.json({ success: false, message: getMessage('PAYMENT.ORDER_NOT_FOUND'), data: null });
    }
    const order = orders.getFirstRow();
    if (order.status !== 'pending') {
      return res.json({ success: false, message: getMessage('PAYMENT.INVALID_ORDER_STATUS_FOR_QR'), data: null });
    }
    let paymentUrl;
    if (paymentMethod === 'wechat') {
      paymentUrl = `https://example.com/wechat-pay?orderId=${orderId}&amount=${order.total_amount}`;
    } else if (paymentMethod === 'alipay') {
      try {
        const alipaySdk = getAlipayClient();
        const outTradeNo = `ORDER_${orderId}_${Date.now()}`; // 商户订单号
        
        // 计算人民币金额：使用汇率 * 美元金额
        const cnyAmount = exchangeRate ? ((parseFloat(order.total_amount) + parseFloat(order.shipping_fee)) * parseFloat(exchangeRate)).toFixed(2) : (parseFloat(order.total_amount) + parseFloat(order.shipping_fee)).toFixed(2);

        let requestData = {
            out_trade_no: outTradeNo,
            total_amount: cnyAmount,
            subject: `AutoEaseTechX - ${orderId}`,
            body: `AutoEaseTechX Order：${orderId}`,
            timeout_express: '30m',
            language: 'en_US',

            //notify_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/payment/alipay/notify`,
            //return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success`
          }
        
        let formData;
        if (deviceType === "mobile") {
          // 手机端使用 alipay.trade.wap.pay
          requestData.product_code = 'QUICK_WAP_WAY'; // 手机网站支付产品码
          requestData.return_url = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/order-payment/${orderId}`;
          requestData.quit_url = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/order-payment/${orderId}`;
          
          formData = alipaySdk.pageExecute('alipay.trade.wap.pay', 'POST', {
            bizContent: requestData
          });
        } else {
          // 桌面端使用 alipay.trade.page.pay
          requestData.product_code = 'FAST_INSTANT_TRADE_PAY'; // 即时到账产品码
          requestData.qr_pay_mode = '4'; // 订单码-简约前置模式
          requestData.qrcode_width = '150'; // 二维码宽度
          requestData.store_id = 'VEHICLE_STORE_001';
          requestData.operator_id = 'OPERATOR_001';
          requestData.terminal_id = 'TERMINAL_001';
          
          formData = alipaySdk.pageExecute('alipay.trade.page.pay', 'POST', {
            bizContent: requestData
          });
        }
       //console.log('Alipay form data:', formData);

        if (formData && typeof formData === 'string') {
          // 保存商户订单号、支付时区和汇率到数据库
          let updateQuery, updateParams;
          if (paidTimeZone && exchangeRate) {
            updateQuery = `UPDATE orders SET payment_id = $1, paid_time_zone = $2, exchange_rate = $3 WHERE id = $4`;
            updateParams = [outTradeNo, paidTimeZone, parseFloat(exchangeRate), orderId];
          } else if (paidTimeZone) {
            updateQuery = `UPDATE orders SET payment_id = $1, paid_time_zone = $2 WHERE id = $3`;
            updateParams = [outTradeNo, paidTimeZone, orderId];
          } else if (exchangeRate) {
            updateQuery = `UPDATE orders SET payment_id = $1, exchange_rate = $2 WHERE id = $3`;
            updateParams = [outTradeNo, parseFloat(exchangeRate), orderId];
          } else {
            updateQuery = `UPDATE orders SET payment_id = $1 WHERE id = $2`;
            updateParams = [outTradeNo, orderId];
          }
          await query(updateQuery, updateParams);
          // 对于alipay.trade.page.pay，返回HTML表单而不是二维码
          // 前端需要处理这个HTML表单来显示支付页面
          return res.json({ 
            success: true, 
            message: getMessage('PAYMENT.ALIPAY.PAGE_PAY_SUCCESS'), 
            data: { 
              paymentForm: formData,
              paymentMethod: deviceType === 'mobile' ? 'alipay_wap_pay' : 'alipay_page_pay',
              deviceType: deviceType,
              outTradeNo: outTradeNo
            } 
          });
        } else {
          console.error('Alipay page pay failed: Invalid form data');
          return res.json({ 
            success: false, 
            message: getMessage('PAYMENT.ALIPAY.PAGE_PAY_FAILED'), 
            data: null 
          });
        }
      } catch (error) {
        console.error('Alipay SDK error:', error);
        return res.json({ 
          success: false, 
          message: getMessage('PAYMENT.ALIPAY.SERVICE_ERROR'), 
          data: null 
        });
      }
    } else {
      return res.json({ success: false, message: getMessage('PAYMENT.UNSUPPORTED_METHOD'), data: null });
    }
    
    const qrcodeDataUrl = await QRCode.toDataURL(paymentUrl);
    return res.json({ success: true, message: getMessage('PAYMENT.QR_CODE_GENERATE_SUCCESS'), data: { qrcodeUrl: qrcodeDataUrl } });
  } catch (error) {
    return res.json({ success: false, message: error.message, data: null });
  }
};

// 检查支付状态
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;
    const orders = await query(
      `SELECT id, status, payment_id FROM orders WHERE id = $1`,
      [orderId]
    );
    if (orders.getRowCount() === 0) {
      return res.json({ success: false, message: getMessage('PAYMENT.ORDER_NOT_FOUND'), data: null });
    }
    const order = orders.getFirstRow();
    
    // 如果是支付宝支付且订单状态为pending，主动查询支付宝支付状态
    if (paymentMethod === 'alipay' && order.status === 'pending' && order.payment_id) {
      try {
        const alipaySdk = getAlipayClient();
        const result = await alipaySdk.exec('alipay.trade.query', {
          bizContent: {
            out_trade_no: order.payment_id
          }
        });
        
        if (result.code === '10000') {
          if (result.tradeStatus === 'TRADE_SUCCESS' || result.tradeStatus === 'TRADE_FINISHED') {
            // 更新订单状态为已支付
            await query(
              `UPDATE orders SET status = 'paid', payment_method = 'alipay', paid_at = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') WHERE id = $1`,
              [orderId]
            );
            return res.json({ 
              success: true, 
              message: getMessage('PAYMENT.GET_STATUS_SUCCESS'), 
              data: { orderId, status: 'paid' } 
            });
          } /*else if (result.tradeStatus === 'TRADE_CLOSED') {
            // 更新订单状态为已取消
            await query(
              `UPDATE orders SET status = 'cancelled', payment_method = 'alipay' WHERE id = $1`,
              [orderId]
            );
            return res.json({ 
              success: true, 
              message: getMessage('PAYMENT.GET_STATUS_SUCCESS'), 
              data: { orderId, status: 'cancelled' } 
            });
          }*/
        }
      } catch (error) {
        console.error('Failed to query Alipay payment status:', error);
      }
    }
    
    return res.json({ success: true, message: getMessage('PAYMENT.GET_STATUS_SUCCESS'), data: { orderId, status: order.status } });
  } catch (error) {
    return res.json({ success: false, message: error.message, data: null });
  }
};

// 支付回调（微信/支付宝）
exports.paymentCallback = async (req, res) => {
  try {
    const { orderId, paymentMethod, paymentId, status } = req.body;
    const orders = await query(
      `SELECT id, status FROM orders WHERE id = $1`,
      [orderId]
    );
    if (orders.getRowCount() === 0) {
      return res.json({ success: false, message: getMessage('PAYMENT.ORDER_NOT_FOUND'), data: null });
    }
    const order = orders.getFirstRow();
    if (order.status !== 'pending') {
      return res.json({ success: false, message: getMessage('PAYMENT.INVALID_ORDER_STATUS_FOR_UPDATE'), data: null });
    }
    let newStatus;
    if (status === 'success') {
      newStatus = 'paid';
      await query(
        `UPDATE orders SET status = $1, payment_method = 'alipay', payment_id = $2, paid_at = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') WHERE id = $3`,
        [newStatus, paymentId, orderId]
      );
    } /*else if (status === 'fail' || status === 'cancel') {
      newStatus = 'cancelled';
      await query(
        `UPDATE orders SET status = $1, payment_method = 'alipay', payment_id = $2 WHERE id = $3`,
        [newStatus, paymentId, orderId]
      );
    } */else {
      return res.json({ success: false, message: getMessage('PAYMENT.UNSUPPORTED_STATUS'), data: null });
    }
    return res.json({ success: true, message: getMessage('PAYMENT.STATUS_UPDATE_SUCCESS'), data: { orderId, status: newStatus } });
  } catch (error) {
    return res.json({ success: false, message: error.message, data: null });
  }
};

// 支付宝异步通知回调
exports.alipayNotify = async (req, res) => {
  try {
    const alipaySdk = getAlipayClient();
    const postData = req.body;
    
    // 验证支付宝异步通知签名
    const signVerified = alipaySdk.checkNotifySign(postData);
    
    if (!signVerified) {
      console.error('Alipay notification signature verification failed');
      return res.status(400).send('fail');
    }
    
    const {
      out_trade_no,
      trade_status,
      trade_no,
      total_amount
    } = postData;
    
    // 从商户订单号中提取订单ID
    const orderIdMatch = out_trade_no.match(/ORDER_(\d+)_/);
    if (!orderIdMatch) {
      console.error('Invalid merchant order number format:', out_trade_no);
      return res.status(400).send('fail');
    }
    
    const orderId = parseInt(orderIdMatch[1]);
    
    // 查询订单
    const orders = await query(
      `SELECT id, status, total_amount, shipping_fee, exchange_rate FROM orders WHERE id = $1`,
      [orderId]
    );
    
    if (orders.getRowCount() === 0) {
      console.error('Order not found:', orderId);
      return res.status(400).send('fail');
    }
    
    const order = orders.getFirstRow();
    
    // 验证金额 - 如果有汇率，则使用汇率计算CNY金额；否则直接使用USD金额
    const expectedAmount = order.exchange_rate 
      ? ((parseFloat(order.total_amount) + parseFloat(order.shipping_fee)) * parseFloat(order.exchange_rate))
      : (parseFloat(order.total_amount) + parseFloat(order.shipping_fee));
    
    if (Math.abs(parseFloat(total_amount) - expectedAmount) > 0.01) { // 允许0.01的误差
      console.error('Payment amount mismatch:', {
        expected: expectedAmount,
        received: total_amount,
        exchangeRate: order.exchange_rate,
        usdAmount: parseFloat(order.total_amount) + parseFloat(order.shipping_fee)
      });
      return res.status(400).send('fail');
    }
    
    // 根据交易状态更新订单
    let newStatus;
    if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
      newStatus = 'paid';
      // 更新订单状态为已支付，设置paid_at
      await query(
        `UPDATE orders SET status = $1, payment_id = $2, paid_at = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') WHERE id = $3`,
        [newStatus, trade_no, orderId]
      );
    } /*else if (trade_status === 'TRADE_CLOSED') {
      newStatus = 'cancelled';
      // 更新订单状态为已取消
      await query(
        `UPDATE orders SET status = $1, payment_id = $2 WHERE id = $3`,
        [newStatus, trade_no, orderId]
      );
    }*/else {
      // 其他状态暂不处理
      console.log('Alipay trade status:', trade_status, 'Order ID:', orderId);
      return res.send('success');
    }
    
    console.log('Alipay notification processed successfully:', {
      orderId,
      tradeNo: trade_no,
      tradeStatus: trade_status,
      newStatus
    });
    
    return res.send('success');
    
  } catch (error) {
    console.error('Failed to process Alipay notification:', error);
    return res.status(500).send('fail');
  }
};

// 获取汇率信息
exports.getExchangeRate = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 首先尝试获取当天的汇率
    const todayRateQuery = `
      SELECT exchange_rate, from_currency, to_currency, rate_date, source
      FROM exchange_rates 
      WHERE from_currency = 'USD' 
        AND to_currency = 'CNY' 
        AND rate_date = $1
        AND status = 'active'
        AND deleted = false
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    
    const todayResult = await query(todayRateQuery, [today]);
    
    if (todayResult.getRowCount() > 0) {
      const row = todayResult.getFirstRow();
      return res.json({
        success: true,
        data: {
          rate: row.exchange_rate,
          fromCurrency: row.from_currency,
          toCurrency: row.to_currency,
          rateDate: row.rate_date,
          dataSource: row.data_source,
          isToday: true
        }
      });
    }
    
    // 如果当天没有汇率，获取最近的汇率
    const latestRateQuery = `
      SELECT exchange_rate, from_currency, to_currency, rate_date, source
      FROM exchange_rates 
      WHERE from_currency = 'USD' 
        AND to_currency = 'CNY' 
        AND status = 'active'
        AND deleted = false
      ORDER BY rate_date DESC, updated_at DESC
      LIMIT 1
    `;
    
    const latestResult = await query(latestRateQuery);
    
    if (latestResult.getRowCount() > 0) {
      const row = latestResult.getFirstRow();
      return res.json({
        success: true,
        data: {
          rate: row.exchange_rate,
          fromCurrency: row.from_currency,
          toCurrency: row.to_currency,
          rateDate: row.rate_date,
          dataSource: row.data_source,
          isToday: false
        }
      });
    }
    
    // 如果没有任何汇率数据
    return res.json({
      success: false,
      message: getMessage('PAYMENT.EXCHANGE_RATE.NOT_FOUND'),
      data: null
    });
    
  } catch (error) {
    console.error('获取汇率失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('PAYMENT.EXCHANGE_RATE.FETCH_ERROR'),
      error: error.message
    });
  }
};

// PayPal退款
exports.refundPayPalPayment = async (req, res) => {
  try {
    const { orderId, refundAmount, reason } = req.body;
    const userId = req.userId;
    
    // 验证必要参数
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: getMessage('PAYMENT.ORDER_ID_REQUIRED')
      });
    }
    
    // 查询订单信息 - 管理员和业务员可以退款管理的用户的订单，普通用户只能退款自己的订单
    let orders;
    if (req.userRole === 'admin' || req.userRole === 'business') {
      // 业务员和管理员只能退款自己管理的用户的订单
      const managedUserIds = await getManagedUserIds(userId);
      if (managedUserIds.length === 0) {
        return res.status(403).json({
          success: false,
          message: getMessage('PAYMENT.NO_MANAGED_USERS')
        });
      }
      
      orders = await query(
        `SELECT id, payment_id, total_amount, shipping_fee, status, payment_method, user_id 
         FROM orders 
         WHERE id = $1 AND user_id = ANY($2) AND deleted = false`,
        [orderId, managedUserIds]
      );
    } else {
      orders = await query(
        `SELECT id, payment_id, total_amount, shipping_fee, status, payment_method, user_id 
         FROM orders 
         WHERE id = $1 AND user_id = $2 AND deleted = false`,
        [orderId, userId]
      );
    }
    
    if (orders.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('PAYMENT.ORDER_NOT_FOUND_OR_NO_PERMISSION')
      });
    }
    
    const order = orders.getFirstRow();
    
    // 验证订单状态和支付方式
    if (order.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: getMessage('PAYMENT.ORDER_NOT_PAID')
      });
    }
    
    if (order.payment_method !== 'paypal') {
      return res.status(400).json({
        success: false,
        message: getMessage('PAYMENT.INVALID_PAYMENT_METHOD_FOR_REFUND')
      });
    }
    
    if (!order.payment_id) {
      return res.status(400).json({
        success: false,
        message: getMessage('PAYMENT.PAYMENT_ID_NOT_FOUND')
      });
    }
    
    // 验证退款金额 - PayPal支付使用USD，直接使用订单金额
    const totalAmount = parseFloat(order.total_amount) + parseFloat(order.shipping_fee);
    const refundAmountFloat = refundAmount ? parseFloat(refundAmount) : totalAmount;
    
    if (refundAmountFloat <= 0 || refundAmountFloat > totalAmount) {
      return res.status(400).json({
        success: false,
        message: getMessage('PAYMENT.INVALID_REFUND_AMOUNT')
      });
    }
    
    try {
      // 创建PayPal客户端
      const client = getPayPalClient();
      const ordersController = new OrdersController(client);
      
      // 获取PayPal订单详情以获取capture ID
      const getOrderRequest = { id: order.payment_id };
      const { body: orderBody } = await ordersController.getOrder(getOrderRequest);
      const orderData = JSON.parse(orderBody);
      
      // 查找capture ID
      let captureId = null;
      if (orderData.purchase_units && orderData.purchase_units[0] && 
          orderData.purchase_units[0].payments && orderData.purchase_units[0].payments.captures) {
        captureId = orderData.purchase_units[0].payments.captures[0].id;
      }
      
      if (!captureId) {
        return res.status(400).json({
          success: false,
          message: getMessage('PAYMENT.PAYPAL.CAPTURE_ID_NOT_FOUND')
        });
      }
      
      // 执行退款 - 使用PayPal REST API
      const accessToken = await getPayPalAccessToken();
      const baseURL = process.env.PAYPAL_API_URL;
      
      const refundData = {
        amount: {
          currency_code: 'USD',
          value: refundAmountFloat.toFixed(2)
        },
        note_to_payer: reason || 'Refund processed'
      };
      
      const refundResponse = await axios.post(
        `${baseURL}/v2/payments/captures/${captureId}/refund`,
        refundData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      const refundResult = refundResponse.data;
      
      // 更新订单状态
      const connection = await getConnection();
      await connection.beginTransaction();
      
      try {
        // 更新订单状态为已退款
        await connection.query(
          `UPDATE orders SET 
           status = $1, 
           updated_by = $2 
           WHERE id = $3`,
          ['refunded', userId, orderId]
        );
        
        // 恢复库存（只对自营商品）
        const orderItems = await connection.query(
          `SELECT oi.product_id, oi.quantity 
           FROM order_items oi 
           JOIN products p ON oi.product_id = p.id 
           WHERE oi.order_id = $1 AND p.product_type = 'self_operated' AND p.deleted = false`,
          [orderId]
        );
        
        for (const item of orderItems.getRows()) {
          await connection.query(
            `UPDATE products SET stock = stock + $1, updated_by = $2 WHERE id = $3`,
            [item.quantity, userId, item.product_id]
          );
        }
        
        await connection.commit();
        connection.release();
        
        return res.status(200).json({
          success: true,
          message: getMessage('PAYMENT.PAYPAL.REFUND_SUCCESS'),
          data: {
            orderId: orderId,
            refundId: refundResult.id,
            refundAmount: refundAmountFloat,
            status: refundResult.status
          }
        });
        
      } catch (dbError) {
        await connection.rollback();
        connection.release();
        
        // 记录失败信息 - PayPal退款成功但数据库更新失败
        refundFailureLogger.logPayPalRefundFailure({
          orderId: orderId,
          refundId: refundResult.id,
          refundAmount: refundAmountFloat,
          captureId: captureId,
          userId: userId,
          reason: reason,
          dbError: dbError
        });
        
        // 返回特殊错误，表明退款成功但数据库更新失败
        return res.status(500).json({
          success: false,
          message: 'PayPal退款成功，但系统更新失败。请联系管理员处理。',
          error: 'DATABASE_UPDATE_FAILED_AFTER_REFUND',
          refundId: refundResult.id
        });
      }
      
    } catch (paypalError) {
      console.error('PayPal退款失败:', paypalError);
      return res.status(500).json({
        success: false,
        message: getMessage('PAYMENT.PAYPAL.REFUND_FAILED'),
        error: paypalError.message
      });
    }
    
  } catch (error) {
    console.error('PayPal退款处理失败:', error);
    return res.status(500).json({
       success: false,
       message: getMessage('PAYMENT.REFUND_PROCESS_FAILED'),
       error: error.message
     });
   }
 };

// 支付宝退款
exports.refundAlipayPayment = async (req, res) => {
  try {
    const { orderId, refundAmount, reason } = req.body;
    const userId = req.userId;
    
    // 验证必要参数
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: getMessage('PAYMENT.ORDER_ID_REQUIRED')
      });
    }
    
    // 查询订单信息 - 管理员和业务员可以退款管理的用户的订单，普通用户只能退款自己的订单
    let orders;
    if (req.userRole === 'admin' || req.userRole === 'business') {
      // 业务员和管理员只能退款自己管理的用户的订单
      const managedUserIds = await getManagedUserIds(userId);
      if (managedUserIds.length === 0) {
        return res.status(403).json({
          success: false,
          message: getMessage('PAYMENT.NO_MANAGED_USERS')
        });
      }
      
      orders = await query(
        `SELECT id, payment_id, total_amount, shipping_fee, exchange_rate, status, payment_method, user_id 
         FROM orders 
         WHERE id = $1 AND user_id = ANY($2) AND deleted = false`,
        [orderId, managedUserIds]
      );
    } else {
      orders = await query(
        `SELECT id, payment_id, total_amount, shipping_fee, exchange_rate, status, payment_method, user_id 
         FROM orders 
         WHERE id = $1 AND user_id = $2 AND deleted = false`,
        [orderId, userId]
      );
    }
    
    if (orders.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('PAYMENT.ORDER_NOT_FOUND_OR_NO_PERMISSION')
      });
    }
    
    const order = orders.getFirstRow();
    
    // 验证订单状态和支付方式
    if (order.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: getMessage('PAYMENT.ORDER_NOT_PAID')
      });
    }
    
    if (order.payment_method !== 'alipay') {
      return res.status(400).json({
        success: false,
        message: getMessage('PAYMENT.INVALID_PAYMENT_METHOD_FOR_REFUND')
      });
    }
    
    if (!order.payment_id) {
      return res.status(400).json({
        success: false,
        message: getMessage('PAYMENT.PAYMENT_ID_NOT_FOUND')
      });
    }
    
    // 验证退款金额 - 支付宝支付需要使用汇率将USD转换为CNY
    const usdTotalAmount = parseFloat(order.total_amount) + parseFloat(order.shipping_fee);
    const totalAmount = order.exchange_rate 
      ? (usdTotalAmount * parseFloat(order.exchange_rate))
      : usdTotalAmount;
    const refundAmountFloat = refundAmount ? parseFloat(refundAmount) : totalAmount;
    
    if (refundAmountFloat <= 0 || refundAmountFloat > totalAmount) {
      return res.status(400).json({
        success: false,
        message: getMessage('PAYMENT.INVALID_REFUND_AMOUNT')
      });
    }
    
    try {
      // 创建支付宝客户端
      const alipaySdk = getAlipayClient();
      
      // 生成退款请求号
      const refundRequestNo = `REFUND_${orderId}_${Date.now()}`;
      
      // 执行退款
      const refundResult = await alipaySdk.exec('alipay.trade.refund', {
        bizContent: {
          out_trade_no: order.payment_id, // 商户订单号
          refund_amount: refundAmountFloat.toFixed(2), // 退款金额
          refund_reason: reason || 'Customer refund request', // 退款原因
          out_request_no: refundRequestNo // 退款请求号
        }
      });
      
      // 检查退款结果
      if (refundResult.code !== '10000') {
        return res.status(400).json({
          success: false,
          message: getMessage('PAYMENT.ALIPAY.REFUND_FAILED'),
          error: refundResult.msg || refundResult.sub_msg
        });
      }
      
      // 更新订单状态
      const connection = await getConnection();
      await connection.beginTransaction();
      
      try {
        // 更新订单状态为已退款
        await connection.query(
          `UPDATE orders SET 
           status = $1, 
           updated_by = $2 
           WHERE id = $3`,
          ['refunded', userId, orderId]
        );
        
        // 恢复库存（只对自营商品）
        const orderItems = await connection.query(
          `SELECT oi.product_id, oi.quantity 
           FROM order_items oi 
           JOIN products p ON oi.product_id = p.id 
           WHERE oi.order_id = $1 AND p.product_type = 'self_operated' AND p.deleted = false`,
          [orderId]
        );
        
        for (const item of orderItems.getRows()) {
          await connection.query(
            `UPDATE products SET stock = stock + $1, updated_by = $2 WHERE id = $3`,
            [item.quantity, userId, item.product_id]
          );
        }
        
        await connection.commit();
        connection.release();
        
        return res.status(200).json({
          success: true,
          message: getMessage('PAYMENT.ALIPAY.REFUND_SUCCESS'),
          data: {
            orderId: orderId,
            refundRequestNo: refundRequestNo,
            refundAmount: refundAmountFloat,
            alipayRefundId: refundResult.trade_no,
            refundTime: refundResult.gmt_refund_pay
          }
        });
        
      } catch (dbError) {
        await connection.rollback();
        connection.release();
        
        // 记录失败信息 - Alipay退款成功但数据库更新失败
        refundFailureLogger.logAlipayRefundFailure({
          orderId: orderId,
          refundRequestNo: refundRequestNo,
          refundAmount: refundAmountFloat,
          alipayRefundId: refundResult.trade_no,
          userId: userId,
          reason: reason,
          dbError: dbError
        });
        
        // 返回特殊错误，表明退款成功但数据库更新失败
        return res.status(500).json({
          success: false,
          message: 'Alipay退款成功，但系统更新失败。请联系管理员处理。',
          error: 'DATABASE_UPDATE_FAILED_AFTER_REFUND',
          alipayRefundId: refundResult.trade_no
        });
      }
      
    } catch (alipayError) {
      console.error('支付宝退款失败:', alipayError);
      return res.status(500).json({
        success: false,
        message: getMessage('PAYMENT.ALIPAY.REFUND_FAILED'),
        error: alipayError.message
      });
    }
    
  } catch (error) {
    console.error('支付宝退款处理失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('PAYMENT.REFUND_PROCESS_FAILED'),
      error: error.message
    });
  }
};