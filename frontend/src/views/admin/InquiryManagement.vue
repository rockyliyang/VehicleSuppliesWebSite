<template>
  <div class="inquiry-management">
    <div class="page-header">
      <h1>{{ $t('inquiry.management.title') || '询价管理' }}</h1>
      <p>{{ $t('admin.inquiry.description') || '管理用户询价单，查看询价详情，处理报价和消息' }}</p>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :model="filters" inline>
        <el-form-item :label="$t('admin.inquiry.filter.status') || '状态'">
          <el-select v-model="filters.status" :placeholder="$t('inquiry.management.status_filter') || '选择状态'" clearable>
            <el-option value="pending" :label="$t('inquiry.status.pending') || '待处理'" />
            <el-option value="quoted" :label="$t('inquiry.status.quoted') || '已报价'" />
            <el-option value="approved" :label="$t('inquiry.status.approved') || '已批准'" />
            <el-option value="rejected" :label="$t('inquiry.status.rejected') || '已拒绝'" />
            <el-option value="completed" :label="$t('inquiry.status.completed') || '已完成'" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('admin.inquiry.filter.user') || '用户'">
          <el-input v-model="filters.userId" :placeholder="$t('inquiry.management.search_placeholder') || '输入用户ID'"
            clearable />
        </el-form-item>
        <el-form-item :label="$t('admin.inquiry.filter.dateRange') || '日期范围'">
          <el-date-picker v-model="dateRange" type="daterange" :range-separator="$t('admin.inquiry.filter.to') || '至'"
            :start-placeholder="$t('admin.inquiry.filter.startDate') || '开始日期'"
            :end-placeholder="$t('admin.inquiry.filter.endDate') || '结束日期'" format="YYYY-MM-DD"
            value-format="YYYY-MM-DD" @change="handleDateRangeChange" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadInquiries">{{ $t('common.search') || '搜索' }}</el-button>
          <el-button @click="resetFilters">{{ $t('common.reset') || '重置' }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 询价列表 -->
    <el-card class="inquiry-list-card">
      <el-table v-loading="loading" :data="inquiries" stripe>
        <el-table-column prop="user_inquiry_id" :label="$t('inquiry.management.table.id') || '询价单号'" width="120" />
        <el-table-column prop="title" :label="$t('admin.inquiry.table.title') || '标题'" min-width="150" />
        <el-table-column :label="$t('inquiry.management.table.user') || '用户'" width="150">
          <template #default="{ row }">
            <div>
              <div>{{ row.username }}</div>
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
        <el-table-column :label="$t('admin.inquiry.table.totalPrice') || '总报价'" width="120">
          <template #default="{ row }">
            <span v-if="row.total_quoted_price > 0">${{ row.total_quoted_price.toFixed(2) }}</span>
            <span v-else class="text-secondary">{{ $t('admin.inquiry.table.notQuoted') || '未报价' }}</span>
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
        <el-table-column :label="$t('inquiry.management.table.actions') || '操作'" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewDetail(row.id)">{{ $t('inquiry.management.action.view')
              || '查看' }}</el-button>
            <el-button type="success" size="small" @click="quickQuote(row)" :disabled="row.status === 'completed'">{{
              $t('inquiry.management.action.quote') || '报价' }}</el-button>
            <el-dropdown trigger="click">
              <el-button type="info" size="small">{{ $t('admin.inquiry.action.more') || '更多' }}</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="updateStatus(row, 'approved')" :disabled="row.status === 'completed'">{{
                    $t('admin.inquiry.action.approve') || '批准' }}</el-dropdown-item>
                  <el-dropdown-item @click="updateStatus(row, 'rejected')" :disabled="row.status === 'completed'">{{
                    $t('admin.inquiry.action.reject') || '拒绝' }}</el-dropdown-item>
                  <el-dropdown-item @click="updateStatus(row, 'completed')" :disabled="row.status === 'completed'">{{
                    $t('admin.inquiry.action.complete') || '完成' }}</el-dropdown-item>
                  <el-dropdown-item divided @click="deleteInquiry(row)" class="text-danger">{{
                    $t('inquiry.management.action.delete') || '删除' }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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
    <el-dialog v-model="detailDialogVisible" :title="$t('admin.inquiry.detail.title') || '询价详情'" width="80%" top="5vh"
      :close-on-click-modal="false">
      <inquiry-detail v-if="detailDialogVisible && selectedInquiryId" :inquiry-id="selectedInquiryId"
        @status-updated="handleStatusUpdated" @quote-updated="handleQuoteUpdated" />
    </el-dialog>
  </div>
</template>

<script>

import InquiryDetail from '../../components/admin/InquiryDetail.vue'

export default {
  name: 'InquiryManagement',
  components: {
    InquiryDetail
  },
  data() {
    return {
      loading: false,
      inquiries: [],
      filters: {
        status: '',
        userId: '',
        startDate: '',
        endDate: ''
      },
      dateRange: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0
      },
      detailDialogVisible: false,
      selectedInquiryId: null
    }
  },
  mounted() {
    this.loadInquiries()
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
        this.inquiries = response.data.inquiries
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
        endDate: ''
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
    
    async quickQuote(inquiry) {
      // 快速报价功能 - 直接打开详情页面
      this.viewDetail(inquiry.id)
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
    
    async deleteInquiry(inquiry) {
      try {
        await this.$confirm(
          this.$t('admin.inquiry.confirm.delete') || `确定要删除询价单 "${inquiry.title}" 吗？此操作不可恢复。`,
          this.$t('admin.inquiry.confirm.deleteTitle') || '确认删除',
          {
            confirmButtonText: this.$t('common.confirm') || '确定',
            cancelButtonText: this.$t('common.cancel') || '取消',
            type: 'warning'
          }
        )
        
        await this.$api.deleteWithErrorHandler(`/admin/inquiries/${inquiry.id}`, {
          fallbackKey: 'admin.inquiry.error.deleteFailed'
        })
        
        this.$messageHandler.showSuccess(
          this.$t('admin.inquiry.success.deleted') || '询价单删除成功',
          'admin.inquiry.success.deleted'
        )
        this.loadInquiries()
      } catch (error) {
        if (error !== 'cancel') {
          // 错误已经被统一处理
        }
      }
    },
    
    handleStatusUpdated() {
      this.loadInquiries()
    },
    
    handleQuoteUpdated() {
      this.loadInquiries()
    },
    
    getStatusType(status) {
      const statusMap = {
        pending: 'warning',
        quoted: 'info',
        approved: 'success',
        rejected: 'danger',
        completed: 'success'
      }
      return statusMap[status] || 'info'
    },
    
    getStatusText(status) {
      const statusMap = {
        pending: this.$t('inquiry.status.pending') || '待处理',
        quoted: this.$t('inquiry.status.quoted') || '已报价',
        approved: this.$t('inquiry.status.approved') || '已批准',
        rejected: this.$t('inquiry.status.rejected') || '已拒绝',
        completed: this.$t('inquiry.status.completed') || '已完成'
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
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_mixins.scss';

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

    .pagination-wrapper {
      margin-top: 20px;
      text-align: right;
    }
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
}
</style>