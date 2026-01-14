const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from backend directory
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bim_pms',
    multipleStatements: true
  });

  try {
    console.log('📦 开始执行部门树形结构迁移...\n');

    // Check if parent_id column already exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'departments' AND COLUMN_NAME = 'parent_id'
    `, [process.env.DB_NAME || 'bim_pms']);

    if (columns.length > 0) {
      console.log('⚠️  parent_id 字段已存在，跳过迁移\n');
      process.exit(0);
    }

    // Execute migration
    await connection.query(`
      ALTER TABLE departments
      ADD COLUMN parent_id INT DEFAULT NULL COMMENT '父部门ID' AFTER dept_code,
      ADD INDEX idx_parent_id (parent_id)
    `);
    console.log('✅ 已添加 parent_id 字段和索引');

    await connection.query(`
      ALTER TABLE departments
      ADD CONSTRAINT fk_dept_parent
      FOREIGN KEY (parent_id) REFERENCES departments(dept_id)
      ON DELETE SET NULL
      ON UPDATE CASCADE
    `);
    console.log('✅ 已添加外键约束 fk_dept_parent');

    console.log('\n✨ 部门树形结构迁移完成！\n');

    // Verify the migration
    const [result] = await connection.query('DESCRIBE departments');
    console.log('📋 当前 departments 表结构：');
    console.table(result);

  } catch (error) {
    console.error('❌ 迁移失败：', error.message);
    if (error.code === 'ER_DUP_KEYNAME') {
      console.log('⚠️  提示：外键约束已存在，请手动检查');
    }
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();
