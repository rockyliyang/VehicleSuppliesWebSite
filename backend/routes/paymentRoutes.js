const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/jwt');

// 所有支付路由都需要用户认证（除了回调接口和汇率接口）
router.use('/callback', (req, res, next) => next()); // 跳过回调接口的认证
router.use('/alipay/notify', (req, res, next) => next()); // 跳过支付宝异步通知的认证
router.use('/exchange-rate', (req, res, next) => next()); // 跳过汇率接口的认证
router.use((req, res, next) => {
  if (req.path.startsWith('/callback') || req.path.startsWith('/alipay/notify') || req.path.startsWith('/exchange-rate')) {
    return next();
  }
  return verifyToken(req, res, next);
});

// PayPal相关接口
router.post('/paypal/create', paymentController.createPayPalOrder);
router.post('/paypal/capture', paymentController.capturePayPalPayment);
router.post('/paypal/repay', paymentController.repayPayPalOrder);

// 普通支付相关接口
router.post('/common/create', paymentController.createCommonOrder);
router.post('/qrcode', paymentController.generateQrcode);
router.post('/check-status', paymentController.checkPaymentStatus);

// 支付回调接口
router.post('/callback/wechat', paymentController.paymentCallback);
router.post('/callback/alipay', paymentController.paymentCallback);

// 支付宝异步通知接口
router.post('/alipay/notify', paymentController.alipayNotify);

// 汇率相关接口
router.get('/exchange-rate', paymentController.getExchangeRate);

module.exports = router;