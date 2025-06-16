<template>
  <div class="user-management">
    <h2>用户管理</h2>

    <!-- 创建新用户表单 -->
    <div class="create-user-section">
      <h3>创建新用户</h3>
      <form @submit.prevent="handleCreateUser" class="user-form">
        <div class="form-group">
          <label for="userUsername">用户名</label>
          <input type="text" id="userUsername" v-model="userForm.username" required placeholder="请输入用户名" />
        </div>

        <div class="form-group">
          <label for="userEmail">邮箱</label>
          <input type="email" id="userEmail" v-model="userForm.email" required placeholder="请输入邮箱" />
        </div>

        <div class="form-group">
          <label for="userPassword">密码</label>
          <input type="password" id="userPassword" v-model="userForm.password" required placeholder="请输入密码" />
        </div>

        <div class="form-group">
          <label for="userRole">用户角色</label>
          <select id="userRole" v-model="userForm.user_role" required>
            <option value="">请选择角色</option>
            <option value="admin">管理员</option>
            <option value="business">业务人员</option>
            <option value="user">普通用户</option>
          </select>
        </div>

        <div class="form-group" v-if="userForm.user_role">
          <label for="userPhone">手机号</label>
          <input type="text" id="userPhone" v-model="userForm.phone" placeholder="请输入手机号" />
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? '创建中...' : '创建用户' }}
        </button>
      </form>
    </div>

    <!-- 筛选和搜索 -->
    <div class="filter-section">
      <div class="filter-controls">
        <div class="form-group">
          <label for="roleFilter">角色筛选</label>
          <select id="roleFilter" v-model="filters.role" @change="fetchUsers">
            <option value="">全部角色</option>
            <option value="admin">管理员</option>
            <option value="business">业务人员</option>
            <option value="user">普通用户</option>
          </select>
        </div>
        <div class="form-group">
          <label for="keywordSearch">关键词搜索</label>
          <input type="text" id="keywordSearch" v-model="filters.keyword" @input="debounceSearch" placeholder="搜索用户名或邮箱" />
        </div>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="users-list-section">
      <h3>用户列表</h3>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>用户名</th>
              <th>邮箱</th>
              <th>手机号</th>
              <th>角色</th>
              <th>业务组数量</th>
              <th>语言</th>
              <th>注册时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.username }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.phone || '-' }}</td>
              <td>{{ getRoleDisplay(user.user_role) }}</td>
              <td>{{ user.business_group_count || 0 }}</td>
              <td>{{ getLanguageDisplay(user.language) }}</td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td>
                <button class="action-btn detail-btn" @click="handleViewDetail(user.id)">
                  详情
                </button>
                <button class="action-btn edit-btn" @click="handleEditUser(user)">
                  编辑
                </button>
                <button class="action-btn delete-btn" @click="handleDeleteUser(user.id)"
                  :disabled="user.user_role === 'admin' && user.id === currentUserId">
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- 分页 -->
      <div class="pagination" v-if="pagination.totalPages > 1">
        <button @click="changePage(pagination.page - 1)" :disabled="pagination.page <= 1">上一页</button>
        <span>第 {{ pagination.page }} 页，共 {{ pagination.totalPages }} 页</span>
        <button @click="changePage(pagination.page + 1)" :disabled="pagination.page >= pagination.totalPages">下一页</button>
      </div>
    </div>

    <!-- 用户详情模态框 -->
    <div v-if="showDetailModal" class="modal-overlay" @click="closeDetailModal">
      <div class="modal-content" @click.stop>
        <h3>用户详情</h3>
        <div v-if="userDetail" class="detail-content">
          <div class="detail-row">
            <label>用户ID:</label>
            <span>{{ userDetail.id }}</span>
          </div>
          <div class="detail-row">
            <label>用户名:</label>
            <span>{{ userDetail.username }}</span>
          </div>
          <div class="detail-row">
            <label>邮箱:</label>
            <span>{{ userDetail.email }}</span>
          </div>
          <div class="detail-row">
            <label>手机号:</label>
            <span>{{ userDetail.phone || '-' }}</span>
          </div>
          <div class="detail-row">
            <label>用户角色:</label>
            <span>{{ getRoleDisplay(userDetail.user_role) }}</span>
          </div>
          <div class="detail-row">
            <label>语言偏好:</label>
            <span>{{ getLanguageDisplay(userDetail.language) }}</span>
          </div>
          <div class="detail-row">
            <label>注册时间:</label>
            <span>{{ formatDate(userDetail.created_at) }}</span>
          </div>
          <div class="detail-row">
            <label>最后更新:</label>
            <span>{{ formatDate(userDetail.updated_at) }}</span>
          </div>
          <div class="detail-row" v-if="userDetail.business_groups && userDetail.business_groups.length > 0">
            <label>关联业务组:</label>
            <div class="business-groups-list">
              <span v-for="group in userDetail.business_groups" :key="group.id" class="business-group-tag">
                {{ group.name }}
              </span>
            </div>
          </div>
          <div class="detail-row" v-else>
            <label>关联业务组:</label>
            <span>无</span>
          </div>
        </div>
        <div v-else class="loading-content">
          <span>加载中...</span>
        </div>
        <div class="modal-actions">
          <button type="button" class="cancel-btn" @click="closeDetailModal">关闭</button>
        </div>
      </div>
    </div>

    <!-- 编辑用户模态框 -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <h3>编辑用户信息</h3>
        <form @submit.prevent="handleUpdateUser" class="edit-form">
          <!-- 管理员和业务人员可以编辑所有信息 -->
          <div class="form-group" v-if="canEditUserInfo">
            <label for="editUsername">用户名</label>
            <input type="text" id="editUsername" v-model="editForm.username" required />
          </div>
          <div class="form-group" v-else>
            <label>用户名</label>
            <span class="readonly-field">{{ editForm.username }}</span>
          </div>

          <div class="form-group" v-if="canEditUserInfo">
            <label for="editEmail">邮箱</label>
            <input type="email" id="editEmail" v-model="editForm.email" required />
          </div>
          <div class="form-group" v-else>
            <label>邮箱</label>
            <span class="readonly-field">{{ editForm.email }}</span>
          </div>

          <div class="form-group" v-if="canEditUserInfo">
            <label for="editPhone">手机号</label>
            <input type="text" id="editPhone" v-model="editForm.phone" />
          </div>
          <div class="form-group" v-else>
            <label>手机号</label>
            <span class="readonly-field">{{ editForm.phone || '-' }}</span>
          </div>

          <div class="form-group" v-if="canEditUserInfo">
            <label for="editRole">用户角色</label>
            <select id="editRole" v-model="editForm.user_role">
              <option value="admin">管理员</option>
              <option value="business">业务人员</option>
              <option value="user">普通用户</option>
            </select>
          </div>
          <div class="form-group" v-else>
            <label>用户角色</label>
            <span class="readonly-field">{{ getRoleDisplay(editForm.user_role) }}</span>
          </div>

          <div class="form-group" v-if="canEditUserInfo">
            <label for="editLanguage">语言偏好</label>
            <select id="editLanguage" v-model="editForm.language">
              <option value="">英文 (默认)</option>
              <option value="zh">中文</option>
              <option value="en">英文</option>
            </select>
          </div>
          <div class="form-group" v-else>
            <label>语言偏好</label>
            <span class="readonly-field">{{ getLanguageDisplay(editForm.language) }}</span>
          </div>

          <!-- 普通用户只能修改业务组 -->
          <div class="form-group" v-if="!canEditUserInfo">
            <label for="editBusinessGroups">业务组</label>
            <div class="business-groups-section">
              <div v-if="availableBusinessGroups.length > 0">
                <div v-for="group in availableBusinessGroups" :key="group.id" class="checkbox-group">
                  <input 
                    type="checkbox" 
                    :id="'group-' + group.id" 
                    :value="group.id" 
                    v-model="editForm.business_groups"
                  />
                  <label :for="'group-' + group.id">{{ group.name }}</label>
                </div>
              </div>
              <div v-else>
                <span class="no-groups">暂无可用业务组</span>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="cancel-btn" @click="closeEditModal">取消</button>
            <button type="submit" class="submit-btn" :disabled="loading">{{ loading ? '保存中...' : '保存' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
// 使用全局注册的$api替代axios

export default {
  name: 'UserManagement',
  data() {
    return {
      users: [],
      userForm: {
        username: '',
        email: '',
        password: '',
        user_role: '',
        phone: ''
      },
      // 用户详情模态框
      showDetailModal: false,
      userDetail: null,
      
      editForm: {
        id: null,
        username: '',
        email: '',
        phone: '',
        language: '',
        user_role: '',
        business_groups: []
      },
      filters: {
        role: '',
        keyword: ''
      },
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0
      },
      availableBusinessGroups: [],
      showEditModal: false,
      loading: false,
      searchTimeout: null,
      currentUserId: null
    };
  },
  created() {
    this.fetchUsers();
    this.loadBusinessGroups();
    this.getCurrentUser();
  },
  computed: {
    canEditUserInfo() {
      return this.editForm.user_role === 'admin' || this.editForm.user_role === 'business';
    }
  },
  methods: {
    async fetchUsers() {
      try {
        const params = {
          page: this.pagination.page,
          pageSize: this.pagination.pageSize
        };
        
        if (this.filters.role) {
          params.role = this.filters.role;
        }
        
        if (this.filters.keyword) {
          params.keyword = this.filters.keyword;
        }
        
        const response = await this.$api.getWithErrorHandler('/admin/users', {
          params,
          fallbackKey: 'user.error.fetchListFailed'
        });
        
        if (response.data && response.data.items) {
          this.users = response.data.items;
          this.pagination = {
            ...this.pagination,
            ...response.data.pagination
          };
        } else {
          this.users = [];
        }
      } catch (error) {
        this.$messageHandler.showError(error, 'user.error.fetchListFailed');
      }
    },
    async handleCreateUser() {
      this.loading = true;
      try {
        const response = await this.$api.postWithErrorHandler('/admin/users', this.userForm, {
          fallbackKey: 'user.error.createUserFailed'
        });
        this.$messageHandler.showSuccess(response.message || '用户创建成功', 'user.success.createSuccess');
        this.userForm = {
          username: '',
          email: '',
          password: '',
          user_role: '',
          phone: ''
        };
        this.fetchUsers();
      } catch (error) {
        this.$messageHandler.showError(error, 'user.error.createUserFailed');
      } finally {
        this.loading = false;
      }
    },
    async handleDeleteUser(userId) {
      if (!confirm('确定要删除该用户吗？')) {
        return;
      }

      try {
        const response = await this.$api.deleteWithErrorHandler(`/admin/users/${userId}`, {
          fallbackKey: 'user.error.deleteFailed'
        });
        this.$messageHandler.showSuccess(response.message || '用户删除成功', 'user.success.deleteSuccess');
        this.fetchUsers();
      } catch (error) {
        this.$messageHandler.showError(error, 'user.error.deleteFailed');
      }
    },
    async handleEditUser(user) {
      this.editForm = {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        language: user.language || '',
        user_role: user.user_role,
        business_groups: []
      };
      
      // 如果是普通用户，加载其业务组信息
      if (user.user_role === 'user') {
        await this.loadUserBusinessGroups(user.id);
      }
      
      this.showEditModal = true;
    },
    async handleUpdateUser() {
      this.loading = true;
      try {
        let updateData = {};
        
        if (this.canEditUserInfo) {
          // 管理员和业务人员可以修改所有信息
          updateData = {
            username: this.editForm.username,
            email: this.editForm.email,
            phone: this.editForm.phone,
            language: this.editForm.language,
            user_role: this.editForm.user_role
          };
        } else {
          // 普通用户只能修改业务组
          updateData = {
            business_groups: this.editForm.business_groups
          };
        }
        
        const response = await this.$api.putWithErrorHandler(`/admin/users/${this.editForm.id}`, updateData, {
          fallbackKey: 'user.error.updateFailed'
        });
        
        this.$messageHandler.showSuccess(response.message || '用户信息更新成功', 'user.success.updateSuccess');
        this.closeEditModal();
        this.fetchUsers();
      } catch (error) {
        this.$messageHandler.showError(error, 'user.error.updateFailed');
      } finally {
        this.loading = false;
      }
    },
    // 查看用户详情
    async handleViewDetail(userId) {
      try {
        this.showDetailModal = true;
        this.userDetail = null; // 先清空，显示加载状态
        
        const response = await this.$api.getWithErrorHandler(`/admin/users/${userId}`, {
          fallbackKey: 'user.error.fetchDetailFailed'
        });
        
        this.userDetail = response.data;
      } catch (error) {
        this.$messageHandler.showError(error, 'user.error.fetchDetailFailed');
        this.closeDetailModal();
      }
    },
    
    // 关闭详情模态框
    closeDetailModal() {
      this.showDetailModal = false;
      this.userDetail = null;
    },

    closeEditModal() {
      this.showEditModal = false;
      this.editForm = {
        id: null,
        username: '',
        email: '',
        phone: '',
        language: '',
        user_role: '',
        business_groups: []
      };
    },
    getRoleDisplay(role) {
      const roleMap = {
        'admin': '管理员',
        'business': '业务人员',
        'user': '普通用户'
      };
      return roleMap[role] || role;
    },
    getLanguageDisplay(language) {
      if (!language || language === 'en') {
        return '英文';
      }
      if (language === 'zh') {
        return '中文';
      }
      return language;
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleString();
    },
    async loadBusinessGroups() {
      try {
        const response = await this.$api.getWithErrorHandler('/admin/business-groups', {
          fallbackKey: 'user.error.loadBusinessGroupsFailed'
        });
        this.availableBusinessGroups = response.data?.items || [];
      } catch (error) {
        console.error('加载业务组失败:', error);
      }
    },
    async loadUserBusinessGroups(userId) {
      try {
        const response = await this.$api.getWithErrorHandler(`/admin/users/${userId}/business-groups`, {
          fallbackKey: 'user.error.loadUserBusinessGroupsFailed'
        });
        this.editForm.business_groups = response.data?.map(group => group.id) || [];
      } catch (error) {
        console.error('加载用户业务组失败:', error);
      }
    },
    async getCurrentUser() {
      try {
        const response = await this.$api.getWithErrorHandler('/users/profile', {
          fallbackKey: 'user.error.getCurrentUserFailed'
        });
        this.currentUserId = response.data?.id;
      } catch (error) {
        console.error('获取当前用户信息失败:', error);
      }
    },
    debounceSearch() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
      this.searchTimeout = setTimeout(() => {
        this.pagination.page = 1;
        this.fetchUsers();
      }, 500);
    },
    changePage(page) {
      if (page >= 1 && page <= this.pagination.totalPages) {
        this.pagination.page = page;
        this.fetchUsers();
      }
    }
  }
};
</script>

<style scoped>
.user-management {
  padding: 2rem;
}

.create-user-section {
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.user-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
}

.filter-section {
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.filter-controls {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.filter-controls .form-group {
  min-width: 200px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 500;
}

input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.submit-btn {
  background-color: #4CAF50;
  color: white;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-btn:hover {
  background-color: #45a049;
}

.submit-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

th,
td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f5f5f5;
  font-weight: 500;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-right: 0.5rem;
}

.detail-btn {
  background-color: #17a2b8;
  color: white;
}

.detail-btn:hover {
  background-color: #138496;
}

.edit-btn {
  background-color: #2196F3;
  color: white;
}

.edit-btn:hover {
  background-color: #1976D2;
}

.delete-btn {
  background-color: #f44336;
  color: white;
}

.delete-btn:hover {
  background-color: #d32f2f;
}

.delete-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.cancel-btn {
  background-color: #757575;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn:hover {
  background-color: #616161;
}

select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.readonly-field {
  padding: 0.5rem;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  display: block;
  color: #666;
}

.business-groups-section {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.5rem;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.checkbox-group input[type="checkbox"] {
  margin: 0;
}

.checkbox-group label {
  margin: 0;
  cursor: pointer;
}

.no-groups {
  color: #666;
  font-style: italic;
}

/* 详情模态框样式 */
.detail-content {
  max-height: 400px;
  overflow-y: auto;
}

.detail-row {
  display: flex;
  margin-bottom: 15px;
  align-items: flex-start;
}

.detail-row label {
  font-weight: bold;
  min-width: 100px;
  margin-right: 15px;
  color: #333;
}

.detail-row span {
  flex: 1;
  color: #666;
}

.business-groups-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.business-group-tag {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  border: 1px solid #bbdefb;
}

.loading-content {
  text-align: center;
  padding: 40px;
  color: #666;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
}

.pagination button:hover:not(:disabled) {
  background-color: #f5f5f5;
}

.pagination button:disabled {
  background-color: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}
</style>