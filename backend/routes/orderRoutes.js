const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middleware/jwt');
const multer = require('multer');

// 配置multer用于订单状态图片上传
const upload = multer({ dest: 'uploads/' });

// 所有订单路由都需要用户认证
router.use(verifyToken);

// POST方法已删除 - 不再使用直接创建订单的API

// 获取用户订单列表
router.get('/', orderController.getOrders);

// 获取订单详情
router.get('/:orderId', orderController.getOrderDetail);

// 修改订单信息（仅限shipping information字段）
router.put('/:orderId', orderController.updateOrder);

// 订单状态数据相关路由
// 添加或修改订单状态数据（合并接口）
router.post('/status-data', orderController.addOrUpdateOrderStatusData);

// 获取特定订单和状态的数据
router.get('/:orderId/status-data/:status', orderController.getOrderStatusData);

// 获取订单的所有状态数据
router.get('/:orderId/status-data', orderController.getOrderAllStatusData);

// 删除订单状态数据
router.delete('/:orderId/status-data/:status', orderController.deleteOrderStatusData);

// 订单状态图片上传
router.post('/status-data/upload-image', upload.single('file'), orderController.uploadOrderStatusImage);

module.exports = router;