const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middleware/jwt');

// 所有订单路由都需要用户认证
router.use(verifyToken);

// 创建订单
router.post('/', orderController.createOrder);

// 处理支付
router.post('/payment', orderController.processPayment);

// 获取用户订单列表
router.get('/', orderController.getOrders);

// 获取订单详情
router.get('/:orderId', orderController.getOrderDetail);

// 生成二维码
router.post('/qrcode', orderController.generateQrcode);

// 检查支付状态
router.post('/check-status', orderController.checkPaymentStatus);

module.exports = router;