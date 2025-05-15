const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// 获取公司信息
router.get('/', companyController.getCompanyInfo);

// 管理员路由 - 更新公司信息
router.put('/', companyController.updateCompanyInfo);

// 上传公司logo
router.post('/upload/logo', upload.single('file'), companyController.uploadLogo);
// 上传微信二维码
router.post('/upload/wechat', upload.single('file'), companyController.uploadWechat);

module.exports = router;