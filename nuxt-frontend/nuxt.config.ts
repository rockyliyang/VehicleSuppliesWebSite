// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  // 开发服务器配置
  devServer: {
    port: 5000
  },
  devtools: { enabled: true },
  
  // Nuxt 4 目录结构配置
  srcDir: 'app/',
  
  // SSR 配置
  ssr: true,
  
  // 路由配置
  router: {
    options: {
      strict: false
    }
  },
    hooks: {
    'pages:extend' (pages) {
      // 动态添加产品详情页面路由（仅保留实际存在的页面）
      pages.push({
        name: 'product-detail',
        path: '/product/:id',
        file: '~/pages/product/[id].vue'
      });
    },
/*
    'build:done': async () => {
      console.log('🗺️  开始生成sitemap...');
      try {
        const { generateSitemap } = require('./app/utils/sitemapGenerator');
        await generateSitemap();
        console.log('✅ Sitemap生成完成');
      } catch (error) {
        console.error('❌ Sitemap生成失败:', error.message);
      }
    },
        'nitro:build:public-assets': async () => {
      // 在生产环境构建完成后执行预热
      if (process.env.NODE_ENV === 'production') {
        console.log('🔥 开始执行页面预热...');
        try {
          const { performWarmup } = require('./app/utils/sitemapGenerator');
          await performWarmup({ concurrency: 2, skipProducts: false });
          console.log('✅ 页面预热完成');
        } catch (error) {
          console.error('❌ 页面预热失败:', error.message);
        }
      }
    }*/
  },
  // CSS 配置 - 优化CSS加载
  css: [
    // 关键CSS - 首屏渲染优化（将被内联）
    '~/assets/styles/critical.css',
    // 字体性能优化 - 必须在其他字体文件之前加载
    '~/assets/styles/font-optimization.css',
    // Element Plus CSS将通过模块自动处理
    '@fortawesome/fontawesome-free/css/all.css',
    // Material Icons 已改为按需加载，不再全局加载
    // 'material-icons/iconfont/material-icons.css',
    // 全局样式文件
    '~/assets/styles/global.css'
  ],
  
  // PostCSS配置 - CSS优化
  postcss: {
    plugins: {
      'postcss-import': {},
      'tailwindcss/nesting': {},
      'autoprefixer': {},
      'cssnano': {
        preset: [
          'default',
          {
            discardComments: {
              removeAll: true
            },
            normalizeWhitespace: true,
            discardUnused: true,
            mergeRules: true
          }
        ]
      }
    }
  },
  
  // 实验性功能配置 - 启用性能优化
  experimental: {
    payloadExtraction: false
  },
  
  // 优化配置 - 减少未使用的JavaScript
  optimization: {
    keyedComposables: [
      {
        name: 'useState',
        argumentLength: 2
      }
    ]
  },

  // Vite 配置 - 包含性能优化
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          // SCSS 预处理器配置
        }
      }
    },

    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        },
        '/public/static': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    }
  },
  
  // 构建配置 - 优化构建性能和FCP
  build: {
    transpile: ['element-plus']
  },
  
  // 模块配置
  modules: [
    '@element-plus/nuxt',
    '@pinia/nuxt',
    '@nuxt/image'
  ],
  
  // 图片优化配置 - LCP性能优化
  image: {
    // IPX 提供者配置
    provider: 'ipx',
    // 静态文件目录
    dir: 'public',

    // 域名配置
    domains: ['localhost:3000', 'localhost:5000'],

    // 图片质量设置 - 针对LCP优化
    quality: 85,
    // 图片格式优化 - 优先使用现代格式
    format: ['avif', 'webp', 'jpeg'],
    // 响应式图片尺寸
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536
    },
    // 预设尺寸 - LCP优化
    presets: {
      banner: {
        modifiers: {
          format: 'avif,webp,jpeg',
          quality: 90, // LCP图片使用更高质量
          fit: 'cover',
          width: 1920,
          height: 600
        }
      },
      thumbnail: {
        modifiers: {
          format: 'webp',
          quality: 75,
          width: 300,
          fit: 'inside'
        }
      }
    }
  },
  
  

  

  
  // 运行时配置
  runtimeConfig: {
    // 私有键（仅在服务器端可用）
    apiSecret: '',
    // 公共键（暴露给客户端）
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3000/api',
      // 第三方登录配置
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      facebookAppId: process.env.NUXT_PUBLIC_FACEBOOK_APP_ID || '',
      appleClientId: process.env.NUXT_PUBLIC_APPLE_CLIENT_ID || ''
    }
  },
  
  // 头部配置
 app: {
    head: {
      htmlAttrs: {
        lang: 'en'
      },
      title: 'Auto Ease TechX',
      meta: [
        { charset: 'utf-8' },
        { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge' },
        { name: 'viewport', content: 'width=device-width,initial-scale=1.0' },
        { key: 'description', name: 'description', content: 'A professional supplier of automotive products, offering high-quality automotive parts and accessories' },
        { name: 'keywords', content: 'automotive products, automotive parts, automotive supplier' }
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico' },
        // 字体预加载已通过font-optimization.css处理
        // DNS预解析
        { rel: 'dns-prefetch', href: '//localhost:3000' }
        // CSS预加载在生产环境中由Nuxt自动处理，开发环境中手动预加载会导致MIME类型错误
      ],
      script: [
        // 第三方登录脚本已移至按需加载，在需要登录的页面中动态加载
        // 这样可以提高首页加载性能
      ]
    }
  },
  
  // 静态资源配置
  nitro: {
    publicAssets: [
      {
        baseURL: '/',
        dir: 'app/public'
      }
    ],
    routeRules: {
      // 将以 /api/ 开头的请求代理到你的后端服务器
      '/api/**': {
        proxy: 'http://localhost:3000/api/**', // 替换为你的后端API地址
        // 可选：设置 SSR 行为，对于 API 接口通常设为 false
        // ssr: false,
      },
      // 你可以添加更多代理规则
      '/static/**': {
        proxy: 'http://localhost:3000/static/**',
      },
      // 客户端渲染页面配置 - 这些页面不需要SSR
      '/Login': { ssr: false } as any,
      '/Activate': { ssr: false } as any,
      '/Addresslist': { ssr: false } as any,
      '/Browsinghistory': { ssr: false } as any,
      '/Cart': { ssr: false } as any,
      '/Forgotpassword': { ssr: false } as any,
      '/Inquiries': { ssr: false } as any,
      '/Orderpayment': { ssr: false } as any,
      '/Register': { ssr: false } as any,
      '/Header': { ssr: false } as any,
      '/Footer': { ssr: false } as any,
      '/Resetpassword': { ssr: false } as any,
      '/Unifiedcheckout': { ssr: false } as any,
      '/Useragreement': { ssr: false } as any,
      '/Userorders': { ssr: false } as any,
      '/Usersettings': { ssr: false } as any
    } as any,
    // 优化Nitro性能
    minify: true,
    compressPublicAssets: true
  },

  
  // 兼容性配置
  compatibilityDate: '2024-01-01'
})