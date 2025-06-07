const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const svgCaptcha = require('svg-captcha');
const { pool } = require('../db/db');
const { sendMail } = require('../utils/email');
const { verifyToken, isAdmin } = require('../middleware/jwt');
const { getMessage } = require('../config/messages');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// 用户注册（只允许邮箱注册）
router.post('/register', async (req, res) => {
  try {
    const { email, password, captcha } = req.body;
    // TODO: 校验验证码
    if (!email || !password) {
      return res.status(400).json({ success: false, message: getMessage('USER.EMAIL_PASSWORD_REQUIRED'), data: null });
    }
    // 检查邮箱是否已存在
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: getMessage('USER.EMAIL_EXISTS'), data: null });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    // 用邮箱@前的部分作为username
    const username = email.split('@')[0];
    const activation_token = crypto.randomBytes(32).toString('hex');
    
    await pool.query(
      'INSERT INTO users (guid, username, email, password, is_active, activation_token, user_role) VALUES (UUID_TO_BIN(UUID()), ?, ?, ?, 0, ?, "user")',
      [username, email, hashedPassword, activation_token]
    );
    
    const link = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/activate?token=${activation_token}`;
    await sendMail(email, '激活您的账号', `<p>请点击以下链接激活账号：<a href="${link}">${link}</a></p>`);
    
    res.status(201).json({ success: true, message: getMessage('USER.REGISTER_SUCCESS'), data: null });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ success: false, message: getMessage('COMMON.SERVER_ERROR'), data: null });
  }
});

// 激活账号
router.get('/activate', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ success: false, message: getMessage('USER.INVALID_ACTIVATION_CODE'), data: null });
  
  const [users] = await pool.query('SELECT * FROM users WHERE activation_token = ?', [token]);
  if (users.length === 0) return res.status(400).json({ success: false, message: getMessage('USER.INVALID_ACTIVATION_CODE'), data: null });
  
  await pool.query('UPDATE users SET is_active=1, activation_token=NULL WHERE id=?', [users[0].id]);
  res.json({ success: true, message: getMessage('USER.ACTIVATION_SUCCESS'), data: null });
});

// 忘记密码，发送重置邮件
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: getMessage('USER.EMAIL_REQUIRED'), data: null });
  
  const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  if (users.length === 0) return res.status(400).json({ success: false, message: getMessage('USER.NOT_FOUND'), data: null });
  
  const reset_token = crypto.randomBytes(32).toString('hex');
  const expire = new Date(Date.now() + 1000 * 60 * 30); // 30分钟有效
  await pool.query('UPDATE users SET reset_token=?, reset_token_expire=? WHERE id=?', [reset_token, expire, users[0].id]);
  
  const link = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${reset_token}`;
  await sendMail(email, '重置密码', `<p>请点击以下链接重置密码（30分钟内有效）：<a href="${link}">${link}</a></p>`);
  
  res.json({ success: true, message: getMessage('USER.RESET_EMAIL_SENT'), data: null });
});

// 重置密码
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ success: false, message: getMessage('USER.INVALID_PARAMS'), data: null });
  
  const [users] = await pool.query('SELECT * FROM users WHERE reset_token = ?', [token]);
  if (users.length === 0) return res.status(400).json({ success: false, message: getMessage('USER.INVALID_RESET_CODE'), data: null });
  if (new Date(users[0].reset_token_expire) < new Date()) return res.status(400).json({ success: false, message: getMessage('USER.RESET_CODE_EXPIRED'), data: null });
  
  const hashedPassword = await bcrypt.hash(password, 10);
  await pool.query('UPDATE users SET password=?, reset_token=NULL, reset_token_expire=NULL WHERE id=?', [hashedPassword, users[0].id]);
  
  res.json({ success: true, message: getMessage('USER.PASSWORD_RESET_SUCCESS'), data: null });
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password, admin } = req.body; // admin: true/false
    // 查找用户
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND deleted = 0',
      [username]
    );
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: getMessage('USER.NOT_FOUND'), data: null });
    }
    
    const user = users[0];
    
    // 角色校验
    if (admin) {
      if (user.user_role !== 'admin') {
        return res.status(403).json({ success: false, message: getMessage('USER.NOT_ADMIN'), data: null });
      }
    } else {
      if (user.user_role !== 'user' || user.is_active !== 1) {
        return res.status(403).json({ success: false, message: getMessage('USER.NOT_ACTIVATED_OR_NO_PERMISSION'), data: null });
      }
    }

    // 密码校验
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: getMessage('USER.WRONG_PASSWORD'), data: null });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.user_role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 设置 Cookie
    res.cookie('aex-token', token, {
      httpOnly: process.env.NODE_ENV === 'production' ? true : false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000 // 1小时
    });

    res.json({
      success: true,
      message: getMessage('USER.LOGIN_SUCCESS'),
      data: {
        user: {
          email: user.email,
          role: user.user_role
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: getMessage('COMMON.SERVER_ERROR'), data: null });
  }
});

// 检查token有效性并续期
router.post('/check-token', verifyToken, async (req, res) => {
  try {
    // 生成新的token
    const newToken = jwt.sign(
      { userId: req.userId, email: req.userEmail, role: req.userRole },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 更新Cookie，有效期也为1小时
    res.cookie('aex-token', newToken, {
      httpOnly: process.env.NODE_ENV === 'production' ? true : false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000 // 1小时
    });

    res.json({ 
      success: true,
      message: getMessage('USER.TOKEN_VALID_RENEWED'),
      data: {
        user: {
          email: req.userEmail,
          role: req.userRole
        }
      }
    });
  } catch (error) {
    console.error('Token续期错误:', error);
    res.status(500).json({ success: false, message: getMessage('COMMON.SERVER_ERROR'), data: null });
  }
});

// 用户登出
router.post('/logout', (req, res) => {
  try {
    // 清除token cookie
    res.clearCookie('aex-token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    res.json({
      success: true,
      message: getMessage('USER.LOGOUT_SUCCESS'),
      data: null
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({ 
      success: false, 
      message: getMessage('COMMON.SERVER_ERROR'), 
      data: null 
    });
  }
});

// 获取用户信息
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, phone, user_role FROM users WHERE id = ? AND deleted = 0',
      [req.userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('USER.NOT_FOUND'),
        data: null
      });
    }
    
    res.json({
      success: true,
      message: getMessage('USER.PROFILE_SUCCESS'),
      data: users[0]
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: getMessage('COMMON.SERVER_ERROR'),
      data: null
    });
  }
});

// 管理员创建新管理员
router.post('/admin/create', verifyToken, isAdmin, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 检查用户是否已存在
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('USER.USERNAME_OR_EMAIL_EXISTS'),
        data: null
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新管理员
    const [result] = await pool.query(
      'INSERT INTO users (guid, username, email, password, user_role) VALUES (UUID_TO_BIN(UUID()), ?, ?, ?, "admin")',
      [username, email, hashedPassword]
    );
    
    res.status(201).json({
      success: true,
      message: getMessage('USER.ADMIN_CREATE_SUCCESS'),
      data: null
    });
  } catch (error) {
    console.error('创建管理员错误:', error);
    res.status(500).json({
      success: false,
      message: getMessage('COMMON.SERVER_ERROR'),
      data: null
    });
  }
});

// 获取所有用户列表（仅管理员）
router.get('/admin/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, phone, user_role, created_at FROM users WHERE deleted = 0'
    );
    
    res.json({
      success: true,
      message: getMessage('USER.LIST_SUCCESS'),
      data: users
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: getMessage('COMMON.SERVER_ERROR'),
      data: null
    });
  }
});

// 验证码接口
router.get('/captcha', (req, res) => {
  const captcha = svgCaptcha.create({
    size: 4,
    noise: 2,
    color: true,
    background: '#f2f2f2'
  });
  
  // 可将 captcha.text 存入 session 或 redis 以便后续校验
  req.session = req.session || {};
  req.session.captcha = captcha.text;
  
  res.type('svg');
  res.status(200).send(captcha.data);
});

module.exports = router;