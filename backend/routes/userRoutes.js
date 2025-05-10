const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

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

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;
    
    // 检查用户是否已存在
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: '用户名或邮箱已存在' });
    }

    // 密码加密过程：
    // 1. bcrypt 自动生成随机盐值
    // 2. 将盐值与密码结合
    // 3. 使用 bcrypt 算法进行慢哈希计算
    // 4. 将哈希结果（包含盐值）存储到数据库
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户
    const [result] = await pool.query(
      'INSERT INTO users (guid, username, email, password, phone, user_role) VALUES (UUID_TO_BIN(UUID()), ?, ?, ?, ?, "user")',
      [username, email, hashedPassword, phone]
    );

    res.status(201).json({ message: '注册成功' });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND deleted = 0',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: '用户不存在' });
    }

    const user = users[0];

    // 密码验证过程：
    // 1. 从数据库获取存储的哈希值（包含盐值）
    // 2. bcrypt.compare 会自动：
    //    - 提取存储的盐值
    //    - 将盐值与输入的密码结合
    //    - 进行哈希计算
    //    - 与存储的哈希值比对
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: '密码错误' });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        userRole: user.user_role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        userRole: user.user_role
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户信息
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, phone, user_role FROM users WHERE id = ? AND deleted = 0',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 管理员创建新管理员
router.post('/admin/create', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 检查用户是否已存在
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: '用户名或邮箱已存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新管理员
    const [result] = await pool.query(
      'INSERT INTO users (guid, username, email, password, user_role) VALUES (UUID_TO_BIN(UUID()), ?, ?, ?, "admin")',
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: '管理员创建成功' });
  } catch (error) {
    console.error('创建管理员错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取所有用户列表（仅管理员）
router.get('/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, phone, user_role, created_at FROM users WHERE deleted = 0'
    );
    res.json(users);
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;