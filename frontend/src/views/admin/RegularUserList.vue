<template>
  <div class="regular-user-list">
    <h1>普通用户列表</h1>

    <el-card class="users-card">
      <template #header>
        <div class="card-header">
          <span>普通用户列表</span>
          <div class="header-actions">
            <el-button type="primary" @click="refreshUsers">刷新</el-button>
          </div>
        </div>
      </template>

      <!-- 筛选条件 -->
      <div class="filter-container">
        <div class="filter-item">
          <label class="filter-label">业务组:</label>
          <el-select v-model="filters.businessGroup" placeholder="选择业务组" clearable @change="handleFilterChange">
            <el-option v-for="group in businessGroups" :key="group.id" :label="group.name" :value="group.id" />
          </el-select>
        </div>

        <div class="filter-item">
          <label class="filter-label">搜索:</label>
          <el-input v-model="filters.search" placeholder="搜索姓名或邮箱" clearable @input="handleFilterChange" />
        </div>

        <el-button @click="clearFilters" type="primary" plain>清除所有筛选</el-button>
      </div>

      <!-- 用户列表 -->
      <el-table 
        :data="paginatedUsers" 
        style="width: 100%" 
        v-loading="loading"
        @row-dblclick="showBusinessGroupDialog"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="姓名" width="140" show-overflow-tooltip />
        <el-table-column prop="email" label="邮箱" width="220" show-overflow-tooltip />
        <el-table-column prop="businessGroups" label="所属业务组" min-width="180">
          <template #default="{row}">
            <el-tag v-if="row.currentBusinessGroup" size="small" type="success">
              {{ row.currentBusinessGroup.name }}
            </el-tag>
            <span v-else class="no-group">未分配</span>
          </template>
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
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination 
          v-model:current-page="currentPage" 
          v-model:page-size="pageSize" 
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper" 
          :total="total" 
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange" 
        />
      </div>
    </el-card>

    <!-- 业务组修改对话框 -->
    <el-dialog v-model="businessGroupDialogVisible" title="修改用户业务组" width="500px">
      <div v-if="selectedUserForGroup" class="business-group-edit">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户姓名">{{ selectedUserForGroup.name }}</el-descriptions-item>
          <el-descriptions-item label="用户邮箱">{{ selectedUserForGroup.email }}</el-descriptions-item>
          <el-descriptions-item label="当前业务组">
            <el-tag v-if="selectedUserForGroup.currentBusinessGroup" type="info">
              {{ selectedUserForGroup.currentBusinessGroup.name }}
            </el-tag>
            <span v-else class="no-group">未分配</span>
          </el-descriptions-item>
        </el-descriptions>

        <div class="group-selection">
          <h4>选择新的业务组</h4>
          <el-select v-model="selectedBusinessGroupId" placeholder="请选择业务组" style="width: 100%" clearable>
            <el-option v-for="group in businessGroups" :key="group.id" :label="group.name" :value="group.id">
              <span>{{ group.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">
                {{ group.userCount || 0 }}人
              </span>
            </el-option>
          </el-select>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="businessGroupDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="updateUserBusinessGroup" :loading="updating">
            确定修改
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'RegularUserList',

  data() {
    return {
      // 数据加载状态
      loading: false,
      
      // 用户列表
      users: [],
      
      // 业务组列表
      businessGroups: [],
      
      // 筛选条件
      filters: {
        businessGroup: '',
        search: ''
      },
      
      // 分页
      currentPage: 1,
      pageSize: 10,
      total: 0,
      
      // 业务组修改对话框
      businessGroupDialogVisible: false,
      selectedUserForGroup: null,
      selectedBusinessGroupId: null,
      updating: false
    }
  },
  
  computed: {
    paginatedUsers() {
      return this.users
    }
  },
  
  created() {
    this.loadUsers()
    this.loadBusinessGroups()
  },
  
  methods: {
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN')
    },
    
    // 加载普通用户列表
    async loadUsers() {
      this.loading = true
      try {
        const params = {
          page: this.currentPage,
          pageSize: this.pageSize,
          role: 'user' // 只获取普通用户
        }
        
        if (this.filters.businessGroup) {
          params.businessGroup = this.filters.businessGroup
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
            currentBusinessGroup: user.business_group_name ? {
              id: user.business_group_id,
              name: user.business_group_name
            } : null,
            businessGroupId: user.business_group_id || null,
            isActive: user.is_active !== false,
            createdAt: user.created_at,
            updatedAt: user.updated_at
          }))
        } else {
          this.$messageHandler.showError(response.message, 'admin.users.error.loadFailed')
        }
      } catch (error) {
        console.error('加载普通用户列表失败:', error)
        this.$messageHandler.showError('加载普通用户列表失败', 'admin.users.error.loadFailed')
      } finally {
        this.loading = false
      }
    },
    
    // 加载业务组列表
    async loadBusinessGroups() {
      try {
        const response = await this.$api.get('/admin/business-groups')
        if (response.success) {
          const rawGroups = response.data.items || []
          this.businessGroups = rawGroups.map(group => ({
            id: group.id,
            name: group.group_name,
            email: group.group_email,
            description: group.description,
            isDefault: group.is_default,
            userCount: group.member_count || 0,
            createdAt: group.created_at,
            updatedAt: group.updated_at
          }))
        }
      } catch (error) {
        console.error('加载业务组列表失败:', error)
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
        businessGroup: '',
        search: ''
      }
      this.currentPage = 1
      this.loadUsers()
    },
    
    // 显示业务组修改对话框
    showBusinessGroupDialog(user) {
      this.selectedUserForGroup = {
        id: user.id,
        name: user.name,
        email: user.email,
        currentBusinessGroup: user.currentBusinessGroup
      }
      this.selectedBusinessGroupId = user.businessGroupId
      this.businessGroupDialogVisible = true
    },
    
    // 更新用户业务组
    async updateUserBusinessGroup() {
      if (!this.selectedUserForGroup) return
      
      const currentGroupId = this.selectedUserForGroup.currentBusinessGroup?.id
      if (currentGroupId === this.selectedBusinessGroupId) {
        this.$messageHandler.showInfo('业务组没有变化', 'admin.users.info.noChange')
        this.businessGroupDialogVisible = false
        return
      }
      
      this.updating = true
      try {
        const response = await this.$api.patch(`/admin/users/${this.selectedUserForGroup.id}/business-group`, {
          business_group_id: this.selectedBusinessGroupId
        })
        
        if (response.success) {
          this.$messageHandler.showSuccess('业务组更新成功', 'admin.users.success.businessGroupUpdateSuccess')
          this.businessGroupDialogVisible = false
          this.loadUsers()
        } else {
          this.$messageHandler.showError(response.message, 'admin.users.error.businessGroupUpdateFailed')
        }
      } catch (error) {
        console.error('业务组更新失败:', error)
        this.$messageHandler.showError('业务组更新失败', 'admin.users.error.businessGroupUpdateFailed')
      } finally {
        this.updating = false
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
</style>