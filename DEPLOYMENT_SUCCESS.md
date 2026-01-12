# BIM项目管理系统 - Docker部署完成

## ✅ 部署状态

所有服务已成功部署并运行：

| 服务 | 状态 | 端口 | 访问地址 |
|------|------|------|----------|
| MySQL数据库 | ✅ 运行中 | 3306（内部） | - |
| 后端API | ✅ 运行中 | 3000 | http://localhost:3000/api |
| 前端Web | ✅ 运行中 | 80 | http://localhost |

## 🌐 访问地址

### 本机访问
```
http://localhost
```

### 内网其他主机访问
```
http://192.168.128.1
或
http://172.29.150.138
```

### 🔐 默认账号
```
用户名：admin
密码：123
```

## 📊 Docker管理命令

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

### 重新构建并启动
```bash
docker-compose up -d --build
```

## 🔧 系统配置

### 环境变量
配置文件：`.env`
```bash
# MySQL配置
MYSQL_ROOT_PASSWORD=root_password_change_this
DB_NAME=bimpms
DB_USER=bimpms_user
DB_PASSWORD=bimpms_password_change_this

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# 前端API地址
VITE_API_BASE_URL=http://localhost:3000/api
```

### 端口映射
- 前端：80 → 主机80
- 后端：3000 → 主机3000
- MySQL：3306（仅Docker内部网络）

## 📁 重要文件

### Docker配置
- `docker-compose.yml` - Docker Compose配置
- `backend/Dockerfile` - 后端镜像构建配置
- `frontend/Dockerfile` - 前端镜像构建配置
- `frontend/nginx.conf` - Nginx配置（已配置支持外网访问）

### 数据库
- `database/01-init-schema.sql` - 数据库表结构
- `database/02-seed-data.sql` - 种子数据

### 数据持久化
- MySQL数据存储在Docker卷 `mysql_data` 中
- 即使删除容器，数据也会保留

## 🛠️ 故障排除

### 前端无法访问
1. 检查容器状态：`docker-compose ps`
2. 检查前端日志：`docker-compose logs frontend`
3. 确认端口80未被占用

### 后端API无响应
1. 检查容器状态：`docker-compose ps`
2. 检查后端日志：`docker-compose logs backend`
3. 确认MySQL正在运行

### 数据库连接失败
1. 检查MySQL容器：`docker-compose logs mysql`
2. 等待MySQL健康检查完成（最多30秒）
3. 重新初始化数据库

### 无法从内网其他主机访问
1. 确认Windows防火墙允许80和3000端口
2. 检查网络连接
3. 使用正确的IP地址（192.168.128.1 或 172.29.150.138）

## 🔐 安全建议

1. **修改默认密码**：及时修改admin用户密码
2. **配置防火墙**：只允许内网IP访问
3. **定期备份**：使用 `docker exec` 导出数据库
4. **更新密钥**：修改 `.env` 中的 `JWT_SECRET`

## 📈 性能优化

1. **增加资源**：如果性能不足，可在docker-compose.yml中增加资源限制
2. **启用缓存**：Nginx已配置静态资源缓存
3. **数据库优化**：根据实际使用情况调整MySQL配置

## 🎯 下一步

1. **测试功能**：完整测试所有CRUD功能
2. **导入数据**：导入实际项目数据
3. **配置备份**：设置自动备份任务
4. **监控日志**：配置日志监控和告警

---

**部署日期**：2026-01-09
**部署方式**：Docker Compose
**系统版本**：V1.0 MVP
