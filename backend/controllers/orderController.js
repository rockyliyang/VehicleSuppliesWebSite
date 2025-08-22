const { query } = require('../db/db');
const { v4: uuidv4 } = require('uuid');
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
    const countResult = await query(
      'SELECT COUNT(*) as total FROM orders WHERE user_id = $1 AND deleted = false',
      [userId]
    );
    const total = parseInt(countResult.getFirstRow().total);

    // 获取订单列表
    const orders = await query(
      `SELECT id, order_guid, inquiry_id, total_amount, status, payment_method, 
              created_at, updated_at, shipping_name, shipping_phone,
              shipping_address, shipping_zip_code, shipping_country,
              shipping_state, shipping_city, shipping_phone_country_code
       FROM orders 
       WHERE user_id = $1 AND deleted = false 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, pageSize, offset]
    );

    // PostgreSQL返回的order_guid已经是字符串格式
    const formattedOrders = orders.getRows().map(order => ({
      ...order,
      order_number: order.order_guid
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
    const orders = await query(
      `SELECT id, order_guid, inquiry_id, total_amount, status, payment_method, payment_id, 
              created_at, updated_at, shipping_name, shipping_phone, 
              shipping_email, shipping_address, shipping_zip_code,
              shipping_country, shipping_state, shipping_city, shipping_phone_country_code
       FROM orders 
       WHERE id = $1 AND user_id = $2 AND deleted = false`,
      [orderId, userId]
    );

    if (orders.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('ORDER.NOT_FOUND')
      });
    }

    const order = orders.getFirstRow();

    // 获取订单项（包含商品图片和类型名称）
    const orderItems = await query(
      `SELECT oi.id, oi.product_id, oi.quantity, oi.price, 
              p.name as product_name, p.product_code, pc.name as category_name,
              (SELECT image_url FROM product_images WHERE product_id = oi.product_id AND deleted = false ORDER BY sort_order ASC LIMIT 1) as image_url
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       WHERE oi.order_id = $1 AND oi.deleted = false`,
      [orderId]
    );

    // 获取物流信息
    const logistics = await query(
      `SELECT id, logistics_company_id, shipping_no, shipping_status, shipping_name,
              shipping_phone, shipping_email, shipping_address, shipping_zip_code,
              shipping_country, shipping_state, shipping_city, shipping_phone_country_code,
              tracking_info, notes, created_at, updated_at
       FROM logistics 
       WHERE order_id = $1 AND deleted = false 
       ORDER BY created_at DESC`,
      [orderId]
    );

    return res.status(200).json({
      success: true,
      message: getMessage('ORDER.DETAIL_SUCCESS'),
      data: {
        order,
        items: orderItems.getRows(),
        logistics: logistics.getRows()
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