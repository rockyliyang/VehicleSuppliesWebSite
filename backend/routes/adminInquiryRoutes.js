const express = require('express');
const router = express.Router();
const adminInquiryController = require('../controllers/adminInquiryController');
const { verifyToken, verifyAdmin } = require('../middleware/jwt');

// 所有管理员询价路由都需要管理员权限验证
router.use(verifyAdmin);

// 获取所有询价列表（管理员）
// GET /api/admin/inquiries?page=1&limit=10&status=pending&userId=123&startDate=2024-01-01&endDate=2024-12-31
router.get('/', adminInquiryController.getAllInquiries);

// 获取询价详情（管理员）
// GET /api/admin/inquiries/:inquiryId
router.get('/:inquiryId', adminInquiryController.getInquiryDetail);

// 更新单个商品报价（管理员）
// PUT /api/admin/inquiries/items/:itemId/quote
router.put('/items/:itemId/quote', adminInquiryController.updateItemQuote);

// 批量更新商品报价（管理员）
// PUT /api/admin/inquiries/items/batch-quote
router.put('/items/batch-quote', adminInquiryController.batchUpdateItemQuotes);

// 发送询价消息（管理员）
// POST /api/admin/inquiries/:inquiryId/messages
router.post('/:inquiryId/messages', adminInquiryController.sendMessage);

// 标记消息为已读（管理员）
// PUT /api/admin/inquiries/:inquiryId/messages/read
router.put('/:inquiryId/messages/read', adminInquiryController.markMessagesAsRead);

// 更新询价状态（管理员）
// PUT /api/admin/inquiries/:inquiryId/status
router.put('/:inquiryId/status', adminInquiryController.updateInquiryStatus);

// 获取询价统计信息（管理员）
// GET /api/admin/inquiries/stats/overview?startDate=2024-01-01&endDate=2024-12-31
router.get('/stats/overview', adminInquiryController.getInquiryStats);

// 删除询价（管理员）
// DELETE /api/admin/inquiries/:inquiryId
router.delete('/:inquiryId', adminInquiryController.deleteInquiry);

// 导出询价数据（管理员）
// GET /api/admin/inquiries/export/data?startDate=2024-01-01&endDate=2024-12-31&status=pending&format=csv
router.get('/export/data', adminInquiryController.exportInquiries);

module.exports = router;