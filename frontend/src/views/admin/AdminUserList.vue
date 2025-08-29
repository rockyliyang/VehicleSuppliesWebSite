<template>
  <div class="admin-user-list">
    <div class="page-header">
      <h1>{{ $t('admin.adminUsers.title') || '管理员列表' }}</h1>
      <p>{{ $t('admin.adminUsers.description') || '管理系统管理员账户，创建、编辑和删除管理员用户' }}</p>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :model="filters" inline>
        <el-form-item :label="$t('admin.adminUsers.filter.search') || '搜索'">
          <el-input v-model="filters.search" :placeholder="$t('admin.adminUsers.filter.searchPlaceholder') || '搜索姓名或邮箱'" clearable @input="handleFilterChange" style="width: 250px;" />
        </el-form-item>
        <el-form-item>
          <el-button @click="clearFilters">{{ $t('common.reset') || '重置' }}</el-button>
          <el-button type="success" @click="refreshUsers" :loading="refreshing">
            <el-icon>
              <Refresh />
            </el-icon>
            {{ $t('common.refresh') || '刷新' }}
          </el-button>
          <el-button type="primary" @click="showCreateDialog">{{ $t('admin.adminUsers.action.create') || '新增管理员' }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 管理员列表 -->
    <el-card class="admin-users-list-card">

      <el-table :data="paginatedUsers" v-loading="loading" stripe>
        <el-table-column prop="id" :label="$t('admin.adminUsers.table.id') || 'ID'" width="80" />
        <el-table-column prop="name" :label="$t('admin.adminUsers.table.name') || '姓名'" width="140" show-overflow-tooltip />
        <el-table-column prop="email" :label="$t('admin.adminUsers.table.email') || '邮箱'" width="220" show-overflow-tooltip />
        <el-table-column prop="role" :label="$t('admin.adminUsers.table.role') || '角色'" width="100" align="center">
          <template #default>
            <el-tag type="danger">{{ $t('admin.adminUsers.table.adminRole') || '管理员' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" :label="$t('admin.adminUsers.table.status') || '状态'" width="100" align="center">
          <template #default="{row}">
            <el-tag :type="row.isActive ? 'success' : 'danger'">
              {{ row.isActive ? ($t('admin.adminUsers.table.active') || '已激活') : ($t('admin.adminUsers.table.inactive') || '未激活') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" :label="$t('admin.adminUsers.table.createdAt') || '注册时间'" width="160" align="center">
          <template #default="{row}">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('admin.adminUsers.table.actions') || '操作'" width="240" fixed="right">
          <template #default="{row}">
            <el-button type="primary" size="small" @click="showUserDetail(row)">{{ $t('admin.adminUsers.action.detail') || '详情' }}</el-button>
            <el-button type="success" size="small" @click="showEditDialog(row)">{{ $t('admin.adminUsers.action.edit') || '编辑' }}</el-button>
            <el-button type="danger" size="small" @click="confirmDelete(row)">{{ $t('admin.adminUsers.action.delete') || '删除' }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper" :total="total" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <!-- 用户详情对话框 -->
    <el-dialog v-model="detailDialogVisible" :title="$t('admin.adminUsers.detail.title') || '管理员详情'" width="600px">
      <div v-if="selectedUser" class="user-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item :label="$t('admin.adminUsers.detail.id') || 'ID'">{{ selectedUser.id }}</el-descriptions-item>
          <el-descriptions-item :label="$t('admin.adminUsers.detail.name') || '姓名'">{{ selectedUser.name }}</el-descriptions-item>
          <el-descriptions-item :label="$t('admin.adminUsers.detail.email') || '邮箱'">{{ selectedUser.email }}</el-descriptions-item>
          <el-descriptions-item :label="$t('admin.adminUsers.detail.role') || '角色'">
            <el-tag type="danger">{{ $t('admin.adminUsers.table.adminRole') || '管理员' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('admin.adminUsers.detail.status') || '状态'">
            <el-tag :type="selectedUser.isActive ? 'success' : 'danger'">
              {{ selectedUser.isActive ? ($t('admin.adminUsers.table.active') || '已激活') : ($t('admin.adminUsers.table.inactive') || '未激活') }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('admin.adminUsers.detail.createdAt') || '注册时间'">{{ formatDate(selectedUser.createdAt) }}</el-descriptions-item>
          <el-descriptions-item :label="$t('admin.adminUsers.detail.updatedAt') || '更新时间'">{{ formatDate(selectedUser.updatedAt) }}</el-descriptions-item>
        </el-descriptions>

        <div class="admin-note">
          <el-alert :title="$t('admin.adminUsers.detail.noteTitle') || '注意'" type="info" :description="$t('admin.adminUsers.detail.noteDescription') || '管理员用户不能分配到业务组，拥有系统的最高权限。'" show-icon :closable="false" />
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">{{ $t('common.close') || '关闭' }}</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 创建用户对话框 -->
    <el-dialog v-model="createDialogVisible" :title="$t('admin.adminUsers.create.title') || '新增管理员'" width="500px">
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
        <el-form-item :label="$t('admin.adminUsers.create.name') || '姓名'" prop="username">
          <el-input v-model="createForm.username" :placeholder="$t('admin.adminUsers.create.namePlaceholder') || '请输入姓名'" />
        </el-form-item>
        <el-form-item :label="$t('admin.adminUsers.create.email') || '邮箱'" prop="email">
          <el-input v-model="createForm.email" :placeholder="$t('admin.adminUsers.create.emailPlaceholder') || '请输入邮箱'" />
        </el-form-item>
        <el-form-item :label="$t('admin.adminUsers.create.password') || '密码'" prop="password">
          <el-input v-model="createForm.password" type="password" :placeholder="$t('admin.adminUsers.create.passwordPlaceholder') || '请输入密码'" show-password autocomplete="off" />
        </el-form-item>
      </el-form>

      <div class="admin-warning">
        <el-alert :title="$t('admin.adminUsers.create.warningTitle') || '重要提醒'" type="warning" :description="$t('admin.adminUsers.create.warningDescription') || '管理员拥有系统最高权限，请谨慎创建。管理员不能分配到业务组。'" show-icon
          :closable="false" />
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createDialogVisible = false">{{ $t('common.cancel') || '取消' }}</el-button>
          <el-button type="primary" @click="createUser" :loading="creating">{{ creating ? ($t('common.creating') || '创建中...') : ($t('common.confirm') || '确定') }}</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑用户对话框 -->
    <el-dialog v-model="editDialogVisible" :title="$t('admin.adminUsers.edit.title') || '编辑管理员'" width="500px">
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px">
        <el-form-item :label="$t('admin.adminUsers.edit.name') || '姓名'" prop="username">
          <el-input v-model="editForm.username" :placeholder="$t('admin.adminUsers.edit.namePlaceholder') || '请输入姓名'" />
        </el-form-item>
        <el-form-item :label="$t('admin.adminUsers.edit.email') || '邮箱'" prop="email">
          <el-input v-model="editForm.email" :placeholder="$t('admin.adminUsers.edit.emailPlaceholder') || '请输入邮箱'" />
        </el-form-item>
        <el-form-item :label="$t('admin.adminUsers.edit.password') || '密码'" prop="password">
          <el-input v-model="editForm.password" type="password" :placeholder="$t('admin.adminUsers.edit.passwordPlaceholder') || '留空则不修改密码'" show-password autocomplete="off" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">{{ $t('common.cancel') || '取消' }}</el-button>
          <el-button type="primary" @click="updateUser" :loading="updating">{{ updating ? ($t('common.updating') || '更新中...') : ($t('common.confirm') || '确定') }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { Refresh } from '@element-plus/icons-vue'

export default {
  name: 'AdminUserList',
  components: {
    Refresh
  },
  data() {
    return {
      // 数据加载状态
      loading: false,
      creating: false,
      updating: false,
      refreshing: false,
      
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
          this.total = response.data.pagination?.total || 0
          
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
    async refreshUsers() {
      this.refreshing = true
      try {
        await this.loadUsers()
      } finally {
        this.refreshing = false
      }
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
@import '@/assets/styles/_mixins.scss';

.admin-user-list {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;

  h1 {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 8px 0;
  }

  p {
    color: #606266;
    margin: 0;
    font-size: 14px;
  }
}

.filter-card {
  margin-bottom: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  :deep(.el-card__body) {
    padding: 20px;
  }

  :deep(.el-form) {
    margin-bottom: 0;
  }

  :deep(.el-form-item) {
    margin-bottom: 0;
    margin-right: 16px;

    &:last-child {
      margin-right: 0;
    }
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #303133;
  }

  :deep(.el-button) {
    margin-left: 8px;

    &:first-child {
      margin-left: 0;
    }
  }
}

.admin-users-list-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  :deep(.el-card__body) {
    padding: 0;
  }

  :deep(.el-table) {
    border-radius: 8px;
    overflow: hidden;

    .el-table__header {
      background-color: #fafafa;

      th {
        background-color: #fafafa;
        color: #303133;
        font-weight: 600;
        border-bottom: 1px solid #ebeef5;
      }
    }

    .el-table__row {
      &:hover {
        background-color: #f5f7fa;
      }
    }

    td {
      border-bottom: 1px solid #ebeef5;
    }
  }
}

.pagination-wrapper {
  padding: 16px 20px;
  display: flex;
  justify-content: flex-end;
  background-color: #fafafa;
  border-top: 1px solid #ebeef5;
}

.user-detail {
  :deep(.el-descriptions) {
    .el-descriptions__label {
      color: #303133;
      font-weight: 500;
    }

    .el-descriptions__content {
      color: #606266;
    }
  }
}

.admin-note,
.admin-warning {
  margin-top: 20px;
}

// 移动端适配
@include mobile {
  .admin-user-list {
    padding: 16px;
  }

  .filter-card {
    :deep(.el-form) {
      .el-form-item {
        display: block;
        margin-right: 0;
        margin-bottom: 16px;

        &:last-child {
          margin-bottom: 0;
        }
      }

      .el-form-item__content {
        margin-left: 0 !important;
      }
    }
  }

  .admin-users-list-card {
    :deep(.el-table) {
      font-size: 12px;

      .el-table__cell {
        padding: 8px 4px;
      }
    }
  }

  .pagination-wrapper {
    padding: 12px 16px;
    
    :deep(.el-pagination) {
      .el-pagination__sizes,
      .el-pagination__jump {
        display: none;
      }
    }
  }
}
</style>