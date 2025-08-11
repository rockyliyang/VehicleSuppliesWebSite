const { query } = require('../db/db');
const { v4: uuidv4 } = require('uuid');
const { getMessage } = require('../config/messages');

// 获取用户购物车
exports.getUserCart = async (req, res) => {
  try {
    const userId = req.userId;
    
    // 查询用户购物车中的商品
    const queryStr = `SELECT ci.id, ci.guid, ci.quantity, 
             p.id as product_id, p.name, p.product_code, p.price, p.stock, 
             (SELECT image_url FROM product_images WHERE product_id = p.id AND deleted = false ORDER BY sort_order ASC LIMIT 1) as image_url
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1 AND ci.deleted = false AND p.deleted = false
      ORDER BY ci.created_at DESC`;
    
    const result = await query(queryStr, [userId]);
    
    if (!result || result.getRowCount() === 0) {
      return res.json({
        success: true,
        data: {
          items: []
        }
      });
    }
    
    const items = result.getRows();
    
    // 一次性查询所有商品的阶梯价格信息
    if (items.length > 0) {
      const productIds = items.map(item => item.product_id);
      const priceRangesResult = await query(
        'SELECT product_id, min_quantity, max_quantity, price FROM product_price_ranges WHERE product_id = ANY($1) AND deleted = false ORDER BY product_id, min_quantity ASC',
        [productIds]
      );
      
      // 将价格范围按产品ID分组
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
      
      // 为每个商品添加价格范围信息
      items.forEach(item => {
        item.price_ranges = priceRangesMap[item.product_id] || [];
      });
    }
    
    return res.json({
      success: true,
      data: {
        items
      }
    });
  } catch (error) {
    console.error('获取购物车失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('CART.GET_FAILED')
    });
  }
};



// 添加商品到购物车
exports.addToCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId } = req.body;
    const quantity = 1;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: getMessage('CART.PRODUCT_ID_REQUIRED')
      });
    }
    
    // 检查商品是否存在
    const product = await query('SELECT id, stock, product_type FROM products WHERE id = $1 AND deleted = false', [productId]);
    
    if (!product || product.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('CART.PRODUCT_NOT_FOUND')
      });
    }
    
    // 只对自营商品检查库存
    const productData = product.getFirstRow();
    if (productData.product_type === 'self_operated' && productData.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: getMessage('CART.INSUFFICIENT_STOCK')
      });
    }
    
    // 检查购物车中是否已有该商品
    const existingItem = await query(
      'SELECT id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2 AND deleted = false',
      [userId, productId]
    );
    
    if (existingItem && existingItem.getRowCount() > 0) {
      // 商品已存在，不修改数量，直接返回成功
      return res.json({
        success: true,
        message: getMessage('CART.ADD_SUCCESS'),
        data: { id: existingItem.getFirstRow().id, quantity: existingItem.getFirstRow().quantity }
      });
    } else {
      // 添加新商品到购物车
      const result = await query(
        'INSERT INTO cart_items (user_id, product_id, quantity, created_by, updated_by) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [userId, productId, quantity, userId, userId]
      );
      
      return res.json({
        success: true,
        message: getMessage('CART.ADD_SUCCESS'),
        data: { id: result.getFirstRow().id, quantity }
      });
    }
  } catch (error) {
    console.error('添加到购物车失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('CART.ADD_FAILED')
    });
  }
};

// 更新购物车商品数量
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.userId;
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: getMessage('CART.QUANTITY_INVALID')
      });
    }
    
    // 检查购物车项是否存在且属于当前用户
    const cartItem = await query(
      `SELECT ci.id, ci.product_id, p.stock, p.product_type 
       FROM cart_items ci 
       JOIN products p ON ci.product_id = p.id 
       WHERE ci.id = $1 AND ci.user_id = $2 AND ci.deleted = false`,
      [cartItemId, userId]
    );
    
    if (!cartItem || cartItem.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('CART.ITEM_NOT_FOUND')
      });
    }
    
    // 只对自营商品检查库存
    const cartItemData = cartItem.getFirstRow();
    if (cartItemData.product_type === 'self_operated' && cartItemData.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: getMessage('CART.INSUFFICIENT_STOCK')
      });
    }
    
    // 更新数量
    await query(
      'UPDATE cart_items SET quantity = $1, updated_by = $2, updated_at = NOW() WHERE id = $3',
      [quantity, userId, cartItemId]
    );
    
    return res.json({
      success: true,
      message: getMessage('CART.UPDATE_SUCCESS'),
      data: { id: cartItemId, quantity }
    });
  } catch (error) {
    console.error('更新购物车失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('CART.UPDATE_FAILED')
    });
  }
};

// 从购物车中删除商品
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { cartItemId } = req.params;
    
    // 检查购物车项是否存在且属于当前用户
    const cartItem = await query(
      'SELECT id FROM cart_items WHERE id = $1 AND user_id = $2 AND deleted = false',
      [cartItemId, userId]
    );
    
    if (!cartItem || cartItem.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('CART.ITEM_NOT_FOUND')
      });
    }
    
    // 软删除购物车项
    await query(
      'UPDATE cart_items SET deleted = true, updated_by = $1, updated_at = NOW() WHERE id = $2',
      [userId, cartItemId]
    );
    
    return res.json({
      success: true,
      message: getMessage('CART.REMOVE_SUCCESS')
    });
  } catch (error) {
    console.error('从购物车移除商品失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('CART.REMOVE_FAILED')
    });
  }
};

// 清空购物车
exports.clearCart = async (req, res) => {
  try {
    const userId = req.userId;
    
    // 软删除用户的所有购物车项
    await query(
      'UPDATE cart_items SET deleted = true, updated_by = $1, updated_at = NOW() WHERE user_id = $2 AND deleted = false',
      [userId, userId]
    );
    
    return res.json({
      success: true,
      message: getMessage('CART.CLEAR_SUCCESS')
    });
  } catch (error) {
    console.error('清空购物车失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('CART.CLEAR_FAILED')
    });
  }
};

// 获取购物车商品数量
exports.getCartCount = async (req, res) => {
  try {
    const userId = req.userId;
    
    const result = await query(
      'SELECT COUNT(*) as count FROM cart_items WHERE user_id = $1 AND deleted = false',
      [userId]
    );
    
    return res.json({
      success: true,
      data: { count: result.getFirstRow().count }
    });
  } catch (error) {
    console.error('获取购物车数量失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('CART.COUNT_GET_FAILED')
    });
  }
};