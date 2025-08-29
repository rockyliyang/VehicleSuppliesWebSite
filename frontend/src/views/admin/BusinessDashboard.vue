<template>
  <div class="business-dashboard">
    <div class="dashboard-header">
      <div class="header-content">
        <div class="header-left">
          <h1>业务员工作台</h1>
          <p>欢迎回来，{{ currentUser?.username || '业务员' }}！</p>
        </div>
        <div class="header-right">
          <el-button type="danger" @click="logout" class="logout-button">
            <el-icon>
              <SwitchButton />
            </el-icon>
            退出登录
          </el-button>
        </div>
      </div>
    </div>

    <!-- 主要功能卡片 -->
    <div class="main-cards">
      <!-- 询价管理卡片 -->
      <div class="main-card inquiry-card" @click="navigateToInquiries">
        <div class="card-header">
          <div class="card-icon inquiry-icon">
            <el-icon>
              <ChatDotRound />
            </el-icon>
          </div>
          <div class="card-title">
            <h2>询价管理</h2>
            <p>管理客户询价单和消息</p>
          </div>
        </div>
        <div class="card-content">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number">{{ inquiryStats.adminUnreadMessages || 0 }}</div>
              <div class="stat-label">管理员未读消息</div>
            </div>
            <div class="stat-item" :class="{ 'flash-highlight': inquiryStats.userUnreadMessages > 0 }">
              <div class="stat-number">{{ inquiryStats.userUnreadMessages || 0 }}</div>
              <div class="stat-label">用户未读消息</div>
              <div v-if="inquiryStats.userUnreadMessages > 0" class="flash-icon">
                <el-icon>
                  <Bell />
                </el-icon>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ inquiryStats.totalAdminMessages || 0 }}</div>
              <div class="stat-label">管理员消息总数</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ inquiryStats.totalUserUnreadMessages || 0 }}</div>
              <div class="stat-label">用户消息总数</div>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <el-button type="primary" size="large">
            <el-icon>
              <ArrowRight />
            </el-icon>
            进入询价管理
          </el-button>
        </div>
      </div>

      <!-- 订单管理卡片 -->
      <div class="main-card order-card" @click="navigateToOrders">
        <div class="card-header">
          <div class="card-icon order-icon">
            <el-icon>
              <ShoppingCart />
            </el-icon>
          </div>
          <div class="card-title">
            <h2>订单管理</h2>
            <p>处理客户订单和物流信息</p>
          </div>
        </div>
        <div class="card-content">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number">{{ orderStats.newOrders || 0 }}</div>
              <div class="stat-label">未付款订单</div>
            </div>
            <div class="stat-item" :class="{ 'orange-border': orderStats.processingOrders > 0 }">
              <div class="stat-number">{{ orderStats.processingOrders || 0 }}</div>
              <div class="stat-label">未发货订单</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ orderStats.shippedOrders || 0 }}</div>
              <div class="stat-label">已发货订单</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ orderStats.totalOrders || 0 }}</div>
              <div class="stat-label">订单总数</div>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <el-button type="success" size="large">
            <el-icon>
              <ArrowRight />
            </el-icon>
            进入订单管理
          </el-button>
        </div>
      </div>
    </div>

    <!-- 快速统计信息 -->
    <div class="quick-stats">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon>
            <Message />
          </el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ quickStats.todayMessages || 0 }}</div>
          <div class="stat-title">今日消息</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon>
            <Document />
          </el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ quickStats.todayInquiries || 0 }}</div>
          <div class="stat-title">今日询价</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon>
            <ShoppingBag />
          </el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ quickStats.todayOrders || 0 }}</div>
          <div class="stat-title">今日订单</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon>
            <ShoppingBag />
          </el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ quickStats.recent7daysOrders || 0 }}</div>
          <div class="stat-title">最近7天订单</div>
        </div>
      </div>
    </div>

    <!-- 最近活动 -->
    <div class="recent-activities">
      <div class="section-header">
        <h3>最近活动</h3>
        <el-button text @click="refreshData">
          <el-icon>
            <Refresh />
          </el-icon>
          刷新
        </el-button>
      </div>
      <div class="activities-content">
        <div class="activity-list">
          <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
            <div class="activity-icon">
              <el-icon v-if="activity.type === 'inquiry'">
                <ChatDotRound />
              </el-icon>
              <el-icon v-else-if="activity.type === 'order'">
                <ShoppingCart />
              </el-icon>
              <el-icon v-else>
                <Bell />
              </el-icon>
            </div>
            <div class="activity-content">
              <div class="activity-title">{{ activity.title }}</div>
              <div class="activity-time">{{ formatTime(activity.createdAt) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { 
  ChatDotRound, 
  ShoppingCart, 
  ArrowRight, 
  Message, 
  Document, 
  ShoppingBag, 
  SwitchButton,
  Refresh, 
  Bell 
} from '@element-plus/icons-vue'
import { mapState } from 'vuex'

export default {
  name: 'BusinessDashboard',
  components: {
    ChatDotRound,
    ShoppingCart,
    ArrowRight,
    Message,
    Document,
    ShoppingBag,
    SwitchButton,
    Refresh,
    Bell
  },
  data() {
    return {
      inquiryStats: {
        adminUnreadMessages: 0,
        userUnreadMessages: 0,
        totalAdminMessages: 0,
        totalUserUnreadMessages: 0
      },
      orderStats: {
        newOrders: 0,
        processingOrders: 0,
        shippedOrders: 0,
        totalOrders: 0
      },
      quickStats: {
        todayMessages: 0,
        todayInquiries: 0,
        todayOrders: 0,
        activeCustomers: 0
      },
      recentActivities: [],
      loading: false,
      refreshTimer: null,
      previousUserUnreadMessages: 0
    }
  },
  computed: {
    ...mapState(['currentUser'])
  },
  created() {
    this.fetchDashboardData()
  },
  mounted() {
    this.startAutoRefresh()
  },
  beforeUnmount() {
    this.stopAutoRefresh()
  },
  methods: {
    async fetchDashboardData(isAutoRefresh = false) {
      if (!isAutoRefresh) {
        this.loading = true
      }
      try {
        // 调用后端API获取业务员工作台数据
        const response = await this.$api.getWithErrorHandler('/admin/stats/business-dashboard')
        
        if (response.success) {
          const data = response.data
          
          // 检查管理员未读消息数是否有变化
          const newUserUnreadMessages = data.messageStats?.user_unread_messages || 0
          console.log(`获取业务员工作台数据成功:, ${response}, 上一次业务员未读消息数: ${this.previousUserUnreadMessages}, 本次业务员未读消息数: ${newUserUnreadMessages}`)
          if (this.previousUserUnreadMessages !== newUserUnreadMessages && newUserUnreadMessages > this.previousUserUnreadMessages) {
            console.log('业务员未读消息数增加:', newUserUnreadMessages)
            this.triggerVibration()
          }
          this.previousUserUnreadMessages =  newUserUnreadMessages
          
          // 根据后端返回的数据结构重新映射
          this.inquiryStats = {
            adminUnreadMessages: data.messageStats?.admin_unread_messages || 0,
            userUnreadMessages: data.messageStats?.user_unread_messages || 0,
            totalAdminMessages: data.messageStats?.admin_messages || 0,
            totalUserUnreadMessages: data.messageStats?.user_messages || 0
          }
          
          this.orderStats = {
            newOrders: data.unpaidOrders || 0,
            processingOrders: data.unshippedOrders || 0,
            shippedOrders: data.shippedOrders || 0,
            totalOrders: data.orders || 0
          }
          
          this.quickStats = {
            todayMessages: data.todayStats?.today_messages || 0,
            todayInquiries: data.todayStats?.today_inquiries || 0,
            todayOrders: data.todayStats?.today_orders || 0,
            recent7daysOrders: data.recent7daysOrders || 0
          }
          
          this.recentActivities = [] // 后端暂未提供此数据
        } else {
          if (!isAutoRefresh) {
            this.$message.error('获取数据失败')
          }
          // 使用空数据作为后备
          this.resetToEmptyData()
        }
      } catch (error) {
        console.error('获取业务员工作台数据失败:', error)
        if (!isAutoRefresh) {
          this.$message.error('网络错误，请稍后重试')
        }
        // 使用空数据作为后备
        this.resetToEmptyData()
      } finally {
        if (!isAutoRefresh) {
          this.loading = false
        }
      }
    },
    resetToEmptyData() {
      // 重置为空数据
      this.inquiryStats = {
        adminUnreadMessages: 0,
        userUnreadMessages: 0,
        totalAdminMessages: 0,
        totalUserUnreadMessages: 0
      }
      this.orderStats = {
        newOrders: 0,
        processingOrders: 0,
        shippedOrders: 0,
        totalOrders: 0
      }
      this.quickStats = {
        todayMessages: 0,
        todayInquiries: 0,
        todayOrders: 0,
        recent7daysOrders: 0
      }
      this.recentActivities = []
    },
    navigateToInquiries() {
      this.$router.push('/business-inquiries')
    },
    navigateToOrders() {
      this.$router.push('/business-orders')
    },
    refreshData() {
      this.fetchDashboardData()
    },
    async logout() {
      try {
        await this.$api.post('/users/logout');
        await this.$store.dispatch('logout')
        this.$message.success('退出登录成功')
        this.$router.push('/business-login')
      } catch (error) {
        console.error('退出登录失败:', error)
        this.$message.error('退出登录失败，请重试')
      }
    },
    formatTime(date) {
      if (!date) return ''
      const now = new Date()
      const diff = now - new Date(date)
      const minutes = Math.floor(diff / (1000 * 60))
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      if (minutes < 60) {
        return `${minutes}分钟前`
      } else if (hours < 24) {
        return `${hours}小时前`
      } else {
        return `${days}天前`
      }
    },
    startAutoRefresh() {
      // 每30秒刷新一次数据
      console.log('startAutoRefresh')
      this.refreshTimer = setInterval(() => {
        console.log('setInterval for fetchData, 30 seconds')
        this.fetchDashboardData(true)
      }, 30000)
    },
    stopAutoRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
        this.refreshTimer = null
      }
    },
    triggerVibration() {
      // 检查是否支持震动API
      if ('vibrate' in navigator) {
        // 震动模式：震动200ms，停止100ms，再震动200ms
        console.log('triggerVibration')
        try {
          navigator.vibrate(200);
        } catch (e) {
          console.error('调用vibrate时发生错误:', e);
        }
      }
      else
      {
        console.log('浏览器不支持震动API')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.business-dashboard {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);

  .dashboard-header {
    margin-bottom: 30px;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-left {
      h1 {
        font-size: 28px;
        color: #303133;
        margin: 0 0 8px 0;
      }

      p {
        color: #909399;
        margin: 0;
        font-size: 16px;
      }
    }

    .header-right {
      .logout-button {
        height: 40px;
        font-size: 14px;
      }
    }
  }

  .main-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-bottom: 30px;

    .main-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      }

      &.inquiry-card {
        &:hover {
          border-color: #409eff;
        }

        .card-icon {
          background: linear-gradient(135deg, #409eff, #66b3ff);
        }
      }

      &.order-card {
        &:hover {
          border-color: #67c23a;
        }

        .card-icon {
          background: linear-gradient(135deg, #67c23a, #85ce61);
        }
      }

      .card-header {
        display: flex;
        align-items: center;
        margin-bottom: 20px;

        .card-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          color: white;
          font-size: 24px;
        }

        .card-title {
          h2 {
            font-size: 20px;
            color: #303133;
            margin: 0 0 4px 0;
          }

          p {
            color: #909399;
            margin: 0;
            font-size: 14px;
          }
        }
      }

      .card-content {
        margin-bottom: 24px;

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;

          .stat-item {
            text-align: center;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 8px;
            position: relative;
            transition: all 0.3s ease;

            &.flash-highlight {
              animation: flashBorder 1s infinite;
              background: linear-gradient(135deg, #fff2e6, #ffecd1);
              border: 2px solid #ff9500;
            }

            &.orange-border {
              border: 2px solid #ff9500;
              background: linear-gradient(135deg, #fff2e6, #ffecd1);
            }

            .stat-number {
              font-size: 24px;
              font-weight: bold;
              color: #303133;
              margin-bottom: 4px;
            }

            .stat-label {
              font-size: 12px;
              color: #909399;
            }

            .flash-icon {
              position: absolute;
              top: 4px;
              right: 4px;
              color: #ff9500;
              font-size: 16px;
              animation: flashIcon 0.8s infinite;
            }
          }
        }
      }

      .card-footer {
        text-align: center;

        .el-button {
          width: 100%;
          height: 44px;
          font-size: 16px;
        }
      }
    }
  }

  .quick-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 30px;

    .stat-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease;

      &:hover {
        transform: translateY(-2px);
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        background: linear-gradient(135deg, #e6f7ff, #bae7ff);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
        color: #1890ff;
        font-size: 20px;
      }

      .stat-info {
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #303133;
          margin-bottom: 4px;
        }

        .stat-title {
          font-size: 14px;
          color: #909399;
        }
      }
    }
  }

  .recent-activities {
    background: white;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h3 {
        font-size: 18px;
        color: #303133;
        margin: 0;
      }
    }

    .activities-content {
      .activity-list {
        .activity-item {
          display: flex;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;

          &:last-child {
            border-bottom: none;
          }

          .activity-icon {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #f0f9ff;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            color: #409eff;
          }

          .activity-content {
            flex: 1;

            .activity-title {
              font-size: 14px;
              color: #303133;
              margin-bottom: 4px;
            }

            .activity-time {
              font-size: 12px;
              color: #909399;
            }
          }
        }
      }
    }
  }

  // 响应式设计
  @media (max-width: 1200px) {
    .main-cards {
      grid-template-columns: 1fr;
    }

    .quick-stats {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @include mobile {
    padding: 16px;

    .dashboard-header {
      flex-direction: column;
      gap: 16px;
      text-align: center;

      h1 {
        font-size: 24px;
      }

      .logout-btn {
        align-self: center;
      }
    }

    .quick-stats {
      grid-template-columns: 1fr;
    }

    .main-card {
      .card-header {
        flex-direction: column;
        text-align: center;

        .card-icon {
          margin-right: 0;
          margin-bottom: 12px;
        }
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  }
}

// 闪烁动画
@keyframes flashBorder {

  0%,
  100% {
    border-color: #ff9500;
    box-shadow: 0 0 5px rgba(255, 149, 0, 0.3);
  }

  50% {
    border-color: #ffb84d;
    box-shadow: 0 0 15px rgba(255, 149, 0, 0.6);
  }
}

@keyframes flashIcon {

  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}
</style>