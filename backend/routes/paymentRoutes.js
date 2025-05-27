const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/jwt');

// 所有支付路由都需要用户认证（除了回调接口）
router.use('/callback', (req, res, next) => next()); // 跳过回调接口的认证
router.use((req, res, next) => {
  if (req.path.startsWith('/callback')) {
    return next();
  }
  return verifyToken(req, res, next);
});

// PayPal相关接口
router.post('/paypal/create', paymentController.createPayPalOrder);
router.post('/paypal/capture', paymentController.capturePayPalPayment);

// 普通支付相关接口
router.post('/common/create', paymentController.createCommonOrder);
router.post('/qrcode', paymentController.generateQrcode);
router.post('/check-status', paymentController.checkPaymentStatus);

// 支付回调接口
router.post('/callback/wechat', paymentController.paymentCallback);
router.post('/callback/alipay', paymentController.paymentCallback);

module.exports = router; 