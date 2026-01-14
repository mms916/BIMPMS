#!/bin/bash

# BIM项目管理系统 - 快速重新部署脚本
# 用途：在服务器上快速更新前端和后端代码并重启服务

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目路径
PROJECT_DIR="/www/wwwroot/BIMPMS"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
DIST_DIR="$FRONTEND_DIR/dist"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  BIM项目管理系统 - 快速重新部署${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# ========================================
# 1. 检查项目目录
# ========================================
echo -e "${YELLOW}[1/6] 检查项目目录...${NC}"
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}错误：项目目录不存在: $PROJECT_DIR${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 项目目录存在${NC}"
echo ""

# ========================================
# 2. 更新后端
# ========================================
echo -e "${YELLOW}[2/6] 更新后端代码...${NC}"
cd "$BACKEND_DIR"

# 创建软链接（如果不存在）
if [ ! -L /usr/bin/node ]; then
    ln -sf /www/server/nvm/versions/node/v20.11.1/bin/node /usr/bin/node
    ln -sf /www/server/nvm/versions/node/v20.11.1/bin/npm /usr/bin/npm
    ln -sf /www/server/nvm/versions/node/v20.11.1/bin/npx /usr/bin/npx
    echo -e "${GREEN}✓ 创建Node.js软链接${NC}"
fi

# 拉取最新代码（如果使用Git）
if [ -d ".git" ]; then
    echo "拉取最新代码..."
    git pull
fi

# 安装依赖
echo "安装后端依赖..."
npm install --registry=https://registry.npmmirror.com

# 构建项目
echo "构建后端项目..."
npm run build

echo -e "${GREEN}✓ 后端构建完成${NC}"
echo ""

# ========================================
# 3. 更新前端（在本地执行）
# ========================================
echo -e "${YELLOW}[3/6] 前端更新说明...${NC}"
echo -e "${YELLOW}请手动在本地执行以下命令：${NC}"
echo ""
echo "  cd \"d:\\project\\BIM PMS\\frontend\""
echo "  npm run build"
echo ""
echo -e "${YELLOW}然后上传 dist 目录到服务器：${NC}"
echo "  $DIST_DIR"
echo ""

# 询问是否已上传
read -p "是否已上传前端构建产物？(y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}请先上传前端文件后再运行此脚本${NC}"
    exit 1
fi

# 验证前端文件
if [ ! -f "$DIST_DIR/index.html" ]; then
    echo -e "${RED}错误：前端文件不存在，请先上传 dist 目录${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 前端文件验证通过${NC}"
echo ""

# ========================================
# 4. 重启后端服务
# ========================================
echo -e "${YELLOW}[4/6] 重启后端服务...${NC}"

# 停止旧服务
/www/server/nodejs/v20.11.1/bin/pm2 stop bimpms-backend 2>/dev/null || true
/www/server/nodejs/v20.11.1/bin/pm2 delete bimpms-backend 2>/dev/null || true

# 启动新服务
/www/server/nodejs/v20.11.1/bin/pm2 start dist/index.js \
    --name bimpms-backend \
    --cwd "$BACKEND_DIR"

echo -e "${GREEN}✓ 后端服务已重启${NC}"
echo ""

# ========================================
# 5. 验证服务状态
# ========================================
echo -e "${YELLOW}[5/6] 验证服务状态...${NC}"

# 检查PM2状态
sleep 2
/www/server/nodejs/v20.11.1/bin/pm2 status bimpms-backend

# 检查后端健康
echo ""
echo "检查后端健康状态..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${GREEN}✓ 后端服务运行正常${NC}"
else
    echo -e "${RED}✗ 后端服务异常，请检查日志${NC}"
    /www/server/nodejs/v20.11.1/bin/pm2 logs bimpms-backend --lines 20
    exit 1
fi

# 检查Nginx
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx运行正常${NC}"
else
    echo -e "${RED}✗ Nginx未运行${NC}"
    systemctl start nginx
fi

echo ""

# ========================================
# 6. 显示访问信息
# ========================================
echo -e "${GREEN}[6/6] 部署完成！${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  访问信息${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "前端访问: http://47.122.112.158"
echo "后端API:  http://47.122.112.158/api"
echo ""
echo "默认账号: admin / 123"
echo ""
echo -e "${YELLOW}常用命令：${NC}"
echo "  查看后端日志: /www/server/nodejs/v20.11.1/bin/pm2 logs bimpms-backend"
echo "  重启后端:     /www/server/nodejs/v20.11.1/bin/pm2 restart bimpms-backend"
echo "  重载Nginx:    nginx -s reload"
echo ""
echo -e "${GREEN}========================================${NC}"
