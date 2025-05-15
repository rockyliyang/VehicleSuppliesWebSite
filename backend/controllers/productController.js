const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db/db');
const { uuidToBinary, binaryToUuid } = require('../utils/uuid');

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
        message: '分类不存在'
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
      data: productCode
    });
  } catch (error) {
    console.error('生成产品编号失败:', error);
    res.status(500).json({
      success: false,
      message: '生成产品编号失败'
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
      full_description = ''
    } = req.body;

    // 验证产品类型
    const validProductTypes = ['consignment', 'self_operated'];
    if (!validProductTypes.includes(product_type)) {
      return res.status(400).json({
        success: false,
        message: '无效的产品类型'
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
        message: '产品编号已存在'
      });
    }

    const guid = uuidToBinary(uuidv4());

    const [result] = await connection.query(
      `INSERT INTO products (
        name, product_code, category_id, price, stock, status, product_type,
        thumbnail_url, short_description, full_description, guid, deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
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
        guid
      ]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: '产品创建成功',
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
      message: '创建产品失败'
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

    // 添加排序
    query += ` ORDER BY p.${sort_by} ${sort_order === 'asc' ? 'ASC' : 'DESC'}`;

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
      message: '获取产品列表失败'
    });
  }
};

// Get a single product by id
exports.getProductById = async (req, res) => {
  try {
    // 查询产品基本信息
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM products p
       LEFT JOIN product_categories c ON p.category_id = c.id
       WHERE p.id = ? AND p.deleted = 0`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
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
      data: product
    });
  } catch (error) {
    console.error('获取产品详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取产品详情失败'
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
      full_description
    } = req.body;

    // 验证产品类型
    const validProductTypes = ['consignment', 'self_operated'];
    if (!validProductTypes.includes(product_type)) {
      return res.status(400).json({
        success: false,
        message: '无效的产品类型'
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
        message: '产品不存在'
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
        message: '产品编号已被其他产品使用'
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
        full_description = ? 
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
        id
      ]
    );

    await connection.commit();

    res.json({
      success: true,
      message: '产品更新成功',
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
      message: '更新产品失败'
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
        message: '产品不存在'
      });
    }

    // 软删除产品
    await connection.query(
      'UPDATE products SET deleted = 1 WHERE id = ?',
      [id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: '产品删除成功'
    });
  } catch (error) {
    await connection.rollback();
    console.error('删除产品失败:', error);
    res.status(500).json({
      success: false,
      message: '删除产品失败'
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
      message: '获取产品成功',
      data: products
    });
  } catch (error) {
    console.error('按分类获取产品失败:', error);
    res.status(500).json({
      success: false,
      message: '按分类获取产品失败',
      data: null
    });
  }
};