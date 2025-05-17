const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { verifyToken } = require('../middleware/jwt');

// 所有购物车路由都需要用户登录
router.use(verifyToken);

// 获取用户购物车
router.get('/', cartController.getUserCart);

// 获取购物车商品数量
router.get('/count', cartController.getCartCount);

// 添加商品到购物车
router.post('/add', cartController.addToCart);

// 更新购物车商品数量
router.put('/item/:cartItemId', cartController.updateCartItem);

// 从购物车中删除商品
router.delete('/item/:cartItemId', cartController.removeFromCart);

// 清空购物车
router.delete('/clear', cartController.clearCart);

module.exports = router;