const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

async function resetAdmin() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bim_pms'
  });

  try {
    const password = await bcrypt.hash('123', 10);
    await connection.query(
      'UPDATE users SET password = ? WHERE username = ?',
      [password, 'admin']
    );
    console.log('✅ 管理员密码已重置为: 123');
    console.log('现在可以使用 admin/123 登录系统');
  } finally {
    await connection.end();
  }
}

resetAdmin();
