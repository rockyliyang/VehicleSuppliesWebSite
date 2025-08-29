<template>
  <div class="inquiry-management">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1>{{ $t('inquiry.management.title') || '询价管理' }}</h1>
          <p>{{ $t('admin.inquiry.description') || '管理用户询价单，查看询价详情，处理报价和消息' }}</p>
        </div>
        <div class="header-right" v-if="isBusiness">
          <el-button type="primary" @click="goBackToDashboard" size="small">
            <el-icon><ArrowLeft /></el-icon>
            {{ $t('common.back') || '返回' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :model="filters" inline>
        <el-form-item :label="$t('admin.inquiry.filter.status') || '状态'">
          <el-select v-model="filters.status" :placeholder="$t('inquiry.management.status_filter') || '选择状态'" clearable
            style="width: 150px;">
            <el-option value="inquiried" :label="$t('inquiry.status.inquiried') || '已询价'" />
            <el-option value="approved" :label="$t('inquiry.status.approved') || '已批准'" />
            <el-option value="rejected" :label="$t('inquiry.status.rejected') || '已拒绝'" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('admin.inquiry.filter.user') || '用户'">
          <el-select v-model="filters.userId" :placeholder="$t('inquiry.management.search_placeholder') || '选择用户'"
            clearable filterable remote :remote-method="handleUserSearch" :loading="userSearchLoading"
            style="width: 200px;">
            <el-option v-for="user in userOptions" :key="user.id" :label="`${user.username} (${user.email})`"
              :value="user.id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('admin.inquiry.filter.unread') || '未读消息'">
          <el-select v-model="filters.unreadFilter"
            :placeholder="$t('admin.inquiry.filter.unread_placeholder') || '选择过滤条件'" clearable style="width: 150px;">
            <el-option value="unread" :label="$t('admin.inquiry.filter.has_unread') || '有未读消息'" />
            <el-option value="read" :label="$t('admin.inquiry.filter.no_unread') || '无未读消息'" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('admin.inquiry.filter.dateRange') || '日期范围'">
          <el-date-picker v-model="dateRange" type="daterange" :range-separator="$t('admin.inquiry.filter.to') || '至'"
            :start-placeholder="$t('admin.inquiry.filter.startDate') || '开始日期'"
            :end-placeholder="$t('admin.inquiry.filter.endDate') || '结束日期'" format="YYYY-MM-DD"
            value-format="YYYY-MM-DD" @change="handleDateRangeChange" />
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilters">{{ $t('common.reset') || '重置' }}</el-button>
          <el-button type="success" @click="refreshData" :loading="refreshing">
            <el-icon>
              <Refresh />
            </el-icon>
            {{ $t('common.refresh') || '刷新' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 询价列表 -->
    <el-card class="inquiry-list-card">
      <!-- 桌面端表格 -->
      <el-table v-if="!isMobile" v-loading="loading" :data="inquiries" stripe @row-click="handleRowClick">
        <el-table-column :label="$t('admin.inquiry.table.unreadCount') || '未读消息'" width="100" fixed="left">
          <template #default="{ row }">
            <div class="unread-message-cell">
              <span v-if="row.unread_count > 0" class="unread-number unread-highlight flash-unread">{{ row.unread_count }}</span>
              <span v-else class="no-unread">0</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="user_inquiry_id" :label="$t('inquiry.management.table.id') || '询价单号'" width="100" />
        <el-table-column prop="title" :label="$t('admin.inquiry.table.title') || '标题'" min-width="100" />
        <el-table-column :label="$t('inquiry.management.table.user') || '用户'" width="200">
          <template #default="{ row }">
            <div>
              <div class="text-secondary">{{ row.email }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('inquiry.management.table.status') || '状态'" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('inquiry.management.table.items') || '商品数量'" width="100">
          <template #default="{ row }">
            {{ row.item_count }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('admin.inquiry.table.messageCount') || '消息数'" width="100">
          <template #default="{ row }">
            {{ row.message_count }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" :label="$t('inquiry.management.table.created_at') || '创建时间'" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>

      <!-- 移动端表格 -->
      <el-table v-else v-loading="loading" :data="inquiries" stripe @row-click="handleRowClick">
        <el-table-column :label="$t('admin.inquiry.table.unreadCount') || '未读'" width="60" align="center">
          <template #default="{ row }">
            <div class="unread-message-cell">
              <span v-if="row.unread_count > 0" class="unread-number unread-highlight flash-unread">{{ row.unread_count }}</span>
              <span v-else class="no-unread">-</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="user_inquiry_id" :label="$t('inquiry.management.table.id') || '单号'" width="80" />
        <el-table-column :label="$t('inquiry.management.table.user') || '用户'" min-width="120">
          <template #default="{ row }">
            <div class="mobile-user-info">
              <div class="user-email">{{ row.email }}</div>
              <div class="inquiry-status">
                <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]" :total="pagination.total" layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <!-- 询价详情对话框 -->
    <el-dialog v-model="detailDialogVisible" :title="$t('admin.inquiry.detail.title') || '询价详情'" width="95%" top="2vh"
      :close-on-click-modal="false" class="inquiry-detail-dialog">
      <inquiry-detail v-if="detailDialogVisible && selectedInquiryId" :inquiry-id="selectedInquiryId"
        @status-updated="handleStatusUpdated" @quote-updated="handleQuoteUpdated" @messages-read="handleMessagesRead" />
    </el-dialog>
  </div>
</template>

<script>
import { Refresh, ArrowLeft } from '@element-plus/icons-vue'
import InquiryDetail from '../../components/admin/InquiryDetail.vue'
import { mapState } from 'vuex'

export default {
  name: 'InquiryManagement',
  components: {
    InquiryDetail,
    Refresh,
    ArrowLeft
  },
  data() {
    return {
      loading: false,
      refreshing: false,
      inquiries: [],
      filters: {
        status: '',
        userId: '',
        startDate: '',
        endDate: '',
        unreadFilter: ''
      },
      dateRange: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0
      },
      detailDialogVisible: false,
      selectedInquiryId: null,
      userIdTimer: null,
      refreshTimer: null,
      userOptions: [],
      userSearchLoading: false
    }
  },
  computed: {
    ...mapState(['user']),
    isMobile() {
      return window.innerWidth <= 768
    },
    isBusiness() {
      return this.user && this.user.role === 'business'
    }
  },
  watch: {
    // 监听筛选条件变化，自动重新加载数据
    'filters.status'() {
      this.pagination.page = 1
      this.loadInquiries()
    },
    'filters.unreadFilter'() {
      this.pagination.page = 1
      this.loadInquiries()
    },
    'filters.userId'() {
      this.pagination.page = 1
      this.loadInquiries()
    },
    dateRange() {
      this.pagination.page = 1
      this.loadInquiries()
    }
  },
  mounted() {
    // 检查路由参数，如果有filter=unread则自动过滤未读消息
    if (this.$route.query.filter === 'unread') {
      this.filters.unreadFilter = 'unread'
    }
    
    this.loadInquiries()
    this.loadUsers()
    this.startAutoRefresh()
    
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize)
    
    // 检查是否有查看询价详情的查询参数
    const viewInquiryId = this.$route.query.view;
    if (viewInquiryId) {
      // 等待询价列表加载完成后自动打开详情对话框
      this.$nextTick(() => {
        setTimeout(() => {
          this.viewDetail(parseInt(viewInquiryId));
        }, 500); // 给一点时间让数据加载完成
      });
    }
  },
  beforeUnmount() {
    // 清理定时器
    if (this.userIdTimer) {
      clearTimeout(this.userIdTimer)
    }
    this.stopAutoRefresh()
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    async loadInquiries() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          limit: this.pagination.limit,
          ...this.filters
        }
        
        // 移除空值
        Object.keys(params).forEach(key => {
          if (params[key] === '' || params[key] === null || params[key] === undefined) {
            delete params[key]
          }
        })
        
        const response = await this.$api.getWithErrorHandler('/admin/inquiries', {
          params,
          fallbackKey: 'admin.inquiry.error.loadFailed'
        })
        // 对询价列表进行排序，有未读消息的排在前面
        const inquiries = response.data.inquiries || []
        this.inquiries = inquiries.sort((a, b) => {
          // 首先按未读消息数量排序（降序）
          if (a.unread_count !== b.unread_count) {
            return (b.unread_count || 0) - (a.unread_count || 0)
          }
          // 如果未读消息数量相同，按创建时间排序（最新的在前）
          return new Date(b.created_at) - new Date(a.created_at)
        })
        this.pagination = response.data.pagination
      } catch (error) {
        // 错误已经被统一处理
      } finally {
        this.loading = false
      }
    },
    
    handleDateRangeChange(dates) {
      if (dates && dates.length === 2) {
        this.filters.startDate = dates[0]
        this.filters.endDate = dates[1]
      } else {
        this.filters.startDate = ''
        this.filters.endDate = ''
      }
    },
    
    resetFilters() {
      this.filters = {
        status: '',
        userId: '',
        startDate: '',
        endDate: '',
        unreadFilter: ''
      }
      this.dateRange = []
      this.pagination.page = 1
      this.loadInquiries()
    },
    
    handleSizeChange(size) {
      this.pagination.limit = size
      this.pagination.page = 1
      this.loadInquiries()
    },
    
    handleCurrentChange(page) {
      this.pagination.page = page
      this.loadInquiries()
    },
    
    viewDetail(inquiryId) {
      this.selectedInquiryId = inquiryId
      this.detailDialogVisible = true
    },
    
    async updateStatus(inquiry, newStatus) {
      try {
        await this.$api.putWithErrorHandler(`/admin/inquiries/${inquiry.id}/status`, {
          status: newStatus
        }, {
          fallbackKey: 'admin.inquiry.error.statusUpdateFailed'
        })
        
        this.$messageHandler.showSuccess(
          this.$t('admin.inquiry.success.statusUpdated') || '状态更新成功',
          'admin.inquiry.success.statusUpdated'
        )
        this.loadInquiries()
      } catch (error) {
        // 错误已经被统一处理
      }
    },
    
    handleRowClick(row) {
      this.viewDetail(row.id)
    },
    handleMessagesRead() {
      this.loadInquiries()
    },
    
    getStatusType(status) {
      const statusMap = {
        inquiried: 'warning',
        approved: 'success',
        rejected: 'danger'
      }
      return statusMap[status] || 'info'
    },
    
    getStatusText(status) {
      const statusMap = {
        inquiried: this.$t('inquiry.status.inquiried') || '已询价',
        approved: this.$t('inquiry.status.approved') || '已批准',
        rejected: this.$t('inquiry.status.rejected') || '已拒绝'
      }
      return statusMap[status] || status
    },
    
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    async refreshData() {
      this.refreshing = true
      try {
        await this.loadInquiries()
        this.$messageHandler.showSuccess(
          this.$t('admin.inquiry.success.refreshed') || '数据已刷新',
          'admin.inquiry.success.refreshed'
        )
      } catch (error) {
        // 错误已经被统一处理
      } finally {
        this.refreshing = false
      }
    },
    
    async markAsRead(inquiryId) {
      try {
        await this.$api.putWithErrorHandler(`/admin/inquiries/${inquiryId}/messages/read`, {}, {
          fallbackKey: 'admin.inquiry.error.markReadFailed'
        })
        
        this.$messageHandler.showSuccess(
          this.$t('admin.inquiry.success.markedAsRead') || '消息已标记为已读',
          'admin.inquiry.success.markedAsRead'
        )
        
        // 更新本地数据
        const inquiry = this.inquiries.find(item => item.id === inquiryId)
        if (inquiry) {
          inquiry.unread_count = 0
        }
        
        // 刷新数据以确保未读消息数同步
        await this.loadInquiries()
      } catch (error) {
        // 错误已经被统一处理
      }
    },

    async loadUsers(query = '') {
      this.userSearchLoading = true
      try {
        const params = {
          limit: 20
        }
        if (query) {
          params.search = query
        }
        
        const response = await this.$api.getWithErrorHandler('/admin/users', {
          params,
          fallbackKey: 'admin.user.error.loadFailed'
        })
        
        this.userOptions = response.data.items
      } catch (error) {
        // 错误已经被统一处理
      } finally {
        this.userSearchLoading = false
      }
    },

    handleUserSearch(query) {
      if (query !== '') {
        this.loadUsers(query)
      } else {
        this.loadUsers()
      }
    },

    // 启动自动刷新
    startAutoRefresh() {
      this.refreshTimer = setInterval(() => {
        this.loadInquiries()
      }, 10000) // 每10秒刷新一次
    },

    // 停止自动刷新
    stopAutoRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
        this.refreshTimer = null
      }
    },

    // 处理窗口大小变化
    handleResize() {
      this.$forceUpdate()
    },

    // 返回业务仪表板
    goBackToDashboard() {
      this.$router.push('/business')
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';
@import '@/assets/styles/_mixins.scss';

.inquiry-management {
  padding: 20px;

  .page-header {
    margin-bottom: 20px;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;

      .header-left {
        flex: 1;

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

      .header-right {
        flex-shrink: 0;
        margin-top: 5px;
      }
    }
  }

  .filter-card {
    margin-bottom: 20px;

    .el-form {
      margin-bottom: 0;
    }
  }

  .inquiry-list-card {
    .text-secondary {
      color: #909399;
      font-size: 12px;
    }

    .text-danger {
      color: #f56c6c;
    }

    .unread-message-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;

      .unread-count-display {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;

        .unread-number {
          font-size: 18px;
          font-weight: 600;
          color: #f56c6c;
          line-height: 1;
        }

        .unread-highlight {
          background-color: #fef0f0;
          color: #f56c6c !important;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #fbc4c4;
          font-weight: 700;
        }

        .unread-label {
          font-size: 11px;
          color: #909399;
          line-height: 1;
        }
      }

      .no-unread {
        color: #909399;
        font-size: 12px;
      }

      .flash-unread {
        animation: flashUnreadNumber 2s infinite;
      }

      .mark-read-btn {
        padding: 0;
        font-size: 11px;
        color: #67c23a;

        &:hover {
          color: #529b2e;
        }
      }
    }

    .pagination-wrapper {
      margin-top: 20px;
      text-align: right;
    }

    .mobile-user-info {
      .user-email {
        font-size: 12px;
        color: #606266;
        margin-bottom: 4px;
      }

      .inquiry-status {
        .el-tag {
          font-size: 10px;
        }
      }
    }
  }
}

// 对话框样式优化
:deep(.inquiry-detail-dialog) {
  .el-dialog {
    max-height: 96vh;
    margin: 2vh auto;
    display: flex;
    flex-direction: column;
  }

  .el-dialog__header {
    flex-shrink: 0;
    padding: 15px 20px;
    border-bottom: 1px solid #ebeef5;
  }

  .el-dialog__body {
    flex: 1;
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .inquiry-detail {
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: 20px;
    gap: 15px;
  }
}

@include mobile {
  .inquiry-management {
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

    .inquiry-list-card {
      .el-table {
        font-size: 12px;
      }

      .unread-message-cell {
        .flash-unread {
          font-size: 14px !important;
          font-weight: 800 !important;
        }
      }

      .pagination-wrapper {
        text-align: center;

        .el-pagination {
          justify-content: center;
        }
      }
    }
  }

  // 移动端对话框优化
  :deep(.inquiry-detail-dialog) {
    .el-dialog {
      width: 98% !important;
      margin: 1vh auto;
      max-height: 98vh;
    }

    .inquiry-detail {
      padding: 10px;
      gap: 10px;
    }
  }
}

.inquiry-management {
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

  .inquiry-list-card {
    .text-secondary {
      color: #909399;
      font-size: 12px;
    }

    .text-danger {
      color: #f56c6c;
    }

    .unread-message-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;

      .unread-count-display {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;

        .unread-number {
          font-size: 18px;
          font-weight: 600;
          color: #f56c6c;
          line-height: 1;
        }

        .unread-label {
          font-size: 11px;
          color: #909399;
          line-height: 1;
        }
      }

      .no-unread {
        color: #909399;
        font-size: 12px;
      }

      .mark-read-btn {
        padding: 0;
        font-size: 11px;
        color: #67c23a;

        &:hover {
          color: #529b2e;
        }
      }
    }

    .pagination-wrapper {
      margin-top: 20px;
      text-align: right;
    }
  }
}

// 对话框样式优化
:deep(.inquiry-detail-dialog) {
  .el-dialog {
    max-height: 96vh;
    margin: 2vh auto;
    display: flex;
    flex-direction: column;
  }

  .el-dialog__header {
    flex-shrink: 0;
    padding: 15px 20px;
    border-bottom: 1px solid #ebeef5;
  }

  .el-dialog__body {
    flex: 1;
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .inquiry-detail {
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: 20px;
    gap: 15px;
  }
}

@include mobile {
  .inquiry-management {
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

    .inquiry-list-card {
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

  // 移动端对话框优化
  :deep(.inquiry-detail-dialog) {
    .el-dialog {
      width: 98% !important;
      margin: 1vh auto;
      max-height: 98vh;
    }

    .inquiry-detail {
      padding: 10px;
      gap: 10px;
    }
  }
}

// 未读消息数字闪烁动画
@keyframes flashUnreadNumber {
  0%, 100% {
    color: #f56c6c;
    text-shadow: 0 0 3px rgba(245, 108, 108, 0.3);
    transform: scale(1);
  }
  50% {
    color: #ff4757;
    text-shadow: 0 0 8px rgba(255, 71, 87, 0.6);
    transform: scale(1.1);
  }
}
</style>