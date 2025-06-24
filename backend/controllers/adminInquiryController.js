const { pool } = require('../db/db');
const { getMessage } = require('../config/messages');
const { uuidToBinary } = require('../utils/uuid');
const { v4: uuidv4 } = require('uuid');
const sseHandler = require('../utils/sseHandler');
// 获取所有询价列表（管理员）
exports.getAllInquiries = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, userId, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;
    const currentUserId = req.userId; // 从JWT中获取当前登录用户ID
    
    // 首先查询当前用户所属的业务组
    const businessGroupQuery = `
      SELECT DISTINCT ubg.business_group_id 
      FROM user_business_groups ubg 
      WHERE ubg.user_id = ? AND ubg.deleted = 0
    `;
    const [businessGroups] = await pool.query(businessGroupQuery, [currentUserId]);
    
    if (businessGroups.length === 0) {
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
    
    // 获取业务组ID列表
    const businessGroupIds = businessGroups.map(bg => bg.business_group_id);
    
    // 查询属于这些业务组的所有用户
    const usersInGroupQuery = `
      SELECT DISTINCT u.id 
      FROM users u 
      WHERE u.business_group_id IN (${businessGroupIds.map(() => '?').join(',')}) 
      AND u.deleted = 0
    `;
    const [usersInGroup] = await pool.query(usersInGroupQuery, businessGroupIds);
    
    if (usersInGroup.length === 0) {
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
    
    // 获取用户ID列表
    const userIds = usersInGroup.map(u => u.id);
    
    // 构建查询条件
    let whereClause = `WHERE i.deleted = 0 AND i.user_id IN (${userIds.map(() => '?').join(',')})`;
    let queryParams = [...userIds];
    
    if (status) {
      whereClause += ' AND i.status = ?';
      queryParams.push(status);
    }
    
    if (userId) {
      whereClause += ' AND i.user_id = ?';
      queryParams.push(userId);
    }
    
    if (startDate) {
      whereClause += ' AND i.created_at >= ?';
      queryParams.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND i.created_at <= ?';
      queryParams.push(endDate + ' 23:59:59');
    }
    
    // 查询询价列表
    const query = `
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
        COUNT(ii.id) as item_count,
        SUM(CASE WHEN ii.unit_price IS NOT NULL THEN ii.quantity * ii.unit_price ELSE 0 END) as total_quoted_price,
        COUNT(im.id) as message_count
      FROM inquiries i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN inquiry_items ii ON i.id = ii.inquiry_id AND ii.deleted = 0
      LEFT JOIN inquiry_messages im ON i.id = im.inquiry_id AND im.deleted = 0
      ${whereClause}
      GROUP BY i.id, i.user_inquiry_id, i.title, i.status, i.user_id, i.created_at, i.updated_at, u.username, u.email
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    queryParams.push(parseInt(limit), parseInt(offset));
    const [inquiries] = await pool.query(query, queryParams);
    
    // 处理返回数据格式
    const formattedInquiries = inquiries.map(inquiry => ({
      ...inquiry,
      total_quoted_price: parseFloat(inquiry.total_quoted_price) || 0,
      item_count: parseInt(inquiry.item_count) || 0,
      message_count: parseInt(inquiry.message_count) || 0
    }));
    
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
        i.created_at,
        i.updated_at,
        u.username,
        u.email,
        u.phone
      FROM inquiries i
      LEFT JOIN users u ON i.user_id = u.id
      WHERE i.id = ? AND i.deleted = 0
    `;
    
    const [inquiryResult] = await pool.query(inquiryQuery, [inquiryId]);
    
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
        ii.created_at,
        ii.updated_at,
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
        im.sender_id,
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
    const [itemResult] = await pool.query(
      'SELECT ii.id, ii.inquiry_id, i.status as inquiry_status FROM inquiry_items ii JOIN inquiries i ON ii.inquiry_id = i.id WHERE ii.id = ? AND ii.deleted = 0 AND i.deleted = 0',
      [itemId]
    );
    
    if (!itemResult || itemResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.NOT_FOUND')
      });
    }
    
    if (itemResult[0].inquiry_status === 'completed') {
      return res.status(400).json({
        success: false,
        message: getMessage('INQUIRY.BUSINESS.CANNOT_MODIFY_COMPLETED')
      });
    }
    
    // 更新商品报价
        await pool.query(
          'UPDATE inquiry_items SET unit_price = ?, updated_by = ?, updated_at = NOW() WHERE id = ?',
          [quotedPrice, adminId, itemId]
        );
    
    // 检查是否所有商品都已报价，如果是则更新询价状态
    const [unquotedItems] = await pool.query(
      'SELECT COUNT(*) as count FROM inquiry_items WHERE inquiry_id = ? AND unit_price IS NULL AND deleted = 0',
      [itemResult[0].inquiry_id]
    );
    
    if (unquotedItems[0].count === 0) {
      await pool.query(
        'UPDATE inquiries SET status = "quoted", updated_by = ?, updated_at = NOW() WHERE id = ?',
        [adminId, itemResult[0].inquiry_id]
      );
    }
    
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
      const [itemResult] = await pool.query(
        'SELECT ii.id, ii.inquiry_id, i.status as inquiry_status FROM inquiry_items ii JOIN inquiries i ON ii.inquiry_id = i.id WHERE ii.id = ? AND ii.deleted = 0 AND i.deleted = 0',
        [itemId]
      );
      
      if (!itemResult || itemResult.length === 0 || itemResult[0].inquiry_status === 'completed') {
        continue;
      }
      
      // 更新商品报价
      await pool.query(
        'UPDATE inquiry_items SET unit_price = ?, updated_by = ?, updated_at = NOW() WHERE id = ?',
        [quotedPrice, adminId, itemId]
      );
      
      inquiryIds.add(itemResult[0].inquiry_id);
      updatedCount++;
    }
    
    // 检查并更新询价状态
    for (const inquiryId of inquiryIds) {
      const [unquotedItems] = await pool.query(
        'SELECT COUNT(*) as count FROM inquiry_items WHERE inquiry_id = ? AND unit_price IS NULL AND deleted = 0',
        [inquiryId]
      );
      
      if (unquotedItems[0].count === 0) {
        await pool.query(
          'UPDATE inquiries SET status = "quoted", updated_by = ?, updated_at = NOW() WHERE id = ?',
          [adminId, inquiryId]
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
    const [inquiryResult] = await pool.query(
      'SELECT id, user_id FROM inquiries WHERE id = ? AND deleted = 0',
      [inquiryId]
    );
    
    if (!inquiryResult || inquiryResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.NOT_FOUND')
      });
    }
    
    const inquiry = inquiryResult[0];
    
    // 获取管理员信息
    const [adminResult] = await pool.query(
      'SELECT username, email FROM users WHERE id = ?',
      [adminId]
    );
    
    const admin = adminResult[0];
    
    // 添加消息
    const guid = uuidToBinary(uuidv4());
    const [result] = await pool.query(
      'INSERT INTO inquiry_messages (inquiry_id, guid, sender_id, sender_type, content, created_by, updated_by) VALUES (?, ?, ?, "admin", ?, ?, ?)',
      [inquiryId, guid, adminId, content.trim(), adminId, adminId]
    );
    
    // 构建消息数据
    const messageData = {
      id: result.insertId,
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
    const userIds = [inquiry.user_id.toString()];
    sseHandler.broadcastToInquiry(inquiryId, messageData, 'new_message', userIds);
    
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

// 更新询价状态（管理员）
exports.updateInquiryStatus = async (req, res) => {
  try {
    const adminId = req.userId;
    const { inquiryId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'quoted', 'approved', 'rejected', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.INVALID_ID')
      });
    }
    
    // 验证询价是否存在
    const [inquiryResult] = await pool.query(
      'SELECT id, status as current_status FROM inquiries WHERE id = ? AND deleted = 0',
      [inquiryId]
    );
    
    if (!inquiryResult || inquiryResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.NOT_FOUND')
      });
    }
    
    // 更新询价状态
    await pool.query(
      'UPDATE inquiries SET status = ?, updated_by = ?, updated_at = NOW() WHERE id = ?',
      [status, adminId, inquiryId]
    );
    
    // 如果状态更新为approved，同时更新所有商品状态
    if (status === 'approved') {
      await pool.query(
        'UPDATE inquiry_items SET updated_by = ?, updated_at = NOW() WHERE inquiry_id = ? AND unit_price IS NOT NULL AND deleted = 0',
        [adminId, inquiryId]
      );
    }
    
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
      dateFilter = 'WHERE created_at >= ? AND created_at <= ?';
      queryParams = [startDate, endDate + ' 23:59:59'];
    }
    
    // 获取基本统计
    const statsQuery = `
      SELECT 
        COUNT(*) as total_inquiries,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'quoted' THEN 1 END) as quoted_count,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
      FROM inquiries 
      ${dateFilter} AND deleted = 0
    `;
    
    const [statsResult] = await pool.query(statsQuery, queryParams);
    
    // 获取每日询价数量（最近30天）
    const dailyStatsQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM inquiries 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND deleted = 0
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    
    const [dailyStats] = await pool.query(dailyStatsQuery);
    
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
      WHERE ii.deleted = 0 AND i.deleted = 0
      GROUP BY p.id, p.name, p.product_code
      ORDER BY inquiry_count DESC
      LIMIT 10
    `;
    
    const [popularProducts] = await pool.query(popularProductsQuery);
    
    return res.json({
      success: true,
      message: getMessage('INQUIRY.FETCH.SUCCESS'),
      data: {
        stats: statsResult[0],
        dailyStats,
        popularProducts
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
    const [inquiryResult] = await pool.query(
      'SELECT id FROM inquiries WHERE id = ? AND deleted = 0',
      [inquiryId]
    );
    
    if (!inquiryResult || inquiryResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.VALIDATION.NOT_FOUND')
      });
    }
    
    // 软删除询价及相关数据
    await pool.query(
      'UPDATE inquiries SET deleted = 1, updated_by = ?, updated_at = NOW() WHERE id = ?',
      [adminId, inquiryId]
    );
    
    await pool.query(
      'UPDATE inquiry_items SET deleted = 1, updated_by = ?, updated_at = NOW() WHERE inquiry_id = ?',
      [adminId, inquiryId]
    );
    
    await pool.query(
      'UPDATE inquiry_messages SET deleted = 1, updated_by = ?, updated_at = NOW() WHERE inquiry_id = ?',
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
    let whereClause = 'WHERE i.deleted = 0';
    let queryParams = [];
    
    if (status) {
      whereClause += ' AND i.status = ?';
      queryParams.push(status);
    }
    
    if (startDate) {
      whereClause += ' AND i.created_at >= ?';
      queryParams.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND i.created_at <= ?';
      queryParams.push(endDate + ' 23:59:59');
    }
    
    // 查询询价数据
    const query = `
      SELECT 
        i.id,
        i.title,
        i.status,
        i.created_at,
        u.username,
        u.email,
        COUNT(ii.id) as item_count,
        SUM(CASE WHEN ii.unit_price IS NOT NULL THEN ii.quantity * ii.unit_price ELSE 0 END) as total_quoted_price
      FROM inquiries i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN inquiry_items ii ON i.id = ii.inquiry_id AND ii.deleted = 0
      ${whereClause}
      GROUP BY i.id, i.title, i.status, i.created_at, u.username, u.email
      ORDER BY i.created_at DESC
    `;
    
    const [inquiries] = await pool.query(query, queryParams);
    
    if (format === 'csv') {
      // 生成CSV格式
      const csvHeader = 'ID,标题,状态,创建时间,用户名,邮箱,商品数量,总报价\n';
      const csvData = inquiries.map(row => 
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
        inquiries,
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