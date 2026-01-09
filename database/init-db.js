const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root123456',
    multipleStatements: true,
  });

  try {
    console.log('✅ 已连接到MySQL服务器');

    // 读取SQL文件
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, '01-init-schema.sql'),
      'utf8'
    );
    const seedSQL = fs.readFileSync(
      path.join(__dirname, '02-seed-data.sql'),
      'utf8'
    );

    console.log('\n========================================');
    console.log('步骤 1/2: 创建数据库和表结构');
    console.log('========================================');

    await connection.query(schemaSQL);
    console.log('✅ 数据库表结构创建成功');

    console.log('\n========================================');
    console.log('步骤 2/2: 插入种子数据');
    console.log('========================================');

    await connection.query(seedSQL);
    console.log('✅ 种子数据插入成功');

    console.log('\n========================================');
    console.log('🎉 数据库初始化完成！');
    console.log('========================================');
    console.log('\n数据库信息：');
    console.log('- 数据库名称：bim_pms');
    console.log('- 已创建表：users, departments, projects, user_preferences');
    console.log('- 已插入种子数据：');
    console.log('  - 5个部门');
    console.log('  - 10个用户');
    console.log('  - 10个示例项目');
    console.log('\n测试账号：');
    console.log('- 用户名：admin，密码：password123（管理员）');
    console.log('- 用户名：dept_manager_xm，密码：password123（部门负责人）');
  } catch (error) {
    console.error('❌ 数据库初始化失败：', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

initDatabase();
