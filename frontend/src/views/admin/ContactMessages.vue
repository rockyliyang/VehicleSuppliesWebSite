<template>
  <div class="contact-messages">
    <h1>联系消息管理</h1>

    <el-card class="messages-card">
      <template #header>
        <div class="card-header">
          <span>消息列表</span>
          <div class="header-actions">
            <el-button type="primary" @click="refreshMessages">刷新</el-button>
          </div>
        </div>
      </template>

      <!-- 筛选条件 -->
      <div class="filter-container">
        <el-select v-model="filters.status" placeholder="选择状态" clearable @change="handleFilterChange">
          <el-option label="待处理" value="pending" />
          <el-option label="处理中" value="in_progress" />
          <el-option label="已完成" value="completed" />
          <el-option label="已关闭" value="closed" />
        </el-select>

        <el-select v-model="filters.assignedTo" placeholder="选择负责人" clearable @change="handleFilterChange">
          <el-option v-for="user in businessUsers" :key="user.id" :label="user.name" :value="user.id" />
        </el-select>

        <el-date-picker v-model="filters.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
          end-placeholder="结束日期" @change="handleFilterChange" />

        <el-input v-model="filters.search" placeholder="搜索姓名、邮箱或主题" clearable style="width: 300px; margin-left: 10px"
          @input="handleFilterChange" />
      </div>

      <!-- 消息列表 -->
      <el-table :data="paginatedMessages" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="phone" label="电话" width="150" />
        <el-table-column prop="subject" label="主题" width="200">
          <template #default="{row}">
            <div class="subject-text">{{ row.subject }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{row}">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignedToName" label="负责人" width="120" />
        <el-table-column prop="createdAt" label="提交时间" width="180">
          <template #default="{row}">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{row}">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="showMessageDetail(row)">查看</el-button>
              <el-button type="success" size="small" @click="showAssignDialog(row)">分配</el-button>
              <el-dropdown @command="(command) => handleStatusChange(row, command)">
                <el-button type="warning" size="small">
                  状态<el-icon class="el-icon--right"><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="pending">待处理</el-dropdown-item>
                    <el-dropdown-item command="in_progress">处理中</el-dropdown-item>
                    <el-dropdown-item command="completed">已完成</el-dropdown-item>
                    <el-dropdown-item command="closed">已关闭</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper" :total="filteredMessages.length"
          @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <!-- 消息详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="消息详情" width="600px">
      <div v-if="selectedMessage" class="message-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="姓名">{{ selectedMessage.name }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ selectedMessage.email }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ selectedMessage.phone || '未提供' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedMessage.status)">{{ getStatusText(selectedMessage.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="负责人">{{ selectedMessage.assignedToName || '未分配' }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ formatDate(selectedMessage.createdAt) }}</el-descriptions-item>
        </el-descriptions>

        <div class="message-content">
          <h4>主题：{{ selectedMessage.subject }}</h4>
          <div class="message-text">{{ selectedMessage.message }}</div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 分配负责人对话框 -->
    <el-dialog v-model="assignDialogVisible" title="分配负责人" width="400px">
      <el-form :model="assignForm" label-width="100px">
        <el-form-item label="当前负责人">
          <span>{{ selectedMessage?.assignedToName || '未分配' }}</span>
        </el-form-item>
        <el-form-item label="新负责人">
          <el-select v-model="assignForm.assignedTo" placeholder="选择负责人" clearable>
            <el-option v-for="user in businessUsers" :key="user.id" :label="user.name" :value="user.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="assignDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAssignment">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ArrowDown } from '@element-plus/icons-vue'


export default {
  name: 'ContactMessages',
  components: {
    ArrowDown
  },
  data() {
    return {
      // 数据加载状态
      loading: false,
      
      // 消息列表
      messages: [],
      
      // 业务人员列表
      businessUsers: [],
      
      // 筛选条件
      filters: {
        status: '',
        assignedTo: '',
        dateRange: null,
        search: ''
      },
      
      // 分页
      currentPage: 1,
      pageSize: 10,
      pagination: {
        total: 0
      },
      
      // 消息详情对话框
      detailDialogVisible: false,
      selectedMessage: null,
      
      // 分配对话框
      assignDialogVisible: false,
      assignForm: {
        messageId: null,
        assignedTo: null
      },
      
      // 状态映射
      statusMap: {
        'pending': '待处理',
        'in_progress': '处理中',
        'completed': '已完成',
        'closed': '已关闭'
      },
      
      // 状态类型映射
      statusTypeMap: {
        'pending': 'warning',
        'in_progress': 'primary',
        'completed': 'success',
        'closed': 'info'
      }
    }
  },
  computed: {
    // 筛选后的消息列表
    filteredMessages() {
      let result = this.messages
      
      // 按状态筛选
      if (this.filters.status) {
        result = result.filter(item => item.status === this.filters.status)
      }
      
      // 按负责人筛选
      if (this.filters.assignedTo) {
        result = result.filter(item => item.assignedTo === this.filters.assignedTo)
      }
      
      // 按日期范围筛选
      if (this.filters.dateRange && this.filters.dateRange.length === 2) {
        const [startDate, endDate] = this.filters.dateRange
        result = result.filter(item => {
          const itemDate = new Date(item.createdAt)
          return itemDate >= startDate && itemDate <= endDate
        })
      }
      
      // 按关键词搜索
      if (this.filters.search) {
        const keyword = this.filters.search.toLowerCase()
        result = result.filter(item => 
          item.name.toLowerCase().includes(keyword) || 
          item.email.toLowerCase().includes(keyword) ||
          item.subject.toLowerCase().includes(keyword)
        )
      }
      
      return result
    },
    
    // 分页后的消息列表
    paginatedMessages() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredMessages.slice(start, end)
    }
  },
  created() {
    this.loadMessages()
    this.loadBusinessUsers()
  },
  methods: {
    // 获取状态显示文本
    getStatusText(status) {
      return this.statusMap[status] || status
    },
    
    // 获取状态标签类型
    getStatusType(status) {
      return this.statusTypeMap[status] || 'default'
    },
    
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN')
    },
    
    // 加载消息列表
    async loadMessages() {
      this.loading = true
      try {
        const response = await this.$api.getWithErrorHandler('/contact/admin/messages', {
          fallbackKey: 'admin.contact.error.loadFailed'
        })
        this.messages = response.data.items || []
        this.pagination.total = response.data.total || 0
      } catch (error) {
        console.error('加载联系消息失败:', error)
      } finally {
        this.loading = false
      }
    },

    // 加载业务人员列表
    async loadBusinessUsers() {
      try {
        const response = await this.$api.getWithErrorHandler('/admin/users/business-staff', {
          fallbackKey: 'admin.contact.error.loadBusinessUsersFailed'
        })
        this.businessUsers = response.data.users || []
      } catch (error) {
        console.error('加载业务人员列表失败:', error)
      }
    },
    
    // 刷新消息列表
    refreshMessages() {
      this.loadMessages()
    },
    
    // 显示消息详情
    showMessageDetail(message) {
      this.selectedMessage = message
      this.detailDialogVisible = true
    },
    
    // 显示分配对话框
    showAssignDialog(message) {
      this.selectedMessage = message
      this.assignForm.messageId = message.id
      this.assignForm.assignedTo = message.assignedTo
      this.assignDialogVisible = true
    },
    
    // 提交分配
    async submitAssignment() {
      try {
        await this.$api.patchWithErrorHandler(`/contact/admin/messages/${this.assignForm.messageId}/assign`, {
          assigned_to: this.assignForm.assignedTo
        }, {
          fallbackKey: 'admin.contact.error.assignFailed'
        })
        
        this.$messageHandler.showSuccess('分配成功', 'admin.contact.success.assignSuccess')
        this.assignDialogVisible = false
        this.loadMessages() // 重新加载列表
      } catch (error) {
        console.error('分配失败:', error)
      }
    },
    
    // 处理状态变更
    async handleStatusChange(message, newStatus) {
      if (message.status === newStatus) {
        return // 状态相同，不需要更新
      }
      
      try {
        await this.$api.patchWithErrorHandler(`/contact/admin/messages/${message.id}/status`, {
          status: newStatus
        }, {
          fallbackKey: 'admin.contact.error.statusUpdateFailed'
        })
        
        this.$messageHandler.showSuccess('状态更新成功', 'admin.contact.success.statusUpdateSuccess')
        this.loadMessages() // 重新加载列表
      } catch (error) {
        console.error('状态更新失败:', error)
      }
    },
    
    // 处理筛选条件变化
    handleFilterChange() {
      this.currentPage = 1 // 重置到第一页
    },
    
    // 处理每页显示数量变化
    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1 // 重置到第一页
    },
    
    // 处理页码变化
    handleCurrentChange(val) {
      this.currentPage = val
    }
  }
}
</script>

<style lang="scss" scoped>
$primary-color: #409EFF;
$success-color: #67C23A;
$warning-color: #E6A23C;
$danger-color: #F56C6C;
$info-color: #909399;
$text-color-primary: #303133;
$text-color-regular: #606266;
$text-color-secondary: #909399;
$border-color-light: #EBEEF5;
$background-color-light: #F5F7FA;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$border-radius-sm: 2px;
$border-radius-md: 4px;

.contact-messages {
  padding: $spacing-lg;

  h1 {
    color: $text-color-primary;
    margin-bottom: $spacing-lg;
  }
}

.messages-card {
  :deep(.el-card__header) {
    background-color: $background-color-light;
    border-bottom: 1px solid $border-color-light;
  }

  :deep(.el-card__body) {
    padding: $spacing-lg;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  span {
    font-size: 16px;
    font-weight: 500;
    color: $text-color-primary;
  }
}

.header-actions {
  display: flex;
  gap: $spacing-sm;
}

.filter-container {
  margin-bottom: $spacing-lg;
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  flex-wrap: wrap;

  :deep(.el-select) {
    min-width: 150px;

    .el-input__inner {
      border-radius: $border-radius-md;
    }
  }

  :deep(.el-date-editor) {
    .el-input__inner {
      border-radius: $border-radius-md;
    }
  }

  :deep(.el-input) {
    .el-input__inner {
      border-radius: $border-radius-md;
    }
  }
}

:deep(.el-table) {
  border-radius: $border-radius-md;
  overflow: hidden;

  .el-table__header {
    background-color: $background-color-light;

    th {
      background-color: $background-color-light;
      color: $text-color-primary;
      font-weight: 500;
    }
  }

  .el-table__row {
    &:hover {
      background-color: #F5F7FA;
    }
  }
}

.subject-text {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: $text-color-regular;
}

.pagination-container {
  margin-top: $spacing-lg;
  display: flex;
  justify-content: flex-end;

  :deep(.el-pagination) {
    .el-pager li {
      border-radius: $border-radius-sm;
      margin: 0 2px;
    }

    .btn-prev,
    .btn-next {
      border-radius: $border-radius-sm;
    }
  }
}

.action-buttons {
  display: flex;
  gap: 5px;
  flex-wrap: nowrap;

  :deep(.el-button) {
    border-radius: $border-radius-sm;

    &.el-button--small {
      padding: 5px 8px;
    }
  }

  :deep(.el-dropdown) {
    .el-button {
      border-radius: $border-radius-sm;
    }
  }
}

:deep(.el-dialog) {
  border-radius: $border-radius-md;

  .el-dialog__header {
    background-color: $background-color-light;
    border-bottom: 1px solid $border-color-light;

    .el-dialog__title {
      color: $text-color-primary;
      font-weight: 500;
    }
  }

  .el-dialog__body {
    padding: $spacing-lg;
  }
}

.message-detail {
  margin-bottom: $spacing-lg;

  :deep(.el-descriptions) {
    .el-descriptions__header {
      margin-bottom: $spacing-md;
    }

    .el-descriptions__label {
      color: $text-color-primary;
      font-weight: 500;
    }

    .el-descriptions__content {
      color: $text-color-regular;
    }
  }
}

.message-content {
  margin-top: $spacing-lg;

  h4 {
    margin-bottom: $spacing-sm;
    color: $text-color-primary;
    font-weight: 500;
  }
}

.message-text {
  background: $background-color-light;
  padding: 15px;
  border-radius: $border-radius-md;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  color: $text-color-regular;
  border: 1px solid $border-color-light;
}

:deep(.el-tag) {
  border-radius: $border-radius-sm;

  &.el-tag--success {
    background-color: rgba($success-color, 0.1);
    border-color: rgba($success-color, 0.2);
    color: $success-color;
  }

  &.el-tag--warning {
    background-color: rgba($warning-color, 0.1);
    border-color: rgba($warning-color, 0.2);
    color: $warning-color;
  }

  &.el-tag--danger {
    background-color: rgba($danger-color, 0.1);
    border-color: rgba($danger-color, 0.2);
    color: $danger-color;
  }

  &.el-tag--info {
    background-color: rgba($info-color, 0.1);
    border-color: rgba($info-color, 0.2);
    color: $info-color;
  }
}

:deep(.el-form) {
  .el-form-item__label {
    color: $text-color-primary;
    font-weight: 500;
  }

  .el-input__inner,
  .el-select .el-input__inner {
    border-radius: $border-radius-md;
  }
}
</style>