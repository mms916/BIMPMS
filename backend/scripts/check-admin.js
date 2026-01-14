const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

async function checkAdmin() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bim_pms'
  });

  try {
    const [users] = await connection.query('SELECT user_id, username, password FROM users WHERE username = ?', ['admin']);
    console.log('Admin users found:');
    console.table(users);
  } finally {
    await connection.end();
  }
}

checkAdmin();
