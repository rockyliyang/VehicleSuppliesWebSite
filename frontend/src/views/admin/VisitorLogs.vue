<template>
  <div class="visitor-logs">
    <div class="page-header">
      <h1>访问记录管理</h1>
      <p>查看和分析网站访问记录，了解用户行为和流量统计</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.totalVisits || 0 }}</div>
              <div class="stat-label">总访问量</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.uniqueVisitors || 0 }}</div>
              <div class="stat-label">独立访客</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.avgDuration || 0 }}s</div>
              <div class="stat-label">平均停留时间</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.bounceRate || 0 }}%</div>
              <div class="stat-label">跳出率</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :model="filters" inline>
        <el-form-item label="日期范围">
          <el-date-picker 
            v-model="filters.dateRange" 
            type="daterange" 
            range-separator="至" 
            start-placeholder="开始日期" 
            end-placeholder="结束日期" 
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD" 
            @change="handleFilterChange" 
          />
        </el-form-item>
        <el-form-item label="页面URL">
          <el-input 
            v-model="filters.pageUrl" 
            placeholder="输入页面URL" 
            clearable 
            style="width: 200px;"
            @change="handleFilterChange"
          />
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select v-model="filters.deviceType" placeholder="选择设备类型" clearable style="width: 150px;">
            <el-option label="桌面" value="desktop" />
            <el-option label="移动" value="mobile" />
            <el-option label="平板" value="tablet" />
          </el-select>
        </el-form-item>
        <el-form-item label="国家">
          <el-input 
            v-model="filters.country" 
            placeholder="输入国家" 
            clearable 
            style="width: 150px;"
            @change="handleFilterChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="success" @click="refreshLogs" :loading="loading">
            <el-icon>
              <Refresh />
            </el-icon>
            刷新
          </el-button>
          <el-button type="primary" @click="loadStats">
            <el-icon>
              <DataAnalysis />
            </el-icon>
            更新统计
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 访问记录列表 -->
    <el-card class="logs-list-card">
      <el-table :data="logs" style="width: 100%" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="sessionId" label="会话ID" width="120">
          <template #default="{row}">
            <div class="session-id">{{ row.sessionId?.substring(0, 8) }}...</div>
          </template>
        </el-table-column>
        <el-table-column prop="pageUrl" label="页面URL" width="200">
          <template #default="{row}">
            <div class="page-url" :title="row.pageUrl">{{ row.pageUrl }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="pageTitle" label="页面标题" width="150">
          <template #default="{row}">
            <div class="page-title" :title="row.pageTitle">{{ row.pageTitle || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="ipAddress" label="IP地址" width="120" />
        <el-table-column prop="deviceType" label="设备" width="80">
          <template #default="{row}">
            <el-tag :type="getDeviceType(row.deviceType)">{{ getDeviceText(row.deviceType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="browser" label="浏览器" width="100" />
        <el-table-column prop="country" label="国家" width="80" />
        <el-table-column prop="visitDuration" label="停留时间" width="100">
          <template #default="{row}">
            <span>{{ formatDuration(row.visitDuration) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="isBounce" label="跳出" width="60">
          <template #default="{row}">
            <el-tag :type="row.isBounce ? 'warning' : 'success'">{{ row.isBounce ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isNewVisitor" label="新访客" width="70">
          <template #default="{row}">
            <el-tag :type="row.isNewVisitor ? 'primary' : 'info'">{{ row.isNewVisitor ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="访问时间" width="180">
          <template #default="{row}">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{row}">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="showLogDetail(row)">查看</el-button>
              <el-button type="danger" size="small" @click="deleteLog(row.id)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination 
          v-model:current-page="currentPage" 
          v-model:page-size="pageSize" 
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper" 
          :total="pagination.total"
          @size-change="handleSizeChange" 
          @current-change="handleCurrentChange" 
        />
      </div>
    </el-card>

    <!-- 访问记录详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="访问记录详情" width="700px">
      <div v-if="selectedLog" class="log-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="会话ID">{{ selectedLog.sessionId }}</el-descriptions-item>
          <el-descriptions-item label="用户ID">{{ selectedLog.userId || '匿名用户' }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ selectedLog.ipAddress }}</el-descriptions-item>
          <el-descriptions-item label="页面URL">{{ selectedLog.pageUrl }}</el-descriptions-item>
          <el-descriptions-item label="页面标题">{{ selectedLog.pageTitle || '-' }}</el-descriptions-item>
          <el-descriptions-item label="来源页面">{{ selectedLog.referrer || '-' }}</el-descriptions-item>
          <el-descriptions-item label="User Agent" span="2">{{ selectedLog.userAgent }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">{{ selectedLog.deviceType }}</el-descriptions-item>
          <el-descriptions-item label="浏览器">{{ selectedLog.browser }}</el-descriptions-item>
          <el-descriptions-item label="操作系统">{{ selectedLog.operatingSystem }}</el-descriptions-item>
          <el-descriptions-item label="屏幕分辨率">{{ selectedLog.screenResolution }}</el-descriptions-item>
          <el-descriptions-item label="国家">{{ selectedLog.country }}</el-descriptions-item>
          <el-descriptions-item label="地区">{{ selectedLog.region }}</el-descriptions-item>
          <el-descriptions-item label="城市">{{ selectedLog.city }}</el-descriptions-item>
          <el-descriptions-item label="时区">{{ selectedLog.timezone }}</el-descriptions-item>
          <el-descriptions-item label="停留时间">{{ formatDuration(selectedLog.visitDuration) }}</el-descriptions-item>
          <el-descriptions-item label="是否跳出">
            <el-tag :type="selectedLog.isBounce ? 'warning' : 'success'">{{ selectedLog.isBounce ? '是' : '否' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="是否新访客">
            <el-tag :type="selectedLog.isNewVisitor ? 'primary' : 'info'">{{ selectedLog.isNewVisitor ? '是' : '否' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="访问时间">{{ formatDate(selectedLog.createdAt) }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { Refresh, DataAnalysis } from '@element-plus/icons-vue'

export default {
  name: 'VisitorLogs',
  components: {
    Refresh,
    DataAnalysis
  },
  data() {
    return {
      // 数据加载状态
      loading: false,
      
      // 访问记录列表
      logs: [],
      
      // 统计数据
      stats: {
        totalVisits: 0,
        uniqueVisitors: 0,
        avgDuration: 0,
        bounceRate: 0
      },
      
      // 筛选条件
      filters: {
        dateRange: null,
        pageUrl: '',
        deviceType: '',
        country: ''
      },
      
      // 分页
      currentPage: 1,
      pageSize: 20,
      pagination: {
        total: 0
      },
      
      // 访问记录详情对话框
      detailDialogVisible: false,
      selectedLog: null,
      
      // 设备类型映射
      deviceTypeMap: {
        'desktop': '桌面',
        'mobile': '移动',
        'tablet': '平板'
      },
      
      // 设备类型标签映射
      deviceTagMap: {
        'desktop': 'primary',
        'mobile': 'success',
        'tablet': 'warning'
      }
    }
  },
  computed: {
    // 直接使用访问记录列表，因为后端已经处理了分页和筛选
    paginatedLogs() {
      return this.logs
    }
  },
  created() {
    this.loadLogs()
    this.loadStats()
  },
  methods: {
    // 获取设备类型显示文本
    getDeviceText(deviceType) {
      return this.deviceTypeMap[deviceType] || deviceType
    },
    
    // 获取设备类型标签类型
    getDeviceType(deviceType) {
      return this.deviceTagMap[deviceType] || 'default'
    },
    
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN')
    },
    
    // 格式化停留时间
    formatDuration(seconds) {
      if (!seconds || seconds === 0) return '0s'
      if (seconds < 60) return `${seconds}s`
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
      return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
    },
    
    // 加载访问记录列表
    async loadLogs() {
      this.loading = true
      try {
        // 构建查询参数
        const params = {
          page: this.currentPage,
          pageSize: this.pageSize
        }
        
        // 添加筛选条件
        if (this.filters.dateRange && this.filters.dateRange.length === 2) {
          params.startDate = this.filters.dateRange[0]
          params.endDate = this.filters.dateRange[1]
        }
        if (this.filters.pageUrl) {
          params.pageUrl = this.filters.pageUrl
        }
        if (this.filters.deviceType) {
          params.deviceType = this.filters.deviceType
        }
        if (this.filters.country) {
          params.country = this.filters.country
        }
        
        const response = await this.$api.getWithErrorHandler('/visitor-logs', {
          params,
          fallbackKey: 'admin.visitorLogs.error.loadFailed'
        })
        
        // 根据新的返回格式调整数据解析
        if (response.success && response.data) {
          // 转换字段名以匹配前端模板
          this.logs = response.data.map(log => ({
            ...log,
            createdAt: log.created_at,
            updatedAt: log.updated_at,
            createdBy: log.created_by,
            updatedBy: log.updated_by,
            userId: log.user_id,
            sessionId: log.session_id,
            ipAddress: log.visitor_ip,  // 修正：使用ipAddress而不是visitorIp
            pageUrl: log.page_url,
            pageTitle: log.page_title,
            referrerUrl: log.referrer_url,
            referrer: log.referrer_url,  // 添加referrer字段用于详情显示
            userAgent: log.user_agent,
            deviceType: log.device_type,
            browser: log.browser_name,  // 修正：使用browser而不是browserName
            browserName: log.browser_name,
            operatingSystem: log.operating_system,
            screenResolution: log.screen_resolution,
            visitDuration: log.visit_duration,
            isBounce: log.is_bounce,
            isNewVisitor: log.is_new_visitor,
            country: log.country,
            region: log.region,
            city: log.city,
            timezone: log.timezone
          }))
          this.pagination.total = response.data.length || 0
        } else {
          this.logs = []
          this.pagination.total = 0
        }
      } catch (error) {
        console.error('加载访问记录失败:', error)
        this.$messageHandler.showError('加载访问记录失败', 'admin.visitorLogs.error.loadFailed')
      } finally {
        this.loading = false
      }
    },
    
    // 加载统计数据
    async loadStats() {
      try {
        const params = {}
        
        // 添加日期筛选
        if (this.filters.dateRange && this.filters.dateRange.length === 2) {
          params.startDate = this.filters.dateRange[0]
          params.endDate = this.filters.dateRange[1]
        }
        
        const response = await this.$api.getWithErrorHandler('/visitor-logs/stats', {
          params,
          fallbackKey: 'admin.visitorLogs.error.statsFailed'
        })
        
        // 根据新的返回格式调整统计数据解析
        if (response.success && response.data) {
          this.stats = response.data || {}
        } else {
          this.stats = {
            totalVisits: 0,
            uniqueVisitors: 0,
            avgDuration: 0,
            bounceRate: 0
          }
        }
      } catch (error) {
        console.error('加载统计数据失败:', error)
      }
    },
    
    // 筛选条件变化处理
    handleFilterChange() {
      this.currentPage = 1
      this.loadLogs()
    },
    
    // 重置筛选条件
    resetFilters() {
      this.filters.dateRange = null
      this.filters.pageUrl = ''
      this.filters.deviceType = ''
      this.filters.country = ''
      this.currentPage = 1
      this.loadLogs()
      this.loadStats()
    },

    // 刷新访问记录列表
    refreshLogs() {
      this.loadLogs()
    },
    
    // 显示访问记录详情
    showLogDetail(log) {
      this.selectedLog = log
      this.detailDialogVisible = true
    },
    
    // 删除访问记录
    async deleteLog(logId) {
      try {
        await this.$confirm('确定要删除这条访问记录吗？', '确认删除', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        await this.$api.deleteWithErrorHandler(`/visitor-logs/${logId}`, {
          fallbackKey: 'admin.visitorLogs.error.deleteFailed'
        })
        
        this.$messageHandler.showSuccess('删除成功', 'admin.visitorLogs.success.deleteSuccess')
        this.loadLogs() // 重新加载列表
        this.loadStats() // 更新统计
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除访问记录失败:', error)
        }
      }
    },
    
    // 分页大小变化
    handleSizeChange(newSize) {
      this.pageSize = newSize
      this.currentPage = 1
      this.loadLogs()
    },
    
    // 当前页变化
    handleCurrentChange(newPage) {
      this.currentPage = newPage
      this.loadLogs()
    }
  }
}
</script>

<style scoped>
.visitor-logs {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 10px;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.filter-card {
  margin-bottom: 20px;
}

.logs-list-card {
  margin-bottom: 20px;
}

.session-id {
  font-family: monospace;
  font-size: 12px;
}

.page-url {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-title {
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  gap: 5px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.log-detail {
  max-height: 500px;
  overflow-y: auto;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>