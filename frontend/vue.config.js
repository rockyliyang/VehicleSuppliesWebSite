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
    // output: {
    //   devtoolModuleFilenameTemplate: info => {
    //     // 修复源映射路径重复问题
    //     const resourcePath = info.resourcePath.replace(/^src\//, '');
        
    //     // 特殊处理.vue文件，确保它们的源映射路径正确
    //     if (info.resourcePath.endsWith('.vue')) {
    //       return `webpack:///${info.resourcePath}`;
    //     }
        
    //     return `webpack:///${resourcePath}`;
    //   }
    // }
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