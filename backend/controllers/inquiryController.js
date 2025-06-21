const { pool } = require('../db/db');
const { v4: uuidv4 } = require('uuid');
const { uuidToBinary } = require('../utils/uuid');
const { getMessage } = require('../config/messages');

// 获取用户询价列表
exports.getUserInquiries = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    let whereClause = 'WHERE i.user_id = ? AND i.deleted = 0';
    let queryParams = [userId];
    
    if (status) {
      whereClause += ' AND i.status = ?';
      queryParams.push(status);
    }
    
    // 查询询价列表
    const query = `
      SELECT 
        i.id,
        i.guid,
        i.user_inquiry_id,
        i.title,
        i.status,
        i.created_at,
        i.updated_at,
        COUNT(ii.id) as item_count,
        SUM(CASE WHEN ii.unit_price IS NOT NULL THEN ii.quantity * ii.unit_price ELSE 0 END) as total_quoted_price
      FROM inquiries i
      LEFT JOIN inquiry_items ii ON i.id = ii.inquiry_id AND ii.deleted = 0
      ${whereClause}
      GROUP BY i.id, i.guid, i.user_inquiry_id, i.title, i.status, i.created_at, i.updated_at
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    queryParams.push(parseInt(limit), parseInt(offset));
    const [inquiries] = await pool.query(query, queryParams);
    
    // 查询总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM inquiries i
      ${whereClause}
    `;
    const [countResult] = await pool.query(countQuery, queryParams.slice(0, -2));
    const total = countResult[0].total;
    
    return res.json({
      success: true,
      message: getMessage('INQUIRY.FETCH.SUCCESS'),
      data: {
        inquiries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取询价列表失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('INQUIRY.FETCH.FAILED')
    });
  }
};

// 获取询价详情
exports.getInquiryDetail = async (req, res) => {
  try {
    const userId = req.userId;
    const { inquiryId } = req.params;
    
    // 查询询价基本信息
    const inquiryQuery = `
      SELECT 
        i.id,
        i.guid,
        i.user_inquiry_id,
        i.title,
        i.status,
        i.created_at,
        i.updated_at,
        u.username as created_by_name
      FROM inquiries i
      LEFT JOIN users u ON i.created_by = u.id
      WHERE i.id = ? AND i.user_id = ? AND i.deleted = 0
    `;
    
    const [inquiryResult] = await pool.query(inquiryQuery, [inquiryId, userId]);
    
    if (!inquiryResult || inquiryResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.NOT_FOUND')
      });
    }
    
    const inquiry = inquiryResult[0];
    
    // 查询询价商品
    const itemsQuery = `
      SELECT 
        ii.id,
        ii.product_id,
        ii.quantity,
        ii.unit_price,
        'pending' as item_status,
        p.name as product_name,
        p.product_code,
        p.price as original_price,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND deleted = 0 ORDER BY sort_order ASC LIMIT 1) as image_url
      FROM inquiry_items ii
      JOIN products p ON ii.product_id = p.id
      WHERE ii.inquiry_id = ? AND ii.deleted = 0
      ORDER BY ii.created_at ASC
    `;
    
    const [items] = await pool.query(itemsQuery, [inquiryId]);
    
    // 查询询价消息
    const messagesQuery = `
      SELECT 
        im.id,
        im.content as message,
        im.sender_type,
        im.created_at,
        u.username as sender_name
      FROM inquiry_messages im
      LEFT JOIN users u ON im.sender_id = u.id
      WHERE im.inquiry_id = ? AND im.deleted = 0
      ORDER BY im.created_at ASC
    `;
    
    const [messages] = await pool.query(messagesQuery, [inquiryId]);
    
    return res.json({
      success: true,
      message: getMessage('INQUIRY.FETCH.SUCCESS'),
      data: {
        inquiry,
        items,
        messages
      }
    });
  } catch (error) {
    console.error('获取询价详情失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('INQUIRY.FETCH.FAILED')
    });
  }
};

// 创建新询价
exports.createInquiry = async (req, res) => {
  try {
    const userId = req.userId;
    const { titlePrefix } = req.body;
    
    if (!titlePrefix || titlePrefix.trim() === '') {
      return res.status(400).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.INVALID_TITLE_PREFIX')
      });
    }
    
    // 检查用户当前询价数量限制
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as count FROM inquiries WHERE user_id = ? AND status IN ("pending", "quoted") AND deleted = 0',
      [userId]
    );
    
    if (countResult[0].count >= 5) { // 限制最多5个活跃询价
      return res.status(400).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.MAX_INQUIRIES')
      });
    }
    
    // 获取用户当前最大的user_inquiry_id
    const [maxIdResult] = await pool.query(
      'SELECT COALESCE(MAX(user_inquiry_id), 0) as max_id FROM inquiries WHERE user_id = ?',
      [userId]
    );
    
    const nextUserInquiryId = maxIdResult[0].max_id + 1;
    const fullTitle = `${titlePrefix.trim()}${nextUserInquiryId}`;
    
    const guid = uuidToBinary(uuidv4());
    const [result] = await pool.query(
      'INSERT INTO inquiries (guid, user_id, user_inquiry_id, title, status, created_by, updated_by) VALUES (?, ?, ?, ?, "pending", ?, ?)',
      [guid, userId, nextUserInquiryId, fullTitle, userId, userId]
    );
    
    return res.json({
      success: true,
      message: getMessage('INQUIRY.CREATE.SUCCESS'),
      data: {
        id: result.insertId,
        user_inquiry_id: nextUserInquiryId,
        title: fullTitle,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('创建询价失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('INQUIRY.CREATE.FAILED')
    });
  }
};

// 添加商品到询价
exports.addItemToInquiry = async (req, res) => {
  try {
    const userId = req.userId;
    const { inquiryId } = req.params;
    const { productId, quantity, unitPrice } = req.body;
    
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.INVALID_ID')
      });
    }
    
    // 验证询价是否存在且属于当前用户
    const [inquiryResult] = await pool.query(
      'SELECT id, status FROM inquiries WHERE id = ? AND user_id = ? AND deleted = 0',
      [inquiryId, userId]
    );
    
    if (!inquiryResult || inquiryResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.NOT_FOUND')
      });
    }
    
    if (inquiryResult[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: getMessage('INQUIRY.BUSINESS.CANNOT_MODIFY_SUBMITTED')
      });
    }
    
    // 验证商品是否存在并获取完整信息
    const [productResult] = await pool.query(
      `SELECT 
        p.id, 
        p.name as product_name, 
        p.product_code,
        p.price as original_price,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND deleted = 0 ORDER BY sort_order ASC LIMIT 1) as image_url
      FROM products p 
      WHERE p.id = ? AND p.deleted = 0`,
      [productId]
    );
    
    if (!productResult || productResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('PRODUCT.NOT_FOUND')
      });
    }
    
    // 检查商品是否已在询价中
    const [existingItem] = await pool.query(
      'SELECT id FROM inquiry_items WHERE inquiry_id = ? AND product_id = ? AND deleted = 0',
      [inquiryId, productId]
    );
    
    if (existingItem && existingItem.length > 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('INQUIRY.BUSINESS.PRODUCT_ALREADY_EXISTS')
      });
    }
    
    // 添加商品到询价，包含价格信息
    const guid = uuidToBinary(uuidv4());
    const [result] = await pool.query(
      'INSERT INTO inquiry_items (guid, inquiry_id, product_id, quantity, unit_price, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [guid, inquiryId, productId, quantity, unitPrice || null, userId, userId]
    );
    
    // 返回与getInquiryDetail相同的数据结构
    return res.json({
      success: true,
      message: getMessage('INQUIRY.ITEM.ADD_SUCCESS'),
      data: {
        id: result.insertId,
        product_id: productId,
        quantity: quantity,
        unit_price: unitPrice || null,
        item_status: 'pending',
        product_name: productResult[0].product_name,
        product_code: productResult[0].product_code,
        original_price: productResult[0].original_price,
        image_url: productResult[0].image_url
      }
    });
  } catch (error) {
    console.error('添加商品到询价失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('INQUIRY.ITEM.ADD_FAILED')
    });
  }
};

// 发送询价消息
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { inquiryId } = req.params;
    const { message } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.INVALID_ID')
      });
    }
    
    // 验证询价是否存在且属于当前用户
    const [inquiryResult] = await pool.query(
      'SELECT id FROM inquiries WHERE id = ? AND user_id = ? AND deleted = 0',
      [inquiryId, userId]
    );
    
    if (!inquiryResult || inquiryResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.NOT_FOUND')
      });
    }
    
    // 添加消息
    const guid = uuidToBinary(uuidv4());
    const [result] = await pool.query(
      'INSERT INTO inquiry_messages (inquiry_id, guid, sender_id, sender_type, content, created_by, updated_by) VALUES (?, ?, ?, "user", ?, ?, ?)',
      [inquiryId, guid, userId, message.trim(), userId, userId]
    );
    
    return res.json({
      success: true,
      message: getMessage('INQUIRY.MESSAGE.SEND_SUCCESS'),
      data: {
        id: result.insertId,
        message: message.trim(),
        senderType: 'user'
      }
    });
  } catch (error) {
    console.error('发送询价消息失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('INQUIRY.MESSAGE.SEND_FAILED')
    });
  }
};

// 删除询价单中的商品
exports.removeItemFromInquiry = async (req, res) => {
  try {
    const userId = req.userId;
    const { inquiryId, itemId } = req.params;
    
    // 验证询价是否存在且属于当前用户
    const [inquiryResult] = await pool.query(
      'SELECT id, status FROM inquiries WHERE id = ? AND user_id = ? AND deleted = 0',
      [inquiryId, userId]
    );
    
    if (!inquiryResult || inquiryResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.NOT_FOUND')
      });
    }
    
    if (inquiryResult[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: getMessage('INQUIRY.BUSINESS.CANNOT_MODIFY_SUBMITTED')
      });
    }
    
    // 验证商品是否存在于询价中
    const [itemResult] = await pool.query(
      'SELECT id, product_id FROM inquiry_items WHERE id = ? AND inquiry_id = ? AND deleted = 0',
      [itemId, inquiryId]
    );
    
    if (!itemResult || itemResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.NOT_FOUND')
      });
    }
    
    // 软删除询价商品
    await pool.query(
      'UPDATE inquiry_items SET deleted = 1, updated_by = ?, updated_at = NOW() WHERE id = ?',
      [userId, itemId]
    );
    
    return res.json({
      success: true,
      message: getMessage('INQUIRY.ITEM.DELETE.SUCCESS'),
      data: {
        itemId,
        productId: itemResult[0].product_id
      }
    });
  } catch (error) {
    console.error('删除询价商品失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('INQUIRY.ITEM.DELETE.FAILED')
    });
  }
};

// 删除询价
exports.deleteInquiry = async (req, res) => {
  try {
    const userId = req.userId;
    const { inquiryId } = req.params;
    
    // 验证询价是否存在且属于当前用户
    const [inquiryResult] = await pool.query(
      'SELECT id, status FROM inquiries WHERE id = ? AND user_id = ? AND deleted = 0',
      [inquiryId, userId]
    );
    
    if (!inquiryResult || inquiryResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.NOT_FOUND')
      });
    }
    
    
    // 软删除询价及相关商品
    await pool.query(
      'UPDATE inquiries SET deleted = 1, updated_by = ?, updated_at = NOW() WHERE id = ?',
      [userId, inquiryId]
    );
    
    await pool.query(
      'UPDATE inquiry_items SET deleted = 1, updated_by = ?, updated_at = NOW() WHERE inquiry_id = ?',
      [userId, inquiryId]
    );
    
    return res.json({
      success: true,
      message: getMessage('INQUIRY.DELETE.SUCCESS')
    });
  } catch (error) {
    console.error('删除询价失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('INQUIRY.DELETE.FAILED')
    });
  }
};