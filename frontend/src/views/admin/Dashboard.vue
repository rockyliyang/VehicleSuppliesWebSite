<template>
  <div class="admin-dashboard">
    <!-- 快捷入口 -->
    <el-row :gutter="20" class="quick-access">
      <el-col :span="24">
        <el-card shadow="hover">
          <div class="quick-links">
            <el-button type="primary" @click="navigateToAddProduct">
              <el-icon>
                <Plus />
              </el-icon>添加产品
            </el-button>
            <el-button type="success" @click="navigateToAddCategory">
              <el-icon>
                <FolderAdd />
              </el-icon>添加分类
            </el-button>
            <el-button type="warning" @click="navigateTo('/admin/banners')">
              <el-icon>
                <PictureRounded />
              </el-icon>管理Banner
            </el-button>
            <el-button type="success" plain @click="navigateTo('/admin/company')">
              <el-icon>
                <OfficeBuilding />
              </el-icon>公司信息
            </el-button>
            <el-button type="info" @click="refreshDashboard">
              <el-icon>
                <Refresh />
              </el-icon>刷新
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据概览卡片 -->
    <el-row :gutter="24" class="data-overview">
      <el-col :span="6" :lg="6" v-for="(item, index) in dataOverview" :key="index">
        <el-card class="data-card" shadow="hover" @click="handleDataCardClick(item)">
          <div class="data-content">
            <div class="data-icon" :class="item.iconClass">
              <el-icon>
                <component :is="item.icon" />
              </el-icon>
            </div>
            <div class="data-info">
              <div class="data-title">{{ item.title }}</div>
              <div class="data-value">{{ item.value }}</div>
              <el-badge v-if="item.title === '未读消息数' && item.value > 0" :value="item.value"
                class="data-badge unread-badge" type="danger" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细统计信息 -->
    <el-row :gutter="24" class="detailed-stats">
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <span>用户统计</span>
          </template>
          <div class="stat-item">
            <span class="stat-label">总用户数：</span>
            <span class="stat-value">{{ (statistics.userStats && statistics.userStats.total_users) || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">普通用户：</span>
            <span class="stat-value">{{ (statistics.userStats && statistics.userStats.regular_users) || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">企业用户：</span>
            <span class="stat-value">{{ (statistics.userStats && statistics.userStats.business_users) || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">管理员：</span>
            <span class="stat-value">{{ (statistics.userStats && statistics.userStats.admin_users) || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <span>询价统计</span>
          </template>
          <div class="stat-item">
            <span class="stat-label">总询价数：</span>
            <span class="stat-value">{{ (statistics.inquiryStats && statistics.inquiryStats.total_inquiries) || 0
              }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">待处理：</span>
            <span class="stat-value">{{ (statistics.inquiryStats && statistics.inquiryStats.pending_inquiries) || 0
              }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已批准：</span>
            <span class="stat-value">{{ (statistics.inquiryStats && statistics.inquiryStats.approved_inquiries) || 0
              }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已拒绝：</span>
            <span class="stat-value">{{ (statistics.inquiryStats && statistics.inquiryStats.rejected_inquiries) || 0
              }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <span>消息统计</span>
          </template>
          <div class="stat-item">
            <span class="stat-label">用户未读消息数：</span>
            <span class="stat-value">{{ (statistics.messageStats && statistics.messageStats.user_unread_messages) || 0
              }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">管理员未读消息数：</span>
            <span class="stat-value text-danger">{{ (statistics.messageStats &&
              statistics.messageStats.admin_unread_messages)
              || 0
              }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">管理员消息：</span>
            <span class="stat-value">{{ (statistics.messageStats && statistics.messageStats.admin_messages) || 0
              }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">用户消息：</span>
            <span class="stat-value">{{ (statistics.messageStats && statistics.messageStats.user_messages) || 0
              }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 产品和询价 -->
    <el-row :gutter="24">
      <el-col :span="12">
        <div class="recent-section">
          <h3>最新产品</h3>
          <el-card shadow="hover" class="recent-table">
            <el-table :data="recentProducts" style="width: 100%" @row-click="handleProductRowClick">
              <el-table-column label="图片" width="80">
                <template #default="scope">
                  <el-image :src="scope.row.image || '/default-product.png'"
                    :preview-src-list="scope.row.image ? [scope.row.image] : []" fit="cover" class="product-thumbnail"
                    :preview-teleported="true">
                    <template #error>
                      <div class="image-slot">
                        <el-icon>
                          <PictureIcon />
                        </el-icon>
                      </div>
                    </template>
                  </el-image>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="产品名称" show-overflow-tooltip />
              <el-table-column prop="price" label="价格" width="100">
                <template #default="scope">
                  ¥{{ scope.row.price }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="80">
                <template #default="scope">
                  <el-tag :type="scope.row.status === 'on_shelf' ? 'success' : 'info'" size="small">
                    {{ scope.row.status === 'on_shelf' ? '上架' : '下架' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="创建时间" width="150">
                <template #default="scope">
                  {{ formatDate(scope.row.created_at) }}
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="recent-section">
          <h3>最新询价</h3>
          <el-card shadow="hover" class="recent-table">
            <el-table :data="recentInquiries" style="width: 100%" @row-click="handleInquiryRowClick">
              <el-table-column label="询价用户" width="120">
                <template #default="scope">
                  <div class="user-info">
                    <div class="user-name">{{ scope.row.user_name }}</div>
                    <div class="user-email">{{ scope.row.user_email }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="询价商品" show-overflow-tooltip>
                <template #default="scope">
                  <div class="product-info">
                    <div class="product-summary">{{ scope.row.products_summary }}</div>
                    <div class="item-count">共{{ scope.row.item_count }}件商品</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="消息" width="80">
                <template #default="scope">
                  <span class="message-count" :class="scope.row.unread_messages > 0 ? 'has-unread' : 'no-unread'">
                    {{ scope.row.unread_messages }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="80">
                <template #default="scope">
                  <el-tag :type="getInquiryStatusType(scope.row.status)" size="small">
                    {{ getInquiryStatusText(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="创建时间" width="150">
                <template #default="scope">
                  {{ formatDate(scope.row.created_at) }}
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { Goods, User, List, Message, Plus, FolderAdd, PictureRounded, OfficeBuilding, Picture as PictureIcon, Refresh } from '@element-plus/icons-vue'

export default {
  name: 'AdminDashboard',
  components: {
    Goods,
    User,
    List,
    Message,
    Plus,
    FolderAdd,
    PictureRounded,
    OfficeBuilding,
    PictureIcon,
    Refresh
  },
  data() {
    return {
      statistics: {
        products: 0,
        users: 0,
        orders: 0,
        messages: 0,
        userStats: {
          total_users: 0,
          regular_users: 0,
          business_users: 0,
          admin_users: 0
        },
        inquiryStats: {
          total_inquiries: 0,
          pending_inquiries: 0,
          approved_inquiries: 0,
          rejected_inquiries: 0
        },
        messageStats: {
          total_messages: 0,
          unread_messages: 0,
          admin_messages: 0,
          user_messages: 0
        }
      },
      recentProducts: [],
      recentInquiries: [],
      refreshTimer: null
    }
  },
  computed: {
    dataOverview() {
      return [
        {
          title: '产品总数',
          value: this.statistics.products,
          icon: 'Goods',
          iconClass: ''
        },
        {
          title: '用户总数',
          value: this.statistics.users,
          icon: 'User',
          iconClass: 'user-icon'
        },
        {
          title: '询价总数',
          value: this.statistics.orders,
          icon: 'List',
          iconClass: 'inquiry-icon'
        },
        {
          title: '未读消息数',
          value: this.statistics.messages,
          icon: 'Message',
          iconClass: 'message-icon'
        }
      ]
    }
  },
  created() {
    this.fetchStatistics()
    this.fetchRecentProducts()
    this.fetchRecentInquiries()
    this.startAutoRefresh()
  },
  beforeUnmount() {
    this.stopAutoRefresh()
  },
  methods: {
    // 获取统计数据
    async fetchStatistics() {
      try {
        const response = await this.$api.get('/admin/stats/dashboard')
        if (response.success) {
          const data = response.data
          this.statistics = {
            products: parseInt(data.products) || 0,
            users: parseInt(data.users) || 0,
            orders: parseInt(data.orders) || 0,
            messages: parseInt(data.messages) || 0,
            // 扩展统计信息
            userStats: {
              total_users: (data.userStats && data.userStats.total_users) || 0,
              regular_users: (data.userStats && data.userStats.regular_users) || 0,
              business_users: (data.userStats && data.userStats.business_users) || 0,
              admin_users: (data.userStats && data.userStats.admin_users) || 0
            },
            inquiryStats: {
              total_inquiries: (data.inquiryStats && data.inquiryStats.total_inquiries) || 0,
              pending_inquiries: (data.inquiryStats && data.inquiryStats.pending_inquiries) || 0,
              approved_inquiries: (data.inquiryStats && data.inquiryStats.approved_inquiries) || 0,
              rejected_inquiries: (data.inquiryStats && data.inquiryStats.rejected_inquiries) || 0
            },
            messageStats: {
              total_messages: (data.messageStats && data.messageStats.total_messages) || 0,
              unread_messages: (data.messageStats && data.messageStats.unread_messages) || 0,
              admin_messages: (data.messageStats && data.messageStats.admin_messages) || 0,
              user_messages: (data.messageStats && data.messageStats.user_messages) || 0,
              admin_unread_messages: (data.messageStats && data.messageStats.admin_unread_messages) || 0,
              user_unread_messages: (data.messageStats && data.messageStats.user_unread_messages) || 0
            }
          }
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
        // 如果API调用失败，使用默认值
        this.statistics = {
          products: 0,
          users: 0,
          orders: 0,
          messages: 0,
          userStats: {
            total_users: 0,
            regular_users: 0,
            business_users: 0,
            admin_users: 0
          },
          inquiryStats: {
            total_inquiries: 0,
            pending_inquiries: 0,
            approved_inquiries: 0,
            rejected_inquiries: 0
          },
          messageStats: {
            total_messages: 0,
            unread_messages: 0,
            admin_messages: 0,
            user_messages: 0,
            admin_unread_messages: 0,
            user_unread_messages: 0
          }
        }
      }
    },
    
    // 获取最新产品
    async fetchRecentProducts() {
      try {
        const response = await this.$api.get('/admin/stats/recent-products', {
          params: {
            limit: 5
          }
        })
        
        if (response.success) {
          this.recentProducts = response.data || []
        }
      } catch (error) {
        console.error('获取最新产品失败:', error)
        this.recentProducts = []
      }
    },
    
    // 获取最新询价
    async fetchRecentInquiries() {
      try {
        const response = await this.$api.get('/admin/stats/recent-inquiries', {
          params: {
            limit: 5
          }
        })
        
        if (response.success) {
          this.recentInquiries = response.data || []
        }
      } catch (error) {
        console.error('获取最新询价失败:', error)
        this.recentInquiries = []
      }
    },
    
    // 格式化日期
    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleString()
    },
    
    // 获取询价状态类型
    getInquiryStatusType(status) {
      const types = {
        'inquiried': 'warning',  // 已询价
        'approved': 'success',   // 已批准
        'rejected': 'danger',    // 已拒绝
        'paid': 'primary'        // 已付款
      }
      return types[status] || 'info'
    },
    
    // 获取询价状态文本
    getInquiryStatusText(status) {
      const texts = {
        'inquiried': '已询价',
        'approved': '已批准',
        'rejected': '已拒绝',
        'paid': '已付款'
      }
      return texts[status] || '未知'
    },
    
    // 导航到指定页面
    navigateTo(path) {
      this.$router.push(path)
    },
    
    // 导航到添加产品页面
    navigateToAddProduct() {
      this.$router.push('/admin/products').then(() => {
        // 等待页面加载完成后模拟点击添加按钮
        this.$nextTick(() => {
          setTimeout(() => {
            // 查找添加产品按钮并触发点击事件
            const addButton = document.querySelector('.page-header .el-button--primary')
            if (addButton) {
              addButton.click()
            }
          }, 1000)

        })
      })
    },

    // 导航到添加分类页面
    navigateToAddCategory() {
      this.$router.push('/admin/categories?add=true')
    },

    // 刷新仪表板
    refreshDashboard() {
      this.fetchStatistics()
      this.fetchRecentProducts()
      this.fetchRecentInquiries()
      this.$message.success('仪表板已刷新')
    },

    // 处理数据卡片点击
    handleDataCardClick(item) {
      switch (item.title) {
        case '产品总数':
          this.navigateTo('/admin/products')
          break
        case '用户总数':
          this.navigateTo('/admin/regular-users')
          break
        case '询价总数':
          this.navigateTo('/admin/inquiries')
          break
        case '未读消息数':
          // 跳转到询价管理页面并过滤未读消息
          this.$router.push({
            path: '/admin/inquiries',
            query: { filter: 'unread' }
          })
          break
      }
    },

    // 处理产品行点击
    handleProductRowClick(row) {
      // 由于产品管理使用对话框编辑模式，我们跳转到产品管理页面
      // 可以考虑传递产品ID作为查询参数，让产品管理页面自动打开编辑对话框
      this.$router.push(`/admin/products?edit=${row.id}`)
    },

    // 处理询价行点击
    handleInquiryRowClick(row) {
      // 跳转到询价管理页面，可以传递询价ID让其自动打开详情
      this.$router.push(`/admin/inquiries?view=${row.id}`)
    },

    // 启动自动刷新
    startAutoRefresh() {
      this.refreshTimer = setInterval(() => {
        this.fetchStatistics()
        this.fetchRecentProducts()
        this.fetchRecentInquiries()
      }, 20000) // 每20秒刷新一次
    },

    // 停止自动刷新
    stopAutoRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
        this.refreshTimer = null
      }
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  padding: 16px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 120px);
}

.data-overview {
  margin-bottom: 20px;
}

.data-card {
  height: 120px;
  margin-bottom: 16px;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: none;
}

.data-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.data-content {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 20px;
}

.data-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, #409EFF, #66b3ff);
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 28px;
  margin-right: 20px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.user-icon {
  background: linear-gradient(135deg, #67C23A, #85ce61);
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
}

.inquiry-icon {
  background: linear-gradient(135deg, #E6A23C, #ebb563);
  box-shadow: 0 4px 12px rgba(230, 162, 60, 0.3);
}

.message-icon {
  background: linear-gradient(135deg, #F56C6C, #f78989);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3);
}

.data-info {
  flex: 1;
  position: relative;
}

.data-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
  font-weight: 500;
}

.data-value {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
}

.data-badge {
  position: absolute;
  top: -8px;
  right: 0;
}

.unread-badge {
  font-size: 12px;
}

.quick-actions {
  margin-bottom: 32px;
}

.quick-actions h3 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

.action-button {
  width: 100%;
  height: 80px;
  border-radius: 12px;
  border: 2px solid #e4e7ed;
  background: #fff;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
}

.action-button:hover {
  border-color: #409EFF;
  background: #ecf5ff;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.2);
}

.action-button .el-icon {
  font-size: 24px;
  margin-bottom: 8px;
  color: #409EFF;
}

.action-button span {
  color: #303133;
}

.recent-section {
  margin-bottom: 16px;
}

.recent-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.recent-table {
  border-radius: 12px;
  overflow: hidden;
}

.quick-access {
  margin-bottom: 16px;
}

.quick-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.recent-data {
  margin-bottom: 20px;
}

.recent-card {
  margin-bottom: 20px;
}

.more-link {
  float: right;
  font-size: 13px;
  color: #409EFF;
  text-decoration: none;
}

/* 产品缩略图样式 */
.product-thumbnail {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  object-fit: cover;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 50px;
  height: 50px;
  background: #f5f7fa;
  color: #909399;
  border-radius: 8px;
}

/* 用户信息样式 */
.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.user-email {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100px;
}

/* 商品信息样式 */
.product-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-summary {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-count {
  font-size: 12px;
  color: #909399;
}

/* 详细统计信息样式 */
.detailed-stats {
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.stat-value {
  font-size: 16px;
  color: #303133;
  font-weight: 600;
}

.text-danger {
  color: #f56c6c !important;
}

/* 消息数字样式 */
.message-count {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
  line-height: 1.5;
}

.message-count.has-unread {
  background-color: #f56c6c;
  color: #fff;
}

.message-count.no-unread {
  background-color: #f0f2f5;
  color: #909399;
}

/* 数据卡片点击样式 */
.data-card {
  cursor: pointer;
}

/* 表格行点击样式 */
.recent-table .el-table__row {
  cursor: pointer;
}

.recent-table .el-table__row:hover {
  background-color: #f5f7fa;
}

@media (max-width: 768px) {
  .data-card {
    margin-bottom: 15px;
  }

  .quick-links {
    flex-direction: column;
    gap: 10px;
  }

  .quick-links a {
    margin-bottom: 10px;
  }

  .detailed-stats .el-col {
    margin-bottom: 20px;
  }
}
</style>