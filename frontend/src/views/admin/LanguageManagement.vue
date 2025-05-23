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
                    <el-option v-for="lang in supportedLanguages" :key="lang" :label="getLanguageDisplay(lang)"
                        :value="lang" />
                </el-select>

                <el-input v-model="searchKeyword" placeholder="搜索翻译键或内容" clearable
                    style="width: 300px; margin-left: 10px" @input="handleFilterChange" />
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
                <el-table-column label="操作" width="150" fixed="right">
                    <template #default="{row}">
                        <el-button type="primary" size="small" @click="showEditDialog(row)">编辑</el-button>
                        <el-button type="danger" size="small" @click="confirmDelete(row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="pagination-container">
                <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                    :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
                    :total="filteredTranslations.length" @size-change="handleSizeChange"
                    @current-change="handleCurrentChange" />
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
                        <el-option v-for="lang in supportedLanguages" :key="lang" :label="getLanguageDisplay(lang)"
                            :value="lang" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'LanguageManagement',
  setup() {
    // 数据加载状态
    const loading = ref(false)
    
    // 翻译列表
    const translations = ref([])
    
    // 支持的语言列表
    const supportedLanguages = ref(['zh-CN', 'en'])
    
    // 语言显示名称映射
    const languageDisplayMap = {
      'zh-CN': '中文',
      'en': 'English'
    }
    
    // 获取语言显示名称
    const getLanguageDisplay = (lang) => {
      return languageDisplayMap[lang] || lang
    }
    
    // 筛选条件
    const filterLang = ref('')
    const searchKeyword = ref('')
    
    // 分页
    const currentPage = ref(1)
    const pageSize = ref(10)
    
    // 筛选后的翻译列表
    const filteredTranslations = computed(() => {
      let result = translations.value
      
      // 按语言筛选
      if (filterLang.value) {
        result = result.filter(item => item.lang === filterLang.value)
      }
      
      // 按关键词搜索
      if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase()
        result = result.filter(item => 
          item.code.toLowerCase().includes(keyword) || 
          item.value.toLowerCase().includes(keyword)
        )
      }
      
      return result
    })
    
    // 分页后的翻译列表
    const paginatedTranslations = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return filteredTranslations.value.slice(start, end)
    })
    
    // 添加翻译对话框
    const addDialogVisible = ref(false)
    const translationFormRef = ref(null)
    const translationForm = reactive({
      code: '',
      lang: '',
      value: ''
    })
    const translationRules = {
      code: [{ required: true, message: '请输入翻译键', trigger: 'blur' }],
      lang: [{ required: true, message: '请选择语言', trigger: 'change' }],
      value: [{ required: true, message: '请输入翻译内容', trigger: 'blur' }]
    }
    
    // 编辑翻译对话框
    const editDialogVisible = ref(false)
    const editFormRef = ref(null)
    const editForm = reactive({
      id: null,
      code: '',
      lang: '',
      value: ''
    })
    const editRules = {
      value: [{ required: true, message: '请输入翻译内容', trigger: 'blur' }]
    }
    
    // 加载翻译列表
    const loadTranslations = async () => {
      loading.value = true
      try {
        const response = await window.$api.get('/api/language/admin/translations')
        if (response.data.success) {
          translations.value = response.data.data
        } else {
          ElMessage.error(response.data.message || '加载翻译失败')
        }
      } catch (error) {
        console.error('加载翻译失败:', error)
        ElMessage.error('加载翻译失败')
      } finally {
        loading.value = false
      }
    }
    
    // 加载支持的语言列表
    const loadSupportedLanguages = async () => {
      try {
        const response = await window.$api.get('/api/language/supported')
        if (response.data.success) {
          supportedLanguages.value = response.data.data
        }
      } catch (error) {
        console.error('加载支持的语言列表失败:', error)
      }
    }
    
    // 显示添加对话框
    const showAddDialog = () => {
      translationForm.code = ''
      translationForm.lang = ''
      translationForm.value = ''
      addDialogVisible.value = true
      // 等待DOM更新后重置表单验证
      setTimeout(() => {
        translationFormRef.value?.resetFields()
      }, 0)
    }
    
    // 提交添加翻译
    const submitTranslation = async () => {
      if (!translationFormRef.value) return
      
      await translationFormRef.value.validate(async (valid) => {
        if (valid) {
          try {
            const response = await window.$api.post('/api/language/admin/translations', translationForm)
            if (response.data.success) {
              ElMessage.success('添加翻译成功')
              addDialogVisible.value = false
              loadTranslations() // 重新加载列表
            } else {
              ElMessage.error(response.data.message || '添加翻译失败')
            }
          } catch (error) {
            console.error('添加翻译失败:', error)
            ElMessage.error('添加翻译失败')
          }
        }
      })
    }
    
    // 显示编辑对话框
    const showEditDialog = (row) => {
      editForm.id = row.id
      editForm.code = row.code
      editForm.lang = row.lang
      editForm.value = row.value
      editDialogVisible.value = true
      // 等待DOM更新后重置表单验证
      setTimeout(() => {
        editFormRef.value?.resetFields()
      }, 0)
    }
    
    // 更新翻译
    const updateTranslation = async () => {
      if (!editFormRef.value) return
      
      await editFormRef.value.validate(async (valid) => {
        if (valid) {
          try {
            const response = await window.$api.put(`/api/language/admin/translations/${editForm.id}`, {
              value: editForm.value
            })
            if (response.data.success) {
              ElMessage.success('更新翻译成功')
              editDialogVisible.value = false
              loadTranslations() // 重新加载列表
            } else {
              ElMessage.error(response.data.message || '更新翻译失败')
            }
          } catch (error) {
            console.error('更新翻译失败:', error)
            ElMessage.error('更新翻译失败')
          }
        }
      })
    }
    
    // 确认删除
    const confirmDelete = (row) => {
      ElMessageBox.confirm(
        `确定要删除翻译 "${row.code}" (${getLanguageDisplay(row.lang)}) 吗？`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          const response = await window.$api.delete(`/api/language/admin/translations/${row.id}`)
          if (response.data.success) {
            ElMessage.success('删除翻译成功')
            loadTranslations() // 重新加载列表
          } else {
            ElMessage.error(response.data.message || '删除翻译失败')
          }
        } catch (error) {
          console.error('删除翻译失败:', error)
          ElMessage.error('删除翻译失败')
        }
      }).catch(() => {
        // 取消删除，不做任何操作
      })
    }
    
    // 处理筛选条件变化
    const handleFilterChange = () => {
      currentPage.value = 1 // 重置到第一页
    }
    
    // 处理每页显示数量变化
    const handleSizeChange = (val) => {
      pageSize.value = val
      currentPage.value = 1 // 重置到第一页
    }
    
    // 处理页码变化
    const handleCurrentChange = (val) => {
      currentPage.value = val
    }
    
    // 组件挂载时加载数据
    onMounted(() => {
      loadTranslations()
      loadSupportedLanguages()
    })
    
    return {
      loading,
      translations,
      supportedLanguages,
      getLanguageDisplay,
      filterLang,
      searchKeyword,
      currentPage,
      pageSize,
      filteredTranslations,
      paginatedTranslations,
      addDialogVisible,
      translationFormRef,
      translationForm,
      translationRules,
      editDialogVisible,
      editFormRef,
      editForm,
      editRules,
      showAddDialog,
      submitTranslation,
      showEditDialog,
      updateTranslation,
      confirmDelete,
      handleFilterChange,
      handleSizeChange,
      handleCurrentChange
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
</style>