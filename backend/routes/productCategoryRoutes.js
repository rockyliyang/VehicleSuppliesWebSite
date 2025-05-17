const express = require('express');
const router = express.Router();
const productCategoryController = require('../controllers/productCategoryController');

// GET all product categories
router.get('/', productCategoryController.getAllCategories);

// GET a single product category by id
router.get('/:id', productCategoryController.getCategoryById);

// POST create a new product category
router.post('/', productCategoryController.createCategory);

// PUT update a product category
router.put('/:id', productCategoryController.updateCategory);

// DELETE soft delete a product category
router.delete('/:id', productCategoryController.deleteCategory);

module.exports = router; 