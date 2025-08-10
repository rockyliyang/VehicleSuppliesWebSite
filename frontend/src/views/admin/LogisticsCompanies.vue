<template>
  <div class="logistics-companies">
    <div class="page-header">
      <h1>{{ $t('logistics.management.title') || '物流公司管理' }}</h1>
      <p>{{ $t('logistics.management.description') || '管理物流公司信息，添加、编辑和删除物流公司' }}</p>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :model="filters" inline>
        <el-form-item :label="$t('logistics.filter.status') || '状态'">
          <el-select v-model="filters.status" :placeholder="$t('logistics.filter.status_placeholder') || '选择状态'" clearable
            style="width: 150px;" @change="loadCompanies">
            <el-option value="active" :label="$t('logistics.status.active') || '启用'" />
            <el-option value="inactive" :label="$t('logistics.status.inactive') || '禁用'" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('logistics.filter.search') || '搜索'">
          <el-input 
            v-model="filters.search" 
            :placeholder="$t('logistics.filter.search_placeholder') || '公司名称...'"
            @input="debounceSearch"
            style="width: 200px;"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilters">{{ $t('common.reset') || '重置' }}</el-button>
          <el-button type="success" @click="loadCompanies" :loading="loading">
            <el-icon>
              <Refresh />
            </el-icon>
            {{ $t('common.refresh') || '刷新' }}
          </el-button>
          <el-button type="primary" @click="showCreateModal">
            <el-icon>
              <Plus />
            </el-icon>
            {{ $t('logistics.action.add') || '添加公司' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 公司列表 -->
    <el-card class="companies-list-card">
      <el-table v-loading="loading" :data="companies" stripe>
        <el-table-column prop="id" :label="$t('logistics.table.id') || 'ID'" width="80" />
        <el-table-column prop="name" :label="$t('logistics.table.name') || '公司名称'" min-width="150" />
        <el-table-column :label="$t('logistics.table.description') || '描述'" min-width="200">
          <template #default="{ row }">
            {{ row.description || $t('logistics.table.no_description') || '无描述' }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('logistics.table.contact_phone') || '联系电话'" width="150">
          <template #default="{ row }">
            {{ row.contact_phone || '-' }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('logistics.table.contact_email') || '联系邮箱'" width="180">
          <template #default="{ row }">
            {{ row.contact_email || '-' }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('logistics.table.website') || '官网'" width="150">
          <template #default="{ row }">
            <a v-if="row.website" :href="row.website" target="_blank" class="website-link">
              {{ row.website }}
            </a>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('logistics.table.status') || '状态'" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.is_active)">{{ formatStatus(row.is_active) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" :label="$t('logistics.table.created_at') || '创建时间'" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('logistics.table.actions') || '操作'" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editCompany(row)">
              {{ $t('logistics.action.edit') || '编辑' }}
            </el-button>
            <el-button type="danger" size="small" @click="deleteCompany(row)">
              {{ $t('logistics.action.delete') || '删除' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination 
          v-model:current-page="currentPage" 
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]" 
          :total="totalRecords" 
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange" 
          @current-change="handleCurrentChange" 
        />
      </div>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog 
      v-model="showModal" 
      :title="isEditing ? ($t('logistics.dialog.edit_title') || '编辑公司') : ($t('logistics.dialog.add_title') || '添加新公司')"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="companyForm" label-width="100px" @submit.prevent="saveCompany">
        <el-form-item :label="$t('logistics.form.name') || '公司名称'" required>
          <el-input 
            v-model="companyForm.name" 
            :placeholder="$t('logistics.form.name_placeholder') || '请输入公司名称'"
            required
          />
        </el-form-item>

        <el-form-item :label="$t('logistics.form.description') || '描述'">
          <el-input 
            v-model="companyForm.description" 
            type="textarea"
            :placeholder="$t('logistics.form.description_placeholder') || '请输入公司描述'"
            :rows="4"
          />
        </el-form-item>

        <el-form-item :label="$t('logistics.form.contact_phone') || '联系电话'">
          <el-input 
            v-model="companyForm.contact_phone" 
            :placeholder="$t('logistics.form.contact_phone_placeholder') || '请输入联系电话'"
          />
        </el-form-item>

        <el-form-item :label="$t('logistics.form.contact_email') || '联系邮箱'">
          <el-input 
            v-model="companyForm.contact_email" 
            :placeholder="$t('logistics.form.contact_email_placeholder') || '请输入联系邮箱'"
          />
        </el-form-item>

        <el-form-item :label="$t('logistics.form.website') || '官网'">
          <el-input 
            v-model="companyForm.website" 
            :placeholder="$t('logistics.form.website_placeholder') || '请输入官网地址'"
          />
        </el-form-item>

        <el-form-item :label="$t('logistics.form.status') || '状态'" required>
          <el-select v-model="companyForm.is_active" style="width: 100%">
            <el-option :value="true" :label="$t('logistics.status.active') || '启用'" />
            <el-option :value="false" :label="$t('logistics.status.inactive') || '禁用'" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeModal">
          {{ $t('common.cancel') || '取消' }}
        </el-button>
        <el-button type="primary" @click="saveCompany" :loading="isSaving">
          {{ isSaving ? ($t('common.saving') || '保存中...') : ($t('common.save') || '保存') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 空状态 -->
    <el-empty v-if="!loading && companies.length === 0" :description="$t('logistics.empty.description') || '暂无物流公司数据'" />
  </div>
</template>

<script>
import { Refresh, Plus } from '@element-plus/icons-vue'

export default {
  name: 'LogisticsCompanies',
  components: {
    Refresh,
    Plus
  },
  data() {
    return {
      companies: [],
      loading: false,
      isSaving: false,
      showModal: false,
      isEditing: false,
      currentPage: 1,
      totalPages: 1,
      totalRecords: 0,
      pageSize: 20,
      searchTimeout: null,
      filters: {
        status: '',
        search: ''
      },
      companyForm: {
        id: null,
        name: '',
        description: '',
        contact_phone: '',
        contact_email: '',
        website: '',
        is_active: true
      }
    }
  },
  mounted() {
    this.loadCompanies()
  },
  methods: {
    async loadCompanies() {
      this.loading = true
      try {
        const params = new URLSearchParams({
          page: this.currentPage,
          limit: this.pageSize,
          ...this.filters
        })

        const response = await this.$api.getWithErrorHandler(`/order-management/admin/logistics-companies?${params}`, {
          fallbackKey: 'logistics.error.fetchCompaniesFailed'
        })

        if (response.success) {
          this.companies = response.data.companies
          this.totalPages = response.data.pagination.pages
          this.totalRecords = response.data.pagination.total
        }
      } catch (error) {
        console.error('Error loading companies:', error)
      } finally {
        this.loading = false
      }
    },

    showCreateModal() {
      this.isEditing = false
      this.companyForm = {
        id: null,
        name: '',
        description: '',
        contact_phone: '',
        contact_email: '',
        website: '',
        is_active: true
      }
      this.showModal = true
    },

    editCompany(company) {
      this.isEditing = true
      this.companyForm = {
        id: company.id,
        name: company.name,
        description: company.description || '',
        contact_phone: company.contact_phone || '',
        contact_email: company.contact_email || '',
        website: company.website || '',
        is_active: company.is_active
      }
      this.showModal = true
    },

    async saveCompany() {
      this.isSaving = true
      try {
        const companyData = {
          name: this.companyForm.name,
          description: this.companyForm.description,
          contact_phone: this.companyForm.contact_phone,
          contact_email: this.companyForm.contact_email,
          website: this.companyForm.website,
          is_active: this.companyForm.is_active
        }

        let response
        if (this.isEditing) {
          response = await this.$api.putWithErrorHandler(`/order-management/admin/logistics-companies/${this.companyForm.id}`, companyData, {
            fallbackKey: 'logistics.error.updateFailed'
          })
        } else {
          response = await this.$api.postWithErrorHandler('/order-management/admin/logistics-companies', companyData, {
            fallbackKey: 'logistics.error.createFailed'
          })
        }

        if (response.success) {
          this.closeModal()
          this.loadCompanies()
          this.$message.success(this.$t(response.message))
        }
      } catch (error) {
        console.error('Error saving company:', error)
      } finally {
        this.isSaving = false
      }
    },

    async deleteCompany(company) {
      try {
        await this.$confirm(
          this.$t('logistics.confirm.delete_message', { name: company.name }) || `确定要删除"${company.name}"吗？`,
          this.$t('logistics.confirm.delete_title') || '确认删除',
          {
            confirmButtonText: this.$t('common.confirm') || '确定',
            cancelButtonText: this.$t('common.cancel') || '取消',
            type: 'warning'
          }
        )

        const response = await this.$api.deleteWithErrorHandler(`/order-management/admin/logistics-companies/${company.id}`, {
          fallbackKey: 'logistics.error.deleteFailed'
        })

        if (response.success) {
          this.loadCompanies()
          this.$message.success(this.$t(response.message))
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Error deleting company:', error)
        }
      }
    },

    closeModal() {
      this.showModal = false
      this.isEditing = false
      this.companyForm = {
        id: null,
        name: '',
        description: '',
        contact_phone: '',
        contact_email: '',
        website: '',
        is_active: true
      }
    },

    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
        this.loadCompanies()
      }
    },

    handleSizeChange(newSize) {
      this.pageSize = newSize
      this.currentPage = 1
      this.loadCompanies()
    },

    handleCurrentChange(newPage) {
      this.currentPage = newPage
      this.loadCompanies()
    },

    resetFilters() {
      this.filters = {
        status: '',
        search: ''
      }
      this.currentPage = 1
      this.loadCompanies()
    },

    debounceSearch() {
      clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(() => {
        this.currentPage = 1
        this.loadCompanies()
      }, 500)
    },

    formatStatus(isActive) {
      return isActive ? (this.$t('logistics.status.active') || '启用') : (this.$t('logistics.status.inactive') || '禁用')
    },

    getStatusType(isActive) {
      return isActive ? 'success' : 'info'
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString()
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_mixins.scss';

.logistics-companies {
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

  .companies-list-card {
    .pagination-wrapper {
      margin-top: 20px;
      text-align: right;
    }

    .website-link {
      color: #409eff;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

@include mobile {
  .logistics-companies {
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

    .companies-list-card {
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