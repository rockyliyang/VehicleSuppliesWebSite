const express = require('express');
const router = express.Router();
const {
  createVisitorLog,
  getAllVisitorLogs,
  getVisitorLogById,
  updateVisitorLog,
  deleteVisitorLog,
  batchDeleteVisitorLogs,
  getVisitorStats,
  updateVisitorDuration,
  updateVisitorInfo
} = require('../controllers/visitorLogController');
const { verifyToken, optionalToken } = require('../middleware/jwt');

// Public routes - 访问记录收集不需要认证
router.post('/', optionalToken, createVisitorLog);
router.put('/duration', updateVisitorDuration);
router.put('/info', updateVisitorInfo);

// Admin routes - JWT auth required
router.get('/', verifyToken, getAllVisitorLogs);
router.get('/stats', verifyToken, getVisitorStats);
router.get('/:id', verifyToken, getVisitorLogById);
router.put('/:id', verifyToken, updateVisitorLog);
router.delete('/:id', verifyToken, deleteVisitorLog);
router.post('/batch-delete', verifyToken, batchDeleteVisitorLogs);

module.exports = router;