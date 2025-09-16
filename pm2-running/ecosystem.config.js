module.exports = {
  apps: [{
    name: 'vehicle-supplies-backend',
    script: 'server.js',
    cwd: '../backend',
    instances: 2,
    // 日志配置
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    env: {
      PORT_START: 3000, // 起始端口
      NODE_ENV: 'development'  // 默认环境
    },
    env_production: {
      PORT_START: 3000, // 起始端口
      NODE_ENV: 'production'   // 生产环境
    }
  }, {
    name: 'vehicle-supplies-scheduler',
    script: 'schedule.js',
    cwd: '../backend',
    instances: 1,
    // 日志配置
    log_file: './logs/scheduler-combined.log',
    out_file: './logs/scheduler-out.log',
    error_file: './logs/scheduler-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    env: {
      NODE_ENV: 'development'  // 默认环境
    },
    env_production: {
      NODE_ENV: 'production'   // 生产环境
    }
  }, {
    name: 'vehicle-supplies-nuxt-frontend',
    script: 'npm',
    args: 'run start',
    cwd: '../nuxt-frontend',
    instances: 1,
    // 日志配置
    log_file: './logs/nuxt-combined.log',
    out_file: './logs/nuxt-out.log',
    error_file: './logs/nuxt-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    env: {
      PORT: 3001, // Nuxt frontend 端口
      NODE_ENV: 'development',
      NITRO_HOST: '0.0.0.0',
      NITRO_PORT: 3001
    },
    env_production: {
      PORT: 3001, // Nuxt frontend 端口
      NODE_ENV: 'production',
      NITRO_HOST: '0.0.0.0',
      NITRO_PORT: 3001
    }
  }]
}
