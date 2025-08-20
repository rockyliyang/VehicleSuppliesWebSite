/**
 * 管理员统计数据控制器
 * 提供管理员控制面板所需的各种统计数据
 */

const { query } = require('../db/db');
const { getMessage } = require('../config/messages');
const { getManagedUserIds, generateUserIdsPlaceholders } = require('../utils/adminUserUtils');

/**
 * 获取管理员控制面板统计数据
 * GET /api/admin/stats/dashboard
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const currentUserId = req.userId; // 从JWT中获取当前登录用户ID
    
    // 获取当前管理员管理的用户ID列表
    const managedUserIds = await getManagedUserIds(currentUserId);
    const { placeholders, params } = generateUserIdsPlaceholders(managedUserIds);
    
    // 为每个子查询生成独立的占位符
    const placeholders2 = managedUserIds.map((_, index) => `$${params.length + index + 1}`).join(',');
    const placeholders3 = managedUserIds.map((_, index) => `$${params.length * 2 + index + 1}`).join(',');
    
    // 获取统计数据（只统计管理的用户相关数据）
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM products WHERE deleted = false AND status = 'on_shelf') as product_count,
        (SELECT COUNT(*) FROM users WHERE deleted = false AND id IN (${placeholders})) as user_count,
        (SELECT COUNT(*) FROM inquiries WHERE deleted = false AND user_id IN (${placeholders2})) as order_count,
        (SELECT COUNT(*) FROM inquiry_messages im 
         INNER JOIN inquiries i ON im.inquiry_id = i.id and i.deleted=false
         WHERE im.deleted = false AND im.is_read = 0 AND im.sender_type='user' AND i.user_id IN (${placeholders3})) as message_count
    `, [...params, ...params, ...params]);

    // 获取用户统计（只统计管理的用户）
    const userStats = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN user_role = 'user' THEN 1 END) as regular_users,
        COUNT(CASE WHEN user_role = 'business' THEN 1 END) as business_users,
        COUNT(CASE WHEN user_role = 'admin' THEN 1 END) as admin_users
      FROM users 
      WHERE deleted = false AND id IN (${placeholders})
    `, params);

    // 获取询价统计（只统计管理的用户）
    const inquiryStats = await query(`
      SELECT 
        COUNT(*) as total_inquiries,
        COUNT(CASE WHEN status = 'inquiried' THEN 1 END) as pending_inquiries,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_inquiries,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_inquiries
      FROM inquiries 
      WHERE deleted = false AND user_id IN (${placeholders})
    `, params);

    // 获取消息统计（只统计管理的用户）
    const messageStats = await query(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN sender_type = 'user' AND is_read = 0 THEN 1 END) as user_unread_messages,
        COUNT(CASE WHEN sender_type = 'admin' THEN 1 END) as admin_messages,
        COUNT(CASE WHEN sender_type = 'user' THEN 1 END) as user_messages
      FROM inquiry_messages im inner join inquiries i on im.inquiry_id = i.id and i.deleted=false
      WHERE im.deleted = false AND i.user_id IN (${placeholders})
       `, params);
    const messageUserUnReadStats = await query(`
      SELECT COUNT(CASE WHEN sender_type = 'admin' AND is_read = 0 THEN 1 END) as admin_unread_messages
      FROM inquiry_messages im inner join inquiries i on im.inquiry_id = i.id and i.deleted=false
      WHERE im.deleted = false AND im.sender_id = $1   
    `, [currentUserId]);
    let messageStatsResponse = messageStats.rows[0];
    messageStatsResponse.admin_unread_messages = messageUserUnReadStats.rows[0].admin_unread_messages;
    // 获取最近7天的询价趋势（只统计管理的用户）
    const inquiryTrend = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM inquiries 
      WHERE created_at >= NOW() - INTERVAL '7 days' 
        AND deleted = false
        AND user_id IN (${placeholders})
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, params);

    // 获取最近7天的用户注册趋势（只统计管理的用户）
    const userTrend = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '7 days' 
        AND deleted = false
        AND id IN (${placeholders})
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, params);

    return res.json({
      success: true,
      message: getMessage('ADMIN.STATS.FETCH.SUCCESS'),
      data: {
        products: stats.rows[0].product_count,
        users: stats.rows[0].user_count,
        orders: stats.rows[0].order_count,
        messages: stats.rows[0].message_count,
        userStats: userStats.rows[0],
        inquiryStats: inquiryStats.rows[0],
        messageStats: messageStatsResponse,
        trends: {
          inquiries: inquiryTrend.rows,
          users: userTrend.rows
        }
      }
    });
  } catch (error) {
    console.error('获取管理员统计数据失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('ADMIN.STATS.FETCH.FAILED')
    });
  }
};

/**
 * 获取最新产品列表
 * GET /api/admin/stats/recent-products
 */
exports.getRecentProducts = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const recentProducts = await query(`
      SELECT 
        p.id,
        p.name,
        p.product_code,
        p.price,
        p.status,
        p.created_at,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND deleted = false ORDER BY sort_order ASC LIMIT 1) as image
      FROM products p
      WHERE p.deleted = false
      ORDER BY p.created_at DESC
      LIMIT $1
    `, [parseInt(limit)]);

    return res.json({
      success: true,
      message: getMessage('PRODUCT.LIST_SUCCESS'),
      data: recentProducts.rows
    });
  } catch (error) {
    console.error('获取最新产品失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('PRODUCT.LIST_FAILED')
    });
  }
};

/**
 * 获取最新询价列表
 * GET /api/admin/stats/recent-inquiries
 */
exports.getRecentInquiries = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const currentUserId = req.userId; // 从JWT中获取当前登录用户ID
    
    // 获取当前管理员管理的用户ID列表
    const managedUserIds = await getManagedUserIds(currentUserId);
    const { placeholders, params } = generateUserIdsPlaceholders(managedUserIds);
    
    const recentInquiries = await query(`
      SELECT 
        i.id,
        i.user_inquiry_id,
        i.title,
        i.status,
        i.inquiry_type,
        i.created_at,
        u.username as user_name,
        u.email as user_email,
        COALESCE(item_stats.item_count, 0) as item_count,
        COALESCE(item_stats.total_quoted_price, 0) as total_amount,
        COALESCE(message_stats.unread_count, 0) as unread_messages,
        COALESCE(message_stats.total_messages, 0) as total_messages,
        CASE 
          WHEN item_stats.item_count = 1 THEN item_stats.product_names
          WHEN item_stats.item_count > 1 THEN item_stats.product_names || ' 等' || item_stats.item_count || '件商品'
          ELSE '暂无商品'
        END as products_summary
      FROM inquiries i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN (
        SELECT 
          ii.inquiry_id,
          COUNT(ii.id) as item_count,
          SUM(CASE WHEN ii.unit_price IS NOT NULL THEN ii.quantity * ii.unit_price ELSE 0 END) as total_quoted_price,
          STRING_AGG(p.name, ', ' ORDER BY ii.created_at ASC) as product_names
        FROM inquiry_items ii
        LEFT JOIN products p ON ii.product_id = p.id
        WHERE ii.deleted = false 
        GROUP BY ii.inquiry_id
      ) item_stats ON i.id = item_stats.inquiry_id
      LEFT JOIN (
        SELECT 
          im.inquiry_id,
          COUNT(CASE WHEN im.is_read = 0 AND im.sender_type = 'user' THEN 1 END) as unread_count,
          COUNT(im.id) as total_messages
        FROM inquiry_messages im
        WHERE im.deleted = false
        GROUP BY im.inquiry_id
      ) message_stats ON i.id = message_stats.inquiry_id
      WHERE i.deleted = false AND i.user_id IN (${placeholders})
      ORDER BY i.created_at DESC
      LIMIT $${params.length + 1}
    `, [...params, parseInt(limit)]);

    return res.json({
      success: true,
      message: getMessage('INQUIRY.FETCH.SUCCESS'),
      data: recentInquiries.rows
    });
  } catch (error) {
    console.error('获取最新询价失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('INQUIRY.FETCH.FAILED')
    });
  }
};