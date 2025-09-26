const { v4: uuidv4 } = require('uuid');
const { query, getConnection } = require('../db/db');
const { getMessage } = require('../config/messages');

// 获取所有供应商
exports.getAllSuppliers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE s.deleted = false';
    const queryParams = [];
    let paramIndex = 1;

    // 搜索条件
    if (search) {
      whereClause += ` AND (s.name ILIKE $${paramIndex} OR s.email ILIKE $${paramIndex + 1} OR s.contact_phone1 ILIKE $${paramIndex + 2})`;
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      paramIndex += 3;
    }

    // 获取总数
    const countResult = await query(
      `SELECT COUNT(*) as total FROM suppliers s ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.getFirstRow().total);

    // 获取供应商列表
    const suppliersResult = await query(
      `SELECT 
        s.id,
        s.guid,
        s.name,
        s.contact_person,
        s.address,
        s.contact_phone1,
        s.contact_phone2,
        s.email,
        s.website,
        s.notes,
        s.created_at,
        s.updated_at,
        u1.username as created_by_username,
        u2.username as updated_by_username
      FROM suppliers s
      LEFT JOIN users u1 ON s.created_by = u1.id
      LEFT JOIN users u2 ON s.updated_by = u2.id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    const suppliers = suppliersResult.getRows();

    res.json({
      success: true,
      message: getMessage('SUPPLIER.GET_ALL_SUCCESS'),
      data: {
        suppliers,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total,
          total_pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取供应商列表失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('SUPPLIER.GET_ALL_FAILED')
    });
  }
};

// 根据ID获取供应商
exports.getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        s.id,
        s.guid,
        s.name,
        s.contact_person,
        s.address,
        s.contact_phone1,
        s.contact_phone2,
        s.email,
        s.website,
        s.notes,
        s.created_at,
        s.updated_at,
        u1.username as created_by_username,
        u2.username as updated_by_username
      FROM suppliers s
      LEFT JOIN users u1 ON s.created_by = u1.id
      LEFT JOIN users u2 ON s.updated_by = u2.id
      WHERE s.id = $1 AND s.deleted = false`,
      [id]
    );

    if (result.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('SUPPLIER.NOT_FOUND')
      });
    }

    res.json({
      success: true,
      message: getMessage('SUPPLIER.GET_SUCCESS'),
      data: result.getFirstRow()
    });
  } catch (error) {
    console.error('获取供应商详情失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('SUPPLIER.GET_FAILED')
    });
  }
};

// 创建供应商
exports.createSupplier = async (req, res) => {
  try {
    const {
      name,
      contact_person = null,
      address = null,
      contact_phone1 = null,
      contact_phone2 = null,
      email = null,
      website = null,
      notes = null
    } = req.body;

    // 验证必填字段
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: getMessage('SUPPLIER.NAME_REQUIRED')
      });
    }

    // 检查供应商名称是否已存在
    const existing = await query(
      'SELECT id FROM suppliers WHERE name = $1 AND deleted = false',
      [name.trim()]
    );

    if (existing.getRowCount() > 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('SUPPLIER.NAME_EXISTS')
      });
    }

    // 验证邮箱格式（如果提供）
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: getMessage('SUPPLIER.INVALID_EMAIL')
        });
      }
    }

    const currentUserId = req.userId; // 从JWT中获取当前用户ID
    const result = await query(
      `INSERT INTO suppliers (
        name, contact_person, address, contact_phone1, contact_phone2, email, website, notes,
        deleted, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, $9, $10) RETURNING id, guid`,
      [
        name.trim(),
        contact_person ? contact_person.trim() : null,
        address ? address.trim() : null,
        contact_phone1 ? contact_phone1.trim() : null,
        contact_phone2 ? contact_phone2.trim() : null,
        email ? email.trim() : null,
        website ? website.trim() : null,
        notes ? notes.trim() : null,
        currentUserId,
        currentUserId
      ]
    );

    const supplierId = result.getFirstRow().id;
    const supplierGuid = result.getFirstRow().guid;

    res.status(201).json({
      success: true,
      message: getMessage('SUPPLIER.CREATE_SUCCESS'),
      data: {
        id: supplierId,
        guid: supplierGuid,
        name: name.trim(),
        contact_person,
        address,
        contact_phone1,
        contact_phone2,
        email,
        website,
        notes
      }
    });
  } catch (error) {
    console.error('创建供应商失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('SUPPLIER.CREATE_FAILED')
    });
  }
};

// 更新供应商
exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      contact_person = null,
      address = null,
      contact_phone1 = null,
      contact_phone2 = null,
      email = null,
      website = null,
      notes = null
    } = req.body;

    // 验证必填字段
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: getMessage('SUPPLIER.NAME_REQUIRED')
      });
    }

    // 检查供应商是否存在
    const existing = await query(
      'SELECT id FROM suppliers WHERE id = $1 AND deleted = false',
      [id]
    );

    if (existing.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('SUPPLIER.NOT_FOUND')
      });
    }

    // 检查供应商名称是否已被其他供应商使用
    const nameExists = await query(
      'SELECT id FROM suppliers WHERE name = $1 AND id != $2 AND deleted = false',
      [name.trim(), id]
    );

    if (nameExists.getRowCount() > 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('SUPPLIER.NAME_EXISTS')
      });
    }

    // 验证邮箱格式（如果提供）
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: getMessage('SUPPLIER.INVALID_EMAIL')
        });
      }
    }

    const currentUserId = req.userId; // 从JWT中获取当前用户ID
    await query(
      `UPDATE suppliers SET 
        name = $1,
        contact_person = $2,
        address = $3,
        contact_phone1 = $4,
        contact_phone2 = $5,
        email = $6,
        website = $7,
        notes = $8,
        updated_by = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10`,
      [
        name.trim(),
        contact_person ? contact_person.trim() : null,
        address ? address.trim() : null,
        contact_phone1 ? contact_phone1.trim() : null,
        contact_phone2 ? contact_phone2.trim() : null,
        email ? email.trim() : null,
        website ? website.trim() : null,
        notes ? notes.trim() : null,
        currentUserId,
        id
      ]
    );

    res.json({
      success: true,
      message: getMessage('SUPPLIER.UPDATE_SUCCESS'),
      data: {
        id: parseInt(id),
        name: name.trim(),
        contact_person,
        address,
        contact_phone1,
        contact_phone2,
        email,
        website,
        notes
      }
    });
  } catch (error) {
    console.error('更新供应商失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('SUPPLIER.UPDATE_FAILED')
    });
  }
};

// 删除供应商（软删除）
exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查供应商是否存在
    const existing = await query(
      'SELECT id FROM suppliers WHERE id = $1 AND deleted = false',
      [id]
    );

    if (existing.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('SUPPLIER.NOT_FOUND')
      });
    }

    // 检查是否有产品正在使用此供应商
    const productsUsingSupplier = await query(
      'SELECT COUNT(*) as count FROM products WHERE supplier_id = $1 AND deleted = false',
      [id]
    );

    const productCount = parseInt(productsUsingSupplier.getFirstRow().count);
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('SUPPLIER.CANNOT_DELETE_HAS_PRODUCTS', { count: productCount })
      });
    }

    const currentUserId = req.userId; // 从JWT中获取当前用户ID
    await query(
      `UPDATE suppliers SET 
        deleted = true,
        updated_by = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2`,
      [currentUserId, id]
    );

    res.json({
      success: true,
      message: getMessage('SUPPLIER.DELETE_SUCCESS')
    });
  } catch (error) {
    console.error('删除供应商失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('SUPPLIER.DELETE_FAILED')
    });
  }
};

// 获取供应商的产品列表
exports.getSupplierProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // 检查供应商是否存在
    const supplierExists = await query(
      'SELECT id, name FROM suppliers WHERE id = $1 AND deleted = false',
      [id]
    );

    if (supplierExists.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('SUPPLIER.NOT_FOUND')
      });
    }

    // 获取总数
    const countResult = await query(
      'SELECT COUNT(*) as total FROM products WHERE supplier_id = $1 AND deleted = false',
      [id]
    );
    const total = parseInt(countResult.getFirstRow().total);

    // 获取产品列表
    const productsResult = await query(
      `SELECT 
        p.id,
        p.guid,
        p.name,
        p.product_code,
        p.price,
        p.stock,
        p.status,
        p.created_at,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND image_type = 0 AND deleted = false ORDER BY sort_order ASC, id ASC LIMIT 1) as thumbnail_url
      FROM products p
      WHERE p.supplier_id = $1 AND p.deleted = false
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    const products = productsResult.getRows();
    const supplier = supplierExists.getFirstRow();

    res.json({
      success: true,
      message: getMessage('SUPPLIER.GET_PRODUCTS_SUCCESS'),
      data: {
        supplier,
        products,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total,
          total_pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取供应商产品列表失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('SUPPLIER.GET_PRODUCTS_FAILED')
    });
  }
};

// 获取供应商选项列表（用于下拉选择）
exports.getSupplierOptions = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name FROM suppliers 
       WHERE deleted = false 
       ORDER BY name ASC`
    );

    const suppliers = result.getRows();

    res.json({
      success: true,
      message: getMessage('SUPPLIER.GET_OPTIONS_SUCCESS'),
      data: suppliers
    });
  } catch (error) {
    console.error('获取供应商选项失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('SUPPLIER.GET_OPTIONS_FAILED')
    });
  }
};