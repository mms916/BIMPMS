# Docker 部署指南

本文档介绍如何使用Docker和Docker Compose快速部署BIM项目管理系统。

## 为什么选择Docker？

- ✅ **环境一致性**：开发、测试、生产环境完全一致
- ✅ **快速部署**：一条命令启动所有服务
- ✅ **易于维护**：版本管理、升级、回滚都很简单
- ✅ **资源隔离**：容器化运行，互不干扰
- ✅ **跨平台**：Windows、Linux、Mac都可以运行

---

## 前置要求

### 安装Docker

#### Windows
1. 下载Docker Desktop：https://www.docker.com/products/docker-desktop/
2. 安装并启动Docker Desktop
3. 确保Docker正在运行（任务栏看到Docker图标）

#### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 添加当前用户到docker组（可选，避免每次使用sudo）
sudo usermod -aG docker $USER

# 重新登录或运行
newgrp docker

# 验证安装
docker --version
docker-compose --version
```

#### Linux (CentOS/RHEL)
```bash
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

#### macOS
1. 下载Docker Desktop：https://www.docker.com/products/docker-desktop/
2. 安装并启动Docker Desktop
3. 验证安装：
```bash
docker --version
docker-compose --version
```

---

## 快速开始

### 1. 准备项目文件

```bash
# 克隆项目（或解压项目文件）
git clone https://github.com/mms916/BIMPMS.git
cd BIMPMS

# 或者从压缩包解压后进入项目目录
cd BIMPMS
```

### 2. 配置环境变量

```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑环境变量（修改密码等敏感信息）
nano .env  # Linux
# 或使用任何文本编辑器
```

**重要**：修改以下配置：
- `MYSQL_ROOT_PASSWORD`：MySQL root密码
- `DB_PASSWORD`：数据库用户密码
- `JWT_SECRET`：JWT密钥（随机字符串）

### 3. 启动所有服务

```bash
# 构建并启动所有服务（后台运行）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 等待所有服务启动完成（约2-3分钟）
# 看到以下信息说明启动成功：
# - mysql: ready for connections
# - backend: Server running on port 3000
# - frontend: nginx started
```

### 4. 访问系统

在浏览器中打开：
```
http://localhost
```

使用测试账号登录：
- 用户名：`admin`
- 密码：`123`

---

## 常用命令

### 服务管理

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart backend

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 查看特定服务的日志
docker-compose logs -f backend

# 查看实时日志（最后100行）
docker-compose logs --tail=100 -f
```

### 数据管理

```bash
# 进入MySQL容器
docker-compose exec mysql bash

# 连接到MySQL
docker-compose exec mysql mysql -u bimpms_user -p bimpms

# 备份数据库
docker-compose exec mysql mysqldump -u bimpms_user -p bimpms > backup.sql

# 恢复数据库
docker-compose exec -T mysql mysql -u bimpms_user -p bimpms < backup.sql

# 删除所有数据（危险操作！）
docker-compose down -v
```

### 更新和重建

```bash
# 重新构建镜像（代码更新后）
docker-compose build

# 重新构建并启动
docker-compose up -d --build

# 强制重新创建容器
docker-compose up -d --force-recreate
```

### 清理

```bash
# 清理未使用的镜像
docker image prune

# 清理未使用的容器
docker container prune

# 清理未使用的卷（包括数据库数据！）
docker volume prune

# 清理所有未使用的资源
docker system prune -a
```

---

## 配置说明

### docker-compose.yml 结构

```yaml
services:
  mysql:      # MySQL数据库服务
  backend:    # Node.js后端服务
  frontend:   # Nginx前端服务
```

### 端口映射

| 服务 | 容器端口 | 主机端口 | 访问地址 |
|------|---------|---------|----------|
| 前端 | 80 | 80 | http://localhost |
| 后端 | 3000 | 3000 | http://localhost:3000/api |
| MySQL | 3306 | 3306 | localhost:3306 |

### 环境变量

在 `.env` 文件中配置：

```bash
# MySQL配置
MYSQL_ROOT_PASSWORD=root_password    # root密码
DB_NAME=bimpms                       # 数据库名
DB_USER=bimpms_user                  # 数据库用户
DB_PASSWORD=bimpms_password          # 数据库密码

# JWT配置
JWT_SECRET=your-secret-key           # JWT密钥
JWT_EXPIRES_IN=7d                    # JWT过期时间

# 前端配置
VITE_API_BASE_URL=http://localhost:3000/api  # 后端API地址
```

---

## 高级配置

### 1. 修改端口

如果默认端口被占用，可以在 `docker-compose.yml` 中修改：

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # 将前端改为8080端口

  backend:
    ports:
      - "4000:3000"  # 将后端改为4000端口

  mysql:
    ports:
      - "3307:3306"  # 将MySQL改为3307端口
```

修改后需要：
```bash
docker-compose down
docker-compose up -d
```

### 2. 持久化数据存储

数据默认存储在Docker卷中：
```bash
# 查看卷
docker volume ls

# 备份卷
docker run --rm -v bimpms_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql-backup.tar.gz /data

# 恢复卷
docker run --rm -v bimpms_mysql_data:/data -v $(pwd):/backup alpine tar xzf /backup/mysql-backup.tar.gz -C /
```

### 3. 自定义域名

修改 `frontend/nginx.conf`：
```nginx
server_name your-domain.com;
```

### 4. 启用HTTPS

使用Let's Encrypt免费证书：

1. 安装certbot：
```bash
sudo apt install certbot python3-certbot-nginx
```

2. 获取证书：
```bash
sudo certbot --nginx -d your-domain.com
```

3. 修改Nginx配置，Docker会自动使用证书

---

## 故障排除

### 1. 容器启动失败

```bash
# 查看详细日志
docker-compose logs service-name

# 检查配置文件
docker-compose config

# 验证Docker是否正常运行
docker ps
```

### 2. 数据库连接失败

```bash
# 检查MySQL容器状态
docker-compose ps mysql

# 查看MySQL日志
docker-compose logs mysql

# 等待MySQL完全启动（首次启动需要1-2分钟）
docker-compose logs -f mysql
```

### 3. 前端无法访问后端

检查环境变量配置：
```bash
# 检查.env文件
cat .env

# 确认VITE_API_BASE_URL正确
# 如果使用Docker内部网络，应该是：
VITE_API_BASE_URL=http://backend:3000/api
```

### 4. 端口被占用

```bash
# 查看端口占用
netstat -tuln | grep :80
netstat -tuln | grep :3000

# 或使用lsof
lsof -i :80
lsof -i :3000
```

### 5. 清除所有数据重新开始

```bash
# 停止并删除所有容器、网络、卷
docker-compose down -v

# 重新构建并启动
docker-compose up -d --build
```

---

## 性能优化

### 1. 限制资源使用

在 `docker-compose.yml` 中添加：
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### 2. 使用多阶段构建

前端Dockerfile已经使用了多阶段构建，减小镜像体积。

### 3. 启用Docker BuildKit

```bash
# Linux
export DOCKER_BUILDKIT=1

# Windows/Mac
# 在Docker Desktop设置中启用BuildKit
```

---

## 安全建议

1. **修改默认密码**
   - 修改 `.env` 中的所有密码
   - 修改admin用户登录密码

2. **限制网络访问**
   - 只暴露必要的端口
   - 使用防火墙规则

3. **定期更新**
   - 定期更新Docker镜像
   - 更新应用依赖

4. **备份策略**
   - 定期备份数据库
   - 备份配置文件

5. **日志管理**
   - 配置日志轮转
   - 定期清理旧日志

---

## 生产环境部署

### 使用生产级配置

1. **修改环境变量**
   - 使用强密码
   - 配置JWT密钥

2. **配置反向代理**
   - 使用Nginx或Traefik
   - 启用HTTPS

3. **监控和日志**
   - 使用Docker健康检查
   - 配置日志收集

4. **备份策略**
   - 自动化备份脚本
   - 异地备份

---

## 总结

Docker部署的优势：
- ✅ 一键启动，无需手动配置环境
- ✅ 环境隔离，不影响系统其他服务
- ✅ 易于迁移，在任何支持Docker的机器上都能运行
- ✅ 版本管理，方便回滚和升级

快速开始：
```bash
git clone https://github.com/mms916/BIMPMS.git
cd BIMPMS
cp .env.example .env
# 修改.env中的密码
docker-compose up -d
```

访问 `http://localhost` 开始使用！

祝你部署顺利！
