const { query, getConnection } = require('../db/db');
const { getMessage } = require('../config/messages');

/**
 * 物流公司管理控制器
 * 处理物流公司的增删改查功能
 */
class LogisticsCompanyController {
  
  /**
   * 获取物流公司列表
   */
  async getCompanies(req, res) {
    try {
      const { page = 1, limit = 20, search, is_active } = req.query;
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE deleted = FALSE';
      let params = [];
      let paramIndex = 1;
      
      // 搜索过滤
      if (search) {
        whereClause += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }
      
      // 状态过滤
      if (is_active !== undefined) {
        whereClause += ` AND is_active = $${paramIndex}`;
        params.push(is_active === 'true');
        paramIndex++;
      }
      
      // 查询列表
      const companiesQuery = `
        SELECT 
          id, guid, name, description, contact_phone, contact_email, 
          website, is_active, created_at, updated_at
        FROM logistics_companies
        ${whereClause}
        ORDER BY name
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      params.push(limit, offset);
      
      const companiesResult = await query(companiesQuery, params);
      
      // 查询总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM logistics_companies
        ${whereClause}
      `;
      
      const countResult = await query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.getFirstRow().total);
      
      res.json({
        success: true,
        message: getMessage('LOGISTICS.FETCH_COMPANIES_SUCCESS'),
        data: {
          companies: companiesResult.getRows(),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
      
    } catch (error) {
      console.error('获取物流公司列表失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('LOGISTICS.FETCH_COMPANIES_FAILED')
      });
    }
  }
  
  /**
   * 创建物流公司
   */
  async createCompany(req, res) {
    try {
      const {
        name,
        description,
        contact_phone,
        contact_email,
        website,
        is_active = true
      } = req.body;
      
      const userId = req.userId;
      
      // 验证必填字段
      if (!name) {
        return res.status(400).json({
          success: false,
          message: getMessage('LOGISTICS.COMPANY_NAME_REQUIRED')
        });
      }
      
      // 检查名称是否已存在
      const existingQuery = `
        SELECT id FROM logistics_companies
        WHERE name = $1 AND deleted = FALSE
      `;
      
      const existingResult = await query(existingQuery, [name]);
      
      if (existingResult.getRowCount() > 0) {
        return res.status(400).json({
          success: false,
          message: getMessage('LOGISTICS.COMPANY_NAME_EXISTS')
        });
      }
      
      // 创建物流公司
      const insertQuery = `
        INSERT INTO logistics_companies (
          name, description, contact_phone, contact_email, 
          website, is_active, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
        RETURNING id, guid, name, description, contact_phone, 
                  contact_email, website, is_active, created_at
      `;
      
      const result = await query(insertQuery, [
        name,
        description,
        contact_phone,
        contact_email,
        website,
        is_active,
        userId
      ]);
      
      res.status(201).json({
        success: true,
        message: getMessage('LOGISTICS.COMPANY_CREATE_SUCCESS'),
        data: result.getFirstRow()
      });
      
    } catch (error) {
      console.error('创建物流公司失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('LOGISTICS.COMPANY_CREATE_FAILED')
      });
    }
  }
  
  /**
   * 更新物流公司
   */
  async updateCompany(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        contact_phone,
        contact_email,
        website,
        is_active
      } = req.body;
      
      const userId = req.userId;
      
      // 验证物流公司是否存在
      const existingQuery = `
        SELECT id FROM logistics_companies
        WHERE id = $1 AND deleted = FALSE
      `;
      
      const existingResult = await query(existingQuery, [id]);
      
      if (existingResult.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('LOGISTICS.COMPANY_NOT_FOUND')
        });
      }
      
      // 如果更新名称，检查是否与其他公司重复
      if (name) {
        const nameCheckQuery = `
          SELECT id FROM logistics_companies
          WHERE name = $1 AND id != $2 AND deleted = FALSE
        `;
        
        const nameCheckResult = await query(nameCheckQuery, [name, id]);
        
        if (nameCheckResult.getRowCount() > 0) {
          return res.status(400).json({
            success: false,
            message: getMessage('LOGISTICS.COMPANY_NAME_EXISTS')
          });
        }
      }
      
      // 构建更新字段
      const updateFields = [];
      const params = [];
      let paramIndex = 1;
      
      if (name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        params.push(name);
        paramIndex++;
      }
      
      if (description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        params.push(description);
        paramIndex++;
      }
      
      if (contact_phone !== undefined) {
        updateFields.push(`contact_phone = $${paramIndex}`);
        params.push(contact_phone);
        paramIndex++;
      }
      
      if (contact_email !== undefined) {
        updateFields.push(`contact_email = $${paramIndex}`);
        params.push(contact_email);
        paramIndex++;
      }
      
      if (website !== undefined) {
        updateFields.push(`website = $${paramIndex}`);
        params.push(website);
        paramIndex++;
      }
      
      if (is_active !== undefined) {
        updateFields.push(`is_active = $${paramIndex}`);
        params.push(is_active);
        paramIndex++;
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: getMessage('LOGISTICS.NO_FIELDS_TO_UPDATE')
        });
      }
      
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateFields.push(`updated_by = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
      
      params.push(id);
      
      const updateQuery = `
        UPDATE logistics_companies SET
          ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, guid, name, description, contact_phone, 
                  contact_email, website, is_active, updated_at
      `;
      
      const result = await query(updateQuery, params);
      
      res.json({
        success: true,
        message: getMessage('LOGISTICS.COMPANY_UPDATE_SUCCESS'),
        data: result.getFirstRow()
      });
      
    } catch (error) {
      console.error('更新物流公司失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('LOGISTICS.COMPANY_UPDATE_FAILED')
      });
    }
  }
  
  /**
   * 删除物流公司（软删除）
   */
  async deleteCompany(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;
      
      // 验证物流公司是否存在
      const existingQuery = `
        SELECT id FROM logistics_companies
        WHERE id = $1 AND deleted = FALSE
      `;
      
      const existingResult = await query(existingQuery, [id]);
      
      if (existingResult.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('LOGISTICS.COMPANY_NOT_FOUND')
        });
      }
      
      // 检查是否有关联的物流记录
      const logisticsCheckQuery = `
        SELECT COUNT(*) as count
        FROM logistics
        WHERE logistics_company_id = $1 AND deleted = FALSE
      `;
      
      const logisticsCheckResult = await query(logisticsCheckQuery, [id]);
      const logisticsCount = parseInt(logisticsCheckResult.getFirstRow().count);
      
      if (logisticsCount > 0) {
        return res.status(400).json({
          success: false,
          message: getMessage('LOGISTICS.COMPANY_HAS_RECORDS', { count: logisticsCount })
        });
      }
      
      // 软删除
      const deleteQuery = `
        UPDATE logistics_companies SET
          deleted = TRUE,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $1
        WHERE id = $2
      `;
      
      await query(deleteQuery, [userId, id]);
      
      res.json({
        success: true,
        message: getMessage('LOGISTICS.COMPANY_DELETE_SUCCESS')
      });
      
    } catch (error) {
      console.error('删除物流公司失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('LOGISTICS.COMPANY_DELETE_FAILED')
      });
    }
  }
  
  /**
   * 获取物流公司详情
   */
  async getCompanyDetail(req, res) {
    try {
      const { id } = req.params;
      
      const detailQuery = `
        SELECT 
          id, guid, name, description, contact_phone, contact_email, 
          website, is_active, created_at, updated_at
        FROM logistics_companies
        WHERE id = $1 AND deleted = FALSE
      `;
      
      const result = await query(detailQuery, [id]);
      
      if (result.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('LOGISTICS.COMPANY_NOT_FOUND')
        });
      }
      
      res.json({
        success: true,
        message: getMessage('LOGISTICS.COMPANY_DETAIL_SUCCESS'),
        data: result.getFirstRow()
      });
      
    } catch (error) {
      console.error('获取物流公司详情失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('LOGISTICS.COMPANY_DETAIL_FAILED')
      });
    }
  }
}

module.exports = new LogisticsCompanyController();