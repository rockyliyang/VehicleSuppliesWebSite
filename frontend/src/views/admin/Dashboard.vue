<template>
  <div class="admin-dashboard">
    <div class="page-header">
      <h2>控制面板</h2>
    </div>
    
    <!-- 数据概览卡片 -->
    <el-row :gutter="20" class="data-overview">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="data-card">
          <div class="data-icon">
            <el-icon><Goods /></el-icon>
          </div>
          <div class="data-info">
            <div class="data-title">产品总数</div>
            <div class="data-value">{{ statistics.products }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="data-card">
          <div class="data-icon" style="background-color: #67C23A;">
            <el-icon><User /></el-icon>
          </div>
          <div class="data-info">
            <div class="data-title">用户总数</div>
            <div class="data-value">{{ statistics.users }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="data-card">
          <div class="data-icon" style="background-color: #E6A23C;">
            <el-icon><List /></el-icon>
          </div>
          <div class="data-info">
            <div class="data-title">订单总数</div>
            <div class="data-value">{{ statistics.orders }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="data-card">
          <div class="data-icon" style="background-color: #F56C6C;">
            <el-icon><Message /></el-icon>
          </div>
          <div class="data-info">
            <div class="data-title">消息总数</div>
            <div class="data-value">{{ statistics.messages }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 快捷入口 -->
    <el-row :gutter="20" class="quick-access">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <span>快捷入口</span>
          </template>
          <div class="quick-links">
            <router-link to="/admin/products/add">
              <el-button type="primary">
                <el-icon><Plus /></el-icon>添加产品
              </el-button>
            </router-link>
            <router-link to="/admin/categories">
              <el-button type="success">
                <el-icon><FolderAdd /></el-icon>管理分类
              </el-button>
            </router-link>
            <router-link to="/admin/banners">
              <el-button type="warning">
                <el-icon><PictureRounded /></el-icon>管理Banner
              </el-button>
            </router-link>
            <router-link to="/admin/users">
              <el-button type="info">
                <el-icon><User /></el-icon>用户管理
              </el-button>
            </router-link>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 最近产品和订单 -->
    <el-row :gutter="20" class="recent-data">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="recent-card">
          <template #header>
            <span>最新产品</span>
            <router-link to="/admin/products" class="more-link">查看更多</router-link>
          </template>
          <el-table :data="recentProducts" style="width: 100%" size="small">
            <el-table-column prop="id" label="ID" width="50" />
            <el-table-column label="产品图片" width="60">
              <template #default="{row}">
                <el-image 
                  style="width: 40px; height: 40px" 
                  :src="row.image" 
                  fit="cover"
                  :preview-src-list="[row.image]"
                  v-if="row.image">
                </el-image>
                <span v-else>无图</span>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="产品名称" show-overflow-tooltip />
            <el-table-column prop="created_at" label="创建时间" width="160">
              <template #default="{row}">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="recent-card">
          <template #header>
            <span>最新订单</span>
            <router-link to="/admin/orders" class="more-link">查看更多</router-link>
          </template>
          <el-table :data="recentOrders" style="width: 100%" size="small">
            <el-table-column prop="id" label="订单号" width="80" show-overflow-tooltip />
            <el-table-column prop="user_name" label="用户" width="100" show-overflow-tooltip />
            <el-table-column prop="amount" label="金额" width="100">
              <template #default="{row}">
                ¥{{ row.amount }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{row}">
                <el-tag :type="getOrderStatusType(row.status)" size="mini">
                  {{ getOrderStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="160">
              <template #default="{row}">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import axios from 'axios'
import { Goods, User, List, Message, Plus, FolderAdd, PictureRounded } from '@element-plus/icons-vue'

export default {
  name: 'AdminDashboard',
  components: {
    Goods,
    User,
    List,
    Message,
    Plus,
    FolderAdd,
    PictureRounded
  },
  data() {
    return {
      statistics: {
        products: 0,
        users: 0,
        orders: 0,
        messages: 0
      },
      recentProducts: [],
      recentOrders: []
    }
  },
  created() {
    this.fetchStatistics()
    this.fetchRecentProducts()
    this.fetchRecentOrders()
  },
  methods: {
    // 获取统计数据
    async fetchStatistics() {
      try {
        // 实际项目中会调用后端API获取统计数据
        // 这里模拟数据
        this.statistics = {
          products: 128,
          users: 256,
          orders: 64,
          messages: 32
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
      }
    },
    
    // 获取最新产品
    async fetchRecentProducts() {
      try {
        const response = await axios.get('/api/products', {
          params: {
            limit: 5,
            sort_by: 'created_at',
            sort_order: 'desc'
          }
        })
        
        if (response.data.success) {
          this.recentProducts = response.data.data.items.slice(0, 5)
        }
      } catch (error) {
        console.error('获取最新产品失败:', error)
      }
    },
    
    // 获取最新订单
    async fetchRecentOrders() {
      try {
        // 实际项目中会调用后端API获取最新订单
        // 这里模拟数据
        this.recentOrders = [
          {
            id: 'ORD20230001',
            user_name: '张三',
            amount: 1299.00,
            status: 1,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2)
          },
          {
            id: 'ORD20230002',
            user_name: '李四',
            amount: 899.50,
            status: 2,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 5)
          },
          {
            id: 'ORD20230003',
            user_name: '王五',
            amount: 2499.00,
            status: 3,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24)
          },
          {
            id: 'ORD20230004',
            user_name: '赵六',
            amount: 599.00,
            status: 0,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 36)
          },
          {
            id: 'ORD20230005',
            user_name: '钱七',
            amount: 1799.00,
            status: 4,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 48)
          }
        ]
      } catch (error) {
        console.error('获取最新订单失败:', error)
      }
    },
    
    // 格式化日期
    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleString()
    },
    
    // 获取订单状态类型
    getOrderStatusType(status) {
      const types = {
        0: 'info',    // 待付款
        1: 'warning', // 待发货
        2: 'primary', // 已发货
        3: 'success', // 已完成
        4: 'danger'   // 已取消
      }
      return types[status] || 'info'
    },
    
    // 获取订单状态文本
    getOrderStatusText(status) {
      const texts = {
        0: '待付款',
        1: '待发货',
        2: '已发货',
        3: '已完成',
        4: '已取消'
      }
      return texts[status] || '未知'
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.data-overview {
  margin-bottom: 20px;
}

.data-card {
  display: flex;
  align-items: center;
  height: 100px;
  margin-bottom: 20px;
}

.data-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #409EFF;
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 30px;
  margin-right: 15px;
}

.data-info {
  flex: 1;
}

.data-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.data-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.quick-access {
  margin-bottom: 20px;
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
}
</style>