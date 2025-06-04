---
description: 前端开发规则 - Vue.js组件、API调用、样式规范等
globs: 
alwaysApply: true
---
# 前端开发规则

## Vue.js 开发规范

### 组件命名规范

#### 文件命名
```
// 页面组件 - PascalCase
UserProfile.vue
ProductList.vue
OrderDetail.vue

// 通用组件 - PascalCase
BaseButton.vue
BaseInput.vue
BaseModal.vue

// 布局组件 - PascalCase
AppHeader.vue
AppSidebar.vue
AppFooter.vue
```

#### 组件注册
```javascript
// 全局组件注册 - kebab-case
Vue.component('base-button', BaseButton);
Vue.component('user-profile', UserProfile);

// 模板中使用 - kebab-case
<template>
  <div>
    <base-button @click="handleClick">点击</base-button>
    <user-profile :user="currentUser" />
  </div>
</template>
```

### 组件结构规范

#### 标准组件模板
```vue
<template>
  <div class="component-name">
    <!-- 组件内容 -->
    <div class="component-name__header">
      <h2 class="component-name__title">{{ title }}</h2>
    </div>
    
    <div class="component-name__content">
      <!-- 主要内容 -->
    </div>
    
    <div class="component-name__footer">
      <!-- 底部内容 -->
    </div>
  </div>
</template>

<script>
export default {
  name: 'ComponentName',
  
  components: {
    // 子组件
  },
  
  props: {
    title: {
      type: String,
      required: true,
      default: ''
    },
    data: {
      type: Object,
      default: () => ({})
    }
  },
  
  data() {
    return {
      loading: false,
      error: null,
      localData: {}
    };
  },
  
  computed: {
    // 计算属性
    formattedTitle() {
      return this.title.toUpperCase();
    }
  },
  
  watch: {
    // 监听器
    data: {
      handler(newVal) {
        this.localData = { ...newVal };
      },
      immediate: true,
      deep: true
    }
  },
  
  created() {
    // 组件创建时的逻辑
    this.initComponent();
  },
  
  mounted() {
    // 组件挂载后的逻辑
  },
  
  beforeDestroy() {
    // 组件销毁前的清理工作
  },
  
  methods: {
    // 初始化方法
    initComponent() {
      // 初始化逻辑
    },
    
    // 事件处理方法
    handleClick() {
      this.$emit('click', this.localData);
    },
    
    // API调用方法
    async fetchData() {
      try {
        this.loading = true;
        const response = await this.$api.getWithErrorHandler('/api/data', {
          fallbackKey: 'common.fetchError'
        });
        this.localData = response.data;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.component-name {
  // 组件根样式
  
  &__header {
    // 头部样式
  }
  
  &__title {
    // 标题样式
  }
  
  &__content {
    // 内容样式
  }
  
  &__footer {
    // 底部样式
  }
}
</style>
```

## 国际化规范

### 多语言支持架构

#### 翻译数据来源
前端的翻译数据来自后端数据库，通过以下流程加载：

1. **应用初始化时加载**：在 `store/index.js` 的 `initApp` 方法中调用语言模块初始化
2. **语言模块管理**：`store/modules/language.js` 负责语言状态管理和翻译数据加载
3. **后端API获取**：从 `/language/translations/{lang}` 接口获取翻译数据
4. **本地存储缓存**：翻译数据存储在 Vuex store 中，语言设置保存在 localStorage

#### 语言模块结构

```javascript
// store/modules/language.js
const state = {
  currentLang: 'zh-CN', // 当前语言
  supportedLanguages: ['zh-CN', 'en'], // 支持的语言
  translations: {} // 翻译数据：{ zh-CN: { key: value }, en: { key: value } }
};

const getters = {
  // 翻译函数
  translate: state => (key, defaultValue = key) => {
    const translations = state.translations[state.currentLang] || {};
    return translations[key] || defaultValue;
  }
};
```

#### 错误消息翻译

错误消息的翻译通过 `errorHandler.js` 处理：

```javascript
// utils/errorHandler.js
function getTranslation(key, defaultValue = key) {
  return store.getters['language/translate'](key, defaultValue);
}

function translateErrorMessage(message, fallbackKey) {
  // 1. 尝试从ERROR_MAPPINGS中匹配
  for (const [key, translationKey] of Object.entries(ERROR_MAPPINGS)) {
    if (message.includes(key)) {
      return getTranslation(translationKey);
    }
  }
  // 2. 使用fallbackKey获取翻译
  return getTranslation(fallbackKey);
}

static showError(error, fallbackKey, type = 'message') {
  const rawMessage = extractErrorMessage(error);
  const translatedMessage = translateErrorMessage(rawMessage, fallbackKey);
  // 显示翻译后的错误消息
}
```

#### 组件中使用翻译

1. **通过store获取翻译**：
```javascript
export default {
  computed: {
    // 获取翻译函数
    $t() {
      return this.$store.getters['language/translate'];
    }
  },
  methods: {
    // 切换语言
    async changeLanguage(lang) {
      await this.$store.dispatch('language/changeLanguage', lang);
    }
  }
};
```

2. **模板中使用**：
```vue
<template>
  <div>
    <h1>{{ $t('welcome.title') }}</h1>
    <p>{{ $t('welcome.description', '欢迎使用') }}</p>
    <button @click="changeLanguage('en')">English</button>
    <button @click="changeLanguage('zh-CN')">中文</button>
  </div>
</template>
```

#### API调用中的错误处理

```javascript
// 使用带错误处理的API调用
async fetchData() {
  try {
    const response = await this.$api.getWithErrorHandler('/api/data', {
      fallbackKey: 'common.fetchError' // 错误时的翻译键
    });
    this.data = response.data;
  } catch (error) {
    // 错误已经通过errorHandler自动翻译并显示
  }
}
```

#### 翻译键命名规范

1. **分层命名**：使用点分隔的层级结构
   - `common.error.network` - 通用网络错误
   - `user.error.notExists` - 用户相关错误
   - `product.success.added` - 产品相关成功消息

2. **语义清晰**：键名应该清楚表达含义
   - ✅ `order.error.notFound`
   - ❌ `order.err1`

3. **一致性**：同类型消息使用相同的命名模式
   - 错误：`module.error.type`
   - 成功：`module.success.type`
   - 警告：`module.warning.type`

## API 调用规范

### 统一API调用方法

#### 使用 `getWithErrorHandler` 和 `postWithErrorHandler`
```javascript
// GET 请求
async fetchUserData() {
  try {
    const response = await this.$api.getWithErrorHandler('/api/users/profile', {
      fallbackKey: 'user.fetchError'  // 错误时的国际化键名
    });
    this.userData = response.data;
  } catch (error) {
    // 错误已经被统一处理，这里可以做额外的错误处理
    console.error('获取用户数据失败:', error);
  }
}

// POST 请求
async saveUserData(userData) {
  try {
    const response = await this.$api.postWithErrorHandler('/api/users', userData, {
      fallbackKey: 'user.saveError'
    });
    this.$message.success(this.$t('user.saveSuccess'));
    return response.data;
  } catch (error) {
    // 错误已经被统一处理
    return null;
  }
}

// PUT 请求
async updateUserData(userId, userData) {
  try {
    const response = await this.$api.putWithErrorHandler(`/api/users/${userId}`, userData, {
      fallbackKey: 'user.updateError'
    });
    this.$message.success(this.$t('user.updateSuccess'));
    return response.data;
  } catch (error) {
    return null;
  }
}

// DELETE 请求
async deleteUser(userId) {
  try {
    await this.$api.deleteWithErrorHandler(`/api/users/${userId}`, {
      fallbackKey: 'user.deleteError'
    });
    this.$message.success(this.$t('user.deleteSuccess'));
    return true;
  } catch (error) {
    return false;
  }
}
```

#### 错误处理最佳实践
```javascript
// 1. 总是提供 fallbackKey
const response = await this.$api.getWithErrorHandler('/api/data', {
  fallbackKey: 'common.networkError'
});

// 2. 根据业务场景选择合适的错误键名
const userResponse = await this.$api.getWithErrorHandler('/api/users', {
  fallbackKey: 'user.fetchError'  // 用户相关错误
});

const productResponse = await this.$api.getWithErrorHandler('/api/products', {
  fallbackKey: 'product.fetchError'  // 产品相关错误
});

// 3. 在组件中处理加载状态
async fetchData() {
  this.loading = true;
  try {
    const response = await this.$api.getWithErrorHandler('/api/data', {
      fallbackKey: 'common.fetchError'
    });
    this.data = response.data;
  } finally {
    this.loading = false;
  }
}
```

### 请求拦截器配置
```javascript
// axios 请求拦截器
axios.interceptors.request.use(
  config => {
    // 添加认证头
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 添加请求ID用于追踪
    config.headers['X-Request-ID'] = generateRequestId();
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// axios 响应拦截器
axios.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // 统一错误处理
    if (error.response?.status === 401) {
      // Token过期，跳转到登录页
      router.push('/login');
    } else if (error.response?.status === 403) {
      // 权限不足
      Message.error('权限不足');
    }
    
    return Promise.reject(error);
  }
);
```

## 国际化规范

### 国际化键名规范

#### 键名命名规则
```javascript
// 1. 使用点号分隔的层级结构
// 2. 使用 camelCase 命名
// 3. 按功能模块分组

// 通用文本
common: {
  confirm: '确认',
  cancel: '取消',
  save: '保存',
  delete: '删除',
  edit: '编辑',
  add: '添加',
  search: '搜索',
  loading: '加载中...',
  noData: '暂无数据',
  networkError: '网络错误，请稍后重试',
  systemError: '系统错误，请联系管理员'
}

// 用户模块
user: {
  profile: '个人资料',
  username: '用户名',
  email: '邮箱',
  password: '密码',
  login: '登录',
  register: '注册',
  logout: '退出登录',
  fetchError: '获取用户信息失败',
  saveSuccess: '保存成功',
  saveError: '保存失败'
}

// 产品模块
product: {
  name: '产品名称',
  price: '价格',
  description: '产品描述',
  category: '分类',
  addToCart: '加入购物车',
  fetchError: '获取产品信息失败'
}
```

#### 在组件中使用国际化
```vue
<template>
  <div>
    <!-- 直接使用 $t() -->
    <h1>{{ $t('user.profile') }}</h1>
    
    <!-- 在属性中使用 -->
    <el-button :loading="loading">
      {{ loading ? $t('common.loading') : $t('common.save') }}
    </el-button>
    
    <!-- 带参数的国际化 -->
    <p>{{ $t('user.welcomeMessage', { name: userName }) }}</p>
    
    <!-- 复数形式 -->
    <p>{{ $tc('product.itemCount', productCount, { count: productCount }) }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      loading: false,
      userName: 'John',
      productCount: 5
    };
  },
  
  methods: {
    showMessage() {
      // 在JavaScript中使用
      this.$message.success(this.$t('common.saveSuccess'));
      
      // 错误消息
      this.$message.error(this.$t('common.networkError'));
    }
  }
};
</script>
```

## Element UI 组件规范

### 表单组件使用规范

#### 表单验证
```vue
<template>
  <el-form 
    ref="userForm" 
    :model="userForm" 
    :rules="formRules" 
    label-width="120px"
    class="user-form"
  >
    <el-form-item :label="$t('user.username')" prop="username">
      <el-input 
        v-model="userForm.username" 
        :placeholder="$t('user.usernamePlaceholder')"
        clearable
      />
    </el-form-item>
    
    <el-form-item :label="$t('user.email')" prop="email">
      <el-input 
        v-model="userForm.email" 
        type="email"
        :placeholder="$t('user.emailPlaceholder')"
        clearable
      />
    </el-form-item>
    
    <el-form-item>
      <el-button type="primary" @click="submitForm">
        {{ $t('common.submit') }}
      </el-button>
      <el-button @click="resetForm">
        {{ $t('common.reset') }}
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  data() {
    return {
      userForm: {
        username: '',
        email: ''
      },
      formRules: {
        username: [
          { 
            required: true, 
            message: this.$t('user.usernameRequired'), 
            trigger: 'blur' 
          },
          { 
            min: 3, 
            max: 20, 
            message: this.$t('user.usernameLength'), 
            trigger: 'blur' 
          }
        ],
        email: [
          { 
            required: true, 
            message: this.$t('user.emailRequired'), 
            trigger: 'blur' 
          },
          { 
            type: 'email', 
            message: this.$t('user.emailFormat'), 
            trigger: 'blur' 
          }
        ]
      }
    };
  },
  
  methods: {
    submitForm() {
      this.$refs.userForm.validate(async (valid) => {
        if (valid) {
          await this.saveUser();
        }
      });
    },
    
    resetForm() {
      this.$refs.userForm.resetFields();
    },
    
    async saveUser() {
      try {
        await this.$api.postWithErrorHandler('/api/users', this.userForm, {
          fallbackKey: 'user.saveError'
        });
        this.$message.success(this.$t('user.saveSuccess'));
      } catch (error) {
        // 错误已被统一处理
      }
    }
  }
};
</script>
```

#### 表格组件使用
```vue
<template>
  <div class="user-table">
    <el-table 
      :data="tableData" 
      :loading="loading"
      stripe
      border
      style="width: 100%"
    >
      <el-table-column 
        prop="username" 
        :label="$t('user.username')"
        width="150"
      />
      
      <el-table-column 
        prop="email" 
        :label="$t('user.email')"
        width="200"
      />
      
      <el-table-column 
        prop="createdAt" 
        :label="$t('common.createdAt')"
        width="180"
      >
        <template slot-scope="scope">
          {{ formatDate(scope.row.createdAt) }}
        </template>
      </el-table-column>
      
      <el-table-column 
        :label="$t('common.actions')"
        width="200"
      >
        <template slot-scope="scope">
          <el-button 
            size="mini" 
            type="primary" 
            @click="editUser(scope.row)"
          >
            {{ $t('common.edit') }}
          </el-button>
          
          <el-button 
            size="mini" 
            type="danger" 
            @click="deleteUser(scope.row)"
          >
            {{ $t('common.delete') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分页组件 -->
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="pagination.page"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pagination.pageSize"
      :total="pagination.total"
      layout="total, sizes, prev, pager, next, jumper"
      class="pagination"
    />
  </div>
</template>

<script>
export default {
  data() {
    return {
      tableData: [],
      loading: false,
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0
      }
    };
  },
  
  created() {
    this.fetchUsers();
  },
  
  methods: {
    async fetchUsers() {
      this.loading = true;
      try {
        const response = await this.$api.getWithErrorHandler('/api/users', {
          params: {
            page: this.pagination.page,
            pageSize: this.pagination.pageSize
          },
          fallbackKey: 'user.fetchError'
        });
        
        this.tableData = response.data.items;
        this.pagination.total = response.data.pagination.total;
      } finally {
        this.loading = false;
      }
    },
    
    handleSizeChange(val) {
      this.pagination.pageSize = val;
      this.pagination.page = 1;
      this.fetchUsers();
    },
    
    handleCurrentChange(val) {
      this.pagination.page = val;
      this.fetchUsers();
    },
    
    editUser(user) {
      this.$router.push(`/users/${user.id}/edit`);
    },
    
    async deleteUser(user) {
      try {
        await this.$confirm(
          this.$t('user.deleteConfirm', { name: user.username }),
          this.$t('common.warning'),
          {
            confirmButtonText: this.$t('common.confirm'),
            cancelButtonText: this.$t('common.cancel'),
            type: 'warning'
          }
        );
        
        await this.$api.deleteWithErrorHandler(`/api/users/${user.id}`, {
          fallbackKey: 'user.deleteError'
        });
        
        this.$message.success(this.$t('user.deleteSuccess'));
        this.fetchUsers();
      } catch (error) {
        // 用户取消或删除失败
      }
    },
    
    formatDate(date) {
      return this.$dayjs(date).format('YYYY-MM-DD HH:mm:ss');
    }
  }
};
</script>
```

## 样式规范

### SCSS 变量和混入

#### 颜色变量
```scss
// 主色调
$primary-color: #e53e3e;        // 红色主色调
$primary-light: #fc8181;        // 浅红色
$primary-dark: #c53030;         // 深红色

// 辅助色
$secondary-color: #4a5568;      // 灰色
$success-color: #38a169;        // 成功绿色
$warning-color: #d69e2e;        // 警告黄色
$error-color: #e53e3e;          // 错误红色
$info-color: #3182ce;           // 信息蓝色

// 中性色
$white: #ffffff;
$gray-50: #f7fafc;
$gray-100: #edf2f7;
$gray-200: #e2e8f0;
$gray-300: #cbd5e0;
$gray-400: #a0aec0;
$gray-500: #718096;
$gray-600: #4a5568;
$gray-700: #2d3748;
$gray-800: #1a202c;
$gray-900: #171923;
$black: #000000;

// 文本颜色
$text-primary: $gray-900;
$text-secondary: $gray-600;
$text-muted: $gray-500;
$text-disabled: $gray-400;
```

#### 尺寸变量
```scss
// 间距
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;
$spacing-2xl: 48px;
$spacing-3xl: 64px;

// 字体大小
$font-size-xs: 12px;
$font-size-sm: 14px;
$font-size-md: 16px;
$font-size-lg: 18px;
$font-size-xl: 20px;
$font-size-2xl: 24px;
$font-size-3xl: 30px;
$font-size-4xl: 36px;

// 行高
$line-height-tight: 1.25;
$line-height-normal: 1.5;
$line-height-relaxed: 1.75;

// 圆角
$border-radius-sm: 4px;
$border-radius-md: 8px;
$border-radius-lg: 12px;
$border-radius-xl: 16px;
$border-radius-full: 50%;

// 阴影
$shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
$shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
$shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
$shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
```

#### 常用混入
```scss
// 弹性布局
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@mixin flex-column {
  display: flex;
  flex-direction: column;
}

// 文本省略
@mixin text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@mixin text-ellipsis-multiline($lines: 2) {
  display: -webkit-box;
  -webkit-line-clamp: $lines;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

// 按钮样式
@mixin button-base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-sm $spacing-md;
  border: none;
  border-radius: $border-radius-md;
  font-size: $font-size-sm;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

@mixin button-primary {
  @include button-base;
  background-color: $primary-color;
  color: $white;
  
  &:hover:not(:disabled) {
    background-color: $primary-dark;
  }
}

// 卡片样式
@mixin card {
  background: $white;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-md;
  padding: $spacing-lg;
}

// 响应式断点
@mixin mobile {
  @media (max-width: 767px) {
    @content;
  }
}

@mixin tablet {
  @media (min-width: 768px) and (max-width: 1023px) {
    @content;
  }
}

@mixin desktop {
  @media (min-width: 1024px) {
    @content;
  }
}
```

### BEM 命名规范

#### BEM 结构
```scss
// Block（块）
.user-card {
  @include card;
  
  // Element（元素）
  &__header {
    @include flex-between;
    margin-bottom: $spacing-md;
    padding-bottom: $spacing-sm;
    border-bottom: 1px solid $gray-200;
  }
  
  &__avatar {
    width: 48px;
    height: 48px;
    border-radius: $border-radius-full;
    object-fit: cover;
  }
  
  &__info {
    flex: 1;
    margin-left: $spacing-md;
  }
  
  &__name {
    font-size: $font-size-lg;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: $spacing-xs;
  }
  
  &__email {
    font-size: $font-size-sm;
    color: $text-secondary;
  }
  
  &__actions {
    display: flex;
    gap: $spacing-sm;
  }
  
  &__button {
    @include button-base;
    
    // Modifier（修饰符）
    &--primary {
      @include button-primary;
    }
    
    &--secondary {
      background-color: $gray-100;
      color: $text-primary;
      
      &:hover:not(:disabled) {
        background-color: $gray-200;
      }
    }
    
    &--small {
      padding: $spacing-xs $spacing-sm;
      font-size: $font-size-xs;
    }
  }
  
  // 状态修饰符
  &--loading {
    opacity: 0.7;
    pointer-events: none;
  }
  
  &--disabled {
    opacity: 0.5;
    
    .user-card__button {
      cursor: not-allowed;
    }
  }
}
```

### 响应式设计

#### 移动端优先
```scss
.product-grid {
  display: grid;
  gap: $spacing-md;
  
  // 移动端：1列
  grid-template-columns: 1fr;
  
  // 平板：2列
  @include tablet {
    grid-template-columns: repeat(2, 1fr);
  }
  
  // 桌面端：3列
  @include desktop {
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-lg;
  }
  
  // 大屏幕：4列
  @media (min-width: 1200px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 $spacing-md;
  
  @include tablet {
    padding: 0 $spacing-lg;
  }
  
  @include desktop {
    padding: 0 $spacing-xl;
  }
}
```

## 路由规范

### 路由配置
```javascript
// router/index.js
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: 'home.title',
      requiresAuth: false
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: {
      title: 'auth.login',
      requiresAuth: false,
      hideForAuth: true  // 已登录用户隐藏
    }
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('@/views/users/UserList.vue'),
    meta: {
      title: 'user.list',
      requiresAuth: true,
      permissions: ['user:read']
    }
  },
  {
    path: '/users/:id',
    name: 'UserDetail',
    component: () => import('@/views/users/UserDetail.vue'),
    meta: {
      title: 'user.detail',
      requiresAuth: true,
      permissions: ['user:read']
    }
  }
];

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = i18n.t(to.meta.title);
  }
  
  // 检查认证
  if (to.meta.requiresAuth && !store.getters.isAuthenticated) {
    next('/login');
    return;
  }
  
  // 已登录用户访问登录页面时重定向
  if (to.meta.hideForAuth && store.getters.isAuthenticated) {
    next('/');
    return;
  }
  
  // 检查权限
  if (to.meta.permissions && !hasPermissions(to.meta.permissions)) {
    next('/403');
    return;
  }
  
  next();
});
```

### 路由跳转
```javascript
// 编程式导航
methods: {
  // 基本跳转
  goToUserList() {
    this.$router.push('/users');
  },
  
  // 带参数跳转
  goToUserDetail(userId) {
    this.$router.push(`/users/${userId}`);
  },
  
  // 命名路由跳转
  goToUserEdit(userId) {
    this.$router.push({
      name: 'UserEdit',
      params: { id: userId }
    });
  },
  
  // 带查询参数跳转
  goToUserList(filters) {
    this.$router.push({
      name: 'Users',
      query: filters
    });
  },
  
  // 替换当前路由
  replaceRoute() {
    this.$router.replace('/new-path');
  },
  
  // 返回上一页
  goBack() {
    this.$router.go(-1);
  }
}
```

## 状态管理规范

### Vuex Store 结构
```javascript
// store/modules/user.js
const state = {
  currentUser: null,
  userList: [],
  loading: false,
  error: null
};

const getters = {
  isAuthenticated: state => !!state.currentUser,
  userName: state => state.currentUser?.username || '',
  userPermissions: state => state.currentUser?.permissions || []
};

const mutations = {
  SET_CURRENT_USER(state, user) {
    state.currentUser = user;
  },
  
  SET_USER_LIST(state, users) {
    state.userList = users;
  },
  
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  
  SET_ERROR(state, error) {
    state.error = error;
  },
  
  CLEAR_ERROR(state) {
    state.error = null;
  }
};

const actions = {
  async fetchCurrentUser({ commit }) {
    try {
      commit('SET_LOADING', true);
      const response = await api.getWithErrorHandler('/api/user/profile', {
        fallbackKey: 'user.fetchError'
      });
      commit('SET_CURRENT_USER', response.data);
    } catch (error) {
      commit('SET_ERROR', error.message);
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  async login({ commit }, credentials) {
    try {
      commit('SET_LOADING', true);
      const response = await api.postWithErrorHandler('/api/auth/login', credentials, {
        fallbackKey: 'auth.loginError'
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      commit('SET_CURRENT_USER', user);
      
      return user;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  logout({ commit }) {
    localStorage.removeItem('token');
    commit('SET_CURRENT_USER', null);
  }
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};
```

### 在组件中使用 Vuex
```javascript
import { mapState, mapGetters, mapActions } from 'vuex';

export default {
  computed: {
    // 映射 state
    ...mapState('user', ['loading', 'error']),
    
    // 映射 getters
    ...mapGetters('user', ['isAuthenticated', 'userName']),
    
    // 本地计算属性
    displayName() {
      return this.userName || this.$t('user.guest');
    }
  },
  
  methods: {
    // 映射 actions
    ...mapActions('user', ['fetchCurrentUser', 'login', 'logout']),
    
    async handleLogin() {
      try {
        await this.login(this.loginForm);
        this.$router.push('/');
      } catch (error) {
        // 错误已被统一处理
      }
    }
  },
  
  created() {
    if (this.isAuthenticated) {
      this.fetchCurrentUser();
    }
  }
};
```

## 性能优化

### 组件懒加载
```javascript
// 路由懒加载
const UserList = () => import('@/views/users/UserList.vue');
const UserDetail = () => import('@/views/users/UserDetail.vue');

// 组件懒加载
export default {
  components: {
    UserModal: () => import('@/components/UserModal.vue'),
    ProductCard: () => import('@/components/ProductCard.vue')
  }
};
```

### 列表优化
```vue
<template>
  <div>
    <!-- 虚拟滚动（大数据量） -->
    <virtual-list
      :data-sources="largeDataList"
      :data-key="'id'"
      :keeps="30"
      :estimate-size="80"
    >
      <template v-slot="{ record }">
        <div class="list-item">
          {{ record.name }}
        </div>
      </template>
    </virtual-list>
    
    <!-- 普通列表（使用 key 优化） -->
    <div 
      v-for="item in dataList" 
      :key="item.id"
      class="list-item"
    >
      {{ item.name }}
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      dataList: [],
      largeDataList: []
    };
  },
  
  methods: {
    // 防抖搜索
    searchDebounced: debounce(function(query) {
      this.search(query);
    }, 300),
    
    async search(query) {
      // 搜索逻辑
    }
  }
};
</script>
```

### 图片优化
```vue
<template>
  <div>
    <!-- 懒加载图片 -->
    <img 
      v-lazy="imageUrl" 
      :alt="imageAlt"
      class="lazy-image"
    />
    
    <!-- 响应式图片 -->
    <picture>
      <source 
        media="(max-width: 768px)" 
        :srcset="mobileImageUrl"
      />
      <source 
        media="(min-width: 769px)" 
        :srcset="desktopImageUrl"
      />
      <img 
        :src="defaultImageUrl" 
        :alt="imageAlt"
        class="responsive-image"
      />
    </picture>
  </div>
</template>
```

---

> 📝 **注意**: 所有前端开发都应遵循以上规范，确保代码的一致性、可维护性和用户体验。