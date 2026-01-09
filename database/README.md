# BIM项目管理系统 - 数据库说明

## 数据库配置

- **数据库名称**: `bim_pms`
- **字符集**: `utf8mb4`
- **排序规则**: `utf8mb4_unicode_ci`

## 初始化步骤

### 1. 创建数据库和表结构

```bash
# MySQL命令行
mysql -u root -p < 01-init-schema.sql

# 或使用MySQL Workbench导入脚本
```

### 2. 插入种子数据

```bash
# MySQL命令行
mysql -u root -p < 02-seed-data.sql

# 或使用MySQL Workbench导入脚本
```

## 数据表说明

### 1. 用户表 (users)
存储系统用户信息，包括管理员、部门负责人、项目负责人、普通员工。

### 2. 部门表 (departments)
存储部门信息，包括项目部、技术部、财务部、工程部、综合部。

### 3. 项目表 (projects)
存储项目信息，包括合同编号、合同名称、起止日期、合同金额、项目进度等。

### 4. 用户偏好设置表 (user_preferences)
存储用户的个性化设置，如表格字段显示配置。

## 测试账号

| 用户名 | 密码 | 角色 | 部门 |
|--------|------|------|------|
| admin | password123 | 管理员 | 项目部 |
| dept_manager_xm | password123 | 部门负责人 | 项目部 |
| dept_manager_js | password123 | 部门负责人 | 技术部 |
| project_leader_1 | password123 | 项目负责人 | 项目部 |
| employee_1 | password123 | 普通员工 | 项目部 |

## 种子数据统计

- 部门数量: 5个
- 用户数量: 10个
- 项目数量: 10个（包含2个逾期项目）

## 注意事项

1. 所有密码使用bcrypt加密（10轮加盐）
2. 参与人员字段使用JSON格式存储用户ID数组
3. 合同编号格式：局0113 + 日期(YYYYMMDD) + 序号(4位)
4. 项目进度范围：0-100
5. 金额单位：万元（保留2位小数）
