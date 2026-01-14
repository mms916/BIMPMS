import React, { useState, useEffect, useRef } from 'react';
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
  BellOutlined, CustomerServiceOutlined, ExportOutlined
} from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';
import type { MenuProps } from 'antd';
import './App.css';
import UserManagement from './pages/UserManagement';
import WorkBreakdown from './pages/WorkBreakdown';
import Workbench from './pages/Workbench';
import { exportProjectsToExcel, getDefaultExportColumns, EXPORT_COLUMNS } from './utils/excelUtils';

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
const API_BASE = '/api';

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
  paymentAmount?: number;
  newProjectsThisMonth?: number;
  aheadProjects?: number;
  normalProjects?: number;
  behindProjects?: number;
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

// ============================================
// 可视化图表组件
// ============================================

// 环形图组件（项目总数）
const DonutChart: React.FC<{ percent: number; color: string; label?: string }> = ({ percent, color, label = '进行中' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 80 * dpr;
    canvas.height = 80 * dpr;
    ctx.scale(dpr, dpr);

    const centerX = 40;
    const centerY = 40;
    const radius = 32;
    const lineWidth = 8;

    ctx.clearRect(0, 0, 80, 80);

    // 背景圆环
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // 进度圆环
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (percent / 100) * 2 * Math.PI;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
  }, [percent, color]);

  return (
    <div style={{ position: 'relative', width: '80px', height: '80px' }}>
      <canvas
        ref={canvasRef}
        width="80"
        height="80"
        style={{ display: 'block', width: '80px', height: '80px' }}
      />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '16px', fontWeight: '700', color: '#1F2937', lineHeight: 1 }}>{percent}%</div>
        <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{label}</div>
      </div>
    </div>
  );
};

// 仪表盘组件（逾期项目）
const GaugeChart: React.FC<{ percent: number }> = ({ percent }) => {
  return (
    <div style={{
      position: 'relative',
      width: '80px',
      height: '50px',
      overflow: 'hidden'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'conic-gradient(#E5E7EB 0deg 180deg, transparent 180deg 360deg)',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: `conic-gradient(#FA8C16 0deg ${percent * 1.8}deg, transparent ${percent * 1.8}deg 180deg, transparent 180deg 360deg)`
        }}></div>
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FFF7E6 0%, #FFFFFF 100%)'
        }}></div>
      </div>
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '14px',
        fontWeight: '600',
        color: '#FA8C16'
      }}>{percent}%</div>
    </div>
  );
};

// 迷你柱状图组件（合同金额）
const MiniBarChart: React.FC = () => {
  const bars = [
    { height: 30, color: '#B7EB8F' },
    { height: 45, color: '#87E8DE' },
    { height: 35, color: '#36CFC9' },
    { height: 50, color: '#13C2C2' },
    { height: 40, color: '#08979C' },
    { height: 48, color: '#006D75' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '50px' }}>
      {bars.map((bar, index) => (
        <div
          key={index}
          style={{
            width: '12px',
            height: `${bar.height}px`,
            background: bar.color,
            borderRadius: '3px 3px 0 0',
            transition: 'height 0.3s ease'
          }}
        />
      ))}
    </div>
  );
};

// 进度环组件（平均进度）
const ProgressRing: React.FC<{ percent: number }> = ({ percent }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 80 * dpr;
    canvas.height = 80 * dpr;
    ctx.scale(dpr, dpr);

    const centerX = 40;
    const centerY = 40;
    const radius = 32;
    const lineWidth = 8;

    ctx.clearRect(0, 0, 80, 80);

    // 背景圆环
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 进度圆环（渐变）
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (percent / 100) * 2 * Math.PI;

    const gradient = ctx.createLinearGradient(0, 0, 80, 0);
    gradient.addColorStop(0, '#8B5CF6');
    gradient.addColorStop(1, '#A78BFA');

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
  }, [percent]);

  return (
    <div style={{ position: 'relative', width: '80px', height: '80px' }}>
      <canvas
        ref={canvasRef}
        width="80"
        height="80"
        style={{ display: 'block', width: '80px', height: '80px' }}
      />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#1F2937' }}>{percent}%</div>
      </div>
    </div>
  );
};

// 项目台账组件
function ProjectLedger({ user, onLogout }: { user: User; onLogout: () => void }) {
  const location = useLocation();
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

  // 导出相关状态
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportColumns, setExportColumns] = useState<string[]>(getDefaultExportColumns());
  const [exporting, setExporting] = useState(false);

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
      start_date: dayjs(record.start_date),
      end_date: dayjs(record.end_date),
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

  // 打开导出弹窗
  const handleExport = () => {
    if (pagination.total === 0) {
      message.warning('当前没有可导出的数据');
      return;
    }
    setExportModalOpen(true);
  };

  // 执行导出
  const handleDoExport = async () => {
    if (exportColumns.length === 0) {
      message.warning('请至少选择一个导出字段');
      return;
    }

    setExporting(true);
    try {
      // 获取所有符合筛选条件的数据（不分页）
      const params = new URLSearchParams({
        page: '1',
        pageSize: '9999',
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
        const allProjects = data.data.data || [];

        if (allProjects.length === 0) {
          message.warning('没有可导出的数据');
          return;
        }

        // 导出Excel
        exportProjectsToExcel(allProjects, { columns: exportColumns });
        message.success(`成功导出 ${allProjects.length} 条数据`);
        setExportModalOpen(false);
      }
    } catch (error: any) {
      message.error(error.message || '导出失败');
    } finally {
      setExporting(false);
    }
  };

  // 渲染进度条
  const renderProgress = (progress: number) => {
    let color = '#52c41a';
    let strokeColor = color;
    if (progress < 30) {
      color = '#ef4444';
      strokeColor = '#ef4444';
    } else if (progress < 70) {
      color = '#f59e0b';
      strokeColor = '#f59e0b';
    } else {
      strokeColor = '#52c41a';
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

  // 获取用户名首字母
  const getUserInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  // 获取用户角色显示名称
  const getRoleName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      admin: '管理员',
      manager: '项目经理',
      user: '普通用户'
    };
    return roleMap[role] || role;
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      {/* 自定义侧边栏 - 蓝色渐变 */}
      <Sider
        width={240}
        className="custom-sidebar"
        trigger={null}
      >
        {/* Logo 区域 */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <ProjectOutlined />
          </div>
          <span className="sidebar-logo-text">BIM 管理系统</span>
        </div>

        {/* 导航菜单 */}
        <div className="sidebar-nav">
          <div className="nav-label">主导航</div>
          <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
            <ProjectOutlined className="nav-item-icon" />
            <span>项目台账管理</span>
          </Link>
          <Link to="/workbench" className={`nav-item ${location.pathname === '/workbench' ? 'active' : ''}`}>
            <ApartmentOutlined className="nav-item-icon" />
            <span>工作台</span>
          </Link>
          <Link to="/work-breakdown" className={`nav-item ${location.pathname === '/work-breakdown' ? 'active' : ''}`}>
            <FileTextOutlined className="nav-item-icon" />
            <span>工作分解</span>
          </Link>
          <div className="nav-item">
            <ScheduleOutlined className="nav-item-icon" />
            <span>周报管理</span>
          </div>

          {user.role === 'admin' && (
            <>
              <div className="nav-label">系统管理</div>
              <Link to="/system" className={`nav-item ${location.pathname === '/system' ? 'active' : ''}`}>
                <ToolOutlined className="nav-item-icon" />
                <span>系统设置</span>
              </Link>
            </>
          )}
        </div>

        {/* 用户信息 */}
        <div className="sidebar-user">
          <div className="user-avatar">{getUserInitials(user.full_name)}</div>
          <div className="user-info">
            <div className="user-name">{user.full_name}</div>
            <div className="user-role">{getRoleName(user.role)}</div>
          </div>
          <Button
            type="text"
            icon={<LogoutOutlined style={{ color: 'rgba(255,255,255,0.7)' }} />}
            onClick={onLogout}
            style={{ padding: '4px 8px' }}
          />
        </div>
      </Sider>

      <Layout className="main-layout">
        {/* 内容区域 */}
        <Content style={{ padding: '24px 32px', background: '#F7F8FA', minHeight: '100vh' }}>
          {/* 面包屑导航 */}
          <div className="custom-breadcrumb">
            <a href="#">首页</a>
            <span>/</span>
            <a href="#">项目管理</a>
            <span>/</span>
            <span className="current">项目台账管理</span>
          </div>

          {/* 页面标题和操作按钮 */}
          <div className="page-header">
            <div className="page-title">
              <h1>项目台账管理</h1>
              <p>管理和跟踪所有项目的合同信息、进度和结算状态</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-outline" onClick={() => fetchProjects()}>
                <ReloadOutlined /> 刷新
              </button>
              <button className="btn-outline" onClick={handleExport}>
                <ExportOutlined /> 导出
              </button>
              <button className="btn-primary" onClick={() => { setEditingProject(null); setIsModalOpen(true); }}>
                <PlusOutlined /> 新建项目
              </button>
            </div>
          </div>

          {/* 统计看板 - 带可视化图表 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
            {/* 卡片1: 项目总数 - 环形图 */}
            <Card style={{ borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>项目总数</span>
                <span style={{ fontSize: '18px', background: '#F0F5FF', padding: '8px', borderRadius: '6px' }}>📁</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#1F2937' }}>{stats?.totalProjects || 0}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    {(stats?.newProjectsThisMonth || 0) > 0 ? (
                      <span style={{ color: '#52C41A', fontSize: '12px' }}>↑ +{stats?.newProjectsThisMonth || 0}</span>
                    ) : (
                      <span style={{ color: '#9CA3AF', fontSize: '12px' }}>-</span>
                    )}
                    <span style={{ color: '#9CA3AF', fontSize: '12px' }}>本月新增</span>
                  </div>
                </div>
                <DonutChart
                  percent={stats?.totalProjects ? Math.round((((stats.totalProjects as number) - Number(stats.settledProjects || 0)) / (stats.totalProjects as number)) * 100) : 0}
                  color="#2F54EB"
                />
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#2F54EB', marginRight: '4px' }}></span>
                  进行中 {(stats?.totalProjects || 0) - Number(stats?.settledProjects || 0)}
                </span>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#36CFC9', marginRight: '4px' }}></span>
                  已完成 {stats?.settledProjects || 0}
                </span>
              </div>
            </Card>

            {/* 卡片2: 逾期项目 - 仪表盘 */}
            <Card style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #FFF7E6 0%, #FFFFFF 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>逾期项目</span>
                <span style={{ fontSize: '18px', background: '#FFF7E6', padding: '8px', borderRadius: '6px' }}>⚠️</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#FA8C16' }}>{stats?.overdueProjects || 0}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    {Number(stats?.overdueProjects || 0) > 0 ? (
                      <span style={{ color: '#FF4D4F', fontSize: '12px' }}>⚠ {stats?.overdueProjects}个</span>
                    ) : (
                      <span style={{ color: '#52C41A', fontSize: '12px' }}>✓ 无逾期</span>
                    )}
                    <span style={{ color: '#9CA3AF', fontSize: '12px' }}>需处理</span>
                  </div>
                </div>
                <GaugeChart percent={stats?.totalProjects ? Math.round((Number(stats.overdueProjects || 0) / (stats.totalProjects as number)) * 100) : 0} />
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#FA8C16', marginRight: '4px' }}></span>
                  逾期率 {stats?.totalProjects ? Math.round((Number(stats.overdueProjects || 0) / (stats.totalProjects as number)) * 100) : 0}%
                </span>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#E5E7EB', marginRight: '4px' }}></span>
                  正常 {100 - (stats?.totalProjects ? Math.round((Number(stats.overdueProjects || 0) / (stats.totalProjects as number)) * 100) : 0)}%
                </span>
              </div>
            </Card>

            {/* 卡片3: 合同金额 - 迷你柱状图 */}
            <Card style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #E6FFFB 0%, #FFFFFF 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>总合同金额</span>
                <span style={{ fontSize: '18px', background: '#E6FFFB', padding: '8px', borderRadius: '6px' }}>💰</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#1F2937' }}>
                    {Number(stats?.totalAmount || 0).toLocaleString()}<span style={{ fontSize: '14px', fontWeight: 400, marginLeft: '4px' }}>万</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span style={{ color: '#9CA3AF', fontSize: '12px' }}>回款率</span>
                    <span style={{ color: '#36CFC9', fontSize: '12px', fontWeight: 600 }}>
                      {Number(stats?.totalAmount) ? Math.round((Number(stats?.paymentAmount || 0) / Number(stats.totalAmount)) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <MiniBarChart />
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#36CFC9', marginRight: '4px' }}></span>
                  已回款 ¥{Number(stats?.paymentAmount || 0).toLocaleString()}万
                </span>
              </div>
            </Card>

            {/* 卡片4: 平均进度 - 进度环 */}
            <Card style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #F3E8FF 0%, #FFFFFF 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>平均进度</span>
                <span style={{ fontSize: '18px', background: '#F3E8FF', padding: '8px', borderRadius: '6px' }}>📊</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#1F2937' }}>
                    {Math.round(stats?.avgProgress || 0)}<span style={{ fontSize: '14px', fontWeight: 400 }}>%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span style={{ color: '#52C41A', fontSize: '12px' }}>✓</span>
                    <span style={{ color: '#9CA3AF', fontSize: '12px' }}>整体进度正常</span>
                  </div>
                </div>
                <ProgressRing percent={Math.round(stats?.avgProgress || 0)} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#52C41A', marginRight: '4px' }}></span>
                  超前 {stats?.aheadProjects || 0}个
                </span>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#2F54EB', marginRight: '4px' }}></span>
                  正常 {stats?.normalProjects || 0}个
                </span>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#FF4D4F', marginRight: '4px' }}></span>
                  滞后 {stats?.behindProjects || 0}个
                </span>
              </div>
            </Card>
          </div>

          {/* 表格卡片 - 包含筛选和数据表格 */}
          <div className="table-card">
            {/* 表格头部 - 标题和筛选 */}
            <div className="table-header">
              <div className="table-title">
                项目列表
                <span className="count">{pagination.total} 个项目</span>
              </div>
              <div className="table-filters">
                <div className="search-box">
                  <SearchOutlined className="search-icon" />
                  <input
                    type="text"
                    placeholder="搜索合同编号、名称、负责人..."
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                  />
                </div>
                <Select
                  placeholder="项目类型"
                  value={projectType}
                  onChange={setProjectType}
                  allowClear
                  style={{ width: 110 }}
                  size="small"
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
                  style={{ width: 110 }}
                  size="small"
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
                  style={{ width: 100 }}
                  size="small"
                >
                  <Select.Option value={true}>是</Select.Option>
                  <Select.Option value={false}>否</Select.Option>
                </Select>
                <Dropdown
                  trigger={['click']}
                  open={columnSettingsOpen}
                  onOpenChange={(open) => {
                    setColumnSettingsOpen(open);
                    if (open) {
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
                  <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '13px', height: '24px', display: 'flex', alignItems: 'center' }}>
                    <SettingOutlined style={{ fontSize: '13px' }} /> 列设置
                  </button>
                </Dropdown>
              </div>
            </div>

            {/* 项目表格 */}
            <Table
              className="custom-table"
              columns={columns}
              dataSource={projects.filter(p => p && p.project_id)}
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
              locale={{ emptyText: '暂无数据' }}
            />
          </div>
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

      {/* 导出Excel弹窗 */}
      <Modal
        title="导出Excel"
        open={exportModalOpen}
        onCancel={() => setExportModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setExportModalOpen(false)}>
            取消
          </Button>,
          <Button
            key="export"
            type="primary"
            loading={exporting}
            disabled={exportColumns.length === 0}
            onClick={handleDoExport}
          >
            导出Excel
          </Button>,
        ]}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>当前数据：{pagination.total} 条记录</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            将导出当前筛选条件下的所有数据
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>请选择导出字段：</div>
          <Checkbox.Group
            value={exportColumns}
            onChange={(values) => setExportColumns(values as string[])}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Checkbox value="contract_no">合同编号</Checkbox>
              <Checkbox value="contract_name">合同名称</Checkbox>
              <Checkbox value="dates">起止日期</Checkbox>
              <Checkbox value="contract_amount">合同金额(万元)</Checkbox>
              <Checkbox value="progress">项目进度(%)</Checkbox>
              <Checkbox value="leader_name">项目负责人</Checkbox>
              <Checkbox value="settlement_status">结算状态</Checkbox>
              <Checkbox value="is_signed">签订状态</Checkbox>
              <Checkbox value="payment_amount">回款金额(万元)</Checkbox>
              <Checkbox value="dept_name">所属部门</Checkbox>
              <Checkbox value="project_type">项目类型</Checkbox>
              <Checkbox value="is_overdue">是否逾期</Checkbox>
              <Checkbox value="remark">备注</Checkbox>
            </Space>
          </Checkbox.Group>
        </div>
        <div>
          <Space>
            <Button size="small" onClick={() => setExportColumns(getDefaultExportColumns())}>
              重置默认
            </Button>
            <Button size="small" onClick={() => setExportColumns(EXPORT_COLUMNS.map(c => c.key))}>
              全选
            </Button>
            <Button size="small" onClick={() => setExportColumns([])}>
              清空
            </Button>
          </Space>
        </div>
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
            <Route path="/work-breakdown" element={<WorkBreakdown user={user} />} />
            <Route path="/workbench" element={<Workbench user={user} />} />
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
