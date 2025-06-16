<template>
  <div class="business-groups">
    <h1>业务组管理</h1>

    <el-card class="groups-card">
      <template #header>
        <div class="card-header">
          <span>业务组列表</span>
          <el-button type="primary" @click="showAddDialog">添加业务组</el-button>
        </div>
      </template>

      <!-- 搜索条件 -->
      <div class="filter-container">
        <el-input 
          v-model="searchKeyword" 
          placeholder="搜索业务组名称或描述" 
          clearable 
          style="width: 300px"
          @input="handleFilterChange" 
        />
      </div>

      <!-- 业务组列表 -->
      <el-table :data="filteredGroups" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="业务组名称" width="200" />
        <el-table-column prop="description" label="描述">
          <template #default="{row}">
            <div class="description-text">{{ row.description || '无描述' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="userCount" label="成员数量" width="100">
          <template #default="{row}">
            <el-tag type="info">{{ row.userCount || 0 }}人</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{row}">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{row}">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="showEditDialog(row)">编辑</el-button>
              <el-button type="success" size="small" @click="showMembersDialog(row)">成员管理</el-button>
              <el-button type="danger" size="small" @click="confirmDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加业务组对话框 -->
    <el-dialog v-model="addDialogVisible" title="添加业务组" width="500px">
      <el-form :model="groupForm" :rules="groupRules" ref="groupFormRef" label-width="100px">
        <el-form-item label="业务组名称" prop="name">
          <el-input v-model="groupForm.name" placeholder="输入业务组名称" />
        </el-form-item>
        <el-form-item label="业务组邮箱" prop="email">
          <el-input v-model="groupForm.email" placeholder="输入业务组邮箱" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="groupForm.description" type="textarea" :rows="3" placeholder="输入业务组描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitGroup">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑业务组对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑业务组" width="500px">
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px">
        <el-form-item label="业务组名称" prop="name">
          <el-input v-model="editForm.name" placeholder="输入业务组名称" />
        </el-form-item>
        <el-form-item label="业务组邮箱" prop="email">
          <el-input v-model="editForm.email" placeholder="输入业务组邮箱" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="editForm.description" type="textarea" :rows="3" placeholder="输入业务组描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="updateGroup">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 成员管理对话框 -->
    <el-dialog v-model="membersDialogVisible" title="成员管理" width="800px">
      <div v-if="selectedGroup">
        <h3>{{ selectedGroup.name }} - 成员管理</h3>
        
        <!-- 添加成员 -->
        <div class="add-member-section">
          <h4>添加成员</h4>
          <div class="add-member-form">
            <el-select 
              v-model="selectedUserId" 
              placeholder="选择用户" 
              filterable 
              style="width: 300px"
            >
              <el-option 
                v-for="user in availableUsers" 
                :key="user.id" 
                :label="`${user.name} (${user.email})`" 
                :value="user.id" 
              />
            </el-select>
            <el-button type="primary" @click="addMember" :disabled="!selectedUserId">添加</el-button>
          </div>
        </div>

        <!-- 当前成员列表 -->
        <div class="current-members-section">
          <h4>当前成员 ({{ groupMembers.length }}人)</h4>
          <el-table :data="groupMembers" style="width: 100%" v-loading="membersLoading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="姓名" width="120" />
            <el-table-column prop="email" label="邮箱" width="200" />
            <el-table-column prop="role" label="角色" width="100">
              <template #default="{row}">
                <el-tag :type="getRoleType(row.role)">{{ getRoleText(row.role) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="joinedAt" label="加入时间" width="180">
              <template #default="{row}">
                {{ formatDate(row.joinedAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{row}">
                <el-button type="danger" size="small" @click="removeMember(row)">移除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="membersDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessageBox } from 'element-plus'

export default {
  name: 'BusinessGroups',
  data() {
    return {
      // 数据加载状态
      loading: false,
      membersLoading: false,
      
      // 业务组列表
      groups: [],
      
      // 搜索关键词
      searchKeyword: '',
      
      // 添加业务组对话框
      addDialogVisible: false,
      groupForm: {
        name: '',
        email: '',
        description: ''
      },
      groupRules: {
        name: [{ required: true, message: '请输入业务组名称', trigger: 'blur' }],
        email: [
          { required: true, message: '请输入业务组邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
        ]
      },
      
      // 编辑业务组对话框
      editDialogVisible: false,
      editForm: {
        id: null,
        name: '',
        email: '',
        description: ''
      },
      editRules: {
        name: [{ required: true, message: '请输入业务组名称', trigger: 'blur' }],
        email: [
          { required: true, message: '请输入业务组邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
        ]
      },
      
      // 成员管理对话框
      membersDialogVisible: false,
      selectedGroup: null,
      groupMembers: [],
      availableUsers: [],
      selectedUserId: null,
      
      // 角色映射
      roleMap: {
        'admin': '管理员',
        'business': '业务人员',
        'user': '普通用户'
      },
      
      // 角色类型映射
      roleTypeMap: {
        'admin': 'danger',
        'business': 'success',
        'user': 'info'
      }
    }
  },
  computed: {
    // 筛选后的业务组列表
    filteredGroups() {
      if (!this.searchKeyword) {
        return this.groups
      }
      
      const keyword = this.searchKeyword.toLowerCase()
      return this.groups.filter(group => 
        group.name.toLowerCase().includes(keyword) || 
        (group.description && group.description.toLowerCase().includes(keyword))
      )
    }
  },
  created() {
    this.loadGroups()
  },
  methods: {
    // 获取角色显示文本
    getRoleText(role) {
      return this.roleMap[role] || role
    },
    
    // 获取角色标签类型
    getRoleType(role) {
      return this.roleTypeMap[role] || 'default'
    },
    
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN')
    },
    
    // 加载业务组列表
    async loadGroups() {
      this.loading = true
      try {
        const response = await this.$api.get('/admin/business-groups')
        if (response.success) {
          // 修复数据结构：API返回的是items，不是groups
          const rawGroups = response.data.items || []
          // 字段名映射：将API字段转换为前端期望的字段
          this.groups = rawGroups.map(group => ({
            id: group.id,
            name: group.group_name, // API返回group_name，前端期望name
            email: group.group_email,
            description: group.description,
            isDefault: group.is_default,
            userCount: group.member_count || 0, // API返回member_count，前端期望userCount
            createdAt: group.created_at, // API返回created_at，前端期望createdAt
            updatedAt: group.updated_at, // API返回updated_at
            createdByName: group.created_by_name
          }))
        } else {
          this.$messageHandler.showError(response.message, 'admin.businessGroups.error.loadFailed')
        }
      } catch (error) {
        console.error('加载业务组失败:', error)
        this.$messageHandler.showError('加载业务组列表失败', 'admin.businessGroups.error.loadFailed')
      } finally {
        this.loading = false
      }
    },
    
    // 显示添加对话框
    showAddDialog() {
      this.groupForm.name = ''
      this.groupForm.email = ''
      this.groupForm.description = ''
      this.addDialogVisible = true
      // 等待DOM更新后重置表单验证
      this.$nextTick(() => {
        this.$refs.groupFormRef?.resetFields()
      })
    },
    
    // 提交添加业务组
    async submitGroup() {
      if (!this.$refs.groupFormRef) return
      
      await this.$refs.groupFormRef.validate(async (valid) => {
        if (valid) {
          try {
            const response = await this.$api.post('/admin/business-groups', {
              group_name: this.groupForm.name,
              group_email: this.groupForm.email || '',
              description: this.groupForm.description,
              is_default: this.groupForm.isDefault || false
            })
            if (response.success) {
              this.$messageHandler.showSuccess('添加业务组成功', 'admin.businessGroups.success.addSuccess')
              this.addDialogVisible = false
              this.loadGroups() // 重新加载列表
            } else {
              this.$messageHandler.showError(response.message, 'admin.businessGroups.error.addFailed')
            }
          } catch (error) {
            console.error('添加业务组失败:', error)
            this.$messageHandler.showError('添加业务组失败', 'admin.businessGroups.error.addFailed')
          }
        }
      })
    },
    
    // 显示编辑对话框
    showEditDialog(group) {
      this.selectedGroup = group
      this.editForm.id = group.id
      this.editForm.name = group.name
      this.editForm.email = group.email || ''
      this.editForm.description = group.description || ''
      this.editDialogVisible = true
      // 等待DOM更新后重置表单验证
      this.$nextTick(() => {
        this.$refs.editFormRef?.resetFields()
      })
    },
    
    // 更新业务组
    async updateGroup() {
      if (!this.$refs.editFormRef) return
      
      await this.$refs.editFormRef.validate(async (valid) => {
        if (valid) {
          try {
            const response = await this.$api.put(`/admin/business-groups/${this.editForm.id}`, {
              group_name: this.editForm.name,
              group_email: this.editForm.email || this.selectedGroup?.email || '',
              description: this.editForm.description,
              is_default: this.editForm.isDefault || false
            })
            if (response.success) {
              this.$messageHandler.showSuccess('更新业务组成功', 'admin.businessGroups.success.updateSuccess')
              this.editDialogVisible = false
              this.loadGroups() // 重新加载列表
            } else {
              this.$messageHandler.showError(response.message, 'admin.businessGroups.error.updateFailed')
            }
          } catch (error) {
            console.error('更新业务组失败:', error)
            this.$messageHandler.showError('更新业务组失败', 'admin.businessGroups.error.updateFailed')
          }
        }
      })
    },
    
    // 确认删除
    confirmDelete(group) {
      ElMessageBox.confirm(
        `确定要删除业务组 "${group.name}" 吗？删除后该组的所有成员关联将被移除。`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          const response = await this.$api.delete(`/admin/business-groups/${group.id}`)
          if (response.success) {
            this.$messageHandler.showSuccess('删除业务组成功', 'admin.businessGroups.success.deleteSuccess')
            this.loadGroups() // 重新加载列表
          } else {
            this.$messageHandler.showError(response.message, 'admin.businessGroups.error.deleteFailed')
          }
        } catch (error) {
          console.error('删除业务组失败:', error)
          this.$messageHandler.showError('删除业务组失败', 'admin.businessGroups.error.deleteFailed')
        }
      }).catch(() => {
        // 取消删除，不做任何操作
      })
    },
    
    // 显示成员管理对话框
    async showMembersDialog(group) {
      this.selectedGroup = group
      this.selectedUserId = null
      this.membersDialogVisible = true
      
      // 加载成员列表和可用用户列表
      await Promise.all([
        this.loadGroupMembers(group.id),
        this.loadAvailableUsers(group.id)
      ])
    },
    
    // 加载业务组成员
    async loadGroupMembers(groupId) {
      this.membersLoading = true
      try {
        const response = await this.$api.get(`/admin/business-groups/${groupId}`)
        if (response.success) {
          // 修复数据结构：API返回的是data.members，不是data.group.users
          const rawMembers = response.data.members || []
          // 字段名映射：将API字段转换为前端期望的字段
          this.groupMembers = rawMembers.map(member => ({
            id: member.id,
            name: member.username, // API返回username，前端期望name
            email: member.email,
            role: member.user_role, // API返回user_role
            joinedAt: member.joined_at // API返回joined_at
          }))
        } else {
          this.$messageHandler.showError(response.message, 'admin.businessGroups.error.loadMembersFailed')
        }
      } catch (error) {
        console.error('加载成员列表失败:', error)
        this.$messageHandler.showError('加载成员列表失败', 'admin.businessGroups.error.loadMembersFailed')
      } finally {
        this.membersLoading = false
      }
    },
    
    // 加载可分配用户列表
    async loadAvailableUsers(groupId) {
      try {
        const response = await this.$api.get(`/admin/business-groups/${groupId}/available-users`)
        if (response.success) {
          // 修复数据结构：API直接返回data数组，不是data.users
          const rawUsers = response.data || []
          // 字段名映射：将API字段转换为前端期望的字段
          this.availableUsers = rawUsers.map(user => ({
            id: user.id,
            name: user.username, // API返回username，前端期望name
            email: user.email,
            role: user.role,
            createdAt: user.created_at
          }))
        }
      } catch (error) {
        console.error('加载可分配用户列表失败:', error)
      }
    },
    
    // 添加成员
    async addMember() {
      if (!this.selectedUserId || !this.selectedGroup) return
      
      try {
        const response = await this.$api.post(`/admin/business-groups/${this.selectedGroup.id}/assign-user`, {
          user_id: this.selectedUserId
        })
        
        if (response.success) {
          this.$messageHandler.showSuccess('添加成员成功', 'admin.businessGroups.success.addMemberSuccess')
          this.selectedUserId = null
          // 重新加载成员列表和可用用户列表
          await Promise.all([
            this.loadGroupMembers(this.selectedGroup.id),
            this.loadAvailableUsers(this.selectedGroup.id)
          ])
        } else {
          this.$messageHandler.showError(response.message, 'admin.businessGroups.error.addMemberFailed')
        }
      } catch (error) {
        console.error('添加成员失败:', error)
        this.$messageHandler.showError('添加成员失败', 'admin.businessGroups.error.addMemberFailed')
      }
    },
    
    // 移除成员
    async removeMember(user) {
      if (!this.selectedGroup) return
      
      ElMessageBox.confirm(
        `确定要将 "${user.name}" 从业务组中移除吗？`,
        '移除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          const response = await this.$api.delete(`/admin/business-groups/${this.selectedGroup.id}/users/${user.id}`)
          if (response.success) {
            this.$messageHandler.showSuccess('移除成员成功', 'admin.businessGroups.success.removeMemberSuccess')
            // 重新加载成员列表和可用用户列表
            await Promise.all([
              this.loadGroupMembers(this.selectedGroup.id),
              this.loadAvailableUsers(this.selectedGroup.id)
            ])
          } else {
            this.$messageHandler.showError(response.message, 'admin.businessGroups.error.removeMemberFailed')
          }
        } catch (error) {
          console.error('移除成员失败:', error)
          this.$messageHandler.showError('移除成员失败', 'admin.businessGroups.error.removeMemberFailed')
        }
      }).catch(() => {
        // 取消移除，不做任何操作
      })
    },
    
    // 处理筛选条件变化
    handleFilterChange() {
      // 可以在这里添加防抖逻辑
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
$spacing-xl: 32px;
$border-radius-sm: 2px;
$border-radius-md: 4px;

.business-groups {
  padding: $spacing-lg;
  
  h1 {
    color: $text-color-primary;
    margin-bottom: $spacing-lg;
    font-weight: 500;
  }
}

.groups-card {
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
  
  :deep(.el-button) {
    border-radius: $border-radius-md;
  }
}

.filter-container {
  margin-bottom: $spacing-lg;
  display: flex;
  align-items: center;
  
  :deep(.el-input) {
    .el-input__inner {
      border-radius: $border-radius-md;
    }
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

.description-text {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: $text-color-regular;
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

.add-member-section {
  margin-bottom: $spacing-xl;
  padding-bottom: $spacing-lg;
  border-bottom: 1px solid $border-color-light;
  
  h4 {
    margin-bottom: 15px;
    color: $text-color-primary;
    font-weight: 500;
  }
}

.add-member-form {
  display: flex;
  gap: $spacing-sm;
  align-items: center;
  
  :deep(.el-select) {
    .el-input__inner {
      border-radius: $border-radius-md;
    }
  }
  
  :deep(.el-button) {
    border-radius: $border-radius-md;
  }
}

.current-members-section {
  h4 {
    margin-bottom: 15px;
    color: $text-color-primary;
    font-weight: 500;
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

:deep(.el-form) {
  .el-form-item__label {
    color: $text-color-primary;
    font-weight: 500;
  }
  
  .el-input__inner,
  .el-textarea__inner {
    border-radius: $border-radius-md;
  }
}

:deep(.el-loading-mask) {
  border-radius: $border-radius-md;
}
</style>