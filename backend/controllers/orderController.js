const db = require('../db/db');
const { v4: uuidv4 } = require('uuid');

// 根据环境变量决定使用哪个支付网关
const PAYMENT_GATEWAY = process.env.PAYMENT_GATEWAY || 'stripe';

// 初始化支付网关
let stripe;
let paypal;

if (PAYMENT_GATEWAY === 'stripe') {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else if (PAYMENT_GATEWAY === 'paypal') {
  paypal = require('@paypal/checkout-server-sdk');
  
  // PayPal环境配置函数
  function getPayPalClient() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_SECRET_KEY;
    
    // 根据环境变量决定使用沙箱还是生产环境
    const environment = process.env.NODE_ENV === 'production'
      ? new paypal.core.LiveEnvironment(clientId, clientSecret)
      : new paypal.core.SandboxEnvironment(clientId, clientSecret);
    
    return new paypal.core.PayPalHttpClient(environment);
  }
}

/**
 * 创建订单
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.createOrder = async (req, res) => {
  const { shippingInfo, paymentMethod } = req.body;
  const userId = req.user.id; // 从JWT获取用户ID

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
          message: '购物车为空，无法创建订单'
        });
      }

      // 2. 计算订单总金额
      let totalAmount = 0;
      for (const item of cartItems) {
        totalAmount += item.price * item.quantity;
      }

      // 3. 创建订单记录
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
          `UPDATE products SET stock = stock - ? WHERE id = ? AND deleted = 0`,
          [item.quantity, item.product_id]
        );
      }

      // 6. 提交事务
      await connection.commit();
      connection.release();

      // 7. 返回订单信息
      return res.status(200).json({
        success: true,
        message: '订单创建成功',
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
      message: '创建订单失败',
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
  const userId = req.user.id; // 从JWT获取用户ID

  try {
    // 1. 获取用户购物车
    const [cartItems] = await db.query(
      `SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.product_code 
       FROM cart_items ci 
       JOIN products p ON ci.product_id = p.id 
       WHERE ci.user_id = ? AND ci.deleted = 0 AND p.deleted = 0`,
      [userId]
    );

    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: '购物车为空，无法处理支付'
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
      } else if (PAYMENT_GATEWAY === 'paypal' && paypal) {
        // 使用PayPal处理信用卡支付
        const client = getPayPalClient();
        
        // 构建PayPal订单请求
        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer('return=representation');
        
        // 构建订单项
        const items = cartItems.map(item => ({
          name: item.name,
          description: `产品编号: ${item.product_code}`,
          sku: item.product_code,
          unit_amount: {
            currency_code: 'CNY',
            value: item.price.toFixed(2)
          },
          quantity: item.quantity
        }));
        
        // 设置订单详情
        request.requestBody({
          intent: 'CAPTURE',
          payment_source: {
            card: {
              number: token.card_number,
              expiry: token.expiry,
              security_code: token.security_code,
              name: token.name
            }
          },
          purchase_units: [
            {
              amount: {
                currency_code: 'CNY',
                value: totalAmount.toFixed(2),
                breakdown: {
                  item_total: {
                    currency_code: 'CNY',
                    value: totalAmount.toFixed(2)
                  }
                }
              },
              items: items
            }
          ]
        });

        // 创建并捕获PayPal订单
        const order = await client.execute(request);
        const captureId = order.result.id;
        
        paymentResult = {
          id: captureId,
          status: order.result.status === 'COMPLETED' ? 'succeeded' : order.result.status
        };
      } else {
        // 支付网关未正确配置
        return res.status(500).json({
          success: false,
          message: '支付网关配置错误，无法处理信用卡支付',
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
        message: '不支持的支付方式'
      });
    }

    // 4. 创建订单
    const orderGuid = uuidv4();
    const [orderResult] = await db.query(
      `INSERT INTO orders 
       (user_id, total_amount, status, payment_method, payment_id, order_guid, 
        shipping_name, shipping_phone, shipping_email, shipping_address, shipping_zip_code) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        shippingInfo.zipCode
      ]
    );

    const orderId = orderResult.insertId;

    // 5. 创建订单项并更新库存
    for (const item of cartItems) {
      await db.query(
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

      // 更新产品库存
      await db.query(
        `UPDATE products SET stock = stock - ? WHERE id = ? AND deleted = 0`,
        [item.quantity, item.product_id]
      );
    }

    // 6. 清空购物车
    await db.query(
      `UPDATE cart_items SET deleted = 1 WHERE user_id = ? AND deleted = 0`,
      [userId]
    );

    // 7. 返回订单信息
    return res.status(200).json({
      success: true,
      message: '支付成功',
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
      message: '处理支付失败',
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
  const userId = req.user.id; // 从JWT获取用户ID
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  try {
    // 获取订单总数
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM orders WHERE user_id = ? AND deleted = 0',
      [userId]
    );
    const total = countResult[0].total;

    // 获取订单列表
    const [orders] = await db.query(
      `SELECT id, order_guid, total_amount, status, payment_method, 
              created_at, updated_at, shipping_name, shipping_phone 
       FROM orders 
       WHERE user_id = ? AND deleted = 0 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    );

    return res.status(200).json({
      success: true,
      message: '获取订单列表成功',
      data: {
        total,
        page,
        pageSize,
        list: orders
      }
    });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取订单列表失败',
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
  const userId = req.user.id; // 从JWT获取用户ID
  const { orderId } = req.params;

  try {
    // 获取订单信息
    const [orders] = await db.query(
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
        message: '订单不存在'
      });
    }

    const order = orders[0];

    // 获取订单项
    const [orderItems] = await db.query(
      `SELECT id, product_id, quantity, price, product_name, product_code 
       FROM order_items 
       WHERE order_id = ? AND deleted = 0`,
      [orderId]
    );

    // 获取物流信息
    const [logistics] = await db.query(
      `SELECT id, tracking_number, carrier, status, location, description, created_at 
       FROM logistics 
       WHERE order_id = ? AND deleted = 0 
       ORDER BY created_at DESC`,
      [orderId]
    );

    return res.status(200).json({
      success: true,
      message: '获取订单详情成功',
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
      message: '获取订单详情失败',
      error: error.message
    });
  }
};