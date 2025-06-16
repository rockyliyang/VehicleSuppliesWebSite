const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { verifyToken, isAdmin } = require('../middleware/jwt');

/**
 * 联系消息路由
 * 处理联系表单提交、消息管理等功能的路由
 */

// 获取验证码 - 无需登录
router.post('/verification-code', (req, res) => contactController.getVerificationCode(req, res));

// 提交联系消息 - 支持登录和未登录用户
router.post('/messages', (req, res, next) => {
  // 可选的token验证，如果有token则验证，没有则跳过
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    verifyToken(req, res, next);
  } else {
    next();
  }
}, (req, res) => contactController.submitMessage(req, res));

// 管理员路由 - 联系消息管理
router.get('/admin/messages', verifyToken, isAdmin, (req, res) => contactController.getMessageList(req, res));
router.get('/admin/messages/:id', verifyToken, isAdmin, (req, res) => contactController.getMessageDetail(req, res));
router.patch('/admin/messages/:id/status', verifyToken, isAdmin, (req, res) => contactController.updateMessageStatus(req, res));
router.patch('/admin/messages/:id/assign', verifyToken, isAdmin, (req, res) => contactController.assignMessage(req, res));
router.delete('/admin/messages/:id', verifyToken, isAdmin, (req, res) => contactController.deleteMessage(req, res));

// 业务人员路由 - 联系消息管理（仅限分配给自己组的消息）
router.get('/business/messages', verifyToken, (req, res, next) => {
  // 验证用户角色为业务人员或管理员
  if (!['business', 'admin'].includes(req.userRole)) {
    return res.status(403).json({
      success: false,
      message: 'CONTACT.ACCESS_DENIED',
      data: null
    });
  }
  next();
}, (req, res) => contactController.getMessageList(req, res));

router.get('/business/messages/:id', verifyToken, (req, res, next) => {
  // 验证用户角色为业务人员或管理员
  if (!['business', 'admin'].includes(req.userRole)) {
    return res.status(403).json({
      success: false,
      message: 'CONTACT.ACCESS_DENIED',
      data: null
    });
  }
  next();
}, (req, res) => contactController.getMessageDetail(req, res));

router.patch('/business/messages/:id/status', verifyToken, (req, res, next) => {
  // 验证用户角色为业务人员或管理员
  if (!['business', 'admin'].includes(req.userRole)) {
    return res.status(403).json({
      success: false,
      message: 'CONTACT.ACCESS_DENIED',
      data: null
    });
  }
  next();
}, (req, res) => contactController.updateMessageStatus(req, res));

module.exports = router;