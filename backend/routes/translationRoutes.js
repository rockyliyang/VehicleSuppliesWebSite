const express = require('express');
const router = express.Router();
const translationController = require('../controllers/translationController');
const jwtMiddleware = require('../middleware/jwt');

/**
 * 翻译路由
 * 提供文本翻译相关的API接口
 */

// 公共API - 不需要JWT验证
// 获取支持的语言列表
router.get('/languages', translationController.getSupportedLanguages);

// 检测文本语言
router.post('/detect-language', translationController.detectLanguage);

// 需要JWT验证的API
// 翻译文本
router.post('/translate', jwtMiddleware.verifyToken, translationController.translateText);

// 批量翻译文本
router.post('/batch-translate', jwtMiddleware.verifyToken, translationController.batchTranslateText);

module.exports = router;