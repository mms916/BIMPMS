# BIM项目管理系统 - 后端API

基于 Node.js + Express + TypeScript + MySQL 构建的RESTful API服务。

## 技术栈

- **Node.js** - JavaScript运行时
- **Express** - Web框架
- **TypeScript** - 类型安全的JavaScript超集
- **MySQL** - 关系型数据库
- **JWT** - 用户认证
- **bcrypt** - 密码加密
- **Zod** - 参数验证
- **exceljs** - Excel导出
- **Winston** - 日志管理

## 安装依赖

```bash
npm install
```

## 环境配置

复制 `.env.example` 为 `.env` 并配置：

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bim_pms

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

BCRYPT_ROUNDS=10
```

## 数据库初始化

```bash
cd ../database
mysql -u root -p < 01-init-schema.sql
mysql -u root -p < 02-seed-data.sql
```

## 开发

```bash
npm run dev
```

## 构建

```bash
npm run build
```

## 生产环境

```bash
npm run build
npm start
```

## API接口

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

### 健康检查

- `GET /health` - 服务健康状态

## 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | password123 | 管理员 |
| dept_manager_xm | password123 | 部门负责人 |
| project_leader_1 | password123 | 项目负责人 |
| employee_1 | password123 | 普通员工 |

## 项目结构

```
backend/
├── src/
│   ├── config/         # 配置文件
│   ├── controllers/    # 控制器
│   ├── middleware/     # 中间件
│   ├── routes/         # 路由
│   ├── services/       # 业务逻辑
│   ├── types/          # TypeScript类型定义
│   ├── utils/          # 工具函数
│   └── index.ts        # 入口文件
├── .env                # 环境变量
├── tsconfig.json       # TypeScript配置
└── package.json        # 项目配置
```

## 权限体系

- **admin**: 管理员，全部权限
- **dept_manager**: 部门负责人，查看/编辑本部门项目
- **project_manager**: 项目负责人，查看/编辑负责的项目
- **employee**: 普通员工，仅查看参与的项目
