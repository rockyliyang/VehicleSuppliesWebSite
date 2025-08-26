const express = require('express');
const router = express.Router();
const orderManagementController = require('../controllers/orderManagementController');
const { verifyToken, isAdmin, requireRole } = require('../middleware/jwt');

/**
 * 订单管理路由
 * 处理订单查询、物流信息管理等功能的路由
 * 所有路由都需要登录验证，部分需要管理员权限
 */

// 订单管理相关路由 - 需要登录验证，管理员和业务员都可以访问
router.get('/orders', verifyToken, (req, res) => orderManagementController.getOrders(req, res));
router.get('/orders/:orderId', verifyToken, (req, res) => orderManagementController.getOrderDetail(req, res));
router.put('/orders/:orderId/logistics', verifyToken, (req, res) => orderManagementController.updateOrderLogistics(req, res));
router.put('/orders/:orderId/update', verifyToken, (req, res) => orderManagementController.updateOrderFields(req, res));

// 物流公司查询 - 需要登录验证
router.get('/logistics-companies', verifyToken, (req, res) => orderManagementController.getLogisticsCompanies(req, res));



module.exports = router;