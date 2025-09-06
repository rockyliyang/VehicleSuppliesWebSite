const { defineConfig } = require('@vue/cli-service')
const path = require('path')

module.exports = defineConfig({
  // 设置公共路径，确保生产环境中静态资源能正确加载
  //publicPath: process.env.NODE_ENV === 'production' ? '/public' : '//',
  // 动态设置输出目录，支持构建时指定
  outputDir: process.env.VUE_OUTPUT_DIR || 'dist',
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
  configureWebpack: config => {
    // 基础配置
    config.devtool = process.env.NODE_ENV === 'production' ? false : 'source-map',
    config.output.devtoolModuleFilenameTemplate = info => {
      const resourcePath = path.normalize(info.resourcePath).replace(/\\/g, '/')
      
      // 特殊处理.vue文件，使用相对路径而非hash值确保断点正确工作
      if (info.resourcePath.endsWith('.vue')) {
        // 使用相对路径确保每个.vue文件都有唯一的标识
        const relativePath = path.relative(process.cwd(), info.absoluteResourcePath).replace(/\\/g, '/')
        return `webpack:///${info.moduleId}/${relativePath}`
      }
     
      return `webpack:///${resourcePath}`
    };
    
    // 优化配置
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\/]node_modules[\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true
          }
        }
      }
    };
    
    // 生产环境特定配置
    if (process.env.NODE_ENV === 'production') {
      const webpack = require('webpack');
      // 添加环境变量，确保sitemap生成器知道当前是生产环境
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.GENERATE_SITEMAP': JSON.stringify(true),
          'process.env.NODE_ENV': JSON.stringify('production')
        })
      );
      
      // 在构建完成后执行sitemap生成
      config.plugins.push({
        apply: compiler => {
          compiler.hooks.afterEmit.tapAsync('GenerateSitemap', (compilation, callback) => {
            // 确保NODE_ENV为production
            process.env.NODE_ENV = 'production';
            const { generateSitemap } = require('./src/utils/sitemapGenerator');
            console.log('开始生成sitemap.xml...');
            generateSitemap()
              .then(() => {
                console.log('sitemap.xml生成成功！');
                callback();
              })
              .catch(error => {
                console.error('sitemap.xml生成失败:', error);
                callback();
              });
          });
        }
      });
    }
    
    // 不返回config，直接修改传入的config对象
  },
  chainWebpack: config => {
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
  },
  css: {
    sourceMap: true,
    loaderOptions: {
      scss: {
        additionalData: `
          @import "@/assets/styles/_variables.scss";
          @import "@/assets/styles/_mixins.scss";
        `
      }
    }
  },
})