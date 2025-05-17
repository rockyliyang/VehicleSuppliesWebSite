/**
 * API使用示例
 * 本文件展示如何在组件中使用统一的API工具
 */

// 在Vue组件中使用
export const apiUsageInComponent = {
  // 获取产品列表示例
  async fetchProducts() {
    try {
      this.loading = true;
      // 使用$api替代axios
      const response = await this.$api.get('products');
      // response已经是标准格式 {success, message, data}
      this.products = response.data;
      // 可以使用response.message显示成功消息
      this.$message.success(response.message);
    } catch (error) {
      // 错误已在api.js中统一处理，这里可以做额外处理
      console.error('获取产品失败');
    } finally {
      this.loading = false;
    }
  },

  // 创建产品示例
  async createProduct(product) {
    try {
      const response = await this.$api.post('products', product);
      // 成功后返回数据
      return response.data;
    } catch (error) {
      // 返回null表示操作失败
      return null;
    }
  }
};

// 在Vuex actions中使用
export const apiUsageInVuex = {
  // 获取分类列表
  fetchCategories({ commit }) {
    return api.get('categories')
      .then(response => {
        // 直接使用response.data，因为已经是处理过的标准格式
        commit('setCategories', response.data);
        return response.data;
      })
      // 错误已在api.js中处理，这里可以做额外处理
      .catch(() => []);
  },

  // 用户登录
  login({ commit }, credentials) {
    return api.post('users/login', credentials)
      .then(response => {
        // 保存token
        localStorage.setItem('token', response.data.token);
        // 更新用户状态
        commit('setUser', response.data.user);
        return response.data.user;
      });
  }
};