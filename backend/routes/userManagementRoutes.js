const express = require('express');
const router = express.Router();
const userManagementController = require('../controllers/userManagementController');
const { verifyToken, isAdmin, requireRole } = require('../middleware/jwt');

/**
 * 用户管理路由
 * 处理用户角色更新、业务人员管理等功能的路由
 * 所有路由都需要管理员权限
 */

// 用户管理路由（仅管理员）
router.get('/', verifyToken, isAdmin, userManagementController.getAllUsers);
router.get('/business-staff', verifyToken, isAdmin, userManagementController.getBusinessStaffList);
router.get('/business-groups', verifyToken, isAdmin, userManagementController.getBusinessGroups);
router.get('/:id', verifyToken, isAdmin, userManagementController.getUserDetail);
router.get('/:id/business-groups', verifyToken, isAdmin, userManagementController.getUserBusinessGroups);
router.post('/', verifyToken, isAdmin, userManagementController.createUser);
router.put('/:id', verifyToken, isAdmin, userManagementController.updateUser);
router.delete('/:id', verifyToken, isAdmin, userManagementController.deleteUser);
router.patch('/:id/business-groups', verifyToken, isAdmin, userManagementController.updateUserBusinessGroups);

// 普通用户业务组管理路由（管理员和业务人员可访问）
router.get('/:id/business-group', verifyToken, requireRole(['admin', 'business']), userManagementController.getUserBusinessGroup);
router.patch('/:id/business-group', verifyToken, requireRole(['admin', 'business']), userManagementController.updateUserBusinessGroup);

module.exports = router;