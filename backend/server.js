// 加载环境变量
const env = require('./config/env');
const { getMessage } = require('./config/messages');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// 路由导入
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const companyRoutes = require('./routes/companyRoutes');
const userRoutes = require('./routes/userRoutes');
const productImageRoutes = require('./routes/productImageRoutes');
const cartRoutes = require('./routes/cartRoutes');
//const paypalRoutes = require('./routes/paypalRoutes');
const paymentConfigRoutes = require('./routes/paymentConfigRoutes');
const languageRoutes = require('./routes/languageRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const commonContentRoutes = require('./routes/CommonContentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务
app.use('/static', express.static(path.join(__dirname, 'public', 'static')));
app.use('/public/static', express.static(path.join(__dirname, 'public', 'static')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// API路由
// API路由
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/product-images', productImageRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/orders2', require('./routes/orderRoutes3'));
//app.use('/api/paypal', paypalRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/payment-config', paymentConfigRoutes); // Register payment config routes
app.use('/api/language', languageRoutes);
app.use('/api/common-content', commonContentRoutes);
// 前端静态文件（生产环境）
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: getMessage('SERVER.INTERNAL_ERROR'),
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const server = app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 优雅关闭服务器
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  server.close(() => {
    process.exit(1);
  });
});

// 处理未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  server.close(() => {
    process.exit(1);
  });
});