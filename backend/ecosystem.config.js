module.exports = {
  apps: [{
    name: 'vehicle-supplies-backend',
    script: 'server.js',
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
  }]
}
