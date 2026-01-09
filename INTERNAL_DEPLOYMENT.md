# 内网部署指南

本文档介绍如何在内部网络中部署BIM项目管理系统。

## 部署架构

```
┌─────────────────────────────────┐
│        内网客户端                │
│  (浏览器访问 http://服务器IP)    │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│     内网服务器 (单机部署)        │
│  ┌──────────────────────────┐   │
│  │  前端 (Nginx静态托管)     │   │
│  └──────────────────────────┘   │
│           ↓                      │
│  ┌──────────────────────────┐   │
│  │  后端 (Node.js服务)      │   │
│  └──────────────────────────┘   │
│           ↓                      │
│  ┌──────────────────────────┐   │
│  │  数据库 (MySQL 8.0)      │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

---

## 方案一：传统部署方式（推荐）

### 系统要求

- **操作系统**：Windows Server / Linux (Ubuntu/CentOS)
- **Node.js**：v18 或更高版本
- **MySQL**：8.0 或更高版本
- **内存**：建议 4GB 以上
- **磁盘**：建议 20GB 以上

### 部署步骤

#### 第一步：安装环境

##### Windows Server

1. **安装Node.js**
   - 下载：https://nodejs.org/
   - 选择LTS版本（推荐18.x或20.x）
   - 安装后验证：`node -v` 和 `npm -v`

2. **安装MySQL**
   - 下载：https://dev.mysql.com/downloads/mysql/
   - 安装MySQL 8.0
   - 设置root密码
   - 确保MySQL服务正在运行

##### Ubuntu/Debian Linux

```bash
# 更新包管理器
sudo apt update

# 安装Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node -v
npm -v

# 安装MySQL 8.0
sudo apt install -y mysql-server

# 安全配置
sudo mysql_secure_installation

# 启动MySQL服务
sudo systemctl start mysql
sudo systemctl enable mysql
```

##### CentOS/RHEL Linux

```bash
# 安装Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node -v
npm -v

# 安装MySQL 8.0
sudo yum install -y mysql-server

# 启动MySQL服务
sudo systemctl start mysqld
sudo systemctl enable mysqld

# 安全配置
sudo mysql_secure_installation
```

---

#### 第二步：准备项目文件

1. **下载项目**
   ```bash
   # 如果从GitHub下载
   git clone https://github.com/mms916/BIMPMS.git
   cd BIMPMS

   # 或者直接解压项目文件到服务器
   ```

2. **目录结构**
   ```
   BIMPMS/
   ├── backend/          # 后端代码
   ├── frontend/         # 前端代码
   └── database/         # 数据库脚本
   ```

---

#### 第三步：配置数据库

1. **创建数据库**
   ```bash
   # 登录MySQL
   mysql -u root -p

   # 在MySQL命令行中执行
   CREATE DATABASE bimpms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'bimpms_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON bimpms.* TO 'bimpms_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

2. **初始化数据库表**
   ```bash
   cd BIMPMS/database

   # 方式A：使用命令行
   mysql -u bimpms_user -p bimpms < 01-init-schema.sql
   mysql -u bimpms_user -p bimpms < 02-seed-data.sql

   # 方式B：使用初始化脚本
   cd ../backend
   node scripts/init-db.js
   ```

---

#### 第四步：配置后端

1. **创建环境配置文件**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **编辑 `.env` 文件**
   ```bash
   # 数据库配置
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=bimpms
   DB_USER=bimpms_user
   DB_PASSWORD=your_password

   # 应用配置
   NODE_ENV=production
   PORT=3000

   # JWT配置
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   ```

3. **安装依赖并构建**
   ```bash
   npm install
   npm run build
   ```

4. **启动后端服务**
   ```bash
   # 测试启动
   npm start

   # 确认服务正常运行后，使用Ctrl+C停止
   ```

5. **使用PM2管理后端进程（推荐）**

   ```bash
   # 安装PM2
   npm install -g pm2

   # 启动后端服务
   pm2 start dist/index.js --name bimpms-backend

   # 设置开机自启
   pm2 startup
   pm2 save

   # 查看日志
   pm2 logs bimpms-backend

   # 查看状态
   pm2 status
   ```

---

#### 第五步：配置前端

1. **构建前端**
   ```bash
   cd frontend

   # 安装依赖
   npm install

   # 构建生产版本
   npm run build
   ```

2. **配置API地址**

   编辑 `frontend/.env.production`（如果没有则创建）：
   ```bash
   VITE_API_BASE_URL=http://your-server-ip:3000/api
   ```

   或者如果使用Nginx反向代理：
   ```bash
   VITE_API_BASE_URL=/api
   ```

3. **重新构建**
   ```bash
   npm run build
   ```

---

#### 第六步：配置Nginx（推荐）

安装Nginx：

```bash
# Ubuntu/Debian
sudo apt install -y nginx

# CentOS/RHEL
sudo yum install -y nginx

# Windows
# 下载：http://nginx.org/en/download.html
```

创建Nginx配置文件：

```bash
# Linux
sudo nano /etc/nginx/sites-available/bimpms

# Windows
# 编辑 conf/nginx.conf
```

添加以下配置：

```nginx
server {
    listen 80;
    server_name your-server-ip;  # 或域名

    # 前端静态文件
    location / {
        root /path/to/BIMPMS/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端API代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
# Linux
sudo ln -s /etc/nginx/sites-available/bimpms /etc/nginx/sites-enabled/
sudo nginx -t  # 测试配置
sudo systemctl restart nginx

# Windows
# 启动Nginx服务
```

---

#### 第七步：配置防火墙

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp  # 如果不使用Nginx，需要开放3000端口
sudo ufw reload

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload

# Windows
# 在Windows防火墙中允许端口80和3000
```

---

#### 第八步：访问系统

1. **获取服务器IP地址**
   ```bash
   # Linux
   ip addr show

   # Windows
   ipconfig
   ```

2. **在浏览器中访问**
   ```
   http://your-server-ip
   ```

3. **使用测试账号登录**
   - 用户名：`admin`
   - 密码：`123`

---

## 方案二：Docker部署（简化版）

如果服务器支持Docker，可以使用Docker一键部署。

### 安装Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# CentOS/RHEL
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
```

### 使用Docker Compose部署

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: bimpms-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: bimpms
      MYSQL_USER: bimpms_user
      MYSQL_PASSWORD: bimpms_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/01-init-schema.sql:/docker-entrypoint-initdb.d/01-init-schema.sql
      - ./database/02-seed-data.sql:/docker-entrypoint-initdb.d/02-seed-data.sql

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: bimpms-backend
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: bimpms
      DB_USER: bimpms_user
      DB_PASSWORD: bimpms_password
      NODE_ENV: production
      PORT: 3000
      JWT_SECRET: your-jwt-secret-key
    depends_on:
      - mysql
    ports:
      - "3000:3000"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: bimpms-frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

创建后端Dockerfile (`backend/Dockerfile`)：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

创建前端Dockerfile (`frontend/Dockerfile`)：

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

启动服务：

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart
```

---

## 服务管理

### 使用PM2管理后端

```bash
# 启动服务
pm2 start dist/index.js --name bimpms-backend

# 停止服务
pm2 stop bimpms-backend

# 重启服务
pm2 restart bimpms-backend

# 查看日志
pm2 logs bimpms-backend

# 查看状态
pm2 status

# 删除服务
pm2 delete bimpms-backend
```

### 使用Systemd管理后端（Linux）

创建systemd服务文件：

```bash
sudo nano /etc/systemd/system/bimpms-backend.service
```

添加以下内容：

```ini
[Unit]
Description=BIM Project Management System Backend
After=network.target mysql.service

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/BIMPMS/backend
ExecStart=/usr/bin/node /path/to/BIMPMS/backend/dist/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
sudo systemctl daemon-reload
sudo systemctl start bimpms-backend
sudo systemctl enable bimpms-backend
sudo systemctl status bimpms-backend
```

---

## 维护和监控

### 查看日志

```bash
# 后端日志（PM2）
pm2 logs bimpms-backend

# 后端日志（Systemd）
sudo journalctl -u bimpms-backend -f

# Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# MySQL日志
sudo tail -f /var/log/mysql/error.log
```

### 数据库备份

```bash
# 备份数据库
mysqldump -u bimpms_user -p bimpms > bimpms_backup_$(date +%Y%m%d).sql

# 恢复数据库
mysql -u bimpms_user -p bimpms < bimpms_backup_20240109.sql
```

### 定时备份（使用cron）

```bash
# 编辑crontab
crontab -e

# 添加每天凌晨2点自动备份
0 2 * * * mysqldump -u bimpms_user -ppassword bimpms > /backups/bimpms_$(date +\%Y\%m\%d).sql
```

---

## 常见问题

### Q1: 后端无法连接数据库

**原因**：数据库未启动或配置错误

**解决**：
```bash
# 检查MySQL状态
sudo systemctl status mysql  # Linux
# 或检查Windows服务

# 测试数据库连接
mysql -u bimpms_user -p -h localhost

# 检查后端配置文件
cat backend/.env
```

### Q2: 前端无法访问后端API

**原因**：CORS错误或端口配置错误

**解决**：
1. 确保后端CORS配置正确（`backend/src/index.ts`）
2. 检查前端 `.env.production` 中的API地址
3. 检查防火墙是否开放相应端口

### Q3: Nginx返回404

**原因**：静态文件路径配置错误

**解决**：
```bash
# 检查前端构建文件是否存在
ls -la frontend/dist

# 检查Nginx配置中的root路径是否正确
sudo nginx -t
```

### Q4: 服务器重启后服务未自动启动

**解决**：
```bash
# PM2
pm2 startup
pm2 save

# Systemd
sudo systemctl enable bimpms-backend
sudo systemctl enable nginx
```

---

## 性能优化建议

1. **启用gzip压缩**（Nginx）
2. **配置静态资源缓存**
3. **使用反向代理**
4. **数据库索引优化**
5. **定期清理日志文件**

---

## 安全建议

1. **修改默认密码**：及时修改admin用户密码
2. **配置HTTPS**：使用Let's Encrypt免费证书
3. **限制数据库访问**：MySQL只监听localhost
4. **定期备份**：设置自动备份任务
5. **更新软件**：定期更新系统和依赖包
6. **配置防火墙**：只开放必要端口

---

## 总结

内网部署的优势：
- ✅ 数据完全自主掌控
- ✅ 无需担心外网访问
- ✅ 访问速度更快
- ✅ 无运营成本
- ✅ 安全性更高

选择适合你的部署方式：
- **方案一**：适合有服务器运维经验的团队
- **方案二**：适合快速部署和环境统一

祝你部署顺利！
