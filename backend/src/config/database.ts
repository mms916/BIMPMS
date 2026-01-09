import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bim_pms',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
};

// 创建连接池
export const pool = mysql.createPool(dbConfig);

// 确保所有连接都使用 utf8mb4
pool.on('connection', function(connection) {
  connection.query('SET NAMES utf8mb4');
});

// 测试数据库连接
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功！');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败：', error);
    return false;
  }
};

export default pool;
