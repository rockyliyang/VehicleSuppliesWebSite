<template>
  <div class="states-management">
    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :model="filters" inline>
        <el-form-item :label="$t('admin.states.filter.search') || '搜索'">
          <el-input v-model="filters.search" :placeholder="$t('admin.states.filter.search_placeholder') || '搜索省份名称、代码'"
            clearable style="width: 250px;" @input="handleSearchInput">
            <template #prefix>
              <el-icon>
                <Search />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item :label="$t('admin.states.filter.status') || '状态'">
          <el-select v-model="filters.status" :placeholder="$t('admin.states.filter.status_placeholder') || '选择状态'"
            clearable style="width: 150px;" @change="handleFilterChange">
            <el-option value="active" :label="$t('admin.states.status.active') || '启用'" />
            <el-option value="inactive" :label="$t('admin.states.status.inactive') || '禁用'" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilters">{{ $t('common.reset') || '重置' }}</el-button>
          <el-button type="primary" @click="showAddDialog">
            <el-icon>
              <Plus />
            </el-icon>
            {{ $t('admin.states.action.add') || '添加省份' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 省份列表 -->
    <el-card class="states-list-card">
      <el-table v-loading="loading" :data="paginatedStates" stripe>
        <el-table-column prop="name" :label="$t('admin.states.table.name') || '省份名称'" min-width="150" />
        <el-table-column prop="state_code" :label="$t('admin.states.table.code') || '省份代码'" width="120" />
        <el-table-column :label="$t('admin.states.table.tax_rate') || '税率'" width="100">
          <template #default="{ row }">
            {{ row.tax_rate }}%
          </template>
        </el-table-column>
        <el-table-column :label="$t('admin.states.table.shipping_rate') || '运费'" width="120">
          <template #default="{ row }">
            <span v-if="row.shipping_rate_type === 'percentage'">
              {{ row.shipping_rate }}%
            </span>
            <span v-else>
              ${{ row.shipping_rate }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('admin.states.table.status') || '状态'" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? ($t('admin.states.status.active') || '启用') :
              ($t('admin.states.status.inactive') || '禁用') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('admin.states.table.created_at') || '创建时间'" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('admin.states.table.actions') || '操作'" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editState(row)">
              {{ $t('admin.states.action.edit') || '编辑' }}
            </el-button>
            <el-button type="danger" size="small" @click="deleteState(row)">
              {{ $t('admin.states.action.delete') || '删除' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]" :total="filteredStates.length"
          layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <!-- 添加/编辑省份对话框 -->
    <el-dialog v-model="stateDialogVisible"
      :title="isEditing ? ($t('admin.states.dialog.edit_title') || '编辑省份') : ($t('admin.states.dialog.add_title') || '添加省份')"
      width="500px" :close-on-click-modal="false">
      <el-form ref="stateFormRef" :model="stateForm" :rules="stateRules" label-width="120px">
        <el-form-item :label="$t('admin.states.form.name') || '省份名称'" prop="name">
          <el-input v-model="stateForm.name" :placeholder="$t('admin.states.form.name_placeholder') || '请输入省份名称'" />
        </el-form-item>
        <el-form-item :label="$t('admin.states.form.code') || '省份代码'" prop="state_code">
          <el-input v-model="stateForm.state_code"
            :placeholder="$t('admin.states.form.code_placeholder') || '请输入省份代码'" />
        </el-form-item>
        <el-form-item :label="$t('admin.states.form.tax_rate') || '税率 (%)'" prop="tax_rate">
          <el-input-number v-model="stateForm.tax_rate" :min="0" :max="100" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item :label="$t('admin.states.form.shipping_rate_type') || '运费类型'" prop="shipping_rate_type">
          <el-select v-model="stateForm.shipping_rate_type" style="width: 100%;">
            <el-option value="fixed" :label="$t('admin.states.shipping_type.fixed') || '固定金额'" />
            <el-option value="percentage" :label="$t('admin.states.shipping_type.percentage') || '百分比'" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('admin.states.form.shipping_rate') || '运费'" prop="shipping_rate">
          <el-input-number v-model="stateForm.shipping_rate" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item :label="$t('admin.states.form.status') || '状态'" prop="status">
          <el-select v-model="stateForm.status" style="width: 100%;">
            <el-option value="active" :label="$t('admin.states.status.active') || '启用'" />
            <el-option value="inactive" :label="$t('admin.states.status.inactive') || '禁用'" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="stateDialogVisible = false">{{ $t('common.cancel') || '取消' }}</el-button>
          <el-button type="primary" @click="saveState" :loading="saving">
            {{ $t('common.save') || '保存' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { Search,  Plus } from '@element-plus/icons-vue'
import { mapState, mapActions } from 'vuex'

export default {
  name: 'StatesManagement',
  components: {
    Search,
    Plus
  },
  props: {
    country: {
      type: Object,
      required: true
    }
  },
  emits: ['states-updated'],
  data() {
    return {
      loading: false,
      saving: false,
      filters: {
        search: '',
        status: ''
      },
      pagination: {
        page: 1,
        limit: 20
      },
      stateDialogVisible: false,
      isEditing: false,
      stateForm: {
        name: '',
        state_code: '',
        tax_rate: 0,
        shipping_rate: 0,
        shipping_rate_type: 'fixed',
        status: 'active'
      },
      stateRules: {
        name: [
          { required: true, message: this.$t('admin.states.validation.name_required') || '请输入省份名称', trigger: 'blur' }
        ],
        state_code: [
          { required: true, message: this.$t('admin.states.validation.code_required') || '请输入省份代码', trigger: 'blur' }
        ]
      },
      searchTimer: null
    }
  },
  computed: {
    ...mapState('countryState', ['countries', 'statesData']),
    
    // 从store获取当前国家的states数据
    states() {
      if (!this.country || !this.statesData) {
        return []
      }
      return this.statesData[this.country.id] || []
    },
    
    filteredStates() {
      if (!this.states || !Array.isArray(this.states)) {
        return []
      }
      
      let filtered = [...this.states]
      
      // 搜索过滤
      if (this.filters.search) {
        const search = this.filters.search.toLowerCase()
        filtered = filtered.filter(state => 
          state.name.toLowerCase().includes(search) ||
          state.state_code.toLowerCase().includes(search)
        )
      }
      
      // 状态过滤
      if (this.filters.status) {
        filtered = filtered.filter(state => state.status === this.filters.status)
      }
      
      return filtered
    },
    
    paginatedStates() {
      const start = (this.pagination.page - 1) * this.pagination.limit
      const end = start + this.pagination.limit
      return this.filteredStates.slice(start, end)
    }
  },
  mounted() {
    // 确保store中有数据，如果没有则加载
    if (!this.statesData || Object.keys(this.statesData).length === 0) {
      this.loadCountryStateData()
    }
  },
  methods: {
    ...mapActions('countryState', ['loadCountryStateData', 'refreshCountryStateData']),
    
    handleSearchInput() {
      // 防抖搜索
      if (this.searchTimer) {
        clearTimeout(this.searchTimer)
      }
      this.searchTimer = setTimeout(() => {
        this.pagination.page = 1
      }, 300)
    },
    
    handleFilterChange() {
      this.pagination.page = 1
    },
    
    resetFilters() {
      this.filters = {
        search: '',
        status: ''
      }
      this.pagination.page = 1
    },
    
    handleSizeChange(size) {
      this.pagination.limit = size
      this.pagination.page = 1
    },
    
    handleCurrentChange(page) {
      this.pagination.page = page
    },
    
    showAddDialog() {
      this.isEditing = false
      this.stateForm = {
        name: '',
        state_code: '',
        tax_rate: 0,
        shipping_rate: 0,
        shipping_rate_type: 'fixed',
        status: 'active'
      }
      this.stateDialogVisible = true
    },
    
    editState(state) {
      this.isEditing = true
      this.stateForm = { ...state }
      this.stateDialogVisible = true
    },
    
    async saveState() {
      try {
        await this.$refs.stateFormRef.validate()
        
        this.saving = true
        
        const stateData = {
          ...this.stateForm,
          country_id: this.country.id
        }
        
        if (this.isEditing) {
          await this.$api.putWithErrorHandler(`/admin/states/${this.stateForm.id}`, stateData, {
            fallbackKey: 'admin.states.error.update_failed'
          })
          
          this.$messageHandler.showSuccess(
            this.$t('admin.states.success.updated') || '省份信息更新成功',
            'admin.states.success.updated'
          )
        } else {
          await this.$api.postWithErrorHandler('/admin/states', stateData, {
            fallbackKey: 'admin.states.error.create_failed'
          })
          
          this.$messageHandler.showSuccess(
            this.$t('admin.states.success.created') || '省份创建成功',
            'admin.states.success.created'
          )
        }
        
        this.stateDialogVisible = false
        await this.refreshCountryStateData() // 强制刷新store数据
        this.$emit('states-updated') // 通知父组件更新
      } catch (error) {
        // 错误已经被统一处理
      } finally {
        this.saving = false
      }
    },
    
    async deleteState(state) {
      try {
        await this.$confirm(
          this.$t('admin.states.confirm.delete_message') || `确定要删除省份 "${state.name}" 吗？`,
          this.$t('admin.states.confirm.delete_title') || '确认删除',
          {
            confirmButtonText: this.$t('common.confirm') || '确定',
            cancelButtonText: this.$t('common.cancel') || '取消',
            type: 'warning'
          }
        )
        
        await this.$api.deleteWithErrorHandler(`/admin/states/${state.id}`, {
          fallbackKey: 'admin.states.error.delete_failed'
        })
        
        this.$messageHandler.showSuccess(
          this.$t('admin.states.success.deleted') || '省份删除成功',
          'admin.states.success.deleted'
        )
        
        await this.refreshCountryStateData() // 强制刷新store数据
        this.$emit('states-updated') // 通知父组件更新
      } catch (error) {
        if (error !== 'cancel') {
          // 错误已经被统一处理
        }
      }
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

.states-management {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;

  .filter-card {
    margin-bottom: 20px;
    flex-shrink: 0;

    .el-form {
      margin-bottom: 0;
    }
  }

  .states-list-card {
    flex: 1;
    display: flex;
    flex-direction: column;

    :deep(.el-card__body) {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .el-table {
      flex: 1;
    }

    .pagination-wrapper {
      margin-top: 20px;
      text-align: right;
      flex-shrink: 0;
    }
  }
}

@include mobile {
  .states-management {
    padding: 10px;

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

    .states-list-card {
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