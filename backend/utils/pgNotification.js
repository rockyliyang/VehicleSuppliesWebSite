const { Pool } = require('pg');
const EventEmitter = require('events');
const { pool } = require('../db/db');

/**
 * PostgreSQL通知工具类
 * 用于在多实例部署中实现跨实例的实时通知机制
 */
class PgNotificationManager extends EventEmitter {
  constructor() {
    super();
    this.pool = null;
    this.listenerClient = null;
    this.isListening = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // 1秒
    this.isShuttingDown = false; // 添加关闭标志
    this.reconnectTimer = null; // 保存重连定时器引用
  }

  /**
   * 初始化通知管理器
   */
  async initialize() {
    try {
      // 使用现有的数据库连接池
      this.pool = pool;
      
      // 创建专用客户端用于监听通知
      this.listenerClient = await this.pool.connect();
      
      console.log('PostgreSQL notification manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PostgreSQL notification manager:', error);
      throw error;
    }
  }

  /**
   * 开始监听PostgreSQL通知
   */
  async startListening() {
    try {
      // listenerClient已经是连接的客户端，直接使用
      // 监听新消息通知
      await this.listenerClient.query('LISTEN inquiry_new_message');
      
      // 设置通知处理器
      this.listenerClient.on('notification', (msg) => {
        try {
          if (msg.channel === 'inquiry_new_message') {
            const payload = JSON.parse(msg.payload);
            console.log('Received PostgreSQL notification:', payload);
            
            // 触发本地事件，保持与原有代码的兼容性
            this.emit('newMessage', payload);
          }
        } catch (error) {
          console.error('Error processing PostgreSQL notification:', error);
        }
      });

      // 处理连接错误
      this.listenerClient.on('error', (err) => {
        console.error('PostgreSQL listener client error:', err);
        this.handleConnectionError();
      });

      // 处理连接结束
      this.listenerClient.on('end', () => {
        console.log('PostgreSQL listener connection ended');
        this.isListening = false;
        this.handleConnectionError();
      });

      this.isListening = true;
      this.reconnectAttempts = 0;
      console.log('Started listening for PostgreSQL notifications');
      
    } catch (error) {
      console.error('Failed to start listening for PostgreSQL notifications:', error);
      this.handleConnectionError();
    }
  }

  /**
   * 处理连接错误和重连
   */
  async handleConnectionError() {
    // 如果正在关闭，不进行重连
    if (this.isShuttingDown) {
      console.log('Service is shutting down, skipping reconnection.');
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached. Stopping reconnection.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // 指数退避
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    // 保存定时器引用，以便在关闭时清除
    this.reconnectTimer = setTimeout(async () => {
      // 再次检查是否正在关闭
      if (this.isShuttingDown) {
        console.log('Service is shutting down, cancelling reconnection.');
        return;
      }
      
      try {
        await this.startListening();
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.handleConnectionError();
      }
    }, delay);
  }

  /**
   * 发送新消息通知
   * @param {number} inquiryId - 询价ID
   * @param {object} messageData - 消息数据
   */
  async notifyNewMessage(inquiryId, messageData) {
    // 如果正在关闭或连接池已关闭，直接触发本地事件
    if (this.isShuttingDown || !this.pool || this.pool.ended) {
      console.log('Service is shutting down or pool is closed, using local event only');
      this.emit('newMessage', { inquiryId: parseInt(inquiryId), messageData });
      return;
    }

    try {
      const payload = {
        inquiryId: parseInt(inquiryId),
        messageData,
        timestamp: new Date().toISOString(),
        instanceId: process.env.INSTANCE_ID || 'unknown'
      };

      const client = await this.pool.connect();
      try {
        await client.query(
          'SELECT pg_notify($1, $2)',
          ['inquiry_new_message', JSON.stringify(payload)]
        );
        console.log('PostgreSQL notification sent:', { inquiryId, instanceId: payload.instanceId });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Failed to send PostgreSQL notification:', error);
      // 作为备用方案，仍然触发本地事件
      this.emit('newMessage', { inquiryId: parseInt(inquiryId), messageData });
    }
  }

  /**
   * 关闭通知管理器
   */
  async close() {
    try {
      // 设置关闭标志，停止重连尝试
      this.isShuttingDown = true;
      this.isListening = false;
      
      // 清除重连定时器
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      if (this.listenerClient) {
        // 移除事件监听器，避免触发重连
        this.listenerClient.removeAllListeners();
        await this.listenerClient.end();
        this.listenerClient.release();
      }
      
      // 注意：不要关闭共享的连接池，它由db.js管理
      // if (this.pool) {
      //   await this.pool.end();
      // }
      console.log('PostgreSQL notification manager closed');
    } catch (error) {
      console.error('Error closing PostgreSQL notification manager:', error);
    }
  }

  /**
   * 获取连接状态
   */
  getStatus() {
    return {
      isListening: this.isListening,
      reconnectAttempts: this.reconnectAttempts,
      poolConnected: this.pool && !this.pool.ended,
      listenerConnected: this.listenerClient && !this.listenerClient.ended
    };
  }
}

// 创建单例实例
const pgNotificationManager = new PgNotificationManager();

module.exports = pgNotificationManager;