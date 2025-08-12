const express = require('express');
const router = express.Router();
const productReviewController = require('../controllers/productReviewController');
const { verifyToken, isAdmin, requireRole } = require('../middleware/jwt');

// 获取产品评论列表（公开接口）
router.get('/', productReviewController.getProductReviews);

// 获取产品评论统计（公开接口）
router.get('/stats/:productId', productReviewController.getReviewStats);

// 创建评论（需要登录，但管理员不能评论）
router.post('/', verifyToken, requireRole(['user']), productReviewController.createReview);

// 更新评论（需要登录，只能修改自己的评论）
router.put('/:id', verifyToken, requireRole(['user']), productReviewController.updateReview);

// 删除评论（需要登录，用户只能删除自己的评论，管理员可以删除所有评论）
router.delete('/:id', verifyToken, productReviewController.deleteReview);

// 管理员审核评论
router.put('/:id/approve', verifyToken, isAdmin, productReviewController.approveReview);

// 管理员回复评论
router.put('/:id/reply', verifyToken, isAdmin, productReviewController.replyToReview);

module.exports = router;