<template>
  <div class="user-management">
    <h1>用户管理</h1>

    <el-card class="users-card">
      <template #header>
        <div class="card-header">
          <span>用户列表</span>
          <div class="header-actions">
            <el-button type="success" @click="showCreateUserDialog">新增用户</el-button>
            <el-button type="primary" @click="refreshUsers">刷新</el-button>
          </div>
        </div>
      </template>

      <!-- 筛选条件 -->
      <div class="filter-container">
        <div class="filter-item">
          <label class="filter-label">角色:</label>
          <el-select v-model="filters.role" placeholder="选择角色" clearable @change="handleFilterChange">
            <el-option label="管理员" value="admin" />
            <el-option label="业务人员" value="business" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </div>

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
      <el-table :data="paginatedUsers" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="姓名" width="140" show-overflow-tooltip />
        <el-table-column prop="email" label="邮箱" width="220" show-overflow-tooltip />
        <el-table-column prop="role" label="角色" width="120" align="center">
          <template #default="{row}">
            <el-tag :type="getRoleType(row.role)">{{ getRoleText(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="businessGroups" label="业务组" min-width="180">
          <template #default="{row}">
            <!-- 普通用户显示单个业务组 -->
            <div v-if="row.role === 'user'">
              <el-tag v-if="row.currentBusinessGroup" size="small" type="success">
                {{ row.currentBusinessGroup.name }}
              </el-tag>
              <span v-else class="no-group">未分配</span>
            </div>
            <!-- 管理员和业务人员显示多个业务组 -->
            <div v-else>
              <div v-if="row.businessGroups && row.businessGroups.length > 0">
                <el-tag v-for="group in row.businessGroups" :key="group.id" size="small"
                  style="margin-right: 5px; margin-bottom: 2px">
                  {{ group.name }}
                </el-tag>
              </div>
              <span v-else class="no-group">未分配</span>
            </div>
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
        <el-table-column label="操作" width="320" fixed="right" align="center">
          <template #default="{row}">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="showUserDetail(row)">详情</el-button>

              <!-- 普通用户显示业务组修改按钮 -->
              <el-button v-if="row.role === 'user'" type="success" size="small" @click="showBusinessGroupDialog(row)">
                业务组
              </el-button>

              <!-- 管理员和业务员显示编辑和删除按钮 -->
              <template v-if="row.role === 'admin' || row.role === 'business'">
                <el-button type="warning" size="small" @click="showEditUserDialog(row)">编辑</el-button>
                <el-button type="danger" size="small" @click="confirmDeleteUser(row)">删除</el-button>
              </template>
            </div>
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

    <!-- 用户详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="用户详情" width="600px">
      <div v-if="selectedUser" class="user-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ID">{{ selectedUser.id }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ selectedUser.name }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ selectedUser.email }}</el-descriptions-item>
          <el-descriptions-item label="角色">
            <el-tag :type="getRoleType(selectedUser.role)">{{ getRoleText(selectedUser.role) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="selectedUser.isActive ? 'success' : 'danger'">
              {{ selectedUser.isActive ? '已激活' : '未激活' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ formatDate(selectedUser.createdAt) }}</el-descriptions-item>
        </el-descriptions>

        <!-- 业务组信息 -->
        <div class="business-groups-section">
          <h4>业务组信息</h4>
          <!-- 普通用户显示单个业务组 -->
          <div v-if="selectedUser.role === 'user'">
            <div v-if="selectedUser.currentBusinessGroup">
              <el-tag size="large" type="success">
                {{ selectedUser.currentBusinessGroup.name }}
              </el-tag>
              <p style="margin-top: 10px; color: #606266; font-size: 14px;">
                {{ selectedUser.currentBusinessGroup.description || '暂无描述' }}
              </p>
            </div>
            <div v-else class="no-groups">
              <el-empty description="未分配到任何业务组" :image-size="60" />
            </div>
          </div>
          <!-- 管理员和业务人员显示多个业务组 -->
          <div v-else>
            <div v-if="selectedUser.businessGroups && selectedUser.businessGroups.length > 0">
              <el-tag v-for="group in selectedUser.businessGroups" :key="group.id" size="large"
                style="margin-right: 10px; margin-bottom: 5px">
                {{ group.name }}
              </el-tag>
            </div>
            <div v-else class="no-groups">
              <el-empty description="未分配到任何业务组" :image-size="60" />
            </div>
          </div>
        </div>

        <!-- 消息统计信息 -->
        <div v-if="selectedUser.messageStats" class="message-stats-section">
          <h4>消息处理统计</h4>
          <el-row :gutter="20">
            <el-col :span="6">
              <el-statistic title="总消息数" :value="selectedUser.messageStats.total" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="待处理" :value="selectedUser.messageStats.pending" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="处理中" :value="selectedUser.messageStats.inProgress" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="已完成" :value="selectedUser.messageStats.completed" />
            </el-col>
          </el-row>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 创建用户对话框 -->
    <el-dialog title="创建新用户" v-model="createUserDialogVisible" width="500px" :close-on-click-modal="false">
      <el-form :model="userForm" label-width="80px" label-position="left">
        <el-form-item label="用户名" required>
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="邮箱" required>
          <el-input v-model="userForm.email" type="email" placeholder="请输入邮箱" />
        </el-form-item>

        <el-form-item label="密码" required>
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码" />
        </el-form-item>

        <el-form-item label="用户角色" required>
          <el-select v-model="userForm.user_role" placeholder="请选择角色" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="业务人员" value="business" />
          </el-select>
        </el-form-item>

        <el-form-item label="手机号">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>

        <el-form-item label="业务组" v-if="userForm.user_role === 'admin' || userForm.user_role === 'business'">
          <el-select v-model="userForm.business_group_ids" multiple placeholder="请选择业务组" style="width: 100%">
            <el-option v-for="group in businessGroups" :key="group.id" :label="group.name" :value="group.id">
              <span>{{ group.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">
                {{ group.userCount || 0 }}人
              </span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="业务组" v-else-if="userForm.user_role === 'user'">
          <el-select v-model="userForm.business_group_id" placeholder="请选择业务组" style="width: 100%">
            <el-option v-for="group in businessGroups" :key="group.id" :label="group.name" :value="group.id">
              <span>{{ group.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">
                {{ group.userCount || 0 }}人
              </span>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createUserDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleCreateUser" :loading="creating">
            {{ creating ? '创建中...' : '创建用户' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑用户对话框 -->
    <el-dialog title="编辑用户信息" v-model="editUserDialogVisible" width="500px" :close-on-click-modal="false">
      <el-form :model="editUserForm" label-width="80px" label-position="left">
        <el-form-item label="用户名" required>
          <el-input v-model="editUserForm.username" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="邮箱" required>
          <el-input v-model="editUserForm.email" type="email" placeholder="请输入邮箱" />
        </el-form-item>

        <el-form-item label="用户角色" required>
          <el-select v-model="editUserForm.user_role" placeholder="请选择角色" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="业务人员" value="business" />
          </el-select>
        </el-form-item>

        <el-form-item label="手机号">
          <el-input v-model="editUserForm.phone" placeholder="请输入手机号" />
        </el-form-item>

        <el-form-item label="业务组" v-if="editUserForm.user_role === 'admin' || editUserForm.user_role === 'business'">
          <el-select v-model="editUserForm.business_group_ids" multiple placeholder="请选择业务组" style="width: 100%">
            <el-option v-for="group in businessGroups" :key="group.id" :label="group.name" :value="group.id">
              <span>{{ group.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">
                {{ group.userCount || 0 }}人
              </span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="业务组" v-else-if="editUserForm.user_role === 'user'">
          <el-select v-model="editUserForm.business_group_id" placeholder="请选择业务组" style="width: 100%">
            <el-option v-for="group in businessGroups" :key="group.id" :label="group.name" :value="group.id">
              <span>{{ group.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">
                {{ group.userCount || 0 }}人
              </span>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editUserDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleEditUser" :loading="editing">
            {{ editing ? '更新中...' : '更新用户' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>


export default {
  name: 'UserManagement',

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
        role: '',
        businessGroup: '',
        search: ''
      },
      
      // 分页
      currentPage: 1,
      pageSize: 10,
      total: 0, // 总记录数
      
      // 用户详情对话框
      detailDialogVisible: false,
      selectedUser: null,
      
      // 业务组修改对话框
      businessGroupDialogVisible: false,
      selectedUserForGroup: null,
      selectedBusinessGroupId: null,
      updating: false,
      
      // 创建用户对话框
      createUserDialogVisible: false,
      userForm: {
        username: '',
        email: '',
        password: '',
        phone: '',
        user_role: '',
        language: 'zh',
        business_group_id: null, // 普通用户单选业务组
        business_group_ids: [] // 管理员和业务员多选业务组
      },
      creating: false,
      
      // 编辑用户对话框
      editUserDialogVisible: false,
      editUserForm: {
        id: null,
        username: '',
        email: '',
        phone: '',
        user_role: '',
        language: 'zh',
        business_group_id: null, // 普通用户单选业务组
        business_group_ids: [] // 管理员和业务员多选业务组
      },
      editing: false,
      
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
    // 直接使用用户列表，因为后端已经处理了分页和过滤
    paginatedUsers() {
      return this.users
    }
  },
  created() {
    this.loadUsers()
    this.loadBusinessGroups()
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
    
    // 加载用户列表
    async loadUsers() {
      this.loading = true
      try {
        // 构建查询参数
        const params = {
          page: this.currentPage,
          pageSize: this.pageSize
        }
        
        // 添加过滤条件
        if (this.filters.role) {
          params.role = this.filters.role
        }
        if (this.filters.businessGroup) {
          params.businessGroup = this.filters.businessGroup
        }
        if (this.filters.search) {
          params.search = this.filters.search
        }
        
        const response = await this.$api.get('/admin/users', { params })
        if (response.success) {
          // 修复数据结构：API返回的是items，不是users
          const rawUsers = response.data.items || []
          this.total = response.data.total || 0
          // 字段名映射：将API字段转换为前端期望的字段
          this.users = rawUsers.map(user => ({
            id: user.id,
            name: user.username, // API返回username，前端期望name
            email: user.email,
            role: user.user_role || user.role, // API可能返回user_role或role
            businessGroups: user.business_groups || [], // 业务组信息（管理员和业务人员）
            currentBusinessGroup: user.current_business_group || null, // 当前业务组（普通用户）
            businessGroupId: user.business_group_id || null, // 业务组ID（普通用户）
            isActive: user.is_active !== false, // 默认为激活状态
            createdAt: user.created_at, // API返回created_at
            updatedAt: user.updated_at, // API返回updated_at
            business_group_count: user.business_group_count || 0
          }))
        } else {
          this.$messageHandler.showError(response.message, 'admin.users.error.loadFailed')
        }
      } catch (error) {
        console.error('加载用户列表失败:', error)
        this.$messageHandler.showError('加载用户列表失败', 'admin.users.error.loadFailed')
      } finally {
        this.loading = false
      }
    },
    
    // 加载业务组列表
    async loadBusinessGroups() {
      try {
        const response = await this.$api.get('/admin/business-groups')
        if (response.success) {
          // 修复数据结构：API返回的是items，不是groups
          const rawGroups = response.data.items || []
          // 字段名映射：将API字段转换为前端期望的字段
          this.businessGroups = rawGroups.map(group => ({
            id: group.id,
            name: group.group_name, // API返回group_name，前端期望name
            email: group.group_email,
            description: group.description,
            isDefault: group.is_default,
            userCount: group.member_count || 0, // API返回member_count
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
    
    // 显示用户详情
    async showUserDetail(user) {
      try {
        // 获取用户详细信息，包括消息统计
        const response = await this.$api.get(`/admin/users/${user.id}`)
        if (response.success) {
          // 修正数据映射：后端返回的数据结构
          const userData = response.data
          this.selectedUser = {
            id: userData.id,
            name: userData.username, // API返回username，前端期望name
            email: userData.email,
            phone: userData.phone,
            role: userData.user_role, // API返回user_role，前端期望role
            language: userData.language,
            isActive: userData.is_active !== false,
            createdAt: userData.created_at,
            updatedAt: userData.updated_at,
            businessGroups: userData.business_groups || [],
            messageStats: {
              total: userData.message_stats?.total_messages || 0,
              pending: userData.message_stats?.pending_messages || 0,
              inProgress: userData.message_stats?.processing_messages || 0,
              completed: userData.message_stats?.replied_messages || 0
            }
          }
          this.detailDialogVisible = true
        } else {
          this.$messageHandler.showError(response.message, 'admin.users.error.loadDetailFailed')
        }
      } catch (error) {
        console.error('加载用户详情失败:', error)
        this.$messageHandler.showError('加载用户详情失败', 'admin.users.error.loadDetailFailed')
      }
    },
    

    
    // 处理筛选条件变化
    handleFilterChange() {
      this.currentPage = 1 // 重置到第一页
      this.loadUsers() // 重新加载数据
    },
    
    // 处理每页显示数量变化
    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1 // 重置到第一页
      this.loadUsers() // 重新加载数据
    },
    
    // 处理页码变化
    handleCurrentChange(val) {
      this.currentPage = val
      this.loadUsers() // 重新加载数据
    },
    
    // 清除所有筛选条件
    clearFilters() {
      this.filters = {
        role: '',
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
    
    // 显示创建用户对话框
    showCreateUserDialog() {
      this.userForm = {
        username: '',
        email: '',
        password: '',
        phone: '',
        user_role: '',
        language: 'zh',
        business_group_id: null,
        business_group_ids: []
      }
      this.createUserDialogVisible = true
    },
    
    // 创建用户
    async handleCreateUser() {
      try {
        this.creating = true
        const response = await this.$api.post('/admin/users', this.userForm)
        if (response.success) {
          this.$messageHandler.showSuccess('用户创建成功', 'user.success.createUserSuccess')
          this.createUserDialogVisible = false
          this.loadUsers() // 重新加载用户列表
        } else {
          this.$messageHandler.showError(response.message, 'user.error.createUserFailed')
        }
      } catch (error) {
        console.error('创建用户失败:', error)
        this.$messageHandler.showError('创建用户失败', 'user.error.createUserFailed')
      } finally {
        this.creating = false
      }
    },
    
    // 显示编辑用户对话框
    async showEditUserDialog(user) {
      try {
        // 获取用户详细信息，包括业务组
        const response = await this.$api.get(`/admin/users/${user.id}`)
        if (response.success) {
          const userData = response.data
          const businessGroupIds = (userData.business_groups || []).map(group => group.id)
          
          this.editUserForm = {
            id: user.id,
            username: userData.username,
            email: userData.email,
            phone: userData.phone || '',
            user_role: userData.user_role,
            language: userData.language || 'zh',
            business_group_id: businessGroupIds.length > 0 ? businessGroupIds[0] : null,
            business_group_ids: businessGroupIds
          }
          this.editUserDialogVisible = true
        } else {
          this.$messageHandler.showError(response.message, 'admin.users.error.loadDetailFailed')
        }
      } catch (error) {
        console.error('加载用户信息失败:', error)
        this.$messageHandler.showError('加载用户信息失败', 'admin.users.error.loadDetailFailed')
      }
    },
    
    // 编辑用户
    async handleEditUser() {
      try {
        this.editing = true
        const response = await this.$api.put(`/admin/users/${this.editUserForm.id}`, {
          username: this.editUserForm.username,
          email: this.editUserForm.email,
          phone: this.editUserForm.phone,
          user_role: this.editUserForm.user_role,
          language: this.editUserForm.language
        })
        if (response.success) {
          this.$messageHandler.showSuccess('用户信息更新成功', 'user.success.updateUserSuccess')
          this.editUserDialogVisible = false
          this.loadUsers() // 重新加载用户列表
        } else {
          this.$messageHandler.showError(response.message, 'user.error.updateUserFailed')
        }
      } catch (error) {
        console.error('更新用户信息失败:', error)
        this.$messageHandler.showError('更新用户信息失败', 'user.error.updateUserFailed')
      } finally {
        this.editing = false
      }
    },
    
    // 确认删除用户
    confirmDeleteUser(user) {
      this.$confirm(
        `确定要删除用户 "${user.name}" 吗？此操作不可撤销。`,
        '删除确认',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
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
          this.$messageHandler.showSuccess('用户删除成功', 'user.success.deleteUserSuccess')
          this.loadUsers() // 重新加载用户列表
        } else {
          this.$messageHandler.showError(response.message, 'user.error.deleteUserFailed')
        }
      } catch (error) {
        console.error('删除用户失败:', error)
        this.$messageHandler.showError('删除用户失败', 'user.error.deleteUserFailed')
      }
    },
    
    // 更新用户业务组
    async updateUserBusinessGroup() {
      if (!this.selectedUserForGroup) return
      
      // 检查是否有变化
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
          this.loadUsers() // 重新加载列表
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
}

.no-groups {
  text-align: center;
  padding: $spacing-lg;

  :deep(.el-empty) {
    .el-empty__description {
      color: $text-color-secondary;
    }
  }
}

.no-group {
  color: $text-color-secondary;
  font-style: italic;
}

.message-stats-section {
  margin-top: $spacing-lg;

  h4 {
    margin-bottom: 15px;
    color: $text-color-primary;
    font-weight: 500;
  }

  :deep(.el-statistic) {
    .el-statistic__head {
      color: $text-color-regular;
      font-size: 14px;
    }

    .el-statistic__content {
      color: $text-color-primary;
      font-weight: 500;
    }
  }
}

:deep(.el-tag) {
  border-radius: $border-radius-sm;
  margin-right: 5px;
  margin-bottom: 2px;

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

:deep(.el-loading-mask) {
  border-radius: $border-radius-md;
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
</style>