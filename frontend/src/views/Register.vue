<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-header">
        <img src="../assets/images/logo.png" alt="AUTO EASE EXPERT CO., LTD" class="logo">
        <h2>用户注册</h2>
      </div>
      
      <el-form :model="registerForm" :rules="registerRules" ref="registerForm" class="register-form">
        <el-form-item prop="username">
          <el-input 
            v-model="registerForm.username" 
            placeholder="用户名"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="email">
          <el-input 
            v-model="registerForm.email" 
            placeholder="电子邮箱"
          >
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="phone">
          <el-input 
            v-model="registerForm.phone" 
            placeholder="手机号码"
          >
            <template #prefix>
              <el-icon><PhoneFilled /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input 
            v-model="registerForm.password" 
            placeholder="密码" 
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input 
            v-model="registerForm.confirmPassword" 
            placeholder="确认密码" 
            show-password
            @keyup.enter="submitRegister"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="agreeTerms">我已阅读并同意<a href="javascript:;">服务条款</a>和<a href="javascript:;">隐私政策</a></el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="submitRegister" class="register-button" :disabled="!agreeTerms">注册</el-button>
        </el-form-item>
      </el-form>
      
      <div class="register-footer">
        <p>已有账号? <router-link to="/login">立即登录</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { ElMessage } from 'element-plus'

export default {
  name: 'UserRegister',
  data() {
    // 自定义验证器：确认密码
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== this.registerForm.password) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }
    
    return {
      registerForm: {
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
      },
      registerRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '用户名长度应为3-20个字符', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入电子邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的电子邮箱格式', trigger: 'blur' }
        ],
        phone: [
          { required: true, message: '请输入手机号码', trigger: 'blur' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请确认密码', trigger: 'blur' },
          { validator: validateConfirmPassword, trigger: 'blur' }
        ]
      },
      agreeTerms: false,
      loading: false
    }
  },
  methods: {
    submitRegister() {
      if (!this.agreeTerms) {
        ElMessage.warning('请阅读并同意服务条款和隐私政策')
        return
      }
      
      this.$refs.registerForm.validate(async valid => {
        if (valid) {
          try {
            this.loading = true
            const response = await axios.post('/api/users/register', {
              username: this.registerForm.username,
              email: this.registerForm.email,
              phone: this.registerForm.phone,
              password: this.registerForm.password
            })
            
            if (response.data.success) {
              ElMessage.success('注册成功，请登录')
              this.$router.push('/login')
            } else {
              ElMessage.error(response.data.message || '注册失败')
            }
          } catch (error) {
            console.error('注册失败:', error)
            if (error.response && error.response.data && error.response.data.message) {
              ElMessage.error(error.response.data.message)
            } else {
              ElMessage.error('注册失败，请稍后重试')
            }
          } finally {
            this.loading = false
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.register-page {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  background-image: url('../assets/images/login-bg.jpg');
  background-size: cover;
  background-position: center;
}

.register-container {
  width: 400px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  padding: 30px;
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  height: 50px;
  margin-bottom: 15px;
}

.register-header h2 {
  font-size: 24px;
  color: #333;
  margin: 0;
}

.register-form {
  margin-top: 20px;
}

.register-button {
  width: 100%;
}

.register-footer {
  text-align: center;
  margin-top: 20px;
  color: #666;
}

.register-footer a {
  color: #409EFF;
  text-decoration: none;
}

@media (max-width: 480px) {
  .register-container {
    width: 90%;
    padding: 20px;
  }
}
</style>