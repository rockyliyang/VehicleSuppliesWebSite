const { query, getConnection } = require('../db/db');
const { getMessage } = require('../config/messages');

// 创建新的标签
exports.createTag = async (req, res) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const { 
      value, 
      type = 'country', 
      description = '', 
      status = 'active' 
    } = req.body;

    // 验证必填字段
    if (!value || !type) {
      return res.status(400).json({
        success: false,
        message: getMessage('TAG.REQUIRED_FIELDS')
      });
    }

    // 验证type值
    if (type !== 'country') {
      return res.status(400).json({
        success: false,
        message: getMessage('TAG.INVALID_TYPE')
      });
    }

    // 验证status值
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: getMessage('TAG.INVALID_STATUS')
      });
    }

    // 检查value + type组合是否已存在
    const existingTag = await connection.query(
      'SELECT id FROM tags WHERE value = $1 AND type = $2 AND deleted = false',
      [value, type]
    );

    if (existingTag.getRowCount() > 0) {
      return res.status(409).json({
        success: false,
        message: getMessage('TAG.VALUE_TYPE_EXISTS')
      });
    }

    const currentUserId = req.userId; // 从JWT中获取当前用户ID
    const result = await connection.query(
      'INSERT INTO tags (value, type, description, status, deleted, created_by, updated_by) VALUES ($1, $2, $3, $4, false, $5, $6) RETURNING id, guid',
      [value, type, description, status, currentUserId, currentUserId]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: getMessage('TAG.CREATE_SUCCESS'),
      data: {
        id: result.getFirstRow().id,
        guid: result.getFirstRow().guid,
        value,
        type,
        description,
        status
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('创建标签失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('COMMON.SERVER_ERROR')
    });
  } finally {
    connection.release();
  }
};

// 获取所有标签
exports.getAllTags = async (req, res) => {
  try {
    const { type, status, page = 1, pageSize = 20 } = req.query;
    
    let whereConditions = ['deleted = false'];
    let queryParams = [];
    let paramIndex = 1;

    // 添加类型过滤
    if (type) {
      whereConditions.push(`type = $${paramIndex}`);
      queryParams.push(type);
      paramIndex++;
    }

    // 添加状态过滤
    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');
    
    // 计算总数
    const countResult = await query(
      `SELECT COUNT(*) as total FROM tags WHERE ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.getFirstRow().total);
    
    // 计算分页
    const offset = (page - 1) * pageSize;
    const totalPages = Math.ceil(total / pageSize);
    
    // 获取分页数据
    const result = await query(
      `SELECT id, guid, value, type, description, status, created_at, updated_at 
       FROM tags 
       WHERE ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, pageSize, offset]
    );

    res.json({
      success: true,
      message: getMessage('TAG.LIST_SUCCESS'),
      data: {
        items: result.getRows(),
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('获取标签列表失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('COMMON.SERVER_ERROR')
    });
  }
};

// 根据ID获取单个标签
exports.getTagById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT id, guid, value, type, description, status, created_at, updated_at FROM tags WHERE id = $1 AND deleted = false',
      [id]
    );

    if (result.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('TAG.NOT_FOUND')
      });
    }

    res.json({
      success: true,
      message: getMessage('TAG.GET_SUCCESS'),
      data: result.getFirstRow()
    });
  } catch (error) {
    console.error('获取标签失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('COMMON.SERVER_ERROR')
    });
  }
};

// 更新标签
exports.updateTag = async (req, res) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { value, type, description, status } = req.body;

    // 检查标签是否存在
    const existingTag = await connection.query(
      'SELECT id, value, type FROM tags WHERE id = $1 AND deleted = false',
      [id]
    );

    if (existingTag.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('TAG.NOT_FOUND')
      });
    }

    const currentTag = existingTag.getFirstRow();
    
    // 构建更新字段
    let updateFields = [];
    let updateValues = [];
    let paramIndex = 1;

    if (value !== undefined) {
      // 如果更新value或type，需要检查新的组合是否已存在
      const newType = type !== undefined ? type : currentTag.type;
      if (value !== currentTag.value || newType !== currentTag.type) {
        const duplicateCheck = await connection.query(
          'SELECT id FROM tags WHERE value = $1 AND type = $2 AND deleted = false AND id != $3',
          [value, newType, id]
        );
        
        if (duplicateCheck.getRowCount() > 0) {
          return res.status(409).json({
            success: false,
            message: getMessage('TAG.VALUE_TYPE_EXISTS')
          });
        }
      }
      
      updateFields.push(`value = $${paramIndex}`);
      updateValues.push(value);
      paramIndex++;
    }

    if (type !== undefined) {
      if (type !== 'country') {
        return res.status(400).json({
          success: false,
          message: getMessage('TAG.INVALID_TYPE')
        });
      }
      updateFields.push(`type = $${paramIndex}`);
      updateValues.push(type);
      paramIndex++;
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      updateValues.push(description);
      paramIndex++;
    }

    if (status !== undefined) {
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: getMessage('TAG.INVALID_STATUS')
        });
      }
      updateFields.push(`status = $${paramIndex}`);
      updateValues.push(status);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('TAG.NO_FIELDS_TO_UPDATE')
      });
    }

    // 添加updated_by和updated_at
    const currentUserId = req.userId;
    updateFields.push(`updated_by = $${paramIndex}`);
    updateValues.push(currentUserId);
    paramIndex++;
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id); // 最后一个参数是WHERE条件的id

    const updateQuery = `
      UPDATE tags 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex} AND deleted = false 
      RETURNING id, guid, value, type, description, status, updated_at
    `;

    const result = await connection.query(updateQuery, updateValues);

    await connection.commit();

    res.json({
      success: true,
      message: getMessage('TAG.UPDATE_SUCCESS'),
      data: result.getFirstRow()
    });
  } catch (error) {
    await connection.rollback();
    console.error('更新标签失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('COMMON.SERVER_ERROR')
    });
  } finally {
    connection.release();
  }
};

// 删除标签（软删除）
exports.deleteTag = async (req, res) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // 检查标签是否存在
    const existingTag = await connection.query(
      'SELECT id FROM tags WHERE id = $1 AND deleted = false',
      [id]
    );

    if (existingTag.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('TAG.NOT_FOUND')
      });
    }

    // 检查是否有关联的country_tags记录
    const relatedRecords = await connection.query(
      'SELECT COUNT(*) as count FROM country_tags WHERE tag_id = $1 AND deleted = false',
      [id]
    );

    if (parseInt(relatedRecords.getFirstRow().count) > 0) {
      return res.status(409).json({
        success: false,
        message: getMessage('TAG.HAS_RELATED_RECORDS')
      });
    }

    const currentUserId = req.userId;
    await connection.query(
      'UPDATE tags SET deleted = true, updated_by = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [currentUserId, id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: getMessage('TAG.DELETE_SUCCESS')
    });
  } catch (error) {
    await connection.rollback();
    console.error('删除标签失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('COMMON.SERVER_ERROR')
    });
  } finally {
    connection.release();
  }
};

// 获取指定类型的活跃标签（用于前端选择）
exports.getActiveTagsByType = async (req, res) => {
  try {
    const { type = 'country' } = req.params;
    
    const result = await query(
      'SELECT id, guid, value, description FROM tags WHERE type = $1 AND status = $2 AND deleted = false ORDER BY value ASC',
      [type, 'active']
    );

    res.json({
      success: true,
      message: getMessage('TAG.LIST_SUCCESS'),
      data: result.getRows()
    });
  } catch (error) {
    console.error('获取活跃标签失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('COMMON.SERVER_ERROR')
    });
  }
};