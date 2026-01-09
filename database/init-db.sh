#!/bin/bash

echo "========================================"
echo "BIM项目管理系统 - 数据库初始化脚本"
echo "========================================"
echo ""

# 检查MySQL是否可用
if ! command -v mysql &> /dev/null; then
    echo "❌ 错误：未找到MySQL命令行工具"
    echo "请确保MySQL已安装并添加到系统PATH环境变量中"
    echo ""
    echo "在macOS上，您可以尝试："
    echo "  brew install mysql-client"
    echo ""
    echo "在Linux上，您可以尝试："
    echo "  sudo apt-get install mysql-client"
    echo ""
    exit 1
fi

echo "✅ 找到MySQL命令行工具"
echo ""

# 提示用户输入MySQL密码
read -sp "请输入MySQL root密码: " MYSQL_PASSWORD
echo ""
echo ""

echo "========================================"
echo "步骤 1/2: 创建数据库和表结构"
echo "========================================"
mysql -u root -p"$MYSQL_PASSWORD" < 01-init-schema.sql

if [ $? -ne 0 ]; then
    echo "❌ 数据库表结构创建失败"
    exit 1
fi

echo "✅ 数据库表结构创建成功"
echo ""

echo "========================================"
echo "步骤 2/2: 插入种子数据"
echo "========================================"
mysql -u root -p"$MYSQL_PASSWORD" < 02-seed-data.sql

if [ $? -ne 0 ]; then
    echo "❌ 种子数据插入失败"
    exit 1
fi

echo "✅ 种子数据插入成功"
echo ""

echo "========================================"
echo "🎉 数据库初始化完成！"
echo "========================================"
echo ""
echo "数据库信息："
echo "- 数据库名称：bim_pms"
echo "- 已创建表：users, departments, projects, user_preferences"
echo "- 已插入种子数据："
echo "  - 5个部门"
echo "  - 10个用户"
echo "  - 10个示例项目"
echo ""
echo "测试账号："
echo "- 用户名：admin，密码：password123（管理员）"
echo "- 用户名：dept_manager_xm，密码：password123（部门负责人）"
echo ""
