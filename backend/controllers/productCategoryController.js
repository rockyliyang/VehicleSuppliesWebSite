const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db/db');
const { getMessage } = require('../config/messages');

// 将 UUID 字符串转换为 BINARY(16)
function uuidToBinary(uuid) {
  return Buffer.from(uuid.replace(/-/g, ''), 'hex');
}

// 将 BINARY(16) 转换为 UUID 字符串
function binaryToUuid(binary) {
  const hex = binary.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// Create a new product category
exports.createCategory = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { name, code, sort_order = 0, status = 1, description = '' } = req.body;
    const guid = uuidToBinary(uuidv4());

    // 检查编码是否已存在
    const [existing] = await connection.query(
      'SELECT id FROM product_categories WHERE code = ? AND deleted = 0',
      [code]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('CATEGORY.CODE_EXISTS')
      });
    }

    const [result] = await connection.query(
      'INSERT INTO product_categories (name, code, sort_order, status, description, guid, deleted) VALUES (?, ?, ?, ?, ?, ?, 0)',
      [name, code, sort_order, status, description, guid]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: getMessage('CATEGORY.CREATE_SUCCESS'),
      data: {
        id: result.insertId,
        name,
        code,
        sort_order,
        status,
        description,
        guid: binaryToUuid(guid)
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
    const [rows] = await pool.query(
      'SELECT id, name, code, sort_order, status, description, guid FROM product_categories WHERE deleted = 0 ORDER BY sort_order ASC'
    );
    
    // 转换 guid 为字符串
    const categories = rows.map(row => ({
      ...row,
      guid: binaryToUuid(row.guid)
    }));

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
    const [rows] = await pool.query(
      'SELECT id, name, code, sort_order, status, description, guid FROM product_categories WHERE id = ? AND deleted = 0',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('CATEGORY.NOT_FOUND')
      });
    }

    // 转换 guid 为字符串
    const category = {
      ...rows[0],
      guid: binaryToUuid(rows[0].guid)
    };

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
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { name, code, sort_order, status, description } = req.body;

    // 检查分类是否存在
    const [existing] = await connection.query(
      'SELECT id FROM product_categories WHERE id = ? AND deleted = 0',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('CATEGORY.NOT_FOUND')
      });
    }

    // 检查编码是否已被其他分类使用
    const [codeExists] = await connection.query(
      'SELECT id FROM product_categories WHERE code = ? AND id != ? AND deleted = 0',
      [code, id]
    );

    if (codeExists.length > 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('CATEGORY.CODE_USED_BY_OTHER')
      });
    }

    await connection.query(
      'UPDATE product_categories SET name = ?, code = ?, sort_order = ?, status = ?, description = ? WHERE id = ?',
      [name, code, sort_order, status, description, id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: getMessage('CATEGORY.UPDATE_SUCCESS'),
      data: {
        id,
        name,
        code,
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
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // 检查分类是否存在
    const [existing] = await connection.query(
      'SELECT id FROM product_categories WHERE id = ? AND deleted = 0',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('CATEGORY.NOT_FOUND')
      });
    }

    // 软删除分类
    await connection.query(
      'UPDATE product_categories SET deleted = 1 WHERE id = ?',
      [id]
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