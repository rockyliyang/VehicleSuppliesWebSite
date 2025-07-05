<template>
  <div class="admin-user-list">
    <h1>管理员列表</h1>

    <el-card class="users-card">
      <template #header>
        <div class="card-header">
          <span>管理员列表</span>
          <div class="header-actions">
            <el-button type="primary" @click="showCreateDialog">新增管理员</el-button>
            <el-button type="primary" @click="refreshUsers">刷新</el-button>
          </div>
        </div>
      </template>

      <!-- 筛选条件 -->
      <div class="filter-container">
        <div class="filter-item">
          <label class="filter-label">搜索:</label>
          <el-input v-model="filters.search" placeholder="搜索姓名或邮箱" clearable @input="handleFilterChange" />
        </div>

        <el-button @click="clearFilters" type="primary" plain>清除所有筛选</el-button>
      </div>

      <!-- 用户列表 -->
      <el-table :data="paginatedUsers" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="姓名" width="140" show-overflow-tooltip />
        <el-table-column prop="email" label="邮箱" width="220" show-overflow-tooltip />
        <el-table-column prop="role" label="角色" width="100" align="center">

          <el-tag type="danger">管理员</el-tag>

        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="100" align="center">
          <template #default="{row}">
            <el-tag :type="row.isActive ? 'success' : 'danger'">
              {{ row.isActive ? '已激活' : '未激活' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="160" align="center">
          <template #default="{row}">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="{row}">
            <el-button size="small" @click="showUserDetail(row)">详情</el-button>
            <el-button size="small" @click="showEditDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="confirmDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper" :total="total" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <!-- 用户详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="管理员详情" width="600px">
      <div v-if="selectedUser" class="user-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ID">{{ selectedUser.id }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ selectedUser.name }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ selectedUser.email }}</el-descriptions-item>
          <el-descriptions-item label="角色">
            <el-tag type="danger">管理员</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="selectedUser.isActive ? 'success' : 'danger'">
              {{ selectedUser.isActive ? '已激活' : '未激活' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ formatDate(selectedUser.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDate(selectedUser.updatedAt) }}</el-descriptions-item>
        </el-descriptions>

        <div class="admin-note">
          <el-alert title="注意" type="info" description="管理员用户不能分配到业务组，拥有系统的最高权限。" show-icon :closable="false" />
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 创建用户对话框 -->
    <el-dialog v-model="createDialogVisible" title="新增管理员" width="500px">
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
        <el-form-item label="姓名" prop="username">
          <el-input v-model="createForm.username" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="createForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="createForm.password" type="password" placeholder="请输入密码" show-password autocomplete="off" />
        </el-form-item>
      </el-form>

      <div class="admin-warning">
        <el-alert title="重要提醒" type="warning" description="管理员拥有系统最高权限，请谨慎创建。管理员不能分配到业务组。" show-icon
          :closable="false" />
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="createUser" :loading="creating">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑用户对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑管理员" width="500px">
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px">
        <el-form-item label="姓名" prop="username">
          <el-input v-model="editForm.username" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="editForm.password" type="password" placeholder="留空则不修改密码" show-password autocomplete="off" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="updateUser" :loading="updating">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'AdminUserList',

  data() {
    return {
      // 数据加载状态
      loading: false,
      creating: false,
      updating: false,
      
      // 用户列表
      users: [],
      
      // 筛选条件
      filters: {
        search: ''
      },
      
      // 分页
      currentPage: 1,
      pageSize: 10,
      total: 0,
      
      // 对话框状态
      detailDialogVisible: false,
      createDialogVisible: false,
      editDialogVisible: false,
      
      // 选中的用户
      selectedUser: null,
      
      // 表单数据
      createForm: {
        username: '',
        email: '',
        password: ''
      },
      
      editForm: {
        id: null,
        username: '',
        email: '',
        password: ''
      },
      
      // 表单验证规则
      createRules: {
        username: [
          { required: true, message: '请输入姓名', trigger: 'blur' },
          { min: 2, max: 50, message: '姓名长度在 2 到 50 个字符', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
        ]
      },
      
      editRules: {
        username: [
          { required: true, message: '请输入姓名', trigger: 'blur' },
          { min: 2, max: 50, message: '姓名长度在 2 到 50 个字符', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
        ],
        password: [
          { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
        ]
      }
    }
  },
  
  computed: {
    paginatedUsers() {
      return this.users
    }
  },
  
  created() {
    this.loadUsers()
  },
  
  methods: {
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN')
    },
    
    // 加载管理员列表
    async loadUsers() {
      this.loading = true
      try {
        const params = {
          page: this.currentPage,
          pageSize: this.pageSize,
          role: 'admin' // 只获取管理员
        }
        
        if (this.filters.search) {
          params.search = this.filters.search
        }
        
        const response = await this.$api.get('/admin/users', { params })
        if (response.success) {
          const rawUsers = response.data.items || []
          this.total = response.data.total || 0
          
          this.users = rawUsers.map(user => ({
            id: user.id,
            name: user.username,
            email: user.email,
            role: user.user_role || user.role,
            isActive: user.is_active !== false,
            createdAt: user.created_at,
            updatedAt: user.updated_at
          }))
        } else {
          this.$messageHandler.showError(response.message, 'admin.users.error.loadFailed')
        }
      } catch (error) {
        console.error('加载管理员列表失败:', error)
        this.$messageHandler.showError('加载管理员列表失败', 'admin.users.error.loadFailed')
      } finally {
        this.loading = false
      }
    },
    
    // 刷新用户列表
    refreshUsers() {
      this.loadUsers()
    },
    
    // 处理筛选条件变化
    handleFilterChange() {
      this.currentPage = 1
      this.loadUsers()
    },
    
    // 处理每页显示数量变化
    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1
      this.loadUsers()
    },
    
    // 处理页码变化
    handleCurrentChange(val) {
      this.currentPage = val
      this.loadUsers()
    },
    
    // 清除所有筛选条件
    clearFilters() {
      this.filters = {
        search: ''
      }
      this.currentPage = 1
      this.loadUsers()
    },
    
    // 显示用户详情
    showUserDetail(user) {
      this.selectedUser = user
      this.detailDialogVisible = true
    },
    
    // 显示创建对话框
    showCreateDialog() {
      this.createForm = {
        username: '',
        email: '',
        password: ''
      }
      this.createDialogVisible = true
    },
    
    // 显示编辑对话框
    showEditDialog(user) {
      this.editForm = {
        id: user.id,
        username: user.name,
        email: user.email,
        password: ''
      }
      this.editDialogVisible = true
    },
    
    // 创建用户
    async createUser() {
      if (!this.$refs.createFormRef) return
      
      const valid = await this.$refs.createFormRef.validate().catch(() => false)
      if (!valid) return
      
      this.creating = true
      try {
        const response = await this.$api.post('/admin/users', {
          username: this.createForm.username,
          email: this.createForm.email,
          password: this.createForm.password,
          user_role: 'admin'
        })
        
        if (response.success) {
          this.$messageHandler.showSuccess('管理员创建成功', 'admin.users.success.createSuccess')
          this.createDialogVisible = false
          this.loadUsers()
        } else {
          this.$messageHandler.showError(response.message, 'admin.users.error.createFailed')
        }
      } catch (error) {
        console.error('创建管理员失败:', error)
        this.$messageHandler.showError('创建管理员失败', 'admin.users.error.createFailed')
      } finally {
        this.creating = false
      }
    },
    
    // 更新用户
    async updateUser() {
      if (!this.$refs.editFormRef) return
      
      const valid = await this.$refs.editFormRef.validate().catch(() => false)
      if (!valid) return
      
      this.updating = true
      try {
        const updateData = {
          username: this.editForm.username,
          email: this.editForm.email
        }
        
        if (this.editForm.password) {
          updateData.password = this.editForm.password
        }
        
        const response = await this.$api.patch(`/admin/users/${this.editForm.id}`, updateData)
        
        if (response.success) {
          this.$messageHandler.showSuccess('管理员更新成功', 'admin.users.success.updateSuccess')
          this.editDialogVisible = false
          this.loadUsers()
        } else {
          this.$messageHandler.showError(response.message, 'admin.users.error.updateFailed')
        }
      } catch (error) {
        console.error('更新管理员失败:', error)
        this.$messageHandler.showError('更新管理员失败', 'admin.users.error.updateFailed')
      } finally {
        this.updating = false
      }
    },
    
    // 确认删除
    confirmDelete(user) {
      this.$confirm(`确定要删除管理员 "${user.name}" 吗？`, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.deleteUser(user.id)
      }).catch(() => {
        // 用户取消删除
      })
    },
    
    // 删除用户
    async deleteUser(userId) {
      try {
        const response = await this.$api.delete(`/admin/users/${userId}`)
        
        if (response.success) {
          this.$messageHandler.showSuccess('管理员删除成功', 'admin.users.success.deleteSuccess')
          this.loadUsers()
        } else {
          this.$messageHandler.showError(response.message, 'admin.users.error.deleteFailed')
        }
      } catch (error) {
        console.error('删除管理员失败:', error)
        this.$messageHandler.showError('删除管理员失败', 'admin.users.error.deleteFailed')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
$primary-color: #409EFF;
$success-color: #67C23A;
$warning-color: #E6A23C;
$danger-color: #F56C6C;
$info-color: #909399;
$text-color-primary: #303133;
$text-color-regular: #606266;
$text-color-secondary: #909399;
$border-color-light: #EBEEF5;
$background-color-light: #F5F7FA;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$border-radius-sm: 2px;
$border-radius-md: 4px;

.user-management {
  padding: $spacing-lg;

  h1 {
    color: $text-color-primary;
    margin-bottom: $spacing-lg;
    font-weight: 500;
  }
}

.users-card {
  :deep(.el-card__header) {
    background-color: $background-color-light;
    border-bottom: 1px solid $border-color-light;
  }

  :deep(.el-card__body) {
    padding: $spacing-lg;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  span {
    font-size: 16px;
    font-weight: 500;
    color: $text-color-primary;
  }
}

.header-actions {
  display: flex;
  gap: $spacing-sm;

  :deep(.el-button) {
    border-radius: $border-radius-md;
  }
}

.filter-container {
  margin-bottom: $spacing-lg;
  display: flex;
  align-items: flex-end;
  gap: $spacing-lg;
  flex-wrap: wrap;
  padding: $spacing-md;
  background-color: $background-color-light;
  border-radius: $border-radius-md;
  border: 1px solid $border-color-light;

  .filter-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 200px;

    .filter-label {
      font-size: 14px;
      color: $text-color-primary;
      font-weight: 500;
      margin: 0;
    }

    .filter-input-group {
      display: flex;
      align-items: center;
      gap: 8px;
      position: relative;

      :deep(.el-select) {
        flex: 1;
        min-width: 180px;

        .el-input__inner {
          border-radius: $border-radius-md;
        }
      }

      :deep(.el-input) {
        flex: 1;
        min-width: 180px;

        .el-input__inner {
          border-radius: $border-radius-md;
        }
      }

      .clear-btn {
        padding: 4px;
        min-height: auto;

        &:hover {
          color: $danger-color;
          background-color: rgba($danger-color, 0.1);
        }

        :deep(.el-icon) {
          font-size: 14px;
        }
      }
    }
  }

  >.el-button {
    margin-left: auto;
    align-self: flex-end;
  }
}

:deep(.el-table) {
  border-radius: $border-radius-md;
  overflow: hidden;

  .el-table__header {
    background-color: $background-color-light;

    th {
      background-color: $background-color-light;
      color: $text-color-primary;
      font-weight: 500;
    }
  }

  .el-table__row {
    &:hover {
      background-color: #F5F7FA;
    }
  }
}

.pagination-container {
  margin-top: $spacing-lg;
  display: flex;
  justify-content: flex-end;

  :deep(.el-pagination) {
    .el-pager li {
      border-radius: $border-radius-sm;
      margin: 0 2px;
    }

    .btn-prev,
    .btn-next {
      border-radius: $border-radius-sm;
    }
  }
}

.action-buttons {
  display: flex;
  gap: 5px;
  flex-wrap: nowrap;

  :deep(.el-button) {
    border-radius: $border-radius-sm;

    &.el-button--small {
      padding: 5px 8px;
    }
  }

  :deep(.el-dropdown) {
    .el-button {
      border-radius: $border-radius-sm;
    }
  }
}

:deep(.el-dialog) {
  border-radius: $border-radius-md;

  .el-dialog__header {
    background-color: $background-color-light;
    border-bottom: 1px solid $border-color-light;

    .el-dialog__title {
      color: $text-color-primary;
      font-weight: 500;
    }
  }

  .el-dialog__body {
    padding: $spacing-lg;
  }
}

.user-detail {
  margin-bottom: $spacing-lg;

  :deep(.el-descriptions) {
    .el-descriptions__header {
      margin-bottom: $spacing-md;
    }

    .el-descriptions__label {
      color: $text-color-primary;
      font-weight: 500;
    }

    .el-descriptions__content {
      color: $text-color-regular;
    }
  }
}

.business-groups-section {
  margin-top: $spacing-lg;

  h4 {
    margin-bottom: 15px;
    color: $text-color-primary;
    font-weight: 500;
  }

  :deep(.el-tag) {
    margin-right: 8px;
    margin-bottom: 8px;
    border-radius: $border-radius-sm;
  }
}

:deep(.el-tag) {
  border-radius: $border-radius-sm;

  &.el-tag--success {
    background-color: rgba($success-color, 0.1);
    border-color: rgba($success-color, 0.2);
    color: $success-color;
  }

  &.el-tag--warning {
    background-color: rgba($warning-color, 0.1);
    border-color: rgba($warning-color, 0.2);
    color: $warning-color;
  }

  &.el-tag--danger {
    background-color: rgba($danger-color, 0.1);
    border-color: rgba($danger-color, 0.2);
    color: $danger-color;
  }

  &.el-tag--info {
    background-color: rgba($info-color, 0.1);
    border-color: rgba($info-color, 0.2);
    color: $info-color;
  }
}

.business-group-edit {
  .group-selection {
    margin-top: $spacing-lg;

    h4 {
      margin-bottom: 15px;
      color: $text-color-primary;
      font-weight: 500;
    }

    :deep(.el-select) {
      .el-input__inner {
        border-radius: $border-radius-md;
      }
    }
  }

  :deep(.el-descriptions) {
    margin-bottom: $spacing-lg;

    .el-descriptions__label {
      color: $text-color-primary;
      font-weight: 500;
    }

    .el-descriptions__content {
      color: $text-color-regular;
    }
  }
}

:deep(.el-loading-mask) {
  border-radius: $border-radius-md;
}

.admin-note,
.admin-warning {
  margin-top: 20px;
}
</style>