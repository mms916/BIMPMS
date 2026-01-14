const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

async function checkTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bim_pms',
    multipleStatements: true
  });

  try {
    console.log('数据库:', process.env.DB_NAME || 'bim_pms');
    console.log('\n检查 departments 表结构...\n');

    const [columns] = await connection.query('DESCRIBE departments');
    console.log('当前 departments 表结构：');
    console.table(columns);

    console.log('\n检查是否存在 parent_id 字段...');
    const hasParentId = columns.some(col => col.Field === 'parent_id');
    console.log('parent_id 字段存在:', hasParentId ? '✅ 是' : '❌ 否');

  } finally {
    await connection.end();
  }
}

checkTable().catch(console.error);
