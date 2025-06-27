const express = require('express');
const router = express.Router();
const alibaba1688Controller = require('../controllers/alibaba1688Controller');
const { verifyToken } = require('../middleware/jwt');

// 所有1688 API路由都需要管理员权限
router.use(verifyToken);

// 检查API配置状态
router.get('/status', alibaba1688Controller.checkApiStatus);

// 根据关键词搜索产品
router.get('/search', alibaba1688Controller.searchProducts);

// 根据图片搜索产品
router.post('/search/image', alibaba1688Controller.searchByImage);

// 获取产品详情
router.get('/product/:productId', alibaba1688Controller.getProductDetail);

// 获取产品图片
router.get('/product/:productId/images', alibaba1688Controller.getProductImages);

// 开发测试用的模拟接口
if (process.env.NODE_ENV === 'development') {
  router.get('/mock/search', alibaba1688Controller.mockSearchProducts);
  router.get('/mock/product/:productId', alibaba1688Controller.mockProductDetail);
}

module.exports = router;