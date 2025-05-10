<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <img src="../assets/images/logo.png" alt="AUTO EASE EXPERT CO., LTD" class="logo">
        <h2>用户登录</h2>
      </div>

      <el-tabs v-model="activeTab" class="login-tabs">
        <el-tab-pane label="账号登录" name="account">
          <el-form :model="loginForm" :rules="loginRules" ref="loginForm" class="login-form">
            <el-form-item prop="username">
              <el-input v-model="loginForm.username" placeholder="用户名/邮箱">
                <template #prefix>
                  <el-icon>
                    <User />
                  </el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="loginForm.password" placeholder="密码" show-password @keyup.enter="submitLogin">
                <template #prefix>
                  <el-icon>
                    <Lock />
                  </el-icon>
                </template>
              </el-input>
            </el-form-item>
            <div class="remember-forgot">
              <el-checkbox v-model="rememberMe">记住我</el-checkbox>
              <a href="javascript:;" class="forgot-password">忘记密码?</a>
            </div>
            <el-form-item>
              <el-button type="primary" :loading="loading" @click="submitLogin" class="login-button">登录</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="手机登录" name="phone">
          <el-form :model="phoneForm" :rules="phoneRules" ref="phoneForm" class="login-form">
            <el-form-item prop="phone">
              <el-input v-model="phoneForm.phone" placeholder="手机号码">
                <template #prefix>
                  <el-icon>
                    <PhoneFilled />
                  </el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item prop="code">
              <div class="code-input">
                <el-input v-model="phoneForm.code" placeholder="验证码" @keyup.enter="submitPhoneLogin">
                  <template #prefix>
                    <el-icon>
                      <Message />
                    </el-icon>
                  </template>
                </el-input>
                <el-button type="primary" :disabled="codeSending || cooldown > 0" @click="sendCode" class="code-button">
                  {{ cooldown > 0 ? `${cooldown}秒后重新获取` : '获取验证码' }}
                </el-button>
              </div>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="loading" @click="submitPhoneLogin" class="login-button">登录</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div class="login-footer">
        <p>还没有账号? <router-link to="/register">立即注册</router-link></p>
        <p>或者使用以下方式登录</p>
        <div class="social-login">
          <i class="el-icon-s-platform"></i>
          <i class="el-icon-s-promotion"></i>
          <i class="el-icon-s-custom"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { ElMessage } from 'element-plus'

export default {
  name: 'UserLogin',
  data() {
    return {
      activeTab: 'account',
      loginForm: {
        username: '',
        password: ''
      },
      phoneForm: {
        phone: '',
        code: ''
      },
      loginRules: {
        username: [
          { required: true, message: '请输入用户名或邮箱', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ]
      },
      phoneRules: {
        phone: [
          { required: true, message: '请输入手机号码', trigger: 'blur' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
        ],
        code: [
          { required: true, message: '请输入验证码', trigger: 'blur' },
          { pattern: /^\d{6}$/, message: '验证码为6位数字', trigger: 'blur' }
        ]
      },
      rememberMe: false,
      loading: false,
      codeSending: false,
      cooldown: 0,
      timer: null
    }
  },
  methods: {

    submitLogin() {
      this.$refs.loginForm.validate(async valid => {
        if (valid) {
          try {
            debugger;
            this.loading = true
            const response = await axios.post('/api/users/login', {
              username: this.loginForm.username,
              password: this.loginForm.password
            })
            
            if (response.data.success) {
              // 保存token和用户信息
              localStorage.setItem('token', response.data.data.token)
              localStorage.setItem('user', JSON.stringify(response.data.data.user))
              
              // 如果是管理员，设置管理员标志
              if (response.data.data.user.is_admin) {
                localStorage.setItem('isAdmin', 'true')
              }
              
              ElMessage.success('登录成功')
              
              // 根据用户角色跳转到不同页面
              if (response.data.data.user.is_admin) {
                this.$router.push('/admin')
              } else {
                // 如果有上一页，则返回上一页，否则跳转到首页
                if (this.$route.query.redirect) {
                  this.$router.push(this.$route.query.redirect)
                } else {
                  this.$router.push('/')
                }
              }
            } else {
              ElMessage.error(response.data.message || '登录失败')
            }
          } catch (error) {
            console.error('登录失败:', error)
            ElMessage.error('登录失败，请稍后重试')
          } finally {
            this.loading = false
          }
        }
      })
    },
    submitPhoneLogin() {
      this.$refs.phoneForm.validate(valid => {
        if (valid) {
          // 实际项目中会调用手机登录API
          this.loading = true
          setTimeout(() => {
            this.loading = false
            ElMessage.success('登录成功')
            this.$router.push('/')
          }, 1500)
        }
      })
    },
    sendCode() {
      this.$refs.phoneForm.validateField('phone', valid => {
        if (!valid) {
          // 实际项目中会调用发送验证码API
          this.codeSending = true
          setTimeout(() => {
            this.codeSending = false
            ElMessage.success('验证码已发送')
            this.startCooldown()
          }, 1000)
        }
      })
    },
    startCooldown() {
      this.cooldown = 60
      this.timer = setInterval(() => {
        this.cooldown--
        if (this.cooldown <= 0) {
          clearInterval(this.timer)
        }
      }, 1000)
    }
  },
  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  background-image: url('../assets/images/login-bg.jpg');
  background-size: cover;
  background-position: center;
}

.login-container {
  width: 400px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  height: 50px;
  margin-bottom: 15px;
}

.login-header h2 {
  font-size: 24px;
  color: #333;
  margin: 0;
}

.login-tabs {
  margin-bottom: 20px;
}

.login-form {
  margin-top: 20px;
}

.remember-forgot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.forgot-password {
  color: #409EFF;
  text-decoration: none;
}

.login-button {
  width: 100%;
}

.code-input {
  display: flex;
}

.code-button {
  margin-left: 10px;
  width: 120px;
}

.login-footer {
  text-align: center;
  margin-top: 30px;
  color: #666;
}

.login-footer p {
  margin: 10px 0;
}

.login-footer a {
  color: #409EFF;
  text-decoration: none;
}

.social-login {
  display: flex;
  justify-content: center;
  margin-top: 15px;
}

.social-login i {
  font-size: 24px;
  margin: 0 10px;
  color: #666;
  cursor: pointer;
  transition: color 0.3s;
}

.social-login i:hover {
  color: #409EFF;
}

@media (max-width: 480px) {
  .login-container {
    width: 90%;
    padding: 20px;
  }

  .code-button {
    width: 100px;
    font-size: 12px;
    padding: 0;
  }
}
</style>