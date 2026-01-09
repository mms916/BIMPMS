import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import userRoutes from './routes/users';
import departmentRoutes from './routes/departments';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// 健康检查（放在路由之前）
app.get('/health', (req, res) => {
  console.log('健康检查被调用');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 路由
console.log('注册路由...');
app.use('/api/auth', authRoutes);
console.log('auth routes 已注册');
app.use('/api/projects', projectRoutes);
console.log('project routes 已注册');
app.use('/api/users', userRoutes);
console.log('user routes 已注册');
app.use('/api/departments', departmentRoutes);
console.log('department routes 已注册');

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
  });
});

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误：', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
});

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    await testConnection();

    app.listen(PORT, () => {
      console.log(`🚀 服务器启动成功！`);
      console.log(`📍 地址: http://localhost:${PORT}`);
      console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
      console.log(`📚 环境: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ 启动服务器失败：', error);
    process.exit(1);
  }
};

startServer();
