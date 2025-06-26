const { pool } = require('../db/db');
const { v4: uuidv4 } = require('uuid');
const { uuidToBinary, binaryToUuid } = require('../utils/uuid');
const QRCode = require('qrcode');
const { getMessage } = require('../config/messages');
const {
  ApiError,
  CheckoutPaymentIntent,
  Client,
  Environment,
  LogLevel,
  OrdersController,
} = require('@paypal/paypal-server-sdk');
const {AlipaySdk} = require('alipay-sdk');
const fs = require('fs');
const path = require('path');

function getPayPalClient() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_SECRET;
  if (!clientId || !clientSecret) throw new Error('PayPal配置不完整');
  const environment = process.env.NODE_ENV === 'production' ? Environment.Live : Environment.Sandbox;
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
  if (!appId) throw new Error(getMessage('payment.alipay.config_missing'));
  
  const privateKeyPath = process.env.NODE_ENV === 'production'? path.join(__dirname, '../public/keys/myPrivateKey.txt'):path.join(__dirname, '../public/keys/myPrivateKey_dev.txt');
  const alipayPublicKeyPath = process.env.NODE_ENV === 'production'? path.join(__dirname, '../public/keys/alipayPublicKey_RSA2.txt'):path.join(__dirname, '../public/keys/alipayPublicKey_RSA2_dev.txt');
  
  if (!fs.existsSync(privateKeyPath)) {
    throw new Error(getMessage('payment.alipay.private_key_not_found'));
  }
  if (!fs.existsSync(alipayPublicKeyPath)) {
    throw new Error(getMessage('payment.alipay.public_key_not_found'));
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

// 统一订单初始化
async function initOrder(userId, cartItems, shippingInfo, paymentMethod, connection) {
  let totalAmount = 0;
  for (const item of cartItems) totalAmount += item.price * item.quantity;
  const orderGuid = uuidToBinary(uuidv4());
  const [orderResult] = await connection.query(
    `INSERT INTO orders 
     (user_id, total_amount, status, payment_method, order_guid, 
      shipping_name, shipping_phone, shipping_email, shipping_address, shipping_zip_code,
      created_by, updated_by) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      totalAmount,
      'pending',
      paymentMethod,
      orderGuid,
      shippingInfo.name,
      shippingInfo.phone,
      shippingInfo.email,
      shippingInfo.shipping_address || shippingInfo.detail,
      shippingInfo.shipping_zip_code || shippingInfo.zipCode || '',
      userId,
      userId
    ]
  );
  const orderId = orderResult.insertId;
  for (const item of cartItems) {
    await connection.query(
      `INSERT INTO order_items 
       (order_id, product_id, quantity, price, product_name, product_code, created_by, updated_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, item.product_id, item.quantity, item.price, item.product_name || item.name, item.product_code, userId, userId]
    );
    await connection.query(
      `UPDATE products SET stock = stock - ?, updated_by = ? WHERE id = ? AND deleted = 0`,
      [item.quantity, userId, item.product_id]
    );
    await connection.query(
      `UPDATE cart_items SET deleted = 1, updated_by = ? WHERE user_id = ? AND deleted = 0 and product_id =?`,
      [userId, userId, item.product_id]
    );
  }
  return { orderId, orderGuid, totalAmount };
}

// PayPal订单创建
exports.createPayPalOrder = async (req, res) => {
  try {
    const { shippingInfo, orderItems } = req.body;
    const userId = req.userId;
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      let cartItems;
      if (orderItems && Array.isArray(orderItems) && orderItems.length > 0) {
        cartItems = orderItems;
      } else {
        const [dbCartItems] = await connection.query(
          `SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.product_code, p.stock 
           FROM cart_items ci 
           JOIN products p ON ci.product_id = p.id 
           WHERE ci.user_id = ? AND ci.deleted = 0 AND p.deleted = 0`,
          [userId]
        );
        cartItems = dbCartItems;
      }
      if (!cartItems || cartItems.length === 0) {
        await connection.rollback();
        connection.release();
        return res.json({ success: false, message: getMessage('CART.EMPTY'), data: null });
      }
      const { orderId, totalAmount } = await initOrder(userId, cartItems, shippingInfo, 'paypal', connection);
      const client = getPayPalClient();
      const ordersController = new OrdersController(client);
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
        `UPDATE orders SET payment_id = ?, updated_by = ? WHERE id = ?`,
        [paypalOrderData.id, req.userId, orderId]
      );
      await connection.commit();
      connection.release();
      
       return res.json({ success: true, message: getMessage('PAYMENT.PAYPAL_ORDER_CREATE_SUCCESS'), data: { orderId, paypalOrderId: paypalOrderData.id } });
    } catch (error) {
      await connection.rollback();
      connection.release();
      return res.json({ success: false, message: error.message, data: null });
    }
  } catch (error) {
    return res.json({ success: false, message: error.message, data: null });
  }
};

// PayPal支付捕获
exports.capturePayPalPayment = async (req, res) => {
  try {
    const { paypalOrderId, orderId } = req.body;
    const [orders] = await pool.query(
      `SELECT id, status FROM orders WHERE id = ? AND payment_id = ?`,
      [orderId, paypalOrderId]
    );
    if (orders.length === 0) {
      return res.json({ success: false, message: getMessage('PAYMENT.ORDER_NOT_FOUND_OR_MISMATCH'), data: null });
    }
    const order = orders[0];
    if (order.status !== 'pending') {
      return res.json({ success: false, message: getMessage('PAYMENT.INVALID_ORDER_STATUS'), data: null });
    }
    const client = getPayPalClient();
    const ordersController = new OrdersController(client);
    const request = { id: paypalOrderId };
    const { body } = await ordersController.captureOrder(request);
    const captureData = JSON.parse(body);
    await pool.query(
      `UPDATE orders SET status = ?, updated_by = ? WHERE id = ?`,
      ['paid', req.userId, orderId]
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
    const [orders] = await pool.query(
      `SELECT id, total_amount, status, user_id FROM orders WHERE id = ? AND user_id = ? AND deleted = 0`,
      [orderId, userId]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('PAYMENT.ORDER_NOT_FOUND_OR_NO_PERMISSION')
      });
    }
    
    const order = orders[0];
    
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
              value: Number(order.total_amount).toFixed(2)
            }
          }
        ]
      },
      prefer: "return=minimal",
    };
    
    const { body } = await ordersController.createOrder(request);
    const paypalOrderData = JSON.parse(body);
    
    // 更新订单的PayPal订单ID
    await pool.query(
      `UPDATE orders SET payment_id = ?, updated_by = ? WHERE id = ?`,
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
    const { shippingInfo, paymentMethod, orderItems } = req.body;
    const userId = req.userId;
    if (!['wechat', 'alipay'].includes(paymentMethod)) {
      return res.json({ success: false, message: getMessage('PAYMENT.UNSUPPORTED_METHOD'), data: null });
    }
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      let cartItems;
      if (orderItems && Array.isArray(orderItems) && orderItems.length > 0) {
        cartItems = orderItems;
      } else {
        const [dbCartItems] = await connection.query(
          `SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.product_code, p.stock 
           FROM cart_items ci 
           JOIN products p ON ci.product_id = p.id 
           WHERE ci.user_id = ? AND ci.deleted = 0 AND p.deleted = 0`,
          [userId]
        );
        cartItems = dbCartItems;
      }
      if (!cartItems || cartItems.length === 0) {
        await connection.rollback();
        connection.release();
        return res.json({ success: false, message: getMessage('CART.EMPTY'), data: null });
      }
      const { orderId } = await initOrder(userId, cartItems, shippingInfo, paymentMethod, connection);
      await connection.commit();
      connection.release();
      
      // 如果是从购物车创建的订单，清空购物车
      if (!orderItems || orderItems.length === 0) {
        await pool.query(
          `UPDATE cart_items SET deleted = 1, updated_by = ? WHERE user_id = ? AND deleted = 0`,
          [userId, userId]
        );
      }
      
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
    const { orderId, paymentMethod } = req.body;
    const [orders] = await pool.query(
      `SELECT id, total_amount, status FROM orders WHERE id = ?`,
      [orderId]
    );
    if (orders.length === 0) {
      return res.json({ success: false, message: getMessage('PAYMENT.ORDER_NOT_FOUND'), data: null });
    }
    const order = orders[0];
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
        
        // 调用支付宝预下单接口
        const result = await alipaySdk.exec('alipay.trade.precreate', {
          bizContent: {
            out_trade_no: outTradeNo,
            total_amount: order.total_amount.toString(),
            subject: `AutoEaseXpert - ${orderId}`,
            product_code: 'FACE_TO_FACE_PAYMENT', // 当面付产品码
            body: `AutoEaseXpert Order：${orderId}`,
            store_id: 'VEHICLE_STORE_001',
            operator_id: 'OPERATOR_001',
            terminal_id: 'TERMINAL_001',
            timeout_express: '30m',
            notify_url: `${process.env.BASE_URL || 'http://localhost:3000'}/api/payment/alipay/notify`
          }
        });
        
        if (result.code === '10000' && result.qrCode) {
          // 保存商户订单号到数据库
          await pool.query(
            `UPDATE orders SET payment_id = ? WHERE id = ?`,
            [outTradeNo, orderId]
          );
          paymentUrl = result.qrCode;
        } else {
          console.error('Alipay precreate failed:', result);
          return res.json({ 
            success: false, 
            message: getMessage('payment.alipay.precreate_failed'), 
            data: null 
          });
        }
      } catch (error) {
        console.error('Alipay SDK error:', error);
        return res.json({ 
          success: false, 
          message: getMessage('payment.alipay.service_error'), 
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
    const [orders] = await pool.query(
      `SELECT id, status, payment_id FROM orders WHERE id = ?`,
      [orderId]
    );
    if (orders.length === 0) {
      return res.json({ success: false, message: getMessage('PAYMENT.ORDER_NOT_FOUND'), data: null });
    }
    const order = orders[0];
    
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
            await pool.query(
              `UPDATE orders SET status = 'paid' WHERE id = ?`,
              [orderId]
            );
            return res.json({ 
              success: true, 
              message: getMessage('PAYMENT.GET_STATUS_SUCCESS'), 
              data: { orderId, status: 'paid' } 
            });
          } else if (result.tradeStatus === 'TRADE_CLOSED') {
            // 更新订单状态为已取消
            await pool.query(
              `UPDATE orders SET status = 'cancelled' WHERE id = ?`,
              [orderId]
            );
            return res.json({ 
              success: true, 
              message: getMessage('PAYMENT.GET_STATUS_SUCCESS'), 
              data: { orderId, status: 'cancelled' } 
            });
          }
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
    const [orders] = await pool.query(
      `SELECT id, status FROM orders WHERE id = ?`,
      [orderId]
    );
    if (orders.length === 0) {
      return res.json({ success: false, message: getMessage('PAYMENT.ORDER_NOT_FOUND'), data: null });
    }
    const order = orders[0];
    if (order.status !== 'pending') {
      return res.json({ success: false, message: getMessage('PAYMENT.INVALID_ORDER_STATUS_FOR_UPDATE'), data: null });
    }
    let newStatus;
    if (status === 'success') {
      newStatus = 'paid';
    } else if (status === 'fail' || status === 'cancel') {
      newStatus = 'cancelled';
    } else {
      return res.json({ success: false, message: getMessage('PAYMENT.UNSUPPORTED_STATUS'), data: null });
    }
    await pool.query(
      `UPDATE orders SET status = ?, payment_id = ? WHERE id = ?`,
      [newStatus, paymentId, orderId]
    );
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
    const [orders] = await pool.query(
      `SELECT id, status, total_amount FROM orders WHERE id = ?`,
      [orderId]
    );
    
    if (orders.length === 0) {
      console.error('Order not found:', orderId);
      return res.status(400).send('fail');
    }
    
    const order = orders[0];
    
    // 验证金额
    if (parseFloat(total_amount) !== parseFloat(order.total_amount)) {
      console.error('Payment amount mismatch:', {
        expected: order.total_amount,
        received: total_amount
      });
      return res.status(400).send('fail');
    }
    
    // 根据交易状态更新订单
    let newStatus;
    if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
      newStatus = 'paid';
    } else if (trade_status === 'TRADE_CLOSED') {
      newStatus = 'cancelled';
    } else {
      // 其他状态暂不处理
      console.log('Alipay trade status:', trade_status, 'Order ID:', orderId);
      return res.send('success');
    }
    
    // 更新订单状态
    await pool.query(
      `UPDATE orders SET status = ?, payment_id = ? WHERE id = ?`,
      [newStatus, trade_no, orderId]
    );
    
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