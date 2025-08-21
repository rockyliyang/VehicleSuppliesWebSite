const { query } = require('../db/db');
const { getMessage } = require('../config/messages');
const sseHandler = require('../utils/sseHandler');
const pgNotificationManager = require('../utils/pgNotification');

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
        i.inquiry_type,
        i.created_at,
        i.updated_at,
        COUNT(ii.id) as item_count,
        SUM(CASE WHEN ii.unit_price IS NOT NULL THEN ii.quantity * ii.unit_price ELSE 0 END) as total_quoted_price,
        COALESCE(unread_counts.unread_count, 0) as unread_count
      FROM inquiries i
      LEFT JOIN inquiry_items ii ON i.id = ii.inquiry_id AND ii.deleted = false
      LEFT JOIN (
        SELECT 
          inquiry_id,
          COUNT(*) as unread_count
        FROM inquiry_messages 
        WHERE is_read = 0 AND deleted = false AND sender_type = 'admin'
        GROUP BY inquiry_id
      ) unread_counts ON i.id = unread_counts.inquiry_id
      ${whereClause}
      GROUP BY i.id, i.guid, i.user_inquiry_id, i.title, i.status, i.inquiry_type, i.created_at, i.updated_at, unread_counts.unread_count
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
    const total = parseInt(countResult.getFirstRow().total);
    
    // 为每个询价单查询商品预览图片（最多5张）
    const inquiriesWithItems = [];
    for (const inquiry of inquiries.getRows()) {
      const itemsQuery = `
        SELECT 
          ii.id,
          ii.product_id,
          ii.quantity,
          ii.unit_price,
          p.name as product_name,
          p.price as original_price,
          p.product_length,
          p.product_width,
          p.product_height,
          p.product_weight,
          (SELECT image_url FROM product_images WHERE product_id = p.id AND deleted = false ORDER BY sort_order ASC LIMIT 1) as image_url
        FROM inquiry_items ii
        JOIN products p ON ii.product_id = p.id
        WHERE ii.inquiry_id = $1 AND ii.deleted = false
        ORDER BY ii.created_at ASC
        LIMIT 5
      `;
      
      const items = await query(itemsQuery, [inquiry.id]);
      const itemsData = items.getRows();
      
      // 一次性查询所有商品的价格范围
      if (itemsData.length > 0) {
        const productIds = itemsData.map(item => item.product_id);
        const priceRangesQuery = `
          SELECT product_id, min_quantity, max_quantity, price
          FROM product_price_ranges
          WHERE product_id = ANY($1) AND deleted = false
          ORDER BY product_id, min_quantity ASC
        `;
        const priceRanges = await query(priceRangesQuery, [productIds]);
        const priceRangesData = priceRanges.getRows();
        
        // 将价格范围按product_id分组
        const priceRangesByProduct = {};
        priceRangesData.forEach(range => {
          if (!priceRangesByProduct[range.product_id]) {
            priceRangesByProduct[range.product_id] = [];
          }
          priceRangesByProduct[range.product_id].push({
            min_quantity: range.min_quantity,
            max_quantity: range.max_quantity,
            price: range.price
          });
        });
        
        // 为每个商品添加价格范围
        itemsData.forEach(item => {
          item.price_ranges = priceRangesByProduct[item.product_id] || [];
        });
      }
      
      inquiriesWithItems.push({
        ...inquiry,
        items: itemsData
      });
    }
    
    return res.json({
      success: true,
      message: getMessage('INQUIRY.FETCH.SUCCESS'),
      data: {
        inquiries: inquiriesWithItems,
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
        i.inquiry_type,
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
        p.product_length,
        p.product_width,
        p.product_height,
        p.product_weight,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND deleted = false ORDER BY sort_order ASC LIMIT 1) as image_url
      FROM inquiry_items ii
      JOIN products p ON ii.product_id = p.id
      WHERE ii.inquiry_id = $1 AND ii.deleted = false
      ORDER BY ii.created_at ASC
    `;
    
    const items = await query(itemsQuery, [inquiryId]);
    const itemsData = items.getRows();
    
    // 一次性查询所有商品的价格范围
    if (itemsData.length > 0) {
      const productIds = itemsData.map(item => item.product_id);
      const priceRangesQuery = `
        SELECT product_id, min_quantity, max_quantity, price
        FROM product_price_ranges
        WHERE product_id = ANY($1) AND deleted = false
        ORDER BY product_id, min_quantity ASC
      `;
      const priceRanges = await query(priceRangesQuery, [productIds]);
      const priceRangesData = priceRanges.getRows();
      
      // 将价格范围按product_id分组
      const priceRangesByProduct = {};
      priceRangesData.forEach(range => {
        if (!priceRangesByProduct[range.product_id]) {
          priceRangesByProduct[range.product_id] = [];
        }
        priceRangesByProduct[range.product_id].push({
          min_quantity: range.min_quantity,
          max_quantity: range.max_quantity,
          price: range.price
        });
      });
      
      // 为每个商品添加价格范围
      itemsData.forEach(item => {
        item.price_ranges = priceRangesByProduct[item.product_id] || [];
      });
    }
    
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
        items: itemsData,
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
    const { titlePrefix, inquiryType } = req.body;
    
    if (!titlePrefix || titlePrefix.trim() === '') {
      return res.status(400).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.INVALID_TITLE_PREFIX')
      });
    }
    
    // 验证询价类型
    const validInquiryType = inquiryType && ['single', 'custom'].includes(inquiryType) ? inquiryType : 'custom';
    
    // 检查用户当前询价数量限制
    const countResult = await query(
      'SELECT COUNT(*) as count FROM inquiries WHERE user_id = $1 AND status = \'inquiried\' AND inquiry_type = \'custom\' AND deleted = false',
      [userId]
    );
    
    if (countResult.getFirstRow().count >= 10) { // 限制最多5个活跃询价
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
      'INSERT INTO inquiries (user_id, user_inquiry_id, title, status, inquiry_type, created_by, updated_by) VALUES ($1, $2, $3, \'inquiried\', $4, $5, $6) RETURNING id',
      [userId, nextUserInquiryId, fullTitle, validInquiryType, userId, userId]
    );
    
    return res.json({
      success: true,
      message: getMessage('INQUIRY.CREATE.SUCCESS'),
      data: {
        id: result.getFirstRow().id,
        user_inquiry_id: nextUserInquiryId,
        title: fullTitle,
        status: 'inquiried'
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
    
    if (inquiryResult.getFirstRow().status !== 'inquiried') {
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
    
    // 添加商品到询价，不填充单价（由管理员后续设置）
    const result = await query(
      'INSERT INTO inquiry_items (inquiry_id, product_id, quantity, unit_price, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [inquiryId, productId, quantity, null, userId, userId]
    );
    
    // 返回与getInquiryDetail相同的数据结构
    return res.json({
      success: true,
      message: getMessage('INQUIRY.ITEM.ADD_SUCCESS'),
      data: {
        id: result.getFirstRow().id,
        product_id: productId,
        quantity: quantity,
        unit_price: null,
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

// 批量添加商品到询价
exports.addItemsToInquiry = async (req, res) => {
  try {
    const userId = req.userId;
    const { inquiryId } = req.params;
    const { items } = req.body; // items: [{ productId, quantity }]
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.INVALID_ITEMS')
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
    
    if (inquiryResult.getFirstRow().status !== 'inquiried') {
      return res.status(400).json({
        success: false,
        message: getMessage('INQUIRY.BUSINESS.CANNOT_MODIFY_SUBMITTED')
      });
    }
    
    const addedItems = [];
    const errors = [];
    
    for (const item of items) {
      const { productId, quantity } = item;
      
      if (!productId || !quantity || quantity <= 0) {
        errors.push({ productId, error: 'Invalid product ID or quantity' });
        continue;
      }
      
      try {
        // 验证商品是否存在并获取完整信息
        const productResult = await query(
          `SELECT 
            p.id, 
            p.name as product_name, 
            p.product_code,
            p.price as original_price,
            p.product_length,
            p.product_width,
            p.product_height,
            p.product_weight,
            (SELECT image_url FROM product_images WHERE product_id = p.id AND deleted = false ORDER BY sort_order ASC LIMIT 1) as image_url
          FROM products p 
          WHERE p.id = $1 AND p.deleted = false`,
          [productId]
        );
        
        if (!productResult || productResult.getRowCount() === 0) {
          errors.push({ productId, error: 'Product not found' });
          continue;
        }
        
        // 检查商品是否已在询价中
        const existingItem = await query(
          'SELECT id FROM inquiry_items WHERE inquiry_id = $1 AND product_id = $2 AND deleted = false',
          [inquiryId, productId]
        );
        
        if (existingItem && existingItem.getRowCount() > 0) {
          errors.push({ productId, error: 'Product already exists in inquiry' });
          continue;
        }
        
        // 添加商品到询价
        const result = await query(
          'INSERT INTO inquiry_items (inquiry_id, product_id, quantity, unit_price, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
          [inquiryId, productId, quantity, null, userId, userId]
        );
        
        const productInfo = productResult.getFirstRow();
        addedItems.push({
          id: result.getFirstRow().id,
          product_id: productId,
          quantity: quantity,
          unit_price: null,
          item_status: 'pending',
          product_name: productInfo.product_name,
          product_code: productInfo.product_code,
          original_price: productInfo.original_price,
          product_length: productInfo.product_length,
          product_width: productInfo.product_width,
          product_height: productInfo.product_height,
          product_weight: productInfo.product_weight,
          image_url: productInfo.image_url
        });
      } catch (itemError) {
        console.error(`添加商品 ${productId} 到询价失败:`, itemError);
        errors.push({ productId, error: itemError.message });
      }
    }
    
    return res.json({
      success: true,
      message: getMessage('INQUIRY.ITEM.BATCH_ADD_SUCCESS'),
      data: {
        addedItems,
        errors
      }
    });
  } catch (error) {
    console.error('批量添加商品到询价失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('INQUIRY.ITEM.BATCH_ADD_FAILED')
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
    // 通过PostgreSQL通知机制推送新消息
     await pgNotificationManager.notifyNewMessage(inquiryId, messageData);
     console.info('trigger newMessage via PostgreSQL notification', { inquiryId, messageData });
    
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

// 标记消息为已读
exports.markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { inquiryId } = req.params;
    
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
    
    // 标记该询价单中所有管理员发送的未读消息为已读
    await query(
      'UPDATE inquiry_messages SET is_read = 1, updated_by = $1, updated_at = NOW() WHERE inquiry_id = $2 AND sender_type = \'admin\' AND is_read = 0 AND deleted = false',
      [userId, inquiryId]
    );
    
    return res.json({
      success: true,
      message: getMessage('INQUIRY.MESSAGE.MARK_READ_SUCCESS')
    });
  } catch (error) {
    console.error('标记消息为已读失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('INQUIRY.MESSAGE.MARK_READ_FAILED')
    });
  }
};

// 更新询价单中的商品数量
exports.updateItemInInquiry = async (req, res) => {
  try {
    const userId = req.userId;
    const { inquiryId, itemId } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.INVALID_QUANTITY')
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
    
    if (inquiryResult.getFirstRow().status !== 'inquiried') {
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
    
    // 更新商品数量
    await query(
      'UPDATE inquiry_items SET quantity = $1, updated_by = $2, updated_at = NOW() WHERE id = $3',
      [quantity, userId, itemId]
    );
    
    return res.json({
      success: true,
      message: getMessage('INQUIRY.ITEM.UPDATE_SUCCESS'),
      data: {
        itemId,
        quantity
      }
    });
  } catch (error) {
    console.error('更新询价商品数量失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('INQUIRY.ITEM.UPDATE_FAILED')
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
    
    if (inquiryResult.getFirstRow().status !== 'inquiried') {
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

// 查找包含特定商品的询价单
exports.findInquiryByProduct = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId } = req.params;
    const { inquiryType } = req.body; // 从请求体获取询价类型
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.INVALID_ID')
      });
    }
    
    // 构建查询条件
    let whereConditions = `
      WHERE i.user_id = $1 
        AND i.deleted = false 
        AND i.status = 'inquiried'
        AND ii.product_id = $2
    `;
    let queryParams = [userId, productId];
    
    // 如果指定了询价类型，添加类型过滤条件
    if (inquiryType && ['single', 'custom'].includes(inquiryType)) {
      whereConditions += ` AND i.inquiry_type = $3`;
      queryParams.push(inquiryType);
    }
    
    // 查找包含指定商品且只有这一个商品的询价单
    const queryStr = `
      SELECT 
        i.id,
        i.guid,
        i.user_inquiry_id,
        i.title,
        i.status,
        i.inquiry_type,
        i.created_at,
        i.updated_at,
        COUNT(ii.id) as item_count
      FROM inquiries i
      INNER JOIN inquiry_items ii ON i.id = ii.inquiry_id AND ii.deleted = false
      ${whereConditions}
      GROUP BY i.id, i.guid, i.user_inquiry_id, i.title, i.status, i.inquiry_type, i.created_at, i.updated_at
      HAVING COUNT(ii.id) = 1
      ORDER BY i.created_at DESC
      LIMIT 1
    `;
    
    const result = await query(queryStr, queryParams);
    
    if (result && result.getRowCount() > 0) {
      const inquiry = result.getFirstRow();
      
      // 获取商品详情
      const itemQuery = `
        SELECT 
          ii.id,
          ii.product_id,
          ii.quantity,
          ii.unit_price,
          p.name as product_name,
          p.product_code,
          p.price as original_price,
          p.product_length,
          p.product_width,
          p.product_height,
          p.product_weight,
          (SELECT image_url FROM product_images WHERE product_id = p.id AND deleted = false ORDER BY sort_order ASC LIMIT 1) as image_url
        FROM inquiry_items ii
        JOIN products p ON ii.product_id = p.id
        WHERE ii.inquiry_id = $1 AND ii.deleted = false
      `;
      
      const items = await query(itemQuery, [inquiry.id]);
      
      return res.json({
        success: true,
        message: getMessage('INQUIRY.FETCH.SUCCESS'),
        data: {
          inquiry,
          items: items.getRows()
        }
      });
    } else {
      return res.json({
        success: true,
        message: 'No matching inquiry found',
        data: null
      });
    }
  } catch (error) {
    console.error('查找包含特定商品的询价单失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('INQUIRY.FETCH.FAILED')
    });
  }
};