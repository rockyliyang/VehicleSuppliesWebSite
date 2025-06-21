const express = require('express');
const router = express.Router();
const inquiryController = require('../controllers/inquiryController');
const { verifyToken } = require('../middleware/jwt');

// 所有询价路由都需要用户登录
router.use(verifyToken);

// 获取用户询价列表
router.get('/', inquiryController.getUserInquiries);

// 获取询价详情
router.get('/:inquiryId', inquiryController.getInquiryDetail);

// 创建新询价
router.post('/', inquiryController.createInquiry);

// 添加商品到询价
router.post('/:inquiryId/items', inquiryController.addItemToInquiry);

// 发送询价消息
router.post('/:inquiryId/messages', inquiryController.sendMessage);

// 删除询价单中的商品
router.delete('/:inquiryId/items/:itemId', inquiryController.removeItemFromInquiry);

// 删除询价
router.delete('/:inquiryId', inquiryController.deleteInquiry);

module.exports = router;