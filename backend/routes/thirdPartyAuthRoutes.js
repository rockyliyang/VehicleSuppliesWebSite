const express = require('express');
const router = express.Router();
const ThirdPartyAuthController = require('../controllers/thirdPartyAuthController');
const { verifyToken } = require('../middleware/jwt');
// 暂时移除 express-rate-limit 以解决网络连接问题
// const rateLimit = require('express-rate-limit');

const controller = new ThirdPartyAuthController();

// 暂时禁用限流配置以解决 X-Forwarded-For 头冲突问题
// 第三方登录限流配置
// const thirdPartyLoginLimiter = rateLimit({...});

// 账号绑定/解绑限流配置
// const bindingLimiter = rateLimit({...});

// 第三方登录回调路由（暂时移除限流中间件）
router.post('/apple/callback', (req, res) => {
  controller.appleCallback(req, res);
});

router.post('/google/callback', (req, res) => {
  controller.googleCallback(req, res);
});

router.post('/facebook/callback', (req, res) => {
  controller.facebookCallback(req, res);
});

// 账号绑定/解绑路由（需要登录，暂时移除限流中间件）
router.post('/bind-third-party', verifyToken, (req, res) => {
  controller.bindThirdPartyAccount(req, res);
});

router.delete('/unbind-third-party', verifyToken, (req, res) => {
  controller.unbindThirdPartyAccount(req, res);
});

// 获取用户第三方账号绑定状态
router.get('/third-party-status', verifyToken, (req, res) => {
  controller.getThirdPartyStatus(req, res);
});

// 获取用户绑定的第三方账号信息（保持向后兼容）
router.get('/bound-accounts', verifyToken, (req, res) => {
  controller.getThirdPartyStatus(req, res);
});

module.exports = router;