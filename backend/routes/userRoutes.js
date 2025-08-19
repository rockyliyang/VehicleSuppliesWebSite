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

// 从数据库加载国家和省份数据
async function loadCountryStateData() {
  try {
    // 获取countries表的最大更新时间
    const countriesMaxTimeResult = await query(
      'SELECT EXTRACT(EPOCH FROM MAX(updated_at)) * 1000 as max_time FROM countries WHERE deleted = false'
    );
    const countriesMaxTime = countriesMaxTimeResult.getFirstRow()?.max_time || 0;
    
    // 获取states表的最大更新时间
    const statesMaxTimeResult = await query(
      'SELECT EXTRACT(EPOCH FROM MAX(updated_at)) * 1000 as max_time FROM states WHERE deleted = false'
    );
    const statesMaxTime = statesMaxTimeResult.getFirstRow()?.max_time || 0;
    
    // 如果数据有更新或缓存为空，重新加载数据
    if (!countriesCache || lastModified.countries !== countriesMaxTime) {
      const countriesResult = await query(
        `SELECT c.id, c.name, c.iso3, c.iso2, c.phone_code, c.tax_rate, c.shipping_rate, c.shipping_rate_type,
                COALESCE(
                  JSON_AGG(
                    JSON_BUILD_OBJECT(
                      'id', t.id,
                      'value', t.value,
                      'type', t.type,
                      'description', t.description
                    ) ORDER BY t.value
                  ) FILTER (WHERE t.id IS NOT NULL), 
                  '[]'::json
                ) as tags
         FROM countries c
         LEFT JOIN country_tags ct ON c.id = ct.country_id AND ct.deleted = false
         LEFT JOIN tags t ON ct.tag_id = t.id AND t.deleted = false
         WHERE c.deleted = false AND c.status = 'active' 
         GROUP BY c.id, c.name, c.iso3, c.iso2, c.phone_code, c.tax_rate, c.shipping_rate, c.shipping_rate_type
         ORDER BY c.name`
      );
      
      countriesCache = countriesResult.getRows().map(country => ({
        id: country.id,
        name: country.name,
        iso3: country.iso3,
        iso2: country.iso2,
        phone_code: country.phone_code,
        tax_rate: country.tax_rate,
        shipping_rate: country.shipping_rate,
        shipping_rate_type: country.shipping_rate_type,
        tags: country.tags
      }));
      lastModified.countries = countriesMaxTime;
    }
    
    if (!statesCache || lastModified.states !== statesMaxTime) {
      const statesResult = await query(
        `SELECT id, name, country_id, state_code, tax_rate, shipping_rate, shipping_rate_type 
         FROM states 
         WHERE deleted = false AND status = 'active' 
         ORDER BY country_id, name`
      );
      
      statesCache = statesResult.getRows().map(state => ({
        id: state.id,
        name: state.name,
        country_id: state.country_id,
        state_code: state.state_code,
        tax_rate: state.tax_rate,
        shipping_rate: state.shipping_rate,
        shipping_rate_type: state.shipping_rate_type
      }));
      lastModified.states = statesMaxTime;
    }
    
    // 计算整体最后修改时间
    const overallLastModified = Math.max(countriesMaxTime, statesMaxTime);
    
    return {
      countries: countriesCache,
      states: statesCache,
      lastModified: {
        countries: lastModified.countries,
        states: lastModified.states,
        overall: overallLastModified
      }
    };
  } catch (error) {
    console.error('加载国家省份数据失败:', error);
    return null;
  }
}

// 获取国家和省份数据
router.get('/country-state-data', async (req, res) => {
  try {
    const clientLastModified = {
      countries: parseInt(req.query.countries_last_modified) || 0,
      states: parseInt(req.query.states_last_modified) || 0,
      overall: parseInt(req.query.overall_last_modified) || 0
    };
    
    const data = await loadCountryStateData();
    if (!data) {
      return res.status(500).json({
        success: false,
        message: getMessage('LOAD_DATA_FAILED'),
        data: null
      });
    }
    
    // 检查是否需要更新（使用整体最后修改时间进行比较）
    const needUpdate = clientLastModified.overall !== data.lastModified.overall;
    
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
    
    // 返回数据，包含税率和运费信息
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

// 国家管理接口

// 获取所有国家（管理员）
router.get('/admin/countries', verifyToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;
    
    let whereClause = 'WHERE c.deleted = false';
    const params = [];
    let paramIndex = 1;
    
    if (search) {
      whereClause += ` AND (c.name ILIKE $${paramIndex} OR c.iso3 ILIKE $${paramIndex} OR c.iso2 ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (status) {
      whereClause += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    // 获取总数
    const countResult = await query(`SELECT COUNT(*) as total FROM countries c ${whereClause}`, params);
    const total = parseInt(countResult.getFirstRow().total);
    
    // 获取分页数据
    const offset = (page - 1) * limit;
    const countriesResult = await query(
      `SELECT c.id, c.name, c.iso3, c.iso2, c.phone_code, c.tax_rate, c.shipping_rate, c.shipping_rate_type, c.status, c.created_at, c.updated_at,
              COALESCE(
                JSON_AGG(
                  JSON_BUILD_OBJECT(
                    'id', t.id,
                    'value', t.value,
                    'type', t.type,
                    'description', t.description
                  ) ORDER BY t.value
                ) FILTER (WHERE t.id IS NOT NULL), 
                '[]'::json
              ) as tags
       FROM countries c
       LEFT JOIN country_tags ct ON c.id = ct.country_id AND ct.deleted = false
       LEFT JOIN tags t ON ct.tag_id = t.id AND t.deleted = false
       ${whereClause} 
       GROUP BY c.id, c.name, c.iso3, c.iso2, c.phone_code, c.tax_rate, c.shipping_rate, c.shipping_rate_type, c.status, c.created_at, c.updated_at
       ORDER BY c.name 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );
    
    res.json({
      success: true,
      message: getMessage('COMMON.SUCCESS'),
      data: {
        countries: countriesResult.getRows(),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取国家列表失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('COMMON.SERVER_ERROR'),
      data: null
    });
  }
});

// 创建国家（管理员）
router.post('/admin/countries', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, iso3, iso2, phone_code, tax_rate, shipping_rate, shipping_rate_type, status } = req.body;
    
    if (!name || !iso3 || !iso2) {
      return res.status(400).json({
        success: false,
        message: getMessage('COMMON.REQUIRED_FIELDS_MISSING'),
        data: null
      });
    }
    
    // 检查ISO代码是否已存在
    const existingCountry = await query(
      'SELECT id FROM countries WHERE (iso3 = $1 OR iso2 = $2) AND deleted = false',
      [iso3, iso2]
    );
    
    if (existingCountry.getRowCount() > 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('COUNTRY.ISO_CODE_EXISTS'),
        data: null
      });
    }
    
    const result = await query(
      `INSERT INTO countries (name, iso3, iso2, phone_code, tax_rate, shipping_rate, shipping_rate_type, status, created_by, updated_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING id`,
      [name, iso3, iso2, phone_code || null, tax_rate || 0, shipping_rate || 0, shipping_rate_type || 'fixed', status || 'active', req.userId, req.userId]
    );
    
    res.status(201).json({
      success: true,
      message: getMessage('COUNTRY.CREATE_SUCCESS'),
      data: { id: result.getFirstRow().id }
    });
  } catch (error) {
    console.error('创建国家失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('COMMON.SERVER_ERROR'),
      data: null
    });
  }
});

// 更新国家（管理员）
router.put('/admin/countries/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, iso3, iso2, phone_code, tax_rate, shipping_rate, shipping_rate_type, status, tags } = req.body;
    
    if (!name || !iso3 || !iso2) {
      return res.status(400).json({
        success: false,
        message: getMessage('COMMON.REQUIRED_FIELDS_MISSING'),
        data: null
      });
    }
    
    // 检查国家是否存在
    const existingCountry = await query(
      'SELECT id FROM countries WHERE id = $1 AND deleted = false',
      [id]
    );
    
    if (existingCountry.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('COUNTRY.NOT_FOUND'),
        data: null
      });
    }
    
    // 检查ISO代码是否被其他国家使用
    const duplicateCountry = await query(
      'SELECT id FROM countries WHERE (iso3 = $1 OR iso2 = $2) AND id != $3 AND deleted = false',
      [iso3, iso2, id]
    );
    
    if (duplicateCountry.getRowCount() > 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('COUNTRY.ISO_CODE_EXISTS'),
        data: null
      });
    }
    
    await query(
      `UPDATE countries 
       SET name = $1, iso3 = $2, iso2 = $3, phone_code = $4, tax_rate = $5, shipping_rate = $6, shipping_rate_type = $7, status = $8, updated_by = $9, updated_at = NOW() 
       WHERE id = $10`,
      [name, iso3, iso2, phone_code || null, tax_rate || 0, shipping_rate || 0, shipping_rate_type || 'fixed', status || 'active', req.userId, id]
    );

    // 更新country的tags - 使用PostgreSQL MERGE语法优化
    if (tags && Array.isArray(tags)) {
      // 使用事务处理tags更新
      await query('BEGIN');
      
      try {
        // 使用MERGE语法进行高效的标签更新
        if (tags.length > 0) {
          // 构建VALUES子句
          const tagValues = tags.map((tagId, index) => {
            const baseIndex = index * 2;
            return `($${baseIndex + 1}, $${baseIndex + 2})`;
          }).join(', ');
          
          const tagParams = [];
          tags.forEach(tagId => {
            tagParams.push(parseInt(id), parseInt(tagId)); // country_id, tag_id - 确保都是整数类型
          });
          
          // 使用WITH子句和MERGE逻辑进行高效更新
          await query(`
            WITH new_tags AS (
              SELECT country_id::BIGINT, tag_id::BIGINT FROM (VALUES ${tagValues}) AS t(country_id, tag_id)
            ),
            existing_tags AS (
              SELECT country_id, tag_id FROM country_tags 
              WHERE country_id = CAST($1 AS BIGINT) AND deleted = false
            ),
            to_delete AS (
              SELECT et.country_id, et.tag_id FROM existing_tags et
              LEFT JOIN new_tags nt ON et.country_id = nt.country_id AND et.tag_id = nt.tag_id
              WHERE nt.tag_id IS NULL
            ),
            to_insert AS (
              SELECT nt.country_id, nt.tag_id FROM new_tags nt
              LEFT JOIN existing_tags et ON nt.country_id = et.country_id AND nt.tag_id = et.tag_id
              WHERE et.tag_id IS NULL
            ),
            delete_old AS (
              UPDATE country_tags SET deleted = true, updated_by = $${tags.length * 2 + 1}, updated_at = NOW()
              WHERE (country_id, tag_id) IN (SELECT country_id, tag_id FROM to_delete)
              RETURNING 1
            )
            INSERT INTO country_tags (guid, country_id, tag_id, created_by, updated_by, created_at, updated_at, deleted)
            SELECT gen_random_uuid(), country_id, tag_id, $${tags.length * 2 + 1}, $${tags.length * 2 + 2}, NOW(), NOW(), false
            FROM to_insert
          `, [...tagParams, req.userId, req.userId]);
        } else {
          // 如果tags为空数组，删除所有现有关联
          await query(
            'UPDATE country_tags SET deleted = true, updated_by = $1, updated_at = NOW() WHERE country_id = $2 AND deleted = false',
            [req.userId, parseInt(id)]
          );
        }
        
        await query('COMMIT');
      } catch (tagError) {
        await query('ROLLBACK');
        throw tagError;
      }
    }

    res.json({
      success: true,
      message: getMessage('COUNTRY.UPDATE_SUCCESS'),
      data: null
    });
  } catch (error) {
    console.error('更新国家失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('COMMON.SERVER_ERROR'),
      data: null
    });
  }
});

// 删除国家（管理员）
router.delete('/admin/countries/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查国家是否存在
    const existingCountry = await query(
      'SELECT id FROM countries WHERE id = $1 AND deleted = false',
      [id]
    );
    
    if (existingCountry.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('COUNTRY.NOT_FOUND'),
        data: null
      });
    }
    
    // 检查是否有关联的省份
    const relatedStates = await query(
      'SELECT id FROM states WHERE country_id = $1 AND deleted = false',
      [id]
    );
    
    if (relatedStates.getRowCount() > 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('COUNTRY.HAS_RELATED_STATES'),
        data: null
      });
    }
    
    // 软删除
    await query(
      'UPDATE countries SET deleted = true, updated_by = $1, updated_at = NOW() WHERE id = $2',
      [req.userId, id]
    );
    
    res.json({
      success: true,
      message: getMessage('COUNTRY.DELETE_SUCCESS'),
      data: null
    });
  } catch (error) {
    console.error('删除国家失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('COMMON.SERVER_ERROR'),
      data: null
    });
  }
});

// 省份管理接口

// 获取所有省份（管理员）
router.get('/admin/states', verifyToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', country_id = '', status = '' } = req.query;
    
    let whereClause = 'WHERE s.deleted = false';
    const params = [];
    let paramIndex = 1;
    
    if (search) {
      whereClause += ` AND (s.name ILIKE $${paramIndex} OR s.state_code ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (country_id) {
      whereClause += ` AND s.country_id = $${paramIndex}`;
      params.push(country_id);
      paramIndex++;
    }
    
    if (status) {
      whereClause += ` AND s.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    // 获取总数
    const countResult = await query(
      `SELECT COUNT(*) as total FROM states s ${whereClause}`,
      params
    );
    const total = parseInt(countResult.getFirstRow().total);
    
    // 获取分页数据
    const offset = (page - 1) * limit;
    const statesResult = await query(
      `SELECT s.id, s.name, s.country_id, s.state_code, s.tax_rate, s.shipping_rate, s.shipping_rate_type, s.status, s.created_at, s.updated_at, c.name as country_name 
       FROM states s 
       LEFT JOIN countries c ON s.country_id = c.id 
       ${whereClause} 
       ORDER BY c.name, s.name 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );
    
    res.json({
      success: true,
      message: getMessage('COMMON.SUCCESS'),
      data: {
        states: statesResult.getRows(),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取省份列表失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('COMMON.SERVER_ERROR'),
      data: null
    });
  }
});

// 创建省份（管理员）
router.post('/admin/states', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, country_id, state_code, tax_rate, shipping_rate, shipping_rate_type, status } = req.body;
    
    if (!name || !country_id) {
      return res.status(400).json({
        success: false,
        message: getMessage('COMMON.REQUIRED_FIELDS_MISSING'),
        data: null
      });
    }
    
    // 检查国家是否存在
    const country = await query(
      'SELECT id FROM countries WHERE id = $1 AND deleted = false',
      [country_id]
    );
    
    if (country.getRowCount() === 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('COUNTRY.NOT_FOUND'),
        data: null
      });
    }
    
    // 检查省份代码是否在同一国家内已存在
    if (state_code) {
      const existingState = await query(
        'SELECT id FROM states WHERE country_id = $1 AND state_code = $2 AND deleted = false',
        [country_id, state_code]
      );
      
      if (existingState.getRowCount() > 0) {
        return res.status(400).json({
          success: false,
          message: getMessage('STATE.CODE_EXISTS'),
          data: null
        });
      }
    }
    
    const result = await query(
      `INSERT INTO states (name, country_id, state_code, tax_rate, shipping_rate, shipping_rate_type, status, created_by, updated_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING id`,
      [name, country_id, state_code || null, tax_rate || 0, shipping_rate || 0, shipping_rate_type || 'fixed', status || 'active', req.userId, req.userId]
    );
    
    res.status(201).json({
      success: true,
      message: getMessage('STATE.CREATE_SUCCESS'),
      data: { id: result.getFirstRow().id }
    });
  } catch (error) {
    console.error('创建省份失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('COMMON.SERVER_ERROR'),
      data: null
    });
  }
});

// 更新省份（管理员）
router.put('/admin/states/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, country_id, state_code, tax_rate, shipping_rate, shipping_rate_type, status } = req.body;
    
    if (!name || !country_id) {
      return res.status(400).json({
        success: false,
        message: getMessage('COMMON.REQUIRED_FIELDS_MISSING'),
        data: null
      });
    }
    
    // 检查省份是否存在
    const existingState = await query(
      'SELECT id FROM states WHERE id = $1 AND deleted = false',
      [id]
    );
    
    if (existingState.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('STATE.NOT_FOUND'),
        data: null
      });
    }
    
    // 检查国家是否存在
    const country = await query(
      'SELECT id FROM countries WHERE id = $1 AND deleted = false',
      [country_id]
    );
    
    if (country.getRowCount() === 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('COUNTRY.NOT_FOUND'),
        data: null
      });
    }
    
    // 检查省份代码是否被同一国家的其他省份使用
    if (state_code) {
      const duplicateState = await query(
        'SELECT id FROM states WHERE country_id = $1 AND state_code = $2 AND id != $3 AND deleted = false',
        [country_id, state_code, id]
      );
      
      if (duplicateState.getRowCount() > 0) {
        return res.status(400).json({
          success: false,
          message: getMessage('STATE.CODE_EXISTS'),
          data: null
        });
      }
    }
    
    await query(
      `UPDATE states 
       SET name = $1, country_id = $2, state_code = $3, tax_rate = $4, shipping_rate = $5, shipping_rate_type = $6, status = $7, updated_by = $8, updated_at = NOW() 
       WHERE id = $9`,
      [name, country_id, state_code || null, tax_rate || 0, shipping_rate || 0, shipping_rate_type || 'fixed', status || 'active', req.userId, id]
    );
    
    res.json({
      success: true,
      message: getMessage('STATE.UPDATE_SUCCESS'),
      data: null
    });
  } catch (error) {
    console.error('更新省份失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('COMMON.SERVER_ERROR'),
      data: null
    });
  }
});

// 删除省份（管理员）
router.delete('/admin/states/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查省份是否存在
    const existingState = await query(
      'SELECT id FROM states WHERE id = $1 AND deleted = false',
      [id]
    );
    
    if (existingState.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('STATE.NOT_FOUND'),
        data: null
      });
    }
    
    // 软删除
    await query(
      'UPDATE states SET deleted = true, updated_by = $1, updated_at = NOW() WHERE id = $2',
      [req.userId, id]
    );
    
    res.json({
      success: true,
      message: getMessage('STATE.DELETE_SUCCESS'),
      data: null
    });
  } catch (error) {
    console.error('删除省份失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('COMMON.SERVER_ERROR'),
      data: null
    });
  }
});

// 获取country类型标签（管理员）
router.get('/admin/country-tags', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, guid, value, description FROM tags WHERE type = $1 AND status = $2 AND deleted = false ORDER BY value ASC',
      ['country', 'active']
    );

    res.json({
      success: true,
      message: getMessage('TAG.LIST_SUCCESS'),
      data: {
        tags: result.getRows()
      }
    });
  } catch (error) {
    console.error('获取country标签失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('COMMON.SERVER_ERROR'),
      data: null
    });
  }
});

module.exports = router;