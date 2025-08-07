module.exports = {
  apps: [{
    name: 'vehicle-supplies-backend',
    script: 'server.js',
    env: {
      NODE_ENV: 'development'  // 默认环境
    },
    env_production: {
      NODE_ENV: 'production'   // 生产环境
    }
  }]
}