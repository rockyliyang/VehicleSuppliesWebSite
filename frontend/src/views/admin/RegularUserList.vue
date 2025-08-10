<template>
  <div class="regular-user-list">
    <div class="page-header">
      <h1>{{ $t('admin.users.title') || '普通用户列表' }}</h1>
      <p>{{ $t('admin.users.description') || '管理普通用户信息，查看用户详情，分配业务组' }}</p>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :model="filters" inline>
        <el-form-item :label="$t('admin.users.filter.businessGroup') || '业务组'">
          <el-select v-model="filters.businessGroup" :placeholder="$t('admin.users.filter.businessGroup_placeholder') || '选择业务组'" clearable @change="handleFilterChange" style="width: 200px;">
            <el-option v-for="group in businessGroups" :key="group.id" :label="group.name" :value="group.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('admin.users.filter.search') || '搜索'">
          <el-input v-model="filters.search" :placeholder="$t('admin.users.filter.search_placeholder') || '搜索姓名或邮箱'" clearable @input="handleFilterChange" style="width: 250px;" />
        </el-form-item>
        <el-form-item>
          <el-button @click="clearFilters">{{ $t('common.reset') || '重置' }}</el-button>
          <el-button type="success" @click="refreshUsers" :loading="loading">
            <el-icon>
              <Refresh />
            </el-icon>
            {{ $t('common.refresh') || '刷新' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户列表 -->
    <el-card class="users-list-card">

      <el-table 
        :data="paginatedUsers" 
        style="width: 100%" 
        v-loading="loading"
        @row-dblclick="showBusinessGroupDialog"
        stripe
      >
        <el-table-column prop="id" :label="$t('admin.users.table.id') || 'ID'" width="80" />
        <el-table-column prop="name" :label="$t('admin.users.table.name') || '姓名'" width="140" show-overflow-tooltip />
        <el-table-column prop="email" :label="$t('admin.users.table.email') || '邮箱'" width="220" show-overflow-tooltip />
        <el-table-column prop="businessGroups" :label="$t('admin.users.table.businessGroup') || '所属业务组'" min-width="180">
          <template #default="{row}">
            <el-tag v-if="row.currentBusinessGroup" size="small" type="success">
              {{ row.currentBusinessGroup.name }}
            </el-tag>
            <span v-else class="no-group">{{ $t('admin.users.table.unassigned') || '未分配' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" :label="$t('admin.users.table.status') || '状态'" width="100" align="center">
          <template #default="{row}">
            <el-tag :type="row.isActive ? 'success' : 'danger'">
              {{ row.isActive ? ($t('admin.users.status.active') || '已激活') : ($t('admin.users.status.inactive') || '未激活') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" :label="$t('admin.users.table.createdAt') || '注册时间'" width="160" align="center">
          <template #default="{row}">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
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
    <el-dialog v-model="businessGroupDialogVisible" :title="$t('admin.users.dialog.title') || '修改用户业务组'" width="500px">
      <div v-if="selectedUserForGroup" class="business-group-edit">
        <el-descriptions :column="1" border>
          <el-descriptions-item :label="$t('admin.users.dialog.userName') || '用户姓名'">{{ selectedUserForGroup.name }}</el-descriptions-item>
          <el-descriptions-item :label="$t('admin.users.dialog.userEmail') || '用户邮箱'">{{ selectedUserForGroup.email }}</el-descriptions-item>
          <el-descriptions-item :label="$t('admin.users.dialog.currentGroup') || '当前业务组'">
            <el-tag v-if="selectedUserForGroup.currentBusinessGroup" type="info">
              {{ selectedUserForGroup.currentBusinessGroup.name }}
            </el-tag>
            <span v-else class="no-group">{{ $t('admin.users.table.unassigned') || '未分配' }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <div class="group-selection">
          <h4>{{ $t('admin.users.dialog.selectGroup') || '选择新的业务组' }}</h4>
          <el-select v-model="selectedBusinessGroupId" :placeholder="$t('admin.users.dialog.selectGroup_placeholder') || '请选择业务组'" style="width: 100%" clearable>
            <el-option v-for="group in businessGroups" :key="group.id" :label="group.name" :value="group.id">
              <span>{{ group.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">
                {{ group.userCount || 0 }}{{ $t('admin.users.dialog.memberCount') || '人' }}
              </span>
            </el-option>
          </el-select>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="businessGroupDialogVisible = false">{{ $t('common.cancel') || '取消' }}</el-button>
          <el-button type="primary" @click="updateUserBusinessGroup" :loading="updating">
            {{ updating ? ($t('common.saving') || '保存中...') : ($t('common.save') || '保存') }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { Refresh } from '@element-plus/icons-vue'

export default {
  name: 'RegularUserList',
  components: {
    Refresh
  },

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
          role: "user" // 只获取普通用户
        }
        
        if (this.filters.businessGroup) {
          params.businessGroup = this.filters.businessGroup
        }
        if (this.filters.search) {
          params.search = this.filters.search
        }
        
        const response = await this.$api.get("/admin/users", { params })
        if (response.success) {
          const rawUsers = response.data.items || []
          this.total = response.data.pagination?.total || 0
          
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
          this.$messageHandler.showError(response.message, "admin.users.error.loadFailed")
        }
      } catch (error) {
        console.error("加载普通用户列表失败:", error)
        this.$messageHandler.showError("加载普通用户列表失败", "admin.users.error.loadFailed")
      } finally {
        this.loading = false
      }
    },
    
    // 加载业务组列表
    async loadBusinessGroups() {
      try {
        const response = await this.$api.get("/admin/business-groups")
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
        console.error("加载业务组列表失败:", error)
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
        businessGroup: "",
        search: ""
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
        this.$messageHandler.showInfo("业务组没有变化", "admin.users.info.noChange")
        this.businessGroupDialogVisible = false
        return
      }
      
      this.updating = true
      try {
        const response = await this.$api.patch(`/admin/users/${this.selectedUserForGroup.id}/business-group`, {
          business_group_id: this.selectedBusinessGroupId
        })
        
        if (response.success) {
          this.$messageHandler.showSuccess("业务组更新成功", "admin.users.success.businessGroupUpdateSuccess")
          this.businessGroupDialogVisible = false
          this.loadUsers()
        } else {
          this.$messageHandler.showError(response.message, "admin.users.error.businessGroupUpdateFailed")
        }
      } catch (error) {
        console.error("业务组更新失败:", error)
        this.$messageHandler.showError("业务组更新失败", "admin.users.error.businessGroupUpdateFailed")
      } finally {
        this.updating = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_mixins.scss';

.regular-user-list {
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

  .users-list-card {
    .no-group {
      color: #909399;
      font-size: 12px;
    }

    .pagination-wrapper {
      margin-top: 20px;
      text-align: right;
    }
  }
}

.business-group-edit {
  .group-selection {
    margin-top: 20px;

    h4 {
      margin-bottom: 15px;
      color: #303133;
      font-weight: 500;
    }
  }

  :deep(.el-descriptions) {
    margin-bottom: 20px;

    .el-descriptions__label {
      color: #303133;
      font-weight: 500;
    }

    .el-descriptions__content {
      color: #606266;
    }
  }
}

@include mobile {
  .regular-user-list {
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

    .users-list-card {
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