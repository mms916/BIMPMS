
const mysql = require('mysql2/promise');

const passwords = [
  'root123456', // 用户指定
  'admin123', // 用户提到的
  'root',
  '123456',
  'password',
  'admin',
  '12345678',
  '111111',
  '' // 空密码
];

async function testPasswords() {
  console.log('开始尝试连接数据库...');
  
  for (const password of passwords) {
    try {
      const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: password
      });
      
      console.log(`\n✅ 成功找到密码！密码是: "${password}"`);
      await connection.end();
      process.exit(0);
    } catch (error) {
      if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        process.stdout.write(`❌ 尝试 "${password}" 失败... `);
      } else {
        console.error(`\n⚠️ 连接错误 (非密码问题): ${error.message}`);
      }
    }
  }
  
  console.log('\n\n❌ 所有常见密码都尝试失败。建议重置密码。');
  process.exit(1);
}

testPasswords();
