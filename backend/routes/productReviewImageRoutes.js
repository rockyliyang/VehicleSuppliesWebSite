const express = require('express');
const router = express.Router();
const productReviewImageController = require('../controllers/productReviewImageController');
const { authenticateToken, requireRole } = require('../middleware/jwt');

// 公开路由（不需要认证）
// 获取评论图片列表（只显示已审核通过的评论图片）
router.get('/review/:review_id', productReviewImageController.getReviewImages);

// 获取单个图片详情
router.get('/:id', productReviewImageController.getReviewImage);

// 需要用户认证的路由
router.use(authenticateToken);

// 用户图片操作
// 上传评论图片
router.post('/upload', productReviewImageController.uploadReviewImages);

// 分配评论图片（将session_id关联的图片分配给评论）
router.post('/assign', productReviewImageController.assignReviewImages);

// 更新图片排序
router.put('/review/:review_id/order', productReviewImageController.updateImageOrder);

// 删除单个图片
router.delete('/:id', productReviewImageController.deleteReviewImage);

// 批量删除图片
router.delete('/batch', productReviewImageController.batchDeleteReviewImages);

module.exports = router;