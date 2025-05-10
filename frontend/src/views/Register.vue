<template>
  <div class="register-container">
    <h2>用户注册</h2>
    <form @submit.prevent="handleRegister" class="register-form">
      <div class="form-group">
        <label for="username">用户名</label>
        <input
          type="text"
          id="username"
          v-model="form.username"
          required
          placeholder="请输入用户名"
        />
      </div>

      <div class="form-group">
        <label for="email">邮箱</label>
        <input
          type="email"
          id="email"
          v-model="form.email"
          required
          placeholder="请输入邮箱"
        />
      </div>

      <div class="form-group">
        <label for="phone">手机号</label>
        <input
          type="tel"
          id="phone"
          v-model="form.phone"
          required
          placeholder="请输入手机号"
        />
      </div>

      <div class="form-group">
        <label for="password">密码</label>
        <input
          type="password"
          id="password"
          v-model="form.password"
          required
          placeholder="请输入密码"
        />
      </div>

      <div class="form-group">
        <label for="confirmPassword">确认密码</label>
        <input
          type="password"
          id="confirmPassword"
          v-model="form.confirmPassword"
          required
          placeholder="请再次输入密码"
        />
      </div>

      <button type="submit" class="submit-btn" :disabled="loading">
        {{ loading ? '注册中...' : '注册' }}
      </button>

      <p class="login-link">
        已有账号？ <router-link to="/login">立即登录</router-link>
      </p>
    </form>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'UserRegister',
  data() {
    return {
      form: {
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
      },
      loading: false
    };
  },
  methods: {
    async handleRegister() {
      if (this.form.password !== this.form.confirmPassword) {
        alert('两次输入的密码不一致');
        return;
      }

      this.loading = true;
      try {
        await axios.post('/api/users/register', {
          username: this.form.username,
          email: this.form.email,
          phone: this.form.phone,
          password: this.form.password
        });

        alert('注册成功！');
        this.$router.push('/login');
      } catch (error) {
        alert(error.response?.data?.message || '注册失败，请稍后重试');
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.register-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.login-link {
  text-align: center;
  margin-top: 1rem;
}

.login-link a {
  color: #4CAF50;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>