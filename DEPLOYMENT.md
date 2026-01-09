# BIM项目管理系统 - 部署指南

本文档介绍如何将BIM项目管理系统部署到生产环境。

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
│  后端 (Render)  │
│  Node.js + Express │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ 数据库 (Render) │
│   PostgreSQL   │
└─────────────────┘
```

## 部署步骤

### 一、部署后端到Render

#### 1. 注册Render账号
- 访问 https://render.com
- 使用GitHub账号登录

#### 2. 创建Web Service
1. 点击 Dashboard -> "New +" -> "Web Service"
2. 连接GitHub仓库：`mms916/BIMPMS`
3. 配置以下信息：

**基本配置**：
- **Name**: `bimpms-backend`
- **Region**: Singapore (离中国最近)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node 18`

**构建配置**：
- **Build Command**: `npm install`
- **Start Command**: `npm start`

#### 3. 创建数据库
1. 在Render Dashboard中点击 "New +" -> "PostgreSQL"
2. 配置数据库：
   - **Name**: `bimpms-db`
   - **Database**: `bimpms`
   - **User**: `bimpms_user`
   - **Region**: Singapore (与后端相同)
   - **Plan**: Free

#### 4. 配置环境变量
在后端Service中添加以下环境变量：

```bash
# 从数据库Dashboard获取（自动填充）
DB_HOST=<database-host>
DB_PORT=5432
DB_NAME=bimpms
DB_USER=<database-user>
DB_PASSWORD=<database-password>

# 手动添加
NODE_ENV=production
PORT=3000
JWT_SECRET=<your-random-secret-key>
JWT_EXPIRES_IN=7d
```

**获取数据库连接信息**：
1. 进入数据库Dashboard
2. 点击 "Connect" -> "Internal Connection"
3. 复制Host、User、Password等信息

#### 5. 初始化数据库
部署成功后，需要运行数据库初始化脚本：

**方法A：使用Render Shell（推荐）**
1. 在后端Service中点击 "Shell"
2. 运行以下命令：
```bash
cd backend
node scripts/init-db.js
```

**方法B：本地连接**
```bash
# 设置环境变量
export DB_HOST=<your-db-host>
export DB_PORT=5432
export DB_NAME=bimpms
export DB_USER=<your-db-user>
export DB_PASSWORD=<your-db-password>

# 运行初始化脚本
cd backend
node scripts/init-db.js
```

#### 6. 获取后端API地址
部署完成后，Render会提供一个URL，例如：
```
https://bimpms-backend.onrender.com
```

**重要**：完整的API地址是：
```
https://bimpms-backend.onrender.com/api
```

---

### 二、部署前端到Vercel

#### 1. 注册Vercel账号
- 访问 https://vercel.com
- 使用GitHub账号登录

#### 2. 导入项目
1. 点击 "Add New..." -> "Project"
2. 导入GitHub仓库：`mms916/BIMPMS`

#### 3. 配置项目
在项目配置页面填写：

**基本配置**：
- **Project Name**: `bimpms-frontend`
- **Framework Preset**: Vite
- **Root Directory**: `frontend`

**Build & Development Settings**：
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### 4. 设置环境变量
在 "Environment Variables" 部分添加：

```bash
VITE_API_BASE_URL=https://bimpms-backend.onrender.com/api
```

**注意**：
- 将上面URL替换为你的实际后端地址
- 变量名必须是 `VITE_API_BASE_URL`（Vite要求）
- 不要在末尾加斜杠

#### 5. 部署
点击 "Deploy" 按钮，等待部署完成（约2-3分钟）。

#### 6. 获取前端地址
部署完成后，Vercel会提供一个URL，例如：
```
https://bimpms-frontend.vercel.app
```

---

### 三、验证部署

#### 1. 测试后端API
访问以下URL，确保返回正确的响应：
```bash
# 健康检查（如果实现了）
https://bimpms-backend.onrender.com/api/health

# 测试登录API（使用curl或Postman）
curl -X POST https://bimpms-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123"}'
```

#### 2. 测试前端
1. 访问前端地址
2. 使用测试账号登录：
   - 用户名：`admin`
   - 密码：`123`
3. 验证功能是否正常

#### 3. 检查网络请求
打开浏览器开发者工具（F12），检查：
- Network标签中API请求是否成功
- 是否有CORS错误
- API地址是否正确

---

### 四、常见问题

#### Q1: 后端部署成功但API无法访问
**原因**：Render免费版冷启动（首次访问需要等待1-2分钟）

**解决**：
- 等待1-2分钟后重试
- 或者使用付费版（$7/月）

#### Q2: 前端无法连接后端API
**原因**：
- CORS配置错误
- API地址配置错误
- 后端还未完全启动

**解决**：
1. 检查后端CORS配置（[backend/src/index.ts](backend/src/index.ts)）
2. 确认前端环境变量 `VITE_API_BASE_URL` 正确
3. 检查后端日志确认是否启动成功

#### Q3: 数据库连接失败
**原因**：
- 数据库未启动（需要等待几分钟）
- 环境变量配置错误
- 数据库未在正确Region

**解决**：
1. 确认数据库和后端在相同Region
2. 检查环境变量是否正确
3. 使用Render Shell测试连接

#### Q4: 登录失败
**原因**：数据库未初始化

**解决**：运行数据库初始化脚本（见步骤一.5）

#### Q5: Vercel部署后显示404
**原因**：Root Directory配置错误

**解决**：确保Root Directory设置为 `frontend`

---

### 五、域名配置（可选）

#### 配置自定义域名

**前端（Vercel）**：
1. 进入项目Settings -> Domains
2. 添加你的域名
3. 按照提示配置DNS记录

**后端（Render）**：
1. 进入Service Settings -> Custom Domains
2. 添加你的域名
3. 配置DNS CNAME记录指向你的Render服务

---

### 六、监控和日志

#### 前端（Vercel）
- 访问项目Dashboard
- 查看 "Deployments" 标签了解部署历史
- 查看 "Logs" 标签了解运行日志

#### 后端（Render）
- 访问Service Dashboard
- 查看 "Logs" 标签了解实时日志
- 查看 "Metrics" 标签了解性能指标

---

### 七、成本预估

#### 免费版限制

**Vercel（前端）**：
- ✅ 无限带宽
- ✅ 无限请求
- ✅ 自动HTTPS
- ✅ 100GB/月 流量

**Render（后端）**：
- ✅ 512MB RAM
- ✅ 0.1 CPU
- ❌ 15分钟无请求后休眠（冷启动）
- ❌ 每月750小时运行时间

**Render（数据库）**：
- ✅ 90天数据保留
- ✅ 1GB存储
- ❌ 90天后数据库会休眠

#### 付费升级建议
如果遇到以下情况，考虑升级：
- 冷启动等待时间过长 → 升级到 $7/月
- 数据库需要长期运行 → 升级数据库到 $7/月

---

### 八、下一步

部署完成后，你可以：

1. **测试所有功能**：确保CRUD、权限控制等正常工作
2. **配置自定义域名**：使用自己的域名
3. **设置监控**：配置错误告警
4. **优化性能**：根据使用情况调整配置

---

### 九、回滚

如果部署出现问题：

**前端（Vercel）**：
1. 进入 "Deployments" 标签
2. 找到之前的成功部署
3. 点击 "Promote to Production"

**后端（Render）**：
1. 重新部署指定commit
2. 或在GitHub上回滚代码

---

## 需要帮助？

如遇到问题，请检查：
1. Vercel和Render的日志
2. 浏览器控制台的错误信息
3. 后端API的响应内容

祝部署顺利！
