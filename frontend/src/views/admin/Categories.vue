<template>
  <div class="admin-categories">
    <div class="page-header">
      <h2>分类管理</h2>
      <el-button type="primary" @click="handleAdd">添加分类</el-button>
    </div>

    <!-- 分类表格 -->
    <el-table v-loading="loading" :data="categoryList" border style="width: 100%" row-key="id" default-expand-all>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="分类名称" min-width="200" />
      <el-table-column prop="code" label="分类编码" width="150" />
      <el-table-column prop="sort_order" label="排序" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{row}">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '启用' : '禁用' }}
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

    <!-- 分类表单对话框 -->
    <el-dialog :title="dialogStatus === 'create' ? '添加分类' : '编辑分类'" v-model="dialogVisible" width="500px">
      <el-form :model="categoryForm" :rules="rules" ref="categoryForm" label-width="100px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类编码" prop="code">
          <el-input v-model="categoryForm.code" placeholder="请输入分类编码" />
        </el-form-item>
        <el-form-item label="父级分类" prop="parent_id">
          <el-select v-model="categoryForm.parent_id" placeholder="请选择父级分类" style="width: 100%" clearable>
            <el-option label="无父级分类" :value="0" />
            <el-option v-for="item in parentOptions" :key="item.id" :label="item.name" :value="item.id"
              :disabled="item.id === categoryForm.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="categoryForm.sort_order" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="categoryForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
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
import axios from 'axios'

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
      categoryForm: {
        id: undefined,
        name: '',
        code: '',
        parent_id: 0,
        sort_order: 0,
        description: '',
        status: 1
      },
      rules: {
        name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
        code: [{ required: true, message: '请输入分类编码', trigger: 'blur' }],
        sort_order: [{ required: true, message: '请输入排序值', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.fetchCategories()
  },
  methods: {
    // 获取分类列表
    async fetchCategories() {
      this.loading = true
      try {
        const response = await axios.get('/api/categories')
        if (response.data.success) {
          this.categoryList = response.data.data
          this.parentOptions = this.categoryList.filter(item => !item.parent_id)
        }
      } catch (error) {
        console.error('获取分类列表失败:', error)
        this.$message.error('获取分类列表失败')
      } finally {
        this.loading = false
      }
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
        status: 1
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
        this.$message.warning('该分类下有子分类，无法删除')
        return
      }
      
      this.$confirm('确认删除该分类吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const response = await axios.delete(`/api/categories/${row.id}`)
          if (response.data.success) {
            this.$message.success('删除成功')
            this.fetchCategories()
          } else {
            this.$message.error(response.data.message || '删除失败')
          }
        } catch (error) {
          console.error('删除分类失败:', error)
          this.$message.error('删除分类失败')
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
              response = await axios.post('/api/categories', this.categoryForm)
            } else {
              response = await axios.put(`/api/categories/${this.categoryForm.id}`, this.categoryForm)
            }
            
            if (response.data.success) {
              this.$message.success(this.dialogStatus === 'create' ? '添加成功' : '更新成功')
              this.dialogVisible = false
              this.fetchCategories()
            } else {
              this.$message.error(response.data.message || (this.dialogStatus === 'create' ? '添加失败' : '更新失败'))
            }
          } catch (error) {
            console.error(this.dialogStatus === 'create' ? '添加分类失败:' : '更新分类失败:', error)
            this.$message.error(this.dialogStatus === 'create' ? '添加分类失败' : '更新分类失败')
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
</style>