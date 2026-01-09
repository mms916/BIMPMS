import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme, Card, Table, Button, Input, Modal, Form, message, Select, Space, Tag, Progress, Popconfirm, Dropdown, Checkbox, DatePicker, InputNumber, Layout, Menu, Avatar, Breadcrumb, AutoComplete, Statistic } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import {
  LogoutOutlined, PlusOutlined, SearchOutlined, EyeOutlined,
  EditOutlined, DeleteOutlined, SettingOutlined, ReloadOutlined,
  UserOutlined, ProjectOutlined, ApartmentOutlined,
  FileTextOutlined, ScheduleOutlined, ToolOutlined, BarsOutlined,
  BellOutlined, CustomerServiceOutlined
} from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';
import type { MenuProps } from 'antd';
import './App.css';
import UserManagement from './pages/UserManagement';

dayjs.locale('zh-cn');

// 创建 QueryClient 实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const { Header, Sider, Content } = Layout;
const { TextArea } = Input;

// API服务
const API_BASE = 'http://localhost:3000/api';

// 类型定义
interface Project {
  project_id: number;
  contract_no: string;
  contract_name: string;
  start_date: string;
  end_date: string;
  contract_amount: string;
  progress: number;
  leader_id: number;
  leader_name: string;
  settlement_status: string;
  participants: number[];
  is_signed: string;
  payment_amount: string;
  dept_id: number;
  dept_name: string;
  project_type: string;
  remark?: string;
  is_overdue: number;
}

interface User {
  user_id: number;
  username: string;
  full_name: string;
  role: string;
  dept_id: number;
  dept_name?: string;
}

interface Stats {
  totalProjects: number;
  overdueProjects: number | string;
  totalAmount: number | string;
  settledProjects: number | string;
  settledRatio: number;
  avgProgress: number;
}

// 登录组件
function Login({ onLogin }: { onLogin: (user: User, token: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (data.success && data.data) {
        onLogin(data.data.user, data.data.token);
        message.success('登录成功！');
      } else {
        message.error('用户名或密码错误');
      }
    } catch (error) {
      message.error('登录失败，请检查后端服务');
    } finally {
      setLoading(false);
    }
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
            <Input
              placeholder="请输入用户名"
              value={username}
              onChange={e => setUsername(e.target.value)}
              prefix={<UserOutlined />}
            />
          </Form.Item>
          <Form.Item label="密码">
            <Input.Password
              placeholder="请输入密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" block onClick={handleLogin} loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
        <p style={{ fontSize: '12px', color: '#666', marginTop: 16 }}>
          测试账号：admin / password123
        </p>
      </Card>
    </div>
  );
}

// 项目台账组件
function ProjectLedger({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [projectType, setProjectType] = useState<string | undefined>();
  const [settlementStatus, setSettlementStatus] = useState<string | undefined>();
  const [isOverdue, setIsOverdue] = useState<boolean | undefined>();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [contractNo, setContractNo] = useState('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [form] = Form.useForm();

  // 从 localStorage 读取列设置，如果没有则使用默认值
  const getInitialVisibleColumns = (): string[] => {
    const saved = localStorage.getItem('visibleColumns');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [
          'contract_no', 'contract_name', 'dates', 'contract_amount', 'progress',
          'leader_name', 'settlement_status', 'is_signed', 'payment_amount', 'action'
        ];
      }
    }
    return [
      'contract_no', 'contract_name', 'dates', 'contract_amount', 'progress',
      'leader_name', 'settlement_status', 'is_signed', 'payment_amount', 'action'
    ];
  };

  const [visibleColumns, setVisibleColumns] = useState<string[]>(getInitialVisibleColumns);
  const [tempVisibleColumns, setTempVisibleColumns] = useState<string[]>(getInitialVisibleColumns);
  const [columnSettingsOpen, setColumnSettingsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const token = localStorage.getItem('token') || '';
  const isAdmin = user.role === 'admin';

  // 获取项目列表
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.current.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(searchText && { search: searchText }),
        ...(projectType && { projectType }),
        ...(settlementStatus && { settlementStatus }),
        ...(isOverdue !== undefined && { isOverdue: isOverdue.toString() }),
      });

      const response = await fetch(`${API_BASE}/projects?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success && data.data) {
        setProjects(data.data.data || []);
        setPagination(prev => ({ ...prev, total: data.data.pagination.total }));
      }
    } catch (error) {
      message.error('获取项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取统计数据（支持筛选参数）
  const fetchStats = async () => {
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      if (projectType) params.append('projectType', projectType);
      if (settlementStatus) params.append('settlementStatus', settlementStatus);
      if (isOverdue !== undefined) params.append('isOverdue', isOverdue.toString());
      if (searchText) params.append('search', searchText);

      // 将查询参数传递给后端
      const response = await fetch(`${API_BASE}/projects/stats?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('获取统计数据失败', error);
    }
  };

  // 获取用户列表（用于选择项目负责人）
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/users`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setAvailableUsers(data.data);
      }
    } catch (error) {
      console.error('获取用户列表失败', error);
    }
  };

  // 生成合同编号
  const generateContractNo = async () => {
    try {
      const response = await fetch(`${API_BASE}/projects/contract/generate-no`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setContractNo(data.data.contract_no);
        form.setFieldsValue({ contract_no: data.data.contract_no });
      }
    } catch (error) {
      message.error('生成合同编号失败');
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchStats();
    fetchUsers();
  }, [pagination.current, pagination.pageSize, searchText, projectType, settlementStatus, isOverdue]);

  // 打开新增弹窗
  const handleAdd = async () => {
    setEditingProject(null);
    form.resetFields();
    await generateContractNo();
    setIsModalOpen(true);
  };

  // 打开编辑弹窗
  const handleEdit = (record: Project) => {
    setEditingProject(record);
    form.setFieldsValue({
      ...record,
      start_date: record.start_date,
      end_date: record.end_date,
      leader_name: record.leader_name,
    });
    setContractNo(record.contract_no);
    setIsModalOpen(true);
  };

  // 查看详情
  const handleView = (record: Project) => {
    setViewingProject(record);
    setViewModalOpen(true);
  };

  // 删除项目
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        message.success('删除成功');
        fetchProjects();
        fetchStats();
      } else {
        message.error(data.message || '删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const projectData = {
        ...values,
        start_date: values.start_date.format('YYYY-MM-DD'),
        end_date: values.end_date.format('YYYY-MM-DD'),
        contract_no: contractNo,
      };

      const url = editingProject
        ? `${API_BASE}/projects/${editingProject.project_id}`
        : `${API_BASE}/projects`;

      const response = await fetch(url, {
        method: editingProject ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      const data = await response.json();
      if (data.success) {
        message.success(editingProject ? '更新成功' : '创建成功');
        setIsModalOpen(false);
        fetchProjects();
        fetchStats();
      } else {
        message.error(data.message || '操作失败');
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 渲染进度条
  const renderProgress = (progress: number) => {
    let color = '#52c41a';
    let strokeColor = color;
    if (progress < 30) {
      color = '#ef4444';
      strokeColor = { from: '#ef4444', to: '#f87171' };
    } else if (progress < 70) {
      color = '#f59e0b';
      strokeColor = { from: '#f59e0b', to: '#fbbf24' };
    } else {
      strokeColor = { from: '#52c41a', to: '#86efac' };
    }
    return (
      <Progress
        percent={progress}
        strokeColor={strokeColor}
        size="small"
        trailColor="#f0f0f0"
        strokeWidth={10}
        showInfo={true}
        format={(percent) => (
          <span style={{
            fontSize: '13px',
            fontWeight: 600,
            color: progress < 30 ? '#ef4444' : progress < 70 ? '#f59e0b' : '#52c41a'
          }}>
            {percent}%
          </span>
        )}
      />
    );
  };

  // 渲染结算状态
  const renderSettlementStatus = (status: string) => {
    const colorMap: Record<string, string> = {
      '未结算': 'default',
      '部分结算': 'processing',
      '结算完成': 'success',
    };
    return <Tag color={colorMap[status]} style={{ fontWeight: 500, padding: '4px 12px' }}>{status}</Tag>;
  };

  // 表格列配置
  const allColumns: ColumnsType<Project> = [
    { title: '合同编号', dataIndex: 'contract_no', key: 'contract_no', width: 150, fixed: 'left' as const },
    { title: '合同名称', dataIndex: 'contract_name', key: 'contract_name', width: 200, fixed: 'left' as const },
    {
      title: '起止日期',
      key: 'dates',
      width: 180,
      render: (_, r) => {
        const formatDate = (dateStr: string) => dayjs(dateStr).format('YYYY-MM-DD');
        return `${formatDate(r.start_date)} ~ ${formatDate(r.end_date)}`;
      }
    },
    { title: '项目进度', dataIndex: 'progress', key: 'progress', width: 150, render: renderProgress },
    { title: '项目负责人', dataIndex: 'leader_name', key: 'leader_name', width: 100 },
    { title: '结算情况', dataIndex: 'settlement_status', key: 'settlement_status', width: 100, render: renderSettlementStatus },
    { title: '合同签订', dataIndex: 'is_signed', key: 'is_signed', width: 80, align: 'center' as const, render: (v) => v === '已签订' ? '✅' : '❌' },
    { title: '合同金额(万)', dataIndex: 'contract_amount', key: 'contract_amount', width: 120, align: 'right' as const },
    { title: '回款金额(万)', dataIndex: 'payment_amount', key: 'payment_amount', width: 120, align: 'right' as const },
    { title: '所属部门', dataIndex: 'dept_name', key: 'dept_name', width: 100 },
    { title: '项目类型', dataIndex: 'project_type', key: 'project_type', width: 100 },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>详情</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          {isAdmin && (
            <Popconfirm
              title="确定要删除这个项目吗？"
              onConfirm={() => handleDelete(record.project_id)}
              okText="确定"
              cancelText="取消"
            >
              <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const columns = allColumns.filter(col => col.key && visibleColumns.includes(col.key as string));

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
    ...(user.role === 'admin' ? [{
      key: 'system',
      icon: <ToolOutlined />,
      label: <Link to="/system">系统设置</Link>,
    }] : []),
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
          selectedKeys={['project-ledger']}
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
            <Breadcrumb.Item>项目管理</Breadcrumb.Item>
            <Breadcrumb.Item>项目台账管理</Breadcrumb.Item>
          </Breadcrumb>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span>欢迎, {user.full_name}</span>
            <Button icon={<LogoutOutlined />} onClick={onLogout}>退出登录</Button>
          </div>
        </Header>

        {/* 内容区域 */}
        <Content style={{ padding: '24px', background: '#f0f2f5' }}>
          {/* 统计看板 */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <Card style={{ flex: 1 }}>
              <Statistic title="项目总数" value={stats?.totalProjects || 0} />
            </Card>
            <Card style={{ flex: 1 }}>
              <Statistic title="逾期项目" value={stats?.overdueProjects || 0} valueStyle={{ color: '#cf1322' }} />
            </Card>
            <Card style={{ flex: 1 }}>
              <Statistic title="总合同金额(万)" value={stats?.totalAmount || 0} />
            </Card>
            <Card style={{ flex: 1 }}>
              <Statistic title="已结算项目" value={stats?.settledProjects || 0} suffix={`/ ${stats?.settledRatio || 0}%`} />
            </Card>
            <Card style={{ flex: 1 }}>
              <Statistic title="平均进度" value={stats?.avgProgress || 0} suffix="%" />
            </Card>
          </div>

          {/* 搜索和筛选 */}
          <Card style={{ marginBottom: '16px' }}>
            <Space wrap>
              <Input
                placeholder="搜索合同编号、名称、负责人..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                allowClear
                style={{ width: 300 }}
              />
              <Select
                placeholder="项目类型"
                value={projectType}
                onChange={setProjectType}
                allowClear
                style={{ width: 120 }}
              >
                <Select.Option value="BIM项目">BIM项目</Select.Option>
                <Select.Option value="建筑施工">建筑施工</Select.Option>
                <Select.Option value="室内设计">室内设计</Select.Option>
                <Select.Option value="园林景观">园林景观</Select.Option>
                <Select.Option value="市政工程">市政工程</Select.Option>
                <Select.Option value="其他">其他</Select.Option>
              </Select>
              <Select
                placeholder="结算状态"
                value={settlementStatus}
                onChange={setSettlementStatus}
                allowClear
                style={{ width: 120 }}
              >
                <Select.Option value="未结算">未结算</Select.Option>
                <Select.Option value="部分结算">部分结算</Select.Option>
                <Select.Option value="结算完成">结算完成</Select.Option>
              </Select>
              <Select
                placeholder="是否逾期"
                value={isOverdue}
                onChange={setIsOverdue}
                allowClear
                style={{ width: 120 }}
              >
                <Select.Option value={true}>是</Select.Option>
                <Select.Option value={false}>否</Select.Option>
              </Select>
              <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>新增项目</Button>
              <Dropdown
                trigger={['click']}
                open={columnSettingsOpen}
                onOpenChange={(open) => {
                  setColumnSettingsOpen(open);
                  if (open) {
                    // 打开时，将当前可见列复制到临时状态
                    setTempVisibleColumns([...visibleColumns]);
                  }
                }}
                menu={{
                  items: [
                    {
                      key: 'column-settings',
                      label: (
                        <div
                          style={{ minWidth: 240, maxWidth: 320 }}
                          onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <div style={{ marginBottom: 12, fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>显示列设置</span>
                              <small style={{ color: '#999', fontWeight: 400 }}>按顺序勾选</small>
                            </div>
                            <Checkbox.Group
                              value={tempVisibleColumns}
                              onChange={(values) => {
                                const newValues = values as string[];
                                setTempVisibleColumns(newValues);
                              }}
                              style={{ width: '100%' }}
                            >
                              <Space direction="vertical" style={{ width: '100%' }}>
                                {allColumns.map(col => {
                                  const colKey = col.key as string;
                                  const index = tempVisibleColumns.indexOf(colKey);
                                  return (
                                    <div key={colKey} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <Checkbox value={colKey} style={{ flex: 1 }}>
                                        {col.title as string}
                                      </Checkbox>
                                      {index > 0 && (
                                        <Button
                                          type="text"
                                          size="small"
                                          icon={<span style={{ fontSize: 12 }}>↑</span>}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const newColumns = [...tempVisibleColumns];
                                            [newColumns[index - 1], newColumns[index]] = [newColumns[index], newColumns[index - 1]];
                                            setTempVisibleColumns(newColumns);
                                          }}
                                          style={{ padding: '0 4px', minWidth: 24 }}
                                        />
                                      )}
                                      {index < tempVisibleColumns.length - 1 && index >= 0 && (
                                        <Button
                                          type="text"
                                          size="small"
                                          icon={<span style={{ fontSize: 12 }}>↓</span>}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const newColumns = [...tempVisibleColumns];
                                            [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
                                            setTempVisibleColumns(newColumns);
                                          }}
                                          style={{ padding: '0 4px', minWidth: 24 }}
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </Space>
                            </Checkbox.Group>
                            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                <Space>
                                  <Button
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const allKeys = allColumns.map(col => col.key as string);
                                      setTempVisibleColumns(allKeys);
                                    }}
                                  >
                                    全选
                                  </Button>
                                  <Button
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const defaultCols = [
                                        'contract_no', 'contract_name', 'dates', 'contract_amount', 'progress',
                                        'leader_name', 'settlement_status', 'is_signed', 'payment_amount', 'action'
                                      ];
                                      setTempVisibleColumns(defaultCols);
                                    }}
                                  >
                                    重置
                                  </Button>
                                </Space>
                                <Space>
                                  <Button
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTempVisibleColumns([...visibleColumns]);
                                    }}
                                  >
                                    取消
                                  </Button>
                                  <Button
                                    size="small"
                                    type="primary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setVisibleColumns(tempVisibleColumns);
                                      localStorage.setItem('visibleColumns', JSON.stringify(tempVisibleColumns));
                                      setColumnSettingsOpen(false);
                                    }}
                                  >
                                    确定
                                  </Button>
                                </Space>
                              </Space>
                            </div>
                          </div>
                        ),
                      },
                    ],
                  }}
                >
                  <Button icon={<SettingOutlined />}>列设置</Button>
                </Dropdown>
              <div style={{ flex: 1 }} />
              <Button icon={<ReloadOutlined />} onClick={() => { fetchProjects(); fetchStats(); }}>刷新</Button>
            </Space>
          </Card>

          {/* 项目表格 */}
          <Card>
            <Table
              columns={columns}
              dataSource={projects}
              rowKey="project_id"
              loading={loading}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
                onChange: (page, pageSize) => setPagination({ current: page, pageSize: pageSize || 20, total: pagination.total }),
              }}
              scroll={{ x: 1500 }}
              rowClassName={(record) => record.is_overdue ? 'overdue-row' : ''}
            />
          </Card>
        </Content>
      </Layout>

      {/* 新增/编辑项目弹窗 */}
      <Modal
        title={editingProject ? '编辑项目' : '新增项目'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        width={800}
        okText="确定"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            settlement_status: '未结算',
            is_signed: '未签订',
            progress: 0,
            payment_amount: 0,
          }}
        >
          <Form.Item label="合同编号">
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={contractNo}
                onChange={e => setContractNo(e.target.value)}
                placeholder="请输入或生成合同编号"
              />
              <Button onClick={generateContractNo}>自动生成</Button>
            </Space.Compact>
          </Form.Item>

          <Form.Item
            label="合同名称"
            name="contract_name"
            rules={[{ required: true, message: '请输入合同名称' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="起止日期" required>
            <Space>
              <Form.Item
                name="start_date"
                rules={[{ required: true, message: '请选择开始日期' }]}
                style={{ margin: 0 }}
              >
                <DatePicker style={{ width: 200 }} />
              </Form.Item>
              <Form.Item
                name="end_date"
                rules={[{ required: true, message: '请选择结束日期' }]}
                style={{ margin: 0 }}
              >
                <DatePicker style={{ width: 200 }} />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item
            label="合同金额(万元)"
            name="contract_amount"
            rules={[{ required: true, message: '请输入合同金额' }]}
          >
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="项目进度(%)" name="progress">
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="项目负责人"
            name="leader_name"
            rules={[{ required: true, message: '请输入或选择项目负责人' }]}
          >
            <AutoComplete
              options={availableUsers.map(u => ({
                value: u.full_name,
                label: `${u.full_name} (${u.dept_name || '未分配部门'})`,
                key: u.user_id,
              }))}
              placeholder="请输入或选择项目负责人"
              filterOption={(inputValue, option) =>
                option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
            />
          </Form.Item>

          <Form.Item label="结算状态" name="settlement_status">
            <Select>
              <Select.Option value="未结算">未结算</Select.Option>
              <Select.Option value="部分结算">部分结算</Select.Option>
              <Select.Option value="结算完成">结算完成</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="是否签订" name="is_signed">
            <Select>
              <Select.Option value="已签订">已签订</Select.Option>
              <Select.Option value="未签订">未签订</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="回款金额(万元)" name="payment_amount">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="项目类型"
            name="project_type"
            rules={[{ required: true, message: '请选择项目类型' }]}
          >
            <Select>
              <Select.Option value="BIM项目">BIM项目</Select.Option>
              <Select.Option value="建筑施工">建筑施工</Select.Option>
              <Select.Option value="室内设计">室内设计</Select.Option>
              <Select.Option value="园林景观">园林景观</Select.Option>
              <Select.Option value="市政工程">市政工程</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="项目备注" name="remark">
            <TextArea rows={4} maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 项目详情弹窗 */}
      <Modal
        title="项目详情"
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalOpen(false)}>
            关闭
          </Button>,
        ]}
      >
        {viewingProject && (
          <div style={{ lineHeight: 2 }}>
            <p><strong>合同编号：</strong>{viewingProject.contract_no}</p>
            <p><strong>合同名称：</strong>{viewingProject.contract_name}</p>
            <p><strong>起止日期：</strong>{viewingProject.start_date} ~ {viewingProject.end_date}</p>
            <p><strong>合同金额：</strong>{viewingProject.contract_amount} 万元</p>
            <p><strong>项目进度：</strong>{viewingProject.progress}%</p>
            <p><strong>项目负责人：</strong>{viewingProject.leader_name}</p>
            <p><strong>结算情况：</strong>{viewingProject.settlement_status}</p>
            <p><strong>是否签订：</strong>{viewingProject.is_signed}</p>
            <p><strong>回款金额：</strong>{viewingProject.payment_amount} 万元</p>
            <p><strong>所属部门：</strong>{viewingProject.dept_name}</p>
            <p><strong>项目类型：</strong>{viewingProject.project_type}</p>
            {viewingProject.remark && <p><strong>项目备注：</strong>{viewingProject.remark}</p>}
          </div>
        )}
      </Modal>
    </Layout>
  );
}

// 主应用组件
function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    // 检查本地存储的用户信息
    const storedUser = localStorage.getItem('user');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handleLogin = (loggedInUser: User, loggedInToken: string) => {
    setUser(loggedInUser);
    setToken(loggedInToken);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    localStorage.setItem('token', loggedInToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    message.success('已退出登录');
  };

  if (!user) {
    return (
      <QueryClientProvider client={queryClient}>
        <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1e3a8a', borderRadius: 8 } }}>
          <Router>
            <Routes>
              <Route path="*" element={<Login onLogin={handleLogin} />} />
            </Routes>
          </Router>
        </ConfigProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1e3a8a', borderRadius: 8 } }}>
        <Router>
          <Routes>
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/" element={<ProjectLedger user={user} onLogout={handleLogout} />} />
            <Route
              path="/system"
              element={
                user.role === 'admin'
                  ? <UserManagement user={user} onLogout={handleLogout} />
                  : <Navigate to="/" replace />
              }
            />
          </Routes>
        </Router>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
