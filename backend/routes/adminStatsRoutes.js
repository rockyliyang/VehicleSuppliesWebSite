/**
 * 管理员统计数据路由
 * 提供管理员控制面板所需的各种统计数据接口
 */

const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin, isAdmin } = require('../middleware/jwt');
const adminStatsController = require('../controllers/adminStatsController');

// 所有路由都需要管理员权限
router.use(verifyToken);
router.use(isAdmin);

/**
 * 获取管理员控制面板统计数据
 * GET /api/admin/stats/dashboard
 */
router.get('/dashboard', adminStatsController.getDashboardStats);

/**
 * 获取最新产品列表
 * GET /api/admin/stats/recent-products?limit=5
 */
router.get('/recent-products', adminStatsController.getRecentProducts);

/**
 * 获取最新询价列表
 * GET /api/admin/stats/recent-inquiries?limit=5
 */
router.get('/recent-inquiries', adminStatsController.getRecentInquiries);

module.exports = router;