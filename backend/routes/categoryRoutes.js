const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/jwt');
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/productCategoryController');

// 公开路由
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// 管理员路由
router.post('/', verifyToken, isAdmin, createCategory);
router.put('/:id', verifyToken, isAdmin, updateCategory);
router.delete('/:id', verifyToken, isAdmin, deleteCategory);

module.exports = router;