const express = require('express');
const { query } = require('../db/db');
const { v4: uuidv4 } = require('uuid');

/**
 * 业务组控制器
 * 处理业务组的创建、管理和用户分配等功能
 */
class BusinessGroupController {
  
  /**
   * 创建业务组
   * POST /api/admin/business-groups
   */
  async createBusinessGroup(req, res) {
    try {
      const { group_name, group_email, description, is_default = false } = req.body;
      
      // 基础验证
      if (!group_name || !group_email) {
        return res.status(400).json({
          success: false,
          message: 'BUSINESS_GROUP.VALIDATION_FAILED',
          data: null
        });
      }
      
      // 长度验证
      if (group_name.length < 2 || group_name.length > 64) {
        return res.status(400).json({
          success: false,
          message: 'BUSINESS_GROUP.NAME_INVALID_LENGTH',
          data: null
        });
      }
      
      // 邮箱格式验证
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(group_email)) {
        return res.status(400).json({
          success: false,
          message: 'BUSINESS_GROUP.INVALID_EMAIL',
          data: null
        });
      }
      
      // 检查组名是否已存在
      const existingGroups = await query(
        'SELECT id FROM business_groups WHERE group_name = $1 AND deleted = false',
        [group_name]
      );
      
      if (existingGroups.getRowCount() > 0) {
        return res.status(409).json({
          success: false,
          message: 'BUSINESS_GROUP.NAME_EXISTS',
          data: null
        });
      }
      
      // 检查邮箱是否已存在
      const existingEmails = await query(
        'SELECT id FROM business_groups WHERE group_email = $1 AND deleted = false',
        [group_email]
      );
      
      if (existingEmails.getRowCount() > 0) {
        return res.status(409).json({
          success: false,
          message: 'BUSINESS_GROUP.EMAIL_EXISTS',
          data: null
        });
      }
      
      // 如果设置为默认组，先取消其他默认组
      if (is_default) {
        await query(
          'UPDATE business_groups SET is_default = 0, updated_by = $1 WHERE is_default = 1 AND deleted = false',
          [req.userId]
        );
      }
      
      // 插入新业务组
      const insertResult = await query(`
        INSERT INTO business_groups (group_name, group_email, description, is_default, created_by, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [group_name, group_email, description, is_default, req.userId, req.userId]);
      
      const groupId = insertResult.getFirstRow().id;
      
      res.status(201).json({
        success: true,
        message: 'BUSINESS_GROUP.CREATE_SUCCESS',
        data: {
          id: groupId,
          group_name,
          group_email,
          description,
          is_default,
          created_by: req.userId
        }
      });
      
    } catch (error) {
      console.error('创建业务组错误:', error);
      res.status(500).json({
        success: false,
        message: 'BUSINESS_GROUP.CREATE_FAILED',
        data: null
      });
    }
  }
  
  /**
   * 获取业务组列表
   * GET /api/admin/business-groups
   */
  async getBusinessGroupList(req, res) {
    try {
      const { page = 1, pageSize = 20, keyword } = req.query;
      
      const offset = (page - 1) * pageSize;
      const limit = parseInt(pageSize);
      
      let whereConditions = ['bg.deleted = false'];
      let queryParams = [];
      
      // 关键词搜索
      if (keyword) {
        whereConditions.push('(bg.group_name LIKE $1 OR bg.group_email LIKE $2 OR bg.description LIKE $3)');
        const searchTerm = `%${keyword}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // 查询总数
      const countRows = await query(`
        SELECT COUNT(*) as total
        FROM business_groups bg
        WHERE ${whereClause}
      `, queryParams);
      
      const total = parseInt(countRows.getFirstRow().total);
      const totalPages = Math.ceil(total / limit);
      
      // 查询业务组列表
      const groupRows = await query(`
        SELECT 
          bg.id,
          bg.group_name,
          bg.group_email,
          bg.description,
          bg.is_default,
          bg.created_at,
          bg.updated_at,
          creator.username as created_by_name,
          COUNT(ubg.user_id) as member_count
        FROM business_groups bg
        LEFT JOIN users creator ON bg.created_by = creator.id
        LEFT JOIN user_business_groups ubg ON bg.id = ubg.business_group_id AND ubg.deleted = false
        WHERE ${whereClause}
        GROUP BY bg.id,bg.group_name,bg.group_email,bg.description,bg.is_default,bg.created_at,bg.updated_at,creator.username
        ORDER BY bg.is_default DESC, bg.created_at DESC
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `, [...queryParams, limit, offset]);
      
      // 格式化数据
      const items = groupRows.getRows().map(row => ({
        id: row.id,
        group_name: row.group_name,
        group_email: row.group_email,
        description: row.description,
        is_default: Boolean(row.is_default),
        member_count: row.member_count,
        created_by_name: row.created_by_name,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
      
      res.json({
        success: true,
        message: 'BUSINESS_GROUP.LIST_SUCCESS',
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
      console.error('获取业务组列表错误:', error);
      res.status(500).json({
        success: false,
        message: 'BUSINESS_GROUP.LIST_FAILED',
        data: null
      });
    }
  }
  
  /**
   * 获取业务组详情
   * GET /api/admin/business-groups/:id
   */
  async getBusinessGroupDetail(req, res) {
    try {
      const { id } = req.params;
      
      const groupRows = await query(`
        SELECT 
          bg.*,
          creator.username as created_by_name
        FROM business_groups bg
        LEFT JOIN users creator ON bg.created_by = creator.id
        WHERE bg.id = $1 AND bg.deleted = false
      `, [id]);
      
      if (groupRows.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: 'BUSINESS_GROUP.NOT_FOUND',
          data: null
        });
      }
      
      const group = groupRows.getFirstRow();
      
      // 获取组成员列表
      const memberRows = await query(`
        SELECT 
          u.id,
          u.username,
          u.email,
          u.user_role,
          ubg.created_at as joined_at
        FROM user_business_groups ubg
        INNER JOIN users u ON ubg.user_id = u.id
        WHERE ubg.business_group_id = $1 AND ubg.deleted = false AND u.deleted = false
        ORDER BY ubg.created_at ASC
      `, [id]);
      
      res.json({
        success: true,
        message: 'BUSINESS_GROUP.DETAIL_SUCCESS',
        data: {
          id: group.id,
          group_name: group.group_name,
          group_email: group.group_email,
          description: group.description,
          is_default: Boolean(group.is_default),
          created_by: group.created_by,
          created_by_name: group.created_by_name,
          created_at: group.created_at,
          updated_at: group.updated_at,
          members: memberRows.getRows().map(member => ({
            id: member.id,
            username: member.username,
            email: member.email,
            user_role: member.user_role,
            joined_at: member.joined_at
          }))
        }
      });
      
    } catch (error) {
      console.error('获取业务组详情错误:', error);
      res.status(500).json({
        success: false,
        message: 'BUSINESS_GROUP.DETAIL_FAILED',
        data: null
      });
    }
  }
  
  /**
   * 更新业务组
   * PUT /api/admin/business-groups/:id
   */
  async updateBusinessGroup(req, res) {
    try {
      const { id } = req.params;
      const { group_name, group_email, description, is_default } = req.body;
      
      // 基础验证
      if (!group_name || !group_email) {
        return res.status(400).json({
          success: false,
          message: 'BUSINESS_GROUP.VALIDATION_FAILED',
          data: null
        });
      }
      
      // 长度验证
      if (group_name.length < 2 || group_name.length > 64) {
        return res.status(400).json({
          success: false,
          message: 'BUSINESS_GROUP.NAME_INVALID_LENGTH',
          data: null
        });
      }
      
      // 邮箱格式验证
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(group_email)) {
        return res.status(400).json({
          success: false,
          message: 'BUSINESS_GROUP.INVALID_EMAIL',
          data: null
        });
      }
      
      // 检查业务组是否存在
      const existingGroups = await query(
        'SELECT id FROM business_groups WHERE id = $1 AND deleted = false',
        [id]
      );
      
      if (existingGroups.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: 'BUSINESS_GROUP.NOT_FOUND',
          data: null
        });
      }
      
      // 检查组名是否已被其他组使用
      const nameConflicts = await query(
        'SELECT id FROM business_groups WHERE group_name = $1 AND id != $2 AND deleted = false',
        [group_name, id]
      );
      
      if (nameConflicts.getRowCount() > 0) {
        return res.status(409).json({
          success: false,
          message: 'BUSINESS_GROUP.NAME_EXISTS',
          data: null
        });
      }
      
      // 检查邮箱是否已被其他组使用
      const emailConflicts = await query(
        'SELECT id FROM business_groups WHERE group_email = $1 AND id != $2 AND deleted = false',
        [group_email, id]
      );
      
      if (emailConflicts.getRowCount() > 0) {
        return res.status(409).json({
          success: false,
          message: 'BUSINESS_GROUP.EMAIL_EXISTS',
          data: null
        });
      }
      
      // 如果设置为默认组，先取消其他默认组
      if (is_default) {
        await query(
          'UPDATE business_groups SET is_default = 0, updated_by = $1 WHERE is_default = 1 AND id != $2 AND deleted = false',
          [req.userId, id]
        );
      }
      
      // 更新业务组
      const updateResult = await query(`
        UPDATE business_groups 
        SET group_name = $1, group_email = $2, description = $3, is_default = $4, updated_by = $5
        WHERE id = $6 AND deleted = false
      `, [group_name, group_email, description, is_default, req.userId, id]);
      
      if (updateResult.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'BUSINESS_GROUP.NOT_FOUND',
          data: null
        });
      }
      
      res.json({
        success: true,
        message: 'BUSINESS_GROUP.UPDATE_SUCCESS',
        data: {
          id: parseInt(id),
          group_name,
          group_email,
          description,
          is_default
        }
      });
      
    } catch (error) {
      console.error('更新业务组错误:', error);
      res.status(500).json({
        success: false,
        message: 'BUSINESS_GROUP.UPDATE_FAILED',
        data: null
      });
    }
  }
  
  /**
   * 删除业务组
   * DELETE /api/admin/business-groups/:id
   */
  async deleteBusinessGroup(req, res) {
    try {
      const { id } = req.params;
      
      // 检查是否为默认组
      const groupRows = await query(
        'SELECT is_default FROM business_groups WHERE id = $1 AND deleted = false',
        [id]
      );
      
      if (groupRows.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: 'BUSINESS_GROUP.NOT_FOUND',
          data: null
        });
      }
      
      if (groupRows.getFirstRow().is_default) {
        return res.status(400).json({
          success: false,
          message: 'BUSINESS_GROUP.CANNOT_DELETE_DEFAULT',
          data: null
        });
      }
      
      // 检查是否有关联的联系消息
      const messageRows = await query(
        'SELECT COUNT(*) as count FROM contact_messages WHERE business_group_id = $1 AND deleted = false',
        [id]
      );
      
      if (messageRows.getFirstRow().count > 0) {
        return res.status(400).json({
          success: false,
          message: 'BUSINESS_GROUP.HAS_MESSAGES',
          data: null
        });
      }
      
      // 软删除业务组
      const deleteResult = await query(
        'UPDATE business_groups SET deleted = true, updated_by = $1 WHERE id = $2 AND deleted = false',
        [req.userId, id]
      );
      
      if (deleteResult.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: 'BUSINESS_GROUP.NOT_FOUND',
          data: null
        });
      }
      
      // 同时软删除相关的用户业务组关联
      await query(
        'UPDATE user_business_groups SET deleted = true, updated_by = $1 WHERE business_group_id = $2 AND deleted = false',
        [req.userId, id]
      );
      
      res.json({
        success: true,
        message: 'BUSINESS_GROUP.DELETE_SUCCESS',
        data: null
      });
      
    } catch (error) {
      console.error('删除业务组错误:', error);
      res.status(500).json({
        success: false,
        message: 'BUSINESS_GROUP.DELETE_FAILED',
        data: null
      });
    }
  }
  
  /**
   * 分配用户到业务组
   * POST /api/admin/business-groups/:id/assign-user
   */
  async assignUserToGroup(req, res) {
    try {
      const { id } = req.params;
      const { user_id } = req.body;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: 'BUSINESS_GROUP.USER_ID_REQUIRED',
          data: null
        });
      }
      
      // 检查业务组是否存在
      const groupRows = await query(
        'SELECT id FROM business_groups WHERE id = $1 AND deleted = false',
        [id]
      );
      
      if (groupRows.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: 'BUSINESS_GROUP.NOT_FOUND',
          data: null
        });
      }
      
      // 检查用户是否存在且为业务人员或管理员
      const userRows = await query(
        'SELECT user_role FROM users WHERE id = $1 AND deleted = false',
        [user_id]
      );
      
      if (userRows.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: 'USER_MANAGEMENT.USER_NOT_FOUND',
          data: null
        });
      }
      
      if (!['business', 'admin'].includes(userRows.getFirstRow().user_role)) {
        return res.status(400).json({
          success: false,
          message: 'BUSINESS_GROUP.INVALID_USER_ROLE',
          data: null
        });
      }
      
      // 检查用户是否已在该组中
      const existingAssignments = await query(
        'SELECT id FROM user_business_groups WHERE user_id = $1 AND business_group_id = $2 AND deleted = false',
        [user_id, id]
      );
      
      if (existingAssignments.getRowCount() > 0) {
        return res.status(409).json({
          success: false,
          message: 'BUSINESS_GROUP.USER_ALREADY_ASSIGNED',
          data: null
        });
      }
      
      // 分配用户到业务组
      const insertResult = await query(`
        INSERT INTO user_business_groups (user_id, business_group_id, assigned_by, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [user_id, id, req.userId, req.userId]);
      
      res.status(201).json({
        success: true,
        message: 'BUSINESS_GROUP.USER_ASSIGNED_SUCCESS',
        data: {
          id: insertResult.getFirstRow().id,
          user_id: parseInt(user_id),
          business_group_id: parseInt(id),
          assigned_by: req.userId
        }
      });
      
    } catch (error) {
      console.error('分配用户到业务组错误:', error);
      res.status(500).json({
        success: false,
        message: 'BUSINESS_GROUP.USER_ASSIGN_FAILED',
        data: null
      });
    }
  }
  
  /**
   * 从业务组移除用户
   * DELETE /api/admin/business-groups/:id/users/:userId
   */
  async removeUserFromGroup(req, res) {
    try {
      const { id, userId } = req.params;
      
      const deleteResult = await query(
        'UPDATE user_business_groups SET deleted = true, updated_by = $1 WHERE user_id = $2 AND business_group_id = $3 AND deleted = false',
        [req.userId, userId, id]
      );
      
      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'BUSINESS_GROUP.USER_NOT_IN_GROUP',
          data: null
        });
      }
      
      res.json({
        success: true,
        message: 'BUSINESS_GROUP.USER_REMOVED_SUCCESS',
        data: null
      });
      
    } catch (error) {
      console.error('从业务组移除用户错误:', error);
      res.status(500).json({
        success: false,
        message: 'BUSINESS_GROUP.USER_REMOVE_FAILED',
        data: null
      });
    }
  }
  
  /**
   * 获取可分配的用户列表（业务人员和管理员）
   * GET /api/admin/business-groups/available-users
   * GET /api/admin/business-groups/:id/available-users
   */
  async getAvailableUsers(req, res) {
    try {
      // 支持从路径参数或查询参数获取business_group_id
      const business_group_id = req.params.id || req.query.business_group_id;
      
      let whereConditions = ["u.deleted = false", "u.user_role IN ('business', 'admin')"];
      let queryParams = [];
      
      // 如果指定了业务组，排除已在该组的用户
      if (business_group_id) {
        whereConditions.push(`
          u.id NOT IN (
            SELECT ubg.user_id 
            FROM user_business_groups ubg 
            WHERE ubg.business_group_id = $${queryParams.length + 1} AND ubg.deleted = false
          )
        `);
        queryParams.push(business_group_id);
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      const userRows = await query(`
        SELECT 
          u.id,
          u.username,
          u.email,
          u.user_role,
          u.created_at
        FROM users u
        WHERE ${whereClause}
        ORDER BY u.username ASC
      `, queryParams);
      
      res.json({
        success: true,
        message: 'BUSINESS_GROUP.AVAILABLE_USERS_SUCCESS',
        data: userRows.getRows().map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.user_role,
          created_at: user.created_at
        }))
      });
      
    } catch (error) {
      console.error('获取可分配用户列表错误:', error);
      res.status(500).json({
        success: false,
        message: 'BUSINESS_GROUP.AVAILABLE_USERS_FAILED',
        data: null
      });
    }
  }
}

module.exports = new BusinessGroupController();