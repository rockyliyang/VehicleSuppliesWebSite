<template>
  <div class="activate-page">
    <el-card class="activate-card">
      <h2 class="activate-title">账号激活</h2>
      <div class="activate-message">
        <el-result :icon="resultIcon" :title="resultTitle" :sub-title="resultSubTitle">
          <template #extra>
            <el-button type="primary" @click="goHome">返回首页</el-button>
          </template>
        </el-result>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'UserActivate',
  data() {
    return {
      resultIcon: 'success',
      resultTitle: '激活成功',
      resultSubTitle: '您的账号已成功激活，正在跳转首页...'
    }
  },
  mounted() {
    const token = this.$route.query.token;
    if (!token) {
      this.resultIcon = 'error';
      this.resultTitle = '激活失败';
      this.resultSubTitle = '激活链接无效，请检查链接或联系管理员。';
      return;
    }
    this.$api.get(`/users/activate?token=${token}`)
      .then(res => {
        if (res.success) {
          this.resultIcon = 'success';
          this.resultTitle = '激活成功';
          this.resultSubTitle = '您的账号已成功激活，正在跳转首页...';
          setTimeout(this.goHome, 2000);
        } else {
          this.resultIcon = 'error';
          this.resultTitle = '激活失败';
          this.resultSubTitle = res.message || '激活失败，请检查链接或联系管理员。';
        }
      })
      .catch(() => {
        this.resultIcon = 'error';
        this.resultTitle = '激活失败';
        this.resultSubTitle = '激活请求出错，请稍后重试。';
      });
  },
  methods: {
    goHome() {
      this.$router.push('/');
    }
  }
}
</script>

<style scoped>
.activate-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background: #f7f7f7;
}
.activate-card {
  width: 400px;
  padding: 30px 40px 20px 40px;
}
.activate-title {
  text-align: center;
  margin-bottom: 20px;
}
.activate-message {
  margin-top: 20px;
}
</style> 