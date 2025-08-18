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
          website, is_active, is_default, created_at, updated_at
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
      
      // 检查是否已有物流公司存在，如果没有则设为默认
      const countQuery = `
        SELECT COUNT(*) as count FROM logistics_companies
        WHERE deleted = FALSE
      `;
      
      const countResult = await query(countQuery);
      const existingCount = parseInt(countResult.getFirstRow().count);
      const shouldSetDefault = existingCount === 0;
      
      // 创建物流公司
      const insertQuery = `
        INSERT INTO logistics_companies (
          name, description, contact_phone, contact_email, 
          website, is_active, is_default, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
        RETURNING id, guid, name, description, contact_phone, 
                  contact_email, website, is_active, is_default, created_at
      `;
      
      const result = await query(insertQuery, [
        name,
        description,
        contact_phone,
        contact_email,
        website,
        is_active,
        shouldSetDefault,
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

  /**
   * 获取物流公司的运费范围列表
   */
  async getShippingFeeRanges(req, res) {
    try {
      const { companyId } = req.params;
      const { page = 1, limit = 20, country_id, tags_id } = req.query;
      const offset = (page - 1) * limit;
      
      // 验证物流公司是否存在
      const companyQuery = `
        SELECT id FROM logistics_companies
        WHERE id = $1 AND deleted = FALSE
      `;
      
      const companyResult = await query(companyQuery, [companyId]);
      
      if (companyResult.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('LOGISTICS.COMPANY_NOT_FOUND')
        });
      }
      
      let whereClause = 'WHERE sr.deleted = FALSE AND sr.logistics_companies_id = $1';
      let params = [companyId];
      let paramIndex = 2;
      
      // 国家过滤
      if (country_id) {
        whereClause += ` AND sr.country_id = $${paramIndex}`;
        params.push(country_id);
        paramIndex++;
      }
      
      // 标签过滤
      if (tags_id) {
        whereClause += ` AND sr.tags_id = $${paramIndex}`;
        params.push(tags_id);
        paramIndex++;
      }
      
      // 查询运费范围列表
      const rangesQuery = `
        SELECT 
          sr.id, sr.guid, sr.country_id, sr.tags_id, sr.logistics_companies_id,
          sr.min_weight, sr.max_weight, sr.fee,
          sr.created_at, sr.updated_at,
          c.name as country_name,
          t.value as tag_name,
          lc.name as logistics_company_name
        FROM shippingfee_ranges sr
        LEFT JOIN countries c ON sr.country_id = c.id AND c.deleted = FALSE
        LEFT JOIN tags t ON sr.tags_id = t.id AND t.deleted = FALSE
        LEFT JOIN logistics_companies lc ON sr.logistics_companies_id = lc.id AND lc.deleted = FALSE
        ${whereClause}
        ORDER BY sr.min_weight
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      params.push(limit, offset);
      
      const rangesResult = await query(rangesQuery, params);
      
      // 查询总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM shippingfee_ranges sr
        ${whereClause}
      `;
      
      const countResult = await query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.getFirstRow().total);
      
      res.json({
        success: true,
        message: getMessage('LOGISTICS.FETCH_SHIPPING_RANGES_SUCCESS'),
        data: {
          ranges: rangesResult.getRows(),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
      
    } catch (error) {
      console.error('获取运费范围列表失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('LOGISTICS.FETCH_SHIPPING_RANGES_FAILED')
      });
    }
  }

  /**
   * 创建运费范围
   */
  async createShippingFeeRange(req, res) {
    try {
      const { companyId } = req.params;
      const {
        country_id,
        tags_id,
        min_weight,
        max_weight,
        fee
      } = req.body;
      
      const userId = req.userId;
      
      // 验证物流公司是否存在
      const companyQuery = `
        SELECT id FROM logistics_companies
        WHERE id = $1 AND deleted = FALSE
      `;
      
      const companyResult = await query(companyQuery, [companyId]);
      
      if (companyResult.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('LOGISTICS.COMPANY_NOT_FOUND')
        });
      }
      
      // 验证必填字段
      if (min_weight === undefined || fee === undefined) {
        return res.status(400).json({
          success: false,
          message: getMessage('LOGISTICS.SHIPPING_RANGE_REQUIRED_FIELDS')
        });
      }
      
      // 验证重量范围
      if (max_weight !== null && max_weight !== undefined && parseFloat(min_weight) >= parseFloat(max_weight)) {
        return res.status(400).json({
          success: false,
          message: getMessage('LOGISTICS.INVALID_WEIGHT_RANGE')
        });
      }
      
      // 检查重量范围是否重叠
      let overlapQuery = `
        SELECT id FROM shippingfee_ranges
        WHERE logistics_companies_id = $1 AND deleted = FALSE
        AND (
          ($2 >= min_weight AND $2 < COALESCE(max_weight, 999999)) OR
          (COALESCE($3, 999999) > min_weight AND COALESCE($3, 999999) <= COALESCE(max_weight, 999999)) OR
          ($2 <= min_weight AND COALESCE($3, 999999) >= COALESCE(max_weight, 999999))
        )
      `;
      
      let overlapParams = [companyId, min_weight, max_weight];
      let paramIndex = 4;
      
      if (country_id) {
        overlapQuery += ` AND country_id = $${paramIndex}`;
        overlapParams.push(country_id);
        paramIndex++;
      } else {
        overlapQuery += ` AND country_id IS NULL`;
      }
      
      if (tags_id) {
        overlapQuery += ` AND tags_id = $${paramIndex}`;
        overlapParams.push(tags_id);
      } else {
        overlapQuery += ` AND tags_id IS NULL`;
      }
      
      const overlapResult = await query(overlapQuery, overlapParams);
      
      if (overlapResult.getRowCount() > 0) {
        return res.status(400).json({
          success: false,
          message: getMessage('LOGISTICS.WEIGHT_RANGE_OVERLAP')
        });
      }
      
      // 创建运费范围
      const insertQuery = `
        INSERT INTO shippingfee_ranges (
          country_id, tags_id, logistics_companies_id,
          min_weight, max_weight, fee,
          created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
        RETURNING id, guid, country_id, tags_id, logistics_companies_id,
                  min_weight, max_weight, fee, created_at
      `;
      
      const result = await query(insertQuery, [
        country_id || null,
        tags_id || null,
        companyId,
        min_weight,
        max_weight || null,
        fee,
        userId
      ]);
      
      res.status(201).json({
        success: true,
        message: getMessage('LOGISTICS.SHIPPING_RANGE_CREATE_SUCCESS'),
        data: result.getFirstRow()
      });
      
    } catch (error) {
      console.error('创建运费范围失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('LOGISTICS.SHIPPING_RANGE_CREATE_FAILED')
      });
    }
  }

  /**
   * 更新运费范围
   */
  async updateShippingFeeRange(req, res) {
    try {
      const { companyId, rangeId } = req.params;
      const {
        country_id,
        tags_id,
        min_weight,
        max_weight,
        fee
      } = req.body;
      
      const userId = req.userId;
      
      // 验证物流公司是否存在
      const companyQuery = `
        SELECT id FROM logistics_companies
        WHERE id = $1 AND deleted = FALSE
      `;
      
      const companyResult = await query(companyQuery, [companyId]);
      
      if (companyResult.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('LOGISTICS.COMPANY_NOT_FOUND')
        });
      }
      
      // 验证运费范围是否存在
      const rangeQuery = `
        SELECT id FROM shippingfee_ranges
        WHERE id = $1 AND logistics_companies_id = $2 AND deleted = FALSE
      `;
      
      const rangeResult = await query(rangeQuery, [rangeId, companyId]);
      
      if (rangeResult.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('LOGISTICS.SHIPPING_RANGE_NOT_FOUND')
        });
      }
      
      // 验证重量范围
      if (min_weight !== undefined && max_weight !== undefined && max_weight !== null && parseFloat(min_weight) >= parseFloat(max_weight)) {
        return res.status(400).json({
          success: false,
          message: getMessage('LOGISTICS.INVALID_WEIGHT_RANGE')
        });
      }
      
      // 检查重量范围是否重叠（排除当前记录）
      if (min_weight !== undefined || max_weight !== undefined) {
        let overlapQuery = `
          SELECT id FROM shippingfee_ranges
          WHERE logistics_companies_id = $1 AND deleted = FALSE AND id != $2
          AND (
            ($3 >= min_weight AND $3 < COALESCE(max_weight, 999999)) OR
            (COALESCE($4, 999999) > min_weight AND COALESCE($4, 999999) <= COALESCE(max_weight, 999999)) OR
            ($3 <= min_weight AND COALESCE($4, 999999) >= COALESCE(max_weight, 999999))
          )
        `;
        
        let overlapParams = [companyId, rangeId, min_weight, max_weight];
        let paramIndex = 5;
        
        if (country_id !== undefined) {
          if (country_id) {
            overlapQuery += ` AND country_id = $${paramIndex}`;
            overlapParams.push(country_id);
            paramIndex++;
          } else {
            overlapQuery += ` AND country_id IS NULL`;
          }
        }
        
        if (tags_id !== undefined) {
           if (tags_id) {
             overlapQuery += ` AND tags_id = $${paramIndex}`;
             overlapParams.push(tags_id);
             paramIndex++;
           } else {
             overlapQuery += ` AND tags_id IS NULL`;
           }
         }
        
        const overlapResult = await query(overlapQuery, overlapParams);
        
        if (overlapResult.getRowCount() > 0) {
          return res.status(400).json({
            success: false,
            message: getMessage('LOGISTICS.WEIGHT_RANGE_OVERLAP')
          });
        }
      }
      
      // 构建更新字段
      const updateFields = [];
      const params = [];
      let paramIndex = 1;
      
      if (country_id !== undefined) {
        updateFields.push(`country_id = $${paramIndex}`);
        params.push(country_id || null);
        paramIndex++;
      }
      
      if (tags_id !== undefined) {
        updateFields.push(`tags_id = $${paramIndex}`);
        params.push(tags_id || null);
        paramIndex++;
      }
      
      if (min_weight !== undefined) {
        updateFields.push(`min_weight = $${paramIndex}`);
        params.push(min_weight);
        paramIndex++;
      }
      
      if (max_weight !== undefined) {
        updateFields.push(`max_weight = $${paramIndex}`);
        params.push(max_weight || null);
        paramIndex++;
      }
      
      if (fee !== undefined) {
        updateFields.push(`fee = $${paramIndex}`);
        params.push(fee);
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
      
      params.push(rangeId);
      
      const updateQuery = `
        UPDATE shippingfee_ranges SET
          ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, guid, country_id, tags_id, logistics_companies_id,
                  min_weight, max_weight, fee, updated_at
      `;
      
      const result = await query(updateQuery, params);
      
      res.json({
        success: true,
        message: getMessage('LOGISTICS.SHIPPING_RANGE_UPDATE_SUCCESS'),
        data: result.getFirstRow()
      });
      
    } catch (error) {
      console.error('更新运费范围失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('LOGISTICS.SHIPPING_RANGE_UPDATE_FAILED')
      });
    }
  }

  /**
   * 删除运费范围（软删除）
   */
  async deleteShippingFeeRange(req, res) {
    try {
      const { companyId, rangeId } = req.params;
      const userId = req.userId;
      
      // 验证物流公司是否存在
      const companyQuery = `
        SELECT id FROM logistics_companies
        WHERE id = $1 AND deleted = FALSE
      `;
      
      const companyResult = await query(companyQuery, [companyId]);
      
      if (companyResult.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('LOGISTICS.COMPANY_NOT_FOUND')
        });
      }
      
      // 验证运费范围是否存在
      const rangeQuery = `
        SELECT id FROM shippingfee_ranges
        WHERE id = $1 AND logistics_companies_id = $2 AND deleted = FALSE
      `;
      
      const rangeResult = await query(rangeQuery, [rangeId, companyId]);
      
      if (rangeResult.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('LOGISTICS.SHIPPING_RANGE_NOT_FOUND')
        });
      }
      
      // 软删除
      const deleteQuery = `
        UPDATE shippingfee_ranges SET
          deleted = TRUE,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $1
        WHERE id = $2
      `;
      
      await query(deleteQuery, [userId, rangeId]);
      
      res.json({
        success: true,
        message: getMessage('LOGISTICS.SHIPPING_RANGE_DELETE_SUCCESS')
      });
      
    } catch (error) {
      console.error('删除运费范围失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('LOGISTICS.SHIPPING_RANGE_DELETE_FAILED')
      });
    }
  }

  /**
   * 获取运费范围详情
   */
  async getShippingFeeRangeDetail(req, res) {
    try {
      const { companyId, rangeId } = req.params;
      
      // 验证物流公司是否存在
      const companyQuery = `
        SELECT id FROM logistics_companies
        WHERE id = $1 AND deleted = FALSE
      `;
      
      const companyResult = await query(companyQuery, [companyId]);
      
      if (companyResult.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('LOGISTICS.COMPANY_NOT_FOUND')
        });
      }
      
      const detailQuery = `
        SELECT 
          sr.id, sr.guid, sr.country_id, sr.logistics_companies_id,
          sr.min_weight, sr.max_weight, sr.fee,
          sr.created_at, sr.updated_at,
          c.name as country_name,
          lc.name as logistics_company_name
        FROM shippingfee_ranges sr
        LEFT JOIN countries c ON sr.country_id = c.id AND c.deleted = FALSE
        LEFT JOIN logistics_companies lc ON sr.logistics_companies_id = lc.id AND lc.deleted = FALSE
        WHERE sr.id = $1 AND sr.logistics_companies_id = $2 AND sr.deleted = FALSE
      `;
      
      const result = await query(detailQuery, [rangeId, companyId]);
      
      if (result.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('LOGISTICS.SHIPPING_RANGE_NOT_FOUND')
        });
      }
      
      res.json({
        success: true,
        message: getMessage('LOGISTICS.SHIPPING_RANGE_DETAIL_SUCCESS'),
        data: result.getFirstRow()
      });
      
    } catch (error) {
      console.error('获取运费范围详情失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('LOGISTICS.SHIPPING_RANGE_DETAIL_FAILED')
      });
    }
  }

  /**
   * 设置默认物流公司
   */
  async setDefaultCompany(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;
      
      // 验证物流公司是否存在且启用
      const companyQuery = `
        SELECT id, name, is_active FROM logistics_companies
        WHERE id = $1 AND deleted = FALSE
      `;
      
      const companyResult = await query(companyQuery, [id]);
      
      if (companyResult.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('LOGISTICS.COMPANY_NOT_FOUND')
        });
      }
      
      const company = companyResult.getFirstRow();
      
      if (!company.is_active) {
        return res.status(400).json({
          success: false,
          message: getMessage('LOGISTICS.COMPANY_NOT_ACTIVE')
        });
      }
      
      // 使用事务确保数据一致性
      const connection = await getConnection();
      
      try {
        await connection.query('BEGIN');
        
        // 将所有公司的is_default设为false
        await connection.query(`
          UPDATE logistics_companies 
          SET is_default = FALSE, updated_at = CURRENT_TIMESTAMP, updated_by = $1
          WHERE deleted = FALSE
        `, [userId]);
        
        // 将指定公司设为默认
        const updateResult = await connection.query(`
          UPDATE logistics_companies 
          SET is_default = TRUE, updated_at = CURRENT_TIMESTAMP, updated_by = $1
          WHERE id = $2 AND deleted = FALSE
          RETURNING id, guid, name, description, contact_phone, 
                    contact_email, website, is_active, is_default, updated_at
        `, [userId, id]);
        
        await connection.query('COMMIT');
        
        res.json({
          success: true,
          message: getMessage('LOGISTICS.SET_DEFAULT_SUCCESS'),
          data: updateResult.rows[0]
        });
        
      } catch (error) {
        await connection.query('ROLLBACK');
        throw error;
      } finally {
        connection.release();
      }
      
    } catch (error) {
      console.error('设置默认物流公司失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('LOGISTICS.SET_DEFAULT_FAILED')
      });
    }
  }

  /**
   * 获取默认物流公司
   */
  async getDefaultCompany(req, res) {
    try {
      const defaultQuery = `
        SELECT 
          id, guid, name, description, contact_phone, contact_email, 
          website, is_active, is_default, created_at, updated_at
        FROM logistics_companies
        WHERE is_default = TRUE AND deleted = FALSE
      `;
      
      const result = await query(defaultQuery);
      
      if (result.getRowCount() === 0) {
        return res.json({
          success: true,
          message: getMessage('LOGISTICS.NO_DEFAULT_COMPANY'),
          data: null
        });
      }
      
      res.json({
        success: true,
        message: getMessage('LOGISTICS.GET_DEFAULT_SUCCESS'),
        data: result.getFirstRow()
      });
      
    } catch (error) {
      console.error('获取默认物流公司失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('LOGISTICS.GET_DEFAULT_FAILED')
      });
    }
  }
}

module.exports = new LogisticsCompanyController();