<template>
  <div class="country-management">
    <div class="page-header">
      <h1>{{ $t('admin.country.title') || '国家管理' }}</h1>
      <p>{{ $t('admin.country.description') || '管理国家和省份信息，设置税率和运费' }}</p>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :model="filters" inline>
        <el-form-item :label="$t('admin.country.filter.search') || '搜索'">
          <el-input v-model="filters.search"
            :placeholder="$t('admin.country.filter.search_placeholder') || '搜索国家名称、ISO代码'" clearable
            style="width: 250px;" @input="handleSearchInput">
            <template #prefix>
              <el-icon>
                <Search />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item :label="$t('admin.country.filter.status') || '状态'">
          <el-select v-model="filters.status" :placeholder="$t('admin.country.filter.status_placeholder') || '选择状态'"
            clearable style="width: 150px;" @change="handleFilterChange">
            <el-option value="active" :label="$t('admin.country.status.active') || '启用'" />
            <el-option value="inactive" :label="$t('admin.country.status.inactive') || '禁用'" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilters">{{ $t('common.reset') || '重置' }}</el-button>
          <el-button type="success" @click="refreshData" :loading="refreshing">
            <el-icon>
              <Refresh />
            </el-icon>
            {{ $t('common.refresh') || '刷新' }}
          </el-button>
          <el-button type="primary" @click="showAddDialog">
            <el-icon>
              <Plus />
            </el-icon>
            {{ $t('admin.country.action.add') || '添加国家' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 国家列表 -->
    <el-card class="country-list-card">
      <el-table v-loading="loading" :data="paginatedCountries" stripe>
        <el-table-column prop="name" :label="$t('admin.country.table.name') || '国家名称'" min-width="150" />
        <el-table-column prop="tags" :label="$t('admin.country.table.tags') || '标签'" width="200">
          <template #default="{ row }">
            <div class="tags-container">
              <el-tag v-for="tag in row.tags" :key="tag.id" size="small" class="tag-item" type="info">
                {{ tag.value }}
              </el-tag>
              <span v-if="!row.tags || row.tags.length === 0" class="no-tags">{{ $t('admin.country.table.no_tags') ||
                '无标签' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="iso3" :label="$t('admin.country.table.iso3') || 'ISO3代码'" width="100" />
        <el-table-column prop="phone_code" :label="$t('admin.country.table.phone_code') || '电话代码'" width="100" />
        <el-table-column :label="$t('admin.country.table.tax_rate') || '税率'" width="100">
          <template #default="{ row }">
            {{ row.tax_rate }}%
          </template>
        </el-table-column>
        <el-table-column :label="$t('admin.country.table.shipping_rate') || '运费'" width="120">
          <template #default="{ row }">
            <span v-if="row.shipping_rate_type === 'weight_based'">
              ${{ row.shipping_rate }}/kg
            </span>
            <span v-else>
              ${{ row.shipping_rate }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('admin.country.table.status') || '状态'" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status === 'active' ? ($t('common.active') || '启用') : ($t('common.inactive') || '禁用') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="iso2" :label="$t('admin.country.table.iso2') || 'ISO2代码'" width="100" />
        <el-table-column :label="$t('admin.country.table.created_at') || '创建时间'" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('admin.country.table.actions') || '操作'" width="260" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editCountry(row)">
              {{ $t('admin.country.action.edit') || '编辑' }}
            </el-button>
            <el-button type="info" size="small" @click="manageStates(row)">
              {{ $t('admin.country.action.states') || '省份' }}
            </el-button>
            <el-button type="danger" size="small" @click="deleteCountry(row)">
              {{ $t('admin.country.action.delete') || '删除' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]" :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <!-- 添加/编辑国家对话框 -->
    <el-dialog v-model="countryDialogVisible"
      :title="isEditing ? ($t('admin.country.dialog.edit_title') || '编辑国家') : ($t('admin.country.dialog.add_title') || '添加国家')"
      width="600px" :close-on-click-modal="false">
      <el-form ref="countryFormRef" :model="countryForm" :rules="countryRules" label-width="120px">
        <el-form-item :label="$t('admin.country.form.name') || '国家名称'" prop="name">
          <el-input v-model="countryForm.name" :placeholder="$t('admin.country.form.name_placeholder') || '请输入国家名称'" />
        </el-form-item>
        <el-form-item :label="$t('admin.country.form.iso3') || 'ISO3代码'" prop="iso3">
          <el-input v-model="countryForm.iso3" :placeholder="$t('admin.country.form.iso3_placeholder') || '请输入3位ISO代码'"
            maxlength="3" />
        </el-form-item>
        <el-form-item :label="$t('admin.country.form.iso2') || 'ISO2代码'" prop="iso2">
          <el-input v-model="countryForm.iso2" :placeholder="$t('admin.country.form.iso2_placeholder') || '请输入2位ISO代码'"
            maxlength="2" />
        </el-form-item>
        <el-form-item :label="$t('admin.country.form.phone_code') || '电话代码'" prop="phone_code">
          <el-input v-model="countryForm.phone_code"
            :placeholder="$t('admin.country.form.phone_code_placeholder') || '请输入电话代码'" />
        </el-form-item>
        <el-form-item :label="$t('admin.country.form.tax_rate') || '税率 (%)'" prop="tax_rate">
          <el-input-number v-model="countryForm.tax_rate" :min="0" :max="100" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item :label="$t('admin.country.form.shipping_rate_type') || '运费类型'" prop="shipping_rate_type">
          <el-select v-model="countryForm.shipping_rate_type" style="width: 100%;">
            <el-option value="fixed" :label="$t('admin.country.shipping_type.fixed') || '固定金额'" />
            <el-option value="weight_based" :label="$t('admin.country.shipping_type.weight_based') || '按重量计费'" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('admin.country.form.shipping_rate') || '运费'" prop="shipping_rate">
          <el-input-number v-model="countryForm.shipping_rate" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item :label="$t('admin.country.form.status') || '状态'" prop="status">
          <el-select v-model="countryForm.status" style="width: 100%;">
            <el-option value="active" :label="$t('admin.country.status.active') || '启用'" />
            <el-option value="inactive" :label="$t('admin.country.status.inactive') || '禁用'" />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('admin.country.form.tags') || '标签'" prop="tags">
          <el-select v-model="countryForm.tags" multiple filterable allow-create default-first-option
            :placeholder="$t('admin.country.form.tags_placeholder') || '选择或输入标签'" :loading="tagsLoading"
            @focus="loadAvailableTags" @change="handleTagChange" style="width: 100%;">
            <el-option v-for="tag in availableTags" :key="tag.id" :label="tag.value" :value="tag.value">
            </el-option>
          </el-select>
          <div class="form-help-text">
            {{ $t('admin.country.form.tags_help') || '可以选择现有标签或输入新标签' }}
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="countryDialogVisible = false">{{ $t('common.cancel') || '取消' }}</el-button>
          <el-button type="primary" @click="saveCountry" :loading="saving">
            {{ $t('common.save') || '保存' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 省份管理对话框 -->
    <el-dialog v-model="statesDialogVisible"
      :title="`${selectedCountry?.name} - ${$t('admin.country.states.title') || '省份管理'}`" width="90%" top="5vh"
      :close-on-click-modal="false" class="states-dialog">
      <states-management v-if="statesDialogVisible && selectedCountry" :country="selectedCountry"
        @states-updated="handleStatesUpdated" />
    </el-dialog>
  </div>
</template>

<script>
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import StatesManagement from '../../components/admin/StatesManagement.vue'

export default {
  name: 'CountryManagement',
  components: {
    Search,
    Refresh,
    Plus,
    StatesManagement
  },
  data() {
    return {
      loading: false,
      refreshing: false,
      saving: false,
      countries: [],
      filters: {
        search: '',
        status: ''
      },
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      },
      countryDialogVisible: false,
      statesDialogVisible: false,
      isEditing: false,
      selectedCountry: null,
      availableTags: [],
      tagsLoading: false,
      countryForm: {
        name: '',
        iso3: '',
        iso2: '',
        phone_code: '',
        tax_rate: 0,
        shipping_rate: 0,
        shipping_rate_type: 'fixed',
        status: 'active',
        tags: []
      },
      countryRules: {
        name: [
          { required: true, message: this.$t('admin.country.validation.name_required') || '请输入国家名称', trigger: 'blur' }
        ],
        iso3: [
          { required: true, message: this.$t('admin.country.validation.iso3_required') || '请输入ISO3代码', trigger: 'blur' },
          { len: 3, message: this.$t('admin.country.validation.iso3_length') || 'ISO3代码必须为3位', trigger: 'blur' }
        ],
        iso2: [
          { required: true, message: this.$t('admin.country.validation.iso2_required') || '请输入ISO2代码', trigger: 'blur' },
          { len: 2, message: this.$t('admin.country.validation.iso2_length') || 'ISO2代码必须为2位', trigger: 'blur' }
        ]
      },
      searchTimer: null
    }
  },
  computed: {
    // 由于使用后端分页，直接返回countries数据
    paginatedCountries() {
      return this.countries || []
    }
  },
  mounted() {
    this.loadCountries()
  },
  methods: {
    async loadCountries() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          limit: this.pagination.limit
        }
        
        // 添加搜索参数
        if (this.filters.search) {
          params.search = this.filters.search
        }
        
        // 添加状态过滤参数
        if (this.filters.status) {
          params.status = this.filters.status
        }
        
        const response = await this.$api.getWithErrorHandler('/admin/countries', {
          params,
          fallbackKey: 'admin.country.error.load_failed'
        })
        
        if (response.success) {
          this.countries = response.data.countries || []
          this.pagination.total = response.data.pagination.total || 0
          this.pagination.pages = response.data.pagination.pages || 0
        }
      } catch (error) {
        console.log('refresh country fail', error)
        this.$messageHandler.showError(
          this.$t('admin.country.error.load_failed') || '加载国家数据失败',
          'admin.country.error.load_failed'
        )
      } finally {
        this.loading = false
      }
    },
    
    handleSearchInput() {
      // 防抖搜索
      if (this.searchTimer) {
        clearTimeout(this.searchTimer)
      }
      this.searchTimer = setTimeout(() => {
        this.pagination.page = 1
        this.loadCountries()
      }, 300)
    },
    
    handleFilterChange() {
      this.pagination.page = 1
      this.loadCountries()
    },
    
    resetFilters() {
      this.filters = {
        search: '',
        status: ''
      }
      this.pagination.page = 1
      this.loadCountries()
    },
    
    async refreshData() {
      this.refreshing = true
      try {
        await this.loadCountries()
        this.$messageHandler.showSuccess(
          this.$t('admin.country.success.refreshed') || '数据已刷新',
          'admin.country.success.refreshed'
        )
      } catch (error) {
        // 错误已经被统一处理
      } finally {
        this.refreshing = false
      }
    },
    
    handleSizeChange(size) {
      this.pagination.limit = size
      this.pagination.page = 1
      this.loadCountries()
    },
    
    handleCurrentChange(page) {
      this.pagination.page = page
      this.loadCountries()
    },
    
    showAddDialog() {
      this.countryForm = {
        name: '',
        iso3: '',
        iso2: '',
        phone_code: '',
        tax_rate: 0,
        shipping_rate: 0,
        shipping_rate_type: 'fixed',
        status: 'active',
        tags: []
      }
      this.isEditing = false
      this.countryDialogVisible = true
      this.loadAvailableTags()
    },
    
    editCountry(country) {
      this.isEditing = true
      this.countryForm = { 
        ...country,
        tags: country.tags ? country.tags.map(tag => tag.value) : []
      }
      this.countryDialogVisible = true
      this.loadAvailableTags()
    },
    
    handleTagChange(selectedTagValues) {
      // 获取所有可用标签的值
      const availableTagValues = this.availableTags.map(tag => tag.value)
      
      // 找出新创建的标签（不在可用标签列表中的值）
      const newTagValues = selectedTagValues.filter(value => !availableTagValues.includes(value))
      
      // 如果有新标签，需要创建它们
      if (newTagValues.length > 0) {
        this.createNewTagsAndUpdate(newTagValues, selectedTagValues)
      }
    },
    
    async createNewTagsAndUpdate(newTagValues) {
      try {
        for (const tagValue of newTagValues) {
          await this.createNewTag(tagValue)
          // createNewTag方法内部已经将新标签添加到availableTags，这里不需要重复添加
        }
        
        // 标签值已经在countryForm.tags中，无需额外处理
      } catch (error) {
        console.error('Failed to create new tags:', error)
        this.$messageHandler.showError(
          this.$t('admin.country.error.create_tag_failed') || '创建标签失败',
          'admin.country.error.create_tag_failed'
        )
      }
    },
    
    async saveCountry() {
      try {
        await this.$refs.countryFormRef.validate()
        
        this.saving = true
        
        // 将标签值转换为标签ID
        const tagIds = this.countryForm.tags.map(tagValue => {
          const tag = this.availableTags.find(t => t.value === tagValue)
          return tag ? tag.id : null
        }).filter(id => id !== null)
        
        // 准备保存的数据
        const saveData = {
          ...this.countryForm,
          tags: tagIds
        }
        // 移除原来的tags字段（标签值数组），只保留转换后的tags字段（标签ID数组）
        // saveData.tags 现在包含的是标签ID数组，这是后端期望的格式
        
        if (this.isEditing) {
          await this.$api.putWithErrorHandler(`/admin/countries/${this.countryForm.id}`, saveData, {
            fallbackKey: 'admin.country.error.update_failed'
          })
          
          this.$messageHandler.showSuccess(
            this.$t('admin.country.success.updated') || '国家信息更新成功',
            'admin.country.success.updated'
          )
        } else {
          await this.$api.postWithErrorHandler('/admin/countries', saveData, {
            fallbackKey: 'admin.country.error.create_failed'
          })
          
          this.$messageHandler.showSuccess(
            this.$t('admin.country.success.created') || '国家创建成功',
            'admin.country.success.created'
          )
        }
        
        this.countryDialogVisible = false
        await this.loadCountries() // 重新加载数据
      } catch (error) {
        // 错误已经被统一处理
      } finally {
        this.saving = false
      }
    },
    
    async deleteCountry(country) {
      try {
        await this.$confirm(
          this.$t('admin.country.confirm.delete_message') || `确定要删除国家 "${country.name}" 吗？`,
          this.$t('admin.country.confirm.delete_title') || '确认删除',
          {
            confirmButtonText: this.$t('common.confirm') || '确定',
            cancelButtonText: this.$t('common.cancel') || '取消',
            type: 'warning'
          }
        )
        
        await this.$api.deleteWithErrorHandler(`/admin/countries/${country.id}`, {
          fallbackKey: 'admin.country.error.delete_failed'
        })
        
        this.$messageHandler.showSuccess(
          this.$t('admin.country.success.deleted') || '国家删除成功',
          'admin.country.success.deleted'
        )
        
        await this.loadCountries() // 重新加载数据
      } catch (error) {
        if (error !== 'cancel') {
          // 错误已经被统一处理
        }
      }
    },
    
    manageStates(country) {
      this.selectedCountry = country
      this.statesDialogVisible = true
    },
    
    async handleStatesUpdated() {
      await this.loadCountries() // 重新加载数据
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
    
    async loadAvailableTags() {
      if (this.availableTags.length > 0) return // 避免重复加载
      
      try {
        this.tagsLoading = true
        const response = await this.$api.getWithErrorHandler('/tags/active/country', {
          fallbackKey: 'admin.country.error.load_tags_failed'
        })
        
        if (response.success) {
          this.availableTags = response.data || []
        }
      } catch (error) {
        // 错误已经被统一处理
      } finally {
        this.tagsLoading = false
      }
    },
    
    async createNewTag(tagValue) {
        const response = await this.$api.postWithErrorHandler('/tags', {
          value: tagValue,
          type: 'country'
        }, {
          fallbackKey: 'admin.country.error.create_tag_failed'
        })
        
        if (response.success) {
          // 检查标签是否已存在，避免重复添加
          const existingTag = this.availableTags.find(tag => tag.value === response.data.value)
          if (!existingTag) {
            this.availableTags.push(response.data)
          }
          return response.data
        }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_mixins.scss';

.country-management {
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

  .country-list-card {
    .pagination-wrapper {
      margin-top: 20px;
      text-align: right;
    }

    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      align-items: center;

      .tag-item {
        margin: 0;
      }

      .no-tags {
        color: #909399;
        font-size: 12px;
        font-style: italic;
      }
    }
  }

  .form-help-text {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
    line-height: 1.4;
  }
}

// 对话框样式优化
:deep(.states-dialog) {
  .el-dialog {
    max-height: 90vh;
    margin: 5vh auto;
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
}

@include mobile {
  .country-management {
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

    .country-list-card {
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