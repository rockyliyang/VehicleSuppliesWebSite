const express = require('express');
const router = express.Router();
const commonContentController = require('../controllers/CommonContentController');
const jwt = require('../middleware/jwt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置multer用于文件上传
const storage = multer.memoryStorage(); // 使用内存存储，与controller中的逻辑一致

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB限制
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|avif)$/)) {
      // 使用回调返回错误，而不是抛出异常
      return cb(null, false);
    }
    cb(null, true);
  }
});

// 公开接口 - 用户端
// 获取导航菜单列表
router.get('/nav/:contentType', commonContentController.getNavList);

// 获取指定导航菜单的内容
router.get('/content/:nameKey/:lang', commonContentController.getContent);

// 管理员接口 - 需要JWT验证
// 获取所有导航菜单（包含禁用的）
router.get('/admin/nav', jwt.verifyToken, commonContentController.getAdminNavList);

// 添加导航菜单
router.post('/admin/nav', jwt.verifyToken, commonContentController.addNav);

// 更新导航菜单
router.put('/admin/nav/:id', jwt.verifyToken, commonContentController.updateNav);

// 删除导航菜单
router.delete('/admin/nav/:id', jwt.verifyToken, commonContentController.deleteNav);

// 获取指定导航下的内容列表
router.get('/admin/content/by-nav/:navId', jwt.verifyToken, commonContentController.getAdminContentList);

// 添加内容
router.post('/admin/content', jwt.verifyToken, commonContentController.addContent);

// 更新内容
router.put('/admin/content/:id', jwt.verifyToken, commonContentController.updateContent);

// 删除内容
router.delete('/admin/content/:id', jwt.verifyToken, commonContentController.deleteContent);

// Multer错误处理中间件
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小超过限制（最大5MB）'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '文件数量超过限制（最大10个）'
      });
    }
    return res.status(400).json({
      success: false,
      message: '文件上传错误: ' + err.message
    });
  }
  
  if (err.message && err.message.includes('文件类型不支持')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next(err);
};

// 图片上传接口
router.post('/images/upload', jwt.verifyToken, upload.array('images', 10), handleMulterError, commonContentController.uploadImages);

// 获取图片列表（按导航ID）
router.get('/images/:navId', jwt.verifyToken, commonContentController.getImages);

// 获取内容的图片列表
router.get('/images/content/:content_id', jwt.verifyToken, commonContentController.getImagesByContentId);

// 删除图片
router.delete('/images/:id', jwt.verifyToken, commonContentController.deleteImage);

// 获取内容的主图
router.get('/images/main/content/:content_id', jwt.verifyToken, commonContentController.getMainImageByContentId);

// 获取导航的主图（兼容旧接口）
router.get('/images/main/nav/:nav_id', jwt.verifyToken, commonContentController.getMainImageByNavId);

module.exports = router;