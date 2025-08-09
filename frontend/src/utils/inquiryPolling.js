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
   * 生成唯一的请求ID
   * @returns {string} 请求ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 生成带时间戳的日志
   * @param {string} level - 日志级别 (INFO, WARN, ERROR)
   * @param {string} message - 日志消息
   * @param {*} data - 附加数据
   */
  log(level, message, data = null) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [POLLING-${level}] ${message}`
    
    if (data) {
      console.log(logMessage, data)
    } else {
      console.log(logMessage)
    }
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
   * @param {boolean} forceRestart - 是否强制重启（即使已存在连接）
   */
  async startPolling(inquiryId, forceRestart = false) {
    console.log('InquiryPolling.startPolling 被调用', {
      inquiryId,
      forceRestart,
      hasExistingConnection: this.pollingConnections.has(inquiryId),
      apiInstance: !!this.apiInstance
    });
    
    if (this.pollingConnections.has(inquiryId) && !forceRestart) {
      this.log('WARN', `Long polling already started for inquiry ${inquiryId}`)
      console.warn(`轮询已存在，跳过启动 - inquiry ${inquiryId}`);
      return
    }

    // 如果是强制重启，先停止现有连接
    if (forceRestart && this.pollingConnections.has(inquiryId)) {
      this.log('INFO', `Force restarting polling for inquiry ${inquiryId}`)
      this.stopPolling(inquiryId)
    }

    this.log('INFO', `Starting long polling for inquiry ${inquiryId}`, {
      forceRestart,
      currentConnections: this.pollingConnections.size,
      lastMessageId: this.lastMessageIds.get(inquiryId) || 0
    })
    
    console.log(`正在启动轮询 - inquiry ${inquiryId}`, {
      apiInstance: !!this.apiInstance,
      currentConnections: this.pollingConnections.size
    });
    
    // 初始化状态
    this.retryCounts.set(inquiryId, 0)
    this.pollingConnections.set(inquiryId, { active: true })
    
    // 开始长轮询循环
    this.longPollLoop(inquiryId)
  }

  /**
   * 重置指定询价单的重试计数
   * @param {string|number} inquiryId - 询价单ID
   */
  resetRetryCount(inquiryId) {
    const previousCount = this.retryCounts.get(inquiryId) || 0
    this.retryCounts.set(inquiryId, 0)
    this.log('INFO', `Reset retry count for inquiry ${inquiryId}`, {
      previousRetryCount: previousCount
    })
  }

  /**
   * 长轮询循环
   * @param {string|number} inquiryId - 询价单ID
   */
  async longPollLoop(inquiryId) {
    const connection = this.pollingConnections.get(inquiryId)
    if (!connection || !connection.active) {
      this.log('WARN', `Long poll loop stopped - connection inactive for inquiry ${inquiryId}`)
      console.warn(`长轮询循环停止 - 连接不活跃 inquiry ${inquiryId}`);
      return
    }

    // 为每次请求生成唯一的 requestId
    const requestId = this.generateRequestId()

    this.log('INFO', `Starting long poll request for inquiry ${inquiryId}`, {
      requestId,
      lastMessageId: this.lastMessageIds.get(inquiryId) || 0,
      retryCount: this.retryCounts.get(inquiryId) || 0
    })
    
    console.log(`开始长轮询请求 - inquiry ${inquiryId}`, {
      requestId,
      lastMessageId: this.lastMessageIds.get(inquiryId) || 0,
      apiInstance: !!this.apiInstance
    });

    try {
      // 执行长轮询请求
      const result = await this.fetchMessages(inquiryId, requestId)
      
      this.log('INFO', `Long poll request completed for inquiry ${inquiryId}`, {
        requestId,
        hasNewMessages: result?.data?.hasNewMessages || false,
        newMessagesCount: result?.data?.newMessages?.length || 0
      })
      
      // 重置重试计数
      this.retryCounts.set(inquiryId, 0)
      
      // 立即开始下一次长轮询
      setTimeout(() => this.longPollLoop(inquiryId), 100)
      
    } catch (error) {
      const currentRetries = this.retryCounts.get(inquiryId) || 0
      const newRetryCount = currentRetries + 1
      
      this.log('ERROR', `Long polling error for inquiry ${inquiryId}`, {
        requestId,
        error: error.message,
        errorType: error.name,
        currentRetries,
        newRetryCount,
        maxRetries: this.maxRetries,
        willRetry: newRetryCount < this.maxRetries
      })
      
      this.retryCounts.set(inquiryId, newRetryCount)
      
      if (newRetryCount >= this.maxRetries) {
        this.log('ERROR', `Max retries reached for inquiry ${inquiryId}, stopping long polling`, {
          requestId,
          finalRetryCount: newRetryCount,
          maxRetries: this.maxRetries
        })
        this.stopPolling(inquiryId)
        this.emit('polling_error', { inquiryId, error })
        return
      }
      
      this.log('INFO', `Retrying long poll for inquiry ${inquiryId} in ${this.retryDelay}ms`, {
        requestId,
        retryCount: newRetryCount,
        retryDelay: this.retryDelay
      })
      
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
      const retryCount = this.retryCounts.get(inquiryId) || 0
      const lastMessageId = this.lastMessageIds.get(inquiryId) || 0
      
      connection.active = false
      this.pollingConnections.delete(inquiryId)
      this.retryCounts.delete(inquiryId) // 清理重试计数
      this.lastMessageIds.delete(inquiryId) // 清理最后消息ID
      
      this.log('INFO', `Stopped long polling for inquiry ${inquiryId}`, {
        finalRetryCount: retryCount,
        lastMessageId,
        remainingConnections: this.pollingConnections.size
      })
    } else {
      this.log('WARN', `Attempted to stop polling for inquiry ${inquiryId} but no active connection found`)
    }
  }

  /**
   * 停止所有长轮询
   */
  stopAllPolling() {
    const connectionCount = this.pollingConnections.size
    this.log('INFO', `Stopping all long polling connections`, {
      totalConnections: connectionCount
    })
    
    this.pollingConnections.forEach((connection, inquiryId) => {
      connection.active = false
      this.log('INFO', `Stopped long polling for inquiry ${inquiryId}`)
    })
    this.pollingConnections.clear()
    this.retryCounts.clear() // 清理所有重试计数
    this.lastMessageIds.clear() // 清理所有最后消息ID
    this.isPolling = false
    
    this.log('INFO', `All long polling connections stopped`, {
      stoppedConnections: connectionCount
    })
  }

  /**
   * 获取询价单消息（长轮询）
   * @param {string|number} inquiryId - 询价单ID
   * @param {string} requestId - 请求ID
   */
  async fetchMessages(inquiryId, requestId) {
    const startTime = Date.now()
    const lastMessageId = this.lastMessageIds.get(inquiryId) || 0
    const url = `/inquiries/${inquiryId}/messages/poll?timeout=${this.longPollTimeout}&lastMessageId=${lastMessageId}`
    
    this.log('INFO', `Starting fetch messages request for inquiry ${inquiryId}`, {
      requestId,
      url,
      lastMessageId,
      timeout: this.longPollTimeout,
      useApiInstance: !!this.apiInstance
    })
    
    try {
      let data
      if (this.apiInstance) {
        // 使用$api实例，设置超时时间比长轮询超时时间长5秒
        this.log('INFO', `Using API instance for fetch messages - inquiry ${inquiryId}`, {
          requestId
        })
        
        // 通过 headers 传递 requestId
        data = await this.apiInstance.getWithErrorHandler(url, {
          fallbackKey: 'inquiry.polling.error.fetchMessagesFailed',
          timeout: this.longPollTimeout + 5000, // 35秒超时，比长轮询30秒多5秒
          headers: {
            'X-Request-ID': requestId
          }
        })
      } else {
        // 降级到fetch（向后兼容）
        this.log('INFO', `Using fetch fallback for messages - inquiry ${inquiryId}`, {
          requestId
        })
        
        const token = this.getAuthToken()
        if (!token) {
          throw new Error('未找到身份验证令牌')
        }

        const response = await fetch(`/api${url}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Request-ID': requestId
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        data = await response.json()
      }
      
      const duration = Date.now() - startTime
      
      this.log('INFO', `Fetch messages completed for inquiry ${inquiryId}`, {
        requestId,
        duration: `${duration}ms`,
        success: data.success,
        hasNewMessages: data.data?.hasNewMessages || false,
        newMessagesCount: data.data?.newMessages?.length || 0,
        totalCount: data.data?.totalCount || 0,
        unreadCount: data.data?.unreadCount || 0,
        newLastMessageId: data.data?.lastMessageId
      })
      
      if (data.success && data.data.hasNewMessages) {
        // 更新最后消息ID
        const oldLastMessageId = this.lastMessageIds.get(inquiryId) || 0
        this.lastMessageIds.set(inquiryId, data.data.lastMessageId)
        
        this.log('INFO', `New messages received for inquiry ${inquiryId}`, {
          requestId,
          oldLastMessageId,
          newLastMessageId: data.data.lastMessageId,
          messagesCount: data.data.newMessages.length
        })
        
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
      const duration = Date.now() - startTime
      this.log('ERROR', `Fetch messages failed for inquiry ${inquiryId}`, {
        requestId,
        duration: `${duration}ms`,
        error: error.message,
        errorType: error.name,
        url,
        lastMessageId
      })
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