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
          id, guid, name, code, description, contact_phone, contact_email, 
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
        code,
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
          name, code, description, contact_phone, contact_email, 
          website, is_active, is_default, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
        RETURNING id, guid, name, code, description, contact_phone, 
                  contact_email, website, is_active, is_default, created_at
      `;
      
      const result = await query(insertQuery, [
        name,
        code,
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
        code,
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
      
      // 如果更新Code，检查是否与其他公司重复
      if (code) {
        const codeCheckQuery = `
          SELECT id FROM logistics_companies
          WHERE code = $1 AND id != $2 AND deleted = FALSE
        `;
        
        const codeCheckResult = await query(codeCheckQuery, [code, id]);
        
        if (codeCheckResult.getRowCount() > 0) {
          return res.status(400).json({
            success: false,
            message: getMessage('LOGISTICS.COMPANY_CODE_EXISTS')
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

      if (code !== undefined) {
        updateFields.push(`code = $${paramIndex}`);
        params.push(code);
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
          id, guid, name, code, description, contact_phone, contact_email, 
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
          sr.unit, sr.min_value, sr.max_value, sr.fee,
          sr.created_at, sr.updated_at,
          c.name as country_name,
          t.value as tag_name,
          lc.name as logistics_company_name
        FROM shippingfee_ranges sr
        LEFT JOIN countries c ON sr.country_id = c.id AND c.deleted = FALSE
        LEFT JOIN tags t ON sr.tags_id = t.id AND t.deleted = FALSE
        LEFT JOIN logistics_companies lc ON sr.logistics_companies_id = lc.id AND lc.deleted = FALSE
        ${whereClause}
        ORDER BY sr.unit, sr.min_value
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
        unit = 'kg',
        min_value,
        max_value,
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
      if (min_value === undefined || fee === undefined) {
        return res.status(400).json({
          success: false,
          message: getMessage('LOGISTICS.SHIPPING_RANGE_REQUIRED_FIELDS')
        });
      }
      
      // 验证单位字段
      if (!['kg', 'g', 'cm', 'm'].includes(unit)) {
        return res.status(400).json({
          success: false,
          message: getMessage('LOGISTICS.INVALID_UNIT')
        });
      }
      
      // 验证数值范围
      if (max_value !== null && max_value !== undefined && parseFloat(min_value) >= parseFloat(max_value)) {
        return res.status(400).json({
          success: false,
          message: getMessage('LOGISTICS.INVALID_VALUE_RANGE')
        });
      }
      
      // 检查数值范围是否重叠（同一单位下）
      let overlapQuery = `
        SELECT id FROM shippingfee_ranges
        WHERE logistics_companies_id = $1 AND unit = $2 AND deleted = FALSE
        AND (
          ($3 >= min_value AND $3 < COALESCE(max_value, 999999)) OR
          (COALESCE($4, 999999) > min_value AND COALESCE($4, 999999) <= COALESCE(max_value, 999999)) OR
          ($3 <= min_value AND COALESCE($4, 999999) >= COALESCE(max_value, 999999))
        )
      `;
      
      let overlapParams = [companyId, unit, min_value, max_value];
      let paramIndex = 5;
      
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
          message: getMessage('LOGISTICS.VALUE_RANGE_OVERLAP')
        });
      }
      
      // 创建运费范围
      const insertQuery = `
        INSERT INTO shippingfee_ranges (
          country_id, tags_id, logistics_companies_id,
          unit, min_value, max_value, fee,
          created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
        RETURNING id, guid, country_id, tags_id, logistics_companies_id,
                  unit, min_value, max_value, fee, created_at
      `;
      
      const result = await query(insertQuery, [
        country_id || null,
        tags_id || null,
        companyId,
        unit,
        min_value,
        max_value || null,
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
        unit,
        min_value,
        max_value,
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
      
      // 验证单位字段
      if (unit !== undefined && !['kg', 'g', 'cm', 'm'].includes(unit)) {
        return res.status(400).json({
          success: false,
          message: getMessage('LOGISTICS.INVALID_UNIT')
        });
      }
      
      // 验证数值范围
      if (min_value !== undefined && max_value !== undefined && max_value !== null && parseFloat(min_value) >= parseFloat(max_value)) {
        return res.status(400).json({
          success: false,
          message: getMessage('LOGISTICS.INVALID_VALUE_RANGE')
        });
      }
      
      // 检查数值范围是否重叠（排除当前记录，同一单位下）
      if (min_value !== undefined || max_value !== undefined || unit !== undefined) {
        // 获取当前记录的unit值（如果没有传入unit）
        let currentUnit = unit;
        if (currentUnit === undefined) {
          const currentQuery = `SELECT unit FROM shippingfee_ranges WHERE id = $1`;
          const currentResult = await query(currentQuery, [rangeId]);
          if (currentResult.getRowCount() > 0) {
            currentUnit = currentResult.getFirstRow().unit;
          }
        }
        
        let overlapQuery = `
          SELECT id FROM shippingfee_ranges
          WHERE logistics_companies_id = $1 AND unit = $2 AND deleted = FALSE AND id != $3
          AND (
            ($4 >= min_value AND $4 < COALESCE(max_value, 999999)) OR
            (COALESCE($5, 999999) > min_value AND COALESCE($5, 999999) <= COALESCE(max_value, 999999)) OR
            ($4 <= min_value AND COALESCE($5, 999999) >= COALESCE(max_value, 999999))
          )
        `;
        
        let overlapParams = [companyId, currentUnit, rangeId, min_value, max_value];
        let paramIndex = 6;
        
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
            message: getMessage('LOGISTICS.VALUE_RANGE_OVERLAP')
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
      
      if (unit !== undefined) {
        updateFields.push(`unit = $${paramIndex}`);
        params.push(unit);
        paramIndex++;
      }
      
      if (min_value !== undefined) {
        updateFields.push(`min_value = $${paramIndex}`);
        params.push(min_value);
        paramIndex++;
      }
      
      if (max_value !== undefined) {
        updateFields.push(`max_value = $${paramIndex}`);
        params.push(max_value || null);
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
                  unit, min_value, max_value, fee, updated_at
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
          sr.unit, sr.min_value, sr.max_value, sr.fee,
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
          id, guid, name, code, description, contact_phone, contact_email, 
          website, is_active, is_default, created_at, updated_at
        FROM logistics_companies
        WHERE is_default = TRUE AND deleted = FALSE
        LIMIT 1
      `;
      
      const result = await query(defaultQuery);
      
      if (result.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('LOGISTICS.DEFAULT_COMPANY_NOT_FOUND')
        });
      }
      
      res.json({
        success: true,
        message: getMessage('LOGISTICS.FETCH_DEFAULT_COMPANY_SUCCESS'),
        data: result.getFirstRow()
      });
      
    } catch (error) {
      console.error('获取默认物流公司失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('LOGISTICS.FETCH_DEFAULT_COMPANY_FAILED')
      });
    }
  }

  /**
   * 获取运费系数列表
   */
  async getShippingFeeFactors(req, res) {
    try {
      const { companyId } = req.params;
      const { page = 1, limit = 20, type } = req.query;
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
      
      let whereClause = 'WHERE sf.logistics_companies_id = $1 AND sf.deleted = FALSE';
      let params = [companyId];
      let paramIndex = 2;
      
      // 类型过滤
      if (type === 'default') {
        whereClause += ' AND sf.tags_id IS NULL AND sf.country_id IS NULL';
      } else if (type === 'tag') {
        whereClause += ' AND sf.tags_id IS NOT NULL AND sf.country_id IS NULL';
      } else if (type === 'country') {
        whereClause += ' AND sf.country_id IS NOT NULL AND sf.tags_id IS NULL';
      }
      
      // 查询列表
      const factorsQuery = `
        SELECT 
          sf.id, sf.guid, sf.logistics_companies_id, sf.tags_id, sf.country_id,
          sf.initial_weight, sf.initial_fee, sf.throw_ratio_coefficient,
          sf.surcharge, sf.surcharge2, sf.other_fee, sf.discount, sf.created_at, sf.updated_at,
          t.value as tag_name,
          c.name as country_name
        FROM shippingfee_factor sf
        LEFT JOIN tags t ON sf.tags_id = t.id
        LEFT JOIN countries c ON sf.country_id = c.id
        ${whereClause}
        ORDER BY sf.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      params.push(limit, offset);
      
      const factorsResult = await query(factorsQuery, params);
      
      // 查询总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM shippingfee_factor sf
        ${whereClause}
      `;
      
      const countResult = await query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.getFirstRow().total);
      
      res.json({
        success: true,
        message: getMessage('LOGISTICS.FETCH_FEE_FACTORS_SUCCESS'),
        data: {
          factors: factorsResult.getRows(),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
      
    } catch (error) {
      console.error('获取运费系数列表失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('LOGISTICS.FETCH_FEE_FACTORS_FAILED')
      });
    }
  }

  /**
   * 创建运费系数
   */
  async createShippingFeeFactor(req, res) {
    try {
      const { companyId } = req.params;
      const {
        tags_id,
        country_id,
        initial_weight = 0,
        initial_fee = 0,
        throw_ratio_coefficient = 1,
        surcharge = 0,
        surcharge2 = 0,
        other_fee = 0,
        discount = 0
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
      
      // 验证数值范围
      if (initial_weight < 0 || initial_fee < 0 || throw_ratio_coefficient <= 0 || 
          surcharge < 0 || surcharge2 < 0 || other_fee < 0 || discount < 0 || discount > 100) {
        return res.status(400).json({
          success: false,
          message: getMessage('LOGISTICS.INVALID_FEE_FACTOR_VALUES')
        });
      }
      
      // 检查是否已存在相同配置
      let existQuery = `
        SELECT id FROM shippingfee_factor
        WHERE logistics_companies_id = $1 AND deleted = FALSE
      `;
      let existParams = [companyId];
      let paramIndex = 2;
      
      if (tags_id) {
        existQuery += ` AND tags_id = $${paramIndex} AND country_id IS NULL`;
        existParams.push(tags_id);
      } else if (country_id) {
        existQuery += ` AND country_id = $${paramIndex} AND tags_id IS NULL`;
        existParams.push(country_id);
      } else {
        existQuery += ' AND tags_id IS NULL AND country_id IS NULL';
      }
      
      const existResult = await query(existQuery, existParams);
      
      if (existResult.getRowCount() > 0) {
        return res.status(400).json({
          success: false,
          message: getMessage('LOGISTICS.FEE_FACTOR_ALREADY_EXISTS')
        });
      }
      
      // 创建运费系数
      const insertQuery = `
        INSERT INTO shippingfee_factor (
          logistics_companies_id, tags_id, country_id,
          initial_weight, initial_fee, throw_ratio_coefficient,
          surcharge, surcharge2, other_fee, discount, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
        RETURNING id, guid, logistics_companies_id, tags_id, country_id,
                  initial_weight, initial_fee, throw_ratio_coefficient,
                  surcharge, surcharge2, other_fee, discount, created_at
      `;
      
      const result = await query(insertQuery, [
        companyId,
        tags_id || null,
        country_id || null,
        initial_weight,
        initial_fee,
        throw_ratio_coefficient,
        surcharge,
        surcharge2,
        other_fee,
        discount,
        userId
      ]);
      
      res.status(201).json({
        success: true,
        message: getMessage('LOGISTICS.FEE_FACTOR_CREATE_SUCCESS'),
        data: result.getFirstRow()
      });
      
    } catch (error) {
      console.error('创建运费系数失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('LOGISTICS.FEE_FACTOR_CREATE_FAILED')
      });
    }
  }

  /**
   * 更新运费系数
   */
  async updateShippingFeeFactor(req, res) {
    try {
      const { companyId, factorId } = req.params;
      const {
        initial_weight,
        initial_fee,
        throw_ratio_coefficient,
        surcharge,
        surcharge2,
        total_fee,
        discount
      } = req.body;
      
      const userId = req.userId;
      
      // 验证运费系数是否存在
      const factorQuery = `
        SELECT id, logistics_companies_id, tags_id, country_id
        FROM shippingfee_factor
        WHERE id = $1 AND logistics_companies_id = $2 AND deleted = FALSE
      `;
      
      const factorResult = await query(factorQuery, [factorId, companyId]);
      
      if (factorResult.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('LOGISTICS.FEE_FACTOR_NOT_FOUND')
        });
      }
      
      // 验证数值范围
      if (initial_weight !== undefined && initial_weight < 0) {
        return res.status(400).json({
          success: false,
          message: getMessage('LOGISTICS.INVALID_FEE_FACTOR_VALUES')
        });
      }
      
      if (initial_fee !== undefined && initial_fee < 0) {
        return res.status(400).json({
          success: false,
          message: getMessage('LOGISTICS.INVALID_FEE_FACTOR_VALUES')
        });
      }
      
      if (throw_ratio_coefficient !== undefined && throw_ratio_coefficient <= 0) {
        return res.status(400).json({
          success: false,
          message: getMessage('LOGISTICS.INVALID_FEE_FACTOR_VALUES')
        });
      }
      
      if (surcharge !== undefined && surcharge < 0) {
        return res.status(400).json({
          success: false,
          message: getMessage('LOGISTICS.INVALID_FEE_FACTOR_VALUES')
        });
      }
      
      if (surcharge2 !== undefined && surcharge2 < 0) {
        return res.status(400).json({
          success: false,
          message: getMessage('LOGISTICS.INVALID_FEE_FACTOR_VALUES')
        });
      }
      
      if (other_fee !== undefined && other_fee < 0) {
        return res.status(400).json({
          success: false,
          message: getMessage('LOGISTICS.INVALID_FEE_FACTOR_VALUES')
        });
      }
      
      if (discount !== undefined && (discount < 0 || discount > 100)) {
        return res.status(400).json({
          success: false,
          message: getMessage('LOGISTICS.INVALID_FEE_FACTOR_VALUES')
        });
      }
      
      // 构建更新字段
      let updateFields = [];
      let updateParams = [];
      let paramIndex = 1;
      
      if (initial_weight !== undefined) {
        updateFields.push(`initial_weight = $${paramIndex}`);
        updateParams.push(initial_weight);
        paramIndex++;
      }
      
      if (initial_fee !== undefined) {
        updateFields.push(`initial_fee = $${paramIndex}`);
        updateParams.push(initial_fee);
        paramIndex++;
      }
      
      if (throw_ratio_coefficient !== undefined) {
        updateFields.push(`throw_ratio_coefficient = $${paramIndex}`);
        updateParams.push(throw_ratio_coefficient);
        paramIndex++;
      }
      
      if (surcharge !== undefined) {
        updateFields.push(`surcharge = $${paramIndex}`);
        updateParams.push(surcharge);
        paramIndex++;
      }
      
      if (surcharge2 !== undefined) {
        updateFields.push(`surcharge2 = $${paramIndex}`);
        updateParams.push(surcharge2);
        paramIndex++;
      }
      
      if (other_fee !== undefined) {
        updateFields.push(`other_fee = $${paramIndex}`);
        updateParams.push(other_fee);
        paramIndex++;
      }
      
      if (discount !== undefined) {
        updateFields.push(`discount = $${paramIndex}`);
        updateParams.push(discount);
        paramIndex++;
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: getMessage('LOGISTICS.NO_FIELDS_TO_UPDATE')
        });
      }
      
      updateFields.push(`updated_by = $${paramIndex}`);
      updateParams.push(userId);
      paramIndex++;
      
      updateParams.push(factorId);
      
      const updateQuery = `
        UPDATE shippingfee_factor
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, guid, logistics_companies_id, tags_id, country_id,
                  initial_weight, initial_fee, throw_ratio_coefficient,
                  surcharge, surcharge2, other_fee, discount, updated_at
      `;
      
      const result = await query(updateQuery, updateParams);
      
      res.json({
        success: true,
        message: getMessage('LOGISTICS.FEE_FACTOR_UPDATE_SUCCESS'),
        data: result.getFirstRow()
      });
      
    } catch (error) {
      console.error('更新运费系数失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('LOGISTICS.FEE_FACTOR_UPDATE_FAILED')
      });
    }
  }

  /**
   * 删除运费系数
   */
  async deleteShippingFeeFactor(req, res) {
    try {
      const { companyId, factorId } = req.params;
      const userId = req.userId;
      
      // 验证运费系数是否存在
      const factorQuery = `
        SELECT id FROM shippingfee_factor
        WHERE id = $1 AND logistics_companies_id = $2 AND deleted = FALSE
      `;
      
      const factorResult = await query(factorQuery, [factorId, companyId]);
      
      if (factorResult.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('LOGISTICS.FEE_FACTOR_NOT_FOUND')
        });
      }
      
      // 软删除运费系数
      const deleteQuery = `
        UPDATE shippingfee_factor
        SET deleted = TRUE, updated_by = $1
        WHERE id = $2
      `;
      
      await query(deleteQuery, [userId, factorId]);
      
      res.json({
        success: true,
        message: getMessage('LOGISTICS.FEE_FACTOR_DELETE_SUCCESS')
      });
      
    } catch (error) {
      console.error('删除运费系数失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('LOGISTICS.FEE_FACTOR_DELETE_FAILED')
      });
    }
  }

  /**
   * 获取运费系数详情
   */
  async getShippingFeeFactorDetail(req, res) {
    try {
      const { companyId, factorId } = req.params;
      
      const factorQuery = `
        SELECT 
          sf.id, sf.guid, sf.logistics_companies_id, sf.tags_id, sf.country_id,
          sf.initial_weight, sf.initial_fee, sf.throw_ratio_coefficient,
          sf.surcharge, sf.surcharge2, sf.other_fee, sf.discount, sf.created_at, sf.updated_at,
          t.name as tag_name,
          c.name as country_name,
          lc.name as company_name
        FROM shippingfee_factor sf
        LEFT JOIN tags t ON sf.tags_id = t.id
        LEFT JOIN countries c ON sf.country_id = c.id
        LEFT JOIN logistics_companies lc ON sf.logistics_companies_id = lc.id
        WHERE sf.id = $1 AND sf.logistics_companies_id = $2 AND sf.deleted = FALSE
      `;
      
      const result = await query(factorQuery, [factorId, companyId]);
      
      if (result.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('LOGISTICS.FEE_FACTOR_NOT_FOUND')
        });
      }
      
      res.json({
        success: true,
        message: getMessage('LOGISTICS.FETCH_FEE_FACTOR_SUCCESS'),
        data: result.getFirstRow()
      });
      
    } catch (error) {
      console.error('获取运费系数详情失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('LOGISTICS.FETCH_FEE_FACTOR_FAILED')
      });
    }
  }
}

module.exports = new LogisticsCompanyController();