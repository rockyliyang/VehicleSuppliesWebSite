<template>
  <footer class="site-footer">
    <div class="footer-main">
      <div class="container">
        <div class="footer-grid">
          <!-- 公司信息 -->
          <div class="footer-section company-section">
            <h3>公司信息</h3>
            <ul class="company-info">
              <li><el-icon><LocationInformation /></el-icon>{{ companyInfo.address || '---' }}</li>
              <li><el-icon><PhoneFilled /></el-icon>{{ companyInfo.phone || '---' }}</li>
              <li><el-icon><Message /></el-icon>{{ companyInfo.email || '---' }}</li>
            </ul>
          </div>

          <!-- 网站导航栏 -->
          <div class="footer-section nav-section">
            <h3>网站导航</h3>
            <ul class="footer-nav">
              <li><router-link to="/">首页</router-link></li>
              <li><router-link to="/products">产品列表</router-link></li>
              <li><router-link to="/about">关于</router-link></li>
              <li><router-link to="/news">新闻</router-link></li>
              <li><router-link to="/contact">联系</router-link></li>
              <li><router-link to="/login">用户模块</router-link></li>
            </ul>
          </div>

          <!-- 产品分类 -->
          <div class="footer-section category-section">
            <h3>产品分类</h3>
            <ul class="category-list">
              <li v-for="cat in categories" :key="cat.id">
                <router-link :to="`/products?category=${cat.id}`">
                  <span class="cat-name">{{ cat.name }}</span>
                  <span class="cat-desc">{{ cat.description }}</span>
                </router-link>
              </li>
            </ul>
          </div>

          <!-- 公司社交链接 -->
          <div class="footer-section social-section">
            <h3>社交链接</h3>
            <div class="social-links">
              <a v-if="companyInfo.wechat_qrcode" :href="companyInfo.wechat_qrcode" target="_blank" title="微信">
                <img :src="companyInfo.wechat_qrcode" alt="微信二维码" class="social-qrcode" />
              </a>
              <a v-if="companyInfo.weibo" :href="companyInfo.weibo" target="_blank" title="微博"><i class="iconfont icon-weibo"></i></a>
              <a v-if="companyInfo.qq" :href="companyInfo.qq" target="_blank" title="QQ"><i class="iconfont icon-qq"></i></a>
              <a v-if="companyInfo.douyin" :href="companyInfo.douyin" target="_blank" title="抖音"><i class="iconfont icon-douyin"></i></a>
              <a v-if="companyInfo.xiaohongshu" :href="companyInfo.xiaohongshu" target="_blank" title="小红书"><i class="iconfont icon-xiaohongshu"></i></a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="container">
        <p class="copyright">© 2023 AUTO EASE EXPERT CO., LTD. All Rights Reserved</p>
      </div>
    </div>
  </footer>
</template>

<script>
import { LocationInformation, PhoneFilled, Message } from '@element-plus/icons-vue';
export default {
  name: 'SiteFooter',
  components: { LocationInformation, PhoneFilled, Message },
  data() {
    return {
      companyInfo: {},
      categories: []
    };
  },
  async created() {
    // 获取公司信息
    try {
      const res = await this.$api.get('company');
      if (res.success && res.data) {
        this.companyInfo = res.data;
      }
    } catch (e) {
      // ignore error
    }
    // 获取产品分类
    try {
      const res = await this.$api.get('categories');
      if (res.success && res.data) {
        this.categories = res.data;
      }
    } catch (e) {
      // ignore error
    }
  }
}
</script>

<style scoped>
.site-footer {
  background-color: #333;
  color: #fff;
  margin-top: 50px;
}
.footer-main {
  padding: 50px 0;
}
.footer-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
.footer-section {
  flex: 1;
  min-width: 220px;
  margin-right: 30px;
  margin-bottom: 30px;
}
.footer-section:last-child {
  margin-right: 0;
}
.footer-section h3 {
  font-size: 18px;
  margin-bottom: 20px;
  position: relative;
  padding-bottom: 10px;
}
.footer-section h3:after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 50px;
  height: 2px;
  background-color: #e60012;
}
.company-info {
  list-style: none;
  padding: 0;
  margin: 0;
}
.company-info li {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  color: #ccc;
}
.company-info el-icon {
  margin-right: 8px;
}
.footer-nav {
  list-style: none;
  padding: 0;
  margin: 0;
}
.footer-nav li {
  margin-bottom: 10px;
}
.footer-nav a {
  color: #fff;
  text-decoration: none;
  transition: color 0.3s;
}
.footer-nav a:hover {
  color: #e60012;
}
.category-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.category-list li {
  margin-bottom: 10px;
}
.cat-name {
  font-weight: bold;
  color: #fff;
}
.cat-desc {
  color: #ccc;
  font-size: 12px;
  margin-left: 8px;
}
.social-section .social-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.social-qrcode {
  width: 60px;
  height: 60px;
  background: #fff;
  border-radius: 8px;
  padding: 4px;
}
.footer-bottom {
  background-color: #222;
  padding: 15px 0;
  text-align: center;
}
@media (max-width: 900px) {
  .footer-grid {
    flex-direction: column;
  }
  .footer-section {
    margin-right: 0;
  }
}
</style>