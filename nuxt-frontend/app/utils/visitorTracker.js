/**
 * 访问记录收集工具
 * 用于收集用户访问网站的信息并发送到后端
 */
import api from './api'

class VisitorTracker {
  constructor() {
    this.sessionId = this.generateSessionId()
    this.isNewVisitor = this.checkIfNewVisitor()
    this.siteStartTime = Date.now() // 网站访问开始时间
    this.lastActivityTime = Date.now()
    this.isPageVisible = true
    this.hasInteracted = false
    this.hasRecordedEntry = false // 是否已记录进入网站
    
    // 绑定事件监听器
    this.bindEvents()
    
    // 定期更新活动时间
    this.startActivityTracking()
  }
  
  /**
   * 生成会话ID
   */
  generateSessionId() {
    // 检查是否已有会话ID
    let sessionId = sessionStorage.getItem('visitor_session_id')
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      sessionStorage.setItem('visitor_session_id', sessionId)
    }
    return sessionId
  }
  
  /**
   * 检查是否为新访客
   */
  checkIfNewVisitor() {
    const hasVisited = localStorage.getItem('has_visited')
    if (!hasVisited) {
      localStorage.setItem('has_visited', 'true')
      return true
    }
    return false
  }
  
  /**
   * 获取设备信息
   */
  getDeviceInfo() {
    const userAgent = navigator.userAgent
    let deviceType = 'desktop'
    let browser = 'unknown'
    let operatingSystem = 'unknown'
    
    // 检测设备类型
    if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      if (/iPad/i.test(userAgent)) {
        deviceType = 'tablet'
      } else {
        deviceType = 'mobile'
      }
    }
    
    // 检测浏览器
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browser = 'Chrome'
    } else if (userAgent.includes('Firefox')) {
      browser = 'Firefox'
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browser = 'Safari'
    } else if (userAgent.includes('Edg')) {
      browser = 'Edge'
    } else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
      browser = 'Internet Explorer'
    }
    
    // 检测操作系统
    if (userAgent.includes('Windows')) {
      operatingSystem = 'Windows'
    } else if (userAgent.includes('Mac')) {
      operatingSystem = 'macOS'
    } else if (userAgent.includes('Linux')) {
      operatingSystem = 'Linux'
    } else if (userAgent.includes('Android')) {
      operatingSystem = 'Android'
    } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      operatingSystem = 'iOS'
    }
    
    return {
      deviceType,
      browser,
      operatingSystem,
      userAgent
    }
  }
  
  /**
   * 获取屏幕分辨率
   */
  getScreenResolution() {
    return `${screen.width}x${screen.height}`
  }
  
  /**
   * 获取时区
   */
  getTimezone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch (e) {
      return 'UTC'
    }
  }
  
  /**
   * 获取IP地址和地理位置信息（通过后端获取）
   */
  async getLocationInfo() {
    // 这里可以调用后端接口获取IP和地理位置信息
    // 暂时返回空值，由后端根据请求IP获取
    return {
      ip: null,
      country: null,
      region: null,
      city: null
    }
  }

  /**
   * 获取访问者IP地址
   */
  async getVisitorIP() {
    // 在实际应用中，IP地址通常由后端从请求头中获取
    // 这里返回一个占位符，后端会从req.ip或req.connection.remoteAddress获取真实IP
    return 'auto-detect'
  }
  
  /**
   * 绑定事件监听器
   */
  bindEvents() {
    // 页面可见性变化
    document.addEventListener('visibilitychange', () => {
      this.isPageVisible = !document.hidden
      if (this.isPageVisible) {
        this.lastActivityTime = Date.now()
      } else if (document.hidden && this.hasRecordedEntry) {
        // 页面隐藏时发送数据（移动端兼容）
        this.sendSiteExitLog()
      }
    })
    
    // 用户交互事件
    const interactionEvents = ['click', 'scroll', 'keydown', 'mousemove', 'touchstart']
    interactionEvents.forEach(event => {
      document.addEventListener(event, () => {
        this.hasInteracted = true
        this.lastActivityTime = Date.now()
      }, { passive: true, once: false })
    })
    
    // 页面卸载前发送数据（记录离开网站）
    window.addEventListener('beforeunload', () => {
      // 只有已记录进入的情况下才记录离开
      if (!this.hasRecordedEntry) {
        return
      }
      
      const duration = Date.now() - this.siteStartTime; // 整个网站访问时长
      const isBounce = duration < 30000 && !this.hasInteracted; // 30秒内且无交互视为跳出
      
      // 使用 navigator.sendBeacon 确保数据能够发送
      const updateData = {
        sessionId: this.sessionId,
        pageUrl: window.location.pathname + window.location.search,
        duration: Math.round(duration / 1000),
        isBounce
      };
      
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(updateData)], { type: 'application/json' })
        navigator.sendBeacon('/api/visitor-logs/duration', blob)
      } else {
        this.sendSiteExitLog()
      }
    })
  }
  
  /**
   * 开始活动跟踪
   */
  startActivityTracking() {
    // 每30秒检查一次用户活动
    setInterval(() => {
      const now = Date.now()
      const inactiveTime = now - this.lastActivityTime
      
      // 如果超过5分钟无活动，认为用户已离开网站
      if (inactiveTime > 5 * 60 * 1000 && this.hasRecordedEntry) {
        this.sendSiteExitLog()
      }
    }, 30000)
  }
  
  /**
   * 记录网站进入（只在首次访问时调用）
   */
  async trackSiteEntry(route) {
    // 如果已经记录过进入，则不重复记录
    if (this.hasRecordedEntry) {
      return
    }
    
    try {
      const deviceInfo = this.getDeviceInfo()
      const locationInfo = await this.getLocationInfo()
      
      const visitorData = {
        session_id: this.sessionId,
        visitor_ip: await this.getVisitorIP(),
        page_url: route.fullPath,
        page_title: document.title,
        referrer_url: document.referrer || null,
        user_agent: deviceInfo.userAgent,
        device_type: deviceInfo.deviceType,
        browser_name: deviceInfo.browser,
        operating_system: deviceInfo.operatingSystem,
        screen_resolution: this.getScreenResolution(),
        timezone: this.getTimezone(),
        is_new_visitor: this.isNewVisitor,
        ...locationInfo
      }
      
      // 发送访问记录到后端
      await api.postWithErrorHandler('/visitor-logs', visitorData, {
        fallbackKey: 'VISITOR_TRACK_ENTRY_FAILED'
      })
      
      // 标记已记录进入
      this.hasRecordedEntry = true
      this.hasInteracted = false
      
    } catch (error) {
      console.warn('Failed to track site entry:', error)
    }
  }
  
  /**
   * 发送网站离开记录
   */
  async sendSiteExitLog() {
    // 只有已记录进入的情况下才发送离开记录
    if (!this.hasRecordedEntry) {
      return
    }
    
    try {
      const now = Date.now()
      const duration = Math.round((now - this.siteStartTime) / 1000) // 整个网站访问时长（秒）
      const isBounce = !this.hasInteracted && duration < 30 // 30秒内无交互认为是跳出
      
      const updateData = {
        session_id: this.sessionId,
        page_url: window.location.pathname + window.location.search,
        duration: duration,
        is_bounce: isBounce
      }
      
      // 使用 sendBeacon 确保数据能够发送
      if ('fetch' in window) {
        await fetch('/api/visitor-logs/duration', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData),
        keepalive: true  // 关键：页面卸载时保持请求
      })
    } else {
        await api.putWithErrorHandler('/visitor-logs/duration', updateData, {
          fallbackKey: 'VISITOR_TRACK_EXIT_FAILED'
        })
      }
      
    } catch (error) {
      console.warn('Failed to send site exit log:', error)
    }
  }
  
  /**
   * 更新访问记录的停留时间
   */
  async updateVisitorDuration(sessionId, pageUrl, duration, isBounce = false) {
    try {
      await api.putWithErrorHandler('/visitor-logs/duration', {
        session_id: sessionId,
        page_url: pageUrl,
        duration,
        is_bounce: isBounce
      }, {
        fallbackKey: 'VISITOR_DURATION_UPDATE_FAILED'
      });
    } catch (error) {
      console.warn('Error updating visitor duration:', error);
    }
  }
  
  /**
   * 更新访问者信息（如登录后更新用户ID）
   */
  async updateVisitorInfo(updates) {
    try {
      const updateData = {
        session_id: this.sessionId,
        ...updates
      }
      
      await api.putWithErrorHandler('/visitor-logs/info', updateData, {
        fallbackKey: 'VISITOR_INFO_UPDATE_FAILED'
      })
      
      // 如果有用户ID，标记为非新访客
      if (updates.user_id || updates.userId) {
        this.isNewVisitor = false
        localStorage.setItem('visitor_returning', 'true')
      }
    } catch (error) {
      console.warn('Failed to update visitor info:', error)
    }
  }
  
  /**
   * 更新访客信息（如用户登录后）
   */
  updateUserInfo(userId) {
    if (this.sessionId) {
      // 立即更新后端记录
      this.updateVisitorInfo({ user_id: userId });
    }
  }
}

// 创建全局实例
const visitorTracker = new VisitorTracker()

export default visitorTracker