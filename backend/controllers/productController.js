const { v4: uuidv4 } = require('uuid');
const { query, getConnection } = require('../db/db');
// 移除 uuidToBinary 和 binaryToUuid 的引用，PostgreSQL 使用原生 UUID
const { getMessage } = require('../config/messages');

// 验证阶梯价格范围的辅助函数
const validatePriceRanges = (priceRanges) => {
  if (!Array.isArray(priceRanges) || priceRanges.length === 0) {
    return { valid: false, message: 'Price ranges must be a non-empty array' };
  }

  // 按最小数量排序
  const sortedRanges = [...priceRanges].sort((a, b) => a.min_quantity - b.min_quantity);

  // 检查第一个范围是否从1开始
  if (sortedRanges[0].min_quantity !== 1) {
    return { valid: false, message: 'First price range must start from quantity 1' };
  }

  // 检查范围是否连续，没有间隔
  for (let i = 0; i < sortedRanges.length; i++) {
    const current = sortedRanges[i];
    
    // 验证基本字段
    if (!current.min_quantity || current.min_quantity <= 0) {
      return { valid: false, message: `Invalid min_quantity at range ${i + 1}` };
    }
    
    if (!current.price || current.price <= 0) {
      return { valid: false, message: `Invalid price at range ${i + 1}` };
    }

    // 验证max_quantity（如果存在）
    if (current.max_quantity !== null && current.max_quantity !== undefined) {
      if (current.max_quantity < current.min_quantity) {
        return { valid: false, message: `max_quantity must be >= min_quantity at range ${i + 1}` };
      }
    }

    // 检查与下一个范围的连续性
    if (i < sortedRanges.length - 1) {
      const next = sortedRanges[i + 1];
      
      // 当前范围必须有max_quantity（除了最后一个）
      if (current.max_quantity === null || current.max_quantity === undefined) {
        return { valid: false, message: `Range ${i + 1} must have max_quantity (except the last range)` };
      }
      
      // 下一个范围的min_quantity必须等于当前范围的max_quantity + 1
      if (next.min_quantity !== current.max_quantity + 1) {
        return { valid: false, message: `Gap detected between range ${i + 1} and ${i + 2}. Range ${i + 2} should start from ${current.max_quantity + 1}` };
      }
    } else {
      // 最后一个范围的max_quantity应该是null（表示无上限）
      if (current.max_quantity !== null && current.max_quantity !== undefined) {
        return { valid: false, message: 'Last price range should have no upper limit (max_quantity should be null)' };
      }
    }
  }

  return { valid: true, sortedRanges };
};

// 根据数量获取对应的价格
const getPriceByQuantity = (priceRanges, quantity) => {
  if (!Array.isArray(priceRanges) || priceRanges.length === 0) {
    return null;
  }

  for (const range of priceRanges) {
    if (quantity >= range.min_quantity) {
      if (range.max_quantity === null || quantity <= range.max_quantity) {
        return range.price;
      }
    }
  }
  
  return null;
};

// 格式化价格范围显示字符串
const formatPriceRangeDisplay = (priceRanges, currencySymbol = '$') => {
  if (!Array.isArray(priceRanges) || priceRanges.length === 0) {
    return '';
  }

  const sortedRanges = [...priceRanges].sort((a, b) => a.min_quantity - b.min_quantity);
  
  return sortedRanges.map(range => {
    const price = `${currencySymbol}${parseFloat(range.price).toFixed(2)}`;
    if (range.max_quantity === null) {
      return `${range.min_quantity}+ pcs: ${price}`;
    } else if (range.min_quantity === range.max_quantity) {
      return `${range.min_quantity} pc: ${price}`;
    } else {
      return `${range.min_quantity}-${range.max_quantity} pcs: ${price}`;
    }
  }).join('; ');
};

// Generate a unique product code
exports.generateProductCode = async (req, res) => {
  try {
    const { category_id } = req.body;
    
    // 获取分类信息
    const category = await query(
      'SELECT code FROM product_categories WHERE id = $1 AND deleted = false',
      [category_id]
    );

    if (category.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('PRODUCT.CATEGORY_NOT_FOUND')
      });
    }

    // 获取该分类下的产品数量
    const count = await query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = $1 AND deleted = false',
      [category_id]
    );

    // 生成产品编号：分类编码 + 4位序号
    const productCode = `${category.getFirstRow().code}${String(count.getFirstRow().count + 1).padStart(4, '0')}`;

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

// 获取一起购买的商品
exports.getBuyTogetherProducts = async (req, res) => {
  try {
    const { productId } = req.params;

    // 查询产品是否存在
    const productExists = await query(
      'SELECT id FROM products WHERE id = $1 AND deleted = false',
      [productId]
    );

    if (productExists.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('PRODUCT.NOT_FOUND')
      });
    }

    // 查询一起购买的商品
    const buyTogetherProducts = await query(`
      SELECT 
        p.id,
        p.name,
        p.product_code,
        p.price,
        p.status,
        p.short_description,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND image_type = 0 AND deleted = false ORDER BY sort_order ASC, id ASC LIMIT 1) as thumbnail_url,
        pl.sort_order
      FROM product_links pl
      LEFT JOIN products p ON pl.link_product_id = p.id
      WHERE pl.product_id = $1 
        AND pl.link_type = 'buy_together' 
        AND pl.deleted = false 
        AND p.deleted = false
        AND p.status = 'on_shelf'
      ORDER BY pl.sort_order ASC, pl.id ASC
      LIMIT 10
    `, [productId]);

    const products = buyTogetherProducts.getRows();

    // 为每个产品获取阶梯价格
    const productsWithPriceRanges = [];
    for (const product of products) {
      const priceRanges = await query(
        'SELECT min_quantity, max_quantity, price FROM product_price_ranges WHERE product_id = $1 ORDER BY min_quantity ASC',
        [product.id]
      );
      
      productsWithPriceRanges.push({
        ...product,
        price_ranges: priceRanges.getRows()
      });
    }

    res.json({
      success: true,
      message: getMessage('PRODUCT.BUY_TOGETHER_SUCCESS'),
      data: productsWithPriceRanges
    });
  } catch (error) {
    console.error('获取一起购买商品失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT.BUY_TOGETHER_FAILED')
    });
  }
};

// Create a new product
exports.createProduct = async (req, res) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const {
      name,
      product_code,
      category_id,
      price,
      price_ranges, // 新增：阶梯价格数组
      stock = 0,
      status = 'on_shelf',
      product_type = 'consignment', // 默认为代销
      thumbnail_url = null,
      short_description = '',
      full_description = '',
      sort_order = 0,
      product_length = null,
      product_width = null,
      product_height = null,
      product_weight = null,
      shipping_fee_ranges = []
    } = req.body;

    // 验证产品类型
    const validProductTypes = ['self_operated', 'consignment'];
    if (!validProductTypes.includes(product_type)) {
      return res.status(400).json({
        success: false,
        message: getMessage('PRODUCT.INVALID_TYPE')
      });
    }

    // 处理阶梯价格数据（客户端已验证）
    let validatedPriceRanges = null;
    if (price_ranges && price_ranges.length > 0) {
      // 按最小数量排序，确保数据一致性
      validatedPriceRanges = [...price_ranges].sort((a, b) => a.min_quantity - b.min_quantity);
    }

    // 检查产品编号是否已存在
    const existing = await connection.query(
      'SELECT id FROM products WHERE product_code = $1 AND deleted = false',
      [product_code]
    );

    if (existing.getRowCount() > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: getMessage('PRODUCT.CODE_EXISTS')
      });
    }

    const currentUserId = req.userId; // 从JWT中获取当前用户ID
    const result = await connection.query(
      `INSERT INTO products (
        name, product_code, category_id, price, stock, status, product_type,
        thumbnail_url, short_description, full_description, sort_order, 
        product_length, product_width, product_height, product_weight,
        deleted, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, false, $16, $17) RETURNING id, guid`,
      [
        name,
        product_code,
        category_id,
        0.0,
        stock,
        status,
        product_type,
        thumbnail_url,
        short_description,
        full_description,
        sort_order,
        product_length,
        product_width,
        product_height,
        product_weight,
        currentUserId,
        currentUserId
      ]
    );

    const productId = result.rows[0].id;

    // 插入阶梯价格数据（如果提供）
    if (validatedPriceRanges && validatedPriceRanges.length > 0) {
      for (const range of validatedPriceRanges) {
        await connection.query(
          `INSERT INTO product_price_ranges (product_id, min_quantity, max_quantity, price, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            productId,
            range.min_quantity,
            range.max_quantity,
            range.price,
            currentUserId,
            currentUserId
          ]
        );
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: getMessage('PRODUCT.CREATE_SUCCESS'),
      data: {
        id: productId,
        name,
        product_code,
        category_id,
        price: 0.0,
        price_ranges: validatedPriceRanges,
        stock,
        status,
        product_type,
        thumbnail_url,
        short_description,
        full_description,
        product_length,
        product_width,
        product_height,
        product_weight,
        guid: result.getFirstRow().guid
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

    let querystr = `
      SELECT p.*, c.name as category_name, 
        (SELECT image_url FROM product_images WHERE product_id = p.id AND image_type = 0 AND deleted = false ORDER BY sort_order ASC, id ASC LIMIT 1) as thumbnail_url
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      WHERE p.deleted = false
    `;
    const params = [];
    let paramIndex = 1;

    if (keyword) {
      querystr += ` AND (p.name ILIKE $${paramIndex} OR p.product_code ILIKE $${paramIndex + 1})`;
      params.push(`%${keyword}%`, `%${keyword}%`);
      paramIndex += 2;
    }

    if (category_id) {
      querystr += ` AND p.category_id = $${paramIndex}`;
      params.push(category_id);
      paramIndex += 1;
    }

    if (status !== undefined) {
      querystr += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex += 1;
    }

    if (product_type) {
      querystr += ` AND p.product_type = $${paramIndex}`;
      params.push(product_type);
      paramIndex += 1;
    }

    // 白名单验证排序字段，防止SQL注入
    const allowedSortFields = ['id', 'name', 'product_code', 'price', 'stock', 'status', 'created_at', 'updated_at', 'sort_order'];
    const validSortBy = allowedSortFields.includes(sort_by) ? sort_by : 'id';
    const validSortOrder = sort_order === 'asc' ? 'ASC' : 'DESC';

    // 构建排序条件 - 优先按sort_order字段排序（数值越大越排前）
    if (validSortBy === 'sort_order') {
      // 如果按sort_order排序，再按id降序
      querystr += ` ORDER BY p.sort_order ${validSortOrder}, p.id DESC`;
    } else {
      // 先按sort_order排序（数值大的在前），再按指定字段排序
      querystr += ` ORDER BY p.sort_order DESC, p.${validSortBy} ${validSortOrder}`;
    }

    // 添加分页
    querystr += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const rows = await query(querystr, params);
    const total = await query(
      'SELECT COUNT(*) as total FROM products WHERE deleted = false',
      []
    );

    // PostgreSQL 返回的 guid 已经是字符串格式
    const products = rows.getRows();

    // 一次性查询所有产品的阶梯价格
    let productsWithPriceRanges = products;
    if (products.length > 0) {
      const productIds = products.map(p => p.id);
      const priceRangesResult = await query(
        'SELECT product_id, min_quantity, max_quantity, price FROM product_price_ranges WHERE product_id = ANY($1) ORDER BY product_id, min_quantity ASC',
        [productIds]
      );
      
      const priceRangesMap = {};
      priceRangesResult.getRows().forEach(range => {
        if (!priceRangesMap[range.product_id]) {
          priceRangesMap[range.product_id] = [];
        }
        priceRangesMap[range.product_id].push({
          min_quantity: range.min_quantity,
          max_quantity: range.max_quantity,
          price: range.price
        });
      });
      
      productsWithPriceRanges = products.map(product => ({
        ...product,
        price_ranges: priceRangesMap[product.id] || []
      }));
    }

    res.json({
      success: true,
      message: getMessage('PRODUCT.LIST_SUCCESS'),
      data: {
        items: productsWithPriceRanges,
        total: parseInt(total.getFirstRow().total),
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
  const connection = await getConnection();
  try {
    // 查询产品基本信息，明确列出所有字段
    const rows = await connection.query(
      `SELECT p.id, p.guid, p.name, p.product_code, p.category_id, p.price, p.stock, p.status, 
       p.product_type, p.short_description, p.product_length, p.product_width, p.product_height, p.full_description, p.created_at, p.updated_at, 
       c.name as category_name 
       FROM products p
       LEFT JOIN product_categories c ON p.category_id = c.id
       WHERE p.id = $1 AND p.deleted = false`,
      [req.params.id]
    );

    if (rows.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('PRODUCT.NOT_FOUND')
      });
    }

    // 查询阶梯价格
    const priceRanges = await connection.query(
      'SELECT min_quantity, max_quantity, price FROM product_price_ranges WHERE product_id = $1 ORDER BY min_quantity ASC',
      [req.params.id]
    );

    // 查询主图
    const mainImages = await connection.query(
      'SELECT image_url FROM product_images WHERE product_id = $1 AND image_type = 0 AND deleted = false ORDER BY sort_order ASC, id ASC LIMIT 1',
      [req.params.id]
    );
    // 查询详情图
    const detailImages = await connection.query(
      'SELECT image_url FROM product_images WHERE product_id = $1 AND image_type = 1 AND deleted = false ORDER BY sort_order ASC, id ASC',
      [req.params.id]
    );

    // 查询关联商品（Buy Together）
    const linkedProducts = await connection.query(`
      SELECT 
        pl.id as link_id,
        pl.link_product_id,
        pl.link_type,
        pl.sort_order,
        p.name as link_product_name,
        p.product_code as link_product_code,
        p.price as link_product_price,
        p.status as link_product_status,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND image_type = 0 AND deleted = false ORDER BY sort_order ASC, id ASC LIMIT 1) as link_product_thumbnail
      FROM product_links pl
      LEFT JOIN products p ON pl.link_product_id = p.id
      WHERE pl.product_id = $1 
        AND pl.link_type = 'buy_together'
        AND pl.deleted = false 
        AND p.deleted = false
      ORDER BY pl.sort_order ASC, pl.id ASC
    `, [req.params.id]);

    // PostgreSQL 返回的 guid 已经是字符串格式
    const product = {
      ...rows.getFirstRow(),
      price_ranges: priceRanges.getRows(),
      thumbnail_url: mainImages.getRowCount() > 0 ? mainImages.getFirstRow().image_url : '',
      detail_images: detailImages.getRows().map(img => img.image_url),
      linked_products: linkedProducts.getRows()
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
  } finally {
    connection.release();
  }
};

// Update a product
exports.updateProduct = async (req, res) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      name,
      product_code,
      category_id,
      price,
      price_ranges, // 新增：阶梯价格数组
      stock,
      status,
      product_type,
      thumbnail_url,
      short_description,
      full_description,
      sort_order = 0,
      product_length = null,
      product_width = null,
      product_height = null,
      product_weight = null,
      shipping_fee_ranges = []
    } = req.body;

    // 验证产品类型
    const validProductTypes = ['self_operated', 'consignment'];
    if (!validProductTypes.includes(product_type)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: getMessage('PRODUCT.INVALID_TYPE')
      });
    }

    // 处理阶梯价格数据（客户端已验证）
    let validatedPriceRanges = null;
    if (price_ranges && price_ranges.length > 0) {
      // 按最小数量排序，确保数据一致性
      validatedPriceRanges = [...price_ranges].sort((a, b) => a.min_quantity - b.min_quantity);
    }

    // 检查产品是否存在
    const existing = await connection.query(
      'SELECT id FROM products WHERE id = $1 AND deleted = false',
      [id]
    );

    if (existing.getRowCount() === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: getMessage('PRODUCT.NOT_FOUND')
      });
    }

    // 检查产品编号是否已被其他产品使用
    const codeExists = await connection.query(
      'SELECT id FROM products WHERE product_code = $1 AND id != $2 AND deleted = false',
      [product_code, id]
    );

    if (codeExists.getRowCount() > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: getMessage('PRODUCT.CODE_EXISTS')
      });
    }

    await connection.query(
      `UPDATE products SET 
        name = $1, 
        product_code = $2, 
        category_id = $3, 
        price = $4, 
        stock = $5, 
        status = $6, 
        product_type = $7,
        thumbnail_url = $8, 
        short_description = $9, 
        full_description = $10,
        sort_order = $11,
        product_length = $12,
        product_width = $13,
        product_height = $14,
        product_weight = $15,
        updated_by = $16,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $17`,
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
        product_length,
        product_width,
        product_height,
        product_weight,
        req.userId,
        id
      ]
    );

    // 更新阶梯价格数据
    // 先删除现有的阶梯价格记录
    await connection.query(
      'DELETE FROM product_price_ranges WHERE product_id = $1',
      [id]
    );

    // 插入新的阶梯价格数据（如果提供）
    if (validatedPriceRanges && validatedPriceRanges.length > 0) {
      for (const range of validatedPriceRanges) {
        await connection.query(
          `INSERT INTO product_price_ranges (product_id, min_quantity, max_quantity, price, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            id,
            range.min_quantity,
            range.max_quantity,
            range.price,
            req.userId,
            req.userId
          ]
        );
      }
    }

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
        price_ranges: validatedPriceRanges,
        shipping_fee_ranges: validatedShippingFeeRanges,
        stock,
        status,
        product_type,
        thumbnail_url,
        short_description,
        full_description,
        product_length,
        product_width,
        product_height,
        product_weight
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
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // 检查产品是否存在
    const existing = await connection.query(
      'SELECT id FROM products WHERE id = $1 AND deleted = false',
      [id]
    );

    if (existing.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('PRODUCT.NOT_FOUND')
      });
    }

    // 软删除产品
    await connection.query(
      'UPDATE products SET deleted = true, updated_by = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [req.userId, id]
    );

    // 软删除相关的产品图片
    await connection.query(
      'UPDATE product_images SET deleted = true, updated_by = $1, updated_at = CURRENT_TIMESTAMP WHERE product_id = $2',
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

// 解析1688分段价格，提取第一个价格
const parseFirstPrice = (priceString) => {
  if (!priceString || typeof priceString !== 'string') {
    return 0;
  }
  
  // 匹配价格模式：数字 + $ + 数字（小数）
  // 例如："20 - 999 pieces$0.25" 或 "$0.25"
  const priceMatch = priceString.match(/\$([0-9]+(?:\.[0-9]+)?)/);
  
  if (priceMatch && priceMatch[1]) {
    return parseFloat(priceMatch[1]);
  }
  
  // 如果没有找到$符号，尝试直接解析数字
  const numberMatch = priceString.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (numberMatch && numberMatch[1]) {
    return parseFloat(numberMatch[1]);
  }
  
  return 0;
};

// 解析阿里巴巴国际站阶梯价格
// 输入格式示例: "20 - 999 pieces$0.251000 - 9999 pieces$0.24>= 10000 pieces$0.23"
const parseAlibabaPriceRanges = (priceString) => {
  if (!priceString || typeof priceString !== 'string') {
    return [];
  }

  const priceRanges = [];
  
  // 改进的正则表达式，更精确地匹配价格段
  // 匹配格式：
  // 1. "数字 - 数字 pieces$价格" (有范围)
  // 2. ">= 数字 pieces$价格" (无上限)
  // 3. "数字 pieces$价格" (单个数量)
  
  // 先预处理字符串，在价格段之间添加分隔符
  let processedString = priceString;
  
  // 在 pieces$数字 后面如果紧跟数字（但不是小数点后的数字），则添加空格
  // 使用更精确的正则表达式，避免在小数点后添加空格
  processedString = processedString.replace(/pieces\$[\d.]+(?=\d+\s*-|\d+\s*pieces|>=)/g, match => match + ' ');
  
  const regex = /(>=\s*\d+\s*pieces\$[\d.]+|\d+\s*-\s*\d+\s*pieces\$[\d.]+|\d+\s*pieces\$[\d.]+)/g;
  const segments = processedString.match(regex) || [];

  segments.forEach((segment, index) => {
    try {
      // 提取价格
      const priceMatch = segment.match(/\$([\d.]+)/);
      if (!priceMatch) return;
      
      const price = parseFloat(priceMatch[1]);
      if (isNaN(price)) return;

      // 提取数量范围
      let minQuantity = null;
      let maxQuantity = null;

      // 处理 ">= 数字" 格式
      const geMatch = segment.match(/>=\s*(\d+)/);
      if (geMatch) {
        minQuantity = parseInt(geMatch[1]);
        maxQuantity = null; // 无上限
      } else {
        // 处理 "数字 - 数字" 格式
        const rangeMatch = segment.match(/(\d+)\s*-\s*(\d+)/);
        if (rangeMatch) {
          minQuantity = parseInt(rangeMatch[1]);
          maxQuantity = parseInt(rangeMatch[2]);
        } else {
          // 处理单个数字格式
          const singleMatch = segment.match(/(\d+)/);
          if (singleMatch) {
            minQuantity = parseInt(singleMatch[1]);
            maxQuantity = null; // 单个数量默认无上限，后续会调整
          }
        }
      }

      if (minQuantity !== null) {
        priceRanges.push({
          min_quantity: minQuantity,
          max_quantity: maxQuantity,
          price: price,
          sort_order: index
        });
      }
    } catch (error) {
      console.warn('解析价格段失败:', segment, error);
    }
  });

  // 排序并调整范围
  priceRanges.sort((a, b) => a.min_quantity - b.min_quantity);
  
  // 调整相邻范围的边界，确保没有重叠和遗漏
  for (let i = 0; i < priceRanges.length - 1; i++) {
    const current = priceRanges[i];
    const next = priceRanges[i + 1];
    
    // 如果当前范围没有上限，设置为下一个范围的最小值减1
    if (current.max_quantity === null) {
      current.max_quantity = next.min_quantity - 1;
    }
    
    // 确保范围连续，如果有间隙，调整当前范围的上限
    if (current.max_quantity < next.min_quantity - 1) {
      current.max_quantity = next.min_quantity - 1;
    }
  }

  return priceRanges;
};

// 从1688导入产品
exports.importFrom1688 = async (req, res) => {
  const connection = await getConnection();
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

    // 解析阶梯价格
    const priceRanges = parseAlibabaPriceRanges(price);
    
    // 解析价格，提取第一个价格值（用作产品基础价格）
    const parsedPrice = parseFirstPrice(price);

    // 生成产品编号
    const productCode = `1688-${productId || Date.now()}`;
    
    // 确定分类ID
    let categoryId = 1; // 默认分类ID
    
    // 优先使用传入的category_id
    if (category_id && !isNaN(parseInt(category_id))) {
      // 验证category_id是否存在
      const categoryExists = await connection.query(
        'SELECT id FROM product_categories WHERE id = $1 AND deleted = false',
        [parseInt(category_id)]
      );
      if (categoryExists.getRowCount() > 0) {
        categoryId = parseInt(category_id);
      }
    } else if (category) {
      // 如果没有category_id，则通过category名称查找
      const existingCategory = await connection.query(
        'SELECT id FROM product_categories WHERE name = $1 AND deleted = false',
        [category]
      );
      if (existingCategory.getRowCount() > 0) {
        categoryId = existingCategory.getFirstRow().id;
      }
    }

    const currentUserId = req.userId;

    // 创建产品
    const result = await connection.query(
      `INSERT INTO products (
        name, product_code, category_id, price, stock, status, product_type,
        short_description, full_description, deleted, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, $10, $11) RETURNING id, guid`,
      [
        title,
        productCode,
        categoryId,
        parsedPrice,
        parseInt(minOrderQuantity) || 0,
        'on_shelf', // 默认上架
        'consignment', // 1688导入的产品默认为代销
        `供应商: ${supplierName || '未知'} | 位置: ${supplierLocation || '未知'} | 最小起订量: ${minOrderQuantity || '1'} ${unit || '件'}`,
        description || '',
        currentUserId,
        currentUserId
      ]
    );

    const productId_new = result.getFirstRow().id;

    // 保存阶梯价格到 product_price_ranges 表
    if (priceRanges && priceRanges.length > 0) {
      for (const range of priceRanges) {
        await connection.query(
          `INSERT INTO product_price_ranges (
            product_id, min_quantity, max_quantity, price, sort_order, created_by, updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            productId_new,
            range.min_quantity,
            range.max_quantity,
            range.price,
            range.sort_order,
            currentUserId,
            currentUserId
          ]
        );
      }
    }

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
        price: parsedPrice,
        stock: parseInt(minOrderQuantity) || 0,
        guid: result.getFirstRow().guid,
        source_url: url,
        price_ranges: priceRanges,
        price_ranges_count: priceRanges ? priceRanges.length : 0
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
    const rows = await query(`
      SELECT p.*, c.name as category_name,
        (SELECT JSON_AGG(image_url) FROM product_images WHERE product_id = p.id AND deleted = false) as gallery_urls
      FROM products p 
      LEFT JOIN product_categories c ON p.category_id = c.id 
      WHERE p.category_id = $1 AND p.deleted = false AND p.status = 'on_shelf'
    `, [categoryId]);

    // 处理gallery_urls
    const products = rows.getRows().map(product => ({
      ...product,
      gallery_urls: product.gallery_urls || []
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

// 模糊查询产品（用于询价单添加产品）
exports.searchProducts = async (req, res) => {
  try {
    const { keyword, limit = 10 } = req.query;
    
    if (!keyword || keyword.trim().length === 0) {
      return res.json({
        success: true,
        message: getMessage('PRODUCT.SEARCH_SUCCESS'),
        data: []
      });
    }

    const trimmedKeyword = keyword.trim();
    const searchLimit = Math.min(parseInt(limit), 50); // 限制最大返回50条

    const rows = await query(`
      SELECT p.id, p.guid, p.name, p.product_code, p.price, p.stock, p.status,
        c.name as category_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND image_type = 0 AND deleted = false ORDER BY sort_order ASC, id ASC LIMIT 1) as thumbnail_url
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      WHERE p.deleted = false 
        AND p.status = 'on_shelf'
        AND (p.name ILIKE $1 OR p.product_code ILIKE $1)
      ORDER BY 
        CASE 
          WHEN p.name ILIKE $2 THEN 1
          WHEN p.product_code ILIKE $2 THEN 2
          ELSE 3
        END,
        p.sort_order DESC,
        p.id DESC
      LIMIT $3
    `, [`%${trimmedKeyword}%`, `${trimmedKeyword}%`, searchLimit]);

    const products = rows.getRows().map(product => ({
      id: product.id,
      guid: product.guid,
      name: product.name,
      product_code: product.product_code,
      price: product.price,
      stock: product.stock,
      status: product.status,
      category_name: product.category_name,
      thumbnail_url: product.thumbnail_url || ''
    }));

    res.json({
      success: true,
      message: getMessage('PRODUCT.SEARCH_SUCCESS'),
      data: products
    });
  } catch (error) {
    console.error('产品搜索失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT.SEARCH_FAILED'),
      data: []
    });
  }
};

// 根据产品ID和数量获取对应的价格
exports.getPriceByQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.query;

    if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quantity parameter'
      });
    }

    const qty = parseInt(quantity);

    // 查询产品是否存在
    const productExists = await query(
      'SELECT id, price FROM products WHERE id = $1 AND deleted = false',
      [productId]
    );

    if (productExists.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('PRODUCT.NOT_FOUND')
      });
    }

    // 查询阶梯价格
    const priceRanges = await query(
      'SELECT min_quantity, max_quantity, price FROM product_price_ranges WHERE product_id = $1 ORDER BY min_quantity ASC',
      [productId]
    );

    let finalPrice = productExists.getFirstRow().price; // 默认使用产品表中的价格

    // 如果有阶梯价格，则根据数量匹配对应价格
    if (priceRanges.getRowCount() > 0) {
      const matchedPrice = getPriceByQuantity(priceRanges.getRows(), qty);
      if (matchedPrice !== null) {
        finalPrice = matchedPrice;
      }
    }

    res.json({
      success: true,
      message: 'Price retrieved successfully',
      data: {
        product_id: productId,
        quantity: qty,
        price: finalPrice,
        price_ranges: priceRanges.getRows()
      }
    });
  } catch (error) {
    console.error('获取产品价格失败:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product price'
    });
  }
};

// 获取产品的关联商品
exports.getProductLinks = async (req, res) => {
  try {
    const { productId } = req.params;
    const { linkType = 'buy_together' } = req.query;

    // 查询产品是否存在
    const productExists = await query(
      'SELECT id FROM products WHERE id = $1 AND deleted = false',
      [productId]
    );

    if (productExists.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('PRODUCT.NOT_FOUND')
      });
    }

    // 查询关联商品
    const links = await query(`
      SELECT 
        pl.id,
        pl.link_product_id,
        pl.link_type,
        pl.sort_order,
        p.name as link_product_name,
        p.product_code as link_product_code,
        p.price as link_product_price,
        p.status as link_product_status,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND image_type = 0 AND deleted = false ORDER BY sort_order ASC, id ASC LIMIT 1) as link_product_thumbnail
      FROM product_links pl
      LEFT JOIN products p ON pl.link_product_id = p.id
      WHERE pl.product_id = $1 
        AND pl.link_type = $2 
        AND pl.deleted = false 
        AND p.deleted = false
      ORDER BY pl.sort_order ASC, pl.id ASC
    `, [productId, linkType]);

    res.json({
      success: true,
      message: 'Product links retrieved successfully',
      data: links.getRows()
    });
  } catch (error) {
    console.error('获取产品关联失败:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product links'
    });
  }
};

// 添加产品关联
exports.addProductLink = async (req, res) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const { productId } = req.params;
    const { links, linkProductId, linkType = 'buy_together', sortOrder = 0 } = req.body;

    // 验证主产品是否存在
    const productExists = await connection.query(
      'SELECT id FROM products WHERE id = $1 AND deleted = false',
      [productId]
    );

    if (productExists.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('PRODUCT.NOT_FOUND')
      });
    }

    const { v4: uuidv4 } = require('uuid');
    const addedLinks = [];

    // 支持批量添加（新格式）
    if (links && Array.isArray(links) && links.length > 0) {
      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        const currentLinkProductId = link.link_product_id || link.linkProductId;
        const currentLinkType = link.link_type || linkType;
        const currentSortOrder = link.sort_order !== undefined ? link.sort_order : i;

        // 验证关联产品是否存在
        const linkProductExists = await connection.query(
          'SELECT id FROM products WHERE id = $1 AND deleted = false',
          [currentLinkProductId]
        );

        if (linkProductExists.getRowCount() === 0) {
          console.warn(`Link product ${currentLinkProductId} not found, skipping`);
          continue;
        }

        // 检查是否已存在相同的关联
        const existingLink = await connection.query(
          'SELECT id FROM product_links WHERE product_id = $1 AND link_product_id = $2 AND link_type = $3 AND deleted = false',
          [productId, currentLinkProductId, currentLinkType]
        );

        if (existingLink.getRowCount() > 0) {
          console.warn(`Product link already exists for ${currentLinkProductId}, skipping`);
          continue;
        }

        // 生成GUID并添加产品关联
        const guid = uuidv4();
        const result = await connection.query(
          `INSERT INTO product_links (
            guid, product_id, link_product_id, link_type, sort_order, 
            created_by, updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [guid, productId, currentLinkProductId, currentLinkType, currentSortOrder, req.userId, req.userId]
        );

        addedLinks.push({
          id: result.getFirstRow().id,
          product_id: productId,
          link_product_id: currentLinkProductId,
          link_type: currentLinkType,
          sort_order: currentSortOrder
        });
      }
    } 
    // 兼容单个添加（旧格式）
    else if (linkProductId) {
      // 验证关联产品是否存在
      const linkProductExists = await connection.query(
        'SELECT id FROM products WHERE id = $1 AND deleted = false',
        [linkProductId]
      );

      if (linkProductExists.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: 'Link product not found'
        });
      }

      // 检查是否已存在相同的关联
      const existingLink = await connection.query(
        'SELECT id FROM product_links WHERE product_id = $1 AND link_product_id = $2 AND link_type = $3 AND deleted = false',
        [productId, linkProductId, linkType]
      );

      if (existingLink.getRowCount() > 0) {
        return res.status(400).json({
          success: false,
          message: 'Product link already exists'
        });
      }

      // 生成GUID并添加产品关联
      const guid = uuidv4();
      const result = await connection.query(
        `INSERT INTO product_links (
          guid, product_id, link_product_id, link_type, sort_order, 
          created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [guid, productId, linkProductId, linkType, sortOrder, req.userId, req.userId]
      );

      addedLinks.push({
        id: result.getFirstRow().id,
        product_id: productId,
        link_product_id: linkProductId,
        link_type: linkType,
        sort_order: sortOrder
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'No valid link data provided'
      });
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: `${addedLinks.length} product link(s) added successfully`,
      data: addedLinks
    });
  } catch (error) {
    await connection.rollback();
    console.error('添加产品关联失败:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add product link'
    });
  } finally {
    connection.release();
  }
};

// 删除产品关联
exports.deleteProductLink = async (req, res) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const { productId, linkId } = req.params;

    // 检查关联是否存在
    const existing = await connection.query(
      'SELECT id FROM product_links WHERE id = $1 AND product_id = $2 AND deleted = false',
      [linkId, productId]
    );

    if (existing.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product link not found'
      });
    }

    // 软删除产品关联
    await connection.query(
      'UPDATE product_links SET deleted = true, updated_by = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [req.userId, linkId]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Product link deleted successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('删除产品关联失败:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product link'
    });
  } finally {
    connection.release();
  }
};

// 批量更新产品关联
exports.updateProductLinks = async (req, res) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const { productId } = req.params;
    const { links, linkType = 'buy_together' } = req.body;

    // 验证主产品是否存在
    const productExists = await connection.query(
      'SELECT id FROM products WHERE id = $1 AND deleted = false',
      [productId]
    );

    if (productExists.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('PRODUCT.NOT_FOUND')
      });
    }

    // 删除现有的关联（软删除）
    await connection.query(
      'UPDATE product_links SET deleted = true, updated_by = $1, updated_at = CURRENT_TIMESTAMP WHERE product_id = $2 AND link_type = $3',
      [req.userId, productId, linkType]
    );

    // 添加新的关联
    if (links && Array.isArray(links) && links.length > 0) {
      const { v4: uuidv4 } = require('uuid');
      
      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        
        // 验证关联产品是否存在
        const linkProductExists = await connection.query(
          'SELECT id FROM products WHERE id = $1 AND deleted = false',
          [link.linkProductId]
        );

        if (linkProductExists.getRowCount() > 0) {
          const guid = uuidv4();
          await connection.query(
            `INSERT INTO product_links (
              guid, product_id, link_product_id, link_type, sort_order, 
              created_by, updated_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [guid, productId, link.linkProductId, linkType, i, req.userId, req.userId]
          );
        }
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Product links updated successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('更新产品关联失败:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product links'
    });
  } finally {
    connection.release();
  }
};