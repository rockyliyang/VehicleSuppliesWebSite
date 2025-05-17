const express = require('express');
const router = express.Router();
const paypalController = require('../controllers/paypalController');
const { verifyToken } = require('../middleware/jwt');

// 所有PayPal相关接口都需要JWT认证
router.use(verifyToken);

// 创建PayPal支付订单
router.post('/create-order', paypalController.createPayPalOrder);

// 捕获PayPal支付
router.post('/capture-payment', paypalController.capturePayPalPayment);

// 验证PayPal支付状态
router.get('/verify/:paypalOrderId', paypalController.verifyPayPalPayment);

module.exports = router;