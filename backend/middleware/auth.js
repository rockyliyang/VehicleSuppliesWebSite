const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    let token = req.header('Authorization');
    if (!token && req.cookies) {
      token = req.cookies.token;
    }
    if (token && token.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '');
    }
    if (!token) throw new Error('未登录');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: '请先登录', data: {} });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.userRole !== 'admin') {
    return res.status(403).json({ message: '需要管理员权限' });
  }
  next();
};

module.exports = {
  auth,
  isAdmin
}; 