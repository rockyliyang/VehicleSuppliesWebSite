<template>
  <div class="admin-suppliers">
    <div class="page-header">
      <h2>供应商管理</h2>
      <el-button type="primary" @click="handleAdd">添加供应商</el-button>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索供应商名称、联系人或邮箱"
        style="width: 300px; margin-right: 10px"
        clearable
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button @click="handleSearch">搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <!-- 供应商表格 -->
    <el-table 
      v-loading="loading" 
      :data="supplierList" 
      border 
      style="width: 100%"
      @sort-change="handleSortChange"
    >
      <el-table-column prop="id" label="ID" width="80" sortable="custom" />
      <el-table-column prop="name" label="供应商名称" min-width="150" sortable="custom" />
      <el-table-column prop="contact_person" label="联系人" width="120" />
      <el-table-column prop="email" label="邮箱" min-width="180" />
      <el-table-column prop="contact_phone1" label="电话" width="130" />
      <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
      <el-table-column prop="created_at" label="创建时间" width="160" sortable="custom">
        <template #default="{row}">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{row}">
          <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button type="info" size="small" @click="handleViewProducts(row)">产品</el-button>
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
        :total="totalSuppliers"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 供应商表单对话框 -->
    <el-dialog 
      :title="dialogStatus === 'create' ? '添加供应商' : '编辑供应商'" 
      v-model="dialogVisible" 
      width="600px"
    >
      <el-form :model="supplierForm" :rules="rules" ref="supplierForm" label-width="100px">
        <el-form-item label="供应商名称" prop="name">
          <el-input v-model="supplierForm.name" placeholder="请输入供应商名称" />
        </el-form-item>
        <el-form-item label="联系人" prop="contact_person">
          <el-input v-model="supplierForm.contact_person" placeholder="请输入联系人姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="supplierForm.email" placeholder="请输入邮箱地址" />
        </el-form-item>
        <el-form-item label="电话1" prop="contact_phone1">
          <el-input v-model="supplierForm.contact_phone1" placeholder="请输入主要电话号码" />
        </el-form-item>
        <el-form-item label="电话2" prop="contact_phone2">
          <el-input v-model="supplierForm.contact_phone2" placeholder="请输入备用电话号码" />
        </el-form-item>
        <el-form-item label="网站" prop="website">
          <el-input v-model="supplierForm.website" placeholder="请输入网站地址" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input 
            type="textarea" 
            v-model="supplierForm.address" 
            :rows="3" 
            placeholder="请输入详细地址" 
          />
        </el-form-item>
        <el-form-item label="备注" prop="notes">
          <el-input 
            type="textarea" 
            v-model="supplierForm.notes" 
            :rows="3" 
            placeholder="请输入备注信息" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 供应商产品对话框 -->
    <el-dialog 
      title="供应商产品列表" 
      v-model="productsDialogVisible" 
      width="80%"
    >
      <el-table v-loading="productsLoading" :data="supplierProducts" border>
        <el-table-column prop="id" label="产品ID" width="80" />
        <el-table-column prop="name" label="产品名称" min-width="200" />
        <el-table-column prop="code" label="产品编码" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{row}">
            <el-tag :type="row.status === 'on_shelf' ? 'success' : 'info'">
              {{ row.status === 'on_shelf' ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{row}">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import { Search } from '@element-plus/icons-vue'

export default {
  name: 'SuppliersManagement',
  components: {
    Search
  },
  data() {
    return {
      loading: false,
      submitLoading: false,
      productsLoading: false,
      dialogVisible: false,
      productsDialogVisible: false,
      dialogStatus: 'create',
      supplierList: [],
      supplierProducts: [],
      searchQuery: '',
      // 分页相关
      currentPage: 1,
      pageSize: 20,
      totalSuppliers: 0,
      // 排序相关
      sortProp: 'created_at',
      sortOrder: 'descending',
      supplierForm: {
        id: undefined,
        name: '',
        contact_person: '',
        email: '',
        contact_phone1: '',
        contact_phone2: '',
        website: '',
        address: '',
        notes: ''
      },
      rules: {
        name: [
          { required: true, message: '请输入供应商名称', trigger: 'blur' },
          { max: 100, message: '供应商名称不能超过100个字符', trigger: 'blur' }
        ],
        email: [
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ],
        contact_person: [
          { max: 50, message: '联系人姓名不能超过50个字符', trigger: 'blur' }
        ],
        phone: [
          { max: 20, message: '电话号码不能超过20个字符', trigger: 'blur' }
        ],
        address: [
          { max: 255, message: '地址不能超过255个字符', trigger: 'blur' }
        ],
        notes: [
          { max: 500, message: '备注不能超过500个字符', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.fetchSuppliers()
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
    // 获取供应商列表
    async fetchSuppliers() {
      this.loading = true
      try {
        const params = {
          page: this.currentPage,
          limit: this.pageSize,
          search: this.searchQuery,
          sortBy: this.sortProp,
          sortOrder: this.sortOrder
        }
        
        const response = await this.$api.get('suppliers', { params })
        this.supplierList = response.data.suppliers
        this.totalSuppliers = response.data.total
      } catch (error) {
        console.error('获取供应商列表失败:', error)
        this.$messageHandler.showError(error, 'SUPPLIER.GET_ALL_FAILED')
      } finally {
        this.loading = false
      }
    },
    
    // 搜索处理
    handleSearch() {
      this.currentPage = 1
      this.fetchSuppliers()
    },
    
    // 重置搜索
    handleReset() {
      this.searchQuery = ''
      this.currentPage = 1
      this.fetchSuppliers()
    },
    
    // 处理排序变化
    handleSortChange({ prop, order }) {
      this.sortProp = prop
      this.sortOrder = order
      this.currentPage = 1
      this.fetchSuppliers()
    },
    
    // 处理页面大小变化
    handleSizeChange(newSize) {
      this.pageSize = newSize
      this.currentPage = 1
      this.fetchSuppliers()
    },
    
    // 处理当前页变化
    handleCurrentChange(newPage) {
      this.currentPage = newPage
      this.fetchSuppliers()
    },
    
    // 添加供应商
    handleAdd() {
      this.dialogStatus = 'create'
      this.supplierForm = {
        id: undefined,
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        notes: ''
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.supplierForm.clearValidate()
      })
    },
    
    // 编辑供应商
    handleEdit(row) {
      this.dialogStatus = 'update'
      this.supplierForm = Object.assign({}, row)
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.supplierForm.clearValidate()
      })
    },
    
    // 查看供应商产品
    async handleViewProducts(row) {
      this.productsLoading = true
      this.productsDialogVisible = true
      try {
        const response = await this.$api.get(`suppliers/${row.id}/products`)
        this.supplierProducts = response.data
      } catch (error) {
        console.error('获取供应商产品失败:', error)
        this.$messageHandler.showError(error, 'SUPPLIER.GET_PRODUCTS_FAILED')
      } finally {
        this.productsLoading = false
      }
    },
    
    // 删除供应商
    handleDelete(row) {
      this.$confirm('确认删除该供应商吗？删除后无法恢复！', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const response = await this.$api.delete(`suppliers/${row.id}`)
          this.$messageHandler.showSuccess(response.message || '删除成功', 'SUPPLIER.DELETE_SUCCESS')
          this.fetchSuppliers()
        } catch (error) {
          console.error('删除供应商失败:', error)
          this.$messageHandler.showError(error, 'SUPPLIER.DELETE_FAILED')
        }
      }).catch(() => {})
    },
    
    // 提交表单
    submitForm() {
      this.$refs.supplierForm.validate(async valid => {
        if (valid) {
          this.submitLoading = true
          try {
            let response
            if (this.dialogStatus === 'create') {
              response = await this.$api.post('suppliers', this.supplierForm)
            } else {
              response = await this.$api.put(`suppliers/${this.supplierForm.id}`, this.supplierForm)
            }
            
            this.$messageHandler.showSuccess(
              response.message || (this.dialogStatus === 'create' ? '添加成功' : '更新成功'), 
              this.dialogStatus === 'create' ? 'SUPPLIER.CREATE_SUCCESS' : 'SUPPLIER.UPDATE_SUCCESS'
            )
            this.dialogVisible = false
            this.fetchSuppliers()
          } catch (error) {
            console.error(this.dialogStatus === 'create' ? '添加供应商失败:' : '更新供应商失败:', error)
            this.$messageHandler.showError(
              error, 
              this.dialogStatus === 'create' ? 'SUPPLIER.CREATE_FAILED' : 'SUPPLIER.UPDATE_FAILED'
            )
          } finally {
            this.submitLoading = false
          }
        }
      })
    },
    
    // 格式化日期
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

<style scoped>
.admin-suppliers {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-bar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
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