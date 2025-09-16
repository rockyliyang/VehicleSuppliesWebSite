/**
 * 长轮询路由
 * 提供询价系统的长轮询通信端点
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/jwt');
const { query } = require('../db/db');
const { getMessage } = require('../config/messages');
const pgNotificationManager = require('../utils/pgNotification');

/**
 * 生成带时间戳的日志
 * @param {string} level - 日志级别 (INFO, WARN, ERROR)
 * @param {string} message - 日志消息
 * @param {*} data - 附加数据
 */
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [POLLING-BACKEND-${level}] ${message}`;
  
  if (data) {
    console.log(logMessage, JSON.stringify(data, null, 2));
  } else {
    console.log(logMessage);
  }
}

/**
 * 长轮询询价消息端点
 * GET /api/inquiries/:inquiryId/messages/poll
 */
router.get('/:inquiryId/messages/poll', verifyToken, async (req, res) => {
  const requestStartTime = Date.now();
  // 从请求头获取 requestId，如果没有则生成一个（向后兼容）
  const requestId = req.get('X-Request-ID') || `fallback_${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const userId = req.userId;
    const inquiryId = req.params.inquiryId;
    const { lastMessageId, limit = 50, timeout = 30000 } = req.query; // 默认30秒超时
    
    log('INFO', `Long polling request started`, {
      requestId,
      inquiryId,
      userId,
      lastMessageId: lastMessageId || 'none',
      limit,
      timeout,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
    
    // 验证用户是否有权限访问该询价单
    const inquiryCheckStart = Date.now();
    const inquiryCheck = await query(
      'SELECT id, user_id FROM inquiries WHERE id = $1 AND deleted = false',
      [inquiryId]
    );
    
    // log('INFO', `Inquiry check completed`, {
    //   requestId,
    //   inquiryId,
    //   duration: `${Date.now() - inquiryCheckStart}ms`,
    //   found: inquiryCheck.getRowCount() > 0
    // });
    
    if (inquiryCheck.getRowCount() === 0) {
      // log('WARN', `Inquiry not found`, {
      //   requestId,
      //   inquiryId,
      //   userId
      // });
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.NOT_FOUND')
      });
    }
    
    // 检查权限：用户只能访问自己的询价单，管理员可以访问所有
    const inquiry = inquiryCheck.getFirstRow();
    const userCheckStart = Date.now();
    const userCheck = await query(
      'SELECT user_role FROM users WHERE id = $1',
      [userId]
    );
    
    // log('INFO', `User role check completed`, {
    //   requestId,
    //   inquiryId,
    //   userId,
    //   duration: `${Date.now() - userCheckStart}ms`
    // });
    
    const userRole = userCheck.getFirstRow()?.user_role;
    if (userRole !== 'admin' && inquiry.user_id !== userId) {
      // log('WARN', `Access denied`, {
      //   requestId,
      //   inquiryId,
      //   userId,
      //   userRole,
      //   inquiryOwnerId: inquiry.user_id
      // });
      return res.status(403).json({
        success: false,
        message: getMessage('COMMON.ACCESS_DENIED')
      });
    }
    
    // log('INFO', `Authorization successful`, {
    //   requestId,
    //   inquiryId,
    //   userId,
    //   userRole,
    //   isOwner: inquiry.user_id === userId
    // });
    
    // 长轮询实现：检查是否有新消息
    const checkForNewMessages = async () => {
      const checkStart = Date.now();
      
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
      const result = messages.getRows();
      
      // log('INFO', `Message check completed`, {
      //   requestId,
      //   inquiryId,
      //   duration: `${Date.now() - checkStart}ms`,
      //   lastMessageId: lastMessageId || 'none',
      //   foundMessages: result.length,
      //   messageIds: result.map(m => m.id)
      // });
      
      return result;
    };
    
    // 立即检查一次是否有新消息
    // log('INFO', `Starting immediate message check`, {
    //   requestId,
    //   inquiryId
    // });
    
    let messages = await checkForNewMessages();
    
    // 如果有新消息，立即返回
    if (messages.length > 0) {
      // log('INFO', `Found immediate messages, returning early`, {
      //   requestId,
      //   inquiryId,
      //   messageCount: messages.length,
      //   totalDuration: `${Date.now() - requestStartTime}ms`
      // });
      return await sendResponse(messages);
    }
    
    // log('INFO', `No immediate messages found, starting long poll wait`, {
    //   requestId,
    //   inquiryId,
    //   timeout
    // });
    
    // 没有新消息时，开始事件驱动的长轮询等待
    const startTime = Date.now();
    const maxTimeout = parseInt(timeout);
    
    const pollForMessages = async () => {
      return new Promise(async (resolve) => {
        let resolved = false;
        
        // log('INFO', `Setting up long poll listeners`, {
        //   requestId,
        //   inquiryId,
        //   maxTimeout
        // });
        
        // 设置超时
        const timeoutId = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            cleanup();
            log('INFO', `Long poll timeout reached`, {
              requestId,
              inquiryId,
              duration: `${Date.now() - startTime}ms`,
              maxTimeout
            });
            resolve([]);
          }
        }, maxTimeout);
        
        // 监听新消息事件 - 使用PostgreSQL通知机制
        // 确保PostgreSQL通知管理器已初始化
        if (!pgNotificationManager.getStatus().isListening) {
          try {
            await pgNotificationManager.initialize();
            log('INFO', `PostgreSQL notification manager initialized`, {
              requestId
            });
          } catch (error) {
            log('ERROR', `Failed to initialize PostgreSQL notification manager`, {
              requestId,
              error: error.message
            });
          }
        }
        
        const messageHandler = async (eventData) => {
          
          // log('INFO', `Received message event`, {
          //   resolved,
          //   requestId,
          //   inquiryId,
          //   eventInquiryId: eventData.inquiryId,
          //   isMatch: eventData.inquiryId == inquiryId
          // });
          if (resolved) return;
          
          // 检查是否是当前询价的消息
          if (eventData.inquiryId == inquiryId) {
            try {
              const newMessages = await checkForNewMessages();
              if (newMessages.length > 0 && !resolved) {
                resolved = true;
                cleanup();
                // log('INFO', `Long poll resolved with new messages`, {
                //   requestId,
                //   inquiryId,
                //   messageCount: newMessages.length,
                //   duration: `${Date.now() - startTime}ms`
                // });
                resolve(newMessages);
              } else {
                log('INFO', `Event triggered but no new messages found`, {
                  requestId,
                  inquiryId,
                  messageCount: newMessages.length
                });
              }
            } catch (error) {
              log('ERROR', `Event-driven polling check error`, {
                requestId,
                inquiryId,
                error: error.message,
                stack: error.stack
              });
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
          pgNotificationManager.removeListener('newMessage', messageHandler);
          // log('INFO', `Long poll cleanup completed`, {
          //   requestId,
          //   inquiryId
          // });
        };

        pgNotificationManager.on('newMessage', messageHandler);
        // log('INFO', `Long poll setup newMessage completed`, {
        //   requestId,
        //   inquiryId
        // });
        // 处理请求中断
        req.on('close', () => {
          if (!resolved) {
            resolved = true;
            cleanup();
            // log('INFO', `Long poll request closed by client`, {
            //   requestId,
            //   inquiryId,
            //   duration: `${Date.now() - startTime}ms`
            // });
            resolve([]);
          }
        });
      });
    };
    
    // 等待新消息或超时
    messages = await pollForMessages();
    
    // log('INFO', `Long poll wait completed`, {
    //   requestId,
    //   inquiryId,
    //   messageCount: messages.length,
    //   waitDuration: `${Date.now() - startTime}ms`
    // });
    
    // 发送响应的辅助函数
    async function sendResponse(messages) {
      const responseStart = Date.now();
      
      // log('INFO', `Preparing response`, {
      //   requestId,
      //   inquiryId,
      //   messageCount: messages.length
      // });
      
      // 获取总消息数
      const totalCountStart = Date.now();
      const totalCount = await query(
        'SELECT COUNT(*) as total FROM inquiry_messages WHERE inquiry_id = $1 AND deleted = false',
        [inquiryId]
      );
      
      // log('INFO', `Total count query completed`, {
      //   requestId,
      //   inquiryId,
      //   duration: `${Date.now() - totalCountStart}ms`,
      //   totalCount: parseInt(totalCount.getFirstRow().total)
      // });
      
      // 获取未读消息数（对于当前用户）
      const unreadCountStart = Date.now();
      const unreadCount = await query(
        `SELECT COUNT(*) as unread 
         FROM inquiry_messages 
         WHERE inquiry_id = $1 AND deleted = false AND is_read = 0 
         AND sender_type != $2 AND sender_id != $3`,
        [inquiryId, userRole === 'admin' ? 'admin' : 'user', userId]
      );
      
      // log('INFO', `Unread count query completed`, {
      //   requestId,
      //   inquiryId,
      //   duration: `${Date.now() - unreadCountStart}ms`,
      //   unreadCount: unreadCount.getFirstRow().unread
      // });
      
      const responseData = {
        success: true,
        message: getMessage('INQUIRY.MESSAGES.FETCH.SUCCESS'),
        data: {
          newMessages: messages,
          totalCount: parseInt(totalCount.getFirstRow().total),
          unreadCount: unreadCount.getFirstRow().unread,
          hasNewMessages: messages.length > 0,
          lastMessageId: messages.length > 0 ? messages[messages.length - 1].id : lastMessageId,
          isLongPoll: true
        }
      };
      
      log('INFO', `Sending response`, {
         requestId,
         inquiryId,
         responsePreparationDuration: `${Date.now() - responseStart}ms`,
         totalRequestDuration: `${Date.now() - requestStartTime}ms`,
         hasNewMessages: responseData.data.hasNewMessages,
         newMessagesCount: responseData.data.newMessages.length,
         totalCount: responseData.data.totalCount,
         unreadCount: responseData.data.unreadCount,
         lastMessageId: responseData.data.lastMessageId
      });
      
      return res.json(responseData);
    }
    
    return await sendResponse(messages);
    
  } catch (error) {
    log('ERROR', `Long polling request failed`, {
      requestId: requestId || 'unknown',
      inquiryId: inquiryId || 'unknown',
      userId: userId || 'unknown',
      error: error.message,
      stack: error.stack,
      totalDuration: `${Date.now() - requestStartTime}ms`
    });
    
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
  const requestStartTime = Date.now();
  // 从请求头获取 requestId，如果没有则生成一个（向后兼容）
  const requestId = req.get('X-Request-ID') || `fallback_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const userId = req.userId;
    const inquiryId = req.params.inquiryId;
    const { page = 1, limit = 50, beforeMessageId } = req.query;
    const offset = (page - 1) * limit;
    
    // log('INFO', `History messages request started`, {
    //   requestId,
    //   inquiryId,
    //   userId,
    //   page,
    //   limit,
    //   beforeMessageId,
    //   userAgent: req.get('User-Agent'),
    //   ip: req.ip
    // });
    
    // 验证用户权限
    const inquiryCheckStart = Date.now();
    const inquiryCheck = await query(
      'SELECT id, user_id FROM inquiries WHERE id = $1 AND deleted = false',
      [inquiryId]
    );
    
    log('INFO', `Inquiry existence check completed`, {
      requestId,
      inquiryId,
      duration: `${Date.now() - inquiryCheckStart}ms`,
      found: inquiryCheck.getRowCount() > 0
    });
    
    if (inquiryCheck.getRowCount() === 0) {
      log('WARN', `Inquiry not found`, {
        requestId,
        inquiryId,
        userId
      });
      
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.NOT_FOUND')
      });
    }
    
    const inquiry = inquiryCheck.getFirstRow();
    const userCheckStart = Date.now();
    const userCheck = await query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    log('INFO', `User role check completed`, {
      requestId,
      inquiryId,
      userId,
      duration: `${Date.now() - userCheckStart}ms`
    });
    
    const userRole = userCheck.getFirstRow()?.role;
    const hasAccess = userRole === 'admin' || inquiry.user_id === userId;
    
    // log('INFO', `User authorization check completed`, {
    //   requestId,
    //   inquiryId,
    //   userId,
    //   userRole,
    //   inquiryUserId: inquiry.user_id,
    //   hasAccess
    // });
    
    if (!hasAccess) {
      // log('WARN', `Access denied for user`, {
      //   requestId,
      //   inquiryId,
      //   userId,
      //   userRole,
      //   inquiryUserId: inquiry.user_id
      // });
      
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
    
    // log('INFO', `Fetching message history`, {
    //   requestId,
    //   inquiryId,
    //   page,
    //   limit,
    //   offset,
    //   beforeMessageId
    // });
    
    // 查询历史消息
    const messagesQueryStart = Date.now();
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
    
    // log('INFO', `Messages query completed`, {
    //   requestId,
    //   inquiryId,
    //   duration: `${Date.now() - messagesQueryStart}ms`,
    //   messageCount: messages.getRowCount()
    // });
    
    // 获取总数
    const totalCountQueryStart = Date.now();
    const totalCount = await query(
      'SELECT COUNT(*) as total FROM inquiry_messages WHERE inquiry_id = $1 AND deleted = false',
      [inquiryId]
    );
    
    // log('INFO', `Total count query completed`, {
    //   requestId,
    //   inquiryId,
    //   duration: `${Date.now() - totalCountQueryStart}ms`,
    //   totalCount: totalCount.getFirstRow().total
    // });
    
    const totalPages = Math.ceil(parseInt(totalCount.getFirstRow().total) / limit);
    const hasMore = offset + messages.getRows().length < parseInt(totalCount.getFirstRow().total);
    
    const responseData = {
      success: true,
      message: getMessage('INQUIRY.MESSAGES.FETCH.SUCCESS'),
      data: {
        messages: messages.getRows().reverse(), // 反转顺序，使其按时间正序
        totalCount: parseInt(totalCount.getFirstRow().total),
        currentPage: parseInt(page),
        totalPages,
        hasMore
      }
    };
    
    // log('INFO', `History messages request completed successfully`, {
    //   requestId,
    //   inquiryId,
    //   userId,
    //   totalDuration: `${Date.now() - requestStartTime}ms`,
    //   messageCount: messages.getRowCount(),
    //   totalCount: parseInt(totalCount.getFirstRow().total),
    //   page,
    //   totalPages,
    //   hasMore
    // });
    
    return res.json(responseData);
    
  } catch (error) {
    log('ERROR', `History messages request failed`, {
      requestId: requestId || 'unknown',
      inquiryId: req.params.inquiryId || 'unknown',
      userId: req.userId || 'unknown',
      error: error.message,
      stack: error.stack,
      totalDuration: `${Date.now() - requestStartTime}ms`
    });
    
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
  const requestStartTime = Date.now();
  // 从请求头获取 requestId，如果没有则生成一个（向后兼容）
  const requestId = req.get('X-Request-ID') || `fallback_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const userId = req.userId;
    const inquiryId = req.params.inquiryId;
    const { messageIds } = req.body; // 可选：指定消息ID数组
    
    // log('INFO', `Mark messages as read request started`, {
    //   requestId,
    //   inquiryId,
    //   userId,
    //   messageIds: messageIds || 'all unread',
    //   messageCount: messageIds ? messageIds.length : 'all',
    //   userAgent: req.get('User-Agent'),
    //   ip: req.ip
    // });
    
    // 验证用户权限
    const inquiryCheckStart = Date.now();
    const inquiryCheck = await query(
      'SELECT id, user_id FROM inquiries WHERE id = $1 AND deleted = false',
      [inquiryId]
    );
    
    // log('INFO', `Inquiry existence check completed`, {
    //   requestId,
    //   inquiryId,
    //   duration: `${Date.now() - inquiryCheckStart}ms`,
    //   found: inquiryCheck.getRowCount() > 0
    // });
    
    if (inquiryCheck.getRowCount() === 0) {
      log('WARN', `Inquiry not found`, {
        requestId,
        inquiryId,
        userId
      });
      
      return res.status(404).json({
        success: false,
        message: getMessage('INQUIRY.NOT_FOUND')
      });
    }
    
    const inquiry = inquiryCheck.getFirstRow();
    const userCheckStart = Date.now();
    const userCheck = await query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    log('INFO', `User role check completed`, {
      requestId,
      inquiryId,
      userId,
      duration: `${Date.now() - userCheckStart}ms`
    });
    
    const userRole = userCheck.getFirstRow()?.role;
    const hasAccess = userRole === 'admin' || inquiry.user_id === userId;
    
    log('INFO', `User authorization check completed`, {
      requestId,
      inquiryId,
      userId,
      userRole,
      inquiryUserId: inquiry.user_id,
      hasAccess
    });
    
    if (!hasAccess) {
      log('WARN', `Access denied for user`, {
        requestId,
        inquiryId,
        userId,
        userRole,
        inquiryUserId: inquiry.user_id
      });
      
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
      
      // log('INFO', `Marking specific messages as read`, {
      //   requestId,
      //   inquiryId,
      //   messageIds,
      //   messageCount: messageIds.length
      // });
    } else {
      // 标记所有未读消息为已读（排除自己发送的消息）
      updateQuery = `
        UPDATE inquiry_messages 
        SET is_read = 1, updated_by = $1, updated_at = NOW() 
        WHERE inquiry_id = $2 AND sender_id != $3 AND is_read = 0 AND deleted = false
      `;
      queryParams = [userId, inquiryId, userId];
      
      // log('INFO', `Marking all unread messages as read`, {
      //   requestId,
      //   inquiryId,
      //   userId
      // });
    }
    
    const updateStart = Date.now();
    const result = await query(updateQuery, queryParams);
    const affectedRows = result.getRowCount();
    
    // log('INFO', `Mark as read update completed`, {
    //   requestId,
    //   inquiryId,
    //   duration: `${Date.now() - updateStart}ms`,
    //   affectedRows
    // });
    
    const responseData = {
      success: true,
      message: getMessage('INQUIRY.MESSAGES.MARK_READ.SUCCESS'),
      data: {
        affectedRows
      }
    };
    
    log('INFO', `Mark messages as read request completed successfully`, {
      requestId,
      inquiryId,
      userId,
      totalDuration: `${Date.now() - requestStartTime}ms`,
      affectedRows,
      messageIds: messageIds || 'all unread'
    });
    
    return res.json(responseData);
    
  } catch (error) {
    log('ERROR', `Mark messages as read request failed`, {
      requestId: requestId || 'unknown',
      inquiryId: req.params.inquiryId || 'unknown',
      userId: req.userId || 'unknown',
      error: error.message,
      stack: error.stack,
      totalDuration: `${Date.now() - requestStartTime}ms`
    });
    
    return res.status(500).json({
      success: false,
      message: getMessage('INQUIRY.MESSAGES.MARK_READ.FAILED')
    });
  }
});

module.exports = router;