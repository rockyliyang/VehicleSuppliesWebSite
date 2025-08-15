const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// 获取公司信息
router.get('/', companyController.getCompanyInfo);

// 管理员路由 - 更新公司信息
router.put('/', companyController.updateCompanyInfo);

// 通用图片上传接口
router.post('/upload/image', upload.single('file'), companyController.uploadImage);
// 上传公司logo (保持向后兼容)
router.post('/upload/logo', upload.single('file'), companyController.uploadLogo);
// 上传微信二维码 (保持向后兼容)
router.post('/upload/wechat', upload.single('file'), companyController.uploadWechat);

module.exports = router;