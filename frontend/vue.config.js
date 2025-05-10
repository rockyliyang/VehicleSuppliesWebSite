const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  devServer: {
    port: process.env.VUE_APP_PORT || 8080,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  // 开发环境开启源映射
  productionSourceMap: process.env.NODE_ENV !== 'production',
  transpileDependencies: true,
  configureWebpack: {
    devtool: 'source-map',
    output: {
      devtoolModuleFilenameTemplate: 'webpack://vehicle-supplies-website/[resource-path]?[hash]'
    }
  },
  chainWebpack: config => {
    config.devtool('source-map')
    
    // 配置Vue特性标志
    config.plugin('define').tap(args => {
      args[0].__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = 'false'
      return args
    })

    // 配置源映射加载器
    config.module
      .rule('source-map-loader')
      .test(/\.(js|vue)$/)
      .enforce('pre')
      .use('source-map-loader')
      .loader('source-map-loader')
      .options({
        filterSourceMappingUrl: (url, resourcePath) => {
          // 允许src目录下的所有文件生成源映射，排除node_modules
          return resourcePath.includes('src') && !resourcePath.includes('node_modules')
        }
      })

    // 添加对 Vue 单文件组件的特殊处理
    config.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => ({
        ...options,
        hotReload: true,
        sourceMap: true
      }))
  },
  css: {
    sourceMap: true
  }
})