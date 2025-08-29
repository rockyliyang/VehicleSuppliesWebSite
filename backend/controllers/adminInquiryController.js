const { query } = require('../db/db');
const { getMessage } = require('../config/messages');
const pgNotificationManager = require('../utils/pgNotification');
const { getManagedUserIds, generateUserIdsPlaceholders } = require('../utils/adminUserUtils');

const sseHandler = require('../utils/sseHandler');
// 获取所有询价列表（管理员）
exports.getAllInquiries = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, userId, startDate, endDate, unreadFilter } = req.query;
    const offset = (page - 1) * limit;
    const currentUserId = req.userId; // 从JWT中获取当前登录用户ID
    
    // 获取当前管理员管理的用户ID列表
    const managedUserIds = await getManagedUserIds(currentUserId);
    
    if (managedUserIds.length === 0) {
      return res.json({
        success: true,
        message: getMessage('INQUIRY.FETCH.SUCCESS'),
        data: {
          inquiries: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            totalPages: 0
          }
        }
      });
    }
    
    // 生成用户ID占位符
    const { placeholders, params } = generateUserIdsPlaceholders(managedUserIds);
    
    // 构建查询条件
    let paramIndex = params.length + 1;
    let whereClause = `WHERE i.deleted = false AND i.user_id IN (${placeholders})`;
    let queryParams = [...params];
    
    if (status) {
      whereClause += ` AND i.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    if (userId) {
      whereClause += ` AND i.user_id = $${paramIndex}`;
      queryParams.push(userId);
      paramIndex++;
    }
    
    if (startDate) {
      whereClause += ` AND i.created_at >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      whereClause += ` AND i.created_at <= $${paramIndex}`;
      queryParams.push(endDate + ' 23:59:59');
      paramIndex++;
    }
    
    // 添加未读消息过滤条件
    if (unreadFilter === 'unread') {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM inquiry_messages im 
        WHERE im.inquiry_id = i.id 
        AND im.deleted = false 
        AND im.sender_type = 'user' 
        AND im.is_read = 0
      )`;
    } else if (unreadFilter === 'read') {
      whereClause += ` AND NOT EXISTS (
        SELECT 1 FROM inquiry_messages im 
        WHERE im.inquiry_id = i.id 
        AND im.deleted = false 
        AND im.sender_type = 'user' 
        AND im.is_read = 0
      )`;
    }
    
    // 查询询价列表
    const inquiryQuery = `
      SELECT 
        i.id,
        i.user_inquiry_id,
        i.title,
        i.status,
        i.user_id,
        i.created_at,
        i.updated_at,
        u.username,
        u.email,
        COALESCE(item_stats.item_count, 0) as item_count,
        COALESCE(message_stats.message_count, 0) as message_count,
        COALESCE(unread_stats.unread_count, 0) as unread_count
      FROM inquiries i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN (
        SELECT 
          inquiry_id,
          COUNT(id) as item_count
        FROM inquiry_items 
        WHERE deleted = false 
        GROUP BY inquiry_id
      ) item_stats ON i.id = item_stats.inquiry_id
      LEFT JOIN (
        SELECT 
          inquiry_id,
          COUNT(id) as message_count
        FROM inquiry_messages 
        WHERE deleted = false 
        GROUP BY inquiry_id
      ) message_stats ON i.id = message_stats.inquiry_id
      LEFT JOIN (
        SELECT 
          inquiry_id,
          COUNT(id) as unread_count
        FROM inquiry_messages 
        WHERE deleted = false 
        AND sender_type = 'user' 
        AND is_read = 0
        GROUP BY inquiry_id
      ) unread_stats ON i.id = unread_stats.inquiry_id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(parseInt(limit), parseInt(offset));
    const inquiries = await query(inquiryQuery, queryParams);
    
    // 处理返回数据格式
    const formattedInquiries = inquiries.getRows().map(inquiry => ({
      ...inquiry,
      item_count: parseInt(inquiry.item_count) || 0,
      message_count: parseInt(inquiry.message_count) || 0,
      unread_count: parseInt(inquiry.unread_count) || 0
    }));
    
    // 查询总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM inquiries i
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.getFirstRow().total);
    
    return res.json({
      success: true,
      message: getMessage('INQUIRY.FETCH.SUCCESS'),
      data: {
        inquiries: formattedInquiries,
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

// 获取询价详情（管理员）
exports.getInquiryDetail = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    
    // 查询询价基本信息
    const inquiryQuery = `
      SELECT 
        i.id,
        i.guid,
        i.user_inquiry_id,
        i.title,
        i.status,
        i.user_id,
        i.inquiry_type,
        i.created_at,
        i.updated_at,
        i.update_price_time,
        u.username,
        u.email,
        u.phone
      FROM inquiries i
      LEFT JOIN users u ON i.user_id = u.id
      WHERE i.id = $1 AND i.deleted = false
    `;
    
    const inquiryResult = await query(inquiryQuery, [inquiryId]);
    
    if (!inquiryResult || inquiryResult.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.NOT_FOUND')
      });
    }
    
    const inquiry = inquiryResult.getFirstRow();
    
    // 检查价格是否过期（48小时）
    const priceExpired = inquiry.update_price_time && 
      (new Date() - new Date(inquiry.update_price_time)) > (48 * 60 * 60 * 1000);
    
    // 查询询价商品
    const itemsQuery = `
      SELECT 
        ii.id,
        ii.product_id,
        ii.quantity,
        CASE 
          WHEN $2 = true THEN NULL 
          ELSE ii.unit_price 
        END as unit_price,
        'pending' as item_status,
        ii.created_at,
        ii.updated_at,
        p.name as product_name,
        p.product_code,
        p.price as original_price,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND deleted = false ORDER BY sort_order ASC LIMIT 1) as image_url
      FROM inquiry_items ii
      JOIN products p ON ii.product_id = p.id
      WHERE ii.inquiry_id = $1 AND ii.deleted = false
      ORDER BY ii.created_at ASC
    `;
    
    const items = await query(itemsQuery, [inquiryId, priceExpired]);
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
        im.sender_id,
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
        inquiry: inquiryResult.getFirstRow(),
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

// 更新商品报价（管理员）
exports.updateItemQuote = async (req, res) => {
  try {
    const adminId = req.userId;
    const { itemId } = req.params;
    const { quotedPrice, status } = req.body;
    
    if (!quotedPrice || quotedPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.INVALID_PRICE')
      });
    }
    
    // 验证询价商品是否存在
    const itemResult = await query(
      'SELECT ii.id, ii.inquiry_id, i.status as inquiry_status FROM inquiry_items ii JOIN inquiries i ON ii.inquiry_id = i.id WHERE ii.id = $1 AND ii.deleted = false AND i.deleted = false',
      [itemId]
    );
    
    if (!itemResult || itemResult.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.NOT_FOUND')
      });
    }
    
    if (itemResult.getFirstRow().inquiry_status === 'approved') {
      return res.status(400).json({
        success: false,
        message: getMessage('INQUIRY.BUSINESS.CANNOT_MODIFY_COMPLETED')
      });
    }
    
    const inquiryId = itemResult.getFirstRow().inquiry_id;
    
    // 更新商品报价
    await query(
      'UPDATE inquiry_items SET unit_price = $1, updated_by = $2, updated_at = NOW() WHERE id = $3',
      [quotedPrice, adminId, itemId]
    );
    
    // 更新询价单的报价时间
    await query(
      'UPDATE inquiries SET update_price_time = NOW(), updated_by = $1, updated_at = NOW() WHERE id = $2',
      [adminId, inquiryId]
    );
    

    
    return res.json({
      success: true,
      message: getMessage('INQUIRY.QUOTE.SUCCESS'),
      data: {
        itemId,
        quotedPrice,
        status: status || 'quoted'
      }
    });
  } catch (error) {
    console.error('更新商品报价失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('INQUIRY.QUOTE.FAILED')
    });
  }
};

// 批量更新商品报价（管理员）
exports.batchUpdateItemQuotes = async (req, res) => {
  try {
    const adminId = req.userId;
    const { items } = req.body; // [{ itemId, quotedPrice, status }]
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.INVALID_ID')
      });
    }
    
    let updatedCount = 0;
    const inquiryIds = new Set();
    
    for (const item of items) {
      const { itemId, quotedPrice, status } = item;
      
      if (!itemId || !quotedPrice || quotedPrice <= 0) {
        continue;
      }
      
      // 验证询价商品是否存在
      const itemResult = await query(
        'SELECT ii.id, ii.inquiry_id, i.status as inquiry_status FROM inquiry_items ii JOIN inquiries i ON ii.inquiry_id = i.id WHERE ii.id = $1 AND ii.deleted = false AND i.deleted = false',
        [itemId]
      );
      
      if (!itemResult || itemResult.getRowCount() === 0 || itemResult.getFirstRow().inquiry_status === 'completed') {
        continue;
      }
      
      // 更新商品报价
      await query(
        'UPDATE inquiry_items SET unit_price = $1, updated_by = $2, updated_at = NOW() WHERE id = $3',
        [quotedPrice, adminId, itemId]
      );
      
      inquiryIds.add(itemResult.getFirstRow().inquiry_id);
      updatedCount++;
    }
    
    // 检查并更新询价状态
    for (const inquiryId of inquiryIds) {
      const unquotedItems = await query(
        'SELECT COUNT(*) as count FROM inquiry_items WHERE inquiry_id = $1 AND unit_price IS NULL AND deleted = false',
        [inquiryId]
      );
      
      if (unquotedItems.getFirstRow().count === '0') {
        await query(
          'UPDATE inquiries SET status = $1, updated_by = $2, updated_at = NOW() WHERE id = $3',
          ['quoted', adminId, inquiryId]
        );
      }
    }
    
    return res.json({
      success: true,
      message: getMessage('INQUIRY.QUOTE.SUCCESS'),
      data: {
        updatedCount
      }
    });
  } catch (error) {
    console.error('批量更新商品报价失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('INQUIRY.QUOTE.FAILED')
    });
  }
};

// 发送询价消息（管理员）
exports.sendMessage = async (req, res) => {
  try {
    const adminId = req.userId;
    const { inquiryId } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: getMessage('INQUIRY.MESSAGE.CONTENT_REQUIRED')
      });
    }
    
    // 验证询价是否存在并获取用户信息
    const inquiryResult = await query(
      'SELECT id, user_id FROM inquiries WHERE id = $1 AND deleted = false',
      [inquiryId]
    );
    
    if (!inquiryResult || inquiryResult.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.NOT_FOUND')
      });
    }
    
    const inquiry = inquiryResult.getFirstRow();
    
    // 获取管理员信息
    const adminResult = await query(
      'SELECT username, email FROM users WHERE id = $1',
      [adminId]
    );
    
    const admin = adminResult.getFirstRow();
    
    // 添加消息
    const result = await query(
      'INSERT INTO inquiry_messages (inquiry_id, sender_id, sender_type, content, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [inquiryId, adminId, 'admin', content.trim(), adminId, adminId]
    );
    
    // 构建消息数据
    const messageData = {
      id: result.getFirstRow().id,
      inquiryId: parseInt(inquiryId),
      senderId: adminId,
      senderType: 'admin',
      senderName: admin ? admin.username : 'Admin',
      senderEmail: admin ? admin.email : '',
      content: content.trim(),
      messageType: 'text',
      timestamp: new Date().toISOString()
    };
    
    // 通过SSE推送新消息给用户
    //const userIds = [inquiry.user_id.toString()];
    //sseHandler.broadcastToInquiry(inquiryId, messageData, 'new_message', userIds);
    
    // 通过PostgreSQL通知机制发送消息
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

// 更新询价状态（管理员）
exports.updateInquiryStatus = async (req, res) => {
  try {
    const adminId = req.userId;
    const { inquiryId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['inquiried', 'approved', 'rejected', 'paid'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.INVALID_STATUS')
      });
    }
    
    // 验证询价是否存在
    const inquiryResult = await query(
      'SELECT id, status as current_status FROM inquiries WHERE id = $1 AND deleted = false',
      [inquiryId]
    );
    
    if (!inquiryResult || inquiryResult.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.NOT_FOUND')
      });
    }
    
    // 更新询价状态
    await query(
      'UPDATE inquiries SET status = $1, updated_by = $2, updated_at = NOW() WHERE id = $3',
      [status, adminId, inquiryId]
    );
    
    
    return res.json({
      success: true,
      message: getMessage('INQUIRY.STATUS.UPDATE.SUCCESS'),
      data: {
        inquiryId,
        status
      }
    });
  } catch (error) {
    console.error('更新询价状态失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('INQUIRY.STATUS.UPDATE.FAILED')
    });
  }
};

// 获取询价统计信息（管理员）
exports.getInquiryStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = '';
    let queryParams = [];
    
    if (startDate && endDate) {
      dateFilter = 'WHERE created_at >= $1 AND created_at <= $2';
      queryParams = [startDate, endDate + ' 23:59:59'];
    }
    
    // 获取基本统计
    const statsQuery = `
      SELECT 
        COUNT(*) as total_inquiries,
        COUNT(CASE WHEN status = 'inquiried' THEN 1 END) as inquiried_count,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count
      FROM inquiries 
      ${dateFilter} AND deleted = false
    `;
    
    const statsResult = await query(statsQuery, queryParams);
    
    // 获取每日询价数量（最近30天）
    const dailyStatsQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM inquiries 
      WHERE created_at >= NOW() - INTERVAL '30 days' AND deleted = false
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    
    const dailyStats = await query(dailyStatsQuery);
    
    // 获取热门产品（被询价最多的产品）
    const popularProductsQuery = `
      SELECT 
        p.id,
        p.name,
        p.product_code,
        COUNT(ii.id) as inquiry_count
      FROM inquiry_items ii
      JOIN products p ON ii.product_id = p.id
      JOIN inquiries i ON ii.inquiry_id = i.id
      WHERE ii.deleted = false AND i.deleted = false
      GROUP BY p.id, p.name, p.product_code
      ORDER BY inquiry_count DESC
      LIMIT 10
    `;
    
    const popularProducts = await query(popularProductsQuery);
    
    return res.json({
      success: true,
      message: getMessage('INQUIRY.FETCH.SUCCESS'),
      data: {
        stats: statsResult.getFirstRow(),
        dailyStats: dailyStats.getRows(),
        popularProducts: popularProducts.getRows()
      }
    });
  } catch (error) {
    console.error('获取询价统计失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('INQUIRY.FETCH.FAILED')
    });
  }
};

// 删除询价（管理员）
exports.deleteInquiry = async (req, res) => {
  try {
    const adminId = req.userId;
    const { inquiryId } = req.params;
    
    // 验证询价是否存在
    const inquiryResult = await query(
      'SELECT id FROM inquiries WHERE id = $1 AND deleted = false',
      [inquiryId]
    );
    
    if (!inquiryResult || inquiryResult.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.NOT_FOUND')
      });
    }
    
    // 软删除询价及相关数据
    await query(
      'UPDATE inquiries SET deleted = true, updated_by = $1, updated_at = NOW() WHERE id = $2',
      [adminId, inquiryId]
    );
    
    await query(
      'UPDATE inquiry_items SET deleted = true, updated_by = $1, updated_at = NOW() WHERE inquiry_id = $2',
      [adminId, inquiryId]
    );
    
    await query(
      'UPDATE inquiry_messages SET deleted = true, updated_by = $1, updated_at = NOW() WHERE inquiry_id = $2',
      [adminId, inquiryId]
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

// 导出询价数据（管理员）
exports.exportInquiries = async (req, res) => {
  try {
    const { startDate, endDate, status, format = 'json' } = req.query;
    
    // 构建查询条件
    let whereClause = 'WHERE i.deleted = false';
    let queryParams = [];
    let paramIndex = 1;
    
    if (status) {
      whereClause += ` AND i.status = $${paramIndex++}`;
      queryParams.push(status);
    }
    
    if (startDate) {
      whereClause += ` AND i.created_at >= $${paramIndex++}`;
      queryParams.push(startDate);
    }
    
    if (endDate) {
      whereClause += ` AND i.created_at <= $${paramIndex++}`;
      queryParams.push(endDate + ' 23:59:59');
    }
    
    // 查询询价数据
    const exportQuery = `
      SELECT 
        i.id,
        i.title,
        i.status,
        i.created_at,
        u.username,
        u.email,
        COALESCE(item_stats.item_count, 0) as item_count,
        COALESCE(item_stats.total_quoted_price, 0) as total_quoted_price
      FROM inquiries i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN (
        SELECT 
          inquiry_id,
          COUNT(id) as item_count,
          SUM(CASE WHEN unit_price IS NOT NULL THEN quantity * unit_price ELSE 0 END) as total_quoted_price
        FROM inquiry_items 
        WHERE deleted = false 
        GROUP BY inquiry_id
      ) item_stats ON i.id = item_stats.inquiry_id
      ${whereClause}
      ORDER BY i.created_at DESC
    `;
    
    const inquiries = await query(exportQuery, queryParams);
    
    if (format === 'csv') {
      // 生成CSV格式
      const csvHeader = 'ID,标题,状态,创建时间,用户名,邮箱,商品数量,总报价\n';
      const csvData = inquiries.getRows().map(row => 
        `${row.id},"${row.title}",${row.status},${row.created_at},"${row.username || ''}","${row.email || ''}",${row.item_count},${row.total_quoted_price || 0}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="inquiries_${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csvHeader + csvData);
    }
    
    return res.json({
      success: true,
      message: getMessage('INQUIRY.FETCH.SUCCESS'),
      data: {
        inquiries: inquiries.getRows(),
        exportTime: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('导出询价数据失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('INQUIRY.FETCH.FAILED')
    });
  }
};

// 标记消息为已读（管理员）
exports.markMessagesAsRead = async (req, res) => {
  try {
    const adminId = req.userId;
    const { inquiryId } = req.params;
    
    // 验证询价是否存在
    const inquiryResult = await query(
      'SELECT id FROM inquiries WHERE id = $1 AND deleted = false',
      [inquiryId]
    );
    
    if (!inquiryResult || inquiryResult.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.NOT_FOUND')
      });
    }
    
    // 标记该询价单中所有用户发送的未读消息为已读
    await query(
      `UPDATE inquiry_messages 
       SET is_read = 1, updated_at = NOW() 
       WHERE inquiry_id = $1 
       AND sender_type = 'user' 
       AND is_read = 0 
       AND deleted = false`,
      [inquiryId]
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