const jwt = require('jsonwebtoken');
const { getMessage } = require('../config/messages');

// 检查是否为局域网IP
const isLocalNetwork = (ip) => {
  // 移除IPv6前缀
  const cleanIp = ip.replace(/^::ffff:/, '');
  
  // 检查常见的局域网IP段
  return (
    cleanIp === '127.0.0.1' || // localhost
    cleanIp === '::1' || // IPv6 localhost
    cleanIp.startsWith('192.168.') || // 私有网络
    cleanIp.startsWith('10.') || // 私有网络
    cleanIp.startsWith('172.16.') || cleanIp.startsWith('172.17.') || // 私有网络
    cleanIp.startsWith('172.18.') || cleanIp.startsWith('172.19.') ||
    cleanIp.startsWith('172.20.') || cleanIp.startsWith('172.21.') ||
    cleanIp.startsWith('172.22.') || cleanIp.startsWith('172.23.') ||
    cleanIp.startsWith('172.24.') || cleanIp.startsWith('172.25.') ||
    cleanIp.startsWith('172.26.') || cleanIp.startsWith('172.27.') ||
    cleanIp.startsWith('172.28.') || cleanIp.startsWith('172.29.') ||
    cleanIp.startsWith('172.30.') || cleanIp.startsWith('172.31.')
  );
};

// 需要跳过JWT过期校验的API路径（仅限局域网访问）
const localNetworkSkipPaths = [
  '/api/product-images/upload',
  '/api/products/import-from-1688',
  '/api/product-images/assign'
];

// 验证JWT Token的中间件
const verifyToken = (req, res, next) => {
  try {
    // 获取客户端IP地址
    const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                    (req.connection.socket ? req.connection.socket.remoteAddress : null);
    
    // 检查是否为局域网访问且为特定API路径
    const isLocalAccess = isLocalNetwork(clientIp);
    const isSkipPath = localNetworkSkipPaths.includes(req.path);
    
    // 从请求头或Cookie中获取token
    let token = req.header('Authorization');
    if (!token && req.cookies) {
      token = req.cookies.token;
    }
    if (token && token.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '');
    }
    
    // 如果没有token，返回未授权错误
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: getMessage('AUTH.UNAUTHORIZED'), 
        data: null 
      });
    }
    
    // 验证token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // 将解码后的用户信息添加到请求对象中
      req.userId = decoded.userId;
      req.userEmail = decoded.email;
      req.userRole = decoded.role;
      
      // 添加token续期功能
      req.token = token;
      
      next();
    } catch (tokenError) {
      // 如果是局域网访问且为指定路径，且错误是token过期，则跳过验证
      if (isLocalAccess && isSkipPath && tokenError.name === 'TokenExpiredError') {
        console.log(`局域网访问跳过JWT过期校验: ${req.path} from ${clientIp}`);
        
        // 尝试解码过期的token以获取用户信息（不验证过期时间）
        try {
          const decoded = jwt.decode(token);
          if (decoded) {
            req.userId = decoded.userId;
            req.userEmail = decoded.email;
            req.userRole = decoded.role;
            req.token = token;
          }
        } catch (decodeError) {
          console.warn('解码过期token失败:', decodeError.message);
        }
        
        return next();
      }
      
      // 其他情况抛出原始错误
      throw tokenError;
    }
  } catch (error) {
    // 处理token验证失败的情况
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: getMessage('AUTH.TOKEN_EXPIRED'), 
        data: null 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: getMessage('AUTH.INVALID_TOKEN'), 
      data: null 
    });
  }
};

// 检查是否为管理员的中间件
const isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: getMessage('AUTH.ADMIN_REQUIRED'), 
      data: null 
    });
  }
  next();
};

// 检查用户角色的中间件
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: getMessage('AUTH.INSUFFICIENT_PERMISSIONS'),
        data: null
      });
    }
    next();
  };
};

// 验证管理员权限的中间件（组合verifyToken和isAdmin）
const verifyAdmin = [verifyToken, isAdmin];

module.exports = {
  verifyToken,
  isAdmin,
  verifyAdmin,
  requireRole,
  authenticateToken: verifyToken, // 添加别名以保持兼容性
  isLocalNetwork // 导出局域网检测函数用于测试
};