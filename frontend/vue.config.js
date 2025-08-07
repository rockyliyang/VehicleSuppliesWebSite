const { defineConfig } = require('@vue/cli-service')
const path = require('path')
const AutoImport = require('unplugin-auto-import/webpack')
const Components = require('unplugin-vue-components/webpack')
const { ElementPlusResolver } = require('unplugin-vue-components/resolvers')

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
      filename: 'js/[name].[contenthash:8].js',
      chunkFilename: 'js/[name].[contenthash:8].js'
    },
    plugins: [
      // Element Plus 按需引入
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ],
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Vue ecosystem (vue, vue-router, vuex, vue-i18n)
          vue: {
            name: 'chunk-vue',
            test: /[\/]node_modules[\/](vue|vue-router|vuex|vue-i18n)[\/]/,
            priority: 20,
            chunks: 'all'
          },
          // Element Plus UI library (按需引入后会更小)
          elementPlus: {
            name: 'chunk-element-plus',
            test: /[\/]node_modules[\/](element-plus|@element-plus)[\/]/,
            priority: 15,
            chunks: 'all'
          },
          // Other major libraries
          libs: {
            name: 'chunk-libs',
            test: /[\/]node_modules[\/](axios|swiper|vue3-quill)[\/]/,
            priority: 10,
            chunks: 'all'
          },
          // Remaining vendor dependencies
          vendor: {
            name: 'chunk-vendors',
            test: /[\/]node_modules[\/]/,
            priority: 5,
            chunks: 'all',
            minChunks: 1
          }
        }
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

    // 删除默认的 prefetch 插件，避免预取大文件
    config.plugins.delete('prefetch')

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