const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { auth } = require('../middleware/auth');

// Public routes - no JWT auth required
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.get('/generate-code', productController.generateProductCode);

// Admin routes - JWT auth required
router.post('/', auth, productController.createProduct);
router.put('/:id', auth, productController.updateProduct);
router.delete('/:id', auth, productController.deleteProduct);

module.exports = router;