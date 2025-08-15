const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const svgCaptcha = require('svg-captcha');
const { query } = require('../db/db');
const { sendMail } = require('../utils/email');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// 获取邮件翻译
async function getEmailTranslations(language = 'zh-CN') {
  try {
    const rows = await query(
      'SELECT code, value FROM language_translations WHERE lang = $1 AND code LIKE $2',
      [language, 'EMAIL_TEMPLATE.%']
    );
    
    const translations = {};
    rows.getRows().forEach(row => {
      translations[row.code] = row.value;
    });
    
    return translations;
  } catch (error) {
    console.error('获取邮件翻译失败:', error);
    // 返回默认中文翻译
    return {
      'EMAIL_TEMPLATE.ACTIVATION_SUBJECT': '激活您的账号',
      'EMAIL_TEMPLATE.ACTIVATION_CONTENT': '请点击以下链接激活账号：',
      'EMAIL_TEMPLATE.RESET_PASSWORD_SUBJECT': '重置密码',
      'EMAIL_TEMPLATE.RESET_PASSWORD_CONTENT': '请点击以下链接重置密码（30分钟内有效）：'
    };
  }
}

// 邮件模板函数
async function getEmailContent(type, language, data) {
  const translations = await getEmailTranslations(language);
  
  switch (type) {
    case 'activation':
      return {
        subject: translations['EMAIL_TEMPLATE.ACTIVATION_SUBJECT'] || 'Activate Your Account',
        html: `<p>${translations['EMAIL_TEMPLATE.ACTIVATION_CONTENT'] || 'Please click the following link to activate your account:'} <a href="${data.link}">${data.link}</a></p>`
      };
    case 'resetPassword':
      return {
        subject: translations['EMAIL_TEMPLATE.RESET_PASSWORD_SUBJECT'] || 'Reset Password',
        html: `<p>${translations['EMAIL_TEMPLATE.RESET_PASSWORD_CONTENT'] || 'Please click the following link to reset your password (valid for 30 minutes):'} <a href="${data.link}">${data.link}</a></p>`
      };
    default:
      return {
        subject: 'Notification',
        html: '<p>Notification</p>'
      };
  }
}
const { verifyToken, isAdmin } = require('../middleware/jwt');
const { getMessage } = require('../config/messages');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// 用户注册（只允许邮箱注册）
router.post('/register', async (req, res) => {
  try {
    const { email, password, captcha } = req.body;
    
    // 校验验证码
    if (!captcha) {
      return res.status(400).json({ success: false, message: getMessage('USER.CAPTCHA_REQUIRED'), data: null });
    }
    
    if (!req.session || !req.session.captcha) {
      return res.status(400).json({ success: false, message: getMessage('USER.CAPTCHA_EXPIRED'), data: null });
    }
    
    if (req.session.captcha.toLowerCase() !== captcha.toLowerCase()) {
      return res.status(400).json({ success: false, message: getMessage('USER.CAPTCHA_INVALID'), data: null });
    }
    
    // 验证码使用后立即清除
    delete req.session.captcha;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: getMessage('USER.EMAIL_PASSWORD_REQUIRED'), data: null });
    }
    // 检查邮箱是否已存在
    const existingUsers = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUsers.getRowCount() > 0) {
      return res.status(400).json({ success: false, message: getMessage('USER.EMAIL_EXISTS'), data: null });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    // 用邮箱@前的部分作为username
    const username = email.split('@')[0];
    const activation_token = crypto.randomBytes(32).toString('hex');
    
    // 获取默认业务组ID
    const defaultGroupRows = await query(
      'SELECT id FROM business_groups WHERE is_default = 1 AND deleted = false LIMIT 1'
    );
    const defaultBusinessGroupId = defaultGroupRows.getRowCount() > 0 ? defaultGroupRows.getFirstRow().id : null;
    
    await query(
      'INSERT INTO users (username, email, password, is_active, activation_token, user_role, business_group_id, currency, created_by, updated_by) VALUES ($1, $2, $3, 0, $4, $5, $6, $7, $8, $9)',
      [username, email, hashedPassword, activation_token, 'user', defaultBusinessGroupId, 'USD', null, null]
    );
    
    const link = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/activate?token=${activation_token}`;
    const emailContent = await getEmailContent('activation', 'en', { link }); // 默认使用英文
    await sendMail(email, emailContent.subject, emailContent.html);
    
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
  
  const users = await query('SELECT id FROM users WHERE activation_token = $1', [token]);
  if (users.getRowCount() === 0) return res.status(400).json({ success: false, message: getMessage('USER.INVALID_ACTIVATION_CODE'), data: null });
  
  await query('UPDATE users SET is_active=1, activation_token=NULL, updated_by=$1 WHERE id=$2', [users.getFirstRow().id, users.getFirstRow().id]);
  res.json({ success: true, message: getMessage('USER.ACTIVATION_SUCCESS'), data: null });
});

// 忘记密码，发送重置邮件
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: getMessage('USER.EMAIL_REQUIRED'), data: null });
  
  const users = await query('SELECT id, language FROM users WHERE email = $1', [email]);
  if (users.getRowCount() === 0) return res.status(400).json({ success: false, message: getMessage('USER.NOT_FOUND'), data: null });
  
  const reset_token = crypto.randomBytes(32).toString('hex');
  const expire = new Date(Date.now() + 1000 * 60 * 30); // 30分钟有效
  await query('UPDATE users SET reset_token=$1, reset_token_expire=$2, updated_by=$3 WHERE id=$4', [reset_token, expire, users.getFirstRow().id, users.getFirstRow().id]);
  
  const link = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${reset_token}`;
  const userLanguage = users.getFirstRow().language || 'en'; // 如果language为空，默认使用英文
  const emailContent = await getEmailContent('resetPassword', userLanguage, { link });
  await sendMail(email, emailContent.subject, emailContent.html);
  
  res.json({ success: true, message: getMessage('USER.RESET_EMAIL_SENT'), data: null });
});

// 重置密码
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ success: false, message: getMessage('USER.INVALID_PARAMS'), data: null });
  
  const users = await query('SELECT id, reset_token_expire FROM users WHERE reset_token = $1', [token]);
  if (users.getRowCount() === 0) return res.status(400).json({ success: false, message: getMessage('USER.INVALID_RESET_CODE'), data: null });
  if (new Date(users.getFirstRow().reset_token_expire) < new Date()) return res.status(400).json({ success: false, message: getMessage('USER.RESET_CODE_EXPIRED'), data: null });
  
  const hashedPassword = await bcrypt.hash(password, 10);
  await query('UPDATE users SET password=$1, reset_token=NULL, reset_token_expire=NULL, updated_by=$2 WHERE id=$3', [hashedPassword, users.getFirstRow().id, users.getFirstRow().id]);
  
  res.json({ success: true, message: getMessage('USER.PASSWORD_RESET_SUCCESS'), data: null });
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password, admin } = req.body; // admin: true/false
    // 查找用户（获取完整信息用于生成token）
    const users = await query(
      'SELECT id, username, email, phone, password, user_role, is_active, currency FROM users WHERE (email = $1 or username = $2) AND deleted = false',
      [username, username]
    );
    if (users.getRowCount() === 0) {
      return res.status(401).json({ success: false, message: getMessage('USER.NOT_FOUND'), data: null });
    }
    
    const user = users.getFirstRow();
    
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

    // 生成包含完整用户信息的JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        email: user.email, 
        phone: user.phone,
        role: user.user_role, 
        currency: user.currency 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 设置 Cookie
    res.cookie('aex-token', token, {
      httpOnly: process.env.NODE_ENV === 'production' ? true : false,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000 // 1小时
    });

    // 直接返回用户信息，不再额外查询数据库
    res.json({
      success: true,
      message: getMessage('USER.LOGIN_SUCCESS'),
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.user_role,
          currency: user.currency
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
    // 生成新的token，包含完整用户信息
    const newToken = jwt.sign(
      { 
        userId: req.userId, 
        username: req.username,
        email: req.userEmail, 
        phone: req.phone,
        role: req.userRole, 
        currency: req.userCurrency 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 更新Cookie，有效期也为1小时
    res.cookie('aex-token', newToken, {
      httpOnly: process.env.NODE_ENV === 'production' ? true : false,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000 // 1小时
    });

    // 直接从token中获取用户信息，不再查询数据库
    res.json({ 
      success: true,
      message: getMessage('USER.TOKEN_VALID_RENEWED'),
      data: {
        user: {
          id: req.userId,
          username: req.username,
          email: req.userEmail,
          phone: req.phone,
          role: req.userRole,
          currency: req.userCurrency
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
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax'
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
    const users = await query(
      'SELECT id, username, email, phone, user_role, currency FROM users WHERE id = $1 AND deleted = false',
      [req.userId]
    );
    
    if (users.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('USER.NOT_FOUND'),
        data: null
      });
    }
    
    res.json({
      success: true,
      message: getMessage('USER.PROFILE_SUCCESS'),
      data: users.getFirstRow()
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

// 更新用户信息（动态更新）
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const updateData = req.body;
    
    // 定义允许更新的字段
    const allowedFields = ['username', 'email', 'phone', 'currency'];
    
    // 过滤出有效的更新字段
    const fieldsToUpdate = {};
    for (const field of allowedFields) {
      if (updateData.hasOwnProperty(field) && updateData[field] !== undefined) {
        fieldsToUpdate[field] = updateData[field];
      }
    }
    
    // 如果没有要更新的字段
    if (Object.keys(fieldsToUpdate).length === 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('USER.NO_FIELDS_TO_UPDATE'),
        data: null
      });
    }
    
    // 验证字段格式
    if (fieldsToUpdate.phone) {
      const phoneRegex = /^[+]?[\d\s\-()]+$/;
      if (!phoneRegex.test(fieldsToUpdate.phone)) {
        return res.status(400).json({
          success: false,
          message: getMessage('USER.INVALID_PHONE_FORMAT'),
          data: null
        });
      }
    }
    
    if (fieldsToUpdate.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(fieldsToUpdate.email)) {
        return res.status(400).json({
          success: false,
          message: getMessage('USER.INVALID_EMAIL_FORMAT'),
          data: null
        });
      }
      
      // 检查邮箱是否已被其他用户使用
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2 AND deleted = false',
        [fieldsToUpdate.email, req.userId]
      );
      
      if (existingUser.getRowCount() > 0) {
        return res.status(400).json({
          success: false,
          message: getMessage('USER.EMAIL_EXISTS'),
          data: null
        });
      }
    }
    
    if (fieldsToUpdate.username) {
      // 检查用户名是否已被其他用户使用
      const existingUser = await query(
        'SELECT id FROM users WHERE username = $1 AND id != $2 AND deleted = false',
        [fieldsToUpdate.username, req.userId]
      );
      
      if (existingUser.getRowCount() > 0) {
        return res.status(400).json({
          success: false,
          message: getMessage('USER.USERNAME_EXISTS'),
          data: null
        });
      }
    }
    
    if (fieldsToUpdate.currency) {
      // 验证货币代码格式（3位字母）
      const currencyRegex = /^[A-Z]{3}$/;
      if (!currencyRegex.test(fieldsToUpdate.currency)) {
        return res.status(400).json({
          success: false,
          message: getMessage('USER.INVALID_CURRENCY_FORMAT'),
          data: null
        });
      }
    }
    
    // 构建动态SQL更新语句
    const updateFields = Object.keys(fieldsToUpdate);
    const updateValues = Object.values(fieldsToUpdate);
    
    const setClause = updateFields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const sql = `UPDATE users SET ${setClause}, updated_by = $${updateFields.length + 1}, updated_at = NOW() WHERE id = $${updateFields.length + 2} AND deleted = false`;
    
    await query(sql, [...updateValues, req.userId, req.userId]);
    
    res.json({
      success: true,
      message: getMessage('USER.PROFILE_UPDATE_SUCCESS'),
      data: null
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
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
    const existingUsers = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUsers.getRowCount() > 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('USER.USERNAME_OR_EMAIL_EXISTS'),
        data: null
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新管理员
    const result = await query(
      'INSERT INTO users (username, email, password, user_role, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $6)',
      [username, email, hashedPassword, 'admin', req.userId, req.userId]
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
    const users = await query(
      'SELECT id, username, email, phone, user_role, created_at FROM users WHERE deleted = false'
    );
    
    res.json({
      success: true,
      message: getMessage('USER.LIST_SUCCESS'),
      data: users.getRows()
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

// 国家和省份数据缓存
let countriesCache = null;
let statesCache = null;
let lastModified = {
  countries: null,
  states: null
};

// 加载国家和省份数据
function loadCountryStateData() {
  try {
    const countriesPath = path.join(__dirname, '../public/country_state/countries.json');
    const statesPath = path.join(__dirname, '../public/country_state/states.json');
    
    // 检查文件修改时间
    const countriesStats = fs.statSync(countriesPath);
    const statesStats = fs.statSync(statesPath);
    
    const countriesModified = countriesStats.mtime.getTime();
    const statesModified = statesStats.mtime.getTime();
    
    // 如果文件有更新或缓存为空，重新加载数据
    if (!countriesCache || lastModified.countries !== countriesModified) {
      const countriesData = JSON.parse(fs.readFileSync(countriesPath, 'utf8'));
      countriesCache = countriesData.map(country => ({
        id: country.id,
        name: country.name,
        iso3: country.iso3,
        phone_code: country.phone_code
      }));
      lastModified.countries = countriesModified;
    }
    
    if (!statesCache || lastModified.states !== statesModified) {
      const statesData = JSON.parse(fs.readFileSync(statesPath, 'utf8'));
      statesCache = statesData.map(state => ({
        id: state.id,
        name: state.name,
        country_id: state.country_id,
        state_code: state.state_code
      }));
      lastModified.states = statesModified;
    }
    
    return {
      countries: countriesCache,
      states: statesCache,
      lastModified: {
        countries: lastModified.countries,
        states: lastModified.states
      }
    };
  } catch (error) {
    console.error('加载国家省份数据失败:', error);
    return null;
  }
}

// 获取国家和省份数据
router.get('/country-state-data', (req, res) => {
  try {
    const clientLastModified = {
      countries: parseInt(req.query.countries_last_modified) || 0,
      states: parseInt(req.query.states_last_modified) || 0
    };
    
    const data = loadCountryStateData();
    if (!data) {
      return res.status(500).json({
        success: false,
        message: getMessage('LOAD_DATA_FAILED'),
        data: null
      });
    }
    
    // 检查是否需要更新
    const needUpdate = 
      clientLastModified.countries !== data.lastModified.countries ||
      clientLastModified.states !== data.lastModified.states;
    
    if (!needUpdate) {
      return res.json({
        success: true,
        message: getMessage('DATA_NO_UPDATE'),
        data: {
          updated: false,
          last_modified: data.lastModified
        }
      });
    }
    
    // 返回数据
    const responseData = {
      countries: data.countries,
      states: data.states,
      last_modified: data.lastModified
    };
    
    res.json({
      success: true,
      message: getMessage('DATA_UPDATED'),
      data: {
        updated: true,
        ...responseData
      }
    });
  } catch (error) {
    console.error('获取国家省份数据失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('SERVER_ERROR'),
      data: null
    });
  }
});

module.exports = router;