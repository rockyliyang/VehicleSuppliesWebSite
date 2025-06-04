# Vue 2 到 Vue 3 升级计划

## 项目概况

当前项目使用Vue 2.7.16版本，需要升级到Vue 3.4.x版本。本文档提供具体的升级步骤和代码示例。

## 升级步骤

### 1. 更新package.json依赖

```json
{
  "name": "vehicle-supplies-website",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "serve": "vue-cli-service serve",
    "build": "vue-cli-service build",
    "lint": "vue-cli-service lint"
  },
  "dependencies": {
    "axios": "^1.6.7",
    "core-js": "^3.36.0",
    "element-plus": "^2.5.6", // 替换 element-ui
    "@element-plus/icons-vue": "^2.3.1", // 新增图标库
    "swiper": "^11.0.5",
    "vue": "^3.4.19", // 升级到 Vue 3
    "vue-router": "^4.2.5", // 升级到 Vue Router 4
    "vuex": "^4.1.0" // 升级到 Vuex 4
  },
  "devDependencies": {
    "@vue/cli-plugin-babel": "~5.0.8",
    "@vue/cli-plugin-eslint": "~5.0.8",
    "@vue/cli-plugin-router": "~5.0.8",
    "@vue/cli-plugin-vuex": "~5.0.8",
    "@vue/cli-service": "~5.0.8",
    "@vue/compiler-sfc": "^3.4.19", // 替换 vue-template-compiler
    "eslint": "^8.57.0",
    "eslint-plugin-vue": "^9.22.0",
    "sass": "^1.71.1",
    "sass-loader": "^14.1.1"
  }
}
```

### 2. 修改main.js

```js
// 修改前 (Vue 2)
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import './assets/css/global.css'

Vue.use(ElementUI)
Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')

// 修改后 (Vue 3)
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/css/global.css'

const app = createApp(App)

app.use(router)
app.use(store)
app.use(ElementPlus)
app.mount('#app')
```

### 3. 修改router/index.js

```js
// 修改前 (Vue Router 3)
import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes = [
  // 路由配置...
]

const router = new VueRouter({
  routes
})

export default router

// 修改后 (Vue Router 4)
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  // 路由配置保持不变...
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
```

### 4. 修改store/index.js

```js
// 修改前 (Vuex 3)
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    // ...
  },
  mutations: {
    // ...
  },
  actions: {
    // ...
  },
  getters: {
    // ...
  }
})

// 修改后 (Vuex 4)
import { createStore } from 'vuex'

export default createStore({
  state() {
    return {
      // 保持原有状态不变
    }
  },
  mutations: {
    // 保持原有mutations不变
  },
  actions: {
    // 保持原有actions不变
  },
  getters: {
    // 保持原有getters不变
  }
})
```

### 5. 组件模板语法更新

#### 5.1 插槽语法更新

```html
<!-- 修改前 (Vue 2) -->
<el-table-column label="操作" width="200" fixed="right">
  <template slot-scope="{row}">
    <el-button type="primary" size="mini" @click="handleEdit(row)">编辑</el-button>
    <el-button type="danger" size="mini" @click="handleDelete(row)">删除</el-button>
  </template>
</el-table-column>

<!-- 修改后 (Vue 3) -->
<el-table-column label="操作" width="200" fixed="right">
  <template #default="{row}">
    <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
    <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
  </template>
</el-table-column>
```

#### 5.2 Element UI 升级到 Element Plus

```html
<!-- 修改前 (Element UI) -->
<el-button type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>

<!-- 修改后 (Element Plus) -->
<el-button type="primary" @click="handleFilter">
  <el-icon><Search /></el-icon>
  搜索
</el-button>
```

```js
// 需要在组件中导入图标
import { Search } from '@element-plus/icons-vue'

export default {
  components: {
    Search
  }
  // ...
}
```

#### 5.3 生命周期钩子更新

```js
// 修改前 (Vue 2)
export default {
  beforeDestroy() {
    // 清理工作
  },
  destroyed() {
    // 组件销毁后的操作
  }
}

// 修改后 (Vue 3)
export default {
  beforeUnmount() {
    // 清理工作
  },
  unmounted() {
    // 组件销毁后的操作
  }
}
```

### 6. 组件大小属性变更

Element Plus中组件大小属性值变更：

- `mini` → `small`
- `small` → `default`
- `medium` → `large`

### 7. 图片加载错误处理更新

```js
// 修改前 (Vue 2)
handleImageError(e) {
  e.target.src = require('@/assets/images/default-image.svg')
}

// 修改后 (Vue 3)
import defaultImage from '@/assets/images/default-image.svg'

// 在methods中
handleImageError(e) {
  e.target.src = defaultImage
}
```

## 升级注意事项

1. **组件注册方式**：全局组件注册方式从 `Vue.component()` 变为 `app.component()`

2. **v-model 变更**：
   - Vue 2: `v-model="value"` 默认绑定到 `value` 属性和 `input` 事件
   - Vue 3: `v-model="value"` 默认绑定到 `modelValue` 属性和 `update:modelValue` 事件

3. **按需引入 Element Plus**：
   ```js
   // Vue 3 中按需引入 Element Plus
   import { ElButton, ElInput } from 'element-plus'
   
   const app = createApp(App)
   app.component(ElButton.name, ElButton)
   app.component(ElInput.name, ElInput)
   ```

4. **移除的API**：
   - `Vue.prototype` 替换为 `app.config.globalProperties`
   - 过滤器 (filters) 被移除，使用计算属性或方法代替
   - `$on`, `$off`, `$once` 方法被移除，使用外部事件库如 mitt

## 升级执行计划

1. 备份当前项目
2. 更新 package.json 并安装新依赖
3. 更新主要配置文件 (main.js, router/index.js, store/index.js)
4. 更新公共组件 (Header.vue, Footer.vue 等)
5. 逐个更新视图组件，优先处理简单组件
6. 更新 Element UI 相关代码到 Element Plus
7. 全面测试各功能
8. 修复发现的问题

## 参考资源

- [Vue 3 官方文档](https://cn.vuejs.org/)
- [Vue 3 迁移指南](https://v3.cn.vuejs.org/guide/migration/introduction.html)
- [Element Plus 文档](https://element-plus.org/zh-CN/)
- [Vue Router 4 文档](https://router.vuejs.org/zh/)
- [Vuex 4 文档](https://vuex.vuejs.org/zh/)