const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// 获取所有产品
router.get('/', productController.getAllProducts);

// 获取单个产品详情
router.get('/:id', productController.getProductById);

// 按分类获取产品
router.get('/category/:categoryId', productController.getProductsByCategory);

// 管理员路由 - 创建产品
router.post('/', productController.createProduct);

// 管理员路由 - 更新产品
router.put('/:id', productController.updateProduct);

// 管理员路由 - 删除产品
router.delete('/:id', productController.deleteProduct);

module.exports = router;