# BIM项目管理系统 - 宝塔面板部署指南

本文档介绍如何使用宝塔面板在国内云服务器上部署 BIM 项目管理系统。

## 部署架构

```
                    用户访问
                       ↓
                   Nginx 反向代理
                       ↓
        ┌──────────────┴──────────────┐
        │                              │
    ┌───▼─────┐                   ┌───▼─────┐
    │  前端    │                   │  后端    │
    │  (静态)  │                   │  Node.js │
    │  端口:   │                   │  端口:   │
    │  80/443  │                   │  3000    │
    └──────────┘                   └────┬────┘
                                       │
                                   ┌───▼────┐
                                   │ MySQL  │
                                   │ 端口:  │
                                   │  3306  │
                                   └────────┘
```

## 第一步：购买云服务器

### 推荐配置

| 配置项 | 最低要求 | 推荐配置 |
|--------|---------|---------|
| CPU | 1核 | 2核 |
| 内存 | 1GB | 2GB |
| 硬盘 | 20GB | 40GB |
| 带宽 | 1Mbps | 3Mbps |
| 系统 | CentOS 7+ / Ubuntu 18+ | Ubuntu 20.04 |

### 推荐服务商

- **阿里云**：https://aliyun.com - 轻量应用服务器约 ¥60-100/年
- **腾讯云**：https://cloud.tencent.com - 轻量应用服务器约 ¥50-90/年
- **华为云**：https://www.huaweicloud.com - 弹性云服务器

**新用户通常有优惠活动，注意查看！**

---

## 第二步：安装宝塔面板

### 1. 连接服务器

使用 SSH 工具（如 Xshell、FinalShell、PuTTY）连接服务器：

```bash
ssh root@你的服务器IP
# 输入密码
```

### 2. 安装宝塔面板

**CentOS 系统：**
```bash
yum install -y wget && wget -O install.sh https://download.bt.cn/install/install_6.0.sh && sh install.sh
```

**Ubuntu/Debian 系统：**
```bash
wget -O install.sh https://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh
```

安装完成后会显示面板地址和账号信息，**请务必保存好！**

示例：
```
==================================================================
Congratulations! Installed successfully!
==================================================================
外网面板地址: http://xxx.xxx.xxx.xxx:8888/xxxxxxxx
内网面板地址: http://xxx.xxx.xxx.xxx:8888/xxxxxxxx
username: xxxxxxxx
password: xxxxxxxx
==================================================================
```

### 3. 开放防火墙端口

在云服务器控制台开放以下端口：
- `8888` - 宝塔面板
- `80` - HTTP
- `443` - HTTPS
- `3000` - 后端 API（可选，用 Nginx 反向代理不需要开放）
- `3306` - MySQL（仅内网访问，不要开放到公网）

---

## 第三步：宝塔面板基础设置

### 1. 登录宝塔面板

访问安装时提供的面板地址，使用账号密码登录。

### 2. 安装推荐软件

登录后会提示安装 **"Lnmp" 或 **"Lamp"** 套件，点击 **"一键安装"**：

推荐安装：
- ✅ **Nginx** (1.20+) - Web 服务器
- ✅ **MySQL** (5.7 或 8.0+) - 数据库
  - 💡 **低配置服务器推荐使用 MySQL 5.7**（更节省资源）
  - 在软件商店搜索 "MySQL"，选择 MySQL 5.7 版本安装
- ✅ **PM2 管理器** - Node.js 进程管理
- ✅ **Node.js** (18+) - 后端运行环境

**安装时间约 10-30 分钟，请耐心等待。**

### 3. 设置宝塔面板

建议修改：
- 面板端口（安全）
- 面板用户名和密码
- 绑定域名（可选）
- 开启基本认证（推荐）

---

## 第四步：创建网站

### 1. 添加站点

1. 点击左侧 **"网站"**
2. 点击 **"添加站点"**
3. 填写信息：
   - **域名**：填写你的域名（如 `bimpms.example.com`），没有域名先填服务器 IP
   - **根目录**：默认或自定义（如 `/www/wwwroot/bimpms`）
   - **FTP**：不创建
   - **数据库**：选择 **MySQL**，设置：
     - 数据库名：`bim_pms`
     - 用户名：`bim_pms`
     - 密码：自动生成或自定义
   - **PHP 版本**：纯静态（不需要 PHP）

4. 点击 **"提交"**

### 2. 记录数据库信息

**⚠️ 重要：** 请保存好数据库信息！
- 数据库地址：`localhost`
- 数据库端口：`3306`
- 数据库名：`bim_pms`
- 数据库用户：`bim_pms`
- 数据库密码：`xxxxxx`

---

## 第五步：上传项目代码

### 方法A：使用 Git（推荐）

1. 点击网站后的 **"根目录"** 进入文件管理
2. 点击顶部 **"终端"** 按钮
3. 在终端中执行：

```bash
# 删除默认目录内容
rm -rf ./*

# 克隆项目
git clone https://github.com/mms916/BIMPMS.git .

# 或克隆你的 Fork
# git clone https://github.com/你的用户名/BIMPMS.git .
```

### 方法B：手动上传

1. 在本地打包项目为 zip 文件
2. 在宝塔文件管理中，进入网站根目录
3. 删除默认文件
4. 点击 **"上传"**，上传 zip 文件
5. 上传完成后，右键点击 zip 文件，选择 **"解压"**
6. 将文件解压到根目录

---

## 第六步：安装后端依赖

### 1. 安装 PM2 管理器

1. 点击左侧 **"软件商店"**
2. 搜索 **"PM2管理器"**
3. 点击 **"安装"**

### 2. 设置 Node.js 版本

1. 在 **"软件商店"** 中找到已安装的 **"Node.js"**
2. 点击 **"设置"**
3. 确认版本是 **18 或更高**
4. 如果版本过低，可以安装多个版本并切换

### 3. 安装后端依赖

1. 进入文件管理，打开 **`backend`** 目录
2. 点击顶部 **"终端"**
3. 执行以下命令：

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 或者使用国内镜像加速
npm install --registry=https://registry.npmmirror.com
```

### 4. 创建后端环境变量

1. 在 **`backend`** 目录中，创建 **`.env`** 文件
2. 点击 **".env"** 文件，点击 **"编辑"**
3. 填写以下内容：

```bash
# 服务器配置
PORT=3000
NODE_ENV=production

# 数据库配置（使用宝塔创建的数据库信息）
DB_HOST=localhost
DB_PORT=3306
DB_USER=bim_pms
DB_PASSWORD=你的数据库密码
DB_NAME=bim_pms

# JWT密钥
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

4. 保存文件

---

## 第七步：初始化数据库

### 1. 使用 phpMyAdmin 导入（简单方法）

1. 点击左侧 **"数据库"**
2. 找到 `bim_pms` 数据库，点击 **"管理"**
3. 进入 phpMyAdmin
4. 选择 `bim_pms` 数据库
5. 点击 **"导入"** 标签
6. 点击 **"选择文件"**
7. 上传 `database/01-init-schema.sql` 文件
8. 点击 **"执行"**
9. 重复步骤，上传 `database/02-seed-data.sql` 文件

### 2. 使用终端初始化（推荐方法）

1. 在后端目录打开终端
2. 执行：

```bash
cd /www/wwwroot/你的网站目录/backend
node scripts/init-db.js
```

看到成功提示表示初始化完成！

---

## 第八步：启动后端服务

### 方法A：使用 PM2 管理器（推荐）

1. 点击左侧 **"PM2管理器"**
2. 点击 **"添加项目"**
3. 填写信息：
   - **项目所在目录**：`/www/wwwroot/你的网站目录/backend`
   - **启动文件**：`dist/index.js`（先构建）或 `src/index.ts`
   - **项目名称**：`bimpms-backend`
   - **端口**：`3000`

但更推荐使用命令行：

### 方法B：使用 PM2 命令行

1. 在后端目录打开终端
2. 执行：

```bash
# 先构建项目
npm run build

# 使用 PM2 启动
pm2 start dist/index.js --name bimpms-backend

# 查看运行状态
pm2 status

# 查看日志
pm2 logs bimpms-backend

# 设置开机自启
pm2 startup
pm2 save
```

3. 确认服务运行正常：
   - 访问 `http://你的服务器IP:3000/api`
   - 应该返回：`{"success":true,"message":"BIM Project Management System API is running"}`

---

## 第九步：构建前端

### 1. 安装前端依赖

1. 进入 **`frontend`** 目录
2. 打开终端，执行：

```bash
cd /www/wwwroot/你的网站目录/frontend

# 安装依赖
npm install --registry=https://registry.npmmirror.com
```

### 2. 修改前端 API 地址

1. 打开 **`frontend/.env.production`** 文件（没有则创建）
2. 填写：

```bash
VITE_API_BASE_URL=http://你的服务器IP:3000/api
```

如果有域名：

```bash
VITE_API_BASE_URL=https://你的域名/api
```

### 3. 构建前端

```bash
# 在 frontend 目录执行
npm run build
```

构建完成后，会在 **`frontend/dist`** 目录生成静态文件。

### 4. 部署前端静态文件

1. 在宝塔文件管理中，进入网站根目录
2. 删除根目录下的所有文件
3. 进入 **`frontend/dist`** 目录
4. 将 `dist` 目录下的**所有文件和文件夹**移动到网站根目录

或者使用命令：

```bash
# 在网站根目录执行
cd /www/wwwroot/你的网站目录
rm -rf ./*  # 删除原有文件
cp -r frontend/dist/* ./
```

---

## 第十步：配置 Nginx 反向代理

### 1. 设置前端静态文件

1. 点击左侧 **"网站"**
2. 找到你的站点，点击 **"设置"**
3. 点击 **"配置文件"** 标签
4. 修改配置：

```nginx
server {
    listen 80;
    server_name 你的域名或IP;

    # 前端静态文件
    location / {
        root /www/wwwroot/你的网站目录;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # 后端 API 反向代理
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 伪静态规则（单页应用）
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /www/wwwroot/你的网站目录;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

5. 点击 **"保存"**
6. 重载 Nginx：在宝塔面板首页，点击 Nginx 的 **"重载配置"**

### 2. 修改前端 API 地址（重要！）

由于使用了 Nginx 反向代理，前端不需要直接访问 3000 端口，应该修改为相对路径：

1. 进入 **`frontend`** 目录
2. 编辑 **`.env.production`**：

```bash
VITE_API_BASE_URL=/api
```

3. 重新构建前端：

```bash
cd frontend
npm run build
```

4. 重新部署静态文件到网站根目录

---

## 第十一步：配置 SSL 证书（推荐）

### 1. 申请免费 Let's Encrypt 证书

1. 点击站点 **"设置"**
2. 点击 **"SSL"** 标签
3. 选择 **"Let's Encrypt"**
4. 填写邮箱
5. 点击 **"申请"**

### 2. 强制 HTTPS

申请成功后，开启 **"强制HTTPS"**。

---

## 第十二步：测试验证

### 1. 测试后端 API

访问：`http://你的域名/api`

应该返回：
```json
{
  "success": true,
  "message": "BIM Project Management System API is running"
}
```

### 2. 测试前端

访问：`http://你的域名`

或使用 `https://你的域名`（如果配置了 SSL）

### 3. 登录测试

使用测试账号登录：
- 用户名：`admin`
- 密码：`password123`

---

## 常见问题

### Q1: 后端启动失败

**排查步骤：**
1. 查看 PM2 日志：`pm2 logs bimpms-backend`
2. 检查端口 3000 是否被占用：`netstat -tunlp | grep 3000`
3. 确认数据库连接信息是否正确
4. 确认 Node.js 版本是否正确（需要 18+）

### Q2: 前端页面空白

**可能原因：**
1. 静态文件路径错误
2. 构建失败
3. API 地址配置错误

**解决方法：**
1. 检查浏览器控制台错误
2. 检查 Nginx 配置
3. 确认 VITE_API_BASE_URL 正确

### Q3: API 请求 404

**可能原因：**
1. Nginx 反向代理配置错误
2. 后端服务未启动
3. 路径配置错误

**解决方法：**
1. 检查后端服务状态：`pm2 status`
2. 检查 Nginx 配置中 `/api` 的 `proxy_pass`
3. 确认 API 地址是 `/api` 而不是 `http://localhost:3000/api`

### Q4: 数据库连接失败

**解决方法：**
1. 确认数据库服务运行状态：在宝塔面板查看 MySQL 状态
2. 检查 `.env` 文件中的数据库配置
3. 确认数据库用户权限
4. 检查数据库是否已创建

### Q5: 无法访问网站

**排查步骤：**
1. 确认云服务器安全组已开放 80/443 端口
2. 确认宝塔防火墙已放行 80/443 端口
3. 检查 Nginx 是否运行
4. 查看网站错误日志

---

## 性能优化建议

### 1. 启用 Gzip 压缩

在 Nginx 配置中添加：

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### 2. 配置缓存

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 3. 数据库优化

1. 定期备份数据库
2. 优化 MySQL 配置
3. 监控数据库性能

---

## 安全建议

1. **定期备份数据**
   - 在宝塔面板设置计划任务
   - 每天自动备份数据库和网站文件

2. **修改默认端口**
   - 修改 SSH 端口（默认 22）
   - 修改宝塔面板端口（默认 8888）

3. **开启防火墙**
   - 只开放必要端口
   - 使用云服务商的防火墙

4. **保持更新**
   - 定期更新系统补丁
   - 更新宝塔面板
   - 更新软件版本

5. **监控日志**
   - 定期查看访问日志
   - 检查异常访问

---

## 备份与恢复

### 自动备份设置

1. 点击左侧 **"计划任务"**
2. 添加备份任务：
   - **任务类型**：备份数据库
   - **执行周期**：每天
   - **保留天数**：7

### 手动备份

1. **数据库备份**：
   - 点击左侧 **"数据库"**
   - 选择数据库，点击 **"导出"**

2. **文件备份**：
   - 点击网站后的 **"备份"**
   - 点击 **"创建备份"**

---

## 成本估算

### 云服务器（按年计算）

| 配置 | 阿里云 | 腾讯云 |
|------|--------|--------|
| 1核2G | ¥60-100/年 | ¥50-90/年 |
| 2核4G | ¥200-300/年 | ¥180-250/年 |

### 域名（可选）

- `.com` 域名：¥50-80/年
- `.cn` 域名：¥20-30/年

**总计：约 ¥50-400/年**（根据配置）

---

## 总结

使用宝塔面板部署的优势：

✅ **可视化操作** - 不需要精通 Linux 命令
✅ **一键安装** - Nginx、MySQL、Node.js 自动配置
✅ **安全方便** - SSL 证书、防火墙、备份一键设置
✅ **监控完善** - 性能监控、日志查看方便
✅ **免费使用** - 宝塔面板本身完全免费

按照本指南，您可以在 30-60 分钟内完成部署！

---

## 需要帮助？

- 宝塔官网：https://www.bt.cn
- 宝塔论坛：https://www.bt.cn/bbs
- 项目 GitHub：https://github.com/mms916/BIMPMS

祝部署顺利！🚀
