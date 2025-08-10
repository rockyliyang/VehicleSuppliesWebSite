<template>
  <div class="contact-messages">
    <div class="page-header">
      <h1>联系消息管理</h1>
      <p>管理用户联系消息，查看消息详情，处理和分配消息</p>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :model="filters" inline>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="选择状态" clearable style="width: 150px;">
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker v-model="filters.dateRange" type="daterange" range-separator="至" 
            start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD"
            value-format="YYYY-MM-DD" @change="handleFilterChange" />
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="success" @click="refreshMessages" :loading="loading">
            <el-icon>
              <Refresh />
            </el-icon>
            刷新
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 消息列表 -->
    <el-card class="messages-list-card">

      <el-table :data="paginatedMessages" style="width: 100%" v-loading="loading" stripe>
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
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper" :total="pagination.total"
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
import { ArrowDown, Refresh } from '@element-plus/icons-vue'

export default {
  name: 'ContactMessages',
  components: {
    ArrowDown,
    Refresh
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
        dateRange: null
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
        "pending": "待处理",
        "in_progress": "处理中",
        "completed": "已完成",
        "closed": "已关闭"
      },
      
      // 状态类型映射
      statusTypeMap: {
        "pending": "warning",
        "in_progress": "primary",
        "completed": "success",
        "closed": "info"
      }
    }
  },
  computed: {
    // 直接使用消息列表，因为后端已经处理了分页和筛选
    paginatedMessages() {
      return this.messages
    }
  },
  created() {
    this.loadMessages()
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
        // 构建查询参数
        const params = {
          page: this.currentPage,
          pageSize: this.pageSize
        }
        
        // 添加筛选条件
        if (this.filters.status) {
          params.status = this.filters.status
        }
        if (this.filters.dateRange && this.filters.dateRange.length === 2) {
          params.startDate = this.filters.dateRange[0]
          params.endDate = this.filters.dateRange[1]
        }
        
        const response = await this.$api.getWithErrorHandler('/contact/admin/messages', {
          params,
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


    
    // 重置筛选条件
    resetFilters() {
      this.filters.status = ''
      this.filters.dateRange = null
      this.currentPage = 1
      this.loadMessages()
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
        
        this.$messageHandler.showSuccess("分配成功", "admin.contact.success.assignSuccess")
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
        
        this.$messageHandler.showSuccess("状态更新成功", "admin.contact.success.statusUpdateSuccess")
        this.loadMessages() // 重新加载列表
      } catch (error) {
        console.error('状态更新失败:', error)
      }
    },
    
    // 处理筛选条件变化
    handleFilterChange() {
      this.currentPage = 1 // 重置到第一页
      this.loadMessages()
    },
    
    // 处理每页显示数量变化
    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1 // 重置到第一页
      this.loadMessages()
    },
    
    // 处理页码变化
    handleCurrentChange(val) {
      this.currentPage = val
      this.loadMessages()
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_mixins.scss';

.contact-messages {
  padding: 20px;

  .page-header {
    margin-bottom: 20px;

    h1 {
      margin: 0 0 8px 0;
      color: #303133;
      font-size: 24px;
      font-weight: 600;
    }

    p {
      margin: 0;
      color: #606266;
      font-size: 14px;
    }
  }

  .filter-card {
    margin-bottom: 20px;

    .el-form {
      margin-bottom: 0;
    }
  }

  .messages-list-card {
    .text-secondary {
      color: #909399;
      font-size: 12px;
    }

    .pagination-wrapper {
      margin-top: 20px;
      text-align: right;
    }
  }
}

.subject-text {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #606266;
}

.action-buttons {
  display: flex;
  gap: 5px;
  flex-wrap: nowrap;

  :deep(.el-button) {
    &.el-button--small {
      padding: 5px 8px;
    }
  }
}

.message-detail {
  margin-bottom: 20px;

  :deep(.el-descriptions) {
    .el-descriptions__header {
      margin-bottom: 16px;
    }

    .el-descriptions__label {
      color: #303133;
      font-weight: 500;
    }

    .el-descriptions__content {
      color: #606266;
    }
  }
}

.message-content {
  margin-top: 20px;

  h4 {
    margin-bottom: 8px;
    color: #303133;
    font-weight: 500;
  }
}

.message-text {
  background: #F5F7FA;
  padding: 15px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  color: #606266;
  border: 1px solid #EBEEF5;
}

@include mobile {
  .contact-messages {
    padding: 10px;

    .page-header {
      h1 {
        font-size: 20px;
      }
    }

    .filter-card {
      .el-form {
        .el-form-item {
          display: block;
          margin-bottom: 15px;

          .el-form-item__content {
            margin-left: 0 !important;
          }
        }
      }
    }

    .messages-list-card {
      .el-table {
        font-size: 12px;
      }

      .pagination-wrapper {
        text-align: center;

        .el-pagination {
          justify-content: center;
        }
      }
    }
  }
}
</style>