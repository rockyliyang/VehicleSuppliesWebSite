const { v4: uuidv4 } = require('uuid');
const { query, getConnection } = require('../db/db');
const { getMessage } = require('../config/messages');

// 创建访问记录
exports.createVisitorLog = async (req, res) => {
  try {
    const {
      user_id,
      session_id,
      visitor_ip,
      page_url,
      page_title,
      referrer_url,
      user_agent,
      device_type,
      browser_name,
      browser_version,
      operating_system,
      screen_resolution,
      country,
      region,
      city,
      timezone,
      visit_duration = 0,
      is_bounce = false,
      is_new_visitor = true
    } = req.body;

    // 获取真实IP地址
    const realVisitorIP = visitor_ip === 'auto-detect' ? 
      (req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown') : 
      visitor_ip;

    // 验证必填字段
    if (!session_id || !realVisitorIP || !page_url) {
      return res.status(400).json({
        success: false,
        message: getMessage('MISSING_REQUIRED_FIELDS', req.language)
      });
    }

    const guid = uuidv4();
    const created_by = req.user ? req.user.id : null;

    const insertQuery = `
      INSERT INTO visitor_logs (
        guid, user_id, session_id, visitor_ip, page_url, page_title, referrer_url,
        user_agent, device_type, browser_name, browser_version, operating_system,
        screen_resolution, country, region, city, timezone, visit_duration,
        is_bounce, is_new_visitor, created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $21
      ) RETURNING *`;

    const values = [
      guid, user_id, session_id, realVisitorIP, page_url, page_title, referrer_url,
      user_agent, device_type, browser_name, browser_version, operating_system,
      screen_resolution, country, region, city, timezone, visit_duration,
      is_bounce, is_new_visitor, created_by
    ];

    const result = await query(insertQuery, values);

    res.status(201).json({
      success: true,
      message: getMessage('VISITOR_LOG_CREATED', req.language),
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating visitor log:', error);
    res.status(500).json({
      success: false,
      message: getMessage('INTERNAL_SERVER_ERROR', req.language)
    });
  }
};

// 获取所有访问记录（分页）
exports.getAllVisitorLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'DESC',
      user_id,
      session_id,
      country,
      device_type,
      browser_name,
      start_date,
      end_date,
      search
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let whereConditions = ['vl.deleted = FALSE'];
    let params = [];
    let paramIndex = 1;

    // 构建查询条件
    if (user_id) {
      whereConditions.push(`vl.user_id = $${paramIndex}`);
      params.push(user_id);
      paramIndex++;
    }

    if (session_id) {
      whereConditions.push(`vl.session_id = $${paramIndex}`);
      params.push(session_id);
      paramIndex++;
    }

    if (country) {
      whereConditions.push(`vl.country = $${paramIndex}`);
      params.push(country);
      paramIndex++;
    }

    if (device_type) {
      whereConditions.push(`vl.device_type = $${paramIndex}`);
      params.push(device_type);
      paramIndex++;
    }

    if (browser_name) {
      whereConditions.push(`vl.browser_name = $${paramIndex}`);
      params.push(browser_name);
      paramIndex++;
    }

    if (start_date) {
      whereConditions.push(`vl.created_at >= $${paramIndex}`);
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      whereConditions.push(`vl.created_at <= $${paramIndex}`);
      params.push(end_date);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(
        vl.page_url ILIKE $${paramIndex} OR 
        vl.page_title ILIKE $${paramIndex} OR 
        vl.visitor_ip ILIKE $${paramIndex} OR
        vl.referrer_url ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 验证排序字段
    const allowedSortFields = ['created_at', 'page_url', 'visitor_ip', 'country', 'device_type', 'browser_name', 'visit_duration'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM visitor_logs vl
      LEFT JOIN users u ON vl.user_id = u.id
      ${whereClause}`;
    
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // 获取数据
    const selectQuery = `
      SELECT 
        vl.*,
        u.username,
        u.email
      FROM visitor_logs vl
      LEFT JOIN users u ON vl.user_id = u.id
      ${whereClause}
      ORDER BY vl.${sortField} ${sortDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    
    params.push(parseInt(limit), offset);
    const result = await query(selectQuery, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: total,
        total_pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching visitor logs:', error);
    res.status(500).json({
      success: false,
      message: getMessage('INTERNAL_SERVER_ERROR', req.language)
    });
  }
};

// 根据ID获取访问记录
exports.getVisitorLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const selectQuery = `
      SELECT 
        vl.*,
        u.username,
        u.email
      FROM visitor_logs vl
      LEFT JOIN users u ON vl.user_id = u.id
      WHERE vl.id = $1 AND vl.deleted = FALSE`;

    const result = await query(selectQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('VISITOR_LOG_NOT_FOUND', req.language)
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching visitor log:', error);
    res.status(500).json({
      success: false,
      message: getMessage('INTERNAL_SERVER_ERROR', req.language)
    });
  }
};

// 更新访问记录
exports.updateVisitorLog = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      visit_duration,
      is_bounce,
      page_title,
      country,
      region,
      city,
      timezone
    } = req.body;

    const updated_by = req.user ? req.user.id : null;

    // 检查记录是否存在
    const checkQuery = 'SELECT id FROM visitor_logs WHERE id = $1 AND deleted = FALSE';
    const checkResult = await query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('VISITOR_LOG_NOT_FOUND', req.language)
      });
    }

    // 构建更新字段
    let updateFields = [];
    let params = [];
    let paramIndex = 1;

    if (visit_duration !== undefined) {
      updateFields.push(`visit_duration = $${paramIndex}`);
      params.push(visit_duration);
      paramIndex++;
    }

    if (is_bounce !== undefined) {
      updateFields.push(`is_bounce = $${paramIndex}`);
      params.push(is_bounce);
      paramIndex++;
    }

    if (page_title !== undefined) {
      updateFields.push(`page_title = $${paramIndex}`);
      params.push(page_title);
      paramIndex++;
    }

    if (country !== undefined) {
      updateFields.push(`country = $${paramIndex}`);
      params.push(country);
      paramIndex++;
    }

    if (region !== undefined) {
      updateFields.push(`region = $${paramIndex}`);
      params.push(region);
      paramIndex++;
    }

    if (city !== undefined) {
      updateFields.push(`city = $${paramIndex}`);
      params.push(city);
      paramIndex++;
    }

    if (timezone !== undefined) {
      updateFields.push(`timezone = $${paramIndex}`);
      params.push(timezone);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('NO_FIELDS_TO_UPDATE', req.language)
      });
    }

    updateFields.push(`updated_by = $${paramIndex}`);
    params.push(updated_by);
    paramIndex++;

    params.push(id);

    const updateQuery = `
      UPDATE visitor_logs 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND deleted = FALSE
      RETURNING *`;

    const result = await query(updateQuery, params);

    res.json({
      success: true,
      message: getMessage('VISITOR_LOG_UPDATED', req.language),
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating visitor log:', error);
    res.status(500).json({
      success: false,
      message: getMessage('INTERNAL_SERVER_ERROR', req.language)
    });
  }
};

// 删除访问记录（软删除）
exports.deleteVisitorLog = async (req, res) => {
  try {
    const { id } = req.params;
    const updated_by = req.user ? req.user.id : null;

    // 检查记录是否存在
    const checkQuery = 'SELECT id FROM visitor_logs WHERE id = $1 AND deleted = FALSE';
    const checkResult = await query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('VISITOR_LOG_NOT_FOUND', req.language)
      });
    }

    const deleteQuery = `
      UPDATE visitor_logs 
      SET deleted = TRUE, updated_by = $1
      WHERE id = $2 AND deleted = FALSE
      RETURNING id`;

    const result = await query(deleteQuery, [updated_by, id]);

    res.json({
      success: true,
      message: getMessage('VISITOR_LOG_DELETED', req.language),
      data: { id: result.rows[0].id }
    });
  } catch (error) {
    console.error('Error deleting visitor log:', error);
    res.status(500).json({
      success: false,
      message: getMessage('INTERNAL_SERVER_ERROR', req.language)
    });
  }
};

// 获取访问统计数据
exports.getVisitorStats = async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      group_by = 'day' // day, week, month
    } = req.query;

    let whereConditions = ['vl.deleted = FALSE'];
    let params = [];
    let paramIndex = 1;

    if (start_date) {
      whereConditions.push(`vl.created_at >= $${paramIndex}`);
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      whereConditions.push(`vl.created_at <= $${paramIndex}`);
      params.push(end_date);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 根据group_by参数确定时间分组格式
    let dateFormat;
    switch (group_by) {
      case 'week':
        dateFormat = "DATE_TRUNC('week', vl.created_at)";
        break;
      case 'month':
        dateFormat = "DATE_TRUNC('month', vl.created_at)";
        break;
      default:
        dateFormat = "DATE_TRUNC('day', vl.created_at)";
    }

    // 获取访问统计
    const statsQuery = `
      SELECT 
        ${dateFormat} as date_group,
        COUNT(*) as total_visits,
        COUNT(DISTINCT vl.session_id) as unique_sessions,
        COUNT(DISTINCT vl.visitor_ip) as unique_visitors,
        COUNT(DISTINCT vl.user_id) FILTER (WHERE vl.user_id IS NOT NULL) as logged_in_users,
        AVG(vl.visit_duration) as avg_duration,
        COUNT(*) FILTER (WHERE vl.is_bounce = true) as bounce_visits,
        COUNT(DISTINCT vl.page_url) as unique_pages
      FROM visitor_logs vl
      ${whereClause}
      GROUP BY ${dateFormat}
      ORDER BY date_group DESC`;

    const statsResult = await query(statsQuery, params);

    // 获取热门页面
    const popularPagesQuery = `
      SELECT 
        vl.page_url,
        vl.page_title,
        COUNT(*) as visit_count,
        COUNT(DISTINCT vl.session_id) as unique_sessions,
        AVG(vl.visit_duration) as avg_duration
      FROM visitor_logs vl
      ${whereClause}
      GROUP BY vl.page_url, vl.page_title
      ORDER BY visit_count DESC
      LIMIT 10`;

    const popularPagesResult = await query(popularPagesQuery, params);

    // 获取设备统计
    const deviceStatsQuery = `
      SELECT 
        vl.device_type,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
      FROM visitor_logs vl
      ${whereClause}
      GROUP BY vl.device_type
      ORDER BY count DESC`;

    const deviceStatsResult = await query(deviceStatsQuery, params);

    // 获取浏览器统计
    const browserStatsQuery = `
      SELECT 
        vl.browser_name,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
      FROM visitor_logs vl
      ${whereClause}
      GROUP BY vl.browser_name
      ORDER BY count DESC
      LIMIT 10`;

    const browserStatsResult = await query(browserStatsQuery, params);

    // 获取国家统计
    const countryStatsQuery = `
      SELECT 
        vl.country,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
      FROM visitor_logs vl
      ${whereClause}
      GROUP BY vl.country
      ORDER BY count DESC
      LIMIT 10`;

    const countryStatsResult = await query(countryStatsQuery, params);

    res.json({
      success: true,
      data: {
        timeline: statsResult.rows,
        popular_pages: popularPagesResult.rows,
        device_stats: deviceStatsResult.rows,
        browser_stats: browserStatsResult.rows,
        country_stats: countryStatsResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching visitor stats:', error);
    res.status(500).json({
      success: false,
      message: getMessage('INTERNAL_SERVER_ERROR', req.language)
    });
  }
};

// 批量删除访问记录
exports.batchDeleteVisitorLogs = async (req, res) => {
  try {
    const { ids } = req.body;
    const updated_by = req.user ? req.user.id : null;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('INVALID_IDS_ARRAY', req.language)
      });
    }

    const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
    const deleteQuery = `
      UPDATE visitor_logs 
      SET deleted = TRUE, updated_by = $${ids.length + 1}
      WHERE id IN (${placeholders}) AND deleted = FALSE
      RETURNING id`;

    const params = [...ids, updated_by];
    const result = await query(deleteQuery, params);

    res.json({
      success: true,
      message: getMessage('VISITOR_LOGS_DELETED', req.language),
      data: {
        deleted_count: result.rows.length,
        deleted_ids: result.rows.map(row => row.id)
      }
    });
  } catch (error) {
    console.error('Error batch deleting visitor logs:', error);
    res.status(500).json({
      success: false,
      message: getMessage('INTERNAL_SERVER_ERROR', req.language)
    });
  }
};

// 更新访问记录的停留时间
exports.updateVisitorDuration = async (req, res) => {
  try {
    const { session_id, page_url, duration, is_bounce, is_leaving } = req.body;
    
    if (!session_id || !page_url) {
      return res.status(400).json({
        success: false,
        message: getMessage('MISSING_REQUIRED_FIELDS', req.language)
      });
    }
    
    // 查找最近的访问记录
    const updateQuery = `
      UPDATE visitor_logs 
      SET 
        visit_duration = $1,
        is_bounce = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE session_id = $3 
        AND page_url = $4 
        AND created_at >= NOW() - INTERVAL '1 hour'
        AND deleted = FALSE
      RETURNING *
    `;
    
    const result = await query(updateQuery, [duration, is_bounce, session_id, page_url]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('VISITOR_LOG_NOT_FOUND', req.language)
      });
    }
    
    res.json({
      success: true,
      message: getMessage('VISITOR_LOG_UPDATED', req.language),
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating visitor duration:', error);
    res.status(500).json({
      success: false,
      message: getMessage('INTERNAL_SERVER_ERROR', req.language)
    });
  }
};

// 更新访问记录的用户信息
exports.updateVisitorInfo = async (req, res) => {
  try {
    const { session_id, user_id, ...otherUpdates } = req.body;
    
    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: getMessage('MISSING_REQUIRED_FIELDS', req.language)
      });
    }
    
    // 构建更新字段
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    
    if (user_id !== undefined) {
      updateFields.push(`user_id = $${paramIndex++}`);
      updateValues.push(user_id);
    }
    
    // 处理其他更新字段
    Object.keys(otherUpdates).forEach(key => {
      const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      updateFields.push(`${dbField} = $${paramIndex++}`);
      updateValues.push(otherUpdates[key]);
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('NO_FIELDS_TO_UPDATE', req.language)
      });
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(session_id);
    
    const updateQuery = `
      UPDATE visitor_logs 
      SET ${updateFields.join(', ')}
      WHERE session_id = $${paramIndex}
        AND created_at >= NOW() - INTERVAL '1 hour'
        AND deleted = FALSE
      RETURNING *
    `;
    
    const result = await query(updateQuery, updateValues);
    
    res.json({
      success: true,
      message: getMessage('VISITOR_LOG_UPDATED', req.language),
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error updating visitor info:', error);
    res.status(500).json({
      success: false,
      message: getMessage('INTERNAL_SERVER_ERROR', req.language)
    });
  }
};