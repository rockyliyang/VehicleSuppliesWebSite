/**
 * SSE (Server-Sent Events) 处理工具
 * 用于管理询价系统的实时通信连接
 */

const { v4: uuidv4 } = require('uuid');

class SSEHandler {
  constructor() {
    // 存储所有活跃的SSE连接
    // 结构: Map<userId, Set<{res, connectionId, lastEventId}>>
    this.connections = new Map();
    
    // 心跳检测间隔 (30秒)
    this.heartbeatInterval = 30000;
    
    // 启动心跳检测
    this.startHeartbeat();
  }

  /**
   * 添加SSE连接
   * @param {string} userId - 用户ID
   * @param {Object} res - Express响应对象
   * @param {string} lastEventId - 最后事件ID
   * @returns {string} 连接ID
   */
  addConnection(userId, res, lastEventId = null) {
    const connectionId = uuidv4();
    
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    
    const connectionInfo = {
      res,
      connectionId,
      lastEventId,
      connectedAt: new Date(),
      lastHeartbeat: new Date()
    };
    
    this.connections.get(userId).add(connectionInfo);
    
    console.log(`SSE connection added for user ${userId}, connection ${connectionId}`);
    
    // 设置连接关闭处理
    res.on('close', () => {
      this.removeConnection(userId, connectionId);
    });
    
    res.on('error', (error) => {
      console.error(`SSE connection error for user ${userId}:`, error);
      this.removeConnection(userId, connectionId);
    });
    
    return connectionId;
  }

  /**
   * 移除SSE连接
   * @param {string} userId - 用户ID
   * @param {string} connectionId - 连接ID
   */
  removeConnection(userId, connectionId) {
    if (this.connections.has(userId)) {
      const userConnections = this.connections.get(userId);
      
      for (const conn of userConnections) {
        if (conn.connectionId === connectionId) {
          userConnections.delete(conn);
          console.log(`SSE connection removed for user ${userId}, connection ${connectionId}`);
          break;
        }
      }
      
      // 如果用户没有活跃连接，清理用户记录
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
    }
  }

  /**
   * 向特定用户发送消息
   * @param {string} userId - 用户ID
   * @param {Object} data - 消息数据
   * @param {string} eventType - 事件类型
   * @param {string} eventId - 事件ID
   */
  sendToUser(userId, data, eventType = 'message', eventId = null) {
    if (!this.connections.has(userId)) {
      console.log(`No SSE connections found for user ${userId}`);
      return false;
    }
    
    const userConnections = this.connections.get(userId);
    const deadConnections = [];
    let sentCount = 0;
    
    for (const conn of userConnections) {
      try {
        if (conn.res.writableEnded) {
          deadConnections.push(conn);
          continue;
        }
        
        const message = this.formatSSEMessage(data, eventType, eventId);
        conn.res.write(message);
        conn.lastHeartbeat = new Date();
        sentCount++;
        
      } catch (error) {
        console.error(`Failed to send SSE message to user ${userId}:`, error);
        deadConnections.push(conn);
      }
    }
    
    // 清理死连接
    deadConnections.forEach(conn => {
      userConnections.delete(conn);
    });
    
    console.log(`SSE message sent to ${sentCount} connections for user ${userId}`);
    return sentCount > 0;
  }

  /**
   * 向询价相关用户广播消息
   * @param {string} inquiryId - 询价ID
   * @param {Object} data - 消息数据
   * @param {string} eventType - 事件类型
   * @param {Array} userIds - 相关用户ID列表
   */
  broadcastToInquiry(inquiryId, data, eventType = 'inquiry_message', userIds = []) {
    const eventId = uuidv4();
    const messageData = {
      inquiryId,
      timestamp: new Date().toISOString(),
      ...data
    };
    
    let totalSent = 0;
    
    userIds.forEach(userId => {
      const sent = this.sendToUser(userId, messageData, eventType, eventId);
      if (sent) totalSent++;
    });
    
    console.log(`Inquiry ${inquiryId} message broadcasted to ${totalSent} users`);
    return totalSent;
  }

  /**
   * 格式化SSE消息
   * @param {Object} data - 数据
   * @param {string} eventType - 事件类型
   * @param {string} eventId - 事件ID
   * @returns {string} 格式化的SSE消息
   */
  formatSSEMessage(data, eventType, eventId) {
    let message = '';
    
    if (eventId) {
      message += `id: ${eventId}\n`;
    }
    
    if (eventType) {
      message += `event: ${eventType}\n`;
    }
    
    message += `data: ${JSON.stringify(data)}\n\n`;
    
    return message;
  }

  /**
   * 发送心跳消息
   */
  sendHeartbeat() {
    const heartbeatData = {
      type: 'heartbeat',
      timestamp: new Date().toISOString()
    };
    
    for (const [userId, userConnections] of this.connections) {
      this.sendToUser(userId, heartbeatData, 'heartbeat');
    }
  }

  /**
   * 启动心跳检测
   */
  startHeartbeat() {
    setInterval(() => {
      this.sendHeartbeat();
      this.cleanupStaleConnections();
    }, this.heartbeatInterval);
  }

  /**
   * 清理过期连接
   */
  cleanupStaleConnections() {
    const now = new Date();
    const staleThreshold = 60000; // 60秒
    
    for (const [userId, userConnections] of this.connections) {
      const staleConnections = [];
      
      for (const conn of userConnections) {
        if (now - conn.lastHeartbeat > staleThreshold) {
          staleConnections.push(conn);
        }
      }
      
      staleConnections.forEach(conn => {
        console.log(`Removing stale SSE connection for user ${userId}`);
        userConnections.delete(conn);
        
        try {
          if (!conn.res.writableEnded) {
            conn.res.end();
          }
        } catch (error) {
          // 忽略关闭连接时的错误
        }
      });
      
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
    }
  }

  /**
   * 获取连接统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    let totalConnections = 0;
    const userStats = {};
    
    for (const [userId, userConnections] of this.connections) {
      userStats[userId] = userConnections.size;
      totalConnections += userConnections.size;
    }
    
    return {
      totalUsers: this.connections.size,
      totalConnections,
      userStats
    };
  }

  /**
   * 关闭所有连接
   */
  closeAllConnections() {
    for (const [userId, userConnections] of this.connections) {
      for (const conn of userConnections) {
        try {
          if (!conn.res.writableEnded) {
            conn.res.end();
          }
        } catch (error) {
          // 忽略关闭连接时的错误
        }
      }
    }
    
    this.connections.clear();
    console.log('All SSE connections closed');
  }
}

// 创建单例实例
const sseHandler = new SSEHandler();

// 优雅关闭处理
process.on('SIGTERM', () => {
  console.log('Closing SSE connections...');
  sseHandler.closeAllConnections();
});

process.on('SIGINT', () => {
  console.log('Closing SSE connections...');
  sseHandler.closeAllConnections();
});

module.exports = sseHandler;