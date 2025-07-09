// 加载环境变量
const env = require('./config/env');
const { getMessage } = require('./config/messages');
const { pool } = require('./db/db');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
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
const contactRoutes = require('./routes/contactRoutes');
const businessGroupRoutes = require('./routes/businessGroupRoutes');
const userManagementRoutes = require('./routes/userManagementRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
const adminInquiryRoutes = require('./routes/adminInquiryRoutes');
const sseRoutes = require('./routes/sseRoutes');
const thirdPartyAuthRoutes = require('./routes/thirdPartyAuthRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 在开发环境中不信任代理，避免rate limit警告
// 生产环境中如果使用反向代理（如nginx）则需要设置为true
app.set('trust proxy', process.env.NODE_ENV === 'production');

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session 配置
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // 在开发环境中设为 false，生产环境中如果使用 HTTPS 则设为 true
    maxAge: 24 * 60 * 60 * 1000 // 24小时
  }
}));

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
//app.use('/api/paypal', paypalRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/payment-config', paymentConfigRoutes); // Register payment config routes
app.use('/api/language', languageRoutes);
app.use('/api/common-content', commonContentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin/business-groups', businessGroupRoutes);
app.use('/api/admin/users', userManagementRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/admin/inquiries', adminInquiryRoutes);
app.use('/api/sse', sseRoutes);
app.use('/api/auth', thirdPartyAuthRoutes);

// 注册长轮询路由
const pollingRoutes = require('./routes/pollingRoutes');
app.use('/api/inquiries', pollingRoutes);
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

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 优雅关闭服务器
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    try {
      await pool.end();
      console.log('Database pool closed');
    } catch (err) {
      console.error('Error closing database pool:', err);
    }
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    try {
      await pool.end();
      console.log('Database pool closed');
    } catch (err) {
      console.error('Error closing database pool:', err);
    }
    process.exit(0);
  });
});

// 处理未捕获的异常
process.on('uncaughtException', async (err) => {
  console.error('Uncaught Exception:', err);
  server.close(async () => {
    try {
      await pool.end();
      console.log('Database pool closed');
    } catch (poolErr) {
      console.error('Error closing database pool:', poolErr);
    }
    process.exit(1);
  });
});

// 处理未处理的 Promise 拒绝
process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  server.close(async () => {
    try {
      await pool.end();
      console.log('Database pool closed');
    } catch (poolErr) {
      console.error('Error closing database pool:', poolErr);
    }
    process.exit(1);
  });
});