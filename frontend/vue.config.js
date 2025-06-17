const { defineConfig } = require('@vue/cli-service')
const path = require('path')

module.exports = defineConfig({
  devServer: {
    port: process.env.VUE_APP_PORT || 8080,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/public/static': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/static': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/product-images/upload': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
    }
  },
  // 开发环境开启源映射
  productionSourceMap: process.env.NODE_ENV !== 'production',
  transpileDependencies: true,
  configureWebpack: {
    devtool: 'source-map',
     output: {
       devtoolModuleFilenameTemplate: info => {
          const resourcePath = path.normalize(info.resourcePath).replace(/\\/g, '/')
          
          // 特殊处理.vue文件，使用相对路径而非hash值确保断点正确工作
          if (info.resourcePath.endsWith('.vue')) {
            // 使用相对路径确保每个.vue文件都有唯一的标识
            const relativePath = path.relative(process.cwd(), info.absoluteResourcePath).replace(/\\/g, '/')
            return `webpack:///${info.moduleId}/${relativePath}`
          }
         
          return `webpack:///${resourcePath}`
        }
     }
  },
  chainWebpack: config => {
    config.devtool('source-map')
    
    // 配置页面标题
    config.plugin('html').tap(args => {
      args[0].title = '汽车用品供应商' //set web title
      return args
    })
    
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



    // 确保.vue文件的源映射正确生成
    config.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => ({
        ...options,
        hotReload: true,
        sourceMap: true,
        exposeFilename: true
      }))


  },
  css: {
    sourceMap: true
  }
})