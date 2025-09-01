/**
 * 管理员用户工具函数
 * 提供管理员相关的用户查询功能
 */

const { query } = require('../db/db');

/**
 * 获取管理员管理的用户ID列表
 * @param {number} adminUserId - 管理员用户ID
 * @returns {Promise<Array>} 返回用户ID数组
 */
exports.getManagedUserIds = async (adminUserId) => {
  try {
    // 首先查询当前用户所属的业务组
    const businessGroupQuery = `
      SELECT DISTINCT ubg.business_group_id 
      FROM user_business_groups ubg 
      WHERE ubg.user_id = $1 AND ubg.deleted = false
    `;
    const businessGroups = await query(businessGroupQuery, [adminUserId]);
    
    if (businessGroups.getRowCount() === 0) {
      return [];
    }
    
    // 获取业务组ID列表
    const businessGroupIds = businessGroups.getRows().map(bg => bg.business_group_id);
    
    // 查询属于这些业务组的所有用户
    const usersInGroupQuery = `
      SELECT DISTINCT u.id 
      FROM users u 
      WHERE u.business_group_id IN (${businessGroupIds.map((_, index) => `$${index + 1}`).join(',')}) 
      AND u.deleted = false
    `;
    const usersInGroup = await query(usersInGroupQuery, businessGroupIds);
    
    if (usersInGroup.getRowCount() === 0) {
      return [];
    }
    
    // 返回用户ID数组
    return usersInGroup.getRows().map(user => user.id);
  } catch (error) {
    console.error('获取管理用户ID列表失败:', error);
    throw error;
  }
};

/**
 * 生成用户ID的SQL IN子句参数
 * @param {Array} userIds - 用户ID数组
 * @returns {Object} 返回包含占位符字符串和参数数组的对象
 */
exports.generateUserIdsPlaceholders = (userIds) => {
  if (!userIds || userIds.length === 0) {
    // 当没有用户ID时，返回一个永远不匹配的条件
    return {
      placeholders: '-1',
      params: []
    };
  }
  
  const placeholders = userIds.map((_, index) => `$${index + 1}`).join(',');
  return {
    placeholders,
    params: userIds
  };
};