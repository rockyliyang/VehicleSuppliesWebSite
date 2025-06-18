const { pool } = require('../db/db');
const { v4: uuidv4 } = require('uuid');
const { binaryToUuid } = require('../utils/uuid');
const AlipaySdk = require('alipay-sdk').default;
const QRCode = require('qrcode');
const { ALIPAY_APP_ID, ALIPAY_PRIVATE_KEY, ALIPAY_PUBLIC_KEY, ALIPAY_GATEWAY, WECHAT_APP_ID, WECHAT_MCH_ID, WECHAT_API_KEY, WECHAT_NOTIFY_URL } = require('../config/env');
const { getMessage } = require('../config/messages');

// 根据环境变量决定使用哪个支付网关
const PAYMENT_GATEWAY = process.env.PAYMENT_GATEWAY || 'stripe';

// 初始化支付网关
let stripe;


if (PAYMENT_GATEWAY === 'stripe') {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} 


/**
 * 创建订单
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.createOrder = async (req, res) => {
  const { shippingInfo, paymentMethod } = req.body;
  const userId = req.userId; // 从JWT获取用户ID

  try {
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
          message: getMessage('ORDER.CART_EMPTY')
        });
      }

      // 2. 计算订单总金额
      let totalAmount = 0;
      for (const item of cartItems) {
        totalAmount += item.price * item.quantity;
      }

      // 3. 创建订单记录
      const orderGuid = uuidv4();
      const orderNumber = `ORD${Date.now()}`;
      const [orderResult] = await connection.query(
        `INSERT INTO orders 
         (user_id, order_number, total_amount, status, payment_method, order_guid, 
          shipping_name, shipping_phone, shipping_email, shipping_address, shipping_zip_code,
          created_by, updated_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          orderNumber,
          totalAmount,
          'pending', // 初始状态为待支付
          paymentMethod,
          orderGuid,
          shippingInfo.name,
          shippingInfo.phone,
          shippingInfo.email,
          `${shippingInfo.region.join(',')} ${shippingInfo.address}`,
          shippingInfo.zipCode,
          userId,
          userId
        ]
      );

      const orderId = orderResult.insertId;

      // 4. 创建订单项
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

        // 5. 更新产品库存
        await connection.query(
          `UPDATE products SET stock = stock - ?, updated_by = ? WHERE id = ? AND deleted = 0`,
          [item.quantity, req.userId, item.product_id]
        );
      }

      // 6. 提交事务
      await connection.commit();
      connection.release();

      // 7. 返回订单信息
      return res.status(200).json({
        success: true,
        message: getMessage('ORDER.CREATE_SUCCESS'),
        data: {
          orderId,
          orderGuid,
          totalAmount
        }
      });
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('创建订单失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('ORDER.CREATE_FAILED'),
      error: error.message
    });
  }
};

/**
 * 处理支付
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.processPayment = async (req, res) => {
  const { paymentMethod, token, shippingInfo } = req.body;
  const userId = req.userId; // 从JWT获取用户ID

  try {
    // 1. 获取用户购物车
    const [cartItems] = await pool.query(
      `SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.product_code 
       FROM cart_items ci 
       JOIN products p ON ci.product_id = p.id 
       WHERE ci.user_id = ? AND ci.deleted = 0 AND p.deleted = 0`,
      [userId]
    );

    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('ORDER.CART_EMPTY')
      });
    }

    // 2. 计算订单总金额
    let totalAmount = 0;
    const lineItems = [];
    for (const item of cartItems) {
      totalAmount += item.price * item.quantity;
      lineItems.push({
        name: item.name,
        description: `产品编号: ${item.product_code}`,
        amount: Math.round(item.price * 100), // Stripe金额以分为单位
        currency: 'cny',
        quantity: item.quantity
      });
    }

    let paymentResult;

    // 3. 根据支付方式处理支付
    if (paymentMethod === 'card') {
      if (PAYMENT_GATEWAY === 'stripe' && stripe) {
        // 使用Stripe处理信用卡支付
        paymentResult = await stripe.charges.create({
          amount: Math.round(totalAmount * 100), // 转换为分
          currency: 'cny',
          source: token,
          description: `订单支付 - 用户ID: ${userId}`,
          metadata: {
            user_id: userId
          }
        });
      } else {
        // 支付网关未正确配置
        return res.status(500).json({
          success: false,
          message: getMessage('ORDER.PAYMENT_GATEWAY_ERROR'),
          error: `未正确配置支付网关: ${PAYMENT_GATEWAY}`
        });
      }
    } else if (paymentMethod === 'alipay') {
      // 处理支付宝支付
      // 实际项目中需要集成支付宝SDK
      paymentResult = {
        id: `alipay_${Date.now()}`,
        status: 'succeeded'
      };
    } else if (paymentMethod === 'wechat') {
      // 处理微信支付
      // 实际项目中需要集成微信支付SDK
      paymentResult = {
        id: `wechat_${Date.now()}`,
        status: 'succeeded'
      };
    } else {
      return res.status(400).json({
        success: false,
        message: getMessage('ORDER.UNSUPPORTED_PAYMENT_METHOD')
      });
    }

    // 4. 创建订单
    const orderGuid = uuidv4();
    const [orderResult] = await pool.query(
      `INSERT INTO orders 
       (user_id, total_amount, status, payment_method, payment_id, order_guid, 
        shipping_name, shipping_phone, shipping_email, shipping_address, shipping_zip_code,
        created_by, updated_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        totalAmount,
        'paid', // 已支付状态
        paymentMethod,
        paymentResult.id,
        orderGuid,
        shippingInfo.name,
        shippingInfo.phone,
        shippingInfo.email,
        `${shippingInfo.region.join(',')} ${shippingInfo.address}`,
        shippingInfo.zipCode,
        userId,
        userId
      ]
    );

    const orderId = orderResult.insertId;

    // 5. 创建订单项并更新库存
    for (const item of cartItems) {
      await pool.query(
        `INSERT INTO order_items 
         (order_id, product_id, quantity, price, product_name, product_code, created_by, updated_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product_id,
          item.quantity,
          item.price,
          item.name,
          item.product_code,
          userId,
          userId
        ]
      );

      // 更新产品库存
      await pool.query(
        `UPDATE products SET stock = stock - ?, updated_by = ? WHERE id = ? AND deleted = 0`,
        [item.quantity, userId, item.product_id]
      );
    }

    // 6. 清空购物车
    await pool.query(
      `UPDATE cart_items SET deleted = 1, updated_by = ? WHERE user_id = ? AND deleted = 0`,
      [userId, userId]
    );

    // 7. 返回订单信息
    return res.status(200).json({
      success: true,
      message: getMessage('ORDER.PAYMENT_SUCCESS'),
      data: {
        orderId,
        orderGuid,
        paymentId: paymentResult.id,
        totalAmount
      }
    });
  } catch (error) {
    console.error('处理支付失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('ORDER.PAYMENT_FAILED'),
      error: error.message
    });
  }
};

/**
 * 获取订单列表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getOrders = async (req, res) => {
  const userId = req.userId; // 从JWT获取用户ID
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  try {
    // 获取订单总数
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM orders WHERE user_id = ? AND deleted = 0',
      [userId]
    );
    const total = countResult[0].total;

    // 获取订单列表
    const [orders] = await pool.query(
      `SELECT id, order_guid, total_amount, status, payment_method, 
              created_at, updated_at, shipping_name, shipping_phone 
       FROM orders 
       WHERE user_id = ? AND deleted = 0 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    );

    // 转换order_guid为可读格式并添加order_number
    const formattedOrders = orders.map(order => ({
      ...order,
      order_number: binaryToUuid(order.order_guid),
      order_guid: binaryToUuid(order.order_guid)
    }));

    return res.status(200).json({
      success: true,
      message: getMessage('ORDER.LIST_SUCCESS'),
      data: {
        total,
        page,
        pageSize,
        list: formattedOrders
      }
    });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('ORDER.LIST_FAILED'),
      error: error.message
    });
  }
};

/**
 * 获取订单详情
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getOrderDetail = async (req, res) => {
  const userId = req.userId; // 从JWT获取用户ID
  const { orderId } = req.params;

  try {
    // 获取订单信息
    const [orders] = await pool.query(
      `SELECT id, order_guid, total_amount, status, payment_method, payment_id, 
              created_at, updated_at, shipping_name, shipping_phone, 
              shipping_email, shipping_address, shipping_zip_code 
       FROM orders 
       WHERE id = ? AND user_id = ? AND deleted = 0`,
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('ORDER.NOT_FOUND')
      });
    }

    const order = orders[0];

    // 获取订单项
    const [orderItems] = await pool.query(
      `SELECT id, product_id, quantity, price, product_name, product_code 
       FROM order_items 
       WHERE order_id = ? AND deleted = 0`,
      [orderId]
    );

    // 获取物流信息
    const [logistics] = await pool.query(
      `SELECT id, tracking_number, carrier, status, location, description, created_at 
       FROM logistics 
       WHERE order_id = ? AND deleted = 0 
       ORDER BY created_at DESC`,
      [orderId]
    );

    return res.status(200).json({
      success: true,
      message: getMessage('ORDER.DETAIL_SUCCESS'),
      data: {
        order,
        items: orderItems,
        logistics
      }
    });
  } catch (error) {
    console.error('获取订单详情失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('ORDER.DETAIL_FAILED'),
      error: error.message
    });
  }
};

/**
 * 生成支付宝/微信支付二维码
 * @param {Object} req
 * @param {Object} res
 */
exports.generateQrcode = async (req, res) => {
  const { paymentMethod, orderInfo } = req.body;
  try {
    let payUrl = '';
    if (paymentMethod === 'alipay') {
      // 这里应调用alipay-sdk生成支付链接
      payUrl = 'https://openapi.alipaydev.com/gateway.do?mock_alipay_qr';
    } else if (paymentMethod === 'wechat') {
      // 这里应调用微信支付SDK生成支付链接
      payUrl = 'https://api.mch.weixin.qq.com/pay/unifiedorder?mock_wechat_qr';
    } else {
      return res.status(400).json({ success: false, message: getMessage('ORDER.UNSUPPORTED_PAYMENT_METHOD') });
    }
    // 生成二维码图片
    const qrcodeDataUrl = await QRCode.toDataURL(payUrl);
    return res.json({ success: true, message: getMessage('ORDER.QRCODE_SUCCESS'), data: { qrcodeUrl: qrcodeDataUrl, payUrl } });
  } catch (error) {
    return res.status(500).json({ success: false, message: getMessage('ORDER.QRCODE_FAILED'), error: error.message });
  }
};

/**
 * 轮询查询支付状态（mock实现，后续可对接真实支付SDK）
 * @param {Object} req
 * @param {Object} res
 */
exports.checkPaymentStatus = async (req, res) => {
  const { orderId, paymentMethod } = req.body;
  // 实际应查询支付网关订单状态
  // 这里mock为已支付
  return res.json({ success: true, message: getMessage('ORDER.PAYMENT_SUCCESS'), data: { paid: true } });
};