/**
 * 管理员统计数据路由
 * 提供管理员控制面板所需的各种统计数据接口
 */

const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin, requireRole } = require('../middleware/jwt');
const adminStatsController = require('../controllers/adminStatsController');

// 管理员专用路由
router.use('/dashboard', verifyToken, isAdmin);
router.use('/recent-products', verifyToken, isAdmin);
router.use('/recent-inquiries', verifyToken, isAdmin);

// 业务员专用路由
router.use('/business-dashboard', verifyToken, requireRole(['admin', 'business']));

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

/**
 * 获取业务员工作台统计数据
 * GET /api/admin/stats/business-dashboard
 */
router.get('/business-dashboard', adminStatsController.getBusinessDashboardStats);

module.exports = router;