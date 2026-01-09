import { useState } from 'react';

interface User {
  user_id: number;
  username: string;
  full_name: string;
  role: string;
  dept_id: number;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  if (!user) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          width: '400px'
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>BIM项目管理系统</h2>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>用户名</label>
            <input
              type="text"
              defaultValue="admin"
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>密码</label>
            <input
              type="password"
              defaultValue="password123"
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <button
            onClick={() => {
              setUser({
                user_id: 1,
                username: 'admin',
                full_name: '系统管理员',
                role: 'admin',
                dept_id: 1
              });
            }}
            style={{
              width: '100%',
              padding: '12px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>欢迎, {user.full_name}!</h1>
      <p>您已成功登录系统</p>
      <button onClick={() => setUser(null)}>退出登录</button>
    </div>
  );
}
