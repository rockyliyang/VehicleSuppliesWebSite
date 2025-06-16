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
      paymentUrl = `https://example.com/alipay?orderId=${orderId}&amount=${order.total_amount}`;
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
      `SELECT id, status FROM orders WHERE id = ?`,
      [orderId]
    );
    if (orders.length === 0) {
      return res.json({ success: false, message: getMessage('PAYMENT.ORDER_NOT_FOUND'), data: null });
    }
    const order = orders[0];
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