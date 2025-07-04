const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db/db');
const { uuidToBinary, binaryToUuid } = require('../utils/uuid');
const { getMessage } = require('../config/messages');

// Generate a unique product code
exports.generateProductCode = async (req, res) => {
  try {
    const { category_id } = req.query;
    
    // 获取分类信息
    const [category] = await pool.query(
      'SELECT code FROM product_categories WHERE id = ? AND deleted = 0',
      [category_id]
    );

    if (category.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('PRODUCT.CATEGORY_NOT_FOUND')
      });
    }

    // 获取该分类下的产品数量
    const [count] = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ? AND deleted = 0',
      [category_id]
    );

    // 生成产品编号：分类编码 + 4位序号
    const productCode = `${category[0].code}${String(count[0].count + 1).padStart(4, '0')}`;

    res.json({
      success: true,
      message: getMessage('PRODUCT.CODE_GENERATED'),
      data: productCode
    });
  } catch (error) {
    console.error('生成产品编号失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT.CODE_GENERATION_FAILED')
    });
  }
};

// Create a new product
exports.createProduct = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      name,
      product_code,
      category_id,
      price,
      stock = 0,
      status = 1,
      product_type = 'consignment', // 默认为代销
      thumbnail_url = null,
      short_description = '',
      full_description = '',
      sort_order = 0
    } = req.body;

    // 验证产品类型
    const validProductTypes = ['consignment', 'self_operated'];
    if (!validProductTypes.includes(product_type)) {
      return res.status(400).json({
        success: false,
        message: getMessage('PRODUCT.INVALID_TYPE')
      });
    }

    // 检查产品编号是否已存在
    const [existing] = await connection.query(
      'SELECT id FROM products WHERE product_code = ? AND deleted = 0',
      [product_code]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('PRODUCT.CODE_EXISTS')
      });
    }

    const guid = uuidToBinary(uuidv4());

    const currentUserId = req.userId; // 从JWT中获取当前用户ID
    const [result] = await connection.query(
      `INSERT INTO products (
        name, product_code, category_id, price, stock, status, product_type,
        thumbnail_url, short_description, full_description, sort_order, guid, deleted, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        name,
        product_code,
        category_id,
        price,
        stock,
        status,
        product_type,
        thumbnail_url,
        short_description,
        full_description,
        sort_order,
        guid,
        currentUserId,
        currentUserId
      ]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: getMessage('PRODUCT.CREATE_SUCCESS'),
      data: {
        id: result.insertId,
        name,
        product_code,
        category_id,
        price,
        stock,
        status,
        product_type,
        thumbnail_url,
        short_description,
        full_description,
        guid: binaryToUuid(guid)
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('创建产品失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT.CREATE_FAILED')
    });
  } finally {
    connection.release();
  }
};

// Get all products (non-deleted)
exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort_by = 'id', sort_order = 'desc', keyword, category_id, status, product_type } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, c.name as category_name, 
        (SELECT image_url FROM product_images WHERE product_id = p.id AND image_type = 0 AND deleted = 0 ORDER BY sort_order ASC, id ASC LIMIT 1) as thumbnail_url
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      WHERE p.deleted = 0
    `;
    const params = [];

    if (keyword) {
      query += ' AND (p.name LIKE ? OR p.product_code LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (category_id) {
      query += ' AND p.category_id = ?';
      params.push(category_id);
    }

    if (status !== undefined) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    if (product_type) {
      query += ' AND p.product_type = ?';
      params.push(product_type);
    }

    // 白名单验证排序字段，防止SQL注入
    const allowedSortFields = ['id', 'name', 'product_code', 'price', 'stock', 'status', 'created_at', 'updated_at', 'sort_order'];
    const validSortBy = allowedSortFields.includes(sort_by) ? sort_by : 'id';
    const validSortOrder = sort_order === 'asc' ? 'ASC' : 'DESC';

    // 构建排序条件 - 优先按sort_order字段排序（数值越大越排前）
    if (validSortBy === 'sort_order') {
      // 如果按sort_order排序，再按id降序
      query += ` ORDER BY p.sort_order ${validSortOrder}, p.id DESC`;
    } else {
      // 先按sort_order排序（数值大的在前），再按指定字段排序
      query += ` ORDER BY p.sort_order DESC, p.${validSortBy} ${validSortOrder}`;
    }

    // 添加分页
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await pool.query(query, params);
    const [total] = await pool.query(
      'SELECT COUNT(*) as total FROM products WHERE deleted = 0',
      []
    );

    // 转换 guid 为字符串
    const products = rows.map(row => ({
      ...row,
      guid: binaryToUuid(row.guid)
    }));

    res.json({
      success: true,
      message: getMessage('PRODUCT.LIST_SUCCESS'),
      data: {
        items: products,
        total: total[0].total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取产品列表失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT.LIST_FAILED')
    });
  }
};

// Get a single product by id
exports.getProductById = async (req, res) => {
  try {
    // 查询产品基本信息，明确列出所有字段
    const [rows] = await pool.query(
      `SELECT p.id, p.guid, p.name, p.product_code, p.category_id, p.price, p.stock, p.status, 
       p.product_type, p.short_description, p.full_description, p.created_at, p.updated_at, 
       c.name as category_name 
       FROM products p
       LEFT JOIN product_categories c ON p.category_id = c.id
       WHERE p.id = ? AND p.deleted = 0`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('PRODUCT.NOT_FOUND')
      });
    }

    // 查询主图
    const [mainImages] = await pool.query(
      'SELECT image_url FROM product_images WHERE product_id = ? AND image_type = 0 AND deleted = 0 ORDER BY sort_order ASC, id ASC LIMIT 1',
      [req.params.id]
    );
    // 查询详情图
    const [detailImages] = await pool.query(
      'SELECT image_url FROM product_images WHERE product_id = ? AND image_type = 1 AND deleted = 0 ORDER BY sort_order ASC, id ASC',
      [req.params.id]
    );

    // 转换 guid 为字符串
    const product = {
      ...rows[0],
      guid: binaryToUuid(rows[0].guid),
      thumbnail_url: mainImages.length > 0 ? mainImages[0].image_url : '',
      detail_images: detailImages.map(img => img.image_url)
    };

    res.json({
      success: true,
      message: getMessage('PRODUCT.GET_SUCCESS'),
      data: product
    });
  } catch (error) {
    console.error('获取产品详情失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT.GET_FAILED')
    });
  }
};

// Update a product
exports.updateProduct = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      name,
      product_code,
      category_id,
      price,
      stock,
      status,
      product_type,
      thumbnail_url,
      short_description,
      full_description,
      sort_order = 0
    } = req.body;

    // 验证产品类型
    const validProductTypes = ['consignment', 'self_operated'];
    if (!validProductTypes.includes(product_type)) {
      return res.status(400).json({
        success: false,
        message: getMessage('PRODUCT.INVALID_TYPE')
      });
    }

    // 检查产品是否存在
    const [existing] = await connection.query(
      'SELECT id FROM products WHERE id = ? AND deleted = 0',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('PRODUCT.NOT_FOUND')
      });
    }

    // 检查产品编号是否已被其他产品使用
    const [codeExists] = await connection.query(
      'SELECT id FROM products WHERE product_code = ? AND id != ? AND deleted = 0',
      [product_code, id]
    );

    if (codeExists.length > 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('PRODUCT.CODE_EXISTS')
      });
    }

    await connection.query(
      `UPDATE products SET 
        name = ?, 
        product_code = ?, 
        category_id = ?, 
        price = ?, 
        stock = ?, 
        status = ?, 
        product_type = ?,
        thumbnail_url = ?, 
        short_description = ?, 
        full_description = ?,
        sort_order = ?,
        updated_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        name,
        product_code,
        category_id,
        price,
        stock,
        status,
        product_type,
        thumbnail_url,
        short_description,
        full_description,
        sort_order,
        req.userId,
        id
      ]
    );

    await connection.commit();

    res.json({
      success: true,
      message: getMessage('PRODUCT.UPDATE_SUCCESS'),
      data: {
        id,
        name,
        product_code,
        category_id,
        price,
        stock,
        status,
        product_type,
        thumbnail_url,
        short_description,
        full_description
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('更新产品失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT.UPDATE_FAILED')
    });
  } finally {
    connection.release();
  }
};

// Soft delete a product
exports.deleteProduct = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // 检查产品是否存在
    const [existing] = await connection.query(
      'SELECT id FROM products WHERE id = ? AND deleted = 0',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('PRODUCT.NOT_FOUND')
      });
    }

    // 软删除产品
    await connection.query(
      'UPDATE products SET deleted = 1, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [req.userId, id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: getMessage('PRODUCT.DELETE_SUCCESS')
    });
  } catch (error) {
    await connection.rollback();
    console.error('删除产品失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT.DELETE_FAILED')
    });
  } finally {
    connection.release();
  }
};

// 从1688导入产品
exports.importFrom1688 = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      title,
      price,
      productId,
      url,
      supplierName,
      supplierLocation,
      description,
      specifications,
      minOrderQuantity,
      unit,
      category,
      category_id
    } = req.body;

    // 生成产品编号
    const productCode = `1688-${productId || Date.now()}`;
    
    // 确定分类ID
    let categoryId = 1; // 默认分类ID
    
    // 优先使用传入的category_id
    if (category_id && !isNaN(parseInt(category_id))) {
      // 验证category_id是否存在
      const [categoryExists] = await connection.query(
        'SELECT id FROM product_categories WHERE id = ? AND deleted = 0',
        [parseInt(category_id)]
      );
      if (categoryExists.length > 0) {
        categoryId = parseInt(category_id);
      }
    } else if (category) {
      // 如果没有category_id，则通过category名称查找
      const [existingCategory] = await connection.query(
        'SELECT id FROM product_categories WHERE name = ? AND deleted = 0',
        [category]
      );
      if (existingCategory.length > 0) {
        categoryId = existingCategory[0].id;
      }
    }

    const guid = uuidToBinary(uuidv4());
    const currentUserId = req.userId;

    // 创建产品
    const [result] = await connection.query(
      `INSERT INTO products (
        name, product_code, category_id, price, stock, status, product_type,
        short_description, full_description, guid, deleted, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        title,
        productCode,
        categoryId,
        parseFloat(price) || 0,
        parseInt(minOrderQuantity) || 0,
        1, // 默认上架
        'consignment', // 1688导入的产品默认为代销
        `供应商: ${supplierName || '未知'} | 位置: ${supplierLocation || '未知'} | 最小起订量: ${minOrderQuantity || '1'} ${unit || '件'}`,
        description || '',
        guid,
        currentUserId,
        currentUserId
      ]
    );

    const productId_new = result.insertId;

    // 图片已经通过 /api/product-images/upload 接口单独上传，这里不需要处理图片

    await connection.commit();

    res.status(201).json({
      success: true,
      message: '1688产品导入成功',
      data: {
        id: productId_new,
        name: title,
        product_code: productCode,
        category_id: categoryId,
        price: parseFloat(price) || 0,
        stock: parseInt(minOrderQuantity) || 0,
        guid: binaryToUuid(guid),
        source_url: url
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('1688产品导入失败:', error);
    res.status(500).json({
      success: false,
      message: '1688产品导入失败: ' + error.message
    });
  } finally {
    connection.release();
  }
};

// 按分类获取产品
exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const [rows] = await pool.query(`
      SELECT p.*, c.name as category_name,
        (SELECT JSON_ARRAYAGG(image_url) FROM product_images WHERE product_id = p.id AND deleted = 0) as gallery_urls
      FROM products p 
      LEFT JOIN product_categories c ON p.category_id = c.id 
      WHERE p.category_id = ? AND p.deleted = 0 AND p.status = 'on_shelf'
    `, [categoryId]);

    // 处理gallery_urls
    const products = rows.map(product => ({
      ...product,
      gallery_urls: product.gallery_urls ? JSON.parse(product.gallery_urls) : []
    }));

    res.json({
      success: true,
      message: getMessage('PRODUCT.GET_BY_CATEGORY_SUCCESS'),
      data: products
    });
  } catch (error) {
    console.error('按分类获取产品失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT.GET_BY_CATEGORY_FAILED'),
      data: null
    });
  }
};