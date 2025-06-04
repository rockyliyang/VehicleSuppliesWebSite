<template>
  <div class="language-management">
    <h1>语言翻译管理</h1>

    <el-card class="language-card">
      <template #header>
        <div class="card-header">
          <span>翻译管理</span>
          <el-button type="primary" @click="showAddDialog">添加翻译</el-button>
        </div>
      </template>

      <!-- 语言筛选 -->
      <div class="filter-container">
        <el-select v-model="filterLang" placeholder="选择语言" clearable @change="handleFilterChange">
          <el-option v-for="lang in supportedLanguages" :key="lang" :label="getLanguageDisplay(lang)" :value="lang" />
        </el-select>

        <el-input v-model="searchKeyword" placeholder="搜索翻译键或内容" clearable style="width: 300px; margin-left: 10px"
          @input="handleFilterChange" />
      </div>

      <!-- 翻译列表 -->
      <el-table :data="filteredTranslations" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="code" label="翻译键" width="200" />
        <el-table-column prop="lang" label="语言" width="100">
          <template #default="{row}">
            {{ getLanguageDisplay(row.lang) }}
          </template>
        </el-table-column>
        <el-table-column prop="value" label="翻译内容">
          <template #default="{row}">
            <div class="translation-value">{{ row.value }}</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{row}">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="showEditDialog(row)">编辑</el-button>
              <el-button type="danger" size="small" @click="confirmDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper" :total="filteredTranslations.length"
          @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <!-- 添加翻译对话框 -->
    <el-dialog v-model="addDialogVisible" title="添加翻译" width="500px">
      <el-form :model="translationForm" :rules="translationRules" ref="translationFormRef" label-width="100px">
        <el-form-item label="翻译键" prop="code">
          <el-input v-model="translationForm.code" placeholder="输入翻译键，如：home, products" />
        </el-form-item>
        <el-form-item label="语言" prop="lang">
          <el-select v-model="translationForm.lang" placeholder="选择语言">
            <el-option v-for="lang in supportedLanguages" :key="lang" :label="getLanguageDisplay(lang)" :value="lang" />
          </el-select>
        </el-form-item>
        <el-form-item label="翻译内容" prop="value">
          <el-input v-model="translationForm.value" type="textarea" :rows="3" placeholder="输入翻译内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitTranslation">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑翻译对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑翻译" width="500px">
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px">
        <el-form-item label="翻译键">
          <el-input v-model="editForm.code" disabled />
        </el-form-item>
        <el-form-item label="语言">
          <el-input :value="getLanguageDisplay(editForm.lang)" disabled />
        </el-form-item>
        <el-form-item label="翻译内容" prop="value">
          <el-input v-model="editForm.value" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="updateTranslation">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessageBox } from 'element-plus'

export default {
  name: 'LanguageManagement',
  data() {
    return {
      // 数据加载状态
      loading: false,
      
      // 翻译列表
      translations: [],
      
      // 支持的语言列表
      supportedLanguages: ['zh-CN', 'en'],
      
      // 语言显示名称映射
      languageDisplayMap: {
        'zh-CN': '中文',
        'en': 'English'
      },
      
      // 筛选条件
      filterLang: '',
      searchKeyword: '',
      
      // 分页
      currentPage: 1,
      pageSize: 10,
      
      // 添加翻译对话框
      addDialogVisible: false,
      translationForm: {
        code: '',
        lang: '',
        value: ''
      },
      translationRules: {
        code: [{ required: true, message: '请输入翻译键', trigger: 'blur' }],
        lang: [{ required: true, message: '请选择语言', trigger: 'change' }],
        value: [{ required: true, message: '请输入翻译内容', trigger: 'blur' }]
      },
      
      // 编辑翻译对话框
      editDialogVisible: false,
      editForm: {
        id: null,
        code: '',
        lang: '',
        value: ''
      },
      editRules: {
        value: [{ required: true, message: '请输入翻译内容', trigger: 'blur' }]
      }
    }
  },
  computed: {
    // 筛选后的翻译列表
    filteredTranslations() {
      let result = this.translations
      
      // 按语言筛选
      if (this.filterLang) {
        result = result.filter(item => item.lang === this.filterLang)
      }
      
      // 按关键词搜索
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase()
        result = result.filter(item => 
          item.code.toLowerCase().includes(keyword) || 
          item.value.toLowerCase().includes(keyword)
        )
      }
      
      return result
    },
    
    // 分页后的翻译列表
    paginatedTranslations() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredTranslations.slice(start, end)
    }
  },
  created() {
    this.loadTranslations()
    this.loadSupportedLanguages()
  },
  methods: {
    // 获取语言显示名称
    getLanguageDisplay(lang) {
      return this.languageDisplayMap[lang] || lang
    },
    
    // 加载翻译列表
    async loadTranslations() {
      this.loading = true
      try {
        const response = await this.$api.get('/language/admin/translations')
        if (response.success) {
          this.translations = response.data
        } else {
          this.$errorHandler.showError(response.message, 'admin.language.error.loadFailed')
        }
      } catch (error) {
        console.error('加载翻译失败:', error)
        this.$errorHandler.showError(error, 'admin.language.error.loadFailed')
      } finally {
        this.loading = false
      }
    },
    
    // 加载支持的语言列表
    async loadSupportedLanguages() {
      try {
        const response = await this.$api.get('/language/supported')
        if (response.success) {
          this.supportedLanguages = response.data
        }
      } catch (error) {
        console.error('加载支持的语言列表失败:', error)
      }
    },
    
    // 显示添加对话框
    showAddDialog() {
      this.translationForm.code = ''
      this.translationForm.lang = ''
      this.translationForm.value = ''
      this.addDialogVisible = true
      // 等待DOM更新后重置表单验证
      this.$nextTick(() => {
        this.$refs.translationFormRef?.resetFields()
      })
    },
    
    // 提交添加翻译
    async submitTranslation() {
      if (!this.$refs.translationFormRef) return
      
      await this.$refs.translationFormRef.validate(async (valid) => {
        if (valid) {
          try {
            const response = await this.$api.postWithErrorHandler('/language/admin/translations', this.translationForm)
            if (response.success) {
              this.$errorHandler.showSuccess('添加翻译成功', 'language.success.addSuccess')
              this.addDialogVisible = false
              this.loadTranslations() // 重新加载列表
            } else {
              this.$errorHandler.showError(response.message, 'admin.language.error.addFailed')
            }
          } catch (error) {
            console.error('添加翻译失败:', error)
            this.$errorHandler.showError(error, 'admin.language.error.addFailed')
          }
        }
      })
    },
    
    // 显示编辑对话框
    showEditDialog(row) {
      this.editForm.id = row.id
      this.editForm.code = row.code
      this.editForm.lang = row.lang
      this.editForm.value = row.value
      this.editDialogVisible = true
      // 等待DOM更新后重置表单验证
      this.$nextTick(() => {
        this.$refs.editFormRef?.resetFields()
      })
    },
    
    // 更新翻译
    async updateTranslation() {
      if (!this.$refs.editFormRef) return
      
      await this.$refs.editFormRef.validate(async (valid) => {
        if (valid) {
          try {
            const response = await this.$api.put(`/language/admin/translations/${this.editForm.id}`, {
              value: this.editForm.value
            })
            if (response.success) {
              this.$errorHandler.showSuccess('更新翻译成功', 'language.success.updateSuccess')
              this.editDialogVisible = false
              this.loadTranslations() // 重新加载列表
            } else {
              this.$errorHandler.showError(response.message, 'admin.language.error.updateFailed')
            }
          } catch (error) {
            console.error('更新翻译失败:', error)
            this.$errorHandler.showError(error, 'admin.language.error.updateFailed')
          }
        }
      })
    },
    
    // 确认删除
    confirmDelete(row) {
      ElMessageBox.confirm(
        `确定要删除翻译 "${row.code}" (${this.getLanguageDisplay(row.lang)}) 吗？`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          const response = await this.$api.delete(`/language/admin/translations/${row.id}`)
          if (response.success) {
            this.$errorHandler.showSuccess('删除翻译成功', 'language.success.deleteSuccess')
            this.loadTranslations() // 重新加载列表
          } else {
            this.$errorHandler.showError(response.message, 'admin.language.error.deleteFailed')
          }
        } catch (error) {
          console.error('删除翻译失败:', error)
          this.$errorHandler.showError(error, 'admin.language.error.deleteFailed')
        }
      }).catch(() => {
        // 取消删除，不做任何操作
      })
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

<style scoped>
.language-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-container {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.translation-value {
  max-height: 100px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
}
</style>