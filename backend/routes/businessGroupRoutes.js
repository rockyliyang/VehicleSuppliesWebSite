const express = require('express');
const router = express.Router();
const businessGroupController = require('../controllers/businessGroupController');
const { verifyToken, isAdmin } = require('../middleware/jwt');

/**
 * 业务组路由
 * 处理业务组创建、管理和用户分配等功能的路由
 * 所有路由都需要管理员权限
 */

// 业务组管理路由（仅管理员）
router.post('/', verifyToken, isAdmin, businessGroupController.createBusinessGroup);
router.get('/', verifyToken, isAdmin, businessGroupController.getBusinessGroupList);
router.get('/available-users', verifyToken, isAdmin, businessGroupController.getAvailableUsers);
router.get('/:id/available-users', verifyToken, isAdmin, businessGroupController.getAvailableUsers);
router.get('/:id', verifyToken, isAdmin, businessGroupController.getBusinessGroupDetail);
router.put('/:id', verifyToken, isAdmin, businessGroupController.updateBusinessGroup);
router.delete('/:id', verifyToken, isAdmin, businessGroupController.deleteBusinessGroup);

// 用户分配路由（仅管理员）
router.post('/:id/assign-user', verifyToken, isAdmin, businessGroupController.assignUserToGroup);
router.delete('/:id/users/:userId', verifyToken, isAdmin, businessGroupController.removeUserFromGroup);

module.exports = router;