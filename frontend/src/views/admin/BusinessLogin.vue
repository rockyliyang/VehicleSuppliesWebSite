<template>
  <div class="business-login-page">
    <el-card class="business-login-card">
      <h2 class="business-login-title">业务员登录</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入业务员邮箱" autocomplete="off" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password autocomplete="off" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="loading">登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'BusinessLogin',
  data() {
    return {
      form: {
        email: '',
        password: ''
      },
      rules: {
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ]
      },
      loading: false
    }
  },
  methods: {
    submitForm() {
      this.$refs.formRef.validate(async valid => {
        if (!valid) return;
        this.loading = true;
        try {
          const res = await this.$api.postWithErrorHandler('/users/login', {
            username: this.form.email,
            password: this.form.password,
            role: 'business'
          });
          if (res.success) {
            this.$messageHandler.showSuccess('登录成功', 'login.success.loginSuccess');
            const { user } = res.data
            this.$store.commit('setUser', user)
            // 业务员登录后设置语言为中文
            await this.$store.dispatch('language/changeLanguageTemp', 'zh-CN');
            
            // 重定向到业务员专用页面
            let redirectPath = this.$route.query.redirect
            if (!redirectPath) {
              redirectPath = '/business'
            }
            this.$router.push(redirectPath)
          } else {
            this.$messageHandler.showError(res.message, 'business.login.error.loginFailed');
          }
        } catch (e) {
          this.$messageHandler.showError(e, 'business.login.error.loginFailed');
        } finally {
          this.loading = false;
        }
      });
    },

    
  }
}
</script>

<style scoped>
.business-login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background: #f7f7f7;
}

.business-login-card {
  width: 400px;
  padding: 30px 40px 20px 40px;
}

.business-login-title {
  text-align: center;
  margin-bottom: 20px;
}
</style>