const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const { verifyToken, isAdmin } = require('../middleware/jwt');

// 获取所有标签 (管理员)
router.get('/', verifyToken, isAdmin, tagController.getAllTags);

// 获取指定类型的活跃标签 (公开接口，用于前端选择)
router.get('/active/:type', tagController.getActiveTagsByType);

// 获取单个标签
router.get('/:id', verifyToken, isAdmin, tagController.getTagById);

// 管理员路由 - 创建标签
router.post('/', verifyToken, isAdmin, tagController.createTag);

// 管理员路由 - 更新标签
router.put('/:id', verifyToken, isAdmin, tagController.updateTag);

// 管理员路由 - 删除标签
router.delete('/:id', verifyToken, isAdmin, tagController.deleteTag);

module.exports = router;