/**
 * 询价系统长轮询实时通信工具
 * 基于HTTP长轮询实现实时消息推送
 */

class InquiryPolling {
  constructor() {
    this.pollingConnections = new Map() // 存储每个询价单的长轮询连接状态
    this.listeners = new Map() // 事件监听器
    this.retryCounts = new Map() // 存储每个询价单的重试计数
    this.isPolling = false // 全局轮询状态
    this.longPollTimeout = 30000 // 长轮询超时时间（毫秒）
    this.maxRetries = 3 // 最大重试次数
    this.retryDelay = 2000 // 重试延迟（毫秒）
    this.lastMessageIds = new Map() // 存储每个询价单的最后消息ID
    this.apiInstance = null // API实例
  }

  /**
   * 设置API实例
   * @param {Object} apiInstance - Vue组件的$api实例
   */
  setApiInstance(apiInstance) {
    this.apiInstance = apiInstance
  }

  /**
   * 从cookie中获取认证token
   * @param {string} name - cookie名称
   * @returns {string|null} token值
   */
  getTokenFromCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  /**
   * 获取当前用户的认证token
   * @returns {string|null} token值
   */
  getAuthToken() {
    return this.getTokenFromCookie('aex-token');
  }

  /**
   * 开始长轮询指定询价单
   * @param {string|number} inquiryId - 询价单ID
   */
  async startPolling(inquiryId) {
    if (this.pollingConnections.has(inquiryId)) {
      console.warn(`Long polling already started for inquiry ${inquiryId}`)
      return
    }

    console.log(`Starting long polling for inquiry ${inquiryId}`)
    
    // 初始化状态
    this.retryCounts.set(inquiryId, 0)
    this.pollingConnections.set(inquiryId, { active: true })
    
    // 开始长轮询循环
    this.longPollLoop(inquiryId)
  }

  /**
   * 长轮询循环
   * @param {string|number} inquiryId - 询价单ID
   */
  async longPollLoop(inquiryId) {
    const connection = this.pollingConnections.get(inquiryId)
    if (!connection || !connection.active) {
      return
    }

    try {
      // 执行长轮询请求
      await this.fetchMessages(inquiryId)
      
      // 重置重试计数
      this.retryCounts.set(inquiryId, 0)
      
      // 立即开始下一次长轮询
      setTimeout(() => this.longPollLoop(inquiryId), 100)
      
    } catch (error) {
      console.error(`Long polling error for inquiry ${inquiryId}:`, error)
      
      const currentRetries = this.retryCounts.get(inquiryId) || 0
      this.retryCounts.set(inquiryId, currentRetries + 1)
      
      if (currentRetries + 1 >= this.maxRetries) {
        console.error(`Max retries reached for inquiry ${inquiryId}, stopping long polling`)
        this.stopPolling(inquiryId)
        this.emit('polling_error', { inquiryId, error })
        return
      }
      
      // 重试延迟后继续
      setTimeout(() => this.longPollLoop(inquiryId), this.retryDelay)
    }
  }

  /**
   * 停止长轮询指定询价单
   * @param {string|number} inquiryId - 询价单ID
   */
  stopPolling(inquiryId) {
    const connection = this.pollingConnections.get(inquiryId)
    if (connection) {
      connection.active = false
      this.pollingConnections.delete(inquiryId)
      this.retryCounts.delete(inquiryId) // 清理重试计数
      this.lastMessageIds.delete(inquiryId) // 清理最后消息ID
      console.log(`Stopped long polling for inquiry ${inquiryId}`)
    }
  }

  /**
   * 停止所有长轮询
   */
  stopAllPolling() {
    this.pollingConnections.forEach((connection, inquiryId) => {
      connection.active = false
      console.log(`Stopped long polling for inquiry ${inquiryId}`)
    })
    this.pollingConnections.clear()
    this.retryCounts.clear() // 清理所有重试计数
    this.lastMessageIds.clear() // 清理所有最后消息ID
    this.isPolling = false
  }

  /**
   * 获取询价单消息（长轮询）
   * @param {string|number} inquiryId - 询价单ID
   */
  async fetchMessages(inquiryId) {
    try {
      // 构建请求URL，包含长轮询参数
      const lastMessageId = this.lastMessageIds.get(inquiryId) || 0
      const url = `/inquiries/${inquiryId}/messages/poll?timeout=${this.longPollTimeout}&lastMessageId=${lastMessageId}`

      let data
      if (this.apiInstance) {
        // 使用$api实例，设置超时时间比长轮询超时时间长5秒
        data = await this.apiInstance.getWithErrorHandler(url, {
          fallbackKey: 'inquiry.polling.error.fetchMessagesFailed',
          timeout: this.longPollTimeout + 5000 // 35秒超时，比长轮询30秒多5秒
        })
      } else {
        // 降级到fetch（向后兼容）
        const token = this.getAuthToken()
        if (!token) {
          throw new Error('未找到身份验证令牌')
        }

        const response = await fetch(`/api${url}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        data = await response.json()
      }
      
      if (data.success && data.data.hasNewMessages) {
        // 更新最后消息ID
        this.lastMessageIds.set(inquiryId, data.data.lastMessageId)
        
        // 触发新消息事件
        this.emit('new_messages', {
          inquiryId,
          messages: data.data.newMessages,
          totalCount: data.data.totalCount,
          unreadCount: data.data.unreadCount
        })
      }
      
      return data
    } catch (error) {
      console.error('长轮询获取询价消息失败:', error)
      throw error
    }
  }

  /**
   * 添加事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in polling event listener for ${event}:`, error)
        }
      })
    }
  }

  /**
   * 检查是否正在轮询指定询价单
   * @param {string|number} inquiryId - 询价单ID
   * @returns {boolean}
   */
  isPollingInquiry(inquiryId) {
    return this.pollingConnections.has(inquiryId)
  }

  /**
   * 获取当前轮询的询价单数量
   * @returns {number}
   */
  getPollingCount() {
    return this.pollingConnections.size
  }

  /**
   * 设置轮询间隔
   * @param {number} delay - 轮询间隔（毫秒）
   */
  setPollingDelay(delay) {
    this.pollingDelay = delay
  }
}

// 创建单例实例
const inquiryPolling = new InquiryPolling()

export default inquiryPolling