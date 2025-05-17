const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/jwt');
const {
  uploadProductImages,
  getProductImages,
  deleteProductImage,
  updateImageOrder
} = require('../controllers/productImageController');

// 公开路由
router.get('/', getProductImages);

// 管理员路由
router.post('/upload', verifyToken, isAdmin, uploadProductImages);
router.delete('/:id', verifyToken, isAdmin, deleteProductImage);
router.put('/order', verifyToken, isAdmin, updateImageOrder);
router.post('/assign', verifyToken, isAdmin, require('../controllers/productImageController').assignProductImages);

module.exports = router;