const { pool } = require('../db/db');
const { v4: uuidv4 } = require('uuid');
const { binaryToUuid } = require('../utils/uuid');
const { getMessage } = require('../config/messages');

// 根据环境变量决定使用哪个支付网关
const PAYMENT_GATEWAY = process.env.PAYMENT_GATEWAY || 'stripe';

// 初始化支付网关
let stripe;

if (PAYMENT_GATEWAY === 'stripe') {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} 


// createOrder方法已删除 - 订单创建现在通过支付流程处理



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

    // 获取订单项（包含商品图片）
    const [orderItems] = await pool.query(
      `SELECT oi.id, oi.product_id, oi.quantity, oi.price, oi.product_name, oi.product_code,
              (SELECT image_url FROM product_images WHERE product_id = oi.product_id AND deleted = 0 ORDER BY sort_order ASC LIMIT 1) as image_url
       FROM order_items oi
       WHERE oi.order_id = ? AND oi.deleted = 0`,
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