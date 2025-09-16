# Deployment Guide

This guide provides instructions for deploying the application to a Linux server.

## Prerequisites

- A Linux server (e.g., Ubuntu 20.04).
- `Node.js` (v16 or later) and `npm` installed on the server.
- `PostgreSQL` (v12 or later) installed and running.
- `Nginx` installed and running.
- A user with `sudo` privileges.
## 0.1 install dependencies
### 0.1 install node.js
sudo yum install nodejs 
npm install pm2 -g
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M    # 日志达 10MB 时分割
pm2 set pm2-logrotate:retain 30       # 保留最近 30 份日志

### 0.2 install postgresql
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm


sudo dnf module enable postgresql:16 -y
sudo dnf install postgresql-server
sudo postgresql-setup --initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql

//on alibaba cloud linux 3, we need update to 8
sudo sed -i 's/\$releasever/8/g' /etc/yum.repos.d/pgdg-redhat-all.repo
sudo /usr/pgsql-17/bin/postgresql-17-setup initdb
sudo systemctl enable postgresql-17
sudo systemctl start postgresql-17

#### 0.2.1 set postgresql password
sudo -u postgres psql  
ALTER USER postgres WITH PASSWORD 'your_strong_password';  

#### 0.2.2 create user
DROP USER IF EXISTS vehicle_web_user;
CREATE USER vehicle_web_user WITH PASSWORD 'your_strong_password';
#### 0.2.3 create database
sudo -u postgres psql -f /release/release/db/main/postgresql/create_db.sql

#### 0.2.4 modify pg_hba.conf
sudo vim /var/lib/pgsql/16/data/pg_hba.conf
# add the following line
host    all           vehicle_web_user               0.0.0.0/0               md5
# restart postgresql
sudo systemctl restart postgresql

### 0.3 install nginx
sudo dnf install nginx
sudo systemctl enable nginx
sudo systemctl start nginx
#### 0.3.1 modify nginx.conf
sudo vim /etc/nginx/nginx.conf
# add the following line
user nginx;
# restart nginx
sudo systemctl restart nginx

### create deploy user
sudo useradd -m -s /bin/bash web_deploy
sudo usermod -aG web_deployer nginx




## 1. Build the Application

On your local development machine, run the appropriate build script for your operating system to generate the release artifacts.

### For Linux/macOS

```bash
chmod +x build.sh
./build.sh
```

### For Windows

Open Command Prompt or PowerShell and run:

```batch
build.bat
```

This will create a `release` directory containing:
- `frontend_dist/`: The compiled management frontend static assets. These are ready-to-use files and do not need `npm install` on the server.
- `nuxt-frontend.tar.gz`: The packaged Nuxt.js frontend source code. This archive excludes `node_modules` and build outputs, so you must run `npm install` and `npm run build` on the server after deploying.
- `backend.tar.gz`: The packaged backend application. This archive excludes `node_modules`, so you must run `npm install` on the server after deploying.
- `pm2-running.tar.gz`: The PM2 configuration files for managing all services (backend, scheduler, and nuxt-frontend).
- `db/`: The database migration scripts.

## 2. Transfer Files to Server

Transfer the `release.tar.gz` archive and the `update_release.sh` script to your server. You can use tools like `scp` or `rsync`.

Example using `scp`:

```bash
# Securely copy the release archive and the update script
scp release.tar.gz user@your_server_ip:/path/to/your/deployment/location
scp update_release.sh user@your_server_ip:/path/to/your/deployment/location
```

## 3. Server Setup & Deployment

On the server, you will now use the `update_release.sh` script to automate the deployment.

1.  **Make the script executable**:
    ```bash
    chmod +x update_release.sh
    ```

2.  **Run the deployment script**:

    The script handles unpacking the archive, moving files to the correct directories (`/home/web_deployer/frontend`, `/home/web_deployer/nuxt-frontend`, `/home/web_deployer/backend`, and `/home/web_deployer/pm2-running`), setting permissions, and restarting services.

    *   **To deploy or update everything (frontend, nuxt-frontend, and backend)**:
        ```bash
        sudo ./update_release.sh --all
        ```

    *   **To update only the management frontend**:
        ```bash
        sudo ./update_release.sh --frontend
        ```

    *   **To update only the business frontend (Nuxt.js)**:
        ```bash
        sudo ./update_release.sh --nuxt-frontend
        ```

    *   **To update only the backend**:
        ```bash
        sudo ./update_release.sh --backend
        ```

    The script will automatically:
    - Unpack `release.tar.gz`.
    - Update management frontend files in `/home/web_deployer/frontend`.
    - Update business frontend (Nuxt.js) source code in `/home/web_deployer/nuxt-frontend`.
    - Build the Nuxt.js application on the server (SSR).
    - Generate sitemap and execute page warmup for Nuxt.js.
    - Update backend files in `/home/web_deployer/backend`.
    - Deploy PM2 configuration files in `/home/web_deployer/pm2-running`.
    - Install npm dependencies for both backend and nuxt-frontend.
    - Set correct file ownership and permissions.
    - Restart `Nginx` and all `pm2` services (backend, scheduler, nuxt-frontend).

## 4. Nginx Configuration

In production, Nginx replaces the proxy configuration from `vue.config.js` used in development. You need to configure Nginx to handle all the routes that were previously proxied by the Vue development server.

The application now has two frontends:
- **Management Frontend**: Located at `/home/web_deployer/frontend` (Vue.js)
- **Business Frontend**: Located at `/home/web_deployer/nuxt-frontend` (Nuxt.js)

### 4.1 Management Frontend Configuration

1.  **Edit your Nginx site configuration file for management frontend**:

    ```bash
    sudo nano /etc/nginx/sites-available/your-app-admin
    ```

2.  **Management frontend Nginx configuration**:

    Replace the entire server block with the following configuration that handles all proxy routes and token forwarding:

    map $http_origin $cors_origin {
        default "";
        # 具体域名优先
        "~^https?://api\.autoeasetechx\.com$" $http_origin;
        # 主前端域名
        "~^https?://(www\.)?autoeasetechx\.com$" $http_origin;
        "~^http://autoeasetechx\.local(:\d+)?$" $http_origin;
        # 泛域名匹配
        "~^https?://[\w-]+\.1688\.com$" $http_origin;
        "~^https?://[\w-]+\.alibaba\.com$" $http_origin;
        # 裸域名匹配（如需要）
        "~^https?://1688\.com$" $http_origin;
        "~^https?://alibaba\.com$" $http_origin;
         "~^chrome-extension://[a-z0-9]+$" $http_origin;
    }

    ```nginx
    server {
        listen 80;
        server_name admin.your_domain.com;  # Management frontend subdomain

        # Path for management frontend files, managed by update_release.sh
        root /home/web_deployer/frontend;
        index index.html;

        # Management frontend static files
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API routes - with token forwarding
        location /api {
            set $auth_header "";
            set $token "";

            if ($http_authorization) {
                set $auth_header $http_authorization;
            }

            if ($http_cookie ~* "aex-token=([^;]+)") {
                set $token "$1";
                set $auth_header "Bearer $token";
            }

            # 1. 预检请求专用处理（关键！）
            if ($request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' $cors_origin;
                add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
                add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type';
                add_header 'Access-Control-Allow-Credentials' 'true';
                add_header 'Access-Control-Max-Age' 86400;
                add_header 'Vary' 'Origin';
                add_header X-CORS-Debug "Preflight Passed" always;
                add_header 'Content-Length' 0;
                return 204;
            }

            # 2. 主请求的CORS头（保持一致）
            add_header 'Access-Control-Allow-Origin' $cors_origin always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;

            # 隐藏后端可能设置的 CORS 头
            proxy_hide_header 'Access-Control-Allow-Origin';
            proxy_hide_header 'Access-Control-Allow-Methods';
            proxy_hide_header 'Access-Control-Allow-Headers';

            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;

            # Set the Authorization header for the backend
            proxy_set_header Authorization $auth_header;
        }

        # Static files served by backend
        location /public/static {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files (alternative route)
        location /static {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # File uploads
        location /uploads {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Increase upload size limits if needed
            client_max_body_size 50M;
        }

        # Product image uploads
        location /product-images/upload {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Increase upload size limits for product images
            client_max_body_size 50M;
        }

        # 启用 Gzip 压缩优化
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_proxied any;
        gzip_comp_level 6;
        gzip_types
            text/plain
            text/css
            text/xml
            text/javascript
            application/json
            application/javascript
            application/xml+rss
            application/atom+xml
            image/svg+xml;

        # 静态资源缓存和压缩优化
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header Vary Accept-Encoding;
            
            # 对 JS 和 CSS 文件启用更强的压缩
            gzip_comp_level 9;
        }

        # 特别针对 chunk 文件的优化 (Element Plus 等大文件)
        location ~* chunk.*\.js$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            gzip_comp_level 9;
            add_header Vary Accept-Encoding;
        }

        # Optional: Add security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    }
    ```

### 4.2 Business Frontend (Nuxt.js) Configuration

1.  **Edit your Nginx site configuration file for business frontend**:

    ```bash
    sudo nano /etc/nginx/sites-available/your-app-business
    ```

2.  **Business frontend Nginx configuration**:

    ```nginx
    server {
        listen 80;
        server_name your_domain.com;  # Main business frontend domain

        # Path for business frontend files (Nuxt.js), managed by update_release.sh
        root /home/web_deployer/nuxt-frontend;
        index index.html;

        # Business frontend static files
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API routes - with token forwarding (same as management frontend)
        location /api {
            set $auth_header "";
            set $token "";

            if ($http_authorization) {
                set $auth_header $http_authorization;
            }

            if ($http_cookie ~* "aex-token=([^;]+)") {
                set $token "$1";
                set $auth_header "Bearer $token";
            }

            # CORS handling (same as management frontend)
            if ($request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' $cors_origin;
                add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
                add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type';
                add_header 'Access-Control-Allow-Credentials' 'true';
                add_header 'Access-Control-Max-Age' 86400;
                add_header 'Vary' 'Origin';
                add_header X-CORS-Debug "Preflight Passed" always;
                add_header 'Content-Length' 0;
                return 204;
            }

            add_header 'Access-Control-Allow-Origin' $cors_origin always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;

            proxy_hide_header 'Access-Control-Allow-Origin';
            proxy_hide_header 'Access-Control-Allow-Methods';
            proxy_hide_header 'Access-Control-Allow-Headers';

            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header Authorization $auth_header;
        }

        # Static files served by backend (same as management frontend)
        location /public/static {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # File uploads (same as management frontend)
        location /uploads {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            client_max_body_size 50M;
        }

        # Gzip and caching optimization (same as management frontend)
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_proxied any;
        gzip_comp_level 6;
        gzip_types
            text/plain
            text/css
            text/xml
            text/javascript
            application/json
            application/javascript
            application/xml+rss
            application/atom+xml
            image/svg+xml;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header Vary Accept-Encoding;
            gzip_comp_level 9;
        }

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    }
    ```

### 4.3 Enable Sites and Test Configuration

3.  **Enable both sites and test configuration**:

    ```bash
    # Enable the management frontend site
    sudo ln -s /etc/nginx/sites-available/your-app-admin /etc/nginx/sites-enabled/
    
    # Enable the business frontend site
    sudo ln -s /etc/nginx/sites-available/your-app-business /etc/nginx/sites-enabled/

    # Test the configuration
    sudo nginx -t

    # Restart Nginx
    sudo systemctl restart nginx
    ```
4. init data
   node migrate_country_state_complete.js --data-only    # 仅导入数据
   
### Important Notes:

- **Two Frontend Architecture**: The application now has two separate frontends:
  - **Management Frontend** (Vue.js): Accessible at `http://admin.your_domain.com`
  - **Business Frontend** (Nuxt.js): Accessible at `http://your_domain.com`
- **Token Forwarding**: Both frontends' `/api` location blocks extract the `aex-token` cookie and forward it as an `Authorization` header to the backend.
- **File Upload Limits**: The `client_max_body_size` directive is set to 50M for upload routes. Adjust this value based on your requirements.
- **Security Headers**: Optional security headers are included to improve the security posture of your application.
- **Backend Port**: The configuration assumes your backend runs on port 3000. Adjust if your backend uses a different port.
- **Shared Backend**: Both frontends share the same backend API endpoints.

This Nginx configuration replaces all the proxy settings from `vue.config.js` and provides the same functionality in the production environment.

## 5. Final Steps

- **DNS Configuration**: Ensure that both `your_domain.com` and `admin.your_domain.com` point to your server's IP address.
- **Firewall**: Ensure that your server's firewall allows traffic on port 80 (HTTP) and/or 443 (HTTPS).
- **HTTPS**: For production, it is highly recommended to configure SSL/TLS for HTTPS. You can use Let's Encrypt to get a free SSL certificate for both domains.

Your applications should now be accessible at:
- **Business Frontend**: `http://your_domain.com`
- **Management Frontend**: `http://admin.your_domain.com`