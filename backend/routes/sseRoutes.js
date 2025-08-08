/**
 * SSE (Server-Sent Events) 路由
 * 提供询价系统的实时通信端点
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/jwt');
const sseHandler = require('../utils/sseHandler');
const { query } = require('../db/db');

/**
 * SSE事件流端点
 * GET /api/inquiries/events
 */
router.get('/events', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { lastEventId } = req.query;
    
    console.log(`SSE connection request from user ${userId}`);
    
    // 设置SSE响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control, Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, OPTIONS'
    });
    
    // 发送初始连接确认
    res.write('data: {"type":"connected","message":"SSE connection established"}\n\n');
    
    // 如果有lastEventId，发送错过的消息
    if (lastEventId) {
      try {
        const missedMessages = await getMissedMessages(userId, lastEventId);
        missedMessages.forEach(message => {
          const eventData = JSON.stringify(message);
          res.write(`id: ${message.eventId}\n`);
          res.write(`event: missed_message\n`);
          res.write(`data: ${eventData}\n\n`);
        });
      } catch (error) {
        console.error('Error sending missed messages:', error);
      }
    }
    
    // 添加到SSE连接管理器
    const connectionId = sseHandler.addConnection(userId, res, lastEventId);
    
    // 连接关闭处理
    req.on('close', () => {
      console.log(`SSE connection closed for user ${userId}`);
      sseHandler.removeConnection(userId, connectionId);
    });
    
    req.on('error', (error) => {
      console.error('SSE connection error:', error);
      sseHandler.removeConnection(userId, connectionId);
    });
    
  } catch (error) {
    console.error('SSE setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to establish SSE connection'
    });
  }
});

/**
 * 获取错过的消息
 * @param {string} userId - 用户ID
 * @param {string} lastEventId - 最后事件ID
 * @returns {Array} 错过的消息列表
 */
async function getMissedMessages(userId, lastEventId) {
  try {
    // 查询用户相关的询价ID
    const userInquiries = await query(
      'SELECT id FROM inquiries WHERE user_id = $1 AND deleted = false',
      [userId]
    );
    
    if (userInquiries.getRowCount() === 0) {
      return [];
    }
    
    const inquiryIds = userInquiries.getRows().map(inquiry => inquiry.id);
    const placeholders = inquiryIds.map((_, index) => `$${index + 2}`).join(',');
    
    // 查询在lastEventId之后的消息
    const queryStr = `
      SELECT 
        im.id,
        im.inquiry_id,
        im.sender_id,
        im.sender_type,
        im.content,
        im.message_type,
        im.created_at,
        u.username as sender_name,
        u.email as sender_email
      FROM inquiry_messages im
      LEFT JOIN users u ON im.sender_id = u.id
      WHERE im.inquiry_id IN (${placeholders})
        AND im.deleted = false
        AND im.id > $1
      ORDER BY im.created_at ASC
      LIMIT 50
    `;
    
    const messages = await query(queryStr, [lastEventId, ...inquiryIds]);
    
    return messages.getRows().map(message => ({
      eventId: message.id,
      type: 'new_message',
      inquiryId: message.inquiry_id,
      senderId: message.sender_id,
      senderType: message.sender_type,
      senderName: message.sender_name || 'Unknown',
      senderEmail: message.sender_email || '',
      content: message.content,
      messageType: message.message_type || 'text',
      timestamp: message.created_at
    }));
    
  } catch (error) {
    console.error('Error getting missed messages:', error);
    return [];
  }
}

/**
 * 获取SSE连接统计信息（仅管理员）
 * GET /api/admin/sse/stats
 */
router.get('/admin/stats', verifyToken, (req, res) => {
  try {
    // 检查管理员权限
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const stats = sseHandler.getStats();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error getting SSE stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get SSE statistics'
    });
  }
});

module.exports = router;