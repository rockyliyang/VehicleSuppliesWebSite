const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { verifyToken, isAdmin } = require('../middleware/jwt');

// 获取所有Banner (管理员)
router.get('/', verifyToken, isAdmin, bannerController.getAllBanners);

// 获取活跃Banner (公开接口，用于前端展示)
router.get('/active', bannerController.getActiveBanners);

// 获取单个Banner
router.get('/:id', verifyToken, isAdmin, bannerController.getBannerById);

// 管理员路由 - 创建Banner
router.post('/', verifyToken, isAdmin, bannerController.createBanner);

// 管理员路由 - 更新Banner
router.put('/:id', verifyToken, isAdmin, bannerController.updateBanner);

// 管理员路由 - 删除Banner
router.delete('/:id', verifyToken, isAdmin, bannerController.deleteBanner);

module.exports = router;