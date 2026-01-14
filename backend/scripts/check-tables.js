const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

async function checkTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bim_pms'
  });

  try {
    const [tables] = await connection.query('SHOW TABLES');
    console.log('数据库中的表：');
    tables.forEach(t => console.log('  -', Object.values(t)[0]));

    // 检查 project_participants 表是否存在
    const [check] = await connection.query(
      "SHOW TABLES LIKE 'project_participants'"
    );
    console.log('\nproject_participants 表存在:', check.length > 0 ? '是' : '否');
  } finally {
    await connection.end();
  }
}

checkTables().catch(console.error);
