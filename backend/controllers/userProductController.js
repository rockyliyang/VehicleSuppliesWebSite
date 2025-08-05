const { getConnection } = require('../db/db');
const { getMessage } = require('../config/messages');

class UserProductController {
  // 添加用户产品关联（收藏或浏览历史）
  async addUserProduct(req, res) {
    const connection = await getConnection();
    try {
      const { product_id, type } = req.body;
      const user_id = req.userId;

      // 验证参数
      if (!product_id || !type) {
        return res.status(400).json({
          success: false,
          message: getMessage('COMMON.MISSING_REQUIRED_FIELDS')
        });
      }

      // 验证type值
      if (!['favorite', 'viewed'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: getMessage('COMMON.INVALID_PARAMETER')
        });
      }

      // 检查产品是否存在
      const productCheck = await connection.query(
        'SELECT id FROM products WHERE id = $1 AND deleted = FALSE',
        [product_id]
      );

      if (productCheck.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('PRODUCT.NOT_FOUND')
        });
      }

      // 检查是否已存在相同记录
      const existingRecord = await connection.query(
        'SELECT id FROM user_products WHERE user_id = $1 AND product_id = $2 AND type = $3 AND deleted = FALSE',
        [user_id, product_id, type]
      );

      if (existingRecord.getRowCount() > 0) {
        // 如果是浏览历史，更新时间戳
        if (type === 'viewed') {
          await connection.query(
            'UPDATE user_products SET updated_at = CURRENT_TIMESTAMP, updated_by = $1 WHERE id = $2',
            [user_id, existingRecord.getFirstRow().id]
          );
        }
        
        return res.json({
          success: true,
          message: getMessage('USER_PRODUCT.ALREADY_EXISTS'),
          data: {
            id: existingRecord.getFirstRow().id
          }
        });
      }

      // 插入新记录
      const result = await connection.query(
        `INSERT INTO user_products (user_id, product_id, type, created_by, updated_by) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id, guid`,
        [user_id, product_id, type, user_id, user_id]
      );

      res.status(201).json({
        success: true,
        message: getMessage('USER_PRODUCT.ADD_SUCCESS'),
        data: {
          id: result.getFirstRow().id,
          guid: result.getFirstRow().guid
        }
      });

    } catch (error) {
      console.error('添加用户产品关联失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('COMMON.SERVER_ERROR')
      });
    } finally {
      connection.release();
    }
  }

  // 获取用户产品列表（收藏或浏览历史）
  async getUserProducts(req, res) {
    const connection = await getConnection();
    try {
      const { type, page = 1, limit = 20 } = req.query;
      const user_id = req.userId;

      // 验证type参数
      if (!type || !['favorite', 'viewed'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: getMessage('COMMON.INVALID_PARAMETER')
        });
      }

      const offset = (page - 1) * limit;

      // 构建查询条件
      let whereClause = 'WHERE up.user_id = $1 AND up.deleted = FALSE AND p.deleted = FALSE';
      let params = [user_id];
      
      if (type) {
        whereClause += ' AND up.type = $2';
        params.push(type);
      }

      // 获取总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM user_products up
        JOIN products p ON up.product_id = p.id
        LEFT JOIN product_categories c ON p.category_id = c.id
        ${whereClause}
      `;
      
      const countResult = await connection.query(countQuery, params);
      const total = parseInt(countResult.getFirstRow().total);

      // 获取数据
      const dataQuery = `
        SELECT 
          up.id,
          up.guid,
          up.type,
          up.created_at,
          p.id as product_id,
          p.guid as product_guid,
          p.name as product_name,
          p.price,
          p.thumbnail_url,
          p.short_description,
          c.name as category_name
        FROM user_products up
        JOIN products p ON up.product_id = p.id
        LEFT JOIN product_categories c ON p.category_id = c.id
        ${whereClause}
        ORDER BY up.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      params.push(limit, offset);
      const result = await connection.query(dataQuery, params);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          items: result.getRows(),
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: total,
            items_per_page: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('获取用户产品列表失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('COMMON.SERVER_ERROR')
      });
    } finally {
      connection.release();
    }
  }

  // 删除用户产品关联
  async deleteUserProduct(req, res) {
    const connection = await getConnection();
    try {
      const { id } = req.params;
      const user_id = req.userId;

      // 检查记录是否存在且属于当前用户
      const checkResult = await connection.query(
        'SELECT id FROM user_products WHERE id = $1 AND user_id = $2 AND deleted = FALSE',
        [id, user_id]
      );

      if (checkResult.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('USER_PRODUCT.NOT_FOUND')
        });
      }

      // 软删除记录
      await connection.query(
        'UPDATE user_products SET deleted = TRUE, updated_at = CURRENT_TIMESTAMP, updated_by = $1 WHERE id = $2',
        [user_id, id]
      );

      res.json({
        success: true,
        message: getMessage('USER_PRODUCT.DELETE_SUCCESS')
      });

    } catch (error) {
      console.error('删除用户产品关联失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('COMMON.SERVER_ERROR')
      });
    } finally {
      connection.release();
    }
  }

  // 批量删除用户产品关联
  async batchDeleteUserProducts(req, res) {
    const connection = await getConnection();
    try {
      const { ids, type } = req.body;
      const user_id = req.userId;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: getMessage('COMMON.MISSING_REQUIRED_FIELDS')
        });
      }

      // 构建查询条件
      let whereClause = 'user_id = $1 AND deleted = FALSE AND id = ANY($2)';
      let params = [user_id, ids];

      if (type && ['favorite', 'viewed'].includes(type)) {
        whereClause += ' AND type = $3';
        params.push(type);
      }

      // 批量软删除
      const result = await connection.query(
        `UPDATE user_products 
         SET deleted = TRUE, updated_at = CURRENT_TIMESTAMP, updated_by = $1 
         WHERE ${whereClause}`,
        params
      );

      res.json({
        success: true,
        message: getMessage('USER_PRODUCT.BATCH_DELETE_SUCCESS'),
        data: {
          deleted_count: result.getRowCount()
        }
      });

    } catch (error) {
      console.error('批量删除用户产品关联失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('COMMON.SERVER_ERROR')
      });
    } finally {
      connection.release();
    }
  }

  // 检查用户是否收藏了某个产品
  async checkUserProduct(req, res) {
    const connection = await getConnection();
    try {
      const { product_id } = req.params;
      const { type = 'favorite' } = req.query;
      const user_id = req.userId;

      if (!['favorite', 'viewed'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: getMessage('COMMON.INVALID_PARAMETER')
        });
      }

      const result = await connection.query(
        'SELECT id FROM user_products WHERE user_id = $1 AND product_id = $2 AND type = $3 AND deleted = FALSE',
        [user_id, product_id, type]
      );

      res.json({
        success: true,
        data: {
          exists: result.getRowCount() > 0,
          id: result.getRowCount() > 0 ? result.getFirstRow().id : null
        }
      });

    } catch (error) {
      console.error('检查用户产品关联失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('COMMON.SERVER_ERROR')
      });
    } finally {
      connection.release();
    }
  }
}

module.exports = new UserProductController();