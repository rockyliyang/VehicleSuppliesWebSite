const express = require('express');
const router = express.Router();
const languageController = require('../controllers/languageController');
const jwtMiddleware = require('../middleware/jwt');

// 公共API - 不需要JWT验证
// 获取指定语言的所有翻译
router.get('/translations/:lang', languageController.getTranslationsByLang);

// 获取支持的语言列表
router.get('/supported', languageController.getSupportedLanguages);

// 根据IP获取默认语言
router.get('/detect', languageController.getLanguageByIp);

// 管理员API - 需要JWT验证
// 获取所有翻译
router.get('/admin/translations', jwtMiddleware.verifyToken, jwtMiddleware.isAdmin, languageController.getAllTranslations);

// 添加翻译
router.post('/admin/translations', jwtMiddleware.verifyToken, jwtMiddleware.isAdmin, languageController.addTranslation);

// 更新翻译
router.put('/admin/translations/:id', jwtMiddleware.verifyToken, jwtMiddleware.isAdmin, languageController.updateTranslation);

// 删除翻译
router.delete('/admin/translations/:id', jwtMiddleware.verifyToken, jwtMiddleware.isAdmin, languageController.deleteTranslation);

module.exports = router;