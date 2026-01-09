# Railway 部署指南

本文档介绍如何使用Railway部署BIM项目管理系统。

## 为什么选择Railway？

相比Render，Railway的优势：
- ✅ 配置更简单，自动检测项目类型
- ✅ 冷启动更快（约5-10秒）
- ✅ 免费额度更慷慨（$5/月免费额度）
- ✅ 界面更现代化，操作更直观
- ✅ 支持一键部署MySQL数据库
- ✅ 自动生成HTTPS域名

## 部署架构

```
┌─────────────────┐
│   前端 (Vercel) │
│   React + Vite  │
└────────┬────────┘
         │
         │ API请求
         ↓
┌─────────────────┐
│  后端 (Railway) │
│  Node.js + Express │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ 数据库 (Railway) │
│     MySQL      │
└─────────────────┘
```

---

## 第一步：注册Railway账号

1. 访问 https://railway.app/
2. 点击 "Start a New Project"
3. 使用GitHub账号登录并授权

---

## 第二步：部署数据库（MySQL）

### 1. 创建数据库
1. 在Railway Dashboard中点击 "New Project" → "Deploy from GitHub repo"
2. 或者直接点击 "New" → "Database" → "Add MySQL"

### 2. 配置数据库
Railway会自动创建一个MySQL数据库，记录下连接信息：
- Database Host
- Database Port
- Database Name
- Database User
- Database Password

这些信息可以在Database页面的 "Variables" 标签中找到。

---

## 第三步：部署后端

### 1. 创建后端服务
1. 在Railway项目中点击 "New Service" → "Deploy from GitHub repo"
2. 选择你的GitHub仓库：`mms916/BIMPMS`
3. 在配置页面中设置：
   - **Root Directory**: `backend`
   - **Branch**: `main`

Railway会自动检测到这是一个Node.js项目，并使用以下命令：
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 2. 配置环境变量

在后端Service的 "Variables" 标签中添加以下环境变量：

```bash
# 数据库配置（从数据库Service复制）
DB_HOST=<your-mysql-host>
DB_PORT=<your-mysql-port>
DB_NAME=<your-database-name>
DB_USER=<your-database-user>
DB_PASSWORD=<your-database-password>

# 应用配置
NODE_ENV=production
PORT=3000

# JWT配置（手动添加）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

**如何获取数据库连接信息**：
1. 点击你的MySQL数据库Service
2. 进入 "Variables" 标签
3. 复制以下变量到后端Service：
   - `MYSQLDATABASE` → 复制值到 `DB_NAME`
   - `MYSQLHOST` → 复制值到 `DB_HOST`
   - `MYSQLPORT` → 复制值到 `DB_PORT`
   - `MYSQLUSER` → 复制值到 `DB_USER`
   - `MYSQLPASSWORD` → 复制值到 `DB_PASSWORD`

**重要**：
- Railway的MySQL变量名是 `MYSQL*` 开头
- 我们的项目使用 `DB_*` 开头，所以需要手动映射

### 3. 连接数据库到后端

Railway的一个强大功能是可以自动连接Service：

1. 进入后端Service页面
2. 点击 "Settings" 标签
3. 找到 "Service Dependencies" 或直接在页面顶部看到数据库Service
4. 点击数据库图标，选择 "Add to Service"

这样Railway会自动将数据库的连接信息注入到后端Service中。

---

## 第四步：初始化数据库

### 方法A：使用Railway Shell（推荐）

1. 进入后端Service
2. 点击 "Shell" 标签
3. 在终端中运行：
```bash
node scripts/init-db.js
```

### 方法B：本地连接

如果你想在本地初始化数据库：

1. 在Railway数据库Service中点击 "Connect" → "MySQL CLI"
2. 复制连接命令
3. 在本地运行初始化脚本：

```bash
# 设置环境变量
export DB_HOST=<your-railway-host>
export DB_PORT=<your-railway-port>
export DB_NAME=<your-database-name>
export DB_USER=<your-database-user>
export DB_PASSWORD=<your-database-password>

# 运行初始化
cd backend
node scripts/init-db.js
```

---

## 第五步：获取后端API地址

1. 进入后端Service页面
2. 在顶部会看到生成的域名，例如：
   ```
   https://bimpms-backend-production.up.railway.app
   ```

3. 完整的API地址是：
   ```
   https://bimpms-backend-production.up.railway.app/api
   ```

4. 记录这个地址，部署前端时需要用到

---

## 第六步：部署前端到Vercel

### 1. 创建Vercel项目
1. 访问 https://vercel.com
2. 点击 "Add New..." → "Project"
3. 导入GitHub仓库：`mms916/BIMPMS`

### 2. 配置前端项目
在项目配置页面：

**基本配置**：
- **Project Name**: `bimpms-frontend`
- **Framework Preset**: Vite
- **Root Directory**: `frontend`

**Build Settings**：
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. 设置环境变量
在 "Environment Variables" 部分添加：

```bash
VITE_API_BASE_URL=https://bimpms-backend-production.up.railway.app/api
```

**注意**：
- 将URL替换为你的实际Railway后端地址
- 不要在末尾加斜杠 `/`

### 4. 部署
点击 "Deploy" 按钮，等待部署完成。

---

## 第七步：验证部署

### 1. 测试后端API

访问以下URL测试API是否正常：

```bash
# 测试登录API
curl -X POST https://bimpms-backend-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123"}'
```

或者直接在浏览器访问：
```
https://bimpms-backend-production.up.railway.app/api
```

应该返回：
```json
{
  "success": true,
  "message": "BIM Project Management System API is running"
}
```

### 2. 测试前端

1. 访问Vercel提供的前端地址
2. 使用测试账号登录：
   - 用户名：`admin`
   - 密码：`123`
3. 验证功能是否正常

### 3. 检查网络请求

打开浏览器开发者工具（F12）：
- 检查 Network 标签
- 确认API请求成功（200状态码）
- 检查是否有CORS错误

---

## Railway 常见问题

### Q1: 后端部署失败，出现编译错误

**原因**：TypeScript编译配置问题

**解决**：
1. 检查 `backend/tsconfig.json` 是否存在
2. 确保 `backend/package.json` 中有build脚本
3. 在Railway的Logs中查看详细错误信息

### Q2: 数据库连接失败

**原因**：环境变量配置错误

**解决**：
1. 确认所有数据库环境变量都已正确设置
2. 检查变量名是否正确（`DB_HOST`、`DB_PORT`等）
3. 确认数据库Service和后端Service在同一项目中

### Q3: API返回CORS错误

**原因**：CORS配置未包含Vercel域名

**解决**：
后端代码中已配置允许所有域名：
```typescript
app.use(cors({ origin: '*' }));
```

如果仍有问题，检查 [backend/src/index.ts](backend/src/index.ts:28)

### Q4: 登录失败，提示用户不存在

**原因**：数据库未初始化

**解决**：
运行数据库初始化脚本（见第四步）

### Q5: 部署成功但访问404

**原因**：路径配置错误

**解决**：
- 确认API路径是 `/api/...`
- 检查后端 `src/index.ts` 中路由配置

### Q6: 冷启动时间过长

**原因**：Railway免费版会休眠

**解决**：
- 首次访问需要等待10-20秒启动
- 可以使用Railway的 "Keep Awake" 功能（付费）
- 或者升级到付费计划（$5/月起）

---

## Railway vs Render 对比

| 特性 | Railway | Render |
|------|---------|--------|
| 冷启动时间 | 5-10秒 | 30-60秒 |
| 免费额度 | $5/月 | 750小时/月 |
| 数据库 | MySQL/PostgreSQL | PostgreSQL |
| 界面 | 现代化 | 传统 |
| 配置难度 | 简单 | 中等 |
| 自动检测 | ✅ | ❌ |
| 一键部署 | ✅ | ✅ |

---

## 成本预估

### Railway免费版
- ✅ $5免费额度/月
- ✅ 512MB RAM
- ✅ 无限请求
- ❌ 休眠后冷启动

### 付费版
- $5/月起
- $20/月（推荐，无休眠）

---

## 监控和日志

### 查看日志
1. 进入Service页面
2. 点击 "Deployments" 标签
3. 选择一个部署，点击 "View Logs"

### 查看指标
1. 点击 "Metrics" 标签
2. 查看：
   - CPU使用率
   - 内存使用
   - 网络流量
   - 请求次数

---

## 域名配置（可选）

### 自定义域名

**前端（Vercel）**：
1. 进入项目Settings → Domains
2. 添加你的域名
3. 配置DNS记录

**后端（Railway）**：
1. 进入Service Settings → Networking
2. 添加自定义域名
3. 配置CNAME记录指向Railway域名

---

## 回滚

如果部署出现问题：

### 后端（Railway）
1. 进入 "Deployments" 标签
2. 找到之前的成功部署
3. 点击 "Rollback to this deployment"

### 前端（Vercel）
1. 进入 "Deployments" 标签
2. 找到之前的成功部署
3. 点击 "Promote to Production"

---

## 下一步

部署完成后，你可以：

1. **设置告警**：配置Railway发送错误通知
2. **配置自定义域名**：使用自己的域名
3. **优化性能**：根据使用情况调整配置
4. **设置监控**：使用Railway的Metrics功能

---

## 快速参考

### Railway常用命令

```bash
# 安装Railway CLI（可选）
npm install -g @railway/cli

# 登录
railway login

# 初始化项目
railway init

# 查看日志
railway logs

# 打开Dashboard
railway open
```

### 环境变量快速设置

在Railway Dashboard中：
1. 进入Service → Variables
2. 点击 "New Variable"
3. 添加变量名和值

### 数据库连接字符串格式

```
mysql://user:password@host:port/database
```

---

## 需要帮助？

- Railway文档：https://docs.railway.app/
- Railway社区：https://community.railway.app/
- 查看本文档的"常见问题"部分

祝你部署顺利！🚀
