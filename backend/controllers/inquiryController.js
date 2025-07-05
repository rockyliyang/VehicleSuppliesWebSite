const { query } = require('../db/db');
const { getMessage } = require('../config/messages');
const sseHandler = require('../utils/sseHandler');

// 获取用户询价列表
exports.getUserInquiries = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    let whereClause = 'WHERE i.user_id = $1 AND i.deleted = false';
    let queryParams = [userId];
    let paramIndex = 2;
    
    if (status) {
      whereClause += ` AND i.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    // 查询询价列表
    const queryStr = `
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
      LEFT JOIN inquiry_items ii ON i.id = ii.inquiry_id AND ii.deleted = false
      ${whereClause}
      GROUP BY i.id, i.guid, i.user_inquiry_id, i.title, i.status, i.created_at, i.updated_at
      ORDER BY i.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(parseInt(limit), parseInt(offset));
    const inquiries = await query(queryStr, queryParams);
    
    // 查询总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM inquiries i
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams.slice(0, -2));
    const total = countResult.getFirstRow().total;
    
    return res.json({
      success: true,
      message: getMessage('INQUIRY.FETCH.SUCCESS'),
      data: {
        inquiries: inquiries.getRows(),
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
      WHERE i.id = $1 AND i.user_id = $2 AND i.deleted = false
    `;
    
    const inquiryResult = await query(inquiryQuery, [inquiryId, userId]);
    
    if (!inquiryResult || inquiryResult.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.NOT_FOUND')
      });
    }
    
    const inquiry = inquiryResult.getFirstRow();
    
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
        (SELECT image_url FROM product_images WHERE product_id = p.id AND deleted = false ORDER BY sort_order ASC LIMIT 1) as image_url
      FROM inquiry_items ii
      JOIN products p ON ii.product_id = p.id
      WHERE ii.inquiry_id = $1 AND ii.deleted = false
      ORDER BY ii.created_at ASC
    `;
    
    const items = await query(itemsQuery, [inquiryId]);
    
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
      WHERE im.inquiry_id = $1 AND im.deleted = false
      ORDER BY im.created_at ASC
    `;
    
    const messages = await query(messagesQuery, [inquiryId]);
    
    return res.json({
      success: true,
      message: getMessage('INQUIRY.FETCH.SUCCESS'),
      data: {
        inquiry,
        items: items.getRows(),
        messages: messages.getRows()
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
    const countResult = await query(
      'SELECT COUNT(*) as count FROM inquiries WHERE user_id = $1 AND status IN (\'pending\', \'quoted\') AND deleted = false',
      [userId]
    );
    
    if (countResult.getFirstRow().count >= 5) { // 限制最多5个活跃询价
      return res.status(400).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.MAX_INQUIRIES')
      });
    }
    
    // 获取用户当前最大的user_inquiry_id
    const maxIdResult = await query(
      'SELECT COALESCE(MAX(user_inquiry_id), 0) as max_id FROM inquiries WHERE user_id = $1',
      [userId]
    );
    
    const nextUserInquiryId = maxIdResult.getFirstRow().max_id + 1;
    const fullTitle = `${titlePrefix.trim()}${nextUserInquiryId}`;
    
    const result = await query(
      'INSERT INTO inquiries (user_id, user_inquiry_id, title, status, created_by, updated_by) VALUES ($1, $2, $3, \'pending\', $4, $5) RETURNING id',
      [userId, nextUserInquiryId, fullTitle, userId, userId]
    );
    
    return res.json({
      success: true,
      message: getMessage('INQUIRY.CREATE.SUCCESS'),
      data: {
        id: result.getFirstRow().id,
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
    const inquiryResult = await query(
      'SELECT id, status FROM inquiries WHERE id = $1 AND user_id = $2 AND deleted = false',
      [inquiryId, userId]
    );
    
    if (!inquiryResult || inquiryResult.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.NOT_FOUND')
      });
    }
    
    if (inquiryResult.getFirstRow().status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: getMessage('INQUIRY.BUSINESS.CANNOT_MODIFY_SUBMITTED')
      });
    }
    
    // 验证商品是否存在并获取完整信息
    const productResult = await query(
      `SELECT 
        p.id, 
        p.name as product_name, 
        p.product_code,
        p.price as original_price,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND deleted = false ORDER BY sort_order ASC LIMIT 1) as image_url
      FROM products p 
      WHERE p.id = $1 AND p.deleted = false`,
      [productId]
    );
    
    if (!productResult || productResult.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('PRODUCT.NOT_FOUND')
      });
    }
    
    // 检查商品是否已在询价中
    const existingItem = await query(
      'SELECT id FROM inquiry_items WHERE inquiry_id = $1 AND product_id = $2 AND deleted = false',
      [inquiryId, productId]
    );
    
    if (existingItem && existingItem.getRowCount() > 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('INQUIRY.BUSINESS.PRODUCT_ALREADY_EXISTS')
      });
    }
    
    // 添加商品到询价，包含价格信息
    const result = await query(
      'INSERT INTO inquiry_items (inquiry_id, product_id, quantity, unit_price, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [inquiryId, productId, quantity, unitPrice || null, userId, userId]
    );
    
    // 返回与getInquiryDetail相同的数据结构
    return res.json({
      success: true,
      message: getMessage('INQUIRY.ITEM.ADD_SUCCESS'),
      data: {
        id: result.getFirstRow().id,
        product_id: productId,
        quantity: quantity,
        unit_price: unitPrice || null,
        item_status: 'pending',
        product_name: productResult.getFirstRow().product_name,
        product_code: productResult.getFirstRow().product_code,
        original_price: productResult.getFirstRow().original_price,
        image_url: productResult.getFirstRow().image_url
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
    const inquiryResult = await query(
      'SELECT id, user_id FROM inquiries WHERE id = $1 AND user_id = $2 AND deleted = false',
      [inquiryId, userId]
    );
    
    if (!inquiryResult || inquiryResult.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.NOT_FOUND')
      });
    }
    
    // 添加消息
    const result = await query(
      'INSERT INTO inquiry_messages (inquiry_id, sender_id, sender_type, content, created_by, updated_by) VALUES ($1, $2, \'user\', $3, $4, $5) RETURNING id',
      [inquiryId, userId, message.trim(), userId, userId]
    );
    
    // 获取用户信息用于SSE推送
    const userResult = await query(
      'SELECT username, email FROM users WHERE id = $1',
      [userId]
    );
    
    const user = userResult.getFirstRow();
    
    // 构建消息数据
    const messageData = {
      id: result.getFirstRow().id,
      inquiryId: parseInt(inquiryId),
      senderId: userId,
      senderType: 'user',
      senderName: user ? user.username : 'Unknown User',
      senderEmail: user ? user.email : '',
      content: message.trim(),
      messageType: 'text',
      timestamp: new Date().toISOString()
    };
    // 通过SSE推送新消息给管理员
    const adminUsers = await query(
      'SELECT id FROM users WHERE user_role = \'admin\' AND deleted = false'
    );
    /*
    const adminUserIds = adminUsers.map(admin => admin.id.toString());
    
    // 推送给管理员
    if (adminUserIds.length > 0) {
      sseHandler.broadcastToInquiry(inquiryId, messageData, 'new_message', adminUserIds);
    }*/
    
    // 触发长轮询事件
    const EventEmitter = require('events');
    if (!global.inquiryEventEmitter) {
      global.inquiryEventEmitter = new EventEmitter();
    }
    global.inquiryEventEmitter.emit('newMessage', { inquiryId, messageData });
    
    return res.json({
      success: true,
      message: getMessage('INQUIRY.MESSAGE.SEND_SUCCESS'),
      data: messageData
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
    const inquiryResult = await query(
      'SELECT id, status FROM inquiries WHERE id = $1 AND user_id = $2 AND deleted = false',
      [inquiryId, userId]
    );
    
    if (!inquiryResult || inquiryResult.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.NOT_FOUND')
      });
    }
    
    if (inquiryResult.getFirstRow().status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: getMessage('INQUIRY.BUSINESS.CANNOT_MODIFY_SUBMITTED')
      });
    }
    
    // 验证商品是否存在于询价中
    const itemResult = await query(
      'SELECT id, product_id FROM inquiry_items WHERE id = $1 AND inquiry_id = $2 AND deleted = false',
      [itemId, inquiryId]
    );
    
    if (!itemResult || itemResult.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.NOT_FOUND')
      });
    }
    
    // 软删除询价商品
    await query(
      'UPDATE inquiry_items SET deleted = true, updated_by = $1, updated_at = NOW() WHERE id = $2',
      [userId, itemId]
    );
    
    return res.json({
      success: true,
      message: getMessage('INQUIRY.ITEM.DELETE.SUCCESS'),
      data: {
        itemId,
        productId: itemResult.getFirstRow().product_id
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
    const inquiryResult = await query(
      'SELECT id, status FROM inquiries WHERE id = $1 AND user_id = $2 AND deleted = false',
      [inquiryId, userId]
    );
    
    if (!inquiryResult || inquiryResult.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.NOT_FOUND')
      });
    }
    
    
    // 软删除询价及相关商品
    await query(
      'UPDATE inquiries SET deleted = true, updated_by = $1, updated_at = NOW() WHERE id = $2',
      [userId, inquiryId]
    );
    
    await query(
      'UPDATE inquiry_items SET deleted = true, updated_by = $1, updated_at = NOW() WHERE inquiry_id = $2',
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