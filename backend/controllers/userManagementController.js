const express = require('express');
const { pool } = require('../db/db');
const { getMessage } = require('../config/messages');
const { uuidToBinary } = require('../utils/uuid');
const { v4: uuidv4 } = require('uuid');
/**
 * 用户管理控制器
 * 处理用户角色更新、业务人员管理等功能
 */
class UserManagementController {
  
  /**
   * 创建新用户（管理员和业务人员）
   * POST /api/admin/users
   */
  async createUser(req, res) {
    try {
      const { username, email, phone, password, user_role, language } = req.body;
      
      // 验证必填字段
      if (!username || !email || !password || !user_role) {
        return res.status(400).json({
          success: false,
          message: 'USER_MANAGEMENT.REQUIRED_FIELDS_MISSING',
          data: null
        });
      }
      
      // 验证角色值
      if (!['admin', 'business', 'user'].includes(user_role)) {
        return res.status(400).json({
          success: false,
          message: 'USER_MANAGEMENT.INVALID_ROLE',
          data: null
        });
      }
      
      // 检查用户名是否已存在
      const [existingUsername] = await pool.query(
        'SELECT id FROM users WHERE username = ? AND deleted = 0',
        [username]
      );
      
      if (existingUsername.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'USER_MANAGEMENT.USERNAME_EXISTS',
          data: null
        });
      }
      
      // 检查邮箱是否已存在
      const [existingEmail] = await pool.query(
        'SELECT id FROM users WHERE email = ? AND deleted = 0',
        [email]
      );
      
      if (existingEmail.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'USER_MANAGEMENT.EMAIL_EXISTS',
          data: null
        });
      }
      
      // 密码加密
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // 创建用户
      const guid = uuidToBinary(uuidv4());
      const currentUserId = req.userId; // 从JWT中获取当前用户ID
      const [insertResult] = await pool.query(
        `INSERT INTO users (guid, username, email, phone, password, user_role, language, is_active, created_by, updated_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [guid, username, email, phone || null, hashedPassword, user_role, language || 'en', currentUserId, currentUserId]
      );
      
      const userId = insertResult.insertId;
      
      res.status(201).json({
        success: true,
        message: 'USER_MANAGEMENT.USER_CREATE_SUCCESS',
        data: {
          id: userId,
          username,
          email,
          phone,
          user_role,
          language
        }
      });
      
    } catch (error) {
      console.error('创建用户错误:', error);
      res.status(500).json({
        success: false,
        message: 'USER_MANAGEMENT.USER_CREATE_FAILED',
        data: null
      });
    }
  }

  /**
   * 更新用户角色
   * PATCH /api/admin/users/:id/role
   */
  async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { user_role } = req.body;
      
      // 验证角色值
      if (!['admin', 'business', 'user'].includes(user_role)) {
        return res.status(400).json({
          success: false,
          message: 'USER_MANAGEMENT.INVALID_ROLE',
          data: null
        });
      }
      
      // 检查用户是否存在
      const [userRows] = await pool.query(
        'SELECT id, user_role, email FROM users WHERE id = ? AND deleted = 0',
        [id]
      );
      
      if (userRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'USER_MANAGEMENT.USER_NOT_FOUND',
          data: null
        });
      }
      
      const currentUser = userRows[0];
      
      // 防止用户修改自己的角色
      if (parseInt(id) === req.userId) {
        return res.status(400).json({
          success: false,
          message: 'USER_MANAGEMENT.CANNOT_MODIFY_SELF',
          data: null
        });
      }
      
      // 如果角色没有变化，直接返回成功
      if (currentUser.user_role === user_role) {
        return res.json({
          success: true,
          message: 'USER_MANAGEMENT.ROLE_UPDATE_SUCCESS',
          data: {
            id: parseInt(id),
            user_role: user_role,
            email: currentUser.email
          }
        });
      }
      
      // 更新用户角色
      const [updateResult] = await pool.query(
        'UPDATE users SET user_role = ? WHERE id = ? AND deleted = 0',
        [user_role, id]
      );
      
      if (updateResult.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'USER_MANAGEMENT.USER_NOT_FOUND',
          data: null
        });
      }
      
      // 如果用户角色变为普通用户，移除其业务组关联
      if (user_role === 'user') {
        await pool.query(
          'UPDATE user_business_groups SET deleted = 1, updated_by = ? WHERE user_id = ? AND deleted = 0',
          [req.userId, id]
        );
      }
      
      res.json({
        success: true,
        message: 'USER_MANAGEMENT.ROLE_UPDATE_SUCCESS',
        data: {
          id: parseInt(id),
          user_role: user_role,
          email: currentUser.email,
          previous_role: currentUser.user_role
        }
      });
      
    } catch (error) {
      console.error('更新用户角色错误:', error);
      res.status(500).json({
        success: false,
        message: 'USER_MANAGEMENT.ROLE_UPDATE_FAILED',
        data: null
      });
    }
  }
  
  /**
   * 获取业务人员列表
   * GET /api/admin/users/business-staff
   */
  async getBusinessStaffList(req, res) {
    try {
      const { page = 1, pageSize = 20, keyword, business_group_id } = req.query;
      
      const offset = (page - 1) * pageSize;
      const limit = parseInt(pageSize);
      
      let whereConditions = ["u.deleted = 0", "u.user_role = 'admin'"];
      let queryParams = [];
      
      // 关键词搜索
      if (keyword) {
        whereConditions.push('(u.username LIKE ? OR u.email LIKE ?)');
        const searchTerm = `%${keyword}%`;
        queryParams.push(searchTerm, searchTerm);
      }
      
      // 业务组筛选
      if (business_group_id) {
        whereConditions.push(`
          u.id IN (
            SELECT ubg.user_id 
            FROM user_business_groups ubg 
            WHERE ubg.business_group_id = ? AND ubg.deleted = 0
          )
        `);
        queryParams.push(business_group_id);
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // 查询总数
      const [countRows] = await pool.query(`
        SELECT COUNT(*) as total
        FROM users u
        WHERE ${whereClause}
      `, queryParams);
      
      const total = countRows[0].total;
      const totalPages = Math.ceil(total / limit);
      
      // 查询业务人员列表
      const [userRows] = await pool.query(`
        SELECT 
          u.id,
          u.username,
          u.email,
          u.user_role as role,
          u.created_at,
          u.updated_at,
          GROUP_CONCAT(
            CONCAT(bg.id, ':', bg.group_name) 
            ORDER BY bg.group_name 
            SEPARATOR '|'
          ) as business_groups
        FROM users u
        LEFT JOIN user_business_groups ubg ON u.id = ubg.user_id AND ubg.deleted = 0
        LEFT JOIN business_groups bg ON ubg.business_group_id = bg.id AND bg.deleted = 0
        WHERE ${whereClause}
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?
      `, [...queryParams, limit, offset]);
      
      // 格式化数据
      const items = userRows.map(row => {
        let businessGroups = [];
        if (row.business_groups) {
          businessGroups = row.business_groups.split('|').map(group => {
            const [id, name] = group.split(':');
            return { id: parseInt(id), name };
          });
        }
        
        return {
          id: row.id,
          username: row.username,
          email: row.email,
          role: row.role,
          business_groups: businessGroups,
          created_at: row.created_at,
          updated_at: row.updated_at
        };
      });
      
      res.json({
        success: true,
        message: 'USER_MANAGEMENT.BUSINESS_STAFF_LIST_SUCCESS',
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
      console.error('获取业务人员列表错误:', error);
      res.status(500).json({
        success: false,
        message: 'USER_MANAGEMENT.BUSINESS_STAFF_LIST_FAILED',
        data: null
      });
    }
  }
  
  /**
   * 获取用户详情
   * GET /api/admin/users/:id
   */
  async getUserDetail(req, res) {
    try {
      const { id } = req.params;
      
      const [userRows] = await pool.query(`
        SELECT 
          u.id,
          u.username,
          u.email,
          u.phone,
          u.user_role,
          u.language,
          u.business_group_id,
          u.created_at,
          u.updated_at
        FROM users u
        WHERE u.id = ? AND u.deleted = 0
      `, [id]);
      
      if (userRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('USER_MANAGEMENT.USER_NOT_FOUND'),
          data: null
        });
      }
      
      const user = userRows[0];
      let businessGroups = [];
      
      // 根据用户角色获取业务组信息
      if (user.user_role === 'user' && user.business_group_id) {
        // 普通用户：查询单个业务组
        const [groupRows] = await pool.query(`
          SELECT 
            bg.id,
            bg.group_name,
            bg.group_email,
            bg.description
          FROM business_groups bg
          WHERE bg.id = ? AND bg.deleted = 0
        `, [user.business_group_id]);
        
        if (groupRows.length > 0) {
          businessGroups = [{
            id: groupRows[0].id,
            name: groupRows[0].group_name,
            email: groupRows[0].group_email,
            description: groupRows[0].description
          }];
        }
      } else if (['admin', 'business'].includes(user.user_role)) {
        // 管理员和业务人员：查询关联的多个业务组
        const [groupRows] = await pool.query(`
          SELECT 
            bg.id,
            bg.group_name,
            bg.group_email,
            bg.description,
            ubg.created_at as joined_at
          FROM user_business_groups ubg
          INNER JOIN business_groups bg ON ubg.business_group_id = bg.id
          WHERE ubg.user_id = ? AND ubg.deleted = 0 AND bg.deleted = 0
          ORDER BY ubg.created_at ASC
        `, [id]);
        
        businessGroups = groupRows.map(group => ({
          id: group.id,
          name: group.group_name,
          email: group.group_email,
          description: group.description,
          joined_at: group.joined_at
        }));
      }
      
      // 获取用户处理的联系消息统计
      const [messageStats] = await pool.query(`
        SELECT 
          COUNT(*) as total_messages,
          SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as replied_messages,
          SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_messages
        FROM contact_messages
        WHERE assigned_to = ? AND deleted = 0
      `, [id]);
      
      res.json({
        success: true,
        message: getMessage('USER_MANAGEMENT.USER_DETAIL_SUCCESS'),
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          user_role: user.user_role,
          language: user.language,
          created_at: user.created_at,
          updated_at: user.updated_at,
          business_groups: businessGroups,
          message_stats: {
            total_messages: messageStats[0].total_messages,
            replied_messages: messageStats[0].replied_messages,
            processing_messages: messageStats[0].processing_messages
          }
        }
      });
      
    } catch (error) {
      console.error('获取用户详情错误:', error);
      res.status(500).json({
        success: false,
        message: getMessage('USER_MANAGEMENT.USER_DETAIL_FAILED'),
        data: null
      });
    }
  }
  
  /**
   * 获取所有用户列表（管理员专用）
   * GET /api/admin/users
   */
  async getAllUsers(req, res) {
    try {
      const { page = 1, pageSize = 20, keyword, role } = req.query;
      
      const offset = (page - 1) * pageSize;
      const limit = parseInt(pageSize);
      
      let whereConditions = ['u.deleted = 0'];
      let queryParams = [];
      
      // 关键词搜索
      if (keyword) {
        whereConditions.push('(u.username LIKE ? OR u.email LIKE ?)');
        const searchTerm = `%${keyword}%`;
        queryParams.push(searchTerm, searchTerm);
      }
      
      // 角色筛选
      if (role && ['user', 'business', 'admin'].includes(role)) {
        whereConditions.push('u.user_role = ?');
        queryParams.push(role);
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // 查询总数
      const [countRows] = await pool.query(`
        SELECT COUNT(*) as total
        FROM users u
        WHERE ${whereClause}
      `, queryParams);
      
      const total = countRows[0].total;
      const totalPages = Math.ceil(total / limit);
      
      // 查询用户列表
      const [userRows] = await pool.query(`
        SELECT 
          u.id,
          u.username,
          u.email,
          u.phone,
          u.user_role,
          u.language,
          u.business_group_id,
          bg.group_name as business_group_name,
          u.created_at,
          u.updated_at,
          COUNT(ubg.business_group_id) as business_group_count,
          GROUP_CONCAT(
            CASE WHEN ubg.business_group_id IS NOT NULL 
            THEN CONCAT(ubg_bg.id, ':', ubg_bg.group_name) 
            ELSE NULL END 
            SEPARATOR '|'
          ) as business_groups
        FROM users u
        LEFT JOIN business_groups bg ON u.business_group_id = bg.id AND bg.deleted = 0
        LEFT JOIN user_business_groups ubg ON u.id = ubg.user_id AND ubg.deleted = 0
        LEFT JOIN business_groups ubg_bg ON ubg.business_group_id = ubg_bg.id AND ubg_bg.deleted = 0
        WHERE ${whereClause}
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?
      `, [...queryParams, limit, offset]);
      
      // 格式化数据
      const items = userRows.map(row => {
        const item = {
          id: row.id,
          username: row.username,
          email: row.email,
          phone: row.phone,
          user_role: row.user_role,
          language: row.language,
          created_at: row.created_at,
          updated_at: row.updated_at
        };
        
        // 普通用户的业务组信息（单一业务组）
        if (row.user_role === 'user') {
          item.business_group_id = row.business_group_id;
          item.business_group_name = row.business_group_name;
        }
        
        // 业务员的业务组信息（多业务组）
        if (row.user_role === 'business') {
          item.business_group_count = row.business_group_count;
          if (row.business_groups) {
            item.business_groups = row.business_groups.split('|').map(group => {
              const [id, name] = group.split(':');
              return { id: parseInt(id), name };
            });
          } else {
            item.business_groups = [];
          }
        }
        
        return item;
      });
      
      res.json({
        success: true,
        message: 'USER_MANAGEMENT.USER_LIST_SUCCESS',
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
      console.error('获取用户列表错误:', error);
      res.status(500).json({
        success: false,
        message: 'USER_MANAGEMENT.USER_LIST_FAILED',
        data: null
      });
    }
  }
  
  /**
   * 更新用户信息
   * PUT /api/admin/users/:id
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { username, email, phone, language } = req.body;
      
      // 检查用户是否存在
      const [userRows] = await pool.query(
        'SELECT id, username, email FROM users WHERE id = ? AND deleted = 0',
        [id]
      );
      
      if (userRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'USER_MANAGEMENT.USER_NOT_FOUND',
          data: null
        });
      }
      
      // 检查用户名是否已被其他用户使用
      if (username) {
        const [existingUsers] = await pool.query(
          'SELECT id FROM users WHERE username = ? AND id != ? AND deleted = 0',
          [username, id]
        );
        
        if (existingUsers.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'USER_MANAGEMENT.USERNAME_EXISTS',
            data: null
          });
        }
      }
      
      // 检查邮箱是否已被其他用户使用
      if (email) {
        const [existingEmails] = await pool.query(
          'SELECT id FROM users WHERE email = ? AND id != ? AND deleted = 0',
          [email, id]
        );
        
        if (existingEmails.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'USER_MANAGEMENT.EMAIL_EXISTS',
            data: null
          });
        }
      }
      
      // 构建更新字段
      const updateFields = [];
      const updateValues = [];
      
      if (username !== undefined) {
        updateFields.push('username = ?');
        updateValues.push(username);
      }
      
      if (email !== undefined) {
        updateFields.push('email = ?');
        updateValues.push(email);
      }
      
      if (phone !== undefined) {
        updateFields.push('phone = ?');
        updateValues.push(phone || null);
      }
      
      if (language !== undefined) {
        updateFields.push('language = ?');
        updateValues.push(language || null);
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'USER_MANAGEMENT.NO_FIELDS_TO_UPDATE',
          data: null
        });
      }
      
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateFields.push('updated_by = ?');
      updateValues.push(req.userId); // 添加更新人ID
      updateValues.push(id);
      
      // 执行更新
      const [updateResult] = await pool.query(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ? AND deleted = 0`,
        updateValues
      );
      
      if (updateResult.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'USER_MANAGEMENT.USER_NOT_FOUND',
          data: null
        });
      }
      
      res.json({
        success: true,
        message: 'USER_MANAGEMENT.USER_UPDATE_SUCCESS',
        data: {
          id: parseInt(id),
          username,
          email,
          phone,
          language
        }
      });
      
    } catch (error) {
      console.error('更新用户信息错误:', error);
      res.status(500).json({
        success: false,
        message: 'USER_MANAGEMENT.USER_UPDATE_FAILED',
        data: null
      });
    }
  }
  
  /**
   * 批量更新用户角色
   * PATCH /api/admin/users/batch-role
   */
  async batchUpdateUserRole(req, res) {
    try {
      const { user_ids, user_role } = req.body;
      
      // 验证输入
      if (!Array.isArray(user_ids) || user_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'USER_MANAGEMENT.INVALID_USER_IDS',
          data: null
        });
      }
      
      if (!['user', 'business', 'admin'].includes(user_role)) {
        return res.status(400).json({
          success: false,
          message: 'USER_MANAGEMENT.INVALID_ROLE',
          data: null
        });
      }
      
      // 防止用户修改自己的角色
      if (user_ids.includes(req.userId)) {
        return res.status(400).json({
          success: false,
          message: 'USER_MANAGEMENT.CANNOT_MODIFY_SELF',
          data: null
        });
      }
      
      // 检查所有用户是否存在
      const placeholders = user_ids.map(() => '?').join(',');
      const [userRows] = await pool.query(
        `SELECT id, user_role FROM users WHERE id IN (${placeholders}) AND deleted = 0`,
        user_ids
      );
      
      if (userRows.length !== user_ids.length) {
        return res.status(400).json({
          success: false,
          message: 'USER_MANAGEMENT.SOME_USERS_NOT_FOUND',
          data: null
        });
      }
      
      // 批量更新角色
      const [updateResult] = await pool.query(
        `UPDATE users SET user_role = ? WHERE id IN (${placeholders}) AND deleted = 0`,
        [user_role, ...user_ids]
      );
      
      // 如果角色变为普通客户，移除业务组关联
      if (user_role === 'user') {
        await pool.query(
          `UPDATE user_business_groups SET deleted = 1, updated_by = ? WHERE user_id IN (${placeholders}) AND deleted = 0`,
          [req.userId, ...user_ids]
        );
      }
      
      res.json({
        success: true,
        message: 'USER_MANAGEMENT.BATCH_ROLE_UPDATE_SUCCESS',
        data: {
          updated_count: updateResult.affectedRows,
          user_ids: user_ids,
          user_role: user_role
        }
      });
      
    } catch (error) {
      console.error('批量更新用户角色错误:', error);
      res.status(500).json({
        success: false,
        message: 'USER_MANAGEMENT.BATCH_ROLE_UPDATE_FAILED',
        data: null
      });
    }
  }

  /**
   * 删除用户
   * DELETE /api/admin/users/:id
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      
      // 检查用户是否存在
      const [userRows] = await pool.query(
        'SELECT id, user_role, username FROM users WHERE id = ? AND deleted = 0',
        [id]
      );
      
      if (userRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'USER_MANAGEMENT.USER_NOT_FOUND',
          data: null
        });
      }
      
      const user = userRows[0];
      
      // 只允许删除管理员和业务员
      if (!['admin', 'business'].includes(user.user_role)) {
        return res.status(400).json({
          success: false,
          message: getMessage('USER_MANAGEMENT.CANNOT_DELETE_REGULAR_USER'),
          data: null
        });
      }
      
      // 不能删除自己
      if (parseInt(id) === req.userId) {
        return res.status(400).json({
          success: false,
          message: 'USER_MANAGEMENT.CANNOT_DELETE_SELF',
          data: null
        });
      }
      
      // 软删除用户
      await pool.query(
        'UPDATE users SET deleted = 1, updated_at = NOW() WHERE id = ?',
        [id]
      );
      
      // 删除用户的业务组关联
      await pool.query(
        'UPDATE user_business_groups SET deleted = 1, updated_by = ? WHERE user_id = ? AND deleted = 0',
        [req.userId, id]
      );
      
      res.json({
        success: true,
        message: getMessage('USER_MANAGEMENT.USER_DELETE_SUCCESS'),
        data: {
          deleted_user_id: parseInt(id),
          deleted_username: user.username
        }
      });
      
    } catch (error) {
      console.error('删除用户错误:', error);
      res.status(500).json({
        success: false,
        message: getMessage('USER_MANAGEMENT.USER_DELETE_FAILED'),
        data: null
      });
    }
  }

  /**
   * 更新用户业务组
   * PATCH /api/admin/users/:id/business-groups
   */
  async updateUserBusinessGroups(req, res) {
    try {
      const { id } = req.params;
      const { business_group_ids } = req.body;
      
      // 检查用户是否存在
      const [userRows] = await pool.query(
        'SELECT id, user_role FROM users WHERE id = ? AND deleted = 0',
        [id]
      );
      
      if (userRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'USER_MANAGEMENT.USER_NOT_FOUND',
          data: null
        });
      }
      
      const user = userRows[0];
      
      // 只有业务人员和管理员可以分配业务组
      if (!['business', 'admin'].includes(user.user_role)) {
        return res.status(400).json({
          success: false,
          message: 'USER_MANAGEMENT.INVALID_USER_ROLE_FOR_BUSINESS_GROUP',
          data: null
        });
      }
      
      // 验证业务组ID
      if (business_group_ids && business_group_ids.length > 0) {
        const placeholders = business_group_ids.map(() => '?').join(',');
        const [groupRows] = await pool.query(
          `SELECT id FROM business_groups WHERE id IN (${placeholders}) AND deleted = 0`,
          business_group_ids
        );
        
        if (groupRows.length !== business_group_ids.length) {
          return res.status(400).json({
            success: false,
            message: 'USER_MANAGEMENT.INVALID_BUSINESS_GROUPS',
            data: null
          });
        }
      }
      
      // 删除现有的业务组关联
      await pool.query(
        'UPDATE user_business_groups SET deleted = 1, updated_by = ? WHERE user_id = ? AND deleted = 0',
        [req.userId, id]
      );
      
      // 添加新的业务组关联
      if (business_group_ids && business_group_ids.length > 0) {
        const insertValues = business_group_ids.map(groupId => [
          require('crypto').randomUUID().replace(/-/g, ''),
          parseInt(id),
          parseInt(groupId),
          req.userId,
          req.userId
        ]);
        
        await pool.query(
          `INSERT INTO user_business_groups (guid, user_id, business_group_id, assigned_by, created_by) VALUES ${insertValues.map(() => '(UNHEX(?), ?, ?, ?, ?)').join(', ')}`,
          insertValues.flat()
        );
      }
      
      res.json({
        success: true,
        message: getMessage('USER_MANAGEMENT.BUSINESS_GROUPS_UPDATE_SUCCESS'),
        data: {
          user_id: parseInt(id),
          business_group_ids: business_group_ids || []
        }
      });
      
    } catch (error) {
      console.error('更新用户业务组错误:', error);
      res.status(500).json({
        success: false,
        message: getMessage('USER_MANAGEMENT.BUSINESS_GROUPS_UPDATE_FAILED'),
        data: null
      });
    }
  }

  /**
   * 获取业务组列表
   * GET /api/admin/business-groups
   */
  async getBusinessGroups(req, res) {
    try {
      const [groupRows] = await pool.query(
        'SELECT id, group_name, group_email, description, is_default FROM business_groups WHERE deleted = 0 ORDER BY is_default DESC, group_name ASC'
      );
      
      res.json({
        success: true,
        message: getMessage('USER_MANAGEMENT.BUSINESS_GROUPS_SUCCESS'),
        data: groupRows.map(row => ({
          id: row.id,
          name: row.group_name,
          email: row.group_email,
          description: row.description,
          is_default: row.is_default
        }))
      });
      
    } catch (error) {
      console.error('获取业务组列表错误:', error);
      res.status(500).json({
        success: false,
        message: getMessage('USER_MANAGEMENT.BUSINESS_GROUPS_FAILED'),
        data: null
      });
    }
  }

  /**
   * 获取用户的业务组
   * GET /api/admin/users/:id/business-groups
   */
  async getUserBusinessGroups(req, res) {
    try {
      const { id } = req.params;
      
      const [groupRows] = await pool.query(
        `SELECT bg.id, bg.group_name, bg.group_email, bg.description, bg.is_default
         FROM user_business_groups ubg
         INNER JOIN business_groups bg ON ubg.business_group_id = bg.id
         WHERE ubg.user_id = ? AND ubg.deleted = 0 AND bg.deleted = 0
         ORDER BY bg.is_default DESC, bg.group_name ASC`,
        [id]
      );
      
      res.json({
        success: true,
        message: getMessage('USER_MANAGEMENT.USER_BUSINESS_GROUPS_SUCCESS'),
        data: groupRows.map(row => ({
          id: row.id,
          name: row.group_name,
          email: row.group_email,
          description: row.description,
          is_default: row.is_default
        }))
      });
      
    } catch (error) {
      console.error('获取用户业务组错误:', error);
      res.status(500).json({
        success: false,
        message: getMessage('USER_MANAGEMENT.USER_BUSINESS_GROUPS_FAILED'),
        data: null
      });
    }
  }

  /**
   * 获取普通用户的业务组信息
   * GET /api/admin/users/:id/business-group
   */
  async getUserBusinessGroup(req, res) {
    try {
      const { id } = req.params;
      
      const [rows] = await pool.query(
        `SELECT u.id, u.username, u.email, u.business_group_id,
                bg.group_name as business_group_name, bg.group_email as business_group_email
         FROM users u
         LEFT JOIN business_groups bg ON u.business_group_id = bg.id AND bg.deleted = 0
         WHERE u.id = ? AND u.deleted = 0`,
        [id]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('USER.NOT_FOUND'),
          data: null
        });
      }
      
      res.json({
        success: true,
        message: getMessage('USER.GET_SUCCESS'),
        data: rows[0]
      });
    } catch (error) {
      console.error('获取用户业务组错误:', error);
      res.status(500).json({
        success: false,
        message: getMessage('SYSTEM.INTERNAL_ERROR'),
        data: null
      });
    }
  }

  /**
   * 修改普通用户的业务组
   * PATCH /api/admin/users/:id/business-group
   */
  async updateUserBusinessGroup(req, res) {
    try {
      const { id } = req.params;
      const { business_group_id } = req.body;
      
      // 验证业务组是否存在
      if (business_group_id) {
        const [bgRows] = await pool.query(
          'SELECT id FROM business_groups WHERE id = ? AND deleted = 0',
          [business_group_id]
        );
        
        if (bgRows.length === 0) {
          return res.status(400).json({
            success: false,
            message: getMessage('BUSINESS_GROUP.NOT_FOUND'),
            data: null
          });
        }
      }
      
      // 验证用户是否存在
      const [userRows] = await pool.query(
        'SELECT id FROM users WHERE id = ? AND deleted = 0',
        [id]
      );
      
      if (userRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('USER_MANAGEMENT.USER_NOT_FOUND'),
          data: null
        });
      }
      
      // 更新用户的业务组
      await pool.query(
        'UPDATE users SET business_group_id = ?, updated_at = NOW(), updated_by = ? WHERE id = ?',
        [business_group_id, req.userId, id]
      );
      
      res.json({
        success: true,
        message: getMessage('USER_MANAGEMENT.BUSINESS_GROUP_UPDATE_SUCCESS'),
        data: null
      });
    } catch (error) {
      console.error('更新用户业务组错误:', error);
      res.status(500).json({
        success: false,
        message: getMessage('USER_MANAGEMENT.BUSINESS_GROUP_UPDATE_FAILED'),
        data: null
      });
    }
  }
}

module.exports = new UserManagementController();