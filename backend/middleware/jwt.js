const jwt = require('jsonwebtoken');

// 验证JWT Token的中间件
const verifyToken = (req, res, next) => {
  try {
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
        message: '未授权，请先登录', 
        data: null 
      });
    }
    
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 将解码后的用户信息添加到请求对象中
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    req.userRole = decoded.userRole;
    
    // 添加token续期功能
    req.token = token;

     
    next();
  } catch (error) {
    // 处理token验证失败的情况
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: '登录已过期，请重新登录', 
        data: null 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: '无效的令牌，请重新登录', 
      data: null 
    });
  }
};

// 检查是否为管理员的中间件
const isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: '需要管理员权限', 
      data: null 
    });
  }
  next();
};

module.exports = {
  verifyToken,
  isAdmin
};