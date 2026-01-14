import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, message } from 'antd';
import {
  ProjectOutlined,
  ApartmentOutlined,
  FileTextOutlined,
  ScheduleOutlined,
  ToolOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ProjectHeaderCard,
  MyTodosCard,
  TodoListCard,
  TeamStatsChart,
  WeatherCard,
  TaskCompletionCard,
  QuickFunctionsCard,
  OkrMetricsCard,
} from '../components/workbench';
import {
  useMyTaskStats,
  useMyTasks,
  useMyProjects,
  useTeamStats,
  useTaskCompletionStats,
  useOkrMetrics,
  useProjectTasks,
} from '../hooks/useTasks';
import { useWeather as useWeatherHook } from '../hooks/useWeather';
import type { Project } from '../types';
import './Workbench.css';

interface WorkbenchProps {
  user: any;
}

interface TodoItem {
  key: string;
  taskName: string;
  taskType: string;
  deadline: string;
  initiator: string;
  status: 'normal' | 'urgent';
}

const Workbench: React.FC<WorkbenchProps> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [teamStatsPeriod, setTeamStatsPeriod] = useState('本周');
  const [currentProjectId, setCurrentProjectId] = useState<number | undefined>(undefined);
  const [currentProject, setCurrentProject] = useState<Project | undefined>(undefined);

  // 获取用户参与的所有项目
  const { data: projectsData } = useMyProjects();
  const allProjects = projectsData?.data || [];

  // 当项目列表加载后，设置当前项目
  useEffect(() => {
    if (allProjects.length > 0 && !currentProjectId) {
      // 默认选择第一个项目
      const firstProject = allProjects[0];
      setCurrentProjectId(firstProject.project_id);
      setCurrentProject(firstProject);
    }
  }, [allProjects, currentProjectId]);

  // 获取当前项目的任务数据
  const { data: projectTasks } = useProjectTasks(currentProjectId || 0);

  // 数据查询
  const { data: stats } = useMyTaskStats();
  const { data: myTasks } = useMyTasks({ projectId: currentProjectId });
  const { data: teamStats } = useTeamStats(teamStatsPeriod);
  const { data: taskCompletionStats } = useTaskCompletionStats();
  const { data: okrMetrics } = useOkrMetrics();
  const { data: weatherData } = useWeatherHook();

  // 计算任务统计（从工作分解结构的任务数据）
  const calculateTaskStats = () => {
    if (!projectTasks) {
      return { totalCount: 0, inProgressCount: 0, completedCount: 0, notStartedCount: 0, overdueCount: 0 };
    }

    const tasks = projectTasks.data || [];
    const now = new Date();

    return tasks.reduce(
      (acc, task: any) => {
        acc.totalCount++;

        const endDate = new Date(task.end_date);
        const isOverdue = endDate < now;

        switch (task.status) {
          case 'in_progress':
            acc.inProgressCount++;
            if (isOverdue) acc.overdueCount++;
            break;
          case 'completed':
            acc.completedCount++;
            break;
          case 'not_started':
            acc.notStartedCount++;
            if (isOverdue) acc.overdueCount++;
            break;
        }

        return acc;
      },
      { totalCount: 0, inProgressCount: 0, completedCount: 0, notStartedCount: 0, overdueCount: 0 }
    );
  };

  const taskStats = calculateTaskStats();

  // 处理项目切换
  const handleProjectChange = (projectId: number) => {
    const project = allProjects.find((p: Project) => p.project_id === projectId);
    if (project) {
      setCurrentProjectId(projectId);
      setCurrentProject(project);
    }
  };

  // 获取用户名首字母
  const getUserInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  // 获取用户角色显示名称
  const getRoleName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      admin: '管理员',
      manager: '项目经理',
      user: '普通用户',
    };
    return roleMap[role] || role;
  };

  // 处理待办事项点击
  const handleTodoClick = (record: TodoItem) => {
    message.info(`打开任务：${record.taskName}`);
  };

  // 处理退出登录
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('已退出登录');
    navigate('/login');
  };

  return (
    <div className="workbench-layout">
      {/* 左侧导航栏 - 使用与主界面相同的结构 */}
      <div className="workbench-left-sidebar">
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
            onClick={handleLogout}
            style={{ padding: '4px 8px' }}
          />
        </div>
      </div>

      {/* 中间主内容区 */}
      <div className="workbench-main-content">
        {/* 项目头部卡片 */}
        <ProjectHeaderCard
          currentProject={currentProject}
          allProjects={allProjects}
          onProjectChange={handleProjectChange}
        />

        {/* 我的待办卡片 */}
        <MyTodosCard
          totalCount={taskStats.totalCount}
          inProgressCount={taskStats.inProgressCount}
          completedCount={taskStats.completedCount}
          notStartedCount={taskStats.notStartedCount}
          overdueCount={taskStats.overdueCount}
        />

        {/* 待办列表与任务完成情况 - 并排布局 */}
        <div className="wb-todo-completion-row">
          <TodoListCard onHandle={handleTodoClick} projectId={currentProjectId} />
          <TaskCompletionCard data={taskCompletionStats} />
        </div>

        {/* 团队工作统计图表 */}
        <TeamStatsChart
          data={teamStats?.members || []}
          period={teamStatsPeriod}
          onPeriodChange={setTeamStatsPeriod}
        />
      </div>

      {/* 右侧信息栏 */}
      <div className="workbench-right-sidebar">
        {/* 天气卡片 */}
        <WeatherCard data={weatherData} />

        {/* 常用功能卡片 */}
        <QuickFunctionsCard />

        {/* OKR指标卡片 */}
        <OkrMetricsCard data={okrMetrics} />
      </div>
    </div>
  );
};

export default Workbench;
