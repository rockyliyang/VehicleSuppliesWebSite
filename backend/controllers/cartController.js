const { pool } = require('../db/db');
const { v4: uuidv4 } = require('uuid');
const { uuidToBinary } = require('../utils/uuid');
const { getMessage } = require('../config/messages');

// 获取用户购物车
exports.getUserCart = async (req, res) => {
  try {
    const userId = req.userId;
    
    // 查询用户购物车中的商品
    const query = `SELECT ci.id, ci.guid, ci.quantity, 
             p.id as product_id, p.name, p.product_code, p.price, p.stock, 
             (SELECT image_url FROM product_images WHERE product_id = p.id AND deleted = 0 ORDER BY sort_order ASC LIMIT 1) as image_url
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ? AND ci.deleted = 0 AND p.deleted = 0
      ORDER BY ci.created_at DESC`;
    
    const [cartItems] = await pool.query(query, [userId]);
    if (cartItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('CART.EMPTY')
      });
    } 
    // 计算总价
    let totalPrice = 0;
    cartItems.forEach(item => {
      totalPrice += item.price * item.quantity;
    });
    
    return res.json({
      success: true,
      data: {
        items: cartItems,
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
    const product = await pool.query('SELECT id, stock FROM products WHERE id = ? AND deleted = 0', [productId]);
    
    if (!product || product.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('CART.PRODUCT_NOT_FOUND')
      });
    }
    
    if (product[0].stock < quantity) {
      return res.status(400).json({
        success: false,
        message: getMessage('CART.INSUFFICIENT_STOCK')
      });
    }
    
    // 检查购物车中是否已有该商品
    const [existingItem] = await pool.query(
      'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ? AND deleted = 0',
      [userId, productId]
    );
    
    if (existingItem && existingItem.length > 0) {
      // 更新数量
      const newQuantity = existingItem[0].quantity + quantity;
      await pool.query(
        'UPDATE cart_items SET quantity = ?, updated_by = ?, updated_at = NOW() WHERE id = ?',
        [newQuantity, userId, existingItem[0].id]
      );
      
      return res.json({
        success: true,
        message: getMessage('CART.UPDATE_SUCCESS'),
        data: { id: existingItem[0].id, quantity: newQuantity }
      });
    } else {
      // 添加新商品到购物车
      const guid = uuidToBinary(uuidv4());
      const [result] = await pool.query(
        'INSERT INTO cart_items (guid, user_id, product_id, quantity, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?)',
        [guid, userId, productId, quantity, userId, userId]
      );
      
      return res.json({
        success: true,
        message: getMessage('CART.ADD_SUCCESS'),
        data: { id: result.insertId, quantity }
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
    const [cartItem] = await pool.query(
      `SELECT ci.id, ci.product_id, p.stock 
       FROM cart_items ci 
       JOIN products p ON ci.product_id = p.id 
       WHERE ci.id = ? AND ci.user_id = ? AND ci.deleted = 0`,
      [cartItemId, userId]
    );
    
    if (!cartItem || cartItem.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('CART.ITEM_NOT_FOUND')
      });
    }
    
    // 检查库存
    if (cartItem[0].stock < quantity) {
      return res.status(400).json({
        success: false,
        message: getMessage('CART.INSUFFICIENT_STOCK')
      });
    }
    
    // 更新数量
    await pool.query(
      'UPDATE cart_items SET quantity = ?, updated_by = ?, updated_at = NOW() WHERE id = ?',
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
    const [cartItem] = await pool.query(
      'SELECT id FROM cart_items WHERE id = ? AND user_id = ? AND deleted = 0',
      [cartItemId, userId]
    );
    
    if (!cartItem || cartItem.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('CART.ITEM_NOT_FOUND')
      });
    }
    
    // 软删除购物车项
    await pool.query(
      'UPDATE cart_items SET deleted = 1, updated_by = ?, updated_at = NOW() WHERE id = ?',
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
    await pool.query(
      'UPDATE cart_items SET deleted = 1, updated_by = ?, updated_at = NOW() WHERE user_id = ? AND deleted = 0',
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
    
    const [result] = await pool.query(
      'SELECT COUNT(*) as count FROM cart_items WHERE user_id = ? AND deleted = 0',
      [userId]
    );
    
    return res.json({
      success: true,
      data: { count: result[0].count }
    });
  } catch (error) {
    console.error('获取购物车数量失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('CART.COUNT_GET_FAILED')
    });
  }
};