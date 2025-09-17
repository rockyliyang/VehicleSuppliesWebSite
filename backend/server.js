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
const morgan = require('morgan');

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
const visitorLogRoutes = require('./routes/visitorLogRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 在开发环境中不信任代理，避免rate limit警告
// 生产环境中如果使用反向代理（如nginx）则需要设置为true
// 设置信任代理
app.set('trust proxy', process.env.NODE_ENV === 'production');

// 中间件配置
app.use(cors());

// Morgan HTTP请求日志记录
// 自定义日志格式，包含响应时间、时间戳和Request ID
morgan.token('timestamp', () => {
  return new Date().toISOString();
});

morgan.token('request-id', (req) => {
  return req.headers['x-request-id'] || 'no-request-id';
});

const morganFormat = ':timestamp [:request-id] :method :url :status :res[content-length] - :response-time ms';
app.use(morgan(morganFormat));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session 配置变量
let sessionStore;
let isShuttingDown = false;

// 初始化session中间件
// Session 配置 - 使用PostgreSQL存储
sessionStore = new pgSession({
  pool: pool, // 使用现有的数据库连接池
  tableName: 'session', // 使用我们创建的session表
  createTableIfMissing: true, // 让pgSession自动创建表
  pruneSessionInterval: false, // 禁用自动清理，避免在服务器关闭时出现pool错误
  // 添加自定义错误日志处理
  errorLog: (error) => {
    console.error(`[SessionStore Error] PID: ${process.pid}, Time: ${new Date().toISOString()}`);
    console.error(`[SessionStore Error] Pool ended status: ${pool.ended}`);
    console.error(`[SessionStore Error] Is shutting down: ${isShuttingDown}`);
    console.error(`[SessionStore Error] Error details:`, error);
    console.error(`[SessionStore Error] Stack trace:`, error.stack);
  }
});

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.COOKIE_SECURE === 'true', // 使用COOKIE_SECURE环境变量控制
    maxAge: 24 * 60 * 60 * 1000 // 24小时
  }
}));

console.log(`[Init] Session middleware initialized successfully - PID: ${process.pid}`);

// 保留initializeSession函数以兼容现有代码，但不再执行实际操作
function initializeSession() {
  console.log(`[Init] Session middleware already initialized - PID: ${process.pid}`);
}

// 静态文件服务
app.use('/static', express.static(path.join(__dirname, 'public', 'static')));
app.use('/public/static', express.static(path.join(__dirname, 'public', 'static')));


// 注意：session中间件将在服务器启动时初始化，而不是在这里
// 这样可以确保在数据库连接成功后再初始化session

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
app.use('/api/visitor-logs', visitorLogRoutes);

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

// 优雅关闭标志已在session初始化部分定义

const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`[Server] 服务器运行在 http://localhost:${PORT}`);
  console.log(`[Server] Process PID: ${process.pid}`);
  console.log(`[Server] Node.js version: ${process.version}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Server] Initial pool ended status: ${pool.ended}`);
  console.log(`[Server] Server startup time: ${new Date().toISOString()}`);
  
  // 初始化PostgreSQL通知管理器
  try {
    await pgNotificationManager.initialize();
    await pgNotificationManager.startListening();
    console.log('PostgreSQL notification manager initialized successfully');
    console.log(`[Init] SessionStore pruneSessionInterval: false (disabled)`);
    console.log(`[Init] SessionStore errorLog handler: enabled`);
  } catch (err) {
    console.error('Failed to initialize PostgreSQL notification manager:', err);
    console.log(`[Init] SessionStore pruneSessionInterval: false (disabled)`);
    console.log(`[Init] SessionStore errorLog handler: enabled`);
  }
});

// 优雅关闭函数
async function gracefulShutdown(signal, exitCode = 0) {
  if (isShuttingDown) {
    console.log(`${signal} signal received, but shutdown already in progress`);
    return;
  }
  
  isShuttingDown = true;
  console.log(`[Shutdown] ${signal} signal received: PID ${process.pid}, Time: ${new Date().toISOString()}`);
  console.log(`[Shutdown] Starting graceful shutdown process`);
  
  server.close(async () => {
    console.log('[Shutdown] HTTP server closed');
    try {
      // 停止所有定时任务（如果存在）
      console.log('[Shutdown] Checking session store status...');
      console.log(`[Shutdown] SessionStore exists: ${!!sessionStore}`);
      console.log(`[Shutdown] Pool ended status before sessionStore.close(): ${pool.ended}`);
        
      // 关闭session store（如果已初始化）
      if (sessionStore && typeof sessionStore.close === 'function') {
        console.log('[Shutdown] Calling sessionStore.close()...');
        await sessionStore.close();
        console.log('[Shutdown] Session store closed successfully');
        console.log(`[Shutdown] Pool ended status after sessionStore.close(): ${pool.ended}`);
      } else if (sessionStore) {
        console.log('[Shutdown] Session store exists but no close method available');
      } else {
        console.log('[Shutdown] Session store not initialized, skipping close');
      }
      
      // 关闭PostgreSQL通知管理器
      console.log('[Shutdown] Closing PostgreSQL notification manager...');
      await pgNotificationManager.close();
      console.log('[Shutdown] PostgreSQL notification manager closed');
      
      // 检查连接池是否已经关闭
      console.log(`[Shutdown] Final pool status check - Pool ended: ${pool.ended}`);
      if (!pool.ended) {
        console.log('[Shutdown] Closing database pool...');
        await pool.end();
        console.log('[Shutdown] Database pool closed successfully');
      } else {
        console.log('[Shutdown] Database pool already closed');
      }
      
      console.log('[Shutdown] Graceful shutdown completed successfully');
    } catch (err) {
      console.error('[Shutdown] Error during graceful shutdown:', err);
      console.error('[Shutdown] Error stack:', err.stack);
    }
    console.log(`[Shutdown] Process exiting with code ${exitCode}`);
    process.exit(exitCode);
  });
}

// 优雅关闭服务器
process.on('SIGTERM', () => {
  console.log(`[Signal] SIGTERM received - PID: ${process.pid}, Time: ${new Date().toISOString()}`);
  gracefulShutdown('SIGTERM',1);
});

process.on('SIGINT', () => {
  console.log(`[Signal] SIGINT received - PID: ${process.pid}, Time: ${new Date().toISOString()}`);
  gracefulShutdown('SIGINT',1);
});

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error(`[Exception] Uncaught Exception - PID: ${process.pid}, Time: ${new Date().toISOString()}`);
  console.error('[Exception] Error details:', err);
  console.error('[Exception] Stack trace:', err.stack);
  gracefulShutdown('uncaughtException', 1);
});

// 处理未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error(`[Rejection] Unhandled Promise Rejection - PID: ${process.pid}, Time: ${new Date().toISOString()}`);
  console.error('[Rejection] Promise:', promise);
  console.error('[Rejection] Reason:', reason);
  if (reason && reason.stack) {
    console.error('[Rejection] Stack trace:', reason.stack);
  }
  gracefulShutdown('unhandledRejection', 1);
});

// 添加进程退出事件监听
process.on('exit', (code) => {
  console.log(`[Exit] Process exiting - PID: ${process.pid}, Code: ${code}, Time: ${new Date().toISOString()}`);
});

// 添加进程启动完成日志
console.log(`[Process] Server process started - PID: ${process.pid}, Time: ${new Date().toISOString()}`);
console.log(`[Process] All event listeners registered successfully`);
console.log(`[Morgan] HTTP request logging enabled with custom format`);