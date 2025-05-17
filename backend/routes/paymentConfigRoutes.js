const express = require('express');
const router = express.Router();
const paymentConfigController = require('../controllers/paymentConfigController');
const { authenticateJWT } = require('../middleware/authMiddleware');

// 获取支付配置信息 - 不需要认证，因为在结算页面加载时就需要获取
router.get('/config', paymentConfigController.getPaymentConfig);

module.exports = router;