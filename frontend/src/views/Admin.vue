<template>
  <div class="admin-page">
    <el-container>
      <el-aside width="250px">
        <div class="admin-logo">
          <img src="../assets/images/logo.png" alt="AUTO EASE EXPERT CO., LTD">
          <h2>管理后台</h2>
        </div>
        <el-menu :default-active="activeMenu" class="admin-menu" background-color="#304156" text-color="#bfcbd9"
          active-text-color="#409EFF" router>
          <el-menu-item index="/admin/dashboard">
            <el-icon>
              <HomeFilled />
            </el-icon>
            <span>控制面板</span>
          </el-menu-item>
          <el-sub-menu index="products">
            <template #title>
              <el-icon>
                <Goods />
              </el-icon>
              <span>产品管理</span>
            </template>
            <el-menu-item index="/admin/products">产品列表</el-menu-item>
            <el-menu-item index="/admin/categories">分类管理</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/admin/banners">
            <el-icon>
              <PictureIcon />
            </el-icon>
            <span>Banner管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/company">
            <el-icon>
              <OfficeBuilding />
            </el-icon>
            <span>公司信息</span>
          </el-menu-item>
          <el-menu-item index="/admin/users">
            <el-icon>
              <User />
            </el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/settings">
            <el-icon>
              <Setting />
            </el-icon>
            <span>系统设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <el-header>
          <div class="header-left">
            <el-icon class="toggle-sidebar">
              <Fold />
            </el-icon>
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/admin' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item>{{ currentPage }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <el-dropdown trigger="click">
              <span class="admin-user">
                <img src="../assets/images/avatar.jpg" class="user-avatar">
                <span>管理员</span>
                <el-icon>
                  <ArrowDown />
                </el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>个人信息</el-dropdown-item>
                  <el-dropdown-item>修改密码</el-dropdown-item>
                  <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <el-main>
          <!-- 子路由内容区域 -->
          <router-view></router-view>
        </el-main>


      </el-container>
    </el-container>
  </div>
</template>

<script>
import { HomeFilled, Goods, Picture as PictureIcon, OfficeBuilding, User, Setting, Fold, ArrowDown } from '@element-plus/icons-vue'

export default {
  name: 'AdminPage',
  components: {
    HomeFilled,
    Goods,
    PictureIcon,
    OfficeBuilding,
    User,
    Setting,
    Fold,
    ArrowDown
  },
  data() {
    return {
      activeMenu: '/admin/products',
      currentPage: '产品管理'
    }
  },
  watch: {
    '$route'(to) {
      // 根据路由更新当前页面标题和活动菜单
      if (to.path.includes('/admin/dashboard')) {
        this.activeMenu = '/admin/dashboard'
        this.currentPage = '控制面板'
      } else if (to.path.includes('/admin/products')) {
        this.activeMenu = '/admin/products'
        this.currentPage = '产品管理'
      } else if (to.path.includes('/admin/categories')) {
        this.activeMenu = '/admin/categories'
        this.currentPage = '分类管理'
      } else if (to.path.includes('/admin/banners')) {
        this.activeMenu = '/admin/banners'
        this.currentPage = 'Banner管理'
      } else if (to.path.includes('/admin/company')) {
        this.activeMenu = '/admin/company'
        this.currentPage = '公司信息'
      } else if (to.path.includes('/admin/users')) {
        this.activeMenu = '/admin/users'
        this.currentPage = '用户管理'
      } else if (to.path.includes('/admin/settings')) {
        this.activeMenu = '/admin/settings'
        this.currentPage = '系统设置'
      }
    }
  },
  methods: {
    logout() {
      this.$confirm('确定要退出登录吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 清除admin token
        localStorage.removeItem('admin_token')
        this.$store.commit('setUser', null)
        this.$router.push({ path: '/admin-login', query: { redirect: '/admin' } })
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.admin-page {
  height: 100vh;
  overflow: hidden;
}

.el-aside {
  background-color: #304156;
  color: #fff;
  height: 100vh;
  overflow-x: hidden;
}

.admin-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
  background-color: #263445;
}

.admin-logo img {
  height: 40px;
  margin-right: 10px;
}

.admin-logo h2 {
  font-size: 18px;
  color: #fff;
  margin: 0;
}

.admin-menu {
  border-right: none;
}

.el-header {
  background-color: #fff;
  color: #333;
  line-height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 21, 41, .08);
  position: relative;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
}

.toggle-sidebar {
  font-size: 20px;
  cursor: pointer;
  margin-right: 15px;
}

.admin-user {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
  height: calc(100vh - 120px);
  overflow-y: auto;
}



.admin-content {
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 20px;
  margin: 0;
}

.filter-container {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}
</style>