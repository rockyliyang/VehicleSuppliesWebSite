const { query } = require('../db/db');
const { v4: uuidv4 } = require('uuid');
const { getMessage } = require('../config/messages');
const path = require('path');
const fs = require('fs');

// 从环境变量获取时间配置
const PRICE_DISPLAY_HOURS = parseInt(process.env.PRICE_DISPLAY_HOURS) || 48;
const ORDER_TIMEOUT_HOURS = parseInt(process.env.ORDER_TIMEOUT_HOURS) || 72;

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

    // 首先检查并更新超时订单状态
    await query(
      `UPDATE orders 
       SET status = 'pay_timeout', updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND status = 'pending' AND deleted = false 
       AND created_at < (CURRENT_TIMESTAMP - INTERVAL '${ORDER_TIMEOUT_HOURS} hours')`,
      [userId]
    );

    // 获取订单列表
    const orders = await query(
      `SELECT id, order_guid, inquiry_id, total_amount, original_amount, update_amount_time, status, payment_method, 
              created_at, created_at AT TIME ZONE create_time_zone as created_at_local,updated_at, updated_at AT TIME ZONE create_time_zone as updated_at_local,
              paid_at, create_time_zone, paid_time_zone,paid_at AT TIME ZONE paid_time_zone as paid_at_local,
              shipping_name, shipping_phone, shipping_address, shipping_zip_code, 
              shipping_country, shipping_state, shipping_city, shipping_phone_country_code,shipping_fee
       FROM orders 
       WHERE user_id = $1 AND deleted = false 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, pageSize, offset]
    );

    // PostgreSQL返回的order_guid已经是字符串格式
    const formattedOrders = orders.getRows().map(order => {
      let displayAmount = order.total_amount;
      
      // 检查是否需要显示原始价格
      if (order.update_amount_time && order.original_amount) {
        const updateTime = new Date(order.update_amount_time);
        const now = new Date();
        const hoursDiff = (now - updateTime) / (1000 * 60 * 60);
        
        if (hoursDiff > PRICE_DISPLAY_HOURS) {
          displayAmount = order.original_amount;
        }
      }
      
      // 格式化时间字段，移除时区信息
      const formatLocalTime = (timeStr) => {
        if (!timeStr) return null;
        const date = new Date(timeStr);
        return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
      };
      
      return {
        ...order,
        total_amount: displayAmount,
        order_number: order.order_guid,
        created_at_local: formatLocalTime(order.created_at_local),
        updated_at_local: formatLocalTime(order.updated_at_local),
        paid_at_local: formatLocalTime(order.paid_at_local)
      };
    });

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
 * 添加或修改订单状态数据
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.addOrUpdateOrderStatusData = async (req, res) => {
  const userId = req.userId; // 从JWT获取用户ID
  const { orderId, status, comment, images } = req.body;

  try {
    // 验证必需字段
    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        message: getMessage('ORDER_STATUS_DATA.MISSING_REQUIRED_FIELDS')
      });
    }

    // 验证用户是否有权限操作该订单
    const orderCheck = await query(
      'SELECT id FROM orders WHERE id = $1 AND user_id = $2 AND deleted = false',
      [orderId, userId]
    );

    if (orderCheck.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('ORDER.NOT_FOUND')
      });
    }

    // 检查是否已存在相同订单和状态的记录
    const existingRecord = await query(
      'SELECT id FROM order_status_data WHERE order_id = $1 AND status = $2 AND deleted = false',
      [orderId, status]
    );

    // 准备图片URL字段
    const imageFields = {};
    if (images && Array.isArray(images)) {
      for (let i = 0; i < Math.min(images.length, 10); i++) {
        imageFields[`image${i + 1}_url`] = images[i];
      }
    }

    let result;
    if (existingRecord.getRowCount() > 0) {
      // 更新现有记录
      const recordId = existingRecord.getFirstRow().id;
      const updateFields = ['comment = $3', 'updated_at = CURRENT_TIMESTAMP', 'updated_by = $4'];
      const updateValues = [recordId, orderId, comment, userId];
      let paramIndex = 5;

      // 添加图片字段
      for (let i = 1; i <= 10; i++) {
        const imageKey = `image${i}_url`;
        updateFields.push(`${imageKey} = $${paramIndex}`);
        updateValues.push(imageFields[imageKey] || null);
        paramIndex++;
      }

      const updateQuery = `
        UPDATE order_status_data 
        SET ${updateFields.join(', ')}
        WHERE id = $1 AND order_id = $2 AND deleted = false
      `;

      result = await query(updateQuery, updateValues);
    } else {
      // 插入新记录
      const insertFields = ['order_id', 'status', 'comment', 'created_by', 'updated_by'];
      const insertValues = [orderId, status, comment, userId, userId];
      const placeholders = ['$1', '$2', '$3', '$4', '$5'];
      let paramIndex = 6;

      // 添加图片字段
      for (let i = 1; i <= 10; i++) {
        const imageKey = `image${i}_url`;
        insertFields.push(imageKey);
        placeholders.push(`$${paramIndex}`);
        insertValues.push(imageFields[imageKey] || null);
        paramIndex++;
      }

      const insertQuery = `
        INSERT INTO order_status_data (${insertFields.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING id
      `;

      result = await query(insertQuery, insertValues);
    }

    return res.status(200).json({
      success: true,
      message: getMessage('ORDER_STATUS_DATA.SAVE_SUCCESS'),
      data: {
        id: existingRecord.getRowCount() > 0 ? existingRecord.getFirstRow().id : result.getFirstRow().id
      }
    });
  } catch (error) {
    console.error('保存订单状态数据失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('ORDER_STATUS_DATA.SAVE_FAILED'),
      error: error.message
    });
  }
};

/**
 * 获取订单状态数据
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getOrderStatusData = async (req, res) => {
  const userId = req.userId; // 从JWT获取用户ID
  const { orderId, status } = req.params;

  try {
    // 验证用户是否有权限操作该订单
    const orderCheck = await query(
      'SELECT id FROM orders WHERE id = $1 AND user_id = $2 AND deleted = false',
      [orderId, userId]
    );

    if (orderCheck.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('ORDER.NOT_FOUND')
      });
    }

    // 获取订单状态数据
    const result = await query(
      `SELECT id, order_id, status, comment, 
              image1_url, image2_url, image3_url, image4_url, image5_url,
              image6_url, image7_url, image8_url, image9_url, image10_url,
              created_at, updated_at
       FROM order_status_data 
       WHERE order_id = $1 AND status = $2 AND deleted = false`,
      [orderId, status]
    );

    if (result.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('ORDER_STATUS_DATA.NOT_FOUND')
      });
    }

    const data = result.getFirstRow();
    
    // 整理图片数组
    const images = [];
    for (let i = 1; i <= 10; i++) {
      const imageUrl = data[`image${i}_url`];
      if (imageUrl) {
        images.push(imageUrl);
      }
    }

    return res.status(200).json({
      success: true,
      message: getMessage('ORDER_STATUS_DATA.GET_SUCCESS'),
      data: {
        id: data.id,
        orderId: data.order_id,
        status: data.status,
        comment: data.comment,
        images: images,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    });
  } catch (error) {
    console.error('获取订单状态数据失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('ORDER_STATUS_DATA.GET_FAILED'),
      error: error.message
    });
  }
};

/**
 * 删除订单状态数据
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.deleteOrderStatusData = async (req, res) => {
  const userId = req.userId; // 从JWT获取用户ID
  const { orderId, status } = req.params;

  try {
    // 验证用户是否有权限操作该订单
    const orderCheck = await query(
      'SELECT id FROM orders WHERE id = $1 AND user_id = $2 AND deleted = false',
      [orderId, userId]
    );

    if (orderCheck.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('ORDER.NOT_FOUND')
      });
    }

    // 软删除订单状态数据
    const result = await query(
      `UPDATE order_status_data 
       SET deleted = true, updated_at = CURRENT_TIMESTAMP, updated_by = $3
       WHERE order_id = $1 AND status = $2 AND deleted = false`,
      [orderId, status, userId]
    );

    if (result.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('ORDER_STATUS_DATA.NOT_FOUND')
      });
    }

    return res.status(200).json({
      success: true,
      message: getMessage('ORDER_STATUS_DATA.DELETE_SUCCESS')
    });
  } catch (error) {
    console.error('删除订单状态数据失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('ORDER_STATUS_DATA.DELETE_FAILED'),
      error: error.message
    });
  }
};

/**
 * 获取订单的所有状态数据
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getOrderAllStatusData = async (req, res) => {
  const userId = req.userId; // 从JWT获取用户ID
  const { orderId } = req.params;

  try {
    // 验证用户是否有权限操作该订单
    const orderCheck = await query(
      'SELECT id FROM orders WHERE id = $1 AND user_id = $2 AND deleted = false',
      [orderId, userId]
    );

    if (orderCheck.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('ORDER.NOT_FOUND')
      });
    }

    // 获取订单的所有状态数据
    const result = await query(
      `SELECT id, order_id, status, comment, 
              image1_url, image2_url, image3_url, image4_url, image5_url,
              image6_url, image7_url, image8_url, image9_url, image10_url,
              created_at, updated_at
       FROM order_status_data 
       WHERE order_id = $1 AND deleted = false
       ORDER BY created_at DESC`,
      [orderId]
    );

    const statusDataList = result.getRows().map(data => {
      // 整理图片数组
      const images = [];
      for (let i = 1; i <= 10; i++) {
        const imageUrl = data[`image${i}_url`];
        if (imageUrl) {
          images.push(imageUrl);
        }
      }

      return {
        id: data.id,
        orderId: data.order_id,
        status: data.status,
        comment: data.comment,
        images: images,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    });

    return res.status(200).json({
      success: true,
      message: getMessage('ORDER_STATUS_DATA.LIST_SUCCESS'),
      data: statusDataList
    });
  } catch (error) {
    console.error('获取订单状态数据列表失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('ORDER_STATUS_DATA.LIST_FAILED'),
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
    // 首先检查并更新超时订单状态
    await query(
      `UPDATE orders 
       SET status = 'pay_timeout', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND status = 'pending' AND deleted = false 
       AND created_at < (CURRENT_TIMESTAMP - INTERVAL '${ORDER_TIMEOUT_HOURS} hours')`,
      [orderId, userId]
    );

    // 获取订单信息
    const orders = await query(
      `SELECT id, order_guid, inquiry_id, total_amount, original_amount, update_amount_time, status, payment_method, payment_id, 
              created_at, created_at AT TIME ZONE create_time_zone as created_at_local,
              updated_at, updated_at AT TIME ZONE create_time_zone as updated_at_local,
              paid_at, paid_at AT TIME ZONE paid_time_zone as paid_at_local,create_time_zone, paid_time_zone,
              shipping_name, shipping_phone, shipping_email, shipping_address, 
              shipping_zip_code, shipping_country, shipping_state, shipping_city, 
              shipping_phone_country_code,shipping_fee
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

    let order = orders.getFirstRow();
    
    // 格式化时间字段，移除时区信息
    const formatLocalTime = (timeStr) => {
      if (!timeStr) return null;
      const date = new Date(timeStr);
      return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
    };
    
    // 检查是否需要显示原始价格
    if (order.update_amount_time && order.original_amount) {
      const updateTime = new Date(order.update_amount_time);
      const now = new Date();
      const hoursDiff = (now - updateTime) / (1000 * 60 * 60);
      
      if (hoursDiff > PRICE_DISPLAY_HOURS) {
        order = {
          ...order,
          total_amount: order.original_amount
        };
      }
    }
    
    // 格式化订单的时间字段
    order = {
      ...order,
      created_at_local: formatLocalTime(order.created_at_local),
      updated_at_local: formatLocalTime(order.updated_at_local),
      paid_at_local: formatLocalTime(order.paid_at_local)
    };
    
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
              tracking_info, notes, created_at, updated_at, shipped_at, shipped_time_zone,
              CASE 
                WHEN shipped_time_zone IS NULL OR shipped_time_zone = '' THEN shipped_at
                ELSE shipped_at AT TIME ZONE shipped_time_zone
              END AS shipped_at_local
       FROM logistics 
       WHERE order_id = $1 AND deleted = false 
       ORDER BY created_at DESC`,
      [orderId]
    );

    // 格式化物流信息中的时间字段
    const formattedLogistics = logistics.getRows().map(logistic => ({
      ...logistic,
      shipped_at_local: formatLocalTime(logistic.shipped_at_local)
    }));

    return res.status(200).json({
      success: true,
      message: getMessage('ORDER.DETAIL_SUCCESS'),
      data: {
        order,
        items: orderItems.getRows(),
        logistics: formattedLogistics
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
 * 修改订单信息（仅限shipping information字段）
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.updateOrder = async (req, res) => {
  const userId = req.userId; // 从JWT获取用户ID
  const { orderId } = req.params;
  const {
    shipping_name,
    shipping_phone,
    shipping_email,
    shipping_address,
    shipping_zip_code,
    shipping_country,
    shipping_state,
    shipping_city,
    shipping_phone_country_code,
    status
  } = req.body;

  try {
    // 首先检查订单是否存在且属于当前用户
    const orderCheck = await query(
      'SELECT id, status FROM orders WHERE id = $1 AND user_id = $2 AND deleted = false',
      [orderId, userId]
    );

    if (orderCheck.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('ORDER.NOT_FOUND')
      });
    }

    const order = orderCheck.getFirstRow();
    
    // 检查订单状态更新权限
    if (status !== undefined) {
      // 如果要更新status字段，检查是否为有效的状态转换
      /*const validStatusTransitions = {
        'shipped': ['delivered'], // shipped状态可以转换为delivered
        'pending': ['cancelled'], // pending状态可以转换为cancelled
        'paid': ['refund_requested'], // paid状态可以转换为refund_requested
        'delivered': ['refund_requested'], // delivered状态可以转换为refund_requested
        'refund_cancelled': ['refund_requested'], // refund_cancelled状态可以转换为refund_requested
      };
      
      if (!validStatusTransitions[order.status] || !validStatusTransitions[order.status].includes(status)) {
        return res.status(400).json({
          success: false,
          message: getMessage('ORDER.INVALID_STATUS_TRANSITION')
        });
      }*/
    } else {
      // 如果不更新status字段，只有pending状态的订单可以修改其他字段
      if (order.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: getMessage('ORDER.UPDATE_STATUS_INVALID')
        });
      }
    }

    // 构建更新字段
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (shipping_name !== undefined) {
      updateFields.push(`shipping_name = $${paramIndex++}`);
      updateValues.push(shipping_name);
    }
    if (shipping_phone !== undefined) {
      updateFields.push(`shipping_phone = $${paramIndex++}`);
      updateValues.push(shipping_phone);
    }
    if (shipping_email !== undefined) {
      updateFields.push(`shipping_email = $${paramIndex++}`);
      updateValues.push(shipping_email);
    }
    if (shipping_address !== undefined) {
      updateFields.push(`shipping_address = $${paramIndex++}`);
      updateValues.push(shipping_address);
    }
    if (shipping_zip_code !== undefined) {
      updateFields.push(`shipping_zip_code = $${paramIndex++}`);
      updateValues.push(shipping_zip_code);
    }
    if (shipping_country !== undefined) {
      updateFields.push(`shipping_country = $${paramIndex++}`);
      updateValues.push(shipping_country);
    }
    if (shipping_state !== undefined) {
      updateFields.push(`shipping_state = $${paramIndex++}`);
      updateValues.push(shipping_state);
    }
    if (shipping_city !== undefined) {
      updateFields.push(`shipping_city = $${paramIndex++}`);
      updateValues.push(shipping_city);
    }
    if (shipping_phone_country_code !== undefined) {
      updateFields.push(`shipping_phone_country_code = $${paramIndex++}`);
      updateValues.push(shipping_phone_country_code);
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('ORDER.UPDATE_NO_FIELDS')
      });
    }

    // 添加updated_at字段
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // 添加WHERE条件的参数
    updateValues.push(orderId, userId);

    const updateQuery = `
      UPDATE orders 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} AND deleted = false
    `;

    await query(updateQuery, updateValues);

    return res.status(200).json({
      success: true,
      message: getMessage('ORDER.UPDATE_SUCCESS')
    });
  } catch (error) {
    console.error('更新订单失败:', error);
    return res.status(500).json({
       success: false,
       message: getMessage('ORDER.UPDATE_FAILED'),
       error: error.message
     });
   }
 };

// 创建退款申请
// 订单状态图片上传
exports.uploadOrderStatusImage = async (req, res) => {
  if (!req.file) {
    return res.json({ success: false, message: getMessage('ORDER.NO_FILE_UPLOADED'), data: null });
  }
  
  const { orderId, status } = req.body;
  if (!orderId || !status) {
    return res.json({ success: false, message: getMessage('ORDER.ORDER_ID_STATUS_REQUIRED'), data: null });
  }
  
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png' && ext !== '.webp') {
    fs.unlinkSync(req.file.path);
    return res.json({ success: false, message: getMessage('ORDER.INVALID_FILE_FORMAT'), data: null });
  }
  
  const destName = `order${orderId}${status}image1${ext}`;
  const destPath = path.join(process.cwd(), 'public', 'static', 'images', 'orders', destName);
  
  try {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    
    // 如果目标文件已存在，先删除
    if (fs.existsSync(destPath)) {
      fs.unlinkSync(destPath);
    }
    
    fs.renameSync(req.file.path, destPath);
    const url = '/static/images/orders/' + destName;
    
    res.json({ 
      success: true, 
      message: getMessage('ORDER.IMAGE_UPLOAD_SUCCESS'), 
      data: { url } 
    });
  } catch (err) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('订单状态图片保存失败:', err);
    res.status(500).json({ 
      success: false, 
      message: getMessage('ORDER.FILE_SAVE_FAILED'), 
      data: null 
    });
  }
};