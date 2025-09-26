const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { verifyToken } = require('../middleware/jwt');

// 所有供应商路由都需要JWT认证（管理员功能）

// 获取供应商选项列表（用于下拉选择）
router.get('/options', verifyToken, supplierController.getSupplierOptions);

// 获取所有供应商
router.get('/', verifyToken, supplierController.getAllSuppliers);

// 根据ID获取供应商详情
router.get('/:id', verifyToken, supplierController.getSupplierById);

// 获取供应商的产品列表
router.get('/:id/products', verifyToken, supplierController.getSupplierProducts);

// 创建供应商
router.post('/', verifyToken, supplierController.createSupplier);

// 更新供应商
router.put('/:id', verifyToken, supplierController.updateSupplier);

// 删除供应商（软删除）
router.delete('/:id', verifyToken, supplierController.deleteSupplier);

module.exports = router;