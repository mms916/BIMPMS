# 后端Dockerfile
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制所有项目文件（包括tsconfig.json）
COPY . .

# 安装所有依赖（包括devDependencies，用于构建）
RUN npm ci

# 构建TypeScript
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动服务
CMD ["npm", "start"]
