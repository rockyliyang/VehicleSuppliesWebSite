/**
 * 管理员统计数据控制器
 * 提供管理员控制面板所需的各种统计数据
 */

const { query } = require('../db/db');
const { getMessage } = require('../config/messages');

/**
 * 获取管理员控制面板统计数据
 * GET /api/admin/stats/dashboard
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // 获取统计数据
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM products WHERE deleted = false AND status = 'on_shelf') as product_count,
        (SELECT COUNT(*) FROM users WHERE deleted = false) as user_count,
        (SELECT COUNT(*) FROM inquiries WHERE deleted = false) as order_count,
        (SELECT COUNT(*) FROM inquiry_messages WHERE deleted = false AND is_read = 0) as message_count
    `);

    // 获取用户统计
    const userStats = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN user_role = 'user' THEN 1 END) as regular_users,
        COUNT(CASE WHEN user_role = 'business' THEN 1 END) as business_users,
        COUNT(CASE WHEN user_role = 'admin' THEN 1 END) as admin_users
      FROM users 
      WHERE deleted = false
    `);

    // 获取询价统计
    const inquiryStats = await query(`
      SELECT 
        COUNT(*) as total_inquiries,
        COUNT(CASE WHEN status = 'inquiried' THEN 1 END) as pending_inquiries,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_inquiries,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_inquiries
      FROM inquiries 
      WHERE deleted = false
    `);

    // 获取消息统计
    const messageStats = await query(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN sender_type = 'user' AND is_read = 0 THEN 1 END) as unread_messages,
        COUNT(CASE WHEN sender_type = 'admin' THEN 1 END) as admin_messages,
        COUNT(CASE WHEN sender_type = 'user' THEN 1 END) as user_messages
      FROM inquiry_messages 
      WHERE deleted = false
    `);

    // 获取最近7天的询价趋势
    const inquiryTrend = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM inquiries 
      WHERE created_at >= NOW() - INTERVAL '7 days' 
        AND deleted = false
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // 获取最近7天的用户注册趋势
    const userTrend = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '7 days' 
        AND deleted = false
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

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
        messageStats: messageStats.rows[0],
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
      WHERE i.deleted = false
      ORDER BY i.created_at DESC
      LIMIT $1
    `, [parseInt(limit)]);

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