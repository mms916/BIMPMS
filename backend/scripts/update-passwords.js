const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function updatePasswords() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root123456',
    database: 'bim_pms',
  });

  try {
    console.log('✅ 已连接到数据库');

    // 生成密码哈希
    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);

    console.log('生成的密码哈希：', hash);

    // 更新所有用户密码
    await connection.query(
      'UPDATE users SET password = ?',
      [hash]
    );

    console.log('✅ 所有用户密码已更新为：password123');
    console.log('\n测试账号：');
    console.log('- 用户名：admin，密码：password123（管理员）');
    console.log('- 用户名：dept_manager_xm，密码：password123（部门负责人）');
  } catch (error) {
    console.error('❌ 更新密码失败：', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

updatePasswords();
