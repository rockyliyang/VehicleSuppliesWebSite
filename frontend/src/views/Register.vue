<template>
  <div class="register-page">
    <el-card class="register-card">
      <h2 class="register-title">用户注册</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
        </el-form-item>
        <el-form-item label="验证码" prop="captcha">
          <el-input v-model="form.captcha" placeholder="请输入验证码" style="width: 120px; margin-right: 10px;" />
          <img :src="captchaUrl" @click="refreshCaptcha" class="captcha-img" alt="验证码" />
        </el-form-item>
        <el-form-item prop="agree">
          <el-checkbox v-model="form.agree">我已阅读并同意 <a href="/user-agreement" target="_blank">用户协议</a></el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="loading">注册</el-button>
        </el-form-item>
      </el-form>
      <div class="register-footer">
        已有账号？<router-link to="/login">去登录</router-link>
        <br />
        忘记密码？<router-link to="/forgot-password">找回密码</router-link>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'UserRegister',
  data() {
    return {
      form: {
        email: '',
        password: '',
        confirmPassword: '',
        captcha: '',
        agree: false
      },
      rules: {
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 8, message: '密码至少8位', trigger: 'blur' },
          { validator: (rule, value, callback) => {
              if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=]{8,}$/.test(value)) {
                callback(new Error('密码需包含字母和数字'));
              } else {
                callback();
              }
            }, trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请确认密码', trigger: 'blur' },
          { validator: (rule, value, callback) => {
              if (value !== this.form.password) {
                callback(new Error('两次输入的密码不一致'));
              } else {
                callback();
              }
            }, trigger: 'blur' }
        ],
        captcha: [
          { required: true, message: '请输入验证码', trigger: 'blur' }
        ],
        agree: [
          { required: true, type: 'boolean', validator: (rule, value, callback) => {
              if (!value) callback(new Error('请同意用户协议'));
              else callback();
            }, trigger: 'change' }
        ]
      },
      loading: false,
      captchaUrl: '/api/users/captcha?'+Date.now()
    }
  },
  methods: {
    refreshCaptcha() {
      this.captchaUrl = '/api/users/captcha?' + Date.now();
    },
    submitForm() {
      this.$refs.formRef.validate(async valid => {
        if (!valid) return;
        this.loading = true;
        try {
          const res = await this.$api.post('/users/register', {
            email: this.form.email,
            password: this.form.password,
            captcha: this.form.captcha
          });
          if (res.success) {
            this.$alert('注册成功，请前往邮箱激活账号！', '注册成功', {
              confirmButtonText: '去登录',
              callback: () => {
                this.$router.push('/login');
              }
            });
          } else {
            this.$message.error(res.message || '注册失败');
            this.refreshCaptcha();
          }
        } catch (e) {
          this.$message.error(e.response?.data?.message || '注册失败');
          this.refreshCaptcha();
        } finally {
          this.loading = false;
        }
      });
    }
  }
}
</script>

<style scoped>
.register-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background: #f7f7f7;
}
.register-card {
  width: 400px;
  padding: 30px 40px 20px 40px;
}
.register-title {
  text-align: center;
  margin-bottom: 20px;
}
.captcha-img {
  height: 32px;
  vertical-align: middle;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid #eee;
}
.register-footer {
  text-align: center;
  margin-top: 20px;
  color: #888;
}
</style>