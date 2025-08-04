const { query } = require('../db/db');
const { getMessage } = require('../config/messages');

class AddressController {
  // 获取用户所有地址
  async getAllAddresses(req, res) {
    try {
      const userId = req.userId;
      
      const addresses = await query(
        'SELECT * FROM user_addresses WHERE user_id = $1 AND deleted = false ORDER BY is_default DESC, created_at DESC',
        [userId]
      );
      
      res.json({
        success: true,
        message: getMessage('COMMON.SUCCESS'),
        data: addresses.getRows()
      });
    } catch (error) {
      console.error('获取地址列表失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('COMMON.SERVER_ERROR'),
        data: null
      });
    }
  }

  // 获取单个地址详情
  async getAddressById(req, res) {
    try {
      const userId = req.userId;
      const addressId = req.params.id;
      
      const addresses = await query(
        'SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2 AND deleted = false',
        [addressId, userId]
      );
      
      if (addresses.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('ADDRESS.NOT_FOUND'),
          data: null
        });
      }
      
      res.json({
        success: true,
        message: getMessage('COMMON.SUCCESS'),
        data: addresses.getFirstRow()
      });
    } catch (error) {
      console.error('获取地址详情失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('COMMON.SERVER_ERROR'),
        data: null
      });
    }
  }

  // 添加新地址
  async createAddress(req, res) {
    try {
      const userId = req.userId;
      const { recipient_name, phone, address, postal_code, is_default, label } = req.body;
      
      // 验证必填字段
      if (!recipient_name || !phone || !address) {
        return res.status(400).json({
          success: false,
          message: getMessage('ADDRESS.REQUIRED_FIELDS'),
          data: null
        });
      }
      
      // 如果设置为默认地址，先将其他地址设为非默认
      if (is_default) {
        await query(
          'UPDATE user_addresses SET is_default = false, updated_by = $1 WHERE user_id = $2 AND deleted = false',
          [userId, userId]
        );
      }
      
      const result = await query(
        'INSERT INTO user_addresses (user_id, recipient_name, phone, address, postal_code, is_default, label, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [userId, recipient_name, phone, address, postal_code || '', is_default || false, label || 'home', userId, userId]
      );
      
      res.status(201).json({
        success: true,
        message: getMessage('ADDRESS.CREATE_SUCCESS'),
        data: result.getFirstRow()
      });
    } catch (error) {
      console.error('添加地址失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('COMMON.SERVER_ERROR'),
        data: null
      });
    }
  }

  // 更新地址
  async updateAddress(req, res) {
    try {
      const userId = req.userId;
      const addressId = req.params.id;
      const { recipient_name, phone, address, postal_code, is_default, label } = req.body;
      
      // 验证地址是否存在且属于当前用户
      const existingAddresses = await query(
        'SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2 AND deleted = false',
        [addressId, userId]
      );
      
      if (existingAddresses.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('ADDRESS.NOT_FOUND'),
          data: null
        });
      }
      
      // 验证必填字段
      if (!recipient_name || !phone || !address) {
        return res.status(400).json({
          success: false,
          message: getMessage('ADDRESS.REQUIRED_FIELDS'),
          data: null
        });
      }
      
      // 如果设置为默认地址，先将其他地址设为非默认
      if (is_default) {
        await query(
          'UPDATE user_addresses SET is_default = false, updated_by = $1 WHERE user_id = $2 AND id != $3 AND deleted = false',
          [userId, userId, addressId]
        );
      }
      
      const result = await query(
        'UPDATE user_addresses SET recipient_name = $1, phone = $2, address = $3, postal_code = $4, is_default = $5, label = $6, updated_by = $7 WHERE id = $8 AND user_id = $9 RETURNING *',
        [recipient_name, phone, address, postal_code || '', is_default || false, label || 'home', userId, addressId, userId]
      );
      
      res.json({
        success: true,
        message: getMessage('ADDRESS.UPDATE_SUCCESS'),
        data: result.getFirstRow()
      });
    } catch (error) {
      console.error('更新地址失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('COMMON.SERVER_ERROR'),
        data: null
      });
    }
  }

  // 删除地址
  async deleteAddress(req, res) {
    try {
      const userId = req.userId;
      const addressId = req.params.id;
      
      // 验证地址是否存在且属于当前用户
      const existingAddresses = await query(
        'SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2 AND deleted = false',
        [addressId, userId]
      );
      
      if (existingAddresses.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('ADDRESS.NOT_FOUND'),
          data: null
        });
      }
      
      // 软删除地址
      await query(
        'UPDATE user_addresses SET deleted = true, updated_by = $1 WHERE id = $2 AND user_id = $3',
        [userId, addressId, userId]
      );
      
      res.json({
        success: true,
        message: getMessage('ADDRESS.DELETE_SUCCESS'),
        data: null
      });
    } catch (error) {
      console.error('删除地址失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('COMMON.SERVER_ERROR'),
        data: null
      });
    }
  }

  // 设置默认地址
  async setDefaultAddress(req, res) {
    try {
      const userId = req.userId;
      const addressId = req.params.id;
      
      // 验证地址是否存在且属于当前用户
      const existingAddresses = await query(
        'SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2 AND deleted = false',
        [addressId, userId]
      );
      
      if (existingAddresses.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('ADDRESS.NOT_FOUND'),
          data: null
        });
      }
      
      // 先将所有地址设为非默认
      await query(
        'UPDATE user_addresses SET is_default = false, updated_by = $1 WHERE user_id = $2 AND deleted = false',
        [userId, userId]
      );
      
      // 设置指定地址为默认
      const result = await query(
        'UPDATE user_addresses SET is_default = true, updated_by = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
        [userId, addressId, userId]
      );
      
      res.json({
        success: true,
        message: getMessage('ADDRESS.SET_DEFAULT_SUCCESS'),
        data: result.getFirstRow()
      });
    } catch (error) {
      console.error('设置默认地址失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('COMMON.SERVER_ERROR'),
        data: null
      });
    }
  }
}

module.exports = new AddressController();