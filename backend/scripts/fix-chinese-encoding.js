const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixChineseEncoding() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'bim_pms',
    charset: 'utf8mb4',
  });

  try {
    console.log('开始修复中文编码...');

    // 修复管理员账号
    await connection.execute(
      'UPDATE users SET full_name = ? WHERE username = ?',
      ['系统管理员', 'admin']
    );
    console.log('✅ 已修复 admin 用户名');

    // 修复部门负责人
    await connection.execute(
      'UPDATE users SET full_name = ? WHERE username = ?',
      ['张经理', 'dept_manager_xm']
    );
    await connection.execute(
      'UPDATE users SET full_name = ? WHERE username = ?',
      ['李经理', 'dept_manager_js']
    );
    console.log('✅ 已修复部门经理用户名');

    // 修复项目负责人
    await connection.execute(
      'UPDATE users SET full_name = ? WHERE username = ?',
      ['王工', 'project_leader_1']
    );
    await connection.execute(
      'UPDATE users SET full_name = ? WHERE username = ?',
      ['赵工', 'project_leader_2']
    );
    await connection.execute(
      'UPDATE users SET full_name = ? WHERE username = ?',
      ['刘工', 'project_leader_3']
    );
    console.log('✅ 已修复项目负责人用户名');

    // 修复普通员工
    await connection.execute(
      'UPDATE users SET full_name = ? WHERE username = ?',
      ['小陈', 'employee_1']
    );
    await connection.execute(
      'UPDATE users SET full_name = ? WHERE username = ?',
      ['小周', 'employee_2']
    );
    await connection.execute(
      'UPDATE users SET full_name = ? WHERE username = ?',
      ['小吴', 'employee_3']
    );
    await connection.execute(
      'UPDATE users SET full_name = ? WHERE username = ?',
      ['小郑', 'employee_4']
    );
    console.log('✅ 已修复普通员工用户名');

    // 验证修复结果
    const [rows] = await connection.query('SELECT user_id, username, full_name FROM users LIMIT 10');
    console.log('\n修复后的数据：');
    console.table(rows);

    console.log('\n✅ 中文编码修复完成！');
  } catch (error) {
    console.error('❌ 修复失败：', error);
  } finally {
    await connection.end();
  }
}

fixChineseEncoding();
