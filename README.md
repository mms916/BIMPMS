# BIM项目管理系统 - 项目台账管理模块

## 🎯 项目概述

这是一个基于React + Node.js + MySQL构建的BIM项目管理系统，专注于项目台账的数字化管理，实现了项目全生命周期的信息管理、进度跟踪、结算管理和权限控制。

## ✨ 核心功能

### 已实现功能（V1.0 MVP）

#### 用户认证与权限
- ✅ JWT Token认证
- ✅ 四级权限体系（管理员/部门负责人/项目负责人/普通员工）
- ✅ 用户登录/登出
- ✅ 基于角色的数据访问控制

#### 项目管理
- ✅ 项目列表展示（支持筛选、分页、排序）
- ✅ 项目详情查看
- ✅ 新增项目
- ✅ 编辑项目
- ✅ 删除项目（仅管理员）
- ✅ 合同编号自动生成
- ✅ 项目统计（总数/逾期/金额/结算/进度）

#### 数据筛选
- ✅ 关键词搜索（合同编号/名称/负责人）
- ✅ 结算状态筛选
- ✅ 是否逾期筛选
- ✅ 项目负责人筛选

#### UI/UX功能
- ✅ 统计看板（5个核心指标）
- ✅ 字段自定义显示（列设置）
- ✅ 进度条可视化（颜色随进度变化）
- ✅ 逾期项目高亮显示
- ✅ 响应式表格

## 🛠️ 技术栈

### 前端
- **React 18** - UI框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Ant Design 5** - UI组件库
- **React Router 6** - 路由管理
- **React Query** - 服务端状态管理
- **Axios** - HTTP客户端
- **Day.js** - 日期处理

### 后端
- **Node.js** - JavaScript运行时
- **Express** - Web框架
- **TypeScript** - 类型安全
- **MySQL 8.0** - 关系型数据库
- **JWT** - 用户认证
- **bcrypt** - 密码加密
- **mysql2** - MySQL驱动

## 📁 项目结构

```
BIM PMS/
├── backend/                    # 后端项目
│   ├── src/
│   │   ├── config/            # 配置文件
│   │   ├── controllers/       # 控制器
│   │   ├── middleware/        # 中间件
│   │   ├── routes/            # 路由
│   │   ├── services/          # 业务逻辑
│   │   ├── types/             # TypeScript类型
│   │   ├── utils/             # 工具函数
│   │   └── index.ts           # 入口文件
│   ├── .env                   # 环境配置
│   └── package.json
│
├── frontend/                   # 前端项目
│   ├── src/
│   │   ├── components/        # 组件
│   │   ├── contexts/          # Context
│   │   ├── hooks/             # 自定义Hooks
│   │   ├── pages/             # 页面
│   │   ├── services/          # API服务
│   │   ├── types/             # TypeScript类型
│   │   ├── utils/             # 工具函数
│   │   ├── App.tsx            # 根组件
│   │   └── main.tsx           # 入口文件
│   └── package.json
│
├── database/                   # 数据库脚本
│   ├── 01-init-schema.sql     # 表结构创建
│   ├── 02-seed-data.sql       # 种子数据
│   └── init-db.js             # 初始化脚本
│
└── PRD.md                      # 产品需求文档
```

## 🚀 快速开始

### 前置要求

- Node.js >= 18
- MySQL >= 8.0
- npm 或 yarn

### 1. 克隆项目

```bash
cd "d:\project\BIM PMS"
```

### 2. 数据库初始化

```bash
# 使用Node.js脚本初始化（推荐）
cd backend
node scripts/init-db.js
```

### 3. 后端配置

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 配置环境变量（已包含.env文件，如需修改请编辑）
# DB_PASSWORD=root123456

# 启动后端服务
npm run dev
```

后端服务将在 `http://localhost:3000` 启动

### 4. 前端配置

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动前端服务
npm run dev
```

前端服务将在 `http://localhost:5174` 启动

### 5. 访问应用

打开浏览器访问：`http://localhost:5174`

## 🔑 测试账号

| 用户名 | 密码 | 角色 | 权限 |
|--------|------|------|------|
| admin | password123 | 管理员 | 全部权限 |
| dept_manager_xm | password123 | 部门负责人（项目部） | 查看/编辑本部门项目 |
| dept_manager_js | password123 | 部门负责人（技术部） | 查看/编辑本部门项目 |
| project_leader_1 | password123 | 项目负责人 | 查看/编辑负责的项目 |
| employee_1 | password123 | 普通员工 | 查看参与的项目 |

## 📊 数据库说明

### 数据表

1. **users** - 用户表
   - 存储系统用户信息
   - 包含角色和部门关联

2. **departments** - 部门表
   - 存储部门信息
   - 部门包括：项目部、技术部、财务部、工程部、综合部

3. **projects** - 项目表
   - 存储项目信息
   - 包含合同、进度、结算等核心数据

4. **user_preferences** - 用户偏好设置表
   - 存储用户的个性化配置
   - 如表格列显示配置

### 种子数据

- 5个部门
- 10个用户
- 10个示例项目（包含2个逾期项目）

## 🔧 API接口

### 认证接口
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 项目接口
- `GET /api/projects` - 获取项目列表
- `GET /api/projects/stats` - 获取统计数据
- `GET /api/projects/contract/generate-no` - 生成合同编号
- `POST /api/projects` - 创建项目
- `GET /api/projects/:id` - 获取项目详情
- `PUT /api/projects/:id` - 更新项目
- `DELETE /api/projects/:id` - 删除项目

## 📝 开发指南

### 后端开发

```bash
cd backend

# 开发模式（热重载）
npm run dev

# 构建生产版本
npm run build

# 启动生产版本
npm start
```

### 前端开发

```bash
cd frontend

# 开发模式（热重载）
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 🎨 UI/UX设计

### 设计理念

- **极简专业风**：强调数据密度与操作效率
- **深空蓝主色调**（#1e3a8a）
- **进度可视化**：进度条颜色随进度变化（红/黄/绿）
- **状态标注**：逾期项目红色背景高亮

### 布局结构

1. **统计看板**：顶部显示5个核心指标
2. **搜索筛选**：支持关键词搜索和多条件筛选
3. **数据表格**：支持分页、排序、列自定义
4. **操作弹窗**：新增/编辑/查看项目

## 🔐 权限体系

### 四级权限

1. **管理员（admin）**
   - 全部操作权限
   - 可编辑所有字段
   - 可删除项目

2. **部门负责人（dept_manager）**
   - 查看/编辑本部门项目
   - 可编辑：项目进度、结算情况、参与人员、是否签订、回款金额、项目备注

3. **项目负责人（project_manager）**
   - 查看/编辑负责的项目
   - 可编辑：项目进度、参与人员、项目备注

4. **普通员工（employee）**
   - 仅查看参与的项目
   - 无编辑权限

## 📈 未来规划

### V2版本
- 批量操作（批量编辑/删除/导入）
- 高级筛选（时间范围/金额范围/进度范围）
- 打印功能
- 卡片视图
- 操作日志
- 枚举值自定义
- 回款记录明细

### V3版本
- 移动端适配
- 数据可视化大屏
- 项目归档功能

### V4版本
- 智能预警（逾期提醒）
- 数据自动备份
- 与其他模块集成
- RESTful API接口

## 🐛 常见问题

### 1. 数据库连接失败

检查 `backend/.env` 文件中的数据库配置：
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root123456
DB_NAME=bim_pms
```

### 2. 前端无法访问后端API

确保后端服务已启动在 `http://localhost:3000`

### 3. 登录失败

确保数据库已初始化种子数据，使用正确的测试账号

## 📄 许可证

MIT License

## 👥 贡献者

- 产品设计：Claude (首席产品设计师)
- 开发：Claude (全栈工程师)

---

**注意**：这是MVP（最小可行产品）版本，核心功能已完成。欢迎提出反馈和建议！
