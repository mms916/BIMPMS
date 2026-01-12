# 阿里云Docker部署指南

本文档介绍如何将BIM项目管理系统部署到阿里云的ECS服务器上。

## 📋 部署前准备

### 1. 阿里云资源准备

#### 需要的云资源
- **ECS服务器**：推荐配置
  - CPU：2核及以上
  - 内存：4GB及以上
  - 操作系统：Ubuntu 20.04 / Ubuntu 22.04 / CentOS 7+
  - 带宽：按需选择（建议5Mbps以上）

- **安全组规则**：需要在阿里云控制台配置
  - 入方向 TCP 80（HTTP）
  - 入方向 TCP 443（HTTPS，可选）
  - 入方向 TCP 22（SSH，用于管理）
  - 入方向 TCP 3000（可选，直接访问后端API）

### 2. 本地准备

#### 确保项目代码已提交到GitHub
```bash
cd "d:\project\BIM PMS"
git status
git add .
git commit -m "feat: 准备阿里云部署"
git push origin main
```

---

## 🚀 部署步骤

### 方案一：直接部署到阿里云ECS（推荐）

#### 第一步：连接到阿里云ECS服务器

```bash
# 使用SSH连接（替换为你的服务器IP）
ssh root@your-ecs-ip

# 或者使用密钥
ssh -i /path/to/your-key.pem root@your-ecs-ip
```

#### 第二步：安装Docker和Docker Compose

**Ubuntu/Debian系统**：
```bash
# 更新软件包索引
sudo apt update

# 安装依赖
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# 添加Docker官方GPG密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

# 设置Docker稳定版仓库
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# 安装Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
docker-compose --version
```

**CentOS/RHEL系统**：
```bash
# 安装Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io

# 启动Docker
sudo systemctl start docker
sudo systemctl enable docker

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 第三步：克隆项目代码

```bash
# 安装Git（如果没有）
sudo apt install -y git  # Ubuntu/Debian
# sudo yum install -y git  # CentOS/RHEL

# 克隆项目
git clone https://github.com/mms916/BIMPMS.git
cd BIMPMS
```

#### 第四步：配置环境变量

```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑环境变量（修改密码等）
nano .env
```

**重要配置项**：
```bash
# MySQL配置（建议修改密码）
MYSQL_ROOT_PASSWORD=your_strong_root_password_here
DB_PASSWORD=your_strong_db_password_here

# JWT配置（必须修改为随机字符串）
JWT_SECRET=your_very_long_random_secret_key_here_change_it
```

#### 第五步：启动服务

```bash
# 构建并启动所有服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 第六步：验证部署

```bash
# 检查容器状态
docker-compose ps

# 测试后端API
curl http://localhost/api

# 测试登录
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123"}'
```

#### 第七步：配置防火墙（如果需要）

**Ubuntu (UFW)**：
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

**CentOS (Firewalld)**：
```bash
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --reload
```

**阿里云安全组配置**：
1. 登录阿里云控制台
2. 进入ECS实例 → 安全组
3. 添加入方向规则：
   - 端口：80，协议：TCP，授权对象：0.0.0.0/0
   - 端口：443，协议：TCP，授权对象：0.0.0.0/0（可选）
   - 端口：22，协议：TCP，授权对象：你的IP（建议限制）

---

### 方案二：使用阿里云容器服务（ACK）

如果你使用阿里云容器服务Kubernetes版（ACK），可以部署到K8s集群。

#### 第一步：准备Kubernetes配置文件

创建 `k8s/` 目录并添加以下配置：

**namespace.yaml**：
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: bimpms
```

**mysql-deployment.yaml**：
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql
  namespace: bimpms
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        env:
        - name: MYSQL_ROOT_PASSWORD
          value: "your_password"
        - name: MYSQL_DATABASE
          value: "bimpms"
        - name: MYSQL_USER
          value: "bimpms_user"
        - name: MYSQL_PASSWORD
          value: "your_password"
        ports:
        - containerPort: 3306
        volumeMounts:
        - name: mysql-storage
          mountPath: /var/lib/mysql
      volumes:
      - name: mysql-storage
        persistentVolumeClaim:
          claimName: mysql-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: mysql
  namespace: bimpms
spec:
  selector:
    app: mysql
  ports:
  - port: 3306
  clusterIP: None
```

**backend-deployment.yaml**：
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: bimpms
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: your-registry/bimpms-backend:latest
        env:
        - name: DB_HOST
          value: "mysql"
        - name: DB_PORT
          value: "3300"
        - name: DB_NAME
          value: "bimpms"
        - name: DB_USER
          value: "bimpms_user"
        - name: DB_PASSWORD
          value: "your_password"
        - name: NODE_ENV
          value: "production"
        - name: JWT_SECRET
          value: "your_jwt_secret"
        ports:
        - containerPort: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: bimpms
spec:
  selector:
    app: backend
  ports:
  - port: 3000
    targetPort: 3000
```

**frontend-deployment.yaml**：
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: bimpms
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: your-registry/bimpms-frontend:latest
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: bimpms
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

#### 第二步：部署到K8s

```bash
# 创建命名空间
kubectl apply -f k8s/namespace.yaml

# 部署MySQL
kubectl apply -f k8s/mysql-deployment.yaml

# 部署后端
kubectl apply -f k8s/backend-deployment.yaml

# 部署前端
kubectl apply -f k8s/frontend-deployment.yaml

# 查看部署状态
kubectl get pods -n bimpms
kubectl get svc -n bimpms
```

---

## 🌐 访问系统

部署完成后，通过以下地址访问：

```
http://your-ecs-ip-address
```

或如果你配置了域名：

```
http://your-domain.com
```

**默认登录账号**：
- 用户名：`admin`
- 密码：`123`

---

## 🔧 常用管理命令

### 查看服务状态
```bash
docker-compose ps
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### 重启服务
```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart backend
docker-compose restart frontend
```

### 停止服务
```bash
docker-compose down
```

### 启动服务
```bash
docker-compose up -d
```

### 更新代码
```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build
```

---

## 🔐 安全配置建议

### 1. 修改默认密码

首次登录后，立即修改admin密码。

### 2. 配置HTTPS（推荐）

使用Let's Encrypt免费证书：

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 3. 配置防火墙

只开放必要的端口，并限制来源IP。

### 4. 定期备份

设置自动备份脚本：

```bash
# 创建备份脚本
cat > /root/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec bimpms-mysql mysqldump -u root -pyour_password bimpms > /backup/bimpms_$DATE.sql
find /backup -name "bimpms_*.sql" -mtime +7 -delete
EOF

chmod +x /root/backup.sh

# 添加到crontab（每天凌晨2点自动备份）
crontab -e
# 添加：0 2 * * * /root/backup.sh
```

### 5. 监控和日志

配置日志轮转：

```bash
# 配置Docker日志大小限制
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

sudo systemctl restart docker
```

---

## 📊 性能优化

### 1. 数据库优化

MySQL配置优化（根据实际内存调整）：

```yaml
# 在docker-compose.yml中添加
mysql:
  command:
    - --character-set-server=utf8mb4
    - --collation-server=utf8mb4_unicode_ci
    - --max-connections=200
    - --innodb_buffer_pool_size=256M
```

### 2. Nginx缓存优化

已在 `frontend/nginx.conf` 中配置静态资源缓存。

### 3. 启用Gzip压缩

已在 `frontend/nginx.conf` 中配置Gzip压缩。

---

## 🐛 故障排除

### 问题1：容器启动失败

```bash
# 查看详细日志
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql

# 检查端口占用
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3000
```

### 问题2：无法访问网站

1. 检查安全组规则
2. 检查防火墙设置
3. 检查容器状态：`docker-compose ps`
4. 查看Nginx日志：`docker-compose logs frontend`

### 问题3：数据库连接失败

```bash
# 检查MySQL容器
docker-compose logs mysql

# 进入MySQL容器测试
docker exec -it bimpms-mysql mysql -u root -p

# 检查数据库初始化
docker exec bimpms-mysql mysql -u root -p -e "SHOW DATABASES;"
```

### 问题4：数据持久化丢失

数据存储在Docker卷中，删除容器不会丢失数据。

但如果需要迁移数据：

```bash
# 导出数据
docker exec bimpms-mysql mysqldump -u root -pyour_password bimpms > backup.sql

# 导入数据
cat backup.sql | docker exec -i bimpms-mysql mysql -u root -pyour_password bimpms
```

---

## 📈 成本预估

### 阿里云ECS成本（按量付费）

| 配置 | 价格 | 说明 |
|------|------|------|
| 2核4GB | 约¥200-300/月 | 适合小型团队 |
| 2核8GB | 约¥400-500/月 | 适合中型团队 |
| 4核16GB | 约¥800-1000/月 | 适合大型团队 |

### 带宽成本

| 带宽 | 价格 | 说明 |
|------|------|------|
| 1Mbps | 约¥23/月 | 10人以下 |
| 5Mbps | 约¥115/月 | 50人以下 |
| 10Mbps | 约¥230/月 | 100人以下 |

**省钱技巧**：
- 使用按量付费，不使用时可以停止ECS
- 使用抢占式实例（便宜70-90%）
- 使用包年包月优惠

---

## 🎯 部署检查清单

部署前：
- [ ] 已购买阿里云ECS服务器
- [ ] 已配置安全组规则（80、443、22端口）
- [ ] 已将代码推送到GitHub
- [ ] 已准备环境变量配置

部署中：
- [ ] 已安装Docker和Docker Compose
- [ ] 已克隆项目代码
- [ ] 已修改.env中的敏感信息
- [ ] 已启动所有容器
- [ ] 所有容器状态为UP（healthy）

部署后：
- [ ] 能够通过IP地址访问网站
- [ ] 能够使用admin/123登录
- [ ] 中文显示正常
- [ ] 数据库连接正常
- [ ] 已配置自动备份

---

## 📞 技术支持

如有问题，请检查：
1. 阿里云控制台的ECS实例状态
2. 安全组规则是否正确配置
3. ECS实例的系统日志
4. Docker容器日志

---

**部署文档版本**：V1.0
**最后更新**：2026-01-12
**适用环境**：阿里云ECS + Docker + Ubuntu 20.04/22.04
