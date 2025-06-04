---
description: 部署和运维规则 - CI/CD流程、环境配置、监控部署等
globs: 
alwaysApply: true
---
# 部署和运维规则

## 环境配置

### 环境分类

#### 开发环境 (Development)
```yaml
# .env.development
NODE_ENV=development
API_BASE_URL=http://localhost:3000/api
DB_HOST=localhost
DB_PORT=3306
DB_NAME=vehicle_supplies_dev
DB_USER=dev_user
DB_PASSWORD=dev_password
REDIS_HOST=localhost
REDIS_PORT=6379
LOG_LEVEL=debug
JWT_SECRET=dev_jwt_secret_key
JWT_EXPIRES_IN=7d

# 开发环境特性
- 详细的错误信息
- 热重载
- 调试工具启用
- 测试数据
- 本地数据库
```

#### 测试环境 (Testing/Staging)
```yaml
# .env.testing
NODE_ENV=testing
API_BASE_URL=https://api-test.vehiclesupplies.com/api
DB_HOST=test-db.internal
DB_PORT=3306
DB_NAME=vehicle_supplies_test
DB_USER=test_user
DB_PASSWORD=${TEST_DB_PASSWORD}
REDIS_HOST=test-redis.internal
REDIS_PORT=6379
LOG_LEVEL=info
JWT_SECRET=${TEST_JWT_SECRET}
JWT_EXPIRES_IN=1d

# 测试环境特性
- 生产环境的镜像
- 自动化测试
- 性能测试
- 安全测试
- 模拟真实数据
```

#### 生产环境 (Production)
```yaml
# .env.production
NODE_ENV=production
API_BASE_URL=https://api.vehiclesupplies.com/api
DB_HOST=prod-db-cluster.internal
DB_PORT=3306
DB_NAME=vehicle_supplies_prod
DB_USER=prod_user
DB_PASSWORD=${PROD_DB_PASSWORD}
REDIS_HOST=prod-redis-cluster.internal
REDIS_PORT=6379
LOG_LEVEL=warn
JWT_SECRET=${PROD_JWT_SECRET}
JWT_EXPIRES_IN=24h

# 生产环境特性
- 高可用性
- 负载均衡
- 数据备份
- 监控告警
- 安全加固
```

### 配置管理

#### 环境变量管理
```javascript
// config/index.js
const config = {
  development: {
    app: {
      port: process.env.PORT || 3000,
      host: process.env.HOST || 'localhost'
    },
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      database: process.env.DB_NAME || 'vehicle_supplies_dev',
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      dialect: 'mysql',
      logging: console.log
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || ''
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'dev_secret',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    },
    logging: {
      level: process.env.LOG_LEVEL || 'debug'
    }
  },
  
  testing: {
    app: {
      port: process.env.PORT || 3001,
      host: process.env.HOST || 'localhost'
    },
    database: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      dialect: 'mysql',
      logging: false
    },
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info'
    }
  },
  
  production: {
    app: {
      port: process.env.PORT || 8080,
      host: process.env.HOST || '0.0.0.0'
    },
    database: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 20,
        min: 5,
        acquire: 30000,
        idle: 10000
      }
    },
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },
    logging: {
      level: process.env.LOG_LEVEL || 'warn'
    }
  }
};

module.exports = config[process.env.NODE_ENV || 'development'];
```

## CI/CD 流程

### GitHub Actions 配置

#### 主工作流
```yaml
# .github/workflows/main.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # 代码质量检查
  lint-and-test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: test_password
          MYSQL_DATABASE: vehicle_supplies_test
        ports:
          - 3306:3306
        options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=3
      
      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: --health-cmd="redis-cli ping" --health-interval=10s --health-timeout=5s --health-retries=3
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        npm ci
        cd frontend && npm ci
    
    - name: Run ESLint
      run: |
        npm run lint
        cd frontend && npm run lint
    
    - name: Run Prettier check
      run: |
        npm run format:check
        cd frontend && npm run format:check
    
    - name: Run backend tests
      env:
        NODE_ENV: testing
        DB_HOST: localhost
        DB_PORT: 3306
        DB_NAME: vehicle_supplies_test
        DB_USER: root
        DB_PASSWORD: test_password
        REDIS_HOST: localhost
        REDIS_PORT: 6379
        JWT_SECRET: test_jwt_secret
      run: npm run test:coverage
    
    - name: Run frontend tests
      run: cd frontend && npm run test:unit
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/lcov.info,./frontend/coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
  
  # 安全扫描
  security-scan:
    runs-on: ubuntu-latest
    needs: lint-and-test
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Run Snyk to check for vulnerabilities
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high
    
    - name: Run OWASP ZAP Baseline Scan
      uses: zaproxy/action-baseline@v0.7.0
      with:
        target: 'http://localhost:3000'
  
  # 构建和推送镜像
  build-and-push:
    runs-on: ubuntu-latest
    needs: [lint-and-test, security-scan]
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    
    permissions:
      contents: read
      packages: write
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
  
  # 部署到测试环境
  deploy-staging:
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.ref == 'refs/heads/develop'
    environment: staging
    
    steps:
    - name: Deploy to staging
      uses: appleboy/ssh-action@v1.0.0
      with:
        host: ${{ secrets.STAGING_HOST }}
        username: ${{ secrets.STAGING_USER }}
        key: ${{ secrets.STAGING_SSH_KEY }}
        script: |
          cd /opt/vehicle-supplies
          docker-compose -f docker-compose.staging.yml pull
          docker-compose -f docker-compose.staging.yml up -d
          docker system prune -f
    
    - name: Run E2E tests
      run: |
        npm install -g @playwright/test
        npx playwright test --config=playwright.config.staging.js
  
  # 部署到生产环境
  deploy-production:
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
    - name: Deploy to production
      uses: appleboy/ssh-action@v1.0.0
      with:
        host: ${{ secrets.PROD_HOST }}
        username: ${{ secrets.PROD_USER }}
        key: ${{ secrets.PROD_SSH_KEY }}
        script: |
          cd /opt/vehicle-supplies
          docker-compose -f docker-compose.prod.yml pull
          docker-compose -f docker-compose.prod.yml up -d --no-deps app
          docker system prune -f
    
    - name: Health check
      run: |
        sleep 30
        curl -f https://api.vehiclesupplies.com/health || exit 1
    
    - name: Notify deployment
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        channel: '#deployments'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Docker 配置

#### 多阶段构建 Dockerfile
```dockerfile
# Dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package.json 文件
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# 安装依赖
RUN npm ci --only=production && npm cache clean --force
RUN cd frontend && npm ci && npm cache clean --force

# 复制源代码
COPY . .

# 构建前端
RUN cd frontend && npm run build

# 生产阶段
FROM node:18-alpine AS production

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# 复制构建产物
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/frontend/dist ./public

# 安装 dumb-init
RUN apk add --no-cache dumb-init

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
```

#### Docker Compose 配置
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    image: ghcr.io/username/vehicle-supplies:main
    container_name: vehicle-supplies-app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DB_HOST=db
      - DB_PORT=3306
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
      - redis
    networks:
      - app-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(`api.vehiclesupplies.com`)"
      - "traefik.http.routers.app.tls=true"
      - "traefik.http.routers.app.tls.certresolver=letsencrypt"
  
  db:
    image: mysql:8.0
    container_name: vehicle-supplies-db
    restart: unless-stopped
    environment:
      - MYSQL_ROOT_PASSWORD=${DB_ROOT_PASSWORD}
      - MYSQL_DATABASE=${DB_NAME}
      - MYSQL_USER=${DB_USER}
      - MYSQL_PASSWORD=${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
      - ./mysql/conf.d:/etc/mysql/conf.d
      - ./mysql/init:/docker-entrypoint-initdb.d
    networks:
      - app-network
    command: --default-authentication-plugin=mysql_native_password
  
  redis:
    image: redis:7-alpine
    container_name: vehicle-supplies-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - app-network
  
  nginx:
    image: nginx:alpine
    container_name: vehicle-supplies-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./frontend/dist:/usr/share/nginx/html
    depends_on:
      - app
    networks:
      - app-network

volumes:
  db_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

## 监控和告警

### 应用监控

#### Prometheus 配置
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'vehicle-supplies-app'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s
  
  - job_name: 'mysql'
    static_configs:
      - targets: ['mysql-exporter:9104']
  
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
  
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']
```

#### 告警规则
```yaml
# alert_rules.yml
groups:
  - name: vehicle-supplies-alerts
    rules:
      # 应用程序告警
      - alert: AppDown
        expr: up{job="vehicle-supplies-app"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "应用程序不可用"
          description: "Vehicle Supplies 应用程序已停止响应超过 1 分钟"
      
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "高错误率"
          description: "5xx 错误率超过 10%，持续 5 分钟"
      
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "响应时间过长"
          description: "95% 的请求响应时间超过 1 秒"
      
      # 数据库告警
      - alert: DatabaseDown
        expr: up{job="mysql"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "数据库不可用"
          description: "MySQL 数据库已停止响应超过 1 分钟"
      
      - alert: HighDatabaseConnections
        expr: mysql_global_status_threads_connected / mysql_global_variables_max_connections > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "数据库连接数过高"
          description: "数据库连接数超过最大连接数的 80%"
      
      # Redis 告警
      - alert: RedisDown
        expr: up{job="redis"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Redis 不可用"
          description: "Redis 服务已停止响应超过 1 分钟"
      
      - alert: HighRedisMemoryUsage
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Redis 内存使用率过高"
          description: "Redis 内存使用率超过 90%"
      
      # 系统资源告警
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "CPU 使用率过高"
          description: "CPU 使用率超过 80%，持续 5 分钟"
      
      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "内存使用率过高"
          description: "内存使用率超过 85%，持续 5 分钟"
      
      - alert: LowDiskSpace
        expr: (1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100 > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "磁盘空间不足"
          description: "磁盘使用率超过 90%"
```

### 日志聚合

#### ELK Stack 配置
```yaml
# docker-compose.logging.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - xpack.security.enabled=false
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
    networks:
      - logging
  
  logstash:
    image: docker.elastic.co/logstash/logstash:8.8.0
    container_name: logstash
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
      - ./logstash/config:/usr/share/logstash/config
    ports:
      - "5044:5044"
    environment:
      - "LS_JAVA_OPTS=-Xmx256m -Xms256m"
    depends_on:
      - elasticsearch
    networks:
      - logging
  
  kibana:
    image: docker.elastic.co/kibana/kibana:8.8.0
    container_name: kibana
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch
    networks:
      - logging
  
  filebeat:
    image: docker.elastic.co/beats/filebeat:8.8.0
    container_name: filebeat
    user: root
    volumes:
      - ./filebeat/filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    depends_on:
      - logstash
    networks:
      - logging

volumes:
  elasticsearch_data:

networks:
  logging:
    driver: bridge
```

## 备份和恢复

### 数据库备份

#### 自动备份脚本
```bash
#!/bin/bash
# backup.sh

# 配置
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="vehicle_supplies_prod"
DB_USER="backup_user"
DB_PASSWORD="${DB_BACKUP_PASSWORD}"
BACKUP_DIR="/opt/backups/mysql"
S3_BUCKET="vehicle-supplies-backups"
RETENTION_DAYS=30

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 生成备份文件名
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${DB_NAME}_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

echo "开始备份数据库: $DB_NAME"
echo "备份文件: $BACKUP_PATH"

# 执行备份
mysqldump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_USER" \
  --password="$DB_PASSWORD" \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --hex-blob \
  "$DB_NAME" | gzip > "$BACKUP_PATH"

# 检查备份是否成功
if [ $? -eq 0 ]; then
  echo "数据库备份成功: $BACKUP_PATH"
  
  # 上传到 S3
  aws s3 cp "$BACKUP_PATH" "s3://$S3_BUCKET/mysql/"
  
  if [ $? -eq 0 ]; then
    echo "备份文件已上传到 S3"
  else
    echo "上传到 S3 失败"
    exit 1
  fi
  
  # 清理本地旧备份
  find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
  echo "已清理 $RETENTION_DAYS 天前的本地备份文件"
  
else
  echo "数据库备份失败"
  exit 1
fi

echo "备份完成"
```

#### 恢复脚本
```bash
#!/bin/bash
# restore.sh

# 参数检查
if [ $# -ne 1 ]; then
  echo "用法: $0 <backup_file>"
  echo "示例: $0 vehicle_supplies_prod_20240315_120000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="vehicle_supplies_prod"
DB_USER="restore_user"
DB_PASSWORD="${DB_RESTORE_PASSWORD}"

# 检查备份文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
  echo "备份文件不存在: $BACKUP_FILE"
  exit 1
fi

echo "警告: 此操作将覆盖数据库 $DB_NAME 的所有数据"
read -p "确认继续? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "操作已取消"
  exit 0
fi

echo "开始恢复数据库: $DB_NAME"
echo "备份文件: $BACKUP_FILE"

# 创建数据库（如果不存在）
mysql \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_USER" \
  --password="$DB_PASSWORD" \
  -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"

# 恢复数据库
if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | mysql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USER" \
    --password="$DB_PASSWORD" \
    "$DB_NAME"
else
  mysql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USER" \
    --password="$DB_PASSWORD" \
    "$DB_NAME" < "$BACKUP_FILE"
fi

# 检查恢复是否成功
if [ $? -eq 0 ]; then
  echo "数据库恢复成功"
else
  echo "数据库恢复失败"
  exit 1
fi

echo "恢复完成"
```

### 文件备份

#### 应用文件备份
```bash
#!/bin/bash
# backup_files.sh

# 配置
APP_DIR="/opt/vehicle-supplies"
BACKUP_DIR="/opt/backups/files"
S3_BUCKET="vehicle-supplies-backups"
RETENTION_DAYS=7

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 生成备份文件名
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="app_files_${TIMESTAMP}.tar.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

echo "开始备份应用文件"
echo "备份文件: $BACKUP_PATH"

# 创建备份
tar -czf "$BACKUP_PATH" \
  --exclude="$APP_DIR/node_modules" \
  --exclude="$APP_DIR/logs" \
  --exclude="$APP_DIR/.git" \
  --exclude="$APP_DIR/tmp" \
  -C "$(dirname $APP_DIR)" \
  "$(basename $APP_DIR)"

# 检查备份是否成功
if [ $? -eq 0 ]; then
  echo "文件备份成功: $BACKUP_PATH"
  
  # 上传到 S3
  aws s3 cp "$BACKUP_PATH" "s3://$S3_BUCKET/files/"
  
  # 清理本地旧备份
  find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
  
else
  echo "文件备份失败"
  exit 1
fi

echo "备份完成"
```

## 安全配置

### SSL/TLS 配置

#### Nginx SSL 配置
```nginx
# nginx/nginx.conf
server {
    listen 80;
    server_name vehiclesupplies.com www.vehiclesupplies.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name vehiclesupplies.com www.vehiclesupplies.com;
    
    # SSL 证书
    ssl_certificate /etc/nginx/ssl/vehiclesupplies.com.crt;
    ssl_certificate_key /etc/nginx/ssl/vehiclesupplies.com.key;
    
    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # 安全头
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none';" always;
    
    # 前端静态文件
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
        
        # 缓存配置
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时配置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://app:3000/health;
        access_log off;
    }
}
```

### 防火墙配置

#### UFW 规则
```bash
#!/bin/bash
# firewall.sh

# 重置防火墙规则
ufw --force reset

# 默认策略
ufw default deny incoming
ufw default allow outgoing

# SSH 访问（限制 IP）
ufw allow from 192.168.1.0/24 to any port 22
ufw allow from 10.0.0.0/8 to any port 22

# HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# 数据库（仅内网）
ufw allow from 10.0.0.0/8 to any port 3306
ufw allow from 172.16.0.0/12 to any port 3306

# Redis（仅内网）
ufw allow from 10.0.0.0/8 to any port 6379
ufw allow from 172.16.0.0/12 to any port 6379

# 监控端口（仅内网）
ufw allow from 10.0.0.0/8 to any port 9090  # Prometheus
ufw allow from 10.0.0.0/8 to any port 3000  # Grafana

# 启用防火墙
ufw --force enable

# 显示状态
ufw status verbose
```

## 性能优化

### 数据库优化

#### MySQL 配置
```ini
# mysql/conf.d/mysql.cnf
[mysqld]
# 基本配置
port = 3306
socket = /var/run/mysqld/mysqld.sock
basedir = /usr
datadir = /var/lib/mysql
tmpdir = /tmp
lc-messages-dir = /usr/share/mysql

# 字符集
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# 连接配置
max_connections = 200
max_connect_errors = 1000
connect_timeout = 10
wait_timeout = 600
interactive_timeout = 600

# 缓冲区配置
innodb_buffer_pool_size = 1G
innodb_buffer_pool_instances = 4
innodb_log_file_size = 256M
innodb_log_buffer_size = 16M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# 查询缓存
query_cache_type = 1
query_cache_size = 128M
query_cache_limit = 2M

# 临时表
tmp_table_size = 64M
max_heap_table_size = 64M

# 排序和分组
sort_buffer_size = 2M
read_buffer_size = 1M
read_rnd_buffer_size = 2M
join_buffer_size = 2M

# 慢查询日志
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
log_queries_not_using_indexes = 1

# 二进制日志
log_bin = /var/log/mysql/mysql-bin.log
binlog_format = ROW
expire_logs_days = 7
max_binlog_size = 100M

# 错误日志
log_error = /var/log/mysql/error.log
```

### 应用优化

#### Node.js 性能配置
```javascript
// server.js
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  // 主进程
  const numCPUs = os.cpus().length;
  const numWorkers = process.env.NODE_ENV === 'production' 
    ? numCPUs 
    : 1;
  
  console.log(`启动 ${numWorkers} 个工作进程`);
  
  // 创建工作进程
  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }
  
  // 工作进程退出时重启
  cluster.on('exit', (worker, code, signal) => {
    console.log(`工作进程 ${worker.process.pid} 退出`);
    cluster.fork();
  });
  
} else {
  // 工作进程
  const app = require('./app');
  const port = process.env.PORT || 3000;
  
  const server = app.listen(port, () => {
    console.log(`工作进程 ${process.pid} 在端口 ${port} 启动`);
  });
  
  // 优雅关闭
  process.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信号，开始优雅关闭');
    server.close(() => {
      console.log('HTTP 服务器已关闭');
      process.exit(0);
    });
  });
}

// 内存监控
setInterval(() => {
  const usage = process.memoryUsage();
  console.log('内存使用情况:', {
    rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB'
  });
}, 60000);
```

---

> 📝 **注意**: 所有部署和运维操作都应遵循以上规范，确保系统的稳定性、安全性和可维护性。