const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/jwt');
const addressController = require('../controllers/addressController');

// 获取用户所有地址
router.get('/', verifyToken, addressController.getAllAddresses);

// 获取单个地址
router.get('/:id', verifyToken, addressController.getAddressById);

// 创建新地址
router.post('/', verifyToken, addressController.createAddress);

// 更新地址
router.put('/:id', verifyToken, addressController.updateAddress);

// 删除地址
router.delete('/:id', verifyToken, addressController.deleteAddress);

// 设置默认地址
router.put('/:id/default', verifyToken, addressController.setDefaultAddress);

module.exports = router;