const { query, getConnection } = require('../db/db');
const { getMessage } = require('../config/messages');

/**
 * 订单管理控制器
 * 处理订单查询、物流信息管理等功能
 */
class OrderManagementController {
  
  /**
   * 获取订单列表（根据用户角色）
   * 管理员可以看到所有订单，业务员只能看到自己的用户的订单
   */
  async getOrders(req, res) {
    try {
      const { page = 1, limit = 20, status, search } = req.query;
      const userId = req.userId;
      const userRole = req.userRole;
      
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE o.deleted = FALSE';
      let params = [];
      let paramIndex = 1;
      
      // 根据用户角色过滤订单
      if (userRole !== 'admin') {
        // 业务员只能看到自己的用户的订单
        whereClause += ` AND o.user_id IN (
          SELECT id FROM users WHERE created_by = $${paramIndex} AND deleted = FALSE
        )`;
        params.push(userId);
        paramIndex++;
      }
      
      // 状态过滤
      if (status) {
        whereClause += ` AND o.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      
      // 搜索过滤（订单号、用户名、收货人）
      if (search) {
        whereClause += ` AND (
          o.order_guid::text ILIKE $${paramIndex} OR
          u.username ILIKE $${paramIndex} OR
          o.shipping_name ILIKE $${paramIndex}
        )`;
        params.push(`%${search}%`);
        paramIndex++;
      }
      
      // 查询订单列表
      const ordersQuery = `
        SELECT 
          o.id,
          o.order_guid,
          o.user_id,
          u.username,
          u.email as user_email,
          o.total_amount,
          o.status,
          o.payment_method,
          o.payment_id,
          o.shipping_name,
          o.shipping_phone,
          o.shipping_email,
          o.shipping_address,
          o.shipping_zip_code,
          o.shipping_country,
          o.shipping_state,
          o.shipping_city,
          o.shipping_phone_country_code,
          o.created_at,
          o.updated_at,
          l.id as logistics_id,
          l.logistics_company_id,
          lc.name as logistics_company_name,
          l.shipping_no,
          l.shipping_status,
          l.shipping_name as logistics_shipping_name,
          l.shipping_phone as logistics_shipping_phone,
          l.shipping_email as logistics_shipping_email,
          l.shipping_address as logistics_shipping_address,
          l.shipping_zip_code as logistics_shipping_zip_code,
          l.shipping_country as logistics_shipping_country,
          l.shipping_state as logistics_shipping_state,
          l.shipping_city as logistics_shipping_city,
          l.shipping_phone_country_code as logistics_shipping_phone_country_code,
          l.notes as logistics_notes
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN logistics l ON o.id = l.order_id AND l.deleted = FALSE
        LEFT JOIN logistics_companies lc ON l.logistics_company_id = lc.id AND lc.deleted = FALSE
        ${whereClause}
        ORDER BY o.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      params.push(limit, offset);
      
      const ordersResult = await query(ordersQuery, params);
      
      // 查询总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ${whereClause}
      `;
      
      const countResult = await query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.getFirstRow().total);
      
      // 获取订单项信息
      const orderIds = ordersResult.getRows().map(order => order.id);
      let orderItems = [];
      
      if (orderIds.length > 0) {
        const itemsQuery = `
          SELECT 
            oi.order_id,
            oi.product_id,
            oi.product_code,
            oi.product_name,
            oi.quantity,
            oi.price
          FROM order_items oi
          WHERE oi.order_id = ANY($1) AND oi.deleted = FALSE
          ORDER BY oi.id
        `;
        
        const itemsResult = await query(itemsQuery, [orderIds]);
        orderItems = itemsResult.getRows();
      }
      
      // 组装数据
      const orders = ordersResult.getRows().map(order => ({
        ...order,
        items: orderItems.filter(item => item.order_id === order.id)
      }));
      
      res.json({
        success: true,
        message: getMessage('ORDER.FETCH_SUCCESS'),
        data: {
          orders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
      
    } catch (error) {
      console.error('获取订单列表失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('ORDER.FETCH_FAILED')
      });
    }
  }
  
  /**
   * 获取物流公司列表
   */
  async getLogisticsCompanies(req, res) {
    try {
      const sql = `
        SELECT id, name, description, contact_phone, contact_email, website
        FROM logistics_companies
        WHERE deleted = FALSE AND is_active = TRUE
        ORDER BY name
      `;
      
      const result = await query(sql);
      
      res.json({
        success: true,
        message: getMessage('LOGISTICS.FETCH_COMPANIES_SUCCESS'),
        data: result.getRows()
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
   * 更新订单物流信息
   */
  async updateOrderLogistics(req, res) {
    try {
      const { orderId } = req.params;
      const {
        logistics_company_id,
        shipping_no,
        shipping_name,
        shipping_phone,
        shipping_email,
        shipping_address,
        shipping_zip_code,
        shipping_country,
        shipping_state,
        shipping_city,
        shipping_phone_country_code,
        shipping_status,
        notes
      } = req.body;
      
      const userId = req.userId;
      const userRole = req.userRole;
      
      // 验证订单是否存在且有权限操作
      let orderCheckQuery = `
        SELECT id, status, user_id
        FROM orders
        WHERE id = $1 AND deleted = FALSE
      `;
      let orderCheckParams = [orderId];
      
      // 业务员只能操作自己用户的订单
      if (userRole !== 'admin') {
        orderCheckQuery += ` AND user_id IN (
          SELECT id FROM users WHERE created_by = $2 AND deleted = FALSE
        )`;
        orderCheckParams.push(userId);
      }
      
      const orderResult = await query(orderCheckQuery, orderCheckParams);
      
      if (orderResult.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('ORDER.NOT_FOUND_OR_NO_PERMISSION')
        });
      }
      
      const order = orderResult.getFirstRow();
      
      const connection = await getConnection();
      await connection.beginTransaction();
      
      try {
        // 检查是否已存在物流信息
        const existingLogisticsQuery = `
          SELECT id FROM logistics
          WHERE order_id = $1 AND deleted = FALSE
        `;
        
        const existingResult = await connection.query(existingLogisticsQuery, [orderId]);
        
        if (existingResult.getRowCount() > 0) {
          // 更新现有物流信息
          const updateQuery = `
            UPDATE logistics SET
              logistics_company_id = $1,
              shipping_no = $2,
              shipping_name = $3,
              shipping_phone = $4,
              shipping_email = $5,
              shipping_address = $6,
              shipping_zip_code = $7,
              shipping_country = $8,
              shipping_state = $9,
              shipping_city = $10,
              shipping_phone_country_code = $11,
              shipping_status = $12,
              notes = $13,
              updated_at = CURRENT_TIMESTAMP,
              updated_by = $14
            WHERE order_id = $15 AND deleted = FALSE
          `;
          
          await connection.query(updateQuery, [
            logistics_company_id,
            shipping_no,
            shipping_name,
            shipping_phone,
            shipping_email,
            shipping_address,
            shipping_zip_code,
            shipping_country,
            shipping_state,
            shipping_city,
            shipping_phone_country_code,
            shipping_status,
            notes,
            userId,
            orderId
          ]);
        } else {
          // 创建新的物流信息
          const insertQuery = `
            INSERT INTO logistics (
              order_id, logistics_company_id, shipping_no, shipping_name,
              shipping_phone, shipping_email, shipping_address, shipping_zip_code,
              shipping_country, shipping_state, shipping_city, shipping_phone_country_code,
              shipping_status, notes, created_by, updated_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $15)
          `;
          
          await connection.query(insertQuery, [
            orderId,
            logistics_company_id,
            shipping_no,
            shipping_name,
            shipping_phone,
            shipping_email,
            shipping_address,
            shipping_zip_code,
            shipping_country,
            shipping_state,
            shipping_city,
            shipping_phone_country_code,
            shipping_status,
            notes,
            userId
          ]);
        }
        
        // 根据物流信息更新订单状态
        let newOrderStatus = order.status;
        
        // 当填入物流单号后，订单状态变成shipped
        if (shipping_no && shipping_no.trim() !== '' && order.status !== 'shipped' && order.status !== 'delivered') {
          newOrderStatus = 'shipped';
        }
        
        // 当物流状态变成delivered后，订单状态变成delivered
        if (shipping_status === 'delivered') {
          newOrderStatus = 'delivered';
        }
        
        if (newOrderStatus !== order.status) {
          const updateOrderQuery = `
            UPDATE orders SET
              status = $1,
              updated_at = CURRENT_TIMESTAMP,
              updated_by = $2
            WHERE id = $3
          `;
          
          await connection.query(updateOrderQuery, [newOrderStatus, userId, orderId]);
        }
        
        await connection.commit();
        connection.release();
        
        res.json({
          success: true,
          message: getMessage('ORDER.LOGISTICS_UPDATE_SUCCESS'),
          data: {
            order_status: newOrderStatus,
            shipping_status
          }
        });
        
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
      
    } catch (error) {
      console.error('更新订单物流信息失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('ORDER.LOGISTICS_UPDATE_FAILED')
      });
    }
  }
  
  /**
   * 获取订单详情
   */
  async getOrderDetail(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.userId;
      const userRole = req.userRole;
      
      // 构建查询条件
      let whereClause = 'WHERE o.id = $1 AND o.deleted = FALSE';
      let params = [orderId];
      
      // 业务员只能查看自己用户的订单
      if (userRole !== 'admin') {
        whereClause += ` AND o.user_id IN (
          SELECT id FROM users WHERE created_by = $2 AND deleted = FALSE
        )`;
        params.push(userId);
      }
      
      // 查询订单基本信息
      const orderQuery = `
        SELECT 
          o.id,
          o.order_guid,
          o.user_id,
          o.total_amount,
          o.status,
          o.payment_method,
          o.payment_id,
          o.shipping_name,
          o.shipping_phone,
          o.shipping_email,
          o.shipping_address,
          o.shipping_zip_code,
          o.shipping_country,
          o.shipping_state,
          o.shipping_city,
          o.shipping_phone_country_code,
          o.created_at,
          o.updated_at,
          o.created_by,
          o.updated_by,
          o.deleted,
          u.username,
          u.email as user_email,
          l.id as logistics_id,
          l.logistics_company_id,
          lc.name as logistics_company_name,
          l.shipping_no,
          l.shipping_status,
          l.shipping_name as logistics_shipping_name,
          l.shipping_phone as logistics_shipping_phone,
          l.shipping_email as logistics_shipping_email,
          l.shipping_address as logistics_shipping_address,
          l.shipping_zip_code as logistics_shipping_zip_code,
          l.shipping_country as logistics_shipping_country,
          l.shipping_state as logistics_shipping_state,
          l.shipping_city as logistics_shipping_city,
          l.shipping_phone_country_code as logistics_shipping_phone_country_code,
          l.tracking_info,
          l.notes as logistics_notes,
          l.created_at as logistics_created_at,
          l.updated_at as logistics_updated_at
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN logistics l ON o.id = l.order_id AND l.deleted = FALSE
        LEFT JOIN logistics_companies lc ON l.logistics_company_id = lc.id AND lc.deleted = FALSE
        ${whereClause}
      `;
      
      const orderResult = await query(orderQuery, params);
      
      if (orderResult.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('ORDER.NOT_FOUND_OR_NO_PERMISSION')
        });
      }
      
      const order = orderResult.getFirstRow();
      
      // 查询订单项
      const itemsQuery = `
        SELECT 
          oi.*,
          p.name as current_product_name,
          p.product_code as current_product_code
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id AND p.deleted = FALSE
        WHERE oi.order_id = $1 AND oi.deleted = FALSE
        ORDER BY oi.id
      `;
      
      const itemsResult = await query(itemsQuery, [orderId]);
      
      res.json({
        success: true,
        message: getMessage('ORDER.DETAIL_FETCH_SUCCESS'),
        data: {
          ...order,
          items: itemsResult.getRows()
        }
      });
      
    } catch (error) {
      console.error('获取订单详情失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('ORDER.DETAIL_FETCH_FAILED')
      });
    }
  }
}

module.exports = new OrderManagementController();