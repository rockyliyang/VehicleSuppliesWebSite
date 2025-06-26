const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middleware/jwt');

// 所有订单路由都需要用户认证
router.use(verifyToken);

// POST方法已删除 - 不再使用直接创建订单的API

// 获取用户订单列表
router.get('/', orderController.getOrders);

// 获取订单详情
router.get('/:orderId', orderController.getOrderDetail);

module.exports = router;