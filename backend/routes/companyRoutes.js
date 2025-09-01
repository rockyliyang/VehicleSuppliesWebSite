const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// 性能监控中间件
const performanceLogger = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`[PERF] ${req.method} ${req.originalUrl} - ${duration}ms - ${new Date().toISOString()}`);
    originalSend.call(this, data);
  };
  
  console.log(`[REQ START] ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
};

// 应用性能监控中间件到所有路由
router.use(performanceLogger);

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