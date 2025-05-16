const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken } = require('../middleware/jwt');

// Public routes - no JWT auth required
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.get('/generate-code', productController.generateProductCode);

// Admin routes - JWT auth required
router.post('/', verifyToken, productController.createProduct);
router.put('/:id', verifyToken, productController.updateProduct);
router.delete('/:id', verifyToken, productController.deleteProduct);

module.exports = router;