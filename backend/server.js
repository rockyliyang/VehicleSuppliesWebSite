// 加载环境变量
const env = require('./config/env');
const { getMessage } = require('./config/messages');
const { pool } = require('./db/db');
const pgNotificationManager = require('./utils/pgNotification');

// 引入日志工具并重写console
// 只在开发环境override console
if (process.env.NODE_ENV === 'development') {
  const { overrideConsole } = require('./utils/logger');
  overrideConsole();
}

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
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
const adminStatsRoutes = require('./routes/adminStatsRoutes');
const sseRoutes = require('./routes/sseRoutes');
const thirdPartyAuthRoutes = require('./routes/thirdPartyAuthRoutes');
const addressRoutes = require('./routes/addressRoutes');
const userProductRoutes = require('./routes/userProductRoutes');
const orderManagementRoutes = require('./routes/orderManagementRoutes');
const logisticsRoutes = require('./routes/logisticsRoutes');
const productReviewRoutes = require('./routes/productReviewRoutes');
const productReviewImageRoutes = require('./routes/productReviewImageRoutes');
const tagRoutes = require('./routes/tagRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 在开发环境中不信任代理，避免rate limit警告
// 生产环境中如果使用反向代理（如nginx）则需要设置为true
app.set('trust proxy', process.env.NODE_ENV === 'production');

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session 配置 - 使用PostgreSQL存储
app.use(session({
  store: new pgSession({
    pool: pool, // 使用现有的数据库连接池
    tableName: 'session', // 使用我们创建的session表
    createTableIfMissing: true // 让pgSession自动创建表
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.COOKIE_SECURE === 'true', // 使用COOKIE_SECURE环境变量控制
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
app.use('/api/admin/stats', adminStatsRoutes);
// 注册长轮询路由 - 使用独立路径避免冲突
const pollingRoutes = require('./routes/pollingRoutes');
app.use('/api/inquiries', pollingRoutes);
app.use('/api/sse', sseRoutes);
app.use('/api/auth', thirdPartyAuthRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api', userProductRoutes);
app.use('/api/order-management', orderManagementRoutes);
app.use('/api/admin/logistics', logisticsRoutes);
app.use('/api/product-reviews', productReviewRoutes);
app.use('/api/product-review-images', productReviewImageRoutes);
app.use('/api/tags', tagRoutes);

// 国家省份数据路由
app.use('/api', userRoutes);
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

// 添加优雅关闭标志
let isShuttingDown = false;

const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  
  // 初始化PostgreSQL通知管理器
  try {
    await pgNotificationManager.initialize();
    await pgNotificationManager.startListening();
    console.log('PostgreSQL notification manager initialized successfully');
  } catch (err) {
    console.error('Failed to initialize PostgreSQL notification manager:', err);
  }
});

// 优雅关闭函数
async function gracefulShutdown(signal, exitCode = 0) {
  if (isShuttingDown) {
    console.log(`${signal} signal received, but shutdown already in progress`);
    return;
  }
  
  isShuttingDown = true;
  console.log(`${signal} signal received: closing HTTP server`);
  
  server.close(async () => {
    console.log('HTTP server closed');
    try {
      // 关闭PostgreSQL通知管理器
      await pgNotificationManager.close();
      console.log('PostgreSQL notification manager closed');
      
      // 检查连接池是否已经关闭
      if (!pool.ended) {
        await pool.end();
        console.log('Database pool closed');
      } else {
        console.log('Database pool already closed');
      }
    } catch (err) {
      console.error('Error during graceful shutdown:', err);
    }
    process.exit(exitCode);
  });
}

// 优雅关闭服务器
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown('uncaughtException', 1);
});

// 处理未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection', 1);
});