const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/jwt');
const userProductController = require('../controllers/userProductController');

// 添加用户产品关联（收藏或浏览历史）
router.post('/user-products', verifyToken, userProductController.addUserProduct);

// 获取用户产品列表（收藏或浏览历史）
router.get('/user-products', verifyToken, userProductController.getUserProducts);

// 删除用户产品关联
router.delete('/user-products/:id', verifyToken, userProductController.deleteUserProduct);

// 批量删除用户产品关联
router.delete('/user-products', verifyToken, userProductController.batchDeleteUserProducts);

// 检查用户是否收藏了某个产品
router.get('/user-products/check/:product_id', verifyToken, userProductController.checkUserProduct);

module.exports = router;