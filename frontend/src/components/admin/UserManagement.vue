<template>
  <div class="user-management">
    <h2>用户管理</h2>

    <!-- 创建新管理员表单 -->
    <div class="create-admin-section">
      <h3>创建新管理员</h3>
      <form @submit.prevent="handleCreateAdmin" class="admin-form">
        <div class="form-group">
          <label for="adminUsername">用户名</label>
          <input type="text" id="adminUsername" v-model="adminForm.username" required placeholder="请输入用户名" />
        </div>

        <div class="form-group">
          <label for="adminEmail">邮箱</label>
          <input type="email" id="adminEmail" v-model="adminForm.email" required placeholder="请输入邮箱" />
        </div>

        <div class="form-group">
          <label for="adminPassword">密码</label>
          <input type="password" id="adminPassword" v-model="adminForm.password" required placeholder="请输入密码" />
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? '创建中...' : '创建管理员' }}
        </button>
      </form>
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
              <td>{{ user.user_role === 'admin' ? '管理员' : '普通用户' }}</td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td>
                <button class="action-btn delete-btn" @click="handleDeleteUser(user.id)"
                  :disabled="user.user_role === 'admin'">
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
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
      adminForm: {
        username: '',
        email: '',
        password: ''
      },
      loading: false
    };
  },
  created() {
    this.fetchUsers();
  },
  methods: {
    async fetchUsers() {
      try {
        const response = await this.$api.get('users/admin/users');
        // 使用标准响应格式
        this.users = response.data || [];
      } catch (error) {
        this.$errorHandler.showError(error, 'user.error.fetchListFailed');
      }
    },
    async handleCreateAdmin() {
      this.loading = true;
      try {
        const response = await this.$api.postWithErrorHandler('users/admin/create', this.adminForm);
        this.$errorHandler.showSuccess(response.message || '管理员创建成功', 'user.success.adminCreateSuccess');
        this.adminForm = {
          username: '',
          email: '',
          password: ''
        };
        this.fetchUsers();
      } catch (error) {
        this.$errorHandler.showError(error, 'user.error.createAdminFailed');
      } finally {
        this.loading = false;
      }
    },
    async handleDeleteUser(userId) {
      if (!confirm('确定要删除该用户吗？')) {
        return;
      }

      try {
        const response = await this.$api.delete(`users/admin/${userId}`);
        this.$errorHandler.showSuccess(response.message || '用户删除成功', 'user.success.deleteSuccess');
        this.fetchUsers();
      } catch (error) {
        this.$errorHandler.showError(error, 'user.error.deleteFailed');
      }
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleString();
    }
  }
};
</script>

<style scoped>
.user-management {
  padding: 2rem;
}

.create-admin-section {
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.admin-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
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
</style>