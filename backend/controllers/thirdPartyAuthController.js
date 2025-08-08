const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query, getConnection } = require('../db/db');
const { getMessage } = require('../config/messages');
const Joi = require('joi');
const appleSignin = require('apple-signin-auth');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { getProxyForUrl } = require('proxy-from-env');

/**
 * 自动检测系统代理设置
 * @param {string} url - 目标URL
 * @returns {string|null} 代理URL或null
 */
function getSystemProxy(url) {
  try {
    // 使用 proxy-from-env 库自动检测代理
    // 它会检查环境变量：HTTP_PROXY, HTTPS_PROXY, NO_PROXY 等
    const proxyUrl = getProxyForUrl(url);
    if (proxyUrl) {
      console.log(`Auto-detected proxy for ${url}: ${proxyUrl}`);
      return proxyUrl;
    }
    
    // 如果没有检测到代理，返回null
    return null;
  } catch (error) {
    console.warn('Failed to detect system proxy:', error.message);
    return null;
  }
}

class ThirdPartyAuthController {
  constructor() {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    this.encryptionKey = process.env.THIRD_PARTY_ENCRYPTION_KEY || 'default-key-change-in-production';
  }

  // 加密token
  encryptToken(token) {
    if (!token) return null;
    try {
      const iv = crypto.randomBytes(16); // 生成随机初始化向量
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32); // 生成密钥
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(token, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return iv.toString('hex') + ':' + encrypted; // 将IV和加密数据组合
    } catch (error) {
      console.error('Token encryption failed:', error);
      return null;
    }
  }

  // 解密token
  decryptToken(encryptedToken) {
    if (!encryptedToken) return null;
    try {
      const parts = encryptedToken.split(':');
      if (parts.length !== 2) {
        console.error('Invalid encrypted token format');
        return null;
      }
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32); // 生成相同的密钥
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Token decryption failed:', error);
      return null;
    }
  }

  // 生成JWT token
  generateJWT(user) {
    const payload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      currency: user.currency
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET, { 
      expiresIn: '1h' 
    });
  }

  // 查找或创建用户
  async findOrCreateUser(providerData, provider) {
    const connection = await getConnection();
    try {
      await connection.beginTransaction();

      const { providerId, email, name, avatar } = providerData;
      const providerIdField = `${provider}_id`;

      // 1. 先查找是否已存在该第三方账号
      let userQuery = `
        SELECT id, username, email, phone, user_role as role, currency, avatar_url, login_source, is_active, guid
        FROM users 
        WHERE ${providerIdField} = $1 AND deleted = FALSE
      `;
      let userResult = await connection.query(userQuery, [providerId]);

      if (userResult.rows && userResult.rows.length > 0) {
        // 更新最后登录时间
        await this.updateThirdPartyLoginRecord(connection, userResult.rows[0].id, provider, providerData);
        await connection.commit();
        return { user: userResult.rows[0], isNew: false };
      }

      // 2. 查找是否有相同邮箱的用户
      if (email) {
        userQuery = 'SELECT id, username, email, phone, user_role as role, currency, avatar_url, login_source, is_active, guid FROM users WHERE email = $1 AND deleted = FALSE';
        userResult = await connection.query(userQuery, [email]);

        if (userResult.rows && userResult.rows.length > 0) {
          // 绑定第三方账号到现有用户
          const updateQuery = `
            UPDATE users 
            SET ${providerIdField} = $1, 
                avatar_url = COALESCE(avatar_url, $2),
                third_party_email = COALESCE(third_party_email, $3),
                login_source = CASE 
                  WHEN login_source = 'local' THEN 'mixed'
                  ELSE login_source
                END,
                is_email_verified = TRUE,
                updated_at = NOW()
            WHERE id = $4
          `;
          
          await connection.query(updateQuery, [
            providerId, avatar, email, userResult.rows[0].id
          ]);

          // 获取更新后的用户信息
          const updatedUser = await connection.query('SELECT id, username, email, phone, user_role as role, currency, avatar_url, login_source, is_active, guid FROM users WHERE id = $1', [userResult.rows[0].id]);

          await this.createThirdPartyLoginRecord(connection, userResult.rows[0].id, provider, providerData);
          await connection.commit();
          return { user: updatedUser.rows[0], isNew: false };
        }
      }

      // 3. 创建新用户
      const username = this.generateUsername(email, name, provider);
      const insertQuery = `
        INSERT INTO users (
          username, email, password, ${providerIdField}, avatar_url, third_party_email,
          login_source, is_email_verified, is_active, user_role, currency, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING id, username, email, phone, user_role as role, currency, avatar_url, login_source, is_active, guid
      `;
      
      const insertResult = await connection.query(insertQuery, [
        username, email, '111111', providerId, avatar, email,
        provider, true, 1, 'user', 'USD'
      ]);

      const newUser = insertResult.rows[0];
      await this.createThirdPartyLoginRecord(connection, newUser.id, provider, providerData);
      await connection.commit();
      return { user: newUser, isNew: true };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 生成用户名
  generateUsername(email, name, provider) {
    if (name) {
      return name.replace(/\s+/g, '_').toLowerCase();
    }
    if (email) {
      return email.split('@')[0];
    }
    return `${provider}_user_${Date.now()}`;
  }

  // 创建第三方登录记录
  async createThirdPartyLoginRecord(connection, userId, provider, providerData) {
    const { providerId, email, name, accessToken, refreshToken, expiresAt } = providerData;
    
    const insertQuery = `
      INSERT INTO third_party_logins (
        user_id, provider, provider_user_id, provider_email, provider_name,
        access_token, refresh_token, token_expires_at, last_login_at,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), NOW())
    `;
    
    await connection.query(insertQuery, [
      userId, provider, providerId, email, name,
      this.encryptToken(accessToken), this.encryptToken(refreshToken), expiresAt
    ]);
  }

  // 更新第三方登录记录
  async updateThirdPartyLoginRecord(connection, userId, provider, providerData) {
    const { accessToken, refreshToken, expiresAt } = providerData;
    
    const updateQuery = `
      UPDATE third_party_logins 
      SET access_token = $1,
          refresh_token = $2,
          token_expires_at = $3,
          last_login_at = NOW(),
          updated_at = NOW()
      WHERE user_id = $4 AND provider = $5 AND deleted = FALSE
    `;
    
    await connection.query(updateQuery, [
      this.encryptToken(accessToken), this.encryptToken(refreshToken), expiresAt,
      userId, provider
    ]);
  }

  /**
   * Apple登录回调处理
   * POST /api/auth/apple/callback
   */
  async appleCallback(req, res) {
    try {
      const schema = Joi.object({
        authorizationCode: Joi.string().required(),
        identityToken: Joi.string().required(),
        user: Joi.object().optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: getMessage('USER.THIRD_PARTY_LOGIN_FAILED'),
          errorCode: 'VALIDATION_ERROR'
        });
      }

      const { authorizationCode, identityToken, user } = value;

      // 验证Apple身份令牌
      const appleUser = await appleSignin.verifyIdToken(identityToken, {
        audience: process.env.APPLE_CLIENT_ID,
        ignoreExpiration: false
      });

      if (!appleUser) {
        return res.status(401).json({
          success: false,
          message: messages.APPLE_AUTH_FAILED,
          errorCode: 'APPLE_AUTH_FAILED'
        });
      }

      // 构建提供商数据
      const providerData = {
        providerId: appleUser.sub,
        email: appleUser.email || (user && user.email),
        name: user && user.name ? `${user.name.firstName} ${user.name.lastName}` : null,
        avatar: null, // Apple不提供头像
        accessToken: authorizationCode,
        refreshToken: null,
        expiresAt: new Date(appleUser.exp * 1000)
      };

      // 查找或创建用户
      const { user: dbUser, isNew } = await this.findOrCreateUser(providerData, 'apple');

      // 生成JWT
      const token = this.generateJWT(dbUser);

      // 设置cookie
      res.cookie('aex-token', token, {
        httpOnly: process.env.NODE_ENV === 'production' ? true : false,
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000 // 1小时
      });

      res.json({
        success: true,
        message: getMessage('USER.THIRD_PARTY_LOGIN_SUCCESS'),
        data: {
          token,
          user: {
            id: dbUser.id,
            username: dbUser.username,
            email: dbUser.email,
            phone: dbUser.phone,
            user_role: dbUser.role,
            currency: dbUser.currency,
            avatar_url: dbUser.avatar_url,
            login_source: dbUser.login_source
          },
          isNewUser: isNew
        }
      });

    } catch (error) {
      console.error('Apple login error:', error);
      res.status(500).json({
        success: false,
        message: messages.APPLE_AUTH_FAILED,
        errorCode: 'APPLE_AUTH_FAILED'
      });
    }
  }

  /**
   * Google登录回调处理
   * POST /api/auth/google/callback
   */
  async googleCallback(req, res) {
    try {
      const schema = Joi.object({
        accessToken: Joi.string().optional(),
        idToken: Joi.string().optional(),
        userInfo: Joi.object().optional()
      }).or('idToken', 'userInfo'); // 至少需要idToken或userInfo之一

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: getMessage('USER.THIRD_PARTY_LOGIN_FAILED'),
          errorCode: 'VALIDATION_ERROR'
        });
      }

      const { accessToken, idToken, userInfo } = value;
      let payload;

      // 如果有idToken，优先验证idToken
      if (idToken) {
        const ticket = await this.googleClient.verifyIdToken({
          idToken: idToken,
          audience: process.env.GOOGLE_CLIENT_ID
        });
        payload = ticket.getPayload();
      } else if (userInfo && accessToken) {
        // 如果没有idToken但有userInfo和accessToken，验证accessToken
        try {
          // 使用自动代理检测函数
          const targetUrl = `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`;
          const proxyUrl = getSystemProxy(targetUrl);
          
          const axiosConfig = {
            timeout: 10000,
            headers: { 'User-Agent': 'VehicleSupplies-Backend/1.0' }
          };
          
          if (proxyUrl) {
            axiosConfig.httpsAgent = new HttpsProxyAgent(proxyUrl);
            console.log(`Using proxy: ${proxyUrl}`);
          }
      
      const response = await axios.get(targetUrl, axiosConfig);
          
          // axios响应检查
          if (response.status !== 200) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const tokenInfo = response.data;
          
          if (tokenInfo.error || tokenInfo.audience !== process.env.GOOGLE_CLIENT_ID) {
            throw new Error('Invalid access token');
          }
          
          // 使用userInfo作为payload
          payload = {
            sub: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            exp: Math.floor(Date.now() / 1000) + 3600 // 1小时后过期
          };
        } catch (tokenError) {
          console.error('Google login error:', tokenError);
          return res.status(401).json({
            success: false,
            message: getMessage('USER.GOOGLE_AUTH_FAILED'),
            errorCode: 'GOOGLE_AUTH_FAILED'
          });
        }
      }

      if (!payload) {
        return res.status(401).json({
          success: false,
          message: getMessage('USER.GOOGLE_AUTH_FAILED'),
          errorCode: 'GOOGLE_AUTH_FAILED'
        });
      }

      // 构建提供商数据
      const providerData = {
        providerId: payload.sub,
        email: payload.email,
        name: payload.name,
        avatar: payload.picture,
        accessToken: accessToken || null,
        refreshToken: null,
        expiresAt: new Date(payload.exp * 1000)
      };

      // 查找或创建用户
      const { user: dbUser, isNew } = await this.findOrCreateUser(providerData, 'google');

      // 生成JWT
      const token = this.generateJWT(dbUser);

      // 设置cookie
      res.cookie('aex-token', token, {
        httpOnly: process.env.NODE_ENV === 'production' ? true : false,
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000 // 1小时
      });

      res.json({
        success: true,
        message: getMessage('USER.THIRD_PARTY_LOGIN_SUCCESS'),
        data: {
          token,
          user: {
            id: dbUser.id,
            username: dbUser.username,
            email: dbUser.email,
            phone: dbUser.phone,
            user_role: dbUser.role,
            currency: dbUser.currency,
            avatar_url: dbUser.avatar_url,
            login_source: dbUser.login_source
          },
          isNewUser: isNew
        }
      });

    } catch (error) {
      console.error('Google login error:', error);
      res.status(500).json({
        success: false,
        message: getMessage('USER.GOOGLE_AUTH_FAILED'),
        errorCode: 'GOOGLE_AUTH_FAILED'
      });
    }
  }

  /**
   * Facebook登录回调处理
   * POST /api/auth/facebook/callback
   */
  async facebookCallback(req, res) {
    try {
      const schema = Joi.object({
        accessToken: Joi.string().required(),
        userID: Joi.string().required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: getMessage('USER.THIRD_PARTY_LOGIN_FAILED'),
          errorCode: 'VALIDATION_ERROR'
        });
      }

      const { accessToken, userID } = value;

      // 验证Facebook访问令牌并获取用户信息
      const axiosConfig = {
        params: {
          access_token: accessToken,
          fields: 'id,name,email,picture'
        },
        timeout: 10000, // 10秒超时
        headers: {
          'User-Agent': 'VehicleSupplies-Backend/1.0'
        }
      };
      
      // 自动检测并配置代理
      const targetUrl = 'https://graph.facebook.com/me';
      const proxyUrl = getSystemProxy(targetUrl);
      if (proxyUrl) {
        axiosConfig.httpsAgent = new HttpsProxyAgent(proxyUrl);
        console.log(`Using proxy for Facebook API: ${proxyUrl}`);
      }
      
      const response = await axios.get(`https://graph.facebook.com/me`, axiosConfig);

      const fbUser = response.data;
      if (!fbUser || fbUser.id !== userID) {
        return res.status(401).json({
          success: false,
          message: getMessage('USER.FACEBOOK_AUTH_FAILED'),
          errorCode: 'FACEBOOK_AUTH_FAILED'
        });
      }

      // 构建提供商数据
      const providerData = {
        providerId: fbUser.id,
        email: fbUser.email,
        name: fbUser.name,
        avatar: fbUser.picture && fbUser.picture.data ? fbUser.picture.data.url : null,
        accessToken: accessToken,
        refreshToken: null,
        expiresAt: null // Facebook token没有明确的过期时间
      };

      // 查找或创建用户
      const { user: dbUser, isNew } = await this.findOrCreateUser(providerData, 'facebook');

      // 生成JWT
      const token = this.generateJWT(dbUser);

      // 设置cookie
      res.cookie('aex-token', token, {
        httpOnly: process.env.NODE_ENV === 'production' ? true : false,
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000 // 1小时
      });

      res.json({
        success: true,
        message: getMessage('USER.THIRD_PARTY_LOGIN_SUCCESS'),
        data: {
          token,
          user: {
            id: dbUser.id,
            username: dbUser.username,
            email: dbUser.email,
            phone: dbUser.phone,
            user_role: dbUser.role,
            currency: dbUser.currency,
            avatar_url: dbUser.avatar_url,
            login_source: dbUser.login_source
          },
          isNewUser: isNew
        }
      });

    } catch (error) {
      console.error('Facebook login error:', error);
      res.status(500).json({
        success: false,
        message: getMessage('USER.FACEBOOK_AUTH_FAILED'),
        errorCode: 'FACEBOOK_AUTH_FAILED'
      });
    }
  }

  /**
   * 绑定第三方账号
   * POST /api/auth/bind-third-party
   */
  async bindThirdPartyAccount(req, res) {
    try {
      const schema = Joi.object({
        provider: Joi.string().valid('apple', 'google', 'facebook').required(),
        providerUserId: Joi.string().required(),
        accessToken: Joi.string().required(),
        refreshToken: Joi.string().optional(),
        email: Joi.string().email().optional(),
        name: Joi.string().optional(),
        avatar: Joi.string().uri().optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: getMessage('USER.THIRD_PARTY_LOGIN_FAILED'),
          errorCode: 'VALIDATION_ERROR'
        });
      }

      const { provider, providerUserId, accessToken, refreshToken, email, name, avatar } = value;
      const userId = req.user.id;

      const connection = await getConnection();
      try {
        await connection.beginTransaction();

        // 检查该第三方账号是否已被其他用户绑定
        const existingQuery = `
          SELECT user_id FROM users 
          WHERE ${provider}_id = $1 AND deleted = FALSE AND id != $2
        `;
        const existingResult = await connection.query(existingQuery, [providerUserId, userId]);
        
        if (existingResult.rows && existingResult.rows.length > 0) {
          await connection.rollback();
          return res.status(409).json({
            success: false,
            message: getMessage('USER.THIRD_PARTY_ACCOUNT_EXISTS'),
            errorCode: 'THIRD_PARTY_ACCOUNT_EXISTS'
          });
        }

        // 更新用户表
        const updateQuery = `
          UPDATE users 
          SET ${provider}_id = $1,
              avatar_url = COALESCE(avatar_url, $2),
              third_party_email = COALESCE(third_party_email, $3),
              login_source = CASE 
                WHEN login_source = 'local' THEN 'mixed'
                ELSE login_source
              END,
              updated_at = NOW()
          WHERE id = $4
        `;
        
        await connection.query(updateQuery, [providerUserId, avatar, email, userId]);

        // 创建第三方登录记录
        const providerData = {
          providerId: providerUserId,
          email,
          name,
          accessToken,
          refreshToken,
          expiresAt: null
        };
        
        await this.createThirdPartyLoginRecord(connection, userId, provider, providerData);
        await connection.commit();

        res.json({
          success: true,
          message: getMessage('USER.THIRD_PARTY_ACCOUNT_BIND_SUCCESS')
        });

      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

    } catch (error) {
      console.error('Bind third-party account error:', error);
      res.status(500).json({
        success: false,
        message: getMessage('USER.THIRD_PARTY_ACCOUNT_BIND_FAILED'),
        errorCode: 'THIRD_PARTY_ACCOUNT_BIND_FAILED'
      });
    }
  }

  /**
   * 解绑第三方账号
   * DELETE /api/auth/unbind-third-party
   */
  async unbindThirdPartyAccount(req, res) {
    try {
      const schema = Joi.object({
        provider: Joi.string().valid('apple', 'google', 'facebook').required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
          errorCode: 'VALIDATION_ERROR'
        });
      }

      const { provider } = value;
      const userId = req.user.id;

      const connection = await getConnection();
      try {
        await connection.beginTransaction();

        // 更新用户表，移除第三方ID
        const updateQuery = `
          UPDATE users 
          SET ${provider}_id = NULL,
              login_source = CASE 
                WHEN login_source = 'mixed' THEN 'local'
                WHEN login_source = $1 THEN 'local'
                ELSE login_source
              END,
              updated_at = NOW()
          WHERE id = $2
        `;
        
        await connection.query(updateQuery, [provider, userId]);

        // 软删除第三方登录记录
        const deleteQuery = `
          UPDATE third_party_logins 
          SET deleted = TRUE, updated_at = NOW()
          WHERE user_id = $1 AND provider = $2 AND deleted = FALSE
        `;
        
        await connection.query(deleteQuery, [userId, provider]);
        await connection.commit();

        res.json({
          success: true,
          message: getMessage('USER.THIRD_PARTY_ACCOUNT_UNBIND_SUCCESS')
        });

      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

    } catch (error) {
      console.error('Unbind third-party account error:', error);
      res.status(500).json({
        success: false,
        message: getMessage('USER.THIRD_PARTY_ACCOUNT_UNBIND_FAILED'),
        errorCode: 'THIRD_PARTY_ACCOUNT_UNBIND_FAILED'
      });
    }
  }

  /**
   * 获取用户第三方账号绑定状态
   * GET /api/auth/third-party-status
   */
  async getThirdPartyStatus(req, res) {
    try {
      const userId = req.user.id;

      const userQuery = `
        SELECT apple_id, google_id, facebook_id, login_source
        FROM users 
        WHERE id = $1 AND deleted = FALSE
      `;
      
      const userResult = await query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('USER.USER_NOT_FOUND'),
          errorCode: 'USER_NOT_FOUND'
        });
      }

      const user = userResult.rows[0];
      const thirdPartyStatus = {
        apple: {
          connected: !!user.apple_id,
          providerId: user.apple_id || null
        },
        google: {
          connected: !!user.google_id,
          providerId: user.google_id || null
        },
        facebook: {
          connected: !!user.facebook_id,
          providerId: user.facebook_id || null
        },
        loginSource: user.login_source
      };

      res.json({
        success: true,
        message: getMessage('SUCCESS'),
        data: thirdPartyStatus
      });

    } catch (error) {
      console.error('Get third-party status error:', error);
      res.status(500).json({
        success: false,
        message: getMessage('SERVER_ERROR'),
        errorCode: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
}

module.exports = ThirdPartyAuthController;