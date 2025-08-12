const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken } = require('../middleware/jwt');

// Public routes - no JWT auth required
router.get('/', productController.getAllProducts);
router.get('/search', productController.searchProducts);
router.get('/:id', productController.getProductById);
router.get('/:productId/price', productController.getPriceByQuantity);
router.get('/:productId/buy-together', productController.getBuyTogetherProducts);
router.post('/generate-code', productController.generateProductCode);

// Admin routes - JWT auth required
router.post('/', verifyToken, productController.createProduct);
router.post('/import-from-1688', verifyToken, productController.importFrom1688);
router.put('/:id', verifyToken, productController.updateProduct);
router.delete('/:id', verifyToken, productController.deleteProduct);

// Product links routes - JWT auth required
router.get('/:productId/links', productController.getProductLinks);
router.post('/:productId/links', verifyToken, productController.addProductLink);
router.put('/:productId/links', verifyToken, productController.updateProductLinks);
router.delete('/:productId/links/:linkId', verifyToken, productController.deleteProductLink);

module.exports = router;