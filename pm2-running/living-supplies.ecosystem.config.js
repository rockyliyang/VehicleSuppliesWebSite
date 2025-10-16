module.exports = {
  apps: [{
    name: 'living-supplies-backend',
    script: 'server.js',
    cwd: '../backend',
    instances: 2,
    // 日志配置
    log_file: '../logs/backend/combined.log',
    out_file: '../logs/backend/out.log',
    error_file: '../logs/backend/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    env: {
      PORT_START: 3100, // 起始端口
      PORT: 3100,
      NODE_ENV: 'development'  // 默认环境
    },
    env_production: {
      PORT_START: 3100, // 起始端口
      PORT: 3100,
      NODE_ENV: 'production'   // 生产环境
    }
  }, {
    name: 'living-supplies-scheduler',
    script: 'schedule.js',
    cwd: '../backend',
    instances: 1,
    // 日志配置
    log_file: '../logs/backend/scheduler-combined.log',
    out_file: '../logs/backend/scheduler-out.log',
    error_file: '../logs/backend/scheduler-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    env: {
      NODE_ENV: 'development'  // 默认环境
    },
    env_production: {
      NODE_ENV: 'production'   // 生产环境
    }
  }, {
    name: 'living-supplies-nuxt-frontend',
    script: 'npm',
    args: 'run start',
    cwd: '../nuxt-frontend',
    instances: 1,
    // 日志配置
    log_file: '../logs/nuxt-frontend/nuxt-combined.log',
    out_file: '../logs/nuxt-frontend/nuxt-out.log',
    error_file: '../logs/nuxt-frontend/nuxt-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    env: {
      PORT: 5100, // Nuxt frontend 端口
      NODE_ENV: 'development',
      NITRO_HOST: '0.0.0.0',
      NITRO_PORT: 5100
    },
    env_production: {
      PORT: 5100, // Nuxt frontend 端口
      NODE_ENV: 'production',
      NITRO_HOST: '0.0.0.0',
      NITRO_PORT: 5100
    }
  }]
}
