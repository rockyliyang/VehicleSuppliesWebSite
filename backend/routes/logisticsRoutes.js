const express = require('express');
const router = express.Router();
const logisticsCompanyController = require('../controllers/logisticsCompanyController');
const { verifyToken, isAdmin } = require('../middleware/jwt');

/**
 * 物流公司管理路由
 * 处理物流公司和运费范围管理功能的路由
 * 所有路由都需要管理员权限
 */

// 物流公司管理 - 需要管理员权限
router.get('/companies', verifyToken, isAdmin, logisticsCompanyController.getCompanies);
router.post('/companies', verifyToken, isAdmin, logisticsCompanyController.createCompany);

// 默认物流公司管理 - 不需要管理员权限
router.get('/companies/default', verifyToken, logisticsCompanyController.getDefaultCompany);

router.get('/companies/:id', verifyToken, isAdmin, logisticsCompanyController.getCompanyDetail);
router.put('/companies/:id', verifyToken, isAdmin, logisticsCompanyController.updateCompany);
router.delete('/companies/:id', verifyToken, isAdmin, logisticsCompanyController.deleteCompany);
router.put('/companies/:id/set-default', verifyToken, isAdmin, logisticsCompanyController.setDefaultCompany);

// 运费范围管理 - 需要管理员权限
router.get('/companies/:companyId/shipping-fee-ranges', verifyToken, logisticsCompanyController.getShippingFeeRanges);
router.post('/companies/:companyId/shipping-fee-ranges', verifyToken, isAdmin, logisticsCompanyController.createShippingFeeRange);
router.get('/companies/:companyId/shipping-fee-ranges/:rangeId', verifyToken, isAdmin, logisticsCompanyController.getShippingFeeRangeDetail);
router.put('/companies/:companyId/shipping-fee-ranges/:rangeId', verifyToken, isAdmin, logisticsCompanyController.updateShippingFeeRange);
router.delete('/companies/:companyId/shipping-fee-ranges/:rangeId', verifyToken, isAdmin, logisticsCompanyController.deleteShippingFeeRange);

// 费用系数管理 - 需要管理员权限
router.get('/companies/:companyId/shipping-fee-factors', verifyToken, logisticsCompanyController.getShippingFeeFactors);
router.post('/companies/:companyId/shipping-fee-factors', verifyToken, isAdmin, logisticsCompanyController.createShippingFeeFactor);
router.get('/companies/:companyId/shipping-fee-factors/:factorId', verifyToken, isAdmin, logisticsCompanyController.getShippingFeeFactorDetail);
router.put('/companies/:companyId/shipping-fee-factors/:factorId', verifyToken, isAdmin, logisticsCompanyController.updateShippingFeeFactor);
router.delete('/companies/:companyId/shipping-fee-factors/:factorId', verifyToken, isAdmin, logisticsCompanyController.deleteShippingFeeFactor);

module.exports = router;