import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Button, Card, Form, Input, message, Space } from 'antd';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

interface User {
  user_id: number;
  username: string;
  full_name: string;
  role: string;
  dept_id: number;
}

function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      onLogin({
        user_id: 1,
        username: 'admin',
        full_name: '系统管理员',
        role: 'admin',
        dept_id: 1
      });
      message.success('登录成功！');
      setLoading(false);
    }, 500);
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card title="BIM项目管理系统" style={{ width: 400 }}>
        <Form layout="vertical">
          <Form.Item label="用户名">
            <Input defaultValue="admin" placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item label="密码">
            <Input.Password defaultValue="password123" placeholder="请输入密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" block loading={loading} onClick={handleLogin}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <div style={{ padding: '20px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <h1>欢迎, {user.full_name}!</h1>
          <p>✅ React Router 工作正常</p>
          <p>✅ Ant Design 工作正常</p>
        </Card>
        <Button onClick={onLogout}>退出登录</Button>
      </Space>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={setUser} />} />
          <Route
            path="/"
            element={
              user ? <Dashboard user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" replace />
            }
          />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}
