const { query, getConnection } = require('../db/db');
const { getMessage } = require('../config/messages');

// 创建新的 Banner
exports.createBanner = async (req, res) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const { 
      image_url, 
      title, 
      description = '', 
      link = '', 
      sort_order = 0, 
      is_active = true 
    } = req.body;

    // 验证必填字段
    if (!image_url || !title) {
      return res.status(400).json({
        success: false,
        message: getMessage('BANNER.REQUIRED_FIELDS')
      });
    }

    const currentUserId = req.userId; // 从JWT中获取当前用户ID
    const result = await connection.query(
      'INSERT INTO banners (image_url, title, description, link, sort_order, is_active, deleted, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8) RETURNING id, guid',
      [image_url, title, description, link, sort_order, is_active, currentUserId, currentUserId]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: getMessage('BANNER.CREATE_SUCCESS'),
      data: {
        id: result.getFirstRow().id,
        guid: result.getFirstRow().guid,
        image_url,
        title,
        description,
        link,
        sort_order,
        is_active
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('创建Banner失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('COMMON.SERVER_ERROR')
    });
  } finally {
    connection.release();
  }
};

// 获取所有 Banner
exports.getAllBanners = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, guid, image_url, title, description, link, sort_order, is_active, created_at, updated_at FROM banners WHERE deleted = false ORDER BY sort_order ASC, created_at DESC'
    );

    res.json({
      success: true,
      message: getMessage('BANNER.LIST_SUCCESS'),
      data: result.getRows()
    });
  } catch (error) {
    console.error('获取Banner列表失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('COMMON.SERVER_ERROR')
    });
  }
};

// 根据ID获取单个 Banner
exports.getBannerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT id, guid, image_url, title, description, link, sort_order, is_active, created_at, updated_at FROM banners WHERE id = $1 AND deleted = false',
      [id]
    );

    if (result.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('BANNER.NOT_FOUND')
      });
    }

    res.json({
      success: true,
      message: getMessage('BANNER.GET_SUCCESS'),
      data: result.getFirstRow()
    });
  } catch (error) {
    console.error('获取Banner失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('COMMON.SERVER_ERROR')
    });
  }
};

// 更新 Banner
exports.updateBanner = async (req, res) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { 
      image_url, 
      title, 
      description, 
      link, 
      sort_order, 
      is_active 
    } = req.body;

    // 检查Banner是否存在
    const existing = await connection.query(
      'SELECT id FROM banners WHERE id = $1 AND deleted = false',
      [id]
    );

    if (existing.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('BANNER.NOT_FOUND')
      });
    }

    // 构建更新字段
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (image_url !== undefined) {
      updateFields.push(`image_url = $${paramIndex++}`);
      updateValues.push(image_url);
    }
    if (title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      updateValues.push(title);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(description);
    }
    if (link !== undefined) {
      updateFields.push(`link = $${paramIndex++}`);
      updateValues.push(link);
    }
    if (sort_order !== undefined) {
      updateFields.push(`sort_order = $${paramIndex++}`);
      updateValues.push(sort_order);
    }
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      updateValues.push(is_active);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('BANNER.NO_FIELDS_TO_UPDATE')
      });
    }

    const currentUserId = req.userId;
    updateFields.push(`updated_by = $${paramIndex++}`);
    updateValues.push(currentUserId);
    updateValues.push(id); // 最后添加 WHERE 条件的 id

    const updateQuery = `UPDATE banners SET ${updateFields.join(', ')} WHERE id = $${paramIndex} AND deleted = false`;
    
    await connection.query(updateQuery, updateValues);
    await connection.commit();

    res.json({
      success: true,
      message: getMessage('BANNER.UPDATE_SUCCESS'),
      data: {
        id: parseInt(id),
        ...req.body
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('更新Banner失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('COMMON.SERVER_ERROR')
    });
  } finally {
    connection.release();
  }
};

// 删除 Banner (软删除)
exports.deleteBanner = async (req, res) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // 检查Banner是否存在
    const existing = await connection.query(
      'SELECT id FROM banners WHERE id = $1 AND deleted = false',
      [id]
    );

    if (existing.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('BANNER.NOT_FOUND')
      });
    }

    const currentUserId = req.userId;
    await connection.query(
      'UPDATE banners SET deleted = true, updated_by = $1 WHERE id = $2',
      [currentUserId, id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: getMessage('BANNER.DELETE_SUCCESS')
    });
  } catch (error) {
    await connection.rollback();
    console.error('删除Banner失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('COMMON.SERVER_ERROR')
    });
  } finally {
    connection.release();
  }
};

// 获取活跃的 Banner (用于前端展示)
exports.getActiveBanners = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, guid, image_url, title, description, link, sort_order FROM banners WHERE deleted = false AND is_active = 1 ORDER BY sort_order ASC, created_at DESC'
    );

    res.json({
      success: true,
      message: getMessage('BANNER.LIST_SUCCESS'),
      data: result.getRows()
    });
  } catch (error) {
    console.error('获取活跃Banner列表失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('COMMON.SERVER_ERROR')
    });
  }
};