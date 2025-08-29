<template>
  <div class="business-groups">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>{{ $t('admin.businessGroups.title') }}</h1>
      <p class="page-description">{{ $t('admin.businessGroups.description') }}</p>
    </div>
    
    <!-- 筛选条件卡片 -->
    <el-card class="filter-card">
      <el-form :inline="true" class="filter-form">
        <el-form-item :label="$t('admin.businessGroups.filter.search')">
          <el-input
            v-model="searchKeyword"
            :placeholder="$t('admin.businessGroups.filter.searchPlaceholder')"
            style="width: 300px;"
            clearable
            @input="handleFilterChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button 
            type="primary" 
            :loading="refreshing"
            @click="refreshGroups"
          >
            <Refresh />
            {{ $t('common.refresh') }}
          </el-button>
          <el-button type="primary" @click="showAddDialog">
            {{ $t('admin.businessGroups.actions.add') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 业务组列表卡片 -->
    <el-card class="business-groups-list-card">
      <template #header>
        <div class="card-header">
          <span>{{ $t('admin.businessGroups.list.title') }}</span>
        </div>
      </template>

      <!-- 业务组列表 -->
      <el-table 
        :data="filteredGroups" 
        v-loading="loading"
        style="width: 100%"
        stripe
      >
        <el-table-column prop="id" :label="$t('admin.businessGroups.table.id')" width="80" />
        <el-table-column prop="name" :label="$t('admin.businessGroups.table.name')" min-width="150" />
        <el-table-column prop="email" :label="$t('admin.businessGroups.table.email')" min-width="200" />
        <el-table-column prop="description" :label="$t('admin.businessGroups.table.description')" min-width="200">
          <template #default="scope">
            <span class="description-text">{{ scope.row.description || $t('admin.businessGroups.table.noDescription') }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="userCount" :label="$t('admin.businessGroups.table.memberCount')" width="100" align="center" />
        <el-table-column prop="createdAt" :label="$t('admin.businessGroups.table.createdAt')" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('admin.businessGroups.table.actions')" width="280" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <el-button 
                type="primary" 
                size="small" 
                @click="showMembersDialog(scope.row)"
              >
                {{ $t('admin.businessGroups.actions.manageMembers') }}
              </el-button>
              <el-button 
                type="warning" 
                size="small" 
                @click="showEditDialog(scope.row)"
              >
                {{ $t('admin.businessGroups.actions.edit') }}
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                @click="confirmDelete(scope.row)"
              >
                {{ $t('admin.businessGroups.actions.delete') }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加业务组对话框 -->
    <el-dialog 
      v-model="addDialogVisible" 
      :title="$t('admin.businessGroups.dialog.add.title')" 
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="groupFormRef" 
        :model="groupForm" 
        :rules="groupFormRules" 
        label-width="100px"
      >
        <el-form-item :label="$t('admin.businessGroups.form.name')" prop="name">
          <el-input v-model="groupForm.name" :placeholder="$t('admin.businessGroups.form.namePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('admin.businessGroups.form.email')" prop="email">
          <el-input v-model="groupForm.email" :placeholder="$t('admin.businessGroups.form.emailPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('admin.businessGroups.form.description')" prop="description">
          <el-input 
            v-model="groupForm.description" 
            type="textarea" 
            :rows="3"
            :placeholder="$t('admin.businessGroups.form.descriptionPlaceholder')"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="creating" @click="submitGroup">
            {{ creating ? $t('common.creating') : $t('common.confirm') }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑业务组对话框 -->
    <el-dialog 
      v-model="editDialogVisible" 
      :title="$t('admin.businessGroups.dialog.edit.title')" 
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="editFormRef" 
        :model="editForm" 
        :rules="editFormRules" 
        label-width="100px"
      >
        <el-form-item :label="$t('admin.businessGroups.form.name')" prop="name">
          <el-input v-model="editForm.name" :placeholder="$t('admin.businessGroups.form.namePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('admin.businessGroups.form.email')" prop="email">
          <el-input v-model="editForm.email" :placeholder="$t('admin.businessGroups.form.emailPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('admin.businessGroups.form.description')" prop="description">
          <el-input 
            v-model="editForm.description" 
            type="textarea" 
            :rows="3"
            :placeholder="$t('admin.businessGroups.form.descriptionPlaceholder')"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="updating" @click="updateGroup">
            {{ updating ? $t('common.updating') : $t('common.confirm') }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 成员管理对话框 -->
    <el-dialog 
      v-model="membersDialogVisible" 
      :title="$t('admin.businessGroups.dialog.members.title', { groupName: selectedGroup?.name })"
      width="800px"
      :close-on-click-modal="false"
    >
      <!-- 添加成员部分 -->
      <div class="add-member-section">
        <h4>{{ $t('admin.businessGroups.members.addMember') }}</h4>
        <div class="add-member-form">
          <el-select 
            v-model="selectedUserId" 
            :placeholder="$t('admin.businessGroups.members.selectUser')"
            style="width: 300px;"
            clearable
          >
            <el-option 
              v-for="user in availableUsers" 
              :key="user.id" 
              :label="`${user.name} (${user.email})`" 
              :value="user.id" 
            />
          </el-select>
          <el-button 
            type="primary" 
            :disabled="!selectedUserId"
            @click="addMember"
          >
            {{ $t('admin.businessGroups.actions.add') }}
          </el-button>
        </div>
      </div>
      
      <!-- 当前成员列表 -->
      <div class="current-members-section">
        <h4>{{ $t('admin.businessGroups.members.currentMembers', { count: groupMembers.length }) }}</h4>
        <el-table 
          :data="groupMembers" 
          v-loading="membersLoading"
          style="width: 100%"
          stripe
        >
          <el-table-column prop="name" :label="$t('admin.businessGroups.members.table.username')" width="150" />
          <el-table-column prop="email" :label="$t('admin.businessGroups.members.table.email')" min-width="200" />
          <el-table-column prop="role" :label="$t('admin.businessGroups.members.table.role')" width="120">
            <template #default="scope">
              <el-tag :type="getRoleType(scope.row.role)">
                {{ getRoleText(scope.row.role) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="joinedAt" :label="$t('admin.businessGroups.members.table.joinedAt')" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.joinedAt) }}
            </template>
          </el-table-column>
          <el-table-column :label="$t('admin.businessGroups.members.table.actions')" width="100">
            <template #default="scope">
              <el-button 
                type="danger" 
                size="small" 
                @click="removeMember(scope.row)"
              >
                {{ $t('admin.businessGroups.actions.remove') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="membersDialogVisible = false">{{ $t('common.close') }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'

export default {
  name: 'BusinessGroups',
  components: {
    Refresh
  },
  data() {
    return {
      // 数据加载状态
      loading: false,
      refreshing: false,
      membersLoading: false,
      
      // 业务组列表
      groups: [],
      
      // 搜索关键词
      searchKeyword: '',
      
      // 添加业务组对话框
      addDialogVisible: false,
      creating: false,
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
      updating: false,
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

    // 刷新业务组列表
    async refreshGroups() {
      this.refreshing = true
      try {
        await this.loadGroups()
      } finally {
        this.refreshing = false
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
          this.creating = true
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
          } finally {
            this.creating = false
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
          this.updating = true
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
          } finally {
            this.updating = false
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
@import '@/assets/styles/_mixins.scss';

.business-groups {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
  
  h1 {
    color: #303133;
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
  }
  
  .page-description {
    color: #606266;
    margin: 0;
    font-size: 14px;
  }
}

.filter-card {
  margin-bottom: 16px;
  
  .filter-form {
    margin: 0;
    
    :deep(.el-form-item) {
      margin-bottom: 0;
      margin-right: 16px;
      
      &:last-child {
        margin-right: 0;
      }
    }
    
    :deep(.el-form-item__label) {
      color: #606266;
      font-weight: 500;
    }
  }
}

.business-groups-list-card {
  :deep(.el-card__header) {
    background-color: #f8f9fa;
    border-bottom: 1px solid #ebeef5;
    padding: 16px 20px;
  }
  
  :deep(.el-card__body) {
    padding: 20px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  span {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}

.description-text {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #606266;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  
  :deep(.el-button) {
    &.el-button--small {
      padding: 5px 12px;
      font-size: 12px;
    }
  }
}

.add-member-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #ebeef5;
  
  h4 {
    margin-bottom: 16px;
    color: #303133;
    font-weight: 600;
    font-size: 16px;
  }
}

.add-member-form {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.current-members-section {
  h4 {
    margin-bottom: 16px;
    color: #303133;
    font-weight: 600;
    font-size: 16px;
  }
}

// 移动端适配
@include mobile {
  .business-groups {
    padding: 16px;
  }
  
  .filter-card {
    .filter-form {
      :deep(.el-form-item) {
        margin-right: 0;
        margin-bottom: 16px;
        
        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 4px;
    
    :deep(.el-button) {
      width: 100%;
      margin: 0;
    }
  }
  
  .add-member-form {
    flex-direction: column;
    align-items: stretch;
    
    :deep(.el-select) {
      width: 100%;
    }
    
    :deep(.el-button) {
      width: 100%;
    }
  }
}
</style>