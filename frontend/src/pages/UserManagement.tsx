import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Input,
  Modal,
  Form,
  message,
  Select,
  Space,
  Tag,
  Popconfirm,
  Tabs,
  Layout,
  Menu,
  Breadcrumb,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  KeyOutlined,
  LogoutOutlined,
  ProjectOutlined,
  ToolOutlined,
  ApartmentOutlined,
  FileTextOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';
import {
  useUsers,
  useDepartments,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useResetPassword,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from '../hooks/useUsers';
import { UserRole } from '../types';

const { Header, Sider, Content } = Layout;

interface User {
  user_id: number;
  username: string;
  full_name: string;
  dept_id: number;
  dept_name?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface Department {
  dept_id: number;
  dept_name: string;
  dept_code: string;
  created_at: string;
  updated_at: string;
}

interface AppUser {
  user_id: number;
  username: string;
  full_name: string;
  role: string;
  dept_id: number;
  dept_name?: string;
}

export default function UserManagement({ user, onLogout }: { user: AppUser; onLogout: () => void }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  // 用户管理状态
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(20);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string | undefined>();
  const [userDeptFilter, setUserDeptFilter] = useState<number | undefined>();
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm] = Form.useForm();

  // 部门管理状态
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm] = Form.useForm();

  // 查询用户和部门
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useUsers({
    page: userPage,
    pageSize: userPageSize,
    search: userSearch,
    role: userRoleFilter,
    dept_id: userDeptFilter,
  });

  const { data: departmentsData } = useDepartments();

  // Mutations
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const resetPassword = useResetPassword();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();

  const users = usersData?.data || [];
  const userPagination = usersData?.pagination;
  const departments = departmentsData?.data || [];

  // 角色标签渲染
  const renderRole = (role: string) => {
    const roleLabels: Record<string, string> = {
      admin: '管理员',
      dept_manager: '部门负责人',
      project_manager: '项目负责人',
      employee: '普通员工',
    };

    const colorMap: Record<string, string> = {
      admin: 'red',
      dept_manager: 'orange',
      project_manager: 'blue',
      employee: 'default',
    };

    return (
      <Tag color={colorMap[role]} style={{ fontWeight: 500 }}>
        {roleLabels[role] || role}
      </Tag>
    );
  };

  // 用户表格列
  const userColumns: ColumnsType<User> = [
    { title: '用户ID', dataIndex: 'user_id', width: 80 },
    { title: '用户名', dataIndex: 'username', width: 120 },
    { title: '姓名', dataIndex: 'full_name', width: 120 },
    { title: '部门', dataIndex: 'dept_name', width: 120 },
    { title: '角色', dataIndex: 'role', width: 120, render: renderRole },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right' as const,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEditUser(record)}>
            编辑
          </Button>
          <Button
            size="small"
            icon={<KeyOutlined />}
            onClick={() => handleResetPassword(record)}
          >
            重置密码
          </Button>
          <Popconfirm
            title="确定要删除该用户吗？"
            onConfirm={() => handleDeleteUser(record.user_id)}
            okText="确定"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 部门表格列
  const deptColumns: ColumnsType<Department> = [
    { title: '部门ID', dataIndex: 'dept_id', width: 100 },
    { title: '部门名称', dataIndex: 'dept_name', width: 200 },
    { title: '部门代码', dataIndex: 'dept_code', width: 150 },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEditDept(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除该部门吗？"
            description="删除前请确保该部门没有关联用户"
            onConfirm={() => handleDeleteDept(record.dept_id)}
            okText="确定"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 用户操作处理
  const handleAddUser = () => {
    setEditingUser(null);
    userForm.resetFields();
    setUserModalOpen(true);
  };

  const handleEditUser = (record: User) => {
    setEditingUser(record);
    userForm.setFieldsValue({
      username: record.username,
      full_name: record.full_name,
      dept_id: record.dept_id,
      role: record.role,
    });
    setUserModalOpen(true);
  };

  const handleUserSubmit = async () => {
    try {
      const values = await userForm.validateFields();

      if (editingUser) {
        // 更新用户
        await updateUser.mutateAsync({
          id: editingUser.user_id,
          data: {
            full_name: values.full_name,
            dept_id: values.dept_id,
            role: values.role,
          },
        });
        message.success('用户更新成功');
      } else {
        // 创建用户
        await createUser.mutateAsync({
          username: values.username,
          full_name: values.full_name,
          dept_id: values.dept_id,
          role: values.role,
        });
        message.success('用户创建成功，默认密码为 123');
      }

      setUserModalOpen(false);
      userForm.resetFields();
      refetchUsers();
    } catch (error) {
      console.error('操作失败：', error);
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      await deleteUser.mutateAsync(id);
      message.success('用户删除成功');
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleResetPassword = async (record: User) => {
    try {
      await resetPassword.mutateAsync(record.user_id);
      message.success('密码重置成功，新密码为 123');
    } catch (error: any) {
      message.error(error.response?.data?.message || '重置失败');
    }
  };

  // 部门操作处理
  const handleAddDept = () => {
    setEditingDept(null);
    deptForm.resetFields();
    setDeptModalOpen(true);
  };

  const handleEditDept = (record: Department) => {
    setEditingDept(record);
    deptForm.setFieldsValue({
      dept_name: record.dept_name,
      dept_code: record.dept_code,
    });
    setDeptModalOpen(true);
  };

  const handleDeptSubmit = async () => {
    try {
      const values = await deptForm.validateFields();

      if (editingDept) {
        // 更新部门
        await updateDepartment.mutateAsync({
          id: editingDept.dept_id,
          data: {
            dept_name: values.dept_name,
            dept_code: values.dept_code,
          },
        });
        message.success('部门更新成功');
      } else {
        // 创建部门
        await createDepartment.mutateAsync({
          dept_name: values.dept_name,
          dept_code: values.dept_code,
        });
        message.success('部门创建成功');
      }

      setDeptModalOpen(false);
      deptForm.resetFields();
    } catch (error) {
      console.error('操作失败：', error);
    }
  };

  const handleDeleteDept = async (id: number) => {
    try {
      await deleteDepartment.mutateAsync(id);
      message.success('部门删除成功');
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  // Tab内容
  const userTabContent = (
    <div>
      <Card style={{ marginBottom: '16px' }}>
        <Space wrap>
          <Input
            placeholder="搜索用户名、姓名..."
            prefix={<SearchOutlined />}
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            allowClear
            style={{ width: 250 }}
          />
          <Select
            placeholder="筛选角色"
            value={userRoleFilter}
            onChange={setUserRoleFilter}
            allowClear
            style={{ width: 150 }}
          >
            <Select.Option value="admin">管理员</Select.Option>
            <Select.Option value="dept_manager">部门负责人</Select.Option>
            <Select.Option value="project_manager">项目负责人</Select.Option>
            <Select.Option value="employee">普通员工</Select.Option>
          </Select>
          <Select
            placeholder="筛选部门"
            value={userDeptFilter}
            onChange={setUserDeptFilter}
            allowClear
            style={{ width: 150 }}
          >
            {departments.map((dept: Department) => (
              <Select.Option key={dept.dept_id} value={dept.dept_id}>
                {dept.dept_name}
              </Select.Option>
            ))}
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddUser}>
            新增用户
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          columns={userColumns}
          dataSource={users}
          rowKey="user_id"
          loading={usersLoading}
          pagination={{
            current: userPage,
            pageSize: userPageSize,
            total: userPagination?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setUserPage(page);
              setUserPageSize(pageSize || 20);
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );

  const deptTabContent = (
    <div>
      <Card style={{ marginBottom: '16px' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddDept}>
          新增部门
        </Button>
      </Card>

      <Card>
        <Table
          columns={deptColumns}
          dataSource={departments}
          rowKey="dept_id"
          pagination={false}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );

  const tabItems = [
    {
      key: 'users',
      label: '用户管理',
      children: userTabContent,
    },
    {
      key: 'departments',
      label: '部门管理',
      children: deptTabContent,
    },
  ];

  // 侧导航菜单
  const menuItems: MenuProps['items'] = [
    {
      key: 'project-ledger',
      icon: <ProjectOutlined />,
      label: <Link to="/">项目台账管理</Link>,
    },
    {
      key: 'workbench',
      icon: <ApartmentOutlined />,
      label: '工作台',
    },
    {
      key: 'work-breakdown',
      icon: <FileTextOutlined />,
      label: '工作分解',
    },
    {
      key: 'weekly-report',
      icon: <ScheduleOutlined />,
      label: '周报管理',
    },
    {
      key: 'system',
      icon: <ToolOutlined />,
      label: <Link to="/system">系统设置</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      {/* 侧导航栏 */}
      <Sider
        width={240}
        style={{ background: '#001529' }}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
      >
        <div style={{
          padding: '24px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <ProjectOutlined style={{ fontSize: '24px', color: '#fff' }} />
          {!collapsed && <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '16px' }}>BIM项目管理系统</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={['system']}
          items={menuItems}
        />
      </Sider>

      <Layout>
        {/* 顶部导航栏 */}
        <Header style={{
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Breadcrumb>
            <Breadcrumb.Item>首页</Breadcrumb.Item>
            <Breadcrumb.Item>系统管理</Breadcrumb.Item>
            <Breadcrumb.Item>系统设置</Breadcrumb.Item>
          </Breadcrumb>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span>欢迎, {user.full_name}</span>
            <Button icon={<LogoutOutlined />} onClick={onLogout}>退出登录</Button>
          </div>
        </Header>

        {/* 内容区域 */}
        <Content style={{ padding: '24px', background: '#f0f2f5' }}>
          <h2 style={{ marginBottom: '24px' }}>系统设置</h2>

      <Tabs defaultActiveKey="users" items={tabItems} />

      {/* 用户表单弹窗 */}
      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={userModalOpen}
        onOk={handleUserSubmit}
        onCancel={() => {
          setUserModalOpen(false);
          userForm.resetFields();
        }}
        width={600}
        destroyOnClose
      >
        <Form
          form={userForm}
          layout="vertical"
          initialValues={{ role: 'employee' }}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 50, message: '用户名最多50个字符' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' },
            ]}
          >
            <Input
              placeholder="请输入用户名"
              disabled={!!editingUser}
            />
          </Form.Item>

          <Form.Item
            label="姓名"
            name="full_name"
            rules={[
              { required: true, message: '请输入姓名' },
              { min: 2, message: '姓名至少2个字符' },
              { max: 50, message: '姓名最多50个字符' },
            ]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            label="部门"
            name="dept_id"
            rules={[{ required: true, message: '请选择部门' }]}
          >
            <Select placeholder="请选择部门">
              {departments.map((dept: Department) => (
                <Select.Option key={dept.dept_id} value={dept.dept_id}>
                  {dept.dept_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="角色"
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Select.Option value="admin">管理员</Select.Option>
              <Select.Option value="dept_manager">部门负责人</Select.Option>
              <Select.Option value="project_manager">项目负责人</Select.Option>
              <Select.Option value="employee">普通员工</Select.Option>
            </Select>
          </Form.Item>

          {!editingUser && (
            <div style={{ color: '#999', fontSize: '12px' }}>
              默认密码为：123，用户首次登录后可自行修改
            </div>
          )}
        </Form>
      </Modal>

      {/* 部门表单弹窗 */}
      <Modal
        title={editingDept ? '编辑部门' : '新增部门'}
        open={deptModalOpen}
        onOk={handleDeptSubmit}
        onCancel={() => {
          setDeptModalOpen(false);
          deptForm.resetFields();
        }}
        width={500}
        destroyOnClose
      >
        <Form form={deptForm} layout="vertical">
          <Form.Item
            label="部门名称"
            name="dept_name"
            rules={[
              { required: true, message: '请输入部门名称' },
              { min: 2, message: '部门名称至少2个字符' },
              { max: 50, message: '部门名称最多50个字符' },
            ]}
          >
            <Input placeholder="请输入部门名称" />
          </Form.Item>

          <Form.Item
            label="部门代码"
            name="dept_code"
            rules={[
              { required: true, message: '请输入部门代码' },
              { min: 2, message: '部门代码至少2个字符' },
              { max: 10, message: '部门代码最多10个字符' },
              { pattern: /^[a-zA-Z0-9]+$/, message: '部门代码只能包含字母和数字' },
            ]}
          >
            <Input placeholder="请输入部门代码（如：IT）" />
          </Form.Item>
        </Form>
      </Modal>
        </Content>
      </Layout>
    </Layout>
  );
}
