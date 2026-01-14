
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsers() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'bim_pms'
    });

    console.log('✅ 连接数据库成功');

    const [rows] = await connection.execute('SELECT id, username, role, created_at FROM users');
    
    if (rows.length === 0) {
      console.log('⚠️ users 表为空');
    } else {
      console.log('📋 现有用户列表:');
      console.table(rows);
    }

    await connection.end();
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  }
}

checkUsers();
