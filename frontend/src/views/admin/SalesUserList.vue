<template>
  <div class="sales-user-list">
    <div class="page-header">
      <h1>{{ $t('admin.salesUsers.title') || '业务员管理' }}</h1>
      <p>{{ $t('admin.salesUsers.description') || '管理业务员账户，创建、编辑和删除业务员用户，分配业务组' }}</p>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :model="filters" inline>
        <el-form-item :label="$t('admin.salesUsers.filter.businessGroup') || '业务组'">
          <el-select v-model="filters.businessGroup"
            :placeholder="$t('admin.salesUsers.filter.businessGroupPlaceholder') || '选择业务组'" clearable
            @change="handleFilterChange" style="width: 200px;">
            <el-option :label="$t('common.all') || '全部'" value="" />
            <el-option v-for="group in businessGroups" :key="group.id" :label="group.name" :value="group.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('admin.salesUsers.filter.search') || '搜索'">
          <el-input v-model="filters.search" :placeholder="$t('admin.salesUsers.filter.searchPlaceholder') || '搜索姓名或邮箱'"
            clearable @input="handleFilterChange" style="width: 250px;" />
        </el-form-item>
        <el-form-item>
          <el-button @click="clearFilters">{{ $t('common.reset') || '重置' }}</el-button>
          <el-button type="success" @click="refreshUsers" :loading="refreshing">
            <el-icon>
              <Refresh />
            </el-icon>
            {{ $t('common.refresh') || '刷新' }}
          </el-button>
          <el-button type="primary" @click="showCreateDialog">{{ $t('admin.salesUsers.action.create') || '新增业务员'
            }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 业务员列表 -->
    <el-card class="sales-users-list-card">
      <template #header>
        <div class="card-header">
          <span>业务员列表</span>
        </div>
      </template>

      <!-- 用户列表 -->
      <el-table :data="paginatedUsers" style="width: 100%" v-loading="loading" stripe>
        <el-table-column prop="id" :label="$t('admin.salesUsers.table.id') || 'ID'" width="80" />
        <el-table-column prop="name" :label="$t('admin.salesUsers.table.name') || '姓名'" width="140"
          show-overflow-tooltip />
        <el-table-column prop="email" :label="$t('admin.salesUsers.table.email') || '邮箱'" width="220"
          show-overflow-tooltip />
        <el-table-column prop="role" :label="$t('admin.salesUsers.table.role') || '角色'" width="100" align="center">
          <template #default>
            <el-tag type="warning">{{ $t('admin.salesUsers.table.salesRole') || '业务员' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="businessGroups" :label="$t('admin.salesUsers.table.businessGroups') || '所属业务组'"
          min-width="180">
          <template #default="{row}">
            <div v-if="row.businessGroups && row.businessGroups.length > 0" class="business-groups">
              <el-tag v-for="group in row.businessGroups" :key="group.id" size="small" type="success"
                style="margin-right: 4px; margin-bottom: 2px;">
                {{ group.name }}
              </el-tag>
            </div>
            <span v-else class="no-group">{{ $t('admin.salesUsers.table.noGroup') || '未分配' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" :label="$t('admin.salesUsers.table.status') || '状态'" width="100"
          align="center">
          <template #default="{row}">
            <el-tag :type="row.isActive ? 'success' : 'danger'">
              {{ row.isActive ? ($t('admin.salesUsers.table.active') || '已激活') : ($t('admin.salesUsers.table.inactive')
              || '未激活') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" :label="$t('admin.salesUsers.table.createdAt') || '注册时间'" width="160"
          align="center">
          <template #default="{row}">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('admin.salesUsers.table.actions') || '操作'" width="250" fixed="right">
          <template #default="{row}">
            <el-button type="primary" size="small" @click="showUserDetail(row)">{{ $t('admin.salesUsers.action.detail')
              || '详情' }}</el-button>
            <el-button type="success" size="small" @click="showEditDialog(row)">{{ $t('admin.salesUsers.action.edit') ||
              '编辑' }}</el-button>
            <el-button type="danger" size="small" @click="confirmDelete(row)">{{ $t('admin.salesUsers.action.delete') ||
              '删除' }}</el-button>
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
    <el-dialog v-model="detailDialogVisible" :title="$t('admin.salesUsers.detail.title') || '业务员详情'" width="600px">
      <div v-if="selectedUser" class="user-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item :label="$t('admin.salesUsers.detail.id') || 'ID'">{{ selectedUser.id
            }}</el-descriptions-item>
          <el-descriptions-item :label="$t('admin.salesUsers.detail.name') || '姓名'">{{ selectedUser.name
            }}</el-descriptions-item>
          <el-descriptions-item :label="$t('admin.salesUsers.detail.email') || '邮箱'">{{ selectedUser.email
            }}</el-descriptions-item>
          <el-descriptions-item :label="$t('admin.salesUsers.detail.role') || '角色'">
            <el-tag type="warning">{{ $t('admin.salesUsers.table.salesRole') || '业务员' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('admin.salesUsers.detail.businessGroups') || '所属业务组'">
            <div v-if="selectedUser.businessGroups && selectedUser.businessGroups.length > 0" class="business-groups">
              <el-tag v-for="group in selectedUser.businessGroups" :key="group.id" type="success"
                style="margin-right: 4px; margin-bottom: 2px;">
                {{ group.name }}
              </el-tag>
            </div>
            <span v-else class="no-group">{{ $t('admin.salesUsers.table.noGroup') || '未分配' }}</span>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('admin.salesUsers.detail.status') || '状态'">
            <el-tag :type="selectedUser.isActive ? 'success' : 'danger'">
              {{ selectedUser.isActive ? ($t('admin.salesUsers.table.active') || '已激活') :
              ($t('admin.salesUsers.table.inactive') || '未激活') }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('admin.salesUsers.detail.createdAt') || '注册时间'">{{
            formatDate(selectedUser.createdAt) }}</el-descriptions-item>
          <el-descriptions-item :label="$t('admin.salesUsers.detail.updatedAt') || '更新时间'">{{
            formatDate(selectedUser.updatedAt) }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">{{ $t('common.close') || '关闭' }}</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 创建用户对话框 -->
    <el-dialog v-model="createDialogVisible" :title="$t('admin.salesUsers.create.title') || '新增业务员'" width="500px">
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
        <el-form-item :label="$t('admin.salesUsers.create.name') || '姓名'" prop="username">
          <el-input v-model="createForm.username"
            :placeholder="$t('admin.salesUsers.create.namePlaceholder') || '请输入姓名'" />
        </el-form-item>
        <el-form-item :label="$t('admin.salesUsers.create.email') || '邮箱'" prop="email">
          <el-input v-model="createForm.email"
            :placeholder="$t('admin.salesUsers.create.emailPlaceholder') || '请输入邮箱'" />
        </el-form-item>
        <el-form-item :label="$t('admin.salesUsers.create.password') || '密码'" prop="password">
          <el-input v-model="createForm.password" type="password"
            :placeholder="$t('admin.salesUsers.create.passwordPlaceholder') || '请输入密码'" show-password
            autocomplete="off" />
        </el-form-item>
        <el-form-item :label="$t('admin.salesUsers.create.businessGroup') || '业务组'" prop="businessGroupId">
          <el-select v-model="createForm.businessGroupId"
            :placeholder="$t('admin.salesUsers.create.businessGroupPlaceholder') || '请选择业务组'" style="width: 100%">
            <el-option v-for="group in businessGroups" :key="group.id" :label="group.name" :value="group.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createDialogVisible = false">{{ $t('common.cancel') || '取消' }}</el-button>
          <el-button type="primary" @click="createUser" :loading="creating">{{ creating ? ($t('common.creating') ||
            '创建中...') : ($t('common.confirm') || '确定') }}</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑用户对话框 -->
    <el-dialog v-model="editDialogVisible" :title="$t('admin.salesUsers.edit.title') || '编辑业务员'" width="600px">
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px">
        <el-form-item :label="$t('admin.salesUsers.edit.name') || '姓名'" prop="username">
          <el-input v-model="editForm.username" :placeholder="$t('admin.salesUsers.edit.namePlaceholder') || '请输入姓名'" />
        </el-form-item>
        <el-form-item :label="$t('admin.salesUsers.edit.email') || '邮箱'" prop="email">
          <el-input v-model="editForm.email" :placeholder="$t('admin.salesUsers.edit.emailPlaceholder') || '请输入邮箱'" />
        </el-form-item>
        <el-form-item :label="$t('admin.salesUsers.edit.password') || '密码'" prop="password">
          <el-input v-model="editForm.password" type="password"
            :placeholder="$t('admin.salesUsers.edit.passwordPlaceholder') || '留空则不修改密码'" show-password
            autocomplete="off" />
        </el-form-item>
        <el-form-item :label="$t('admin.salesUsers.edit.businessGroups') || '业务组'" v-if="canEditBusinessGroup">
          <el-select v-model="editForm.businessGroupIds"
            :placeholder="$t('admin.salesUsers.edit.businessGroupsPlaceholder') || '请选择业务组'" style="width: 100%"
            multiple clearable :disabled="!canEditBusinessGroup">
            <el-option v-for="group in businessGroups" :key="group.id" :label="group.name" :value="group.id">
              <span>{{ group.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">
                {{ group.userCount || 0 }}人
              </span>
            </el-option>
          </el-select>
          <div class="form-tip" v-if="!canEditBusinessGroup">
            <el-text type="info" size="small">{{ $t('admin.salesUsers.edit.noPermissionTip') || '您没有权限修改业务组'
              }}</el-text>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">{{ $t('common.cancel') || '取消' }}</el-button>
          <el-button type="primary" @click="updateUser" :loading="updating">{{ updating ? ($t('common.updating') ||
            '更新中...') : ($t('common.confirm') || '确定') }}</el-button>
        </span>
      </template>
    </el-dialog>


  </div>
</template>

<script>
export default {
  name: 'SalesUserList',

  data() {
    return {
      // 数据加载状态
      loading: false,
      refreshing: false,
      creating: false,
      updating: false,
      
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
        password: '',
        businessGroupId: null
      },
      
      editForm: {
        id: '',
        username: '',
        email: '',
        password: '',
        businessGroupIds: []
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
    },
    canEditBusinessGroup() {
      // 检查当前用户是否有权限编辑业务组
      // 这里假设只有admin角色可以编辑业务组
      return this.$store.state.user && this.$store.state.user.role === 'admin'
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
    
    // 加载业务员列表
    async loadUsers() {
      this.loading = true
      try {
        const params = {
          page: this.currentPage,
          pageSize: this.pageSize,
          role: 'business' // 只获取业务员
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
          this.total = response.data.pagination?.total || 0
          
          this.users = rawUsers.map(user => ({
            id: user.id,
            name: user.username,
            email: user.email,
            role: user.user_role || user.role,
            businessGroups: user.business_groups || [],
            businessGroupCount: user.business_group_count || 0,
            isActive: user.is_active !== false,
            createdAt: user.created_at,
            updatedAt: user.updated_at
          }))
        } else {
          this.$messageHandler.showError(response.message, 'admin.users.error.loadFailed')
        }
      } catch (error) {
        console.error('加载业务员列表失败:', error)
        this.$messageHandler.showError('加载业务员列表失败', 'admin.users.error.loadFailed')
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
    async refreshUsers() {
      this.refreshing = true;
      try {
        await this.loadUsers();
      } catch (error) {
        console.error('刷新用户列表失败:', error);
        this.$message.error('刷新用户列表失败');
      } finally {
        this.refreshing = false;
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
        businessGroup: '',
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
        password: '',
        businessGroupId: null
      }
      this.createDialogVisible = true
    },
    
    // 显示编辑对话框
    showEditDialog(user) {
      this.editForm = {
        id: user.id,
        username: user.name, // 修复：使用 user.name 而不是 user.username
        email: user.email,
        password: '',
        businessGroupIds: user.businessGroups ? user.businessGroups.map(group => group.id) : []
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
          user_role: 'business',
          business_group_id: this.createForm.businessGroupId
        })
        
        if (response.success) {
          this.$messageHandler.showSuccess('业务员创建成功', 'admin.users.success.createSuccess')
          this.createDialogVisible = false
          this.loadUsers()
        } else {
          this.$messageHandler.showError(response.message, 'admin.users.error.createFailed')
        }
      } catch (error) {
        console.error('创建业务员失败:', error)
        this.$messageHandler.showError('创建业务员失败', 'admin.users.error.createFailed')
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
        
        // 更新基本信息
        const response = await this.$api.put(`/admin/users/${this.editForm.id}`, updateData)
        
        if (response.success) {
          // 如果有权限且业务组发生变化，则更新业务组
          if (this.canEditBusinessGroup) {
            const currentUser = this.users.find(u => u.id === this.editForm.id)
            const currentBusinessGroupIds = currentUser.businessGroups ? currentUser.businessGroups.map(group => group.id) : []
            const newBusinessGroupIds = this.editForm.businessGroupIds || []
            
            // 检查业务组是否发生变化
            const hasChanged = currentBusinessGroupIds.length !== newBusinessGroupIds.length || 
                             !currentBusinessGroupIds.every(id => newBusinessGroupIds.includes(id))
            
            if (hasChanged) {
              const businessGroupResponse = await this.$api.patch(`/admin/users/${this.editForm.id}/business-groups`, {
                business_group_ids: newBusinessGroupIds
              })
              
              if (!businessGroupResponse.success) {
                this.$messageHandler.showError(businessGroupResponse.message, 'admin.users.error.businessGroupUpdateFailed')
                return
              }
            }
          }
          
          this.$messageHandler.showSuccess('业务员更新成功', 'admin.users.success.updateSuccess')
          this.editDialogVisible = false
          this.loadUsers()
        } else {
          this.$messageHandler.showError(response.message, 'admin.users.error.updateFailed')
        }
      } catch (error) {
        console.error('更新业务员失败:', error)
        this.$messageHandler.showError('更新业务员失败', 'admin.users.error.updateFailed')
      } finally {
        this.updating = false
      }
    },
    

    
    // 确认删除
    confirmDelete(user) {
      this.$confirm(`确定要删除业务员 "${user.name}" 吗？`, '确认删除', {
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
          this.$messageHandler.showSuccess('业务员删除成功', 'admin.users.success.deleteSuccess')
          this.loadUsers()
        } else {
          this.$messageHandler.showError(response.message, 'admin.users.error.deleteFailed')
        }
      } catch (error) {
        console.error('删除业务员失败:', error)
        this.$messageHandler.showError('删除业务员失败', 'admin.users.error.deleteFailed')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_mixins.scss';

.sales-users {
  @include page-container;
}

.page-header {
  @include page-header;
}

.filter-card {
  @include filter-card;
}

.sales-users-list-card {
  @include list-card;
}

.card-header {
  @include card-header;
}

.pagination-wrapper {
  @include pagination-wrapper;
}

.form-tip {
  margin-top: 5px;
}

.business-groups {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.no-group {
  color: #909399;
}

// 移动端适配
@include mobile {
  .filter-card {
    .el-form {
      .el-form-item {
        margin-bottom: 16px;
      }
    }
  }

  .sales-users-list-card {
    .el-table {
      font-size: 12px;
    }
  }

  .el-dialog {
    width: 90% !important;
    margin: 5vh auto !important;
  }
}
</style>