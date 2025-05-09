<template>
  <div class="admin-products">
    <div class="page-header">
      <h2>产品管理</h2>
      <el-button type="primary" @click="handleAdd">添加产品</el-button>
    </div>
    
    <!-- 搜索和筛选 -->
    <div class="filter-container">
      <el-input
        v-model="filters.keyword"
        placeholder="产品名称/编号"
        style="width: 200px;"
        class="filter-item"
        @keyup.enter="handleFilter"
      />
      <el-select
        v-model="filters.category"
        placeholder="产品分类"
        clearable
        style="width: 200px"
        class="filter-item"
      >
        <el-option
          v-for="item in categoryOptions"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
      <el-select
        v-model="filters.status"
        placeholder="状态"
        clearable
        style="width: 120px"
        class="filter-item"
      >
        <el-option label="上架" value="1" />
        <el-option label="下架" value="0" />
      </el-select>
      <el-button type="primary" @click="handleFilter">
        <el-icon><Search /></el-icon>
        搜索
      </el-button>
      <el-button @click="resetFilter">
        <el-icon><Refresh /></el-icon>
        重置
      </el-button>
    </div>
    
    <!-- 产品表格 -->
    <el-table
      v-loading="loading"
      :data="productList"
      border
      style="width: 100%"
      @sort-change="handleSortChange"
    >
      <el-table-column prop="id" label="ID" width="80" sortable="custom" />
      <el-table-column label="产品图片" width="120">
        <template #default="{row}">
          <img :src="row.image" alt="产品图片" class="product-image" v-if="row.image" @error="handleImageError">
          <span v-else>无图片</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="产品名称" min-width="200" show-overflow-tooltip />
      <el-table-column prop="code" label="产品编号" width="120" />
      <el-table-column prop="category_name" label="分类" width="120" />
      <el-table-column prop="price" label="价格" width="120" sortable="custom">
        <template #default="{row}">
          <span>{{ row.price ? '¥' + row.price : '面议' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" width="100" sortable="custom" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{row}">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="160" sortable="custom">
        <template #default="{row}">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{row}">
          <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="pagination.current"
        :page-sizes="[10, 20, 30, 50]"
        :page-size="pagination.size"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
      />
    </div>
    
    <!-- 产品表单对话框 -->
    <el-dialog 
      :title="dialogStatus === 'create' ? '添加产品' : '编辑产品'" 
      v-model="dialogVisible" 
      width="700px"
    >
      <el-form :model="productForm" :rules="rules" ref="productFormRef" label-width="100px">
        <el-form-item label="产品名称" prop="name">
          <el-input v-model="productForm.name" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="产品编号" prop="code">
          <el-input v-model="productForm.code" placeholder="请输入产品编号" />
        </el-form-item>
        <el-form-item label="产品分类" prop="category_id">
          <el-select v-model="productForm.category_id" placeholder="请选择产品分类" style="width: 100%">
            <el-option
              v-for="item in categoryOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="产品价格" prop="price">
          <el-input v-model.number="productForm.price" placeholder="请输入产品价格">
            <template #prepend>¥</template>
          </el-input>
        </el-form-item>
        <el-form-item label="产品库存" prop="stock">
          <el-input-number v-model="productForm.stock" :min="0" :max="999999" />
        </el-form-item>
        <el-form-item label="产品图片" prop="image">
          <el-upload
            class="avatar-uploader"
            action="/api/upload"
            :show-file-list="false"
            :on-success="handleImageSuccess"
            :before-upload="beforeImageUpload">
            <img v-if="productForm.image" :src="productForm.image" class="avatar" @error="handleImageError">
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="产品描述" prop="description">
          <el-input type="textarea" v-model="productForm.description" :rows="4" placeholder="请输入产品描述" />
        </el-form-item>
        <el-form-item label="产品详情" prop="content">
          <el-input type="textarea" v-model="productForm.content" :rows="6" placeholder="请输入产品详情" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="productForm.status">
            <el-radio :label="1">上架</el-radio>
            <el-radio :label="0">下架</el-radio>
          </el-radio-group>
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
import { Plus } from '@element-plus/icons-vue' // eslint-disable-line no-unused-vars

export default {
  name: 'AdminProducts',
  data() {
    return {
      loading: false,
      submitLoading: false,
      dialogVisible: false,
      dialogStatus: 'create',
      productList: [],
      categoryOptions: [],
      filters: {
        keyword: '',
        category: '',
        status: ''
      },
      pagination: {
        current: 1,
        size: 10,
        total: 0
      },
      sort: {
        prop: 'id',
        order: 'descending'
      },
      productForm: {
        id: undefined,
        name: '',
        code: '',
        category_id: '',
        price: '',
        stock: 0,
        image: '',
        description: '',
        content: '',
        status: 1
      },
      rules: {
        name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
        category_id: [{ required: true, message: '请选择产品分类', trigger: 'change' }],
        price: [
          { required: true, message: '请输入产品价格', trigger: 'blur' },
          { type: 'number', message: '价格必须为数字', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.fetchCategories()
    this.fetchProducts()
  },
  methods: {
    // 获取产品分类列表
    async fetchCategories() {
      try {
        const response = await axios.get('/api/categories')
        if (response.data.success) {
          this.categoryOptions = response.data.data
        }
      } catch (error) {
        console.error('获取分类失败:', error)
        this.$message.error('获取分类失败')
      }
    },
    
    // 获取产品列表
    async fetchProducts() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.current,
          limit: this.pagination.size,
          sort_by: this.sort.prop,
          sort_order: this.sort.order === 'ascending' ? 'asc' : 'desc'
        }
        
        // 添加筛选条件
        if (this.filters.keyword) params.keyword = this.filters.keyword
        if (this.filters.category) params.category_id = this.filters.category
        if (this.filters.status !== '') params.status = this.filters.status
        
        const response = await axios.get('/api/products', { params })
        if (response.data.success) {
          this.productList = response.data.data.items
          this.pagination.total = response.data.data.total
        }
      } catch (error) {
        console.error('获取产品列表失败:', error)
        this.$message.error('获取产品列表失败')
      } finally {
        this.loading = false
      }
    },
    
    // 处理筛选
    handleFilter() {
      this.pagination.current = 1
      this.fetchProducts()
    },
    
    // 重置筛选
    resetFilter() {
      this.filters = {
        keyword: '',
        category: '',
        status: ''
      }
      this.pagination.current = 1
      this.fetchProducts()
    },
    
    // 处理排序变化
    handleSortChange(val) {
      if (val.prop) {
        this.sort.prop = val.prop
        this.sort.order = val.order
      } else {
        this.sort.prop = 'id'
        this.sort.order = 'descending'
      }
      this.fetchProducts()
    },
    
    // 处理页码变化
    handleCurrentChange(val) {
      this.pagination.current = val
      this.fetchProducts()
    },
    
    // 处理每页数量变化
    handleSizeChange(val) {
      this.pagination.size = val
      this.pagination.current = 1
      this.fetchProducts()
    },
    
    // 添加产品
    handleAdd() {
      this.dialogStatus = 'create'
      this.productForm = {
        id: undefined,
        name: '',
        code: '',
        category_id: '',
        price: '',
        stock: 0,
        image: '',
        description: '',
        content: '',
        status: 1
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.productFormRef.clearValidate()
      })
    },
    
    // 编辑产品
    handleEdit(row) {
      this.dialogStatus = 'update'
      this.productForm = Object.assign({}, row)
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.productFormRef.clearValidate()
      })
    },
    
    // 删除产品
    handleDelete(row) {
      this.$confirm('确认删除该产品吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const response = await axios.delete(`/api/products/${row.id}`)
          if (response.data.success) {
            this.$message.success('删除成功')
            this.fetchProducts()
          } else {
            this.$message.error(response.data.message || '删除失败')
          }
        } catch (error) {
          console.error('删除产品失败:', error)
          this.$message.error('删除产品失败')
        }
      }).catch(() => {})
    },
    
    // 提交表单
    submitForm() {
      this.$refs.productFormRef.validate(async valid => {
        if (valid) {
          this.submitLoading = true
          try {
            let response
            if (this.dialogStatus === 'create') {
              response = await axios.post('/api/products', this.productForm)
            } else {
              response = await axios.put(`/api/products/${this.productForm.id}`, this.productForm)
            }
            
            if (response.data.success) {
              this.$message.success(this.dialogStatus === 'create' ? '添加成功' : '更新成功')
              this.dialogVisible = false
              this.fetchProducts()
            } else {
              this.$message.error(response.data.message || (this.dialogStatus === 'create' ? '添加失败' : '更新失败'))
            }
          } catch (error) {
            console.error(this.dialogStatus === 'create' ? '添加产品失败:' : '更新产品失败:', error)
            this.$message.error(this.dialogStatus === 'create' ? '添加产品失败' : '更新产品失败')
          } finally {
            this.submitLoading = false
          }
        }
      })
    },
    
    // 图片上传成功回调
    handleImageSuccess(res, file) { // eslint-disable-line no-unused-vars
      if (res.success) {
        this.productForm.image = res.data.url
      } else {
        this.$message.error('上传失败')
      }
    },
    
    // 图片上传前验证
    beforeImageUpload(file) {
      const isJPG = file.type === 'image/jpeg'
      const isPNG = file.type === 'image/png'
      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isJPG && !isPNG) {
        this.$message.error('上传图片只能是 JPG 或 PNG 格式!')
      }
      if (!isLt2M) {
        this.$message.error('上传图片大小不能超过 2MB!')
      }
      return (isJPG || isPNG) && isLt2M
    },
    
    // 格式化日期
    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleString()
    },
    
    // 图片加载错误处理
    handleImageError(e) {
      e.target.src = require('@/assets/images/default-image.svg')
    }
  }
}
</script>

<style scoped>
.admin-products {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-container {
  margin-bottom: 20px;
}

.filter-item {
  margin-right: 10px;
  margin-bottom: 10px;
}

.product-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.avatar-uploader .el-upload:hover {
  border-color: #409EFF;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 120px;
  height: 120px;
  line-height: 120px;
  text-align: center;
}

.avatar {
  width: 120px;
  height: 120px;
  display: block;
}
</style>