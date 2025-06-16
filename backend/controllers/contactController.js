const express = require('express');
const { pool } = require('../db/db');
const { getMessage } = require('../config/messages');
const { sendMail } = require('../utils/email');
const { uuidToBinary } = require('../utils/uuid');
const { v4: uuidv4 } = require('uuid');

/**
 * 联系消息控制器
 * 处理联系表单提交、消息管理等功能
 */
class ContactController {
  
  /**
   * 获取验证码
   * POST /api/contact/verification-code
   */
  async getVerificationCode(req, res) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'CONTACT.EMAIL_REQUIRED',
          data: null
        });
      }
      
      // 生成6位数字验证码
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expireTime = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期
      
      // 存储验证码到数据库或缓存（这里简化处理，实际应该用Redis）
      // TODO: 实现验证码存储逻辑
      
      // 获取用户语言偏好（如果用户已登录）
      let userLanguage = 'en'; // 默认英文
      if (req.userId) {
        const [userRows] = await pool.query('SELECT language FROM users WHERE id = ?', [req.userId]);
        if (userRows.length > 0 && userRows[0].language) {
          userLanguage = userRows[0].language;
        }
      }
      
      // 发送验证码邮件
      try {
        const isZh = userLanguage === 'zh';
        const subject = isZh ? '联系表单验证码' : 'Contact Form Verification Code';
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>${isZh ? '验证码' : 'Verification Code'}</h2>
            <p>${isZh ? '您的验证码是：' : 'Your verification code is:'}<strong style="font-size: 24px; color: #007bff;">${code}</strong></p>
            <p>${isZh ? '验证码有效期为10分钟，请及时使用。' : 'The verification code is valid for 10 minutes, please use it in time.'}</p>
          </div>
        `;
        
        await sendMail(email, subject, html);
        
        res.json({
          success: true,
          message: 'CONTACT.VERIFICATION_CODE_SENT',
          data: null
        });
      } catch (emailError) {
        console.error('验证码邮件发送失败:', emailError);
        res.status(500).json({
          success: false,
          message: 'CONTACT.GET_CODE_FAILED',
          data: null
        });
      }
    } catch (error) {
      console.error('获取验证码错误:', error);
      res.status(500).json({
        success: false,
        message: 'CONTACT.GET_CODE_FAILED',
        data: null
      });
    }
  }
  
  /**
   * 验证验证码
   */
  verifyCode(email, code) {
    // TODO: 实现验证码验证逻辑
    // 这里简化处理，实际应该从数据库或缓存中验证
    return true; // 临时返回true，实际需要实现验证逻辑
  }
  
  /**
   * 提交联系消息
   * POST /api/contact/messages
   * 支持登录和未登录用户
   */
  async submitMessage(req, res) {
    try {
      const { name, email, phone, subject, message, captcha, priority = 'normal' } = req.body;
      
      // 从JWT中获取用户ID（可选）
      const userId = req.userId || null;
      
      // 验证码验证
      if (!captcha) {
        return res.status(400).json({
          success: false,
          message: 'CONTACT.CAPTCHA_REQUIRED',
          data: null
        });
      }
      
      if (!req.session || !req.session.captcha) {
        return res.status(400).json({
          success: false,
          message: 'CONTACT.CAPTCHA_EXPIRED',
          data: null
        });
      }
      
      if (req.session.captcha.toLowerCase() !== captcha.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: 'CONTACT.CAPTCHA_INVALID',
          data: null
        });
      }
      
      // 验证码使用后立即清除
      delete req.session.captcha;
      
      // 基础验证
      if (!name || !email || !subject || !message ) {
        return res.status(400).json({
          success: false,
          message: 'CONTACT.VALIDATION_FAILED',
          data: null
        });
      }
      
      // 长度验证
      if (subject.length > 128) {
        return res.status(400).json({
          success: false,
          message: 'CONTACT.SUBJECT_TOO_LONG',
          data: null
        });
      }
      
      if (message.length < 10) {
        return res.status(400).json({
          success: false,
          message: 'CONTACT.MESSAGE_TOO_SHORT',
          data: null
        });
      }
      
      if (message.length > 2000) {
        return res.status(400).json({
          success: false,
          message: 'CONTACT.MESSAGE_TOO_LONG',
          data: null
        });
      }
      
      // 获取客户端信息
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      
      let user = null;
      let businessGroupId = null;
      
      // 如果用户已登录，获取用户信息和业务组信息
      if (userId) {
        const [userRows] = await pool.query(`
          SELECT u.id, u.username, u.email, u.language, u.business_group_id,
                 bg.id as group_id, bg.group_name, bg.group_email
          FROM users u
          LEFT JOIN business_groups bg ON u.business_group_id = bg.id AND bg.deleted = 0
          WHERE u.id = ? AND u.deleted = 0
        `, [userId]);
        
        if (userRows.length > 0) {
          user = userRows[0];
          businessGroupId = user.business_group_id;
        }
      }
      
      // 如果用户未绑定业务组或未登录，使用默认业务组
      if (!businessGroupId) {
        const [defaultGroupRows] = await pool.query(`
          SELECT id FROM business_groups 
          WHERE is_default = 1 AND deleted = 0 
          ORDER BY created_at ASC 
          LIMIT 1
        `);
        
        if (defaultGroupRows.length > 0) {
          businessGroupId = defaultGroupRows[0].id;
          
          // 如果用户已登录且未绑定业务组，更新用户的业务组
          if (userId && user) {
            await pool.query(
              'UPDATE users SET business_group_id = ? WHERE id = ?',
              [businessGroupId, userId]
            );
          }
        }
      }
      
      // 获取业务组信息用于邮件通知
      let businessGroup = null;
      if (businessGroupId) {
        const [groupRows] = await pool.query(`
          SELECT id, group_name, group_email
          FROM business_groups 
          WHERE id = ? AND deleted = 0
        `, [businessGroupId]);
        
        if (groupRows.length > 0) {
          businessGroup = groupRows[0];
        }
      }
      
      // 如果没有找到业务组，使用默认业务组
      if (!businessGroup) {
        const [defaultGroupRows] = await pool.query(
          'SELECT id, group_name, group_email FROM business_groups WHERE is_default = 1 AND deleted = 0 LIMIT 1'
        );
        if (defaultGroupRows.length > 0) {
          businessGroup = defaultGroupRows[0];
          businessGroupId = businessGroup.id;
        }
      }
      
      // 插入联系消息（包含name、email、phone字段）
      const messageGuid = uuidv4();
      const guid = uuidToBinary(messageGuid);
      const [insertResult] = await pool.query(`
        INSERT INTO contact_messages (
          guid, user_id, business_group_id, name, email, phone, subject, message, 
          priority, ip_address, user_agent, created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        guid, userId, businessGroupId, name, email, phone, subject, message,
        priority, ipAddress, userAgent, userId, userId
      ]);
      
      const messageId = insertResult.insertId;
      
      // 发送邮件通知
      try {
        if (businessGroup) {
          await this.sendNotificationEmails({
            id: messageId,
            user_id: userId, // 添加user_id字段
            user_name: user ? user.username : name,
            user_email: email,
            name,
            email,
            phone,
            subject,
            message,
            created_at: new Date()
          }, businessGroup);
        }
      } catch (emailError) {
        console.error('邮件发送失败:', emailError);
        // 邮件发送失败不影响消息提交成功
      }
      
      res.status(201).json({
        success: true,
        message: 'CONTACT.MESSAGE_SUBMITTED',
        data: {
          id: messageId,
          guid: messageGuid,
          status: 'pending',
          business_group: businessGroup ? {
            id: businessGroupId,
            name: businessGroup.group_name,
            email: businessGroup.group_email
          } : null
        }
      });
      
    } catch (error) {
      console.error('提交联系消息错误:', error);
      res.status(500).json({
        success: false,
        message: 'CONTACT.MESSAGE_SUBMIT_FAILED',
        data: null
      });
    }
  }
  
  /**
   * 获取联系消息列表
   * GET /api/admin/contact/messages (管理员)
   * GET /api/business/contact/messages (业务人员)
   */
  async getMessageList(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        status,
        priority,
        business_group_id,
        keyword
      } = req.query;
      
      const offset = (page - 1) * pageSize;
      const limit = parseInt(pageSize);
      
      let whereConditions = ['cm.deleted = 0'];
      let queryParams = [];
      
      // 根据用户角色过滤数据
      if (req.userRole === 'business') {
        // 业务人员只能查看分配给自己组的消息
        whereConditions.push(`
          cm.business_group_id IN (
            SELECT ubg.business_group_id 
            FROM user_business_groups ubg 
            WHERE ubg.user_id = ? AND ubg.deleted = 0
          )
        `);
        queryParams.push(req.userId);
      }
      
      // 状态筛选
      if (status) {
        whereConditions.push('cm.status = ?');
        queryParams.push(status);
      }
      
      // 优先级筛选
      if (priority) {
        whereConditions.push('cm.priority = ?');
        queryParams.push(priority);
      }
      
      // 业务组筛选（仅管理员可用）
      if (business_group_id && req.userRole === 'admin') {
        whereConditions.push('cm.business_group_id = ?');
        queryParams.push(business_group_id);
      }
      
      // 关键词搜索
      if (keyword) {
        whereConditions.push('(cm.name LIKE ? OR cm.email LIKE ? OR cm.subject LIKE ? OR cm.message LIKE ?)');
        const searchTerm = `%${keyword}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // 查询总数
      const [countRows] = await pool.query(`
        SELECT COUNT(*) as total
        FROM contact_messages cm
        WHERE ${whereClause}
      `, queryParams);
      
      const total = countRows[0].total;
      const totalPages = Math.ceil(total / limit);
      
      // 查询消息列表
      const [messageRows] = await pool.query(`
        SELECT 
          cm.id,
          HEX(cm.guid) as guid,
          cm.name,
          cm.email,
          cm.phone,
          cm.subject,
          cm.message,
          cm.status,
          cm.priority,
          cm.ip_address,
          cm.replied_at,
          cm.created_at,
          cm.updated_at,
          bg.id as business_group_id,
          bg.group_name as business_group_name,
          bg.group_email as business_group_email,
          replied_user.username as replied_by_name,
          assigned_user.username as assigned_to_name
        FROM contact_messages cm
        LEFT JOIN business_groups bg ON cm.business_group_id = bg.id
        LEFT JOIN users replied_user ON cm.replied_by = replied_user.id
        LEFT JOIN users assigned_user ON cm.assigned_to = assigned_user.id
        WHERE ${whereClause}
        ORDER BY cm.created_at DESC
        LIMIT ? OFFSET ?
      `, [...queryParams, limit, offset]);
      
      // 格式化数据
      const items = messageRows.map(row => ({
        id: row.id,
        guid: row.guid,
        name: row.name,
        email: row.email,
        phone: row.phone,
        subject: row.subject,
        message: row.message,
        status: row.status,
        priority: row.priority,
        ip_address: row.ip_address,
        replied_at: row.replied_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        business_group: {
          id: row.business_group_id,
          name: row.business_group_name,
          email: row.business_group_email
        },
        replied_by: row.replied_by_name,
        assigned_to: row.assigned_to_name
      }));
      
      res.json({
        success: true,
        message: 'CONTACT.MESSAGE_LIST_SUCCESS',
        data: {
          items,
          pagination: {
            page: parseInt(page),
            pageSize: limit,
            total,
            totalPages
          }
        }
      });
      
    } catch (error) {
      console.error('获取联系消息列表错误:', error);
      res.status(500).json({
        success: false,
        message: 'CONTACT.MESSAGE_LIST_FAILED',
        data: null
      });
    }
  }
  
  /**
   * 获取联系消息详情
   * GET /api/admin/contact/messages/:id
   * GET /api/business/contact/messages/:id
   */
  async getMessageDetail(req, res) {
    try {
      const { id } = req.params;
      
      let whereConditions = ['cm.id = ?', 'cm.deleted = 0'];
      let queryParams = [id];
      
      // 根据用户角色过滤数据
      if (req.userRole === 'business') {
        whereConditions.push(`
          cm.business_group_id IN (
            SELECT ubg.business_group_id 
            FROM user_business_groups ubg 
            WHERE ubg.user_id = ? AND ubg.deleted = 0
          )
        `);
        queryParams.push(req.userId);
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      const [messageRows] = await pool.query(`
        SELECT 
          cm.*,
          HEX(cm.guid) as guid,
          bg.group_name as business_group_name,
          bg.group_email as business_group_email,
          replied_user.username as replied_by_name,
          assigned_user.username as assigned_to_name,
          user_info.username as user_name
        FROM contact_messages cm
        LEFT JOIN business_groups bg ON cm.business_group_id = bg.id
        LEFT JOIN users replied_user ON cm.replied_by = replied_user.id
        LEFT JOIN users assigned_user ON cm.assigned_to = assigned_user.id
        LEFT JOIN users user_info ON cm.user_id = user_info.id
        WHERE ${whereClause}
      `, queryParams);
      
      if (messageRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'CONTACT.MESSAGE_NOT_FOUND',
          data: null
        });
      }
      
      const message = messageRows[0];
      
      res.json({
        success: true,
        message: 'CONTACT.MESSAGE_DETAIL_SUCCESS',
        data: {
          id: message.id,
          guid: message.guid,
          user_id: message.user_id,
          user_name: message.user_name,
          name: message.name,
          email: message.email,
          phone: message.phone,
          subject: message.subject,
          message: message.message,
          status: message.status,
          priority: message.priority,
          ip_address: message.ip_address,
          user_agent: message.user_agent,
          replied_at: message.replied_at,
          replied_by: message.replied_by_name,
          assigned_to: message.assigned_to_name,
          created_at: message.created_at,
          updated_at: message.updated_at,
          business_group: {
            id: message.business_group_id,
            name: message.business_group_name,
            email: message.business_group_email
          }
        }
      });
      
    } catch (error) {
      console.error('获取联系消息详情错误:', error);
      res.status(500).json({
        success: false,
        message: 'CONTACT.MESSAGE_DETAIL_FAILED',
        data: null
      });
    }
  }
  
  /**
   * 更新消息状态
   * PATCH /api/admin/contact/messages/:id/status
   * PATCH /api/business/contact/messages/:id/status
   */
  async updateMessageStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['pending', 'processing', 'replied', 'closed'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'CONTACT.INVALID_STATUS',
          data: null
        });
      }
      
      let whereConditions = ['id = ?', 'deleted = 0'];
      let queryParams = [id];
      
      // 根据用户角色过滤数据
      if (req.userRole === 'business') {
        whereConditions.push(`
          business_group_id IN (
            SELECT ubg.business_group_id 
            FROM user_business_groups ubg 
            WHERE ubg.user_id = ? AND ubg.deleted = 0
          )
        `);
        queryParams.push(req.userId);
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // 更新状态
      const updateData = { status, updated_by: req.userId };
      if (status === 'replied') {
        updateData.replied_at = new Date();
        updateData.replied_by = req.userId;
      }
      
      const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const updateParams = Object.values(updateData);
      
      const [updateResult] = await pool.query(`
        UPDATE contact_messages 
        SET ${setClause}
        WHERE ${whereClause}
      `, [...updateParams, ...queryParams]);
      
      if (updateResult.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'CONTACT.MESSAGE_NOT_FOUND',
          data: null
        });
      }
      
      res.json({
        success: true,
        message: 'CONTACT.MESSAGE_UPDATE_SUCCESS',
        data: { id: parseInt(id), status }
      });
      
    } catch (error) {
      console.error('更新消息状态错误:', error);
      res.status(500).json({
        success: false,
        message: 'CONTACT.MESSAGE_UPDATE_FAILED',
        data: null
      });
    }
  }
  
  /**
   * 分配消息给业务人员
   * PATCH /api/admin/contact/messages/:id/assign
   */
  async assignMessage(req, res) {
    try {
      const { id } = req.params;
      const { assigned_to } = req.body;
      
      // 验证被分配的用户是否为业务人员
      if (assigned_to) {
        const [userRows] = await pool.query(
          'SELECT user_role FROM users WHERE id = ? AND deleted = 0',
          [assigned_to]
        );
        
        if (userRows.length === 0 || !['business', 'admin'].includes(userRows[0].user_role)) {
          return res.status(400).json({
            success: false,
            message: 'CONTACT.INVALID_ASSIGNEE',
            data: null
          });
        }
      }
      
      const [updateResult] = await pool.query(
        'UPDATE contact_messages SET assigned_to = ?, updated_by = ? WHERE id = ? AND deleted = 0',
        [assigned_to, req.userId, id]
      );
      
      if (updateResult.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'CONTACT.MESSAGE_NOT_FOUND',
          data: null
        });
      }
      
      res.json({
        success: true,
        message: 'CONTACT.MESSAGE_ASSIGNED_SUCCESS',
        data: { id: parseInt(id), assigned_to }
      });
      
    } catch (error) {
      console.error('分配消息错误:', error);
      res.status(500).json({
        success: false,
        message: 'CONTACT.MESSAGE_ASSIGN_FAILED',
        data: null
      });
    }
  }
  
  /**
   * 删除消息（软删除）
   * DELETE /api/admin/contact/messages/:id
   */
  async deleteMessage(req, res) {
    try {
      const { id } = req.params;
      
      const [updateResult] = await pool.query(
        'UPDATE contact_messages SET deleted = 1, updated_by = ? WHERE id = ? AND deleted = 0',
        [req.userId, id]
      );
      
      if (updateResult.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'CONTACT.MESSAGE_NOT_FOUND',
          data: null
        });
      }
      
      res.json({
        success: true,
        message: 'CONTACT.MESSAGE_DELETE_SUCCESS',
        data: null
      });
      
    } catch (error) {
      console.error('删除消息错误:', error);
      res.status(500).json({
        success: false,
        message: 'CONTACT.MESSAGE_DELETE_FAILED',
        data: null
      });
    }
  }
  
  /**
   * 发送邮件通知
   * @param {Object} contactData 联系消息数据
   * @param {Object} businessGroup 业务组信息
   * @param {string} userLanguage 用户语言偏好
   */
  async sendNotificationEmails(contactData, businessGroup, userLanguage = 'en') {
    try {
      // 获取邮件翻译（一次性加载，避免重复查询）
      const adminLanguage = 'zh-CN';
      const userEmailLanguage = userLanguage === 'zh' ? 'zh-CN' : 'en-US';
      
      const [adminTranslations, userTranslations] = await Promise.all([
        this.getEmailTranslations(adminLanguage),
        userEmailLanguage !== adminLanguage ? this.getEmailTranslations(userEmailLanguage) : null
      ]);
      
      const finalUserTranslations = userTranslations || adminTranslations;
      
      // 发送给业务组的通知邮件（管理员邮件保持中文）
      const adminSubject = adminTranslations['EMAIL_TEMPLATE.ADMIN_NOTIFICATION_TITLE'] || '新的联系消息';
      const adminHtml = await this.generateAdminNotificationTemplate(contactData, businessGroup, adminLanguage, adminTranslations);
      
      await sendMail(
        businessGroup.group_email,
        adminSubject,
        adminHtml
      );
      
      // 发送给用户的确认邮件（根据用户语言偏好）
      const userSubject = finalUserTranslations['EMAIL_TEMPLATE.USER_CONFIRMATION_TITLE'] || (userLanguage === 'zh' ? '感谢您联系我们' : 'Thank you for contacting us');
      const userHtml = await this.generateUserConfirmationTemplate(contactData, userEmailLanguage, finalUserTranslations);
      
      await sendMail(
        contactData.user_email,
        userSubject,
        userHtml
      );
      
    } catch (error) {
      console.error('发送邮件通知失败:', error);
      throw error;
    }
  }
  
  /**
   * 生成管理员通知邮件模板
   */
  async generateAdminNotificationTemplate(contactData, businessGroup, language = 'zh-CN', translations = null) {
    const emailTranslations = translations || await this.getEmailTranslations(language);
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${emailTranslations['EMAIL_TEMPLATE.ADMIN_NOTIFICATION_TITLE']}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #e53e3e;">${emailTranslations['EMAIL_TEMPLATE.ADMIN_NOTIFICATION_HEADER']}</h2>
                <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>${emailTranslations['EMAIL_TEMPLATE.SENDER']}:</strong> ${contactData.name}</p>
                    <p><strong>${emailTranslations['EMAIL_TEMPLATE.EMAIL']}:</strong> ${contactData.email}</p>
                    <p><strong>${emailTranslations['EMAIL_TEMPLATE.PHONE']}:</strong> ${contactData.phone}</p>
                    <p><strong>${emailTranslations['EMAIL_TEMPLATE.SUBJECT']}:</strong> ${contactData.subject}</p>
                    <p><strong>${emailTranslations['EMAIL_TEMPLATE.BUSINESS_GROUP']}:</strong> ${businessGroup.group_name}</p>
                    <p><strong>${emailTranslations['EMAIL_TEMPLATE.MESSAGE_CONTENT']}:</strong></p>
                    <div style="background: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
                        ${contactData.message}
                    </div>
                    <p><strong>${emailTranslations['EMAIL_TEMPLATE.SUBMIT_TIME']}:</strong> ${new Date(contactData.created_at).toLocaleString()}</p>
                </div>
            </div>
        </body>
        </html>
      `;
  }
  
  /**
   * 生成用户确认邮件模板
   */
  async generateUserConfirmationTemplate(contactData, language = 'zh-CN', translations = null) {
    const emailTranslations = translations || await this.getEmailTranslations(language);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <title>${emailTranslations['EMAIL_TEMPLATE.USER_CONFIRMATION_TITLE']}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #e53e3e;">${emailTranslations['EMAIL_TEMPLATE.USER_CONFIRMATION_HEADER']}</h2>
              <p>${emailTranslations['EMAIL_TEMPLATE.USER_GREETING']} ${contactData.name}，</p>
              <p>${emailTranslations['EMAIL_TEMPLATE.USER_CONFIRMATION_MESSAGE']}</p>
              <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>${emailTranslations['EMAIL_TEMPLATE.YOUR_MESSAGE']}:</strong></p>
                  <p><strong>${emailTranslations['EMAIL_TEMPLATE.SUBJECT']}:</strong> ${contactData.subject}</p>
                  <div style="background: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
                      ${contactData.message}
                  </div>
              </div>
              <p>${emailTranslations['EMAIL_TEMPLATE.URGENT_CONTACT']}</p>
              <p>${emailTranslations['EMAIL_TEMPLATE.THANK_YOU']}</p>
          </div>
      </body>
      </html>
    `;
  }
  
  /**
   * 获取验证码
   * POST /api/contact/verification-code
   */
  async getVerificationCode(req, res) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'CONTACT.EMAIL_REQUIRED',
          data: null
        });
      }
      
      // 生成6位数字验证码
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 存储验证码（这里简化处理，实际应该存储到Redis或数据库）
      // TODO: 实现验证码存储逻辑
      this.storeVerificationCode(email, code);
      
      // 获取用户语言偏好（如果用户已登录）
      let userLanguage = 'en'; // 默认英文
      if (req.userId) {
        try {
          const [userRows] = await pool.execute(
            'SELECT language FROM users WHERE id = ?',
            [req.userId]
          );
          if (userRows.length > 0 && userRows[0].language) {
            userLanguage = userRows[0].language;
          }
        } catch (error) {
          console.error('获取用户语言失败:', error);
        }
      }
      
      // 获取邮件翻译
      const translations = await this.getEmailTranslations(userLanguage);
      
      // 发送验证码邮件
      const subject = translations['EMAIL_TEMPLATE.VERIFICATION_CODE_SUBJECT'] || (userLanguage === 'zh-CN' ? '联系表单验证码' : 'Contact Form Verification Code');
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>${translations['EMAIL_TEMPLATE.VERIFICATION_CODE_TITLE'] || (userLanguage === 'zh-CN' ? '验证码' : 'Verification Code')}</h2>
          <p>${translations['EMAIL_TEMPLATE.VERIFICATION_CODE_CONTENT'] || (userLanguage === 'zh-CN' ? '您的验证码是：' : 'Your verification code is:')} <strong style="font-size: 24px; color: #e53e3e;">${code}</strong></p>
          <p>${translations['EMAIL_TEMPLATE.VERIFICATION_CODE_EXPIRE'] || (userLanguage === 'zh-CN' ? '验证码有效期为5分钟，请及时使用。' : 'The verification code is valid for 5 minutes, please use it promptly.')}</p>
        </div>
      `;
      
      await sendMail({
        to: email,
        subject: subject,
        html: html
      });
      
      res.json({
        success: true,
        message: 'CONTACT.VERIFICATION_CODE_SENT',
        data: null
      });
      
    } catch (error) {
      console.error('获取验证码错误:', error);
      res.status(500).json({
        success: false,
        message: 'CONTACT.VERIFICATION_CODE_FAILED',
        data: null
      });
    }
  }
  
  /**
   * 存储验证码（临时实现）
   */
  storeVerificationCode(email, code) {
    if (!this.verificationCodes) {
      this.verificationCodes = new Map();
    }
    
    this.verificationCodes.set(email, {
      code,
      timestamp: Date.now()
    });
    
    // 5分钟后自动清除
    setTimeout(() => {
      this.verificationCodes.delete(email);
    }, 5 * 60 * 1000);
  }
  
  /**
   * 验证验证码
   */
  verifyCode(email, code) {
    if (!this.verificationCodes) {
      return false;
    }
    
    const stored = this.verificationCodes.get(email);
    if (!stored) {
      return false;
    }
    
    // 检查是否过期（5分钟）
    if (Date.now() - stored.timestamp > 5 * 60 * 1000) {
      this.verificationCodes.delete(email);
      return false;
    }
    
    // 验证码匹配
    if (stored.code === code) {
      this.verificationCodes.delete(email);
      return true;
    }
    
    return false;
  }
  
  /**
   * 获取邮件模板翻译
   */
  async getEmailTranslations(language = 'zh-CN') {
    try {
      const [rows] = await pool.query(
        'SELECT code, value FROM language_translations WHERE lang = ? AND code LIKE "EMAIL_TEMPLATE.%"',
        [language]
      );
      
      const translations = {};
      rows.forEach(row => {
        translations[row.code] = row.value;
      });
      
      return translations;
    } catch (error) {
      console.error('获取邮件翻译失败:', error);
      // 返回默认中文翻译
      return {
        'EMAIL_TEMPLATE.ADMIN_NOTIFICATION_TITLE': '新的联系消息',
        'EMAIL_TEMPLATE.ADMIN_NOTIFICATION_HEADER': '您收到了一条新的联系消息',
        'EMAIL_TEMPLATE.SENDER': '发送人',
        'EMAIL_TEMPLATE.EMAIL': '邮箱',
        'EMAIL_TEMPLATE.PHONE': '电话',
        'EMAIL_TEMPLATE.SUBJECT': '主题',
        'EMAIL_TEMPLATE.BUSINESS_GROUP': '业务组',
        'EMAIL_TEMPLATE.MESSAGE_CONTENT': '消息内容',
        'EMAIL_TEMPLATE.SUBMIT_TIME': '提交时间',
        'EMAIL_TEMPLATE.USER_CONFIRMATION_TITLE': '感谢您联系我们',
        'EMAIL_TEMPLATE.USER_CONFIRMATION_HEADER': '感谢您联系我们',
        'EMAIL_TEMPLATE.USER_GREETING': '尊敬的',
        'EMAIL_TEMPLATE.USER_CONFIRMATION_MESSAGE': '我们已收到您的留言，我们的团队将在24小时内回复您。',
        'EMAIL_TEMPLATE.YOUR_MESSAGE': '您的留言',
        'EMAIL_TEMPLATE.URGENT_CONTACT': '如有紧急事务，请直接致电我们。',
        'EMAIL_TEMPLATE.THANK_YOU': '谢谢！'
      };
    }
  }
}

module.exports = new ContactController();