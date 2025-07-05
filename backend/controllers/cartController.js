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
    
    const cartItems = await query(queryStr, [userId]);
    if (cartItems.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('CART.EMPTY')
      });
    } 
    // 计算总价
    let totalPrice = 0;
    cartItems.getRows().forEach(item => {
      totalPrice += item.price * item.quantity;
    });
    
    return res.json({
      success: true,
      data: {
        items: cartItems.getRows(),
        totalPrice: totalPrice
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
    const { productId, quantity = 1 } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: getMessage('CART.PRODUCT_ID_REQUIRED')
      });
    }
    
    // 检查商品是否存在且有库存
    const product = await query('SELECT id, stock FROM products WHERE id = $1 AND deleted = false', [productId]);
    
    if (!product || product.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('CART.PRODUCT_NOT_FOUND')
      });
    }
    
    if (product.getFirstRow().stock < quantity) {
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
      // 更新数量
      const newQuantity = existingItem.getFirstRow().quantity + quantity;
      await query(
        'UPDATE cart_items SET quantity = $1, updated_by = $2, updated_at = NOW() WHERE id = $3',
        [newQuantity, userId, existingItem.getFirstRow().id]
      );
      
      return res.json({
        success: true,
        message: getMessage('CART.UPDATE_SUCCESS'),
        data: { id: existingItem.getFirstRow().id, quantity: newQuantity }
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
      `SELECT ci.id, ci.product_id, p.stock 
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
    
    // 检查库存
    if (cartItem.getFirstRow().stock < quantity) {
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