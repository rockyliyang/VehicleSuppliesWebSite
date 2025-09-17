<template>
  <div class="admin-categories">
    <div class="page-header">
      <h2>分类管理</h2>
      <el-button type="primary" @click="handleAdd">添加分类</el-button>
    </div>

    <!-- 分类表格 -->
    <el-table v-loading="loading" :data="paginatedCategoryList" border style="width: 100%" row-key="id" default-expand-all
      :default-sort="{prop: 'sort_order', order: 'ascending'}" @sort-change="handleSortChange">
      <el-table-column prop="id" label="ID" width="80" sortable="custom" />
      <el-table-column prop="name" label="分类名称" min-width="200" sortable="custom">
        <template #default="{row}">
          <span :style="{ paddingLeft: (row._level || 0) * 20 + 'px' }" class="category-name">
            <span v-if="row._level > 0" class="tree-indent">└─</span>
            {{ row.name }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="code" label="分类编码" width="150" sortable="custom" />
      <el-table-column prop="parent_id" label="父级分类" width="150">
        <template #default="{row}">
          <span v-if="row.parent_id">{{ getParentCategoryName(row.parent_id) }}</span>
          <span v-else class="text-muted">顶级分类</span>
        </template>
      </el-table-column>
      <el-table-column prop="sort_order" label="排序" width="100" sortable="custom" />
      <el-table-column prop="status" label="状态" width="100" sortable="custom">
        <template #default="{row}">
          <el-tag :type="row.status === 'on_shelf' ? 'success' : 'info'">
            {{ row.status === 'on_shelf' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{row}">
          <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="totalCategories"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 分类表单对话框 -->
    <el-dialog :title="dialogStatus === 'create' ? '添加分类' : '编辑分类'" v-model="dialogVisible" width="500px">
      <el-form :model="categoryForm" :rules="rules" ref="categoryForm" label-width="100px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类编码" prop="code">
          <el-input v-model="categoryForm.code" placeholder="请输入分类编码" maxlength="32" show-word-limit />
        </el-form-item>
        <el-form-item label="父级分类" prop="parent_id">
          <el-tree-select
             v-model="categoryForm.parent_id"
             :data="treeSelectOptions"
             :props="{ value: 'id', label: 'name', children: 'children' }"
             placeholder="请选择父级分类"
             style="width: 100%"
             clearable
             check-strictly
             node-key="id"
             default-expand-all
           />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="categoryForm.sort_order" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="categoryForm.status">
            <el-radio label="on_shelf">启用</el-radio>
            <el-radio label="off_shelf">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" v-model="categoryForm.description" :rows="3" placeholder="请输入分类描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'AdminCategories',
  data() {
    return {
      loading: false,
      submitLoading: false,
      dialogVisible: false,
      dialogStatus: 'create',
      categoryList: [],
      parentOptions: [],
      // 分页相关
      currentPage: 1,
      pageSize: 20,
      totalCategories: 0,
      // 排序相关
      sortProp: 'sort_order',
      sortOrder: 'ascending',
      categoryForm: {
        id: undefined,
        name: '',
        code: '',
        parent_id: 0,
        sort_order: 0,
        description: '',
        status: "on_shelf"
      },
      rules: {
        name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
        code: [
          { required: true, message: '请输入分类编码', trigger: 'blur' },
          { max: 32, message: '分类编码不能超过32个字符', trigger: 'blur' }
        ],
        sort_order: [{ required: true, message: '请输入排序值', trigger: 'blur' }]
      }
    }
  },
  computed: {
    // 构建树形结构的分类列表
    treeStructuredList() {
      const buildTree = (parentId = null, level = 0) => {
        return this.categoryList
          .filter(item => item.parent_id === parentId)
          .sort((a, b) => {
            if (this.sortProp) {
              let aVal = a[this.sortProp]
              let bVal = b[this.sortProp]
              
              if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase()
                bVal = bVal.toLowerCase()
              }
              
              if (this.sortOrder === 'ascending') {
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
              } else {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
              }
            }
            return 0
          })
          .reduce((acc, item) => {
            // 添加当前项目，包含层级信息
            acc.push({ ...item, _level: level })
            // 递归添加子项目
            const children = buildTree(item.id, level + 1)
            acc.push(...children)
            return acc
          }, [])
      }
      
      return buildTree()
    },
    // 分页后的分类列表
    paginatedCategoryList() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.treeStructuredList.slice(start, end)
    },
    // 更新总数为树形列表的长度
    totalCategoriesComputed() {
      return this.treeStructuredList.length
    },
    // 树形选择器选项
    treeSelectOptions() {
      // 添加"无父级分类"选项
      const options = [{
        id: null,
        name: '无父级分类',
        children: []
      }]
      
      // 构建树形结构
      const buildTree = (parentId = null) => {
        return this.categoryList
          .filter(item => item.parent_id === parentId && item.id !== this.categoryForm.id)
          .map(item => ({
            id: item.id,
            name: item.name,
            children: buildTree(item.id)
          }))
      }
      
      options.push(...buildTree())
      return options
    }
  },
  created() {
    this.fetchCategories()
  },
  mounted() {
    // 检查是否有查询参数要求自动打开添加对话框
    if (this.$route.query.add === 'true') {
      this.$nextTick(() => {
        this.handleAdd()
      })
    }
  },
  methods: {
    // 获取分类列表
    async fetchCategories() {
      this.loading = true
      try {
        const response = await this.$api.get('categories')
        this.categoryList = response.data
        this.$nextTick(() => {
          this.totalCategories = this.totalCategoriesComputed
        })
        this.parentOptions = this.categoryList.filter(item => !item.parent_id)
      } catch (error) {
        console.error('获取分类列表失败:', error)
        this.$messageHandler.showError(error, 'admin.categories.error.fetchFailed')
      } finally {
        this.loading = false
      }
    },
    
    // 获取父级分类名称
    getParentCategoryName(parentId) {
      if (!parentId) return ''
      const parent = this.categoryList.find(item => item.id === parentId)
      return parent ? parent.name : '未知分类'
    },
    
    // 处理排序变化
    handleSortChange({ prop, order }) {
      this.sortProp = prop
      this.sortOrder = order
      this.currentPage = 1 // 排序后回到第一页
    },
    
    // 处理页面大小变化
    handleSizeChange(newSize) {
      this.pageSize = newSize
      this.currentPage = 1
    },
    
    // 处理当前页变化
    handleCurrentChange(newPage) {
      this.currentPage = newPage
    },
    
    // 添加分类
    handleAdd() {
      this.dialogStatus = 'create'
      this.categoryForm = {
        id: undefined,
        name: '',
        code: '',
        parent_id: 0,
        sort_order: 0,
        description: '',
        status: 'on_shelf'
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.categoryForm.clearValidate()
      })
    },
    
    // 编辑分类
    handleEdit(row) {
      this.dialogStatus = 'update'
      this.categoryForm = Object.assign({}, row)
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.categoryForm.clearValidate()
      })
    },
    
    // 删除分类
    handleDelete(row) {
      // 检查是否有子分类
      const hasChildren = this.categoryList.some(item => item.parent_id === row.id)
      if (hasChildren) {
        this.$messageHandler.showWarning('该分类下有子分类，无法删除', 'admin.categories.warning.hasChildren')
        return
      }
      
      this.$confirm('确认删除该分类吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const response = await this.$api.delete(`categories/${row.id}`)
          // response已经是标准格式，成功消息已在api.js中处理
          this.$messageHandler.showSuccess(response.message || '删除成功', 'category.success.deleteSuccess')
          this.fetchCategories()
        } catch (error) {
          console.error('删除分类失败:', error)
          this.$messageHandler.showError(error, 'admin.categories.error.deleteFailed')
        }
      }).catch(() => {})
    },
    
    // 提交表单
    submitForm() {
      this.$refs.categoryForm.validate(async valid => {
        if (valid) {
          this.submitLoading = true
          try {
            let response
            if (this.dialogStatus === 'create') {
              response = await this.$api.postWithErrorHandler('categories', this.categoryForm)
            } else {
              response = await this.$api.put(`categories/${this.categoryForm.id}`, this.categoryForm)
            }
            
            // response已经是标准格式，成功消息已在api.js中处理
            this.$messageHandler.showSuccess(response.message || (this.dialogStatus === 'create' ? '添加成功' : '更新成功'), this.dialogStatus === 'create' ? 'category.success.createSuccess' : 'category.success.updateSuccess')
            this.dialogVisible = false
            this.fetchCategories()
          } catch (error) {
            console.error(this.dialogStatus === 'create' ? '添加分类失败:' : '更新分类失败:', error)
            this.$messageHandler.showError(error, this.dialogStatus === 'create' ? 'admin.categories.error.createFailed' : 'admin.categories.error.updateFailed')
          } finally {
            this.submitLoading = false
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.admin-categories {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.text-muted {
  color: #909399;
  font-style: italic;
}

.category-name {
  display: inline-block;
  width: 100%;
}

.tree-indent {
  color: #909399;
  margin-right: 5px;
  font-family: monospace;
}

:deep(.el-table) {
  .el-table__header-wrapper {
    .el-table__header {
      th {
        background-color: #f5f7fa;
      }
    }
  }
}

:deep(.el-pagination) {
  .btn-prev,
  .btn-next,
  .el-pager li {
    min-width: 32px;
    height: 32px;
    line-height: 30px;
  }
}
</style>