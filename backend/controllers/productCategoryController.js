const { query, getConnection } = require('../db/db');
const { getMessage } = require('../config/messages');

// PostgreSQL 不需要 UUID 转换工具

// Create a new product category
exports.createCategory = async (req, res) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const { name, code, parent_id = null, sort_order = 0, status = 'on_shelf', description = '' } = req.body;

    // 检查编码是否已存在
    const existing = await connection.query(
      'SELECT id FROM product_categories WHERE code = $1 AND deleted = false',
      [code]
    );

    if (existing.getRowCount() > 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('CATEGORY.CODE_EXISTS')
      });
    }

    const currentUserId = req.userId; // 从JWT中获取当前用户ID
    const result = await connection.query(
      'INSERT INTO product_categories (name, code, parent_id, sort_order, status, description, deleted, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8) RETURNING id, guid',
      [name, code, parent_id, sort_order, status, description, currentUserId, currentUserId]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: getMessage('CATEGORY.CREATE_SUCCESS'),
      data: {
        id: result.getFirstRow().id,
        name,
        code,
        sort_order,
        status,
        description,
        guid: result.getFirstRow().guid
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('创建分类失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('CATEGORY.CREATE_FAILED')
    });
  } finally {
    connection.release();
  }
};

// Get all product categories (non-deleted)
exports.getAllCategories = async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, name, code, parent_id, sort_order, status, description, guid FROM product_categories WHERE deleted = false ORDER BY sort_order ASC'
    );
    
    // PostgreSQL 返回的 guid 已经是字符串格式
    const categories = rows.getRows();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('CATEGORY.GET_LIST_FAILED')
    });
  }
};

// Get a single product category by id
exports.getCategoryById = async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, name, code, parent_id, sort_order, status, description, guid FROM product_categories WHERE id = $1 AND deleted = false',
      [req.params.id]
    );

    if (rows.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('CATEGORY.NOT_FOUND')
      });
    }

    // PostgreSQL 返回的 guid 已经是字符串格式
    const category = rows.getFirstRow();

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('获取分类详情失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('CATEGORY.GET_DETAIL_FAILED')
    });
  }
};

// Update a product category
exports.updateCategory = async (req, res) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { name, code, parent_id, sort_order, status, description } = req.body;

    // 检查分类是否存在
    const existing = await connection.query(
      'SELECT id FROM product_categories WHERE id = $1 AND deleted = false',
      [id]
    );

    if (existing.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('CATEGORY.NOT_FOUND')
      });
    }

    // 检查编码是否已被其他分类使用
    const codeExists = await connection.query(
      'SELECT id FROM product_categories WHERE code = $1 AND id != $2 AND deleted = false',
      [code, id]
    );

    if (codeExists.getRowCount() > 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('CATEGORY.CODE_USED_BY_OTHER')
      });
    }

    await connection.query(
      'UPDATE product_categories SET name = $1, code = $2, parent_id = $3, sort_order = $4, status = $5, description = $6, updated_by = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8',
      [name, code, parent_id, sort_order, status, description, req.userId, id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: getMessage('CATEGORY.UPDATE_SUCCESS'),
      data: {
        id,
        name,
        code,
        parent_id,
        sort_order,
        status,
        description
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('更新分类失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('CATEGORY.UPDATE_FAILED')
    });
  } finally {
    connection.release();
  }
};

// Soft delete a product category
exports.deleteCategory = async (req, res) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // 检查分类是否存在
    const existing = await connection.query(
      'SELECT id FROM product_categories WHERE id = $1 AND deleted = false',
      [id]
    );

    if (existing.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('CATEGORY.NOT_FOUND')
      });
    }

    // 检查是否有产品使用此分类
    const productsUsingCategory = await connection.query(
      'SELECT id FROM products WHERE category_id = $1 AND deleted = false LIMIT 1',
      [id]
    );

    if (productsUsingCategory.getRowCount() > 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('CATEGORY.CANNOT_DELETE_USED')
      });
    }

    // 软删除分类
    await connection.query(
      'UPDATE product_categories SET deleted = true, updated_by = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [req.userId, id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: getMessage('CATEGORY.DELETE_SUCCESS')
    });
  } catch (error) {
    await connection.rollback();
    console.error('删除分类失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('CATEGORY.DELETE_FAILED')
    });
  } finally {
    connection.release();
  }
};