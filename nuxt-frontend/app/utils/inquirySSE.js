/**
 * 询价系统SSE实时通信工具
 * 基于Server-Sent Events实现实时消息推送
 */

class InquirySSE {
  constructor() {
    this.eventSource = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.listeners = new Map()
    this.isConnecting = false
    this.lastHeartbeat = null
  }

  /**
   * 连接SSE服务
   * @param {string} userId - 用户ID
   * @param {Object} options - 连接选项
   */
  async connect(userId, options = {}) {
    if (this.isConnecting || this.isConnected()) {
      console.warn('SSE connection already exists or is connecting')
      return
    }

    this.isConnecting = true
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const sseUrl = `${process.env.VUE_APP_API_URL || 'http://localhost:8080'}/api/inquiries/events`
      
      // 构建URL参数
      const url = new URL(sseUrl)
      url.searchParams.append('userId', userId)
      if (options.lastEventId) {
        url.searchParams.append('lastEventId', options.lastEventId)
      }

      // 创建EventSource连接
      this.eventSource = new EventSource(url.toString())

      this.eventSource.onopen = () => {
        console.log('Inquiry SSE connected')
        this.reconnectAttempts = 0
        this.isConnecting = false
        this.emit('connected')
      }

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (error) {
          console.error('Failed to parse SSE message:', error)
        }
      }

      this.eventSource.onerror = (error) => {
        console.error('Inquiry SSE error:', error)
        this.isConnecting = false
        
        if (this.eventSource.readyState === EventSource.CLOSED) {
          console.log('Inquiry SSE disconnected')
          this.emit('disconnected')
          this.attemptReconnect(userId, options)
        }
      }

      // 监听特定事件类型
      this.eventSource.addEventListener('new_message', (event) => {
        const data = JSON.parse(event.data)
        this.emit('new_message', data)
      })

      this.eventSource.addEventListener('price_update', (event) => {
        const data = JSON.parse(event.data)
        this.emit('price_update', data)
      })

      this.eventSource.addEventListener('status_change', (event) => {
        const data = JSON.parse(event.data)
        this.emit('status_change', data)
      })

      this.eventSource.addEventListener('inquiry_update', (event) => {
        const data = JSON.parse(event.data)
        this.emit('inquiry_update', data)
      })

      this.eventSource.addEventListener('heartbeat', () => {
        // 心跳检测 - 保持连接活跃
        console.log('SSE heartbeat received')
        this.lastHeartbeat = new Date()
      })

    } catch (error) {
      console.error('Failed to connect SSE:', error)
      this.isConnecting = false
      throw error
    }
  }

  /**
   * 处理接收到的消息
   * @param {Object} data - 消息数据
   */
  handleMessage(data) {
    const { type, ...payload } = data
    this.emit(type, payload)
  }

  /**
   * 尝试重连
   * @param {string} userId - 用户ID
   * @param {Object} options - 连接选项
   */
  attemptReconnect(userId, options) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached for SSE')
      this.emit('max_reconnect_reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`Attempting to reconnect SSE (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`)
    
    setTimeout(() => {
      this.connect(userId, options)
    }, delay)
  }

  /**
   * 断开SSE连接
   */
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
    this.isConnecting = false
    this.reconnectAttempts = 0
    this.listeners.clear()
    console.log('SSE connection closed')
  }

  /**
   * 获取连接状态
   * @returns {number} 连接状态
   */
  getReadyState() {
    return this.eventSource ? this.eventSource.readyState : EventSource.CLOSED
  }

  /**
   * 检查是否已连接
   * @returns {boolean} 是否已连接
   */
  isConnected() {
    return this.eventSource && this.eventSource.readyState === EventSource.OPEN
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
          console.error(`Error in SSE event listener for ${event}:`, error)
        }
      })
    }
  }
}

// 创建单例实例
const inquirySSE = new InquirySSE()

export default inquirySSE