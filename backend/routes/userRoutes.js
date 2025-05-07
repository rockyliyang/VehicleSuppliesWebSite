const express = require('express');
const router = express.Router();

// 模拟用户数据
const users = [
  {
    id: 1,
    username: 'admin',
    password: '$2a$10$X7aPYY8JVy3xJ/Y5QJWvzeRRMW0vj.bKjZTAI9qscbjVMnK.smMbm', // 'admin123'
    email: 'admin@example.com',
    phone: '13800138000',
    is_admin: 1
  },
  {
    id: 2,
    username: 'user',
    password: '$2a$10$3GyL.woAWO3.I1cHCuekC.t0z.8ZzUUOLJ1dSJmwUZ/c9jEEXjzRu', // 'user123'
    email: 'user@example.com',
    phone: '13900139000',
    is_admin: 0
  }
];

// 用户登录
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // 实际项目中会从数据库查询用户并验证密码
  // 这里简化处理，直接判断用户名
  const user = users.find(u => u.username === username);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
  }
  
  // 实际项目中会使用bcrypt比较密码
  // 这里简化处理，假设密码正确
  
  // 生成token（实际项目中会使用JWT）
  const token = 'mock_token_' + Date.now();
  
  res.json({
    success: true,
    message: '登录成功',
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin
      }
    }
  });
});

// 用户注册
router.post('/register', (req, res) => {
  const { username, password, email, phone } = req.body;
  
  // 实际项目中会验证用户名是否已存在
  const existingUser = users.find(u => u.username === username || u.email === email);
  
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: '用户名或邮箱已存在'
    });
  }
  
  // 实际项目中会将用户数据保存到数据库
  // 这里简化处理
  const newUser = {
    id: users.length + 1,
    username,
    password: 'hashed_password', // 实际项目中会使用bcrypt加密
    email,
    phone,
    is_admin: 0
  };
  
  res.status(201).json({
    success: true,
    message: '注册成功',
    data: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email
    }
  });
});

// 获取当前用户信息
router.get('/me', (req, res) => {
  // 实际项目中会从token中获取用户ID，然后查询数据库
  // 这里简化处理，返回模拟数据
  res.json({
    success: true,
    data: {
      id: 2,
      username: 'user',
      email: 'user@example.com',
      phone: '13900139000'
    }
  });
});

// 更新用户信息
router.put('/me', (req, res) => {
  // 实际项目中会更新数据库中的用户数据
  res.json({
    success: true,
    message: '用户信息更新成功',
    data: {
      id: 2,
      ...req.body
    }
  });
});

// 修改密码
router.put('/password', (req, res) => {
  const { old_password, new_password } = req.body;
  
  // 实际项目中会验证旧密码并更新新密码
  res.json({
    success: true,
    message: '密码修改成功'
  });
});

module.exports = router;