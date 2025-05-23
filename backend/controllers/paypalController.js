const db = require('../db/db');
const { v4: uuidv4 } = require('uuid');
// 引入PayPal SDK
const paypal = require('@paypal/checkout-server-sdk');

function getPayPalClient() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error('PayPal配置缺失: 需要设置 PAYPAL_CLIENT_ID 和 PAYPAL_SECRET 环境变量');
    throw new Error('PayPal配置不完整');
  }
  
  // 根据环境变量决定使用沙箱还是生产环境
  const environment = process.env.NODE_ENV === 'production'
    ? new paypal.core.LiveEnvironment(clientId, clientSecret)
    : new paypal.core.SandboxEnvironment(clientId, clientSecret);
  
  return new paypal.core.PayPalHttpClient(environment);
}
/**
 * 创建PayPal支付订单
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.createPayPalOrder = async (req, res) => {
  const { totalAmount, orderItems, currency = 'USD' } = req.body;
  const userId = req.user.id; // 从JWT获取用户ID

  try {
    const client = getPayPalClient();
    
    // 构建PayPal订单请求
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=minimal');
    // 添加PayPal-Request-Id请求头，防止重复处理
    const requestId = `${userId}_create_${Date.now()}`;
    request.headers['PayPal-Request-Id'] = requestId;
    
    // 构建订单项
    const items = orderItems.map(item => ({
      name: item.name,
      description: `产品编号: ${item.product_code}`,
      sku: item.product_code,
      unit_amount: {
        currency_code: currency,
        value: Number(item.price).toFixed(2)
      },
      quantity: item.quantity
    }));
    
    // 设置订单详情
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: Number(totalAmount).toFixed(2),
            breakdown: {
              item_total: {
                currency_code: currency,
                value: Number(totalAmount).toFixed(2)
              }
            }
          },
          items: items
        }
      ]
    });

    // 创建PayPal订单
    const order = await client.execute(request);
    
    return res.status(200).json({
      success: true,
      message: 'PayPal订单创建成功',
      data: {
        orderId: order.result.id,
        approvalUrl: order.result.links.find(link => link.rel === 'approve').href
      }
    });
  } catch (error) {
    console.error('创建PayPal订单失败:', error);
    return res.status(500).json({
      success: false,
      message: '创建PayPal订单失败',
      error: error.message
    });
  }
};

/**
 * 捕获PayPal支付
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.capturePayPalPayment = async (req, res) => {
  const { paypalOrderId, captureResult, shippingInfo } = req.body;
  const userId = req.user.id; // 从JWT获取用户ID

  try {
    let captureId, captureStatus;
    
    // 处理前端已捕获的订单
    if (captureResult) {
      console.log('使用前端已捕获的订单结果');
      captureId = captureResult.purchase_units[0].payments.captures[0].id;
      captureStatus = captureResult.status;
    } else {
      // 后端捕获支付（备用方案）
      console.log('使用后端捕获支付');
      const client = getPayPalClient();
      
      // 捕获PayPal支付
      const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
      // 添加PayPal-Request-Id请求头，防止重复处理
      const requestId = `${userId}_${paypalOrderId}_${Date.now()}`;
      request.headers['PayPal-Request-Id'] = requestId;
      request.requestBody({});
      
      const captureResponse = await client.execute(request);
      captureId = captureResponse.result.purchase_units[0].payments.captures[0].id;
      captureStatus = captureResponse.result.status;
    }
    
    if (captureStatus !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: `PayPal支付未完成，状态: ${captureStatus}`
      });
    }
    
    // 获取用户购物车
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

    // 计算订单总金额
    let totalAmount = 0;
    for (const item of cartItems) {
      totalAmount += item.price * item.quantity;
    }

    // 创建订单
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
        'paypal',
        captureId,
        orderGuid,
        shippingInfo.name,
        shippingInfo.phone,
        shippingInfo.email,
        `${shippingInfo.region.join(',')} ${shippingInfo.address}`,
        shippingInfo.zipCode
      ]
    );

    const orderId = orderResult.insertId;

    // 创建订单项并更新库存
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

    // 清空购物车
    await db.query(
      `UPDATE cart_items SET deleted = 1 WHERE user_id = ? AND deleted = 0`,
      [userId]
    );

    // 返回订单信息
    return res.status(200).json({
      success: true,
      message: 'PayPal支付成功',
      data: {
        orderId,
        orderGuid,
        paymentId: captureId,
        totalAmount
      }
    });
  } catch (error) {
    console.error('处理PayPal支付失败:', error);
    return res.status(500).json({
      success: false,
      message: '处理PayPal支付失败',
      error: error.message
    });
  }
};

/**
 * 验证PayPal支付状态
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.verifyPayPalPayment = async (req, res) => {
  const { paypalOrderId } = req.params;

  try {
    const client = getPayPalClient();
    
    // 获取PayPal订单详情
    const request = new paypal.orders.OrdersGetRequest(paypalOrderId);
    // 添加PayPal-Request-Id请求头，防止重复处理
    const requestId = `verify_${paypalOrderId}_${Date.now()}`;
    request.headers['PayPal-Request-Id'] = requestId;
    const order = await client.execute(request);
    
    return res.status(200).json({
      success: true,
      message: '获取PayPal支付状态成功',
      data: {
        status: order.result.status,
        orderDetails: order.result
      }
    });
  } catch (error) {
    console.error('获取PayPal支付状态失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取PayPal支付状态失败',
      error: error.message
    });
  }
};