# BIM项目管理系统 - 阿里云部署指南

本文档详细记录了BIM项目管理系统在阿里云轻量应用服务器上的完整部署过程。

---

## 目录

1. [服务器环境](#服务器环境)
2. [数据库配置](#数据库配置)
3. [后端部署](#后端部署)
4. [前端部署](#前端部署)
5. [Nginx配置](#nginx配置)
6. [系统防火墙配置](#系统防火墙配置)
7. [阿里云安全组配置](#阿里云安全组配置)
8. [常见问题解决](#常见问题解决)

---

## 服务器环境

### 服务器信息
- **服务器**：阿里云轻量应用服务器
- **操作系统**：Alibaba Cloud Linux
- **公网IP**：47.122.112.158
- **域名**：www.sjyxmgl.com（需备案）

### 软件版本
| 软件 | 版本 |
|------|------|
| Node.js | v20.11.1 |
| MySQL | 8.0.36 |
| Nginx | 1.28.0 |
| PM2 | 最新版 |
| 宝塔面板 | 最新版 |

---

## 数据库配置

### 1. 创建数据库

```bash
# 登录MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE bimpms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建数据库用户
CREATE USER 'bimpms_user'@'localhost' IDENTIFIED BY 'LkkWtYtjPrRiMKs8';

# 授予权限
GRANT ALL PRIVILEGES ON bimpms.* TO 'bimpms_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. 导入数据

```bash
# 上传数据库文件到服务器后，执行导入
sed 's/bim_pms/bimpms/g' /www/wwwroot/BIMPMS/database/01-init-schema.sql | mysql -u root -p bimpms
sed 's/bim_pms/bimpms/g' /www/wwwroot/BIMPMS/database/02-seed-data.sql | mysql -u root -p bimpms
```

### 3. 验证数据库

```bash
mysql -u bimpms_user -pLkkWtYtjPrRiMKs8 bimpms
```

---

## 后端部署

### 1. 上传后端代码

将后端代码上传到服务器：`/www/wwwroot/BIMPMS/backend`

### 2. 配置环境变量

创建 `/www/wwwroot/BIMPMS/backend/.env` 文件：

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bimpms
DB_USER=bimpms_user
DB_PASSWORD=LkkWtYtjPrRiMKs8

# JWT配置
JWT_SECRET=a8f3d9e2c7b1x5k9m3n6p0q2w4r8t0u1v3y5z7
JWT_EXPIRES_IN=7d

# 服务器配置
PORT=3000
NODE_ENV=production
```

### 3. 安装依赖并构建

```bash
cd /www/wwwroot/BIMPMS/backend

# 安装依赖（使用淘宝镜像加速）
npm install --registry=https://registry.npmmirror.com

# 构建项目
npm run build
```

### 4. 使用PM2启动后端

**方法1：使用宝塔面板PM2管理器（推荐）**

1. 进入宝塔面板 -> 软件商店 -> PM2管理器
2. 添加项目：
   - 项目目录：`/www/wwwroot/BIMPMS/backend`
   - 启动文件：`dist/index.js`
   - 项目名称：`bimpms-backend`
   - 运行模式：`fork`
3. 点击启动

**方法2：使用命令行**

```bash
# 创建软链接（如果npm命令不可用）
ln -sf /www/server/nvm/versions/node/v20.11.1/bin/node /usr/bin/node
ln -sf /www/server/nvm/versions/node/v20.11.1/bin/npm /usr/bin/npm
ln -sf /www/server/nvm/versions/node/v20.11.1/bin/npx /usr/bin/npx

# 启动项目
/www/server/nodejs/v20.11.1/bin/pm2 start dist/index.js --name bimpms-backend --cwd /www/wwwroot/BIMPMS/backend
```

### 5. 验证后端运行

```bash
# 检查健康状态
curl http://localhost:3000/health

# 预期返回：{"status":"ok","timestamp":"..."}
```

---

## 前端部署

### 1. 修改API地址配置

在本地开发环境中修改以下文件：

**修改 `frontend/src/services/api.ts`：**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
```

**修改 `frontend/src/App.tsx`：**
```typescript
const API_BASE = '/api';
```

### 2. 构建前端

```bash
cd "d:\project\BIM PMS\frontend"

# 安装依赖
npm install

# 构建生产版本
npm run build
# 或跳过TypeScript检查：npx vite build
```

### 3. 上传构建产物

将 `frontend/dist` 目录压缩上传到服务器，解压到：
```
/www/wwwroot/BIMPMS/frontend/dist/
```

### 4. 验证前端文件

```bash
ls -la /www/wwwroot/BIMPMS/frontend/dist/
# 应包含：index.html, assets/, 404.html 等
```

---

## Nginx配置

### 1. 在宝塔面板添加网站

1. 进入宝塔面板 -> 网站 -> 添加站点
2. 填写信息：
   - 域名：`www.sjyxmgl.com`（或直接填IP）
   - 根目录：`/www/wwwroot/BIMPMS/frontend/dist`
   - PHP版本：纯静态

### 2. 修改Nginx配置

点击网站设置 -> 配置文件，修改为：

```nginx
server {
    listen 80;
    server_name www.sjyxmgl.com 47.122.112.158;
    root /www/wwwroot/BIMPMS/frontend/dist;
    index index.html;

    # SPA路由支持 - 处理React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API反向代理到后端
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 禁止访问敏感文件
    location ~ ^/(\.user.ini|\.htaccess|\.git|\.env) {
        return 404;
    }

    # 禁止访问隐藏文件
    location ~ /\. {
        return 404;
    }

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # 访问日志
    access_log /www/wwwlogs/www.sjyxmgl.com.log;
    error_log /www/wwwlogs/www.sjyxmgl.com.error.log;
}
```

### 3. 测试并重载Nginx

```bash
# 测试配置
nginx -t

# 重载配置
nginx -s reload
# 或在宝塔面板首页点击"重载配置"
```

---

## 系统防火墙配置

### 开放80端口

```bash
# 检查防火墙状态
systemctl status firewalld

# 开放80端口
firewall-cmd --permanent --add-port=80/tcp

# 重新加载防火墙
firewall-cmd --reload

# 查看已开放的端口
firewall-cmd --list-ports
```

---

## 阿里云安全组配置

### 添加防火墙规则

1. 登录阿里云控制台
2. 进入轻量应用服务器 -> 防火墙
3. 添加规则：

| 协议 | 端口 | 授权对象 | 描述 |
|------|------|---------|------|
| TCP | 80 | 0.0.0.0/0 | HTTP |
| TCP | 443 | 0.0.0.0/0 | HTTPS（可选）|
| TCP | 22 | 0.0.0.0/0 | SSH（建议限制IP）|

---

## 常见问题解决

### 1. npm/node 命令找不到

```bash
# 创建软链接
ln -sf /www/server/nvm/versions/node/v20.11.1/bin/node /usr/bin/node
ln -sf /www/server/nvm/versions/node/v20.11.1/bin/npm /usr/bin/npm
ln -sf /www/server/nvm/versions/node/v20.11.1/bin/npx /usr/bin/npx
```

### 2. PM2 命令找不到

使用宝塔面板的PM2管理器，或使用完整路径：
```bash
/www/server/nodejs/v20.11.1/bin/pm2
```

### 3. 数据库连接被拒绝

```sql
-- 重新创建用户并授权
DROP USER IF EXISTS 'bimpms_user'@'localhost';
CREATE USER 'bimpms_user'@'localhost' IDENTIFIED BY 'LkkWtYtjPrRiMKs8';
GRANT ALL PRIVILEGES ON bimpms.* TO 'bimpms_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. 前端API请求失败

**问题**：其他主机访问显示"登录失败，请检查后端服务"

**原因**：前端构建时API地址硬编码为 `localhost:3000`

**解决**：修改API地址为相对路径 `/api`，重新构建并上传

### 5. 域名访问被拦截

**问题**：通过域名访问显示"请检查后端服务"或无法连接

**原因**：域名未完成ICP备案

**解决**：
- 临时方案：使用服务器IP访问
- 长期方案：完成域名ICP备案

### 6. Nginx配置冲突

**问题**：`duplicate location "/"` 错误

**原因**：宝塔面板的rewrite配置文件已包含 `location /` 块

**解决**：移除 `#REWRITE-START` 和 `#REWRITE-END` 包含的文件，直接在配置文件中定义所有location规则

### 7. 查看后端日志

```bash
# 使用PM2查看日志
/www/server/nodejs/v20.11.1/bin/pm2 logs bimpms-backend --lines 50

# 或在宝塔面板 PM2管理器中点击"日志"按钮
```

---

## 访问信息

| 项目 | 地址 |
|------|------|
| 前端访问 | http://47.122.112.158 |
| 后端API | http://47.122.112.158/api |
| 域名（备案后） | http://www.sjyxmgl.com |

### 默认登录账号
- 用户名：`admin`
- 密码：`123`

---

## 后续优化建议

1. **启用HTTPS**
   - 在宝塔面板申请Let's Encrypt免费SSL证书
   - 开启强制HTTPS跳转

2. **设置自动备份**
   - 数据库定期自动备份
   - 代码文件定期备份

3. **监控告警**
   - 配置服务器资源监控
   - 设置服务异常告警

4. **性能优化**
   - 启用Nginx缓存
   - 配置CDN加速
   - 数据库查询优化

5. **安全加固**
   - 限制SSH访问IP
   - 定期更新系统补丁
   - 配置fail2ban防暴力破解

---

## 更新部署

### 后端更新

```bash
cd /www/wwwroot/BIMPMS/backend

# 拉取最新代码
git pull

# 安装新依赖
npm install

# 重新构建
npm run build

# 重启PM2服务
/www/server/nodejs/v20.11.1/bin/pm2 restart bimpms-backend
```

### 前端更新

```bash
# 本地构建
cd "d:\project\BIM PMS\frontend"
npm run build

# 上传dist目录到服务器，替换 /www/wwwroot/BIMPMS/frontend/dist/
```

---

## 附录

### 项目目录结构

```
/www/wwwroot/BIMPMS/
├── backend/              # 后端代码
│   ├── dist/            # 编译后的JS代码
│   ├── node_modules/    # 依赖包
│   ├── src/             # TypeScript源码
│   └── .env             # 环境变量配置
├── frontend/            # 前端代码
│   └── dist/            # 构建后的静态文件
└── database/            # 数据库脚本
    ├── 01-init-schema.sql
    └── 02-seed-data.sql
```

### 相关命令速查

```bash
# 查看后端日志
/www/server/nodejs/v20.11.1/bin/pm2 logs bimpms-backend

# 重启后端
/www/server/nodejs/v20.11.1/bin/pm2 restart bimpms-backend

# 查看Nginx状态
systemctl status nginx

# 重载Nginx
nginx -s reload

# 查看MySQL状态
systemctl status mysqld

# 防火墙命令
firewall-cmd --list-all
```

---

**文档版本**：v1.0
**最后更新**：2026-01-12
**维护者**：BIM项目管理系统团队
