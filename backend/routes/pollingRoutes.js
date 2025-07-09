/**
 * 长轮询路由
 * 提供询价系统的长轮询通信端点
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/jwt');
const { query } = require('../db/db');
const { getMessage } = require('../config/messages');

/**
 * 长轮询询价消息端点
 * GET /api/inquiries/:inquiryId/messages/poll
 */
router.get('/:inquiryId/messages/poll', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const inquiryId = req.params.inquiryId;
    const { lastMessageId, limit = 50, timeout = 30000 } = req.query; // 默认30秒超时
    
    console.log(`Long polling messages for inquiry ${inquiryId} by user ${userId}`);
    
    // 验证用户是否有权限访问该询价单
    const inquiryCheck = await query(
      'SELECT id, user_id FROM inquiries WHERE id = $1 AND deleted = false',
      [inquiryId]
    );
    
    if (inquiryCheck.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.NOT_FOUND')
      });
    }
    
    // 检查权限：用户只能访问自己的询价单，管理员可以访问所有
    const inquiry = inquiryCheck.getFirstRow();
    const userCheck = await query(
      'SELECT user_role FROM users WHERE id = $1',
      [userId]
    );
    
    const userRole = userCheck.getFirstRow()?.user_role;
    if (userRole !== 'admin' && inquiry.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: getMessage('COMMON.ACCESS_DENIED')
      });
    }
    
    // 长轮询实现：检查是否有新消息
    const checkForNewMessages = async () => {
      // 构建查询条件
      let whereClause = 'WHERE im.inquiry_id = $1 AND im.deleted = false';
      let queryParams = [inquiryId];
      
      // 如果提供了lastMessageId，只获取比它更新的消息
      if (lastMessageId) {
        whereClause += ' AND im.id > $2';
        queryParams.push(lastMessageId);
      }
      
      // 查询消息
      const messagesQuery = `
        SELECT 
          im.id,
          im.content as message,
          im.sender_type,
          im.message_type,
          im.is_read,
          im.created_at,
          u.username as sender_name,
          u.email as sender_email
        FROM inquiry_messages im
        LEFT JOIN users u ON im.sender_id = u.id
        ${whereClause}
        ORDER BY im.created_at ASC
        LIMIT $${queryParams.length + 1}
      `;
      
      queryParams.push(parseInt(limit));
      const messages = await query(messagesQuery, queryParams);
      return messages.getRows();
    };
    
    // 立即检查一次是否有新消息
    let messages = await checkForNewMessages();
    
    // 如果有新消息，立即返回
    if (messages.length > 0) {
      return await sendResponse(messages);
    }
    
    // 没有新消息时，开始事件驱动的长轮询等待
    const startTime = Date.now();
    const maxTimeout = parseInt(timeout);
    
    const pollForMessages = async () => {
      return new Promise((resolve) => {
        let resolved = false;
        
        // 设置超时
        const timeoutId = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve([]);
          }
        }, maxTimeout);
        
        // 监听新消息事件
        const EventEmitter = require('events');
        if (!global.inquiryEventEmitter) {
          global.inquiryEventEmitter = new EventEmitter();
        }
        
        const messageHandler = async (eventData) => {
          if (resolved) return;
          
          // 检查是否是当前询价的消息
          if (eventData.inquiryId == inquiryId) {
            try {
              const newMessages = await checkForNewMessages();
              if (newMessages.length > 0 && !resolved) {
                resolved = true;
                cleanup();
                resolve(newMessages);
              }
            } catch (error) {
              console.error('Event-driven polling check error:', error);
              if (!resolved) {
                resolved = true;
                cleanup();
                resolve([]);
              }
            }
          }
        };
        
        const cleanup = () => {
          clearTimeout(timeoutId);
          global.inquiryEventEmitter.removeListener('newMessage', messageHandler);
        };
        
        global.inquiryEventEmitter.on('newMessage', messageHandler);
        
        // 处理请求中断
        req.on('close', () => {
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve([]);
          }
        });
      });
    };
    
    // 等待新消息或超时
    messages = await pollForMessages();
    
    // 发送响应的辅助函数
    async function sendResponse(messages) {
      // 获取总消息数
      const totalCount = await query(
        'SELECT COUNT(*) as total FROM inquiry_messages WHERE inquiry_id = $1 AND deleted = false',
        [inquiryId]
      );
      
      // 获取未读消息数（对于当前用户）
      const unreadCount = await query(
        `SELECT COUNT(*) as unread 
         FROM inquiry_messages 
         WHERE inquiry_id = $1 AND deleted = false AND is_read = 0 
         AND sender_type != $2 AND sender_id != $3`,
        [inquiryId, userRole === 'admin' ? 'admin' : 'user', userId]
      );
      
      return res.json({
        success: true,
        message: getMessage('INQUIRY.MESSAGES.FETCH.SUCCESS'),
        data: {
          newMessages: messages,
          totalCount: totalCount.getFirstRow().total,
          unreadCount: unreadCount.getFirstRow().unread,
          hasNewMessages: messages.length > 0,
          lastMessageId: messages.length > 0 ? messages[messages.length - 1].id : lastMessageId,
          isLongPoll: true
        }
      });
    }
    
    return await sendResponse(messages);
    
  } catch (error) {
    console.error('轮询消息失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('INQUIRY.MESSAGES.FETCH.FAILED')
    });
  }
});

/**
 * 获取询价消息历史记录
 * GET /api/inquiries/:inquiryId/messages/history
 */
router.get('/:inquiryId/messages/history', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const inquiryId = req.params.inquiryId;
    const { page = 1, limit = 50, beforeMessageId } = req.query;
    const offset = (page - 1) * limit;
    
    // 验证用户权限
    const inquiryCheck = await query(
      'SELECT id, user_id FROM inquiries WHERE id = $1 AND deleted = false',
      [inquiryId]
    );
    
    if (inquiryCheck.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.NOT_FOUND')
      });
    }
    
    const inquiry = inquiryCheck.getFirstRow();
    const userCheck = await query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    const userRole = userCheck.getFirstRow()?.role;
    if (userRole !== 'admin' && inquiry.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: getMessage('COMMON.ACCESS_DENIED')
      });
    }
    
    // 构建查询条件
    let whereClause = 'WHERE im.inquiry_id = $1 AND im.deleted = false';
    let queryParams = [inquiryId];
    let paramIndex = 2;
    
    if (beforeMessageId) {
      whereClause += ` AND im.id < $${paramIndex}`;
      queryParams.push(beforeMessageId);
      paramIndex++;
    }
    
    // 查询历史消息
    const messagesQuery = `
      SELECT 
        im.id,
        im.content as message,
        im.sender_type,
        im.message_type,
        im.is_read,
        im.created_at,
        u.username as sender_name,
        u.email as sender_email
      FROM inquiry_messages im
      LEFT JOIN users u ON im.sender_id = u.id
      ${whereClause}
      ORDER BY im.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(parseInt(limit), parseInt(offset));
    const messages = await query(messagesQuery, queryParams);
    
    // 获取总数
    const totalCount = await query(
      'SELECT COUNT(*) as total FROM inquiry_messages WHERE inquiry_id = $1 AND deleted = false',
      [inquiryId]
    );
    
    return res.json({
      success: true,
      message: getMessage('INQUIRY.MESSAGES.FETCH.SUCCESS'),
      data: {
        messages: messages.getRows().reverse(), // 反转顺序，使其按时间正序
        totalCount: totalCount.getFirstRow().total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount.getFirstRow().total / limit),
        hasMore: offset + messages.getRows().length < totalCount.getFirstRow().total
      }
    });
    
  } catch (error) {
    console.error('获取消息历史失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('INQUIRY.MESSAGES.FETCH.FAILED')
    });
  }
});

/**
 * 标记消息为已读
 * PUT /api/inquiries/:inquiryId/messages/mark-read
 */
router.put('/:inquiryId/messages/mark-read', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const inquiryId = req.params.inquiryId;
    const { messageIds } = req.body; // 可选：指定消息ID数组
    
    // 验证用户权限
    const inquiryCheck = await query(
      'SELECT id, user_id FROM inquiries WHERE id = $1 AND deleted = false',
      [inquiryId]
    );
    
    if (inquiryCheck.getRowCount() === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.NOT_FOUND')
      });
    }
    
    const inquiry = inquiryCheck.getFirstRow();
    const userCheck = await query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    const userRole = userCheck.getFirstRow()?.role;
    if (userRole !== 'admin' && inquiry.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: getMessage('COMMON.ACCESS_DENIED')
      });
    }
    
    let updateQuery;
    let queryParams;
    
    if (messageIds && messageIds.length > 0) {
      // 标记指定消息为已读
      const placeholders = messageIds.map((_, index) => `$${index + 3}`).join(',');
      updateQuery = `
        UPDATE inquiry_messages 
        SET is_read = 1, updated_by = $1, updated_at = NOW() 
        WHERE inquiry_id = $2 AND id IN (${placeholders}) AND deleted = false
      `;
      queryParams = [userId, inquiryId, ...messageIds];
    } else {
      // 标记所有未读消息为已读（排除自己发送的消息）
      updateQuery = `
        UPDATE inquiry_messages 
        SET is_read = 1, updated_by = $1, updated_at = NOW() 
        WHERE inquiry_id = $2 AND sender_id != $3 AND is_read = 0 AND deleted = false
      `;
      queryParams = [userId, inquiryId, userId];
    }
    
    const result = await query(updateQuery, queryParams);
    
    return res.json({
      success: true,
      message: getMessage('INQUIRY.MESSAGES.MARK_READ.SUCCESS'),
      data: {
        affectedRows: result.getRowCount()
      }
    });
    
  } catch (error) {
    console.error('标记消息已读失败:', error);
    return res.status(500).json({
      success: false,
      message: getMessage('INQUIRY.MESSAGES.MARK_READ.FAILED')
    });
  }
});

module.exports = router;