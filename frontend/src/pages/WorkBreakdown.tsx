import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Popconfirm,
  Empty,
  Breadcrumb,
  Divider,
  Segmented,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
  RightOutlined,
  ArrowLeftOutlined,
  FolderOpenOutlined,
  AppstoreOutlined,
  ApartmentOutlined,
  TableOutlined,
  SearchOutlined,
  SettingOutlined,
  ExportOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useProjectTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/useTasks';
import type { Task } from '../types/tasks';
import { useProjects } from '../hooks/useProjects';
import { useUsers } from '../hooks/useUsers';
import apiService from '../services/api';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const { TextArea } = Input;
const { Option } = Select;

interface WorkBreakdownProps {
  user: any;
}

const WorkBreakdown: React.FC<WorkBreakdownProps> = ({ user }) => {
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [parentId, setParentId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [viewMode, setViewMode] = useState<'mindmap' | 'tree'>('tree'); // 默认保持树形视图，后续切换到思维导图
  const [expandedProjectIds, setExpandedProjectIds] = useState<number[]>([]); // 项目卡片展开状态
  const [projectTypeFilter, setProjectTypeFilter] = useState<string>('all'); // 项目类型筛选器
  const [showProjectDetail, setShowProjectDetail] = useState<boolean>(false); // 项目详情悬浮面板
  const [mindmapScale, setMindmapScale] = useState<number>(1); // 思维导图缩放比例
  const [mindmapOffset, setMindmapOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 }); // 思维导图平移偏移
  const [isDragging, setIsDragging] = useState<boolean>(false); // 是否正在拖拽
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 }); // 拖拽起始位置
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null); // 悬停的节点ID
  const [searchKeyword, setSearchKeyword] = useState<string>(''); // 搜索关键词
  const mindmapContainerRef = useRef<HTMLDivElement>(null); // 思维导图容器引用
  const [calculatedProjectProgress, setCalculatedProjectProgress] = useState<number>(0); // 计算的项目进度
  const [isAutoProgress, setIsAutoProgress] = useState<boolean>(false); // 是否启用自动计算项目进度

  const { data: projects, refetch: refetchProjects } = useProjects();
  const { data: tasksResponse, refetch } = useProjectTasks(selectedProjectId || 0);
  const tasks = tasksResponse?.data || [];
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // 获取用户列表
  const { data: usersData } = useUsers({ pageSize: 1000 });
  const usersList = usersData?.data || [];

  // 获取项目列表
  const projectList = projects?.data?.data || [];

  // 根据项目类型筛选项目列表
  const filteredProjectList = useMemo(() => {
    if (projectTypeFilter === 'all') return projectList;
    return projectList.filter((p: any) => p.project_type === projectTypeFilter);
  }, [projectList, projectTypeFilter]);

  // 提取所有唯一的项目类型
  const projectTypes = useMemo((): string[] => {
    const types = new Set(projectList.map((p: any) => p.project_type).filter(Boolean));
    return Array.from(types) as string[];
  }, [projectList]);

  // 获取当前选中的项目
  const selectedProject = useMemo(() => {
    return projectList.find((p: any) => p.project_id === selectedProjectId);
  }, [projectList, selectedProjectId]);

  // 统计任务数量
  const taskStats = useMemo(() => {
    const countAll = (taskList: Task[]): number => {
      let count = 0;
      const traverse = (tasks: Task[]) => {
        tasks.forEach(task => {
          count++;
          if (task.children && task.children.length > 0) {
            traverse(task.children);
          }
        });
      };
      traverse(taskList);
      return count;
    };

    const countByStatus = (taskList: Task[], status: string): number => {
      let count = 0;
      const traverse = (tasks: Task[]) => {
        tasks.forEach(task => {
          if (task.status === status) count++;
          if (task.children && task.children.length > 0) {
            traverse(task.children);
          }
        });
      };
      traverse(taskList);
      return count;
    };

    return {
      total: countAll(tasks),
      inProgress: countByStatus(tasks, 'in_progress'),
      completed: countByStatus(tasks, 'completed'),
      pending: countByStatus(tasks, 'pending'),
    };
  }, [tasks]);

  // 格式化日期范围
  const formatDateRange = (task: Task): string => {
    const start = task.start_date ? dayjs(task.start_date).format('MM-DD') : '-';
    const end = task.end_date ? dayjs(task.end_date).format('MM-DD') : '-';
    return `${start} ~ ${end}`;
  };

  // 检查节点是否匹配搜索关键词
  const nodeMatchesSearch = (nodeId: number): boolean => {
    if (!searchKeyword) return true;

    const findTask = (taskList: Task[]): Task | null => {
      for (const task of taskList) {
        if (task.task_id === nodeId) return task;
        if (task.children?.length) {
          const found = findTask(task.children);
          if (found) return found;
        }
      }
      return null;
    };

    const task = findTask(tasks);
    if (!task) return true;

    return task.task_name.toLowerCase().includes(searchKeyword.toLowerCase());
  };

  // 获取节点的所有子节点ID
  const getChildNodeIds = (nodeId: number): number[] => {
    const ids: number[] = [];
    const findTask = (taskList: Task[]): Task | null => {
      for (const task of taskList) {
        if (task.task_id === nodeId) return task;
        if (task.children?.length) {
          const found = findTask(task.children);
          if (found) return found;
        }
      }
      return null;
    };

    const task = findTask(tasks);
    if (task?.children?.length) {
      const collectIds = (tasks: Task[]) => {
        tasks.forEach(t => {
          ids.push(t.task_id);
          if (t.children?.length) collectIds(t.children);
        });
      };
      collectIds(task.children);
    }

    return ids;
  };

  // 获取所有节点的key
  const getAllKeys = (taskList: Task[]): React.Key[] => {
    const keys: React.Key[] = [];
    const traverse = (tasks: Task[]) => {
      tasks.forEach(task => {
        keys.push(task.task_id);
        if (task.children && task.children.length > 0) {
          traverse(task.children);
        }
      });
    };
    traverse(taskList);
    return keys;
  };

  // 切换展开/折叠
  const toggleExpand = (taskId: number) => {
    if (expandedKeys.includes(taskId)) {
      setExpandedKeys(expandedKeys.filter(k => k !== taskId));
    } else {
      setExpandedKeys([...expandedKeys, taskId]);
    }
  };

  // 切换项目卡片展开/折叠
  const toggleProjectExpand = (projectId: number) => {
    if (expandedProjectIds.includes(projectId)) {
      setExpandedProjectIds(expandedProjectIds.filter(id => id !== projectId));
    } else {
      setExpandedProjectIds([...expandedProjectIds, projectId]);
    }
  };

  // 计算当前选中项目的任务统计
  const getProjectTaskStats = (projectId: number) => {
    // 只返回当前选中项目的统计，其他项目返回0
    // 因为只加载了选中项目的任务数据
    const projectTasks = projectId === selectedProjectId ? tasks : [];
    const countTasks = (taskList: Task[]): number => {
      let count = 0;
      const traverse = (tasks: Task[]) => {
        tasks.forEach(task => {
          count++;
          if (task.children && task.children.length > 0) {
            traverse(task.children);
          }
        });
      };
      traverse(taskList);
      return count;
    };

    const totalTasks = countTasks(projectTasks);
    const inProgressTasks = projectTasks.filter(t => t.status === 'in_progress').length;
    const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
    const pendingTasks = projectTasks.filter(t => t.status === 'pending').length;

    return {
      total: totalTasks,
      inProgress: inProgressTasks,
      completed: completedTasks,
      pending: pendingTasks,
    };
  };

  // 获取项目类型图标
  const getProjectTypeIcon = (projectType: string): string => {
    const typeMap: Record<string, string> = {
      '建筑设计': '🏗️',
      '景观设计': '🌳',
      '室内设计': '🏠',
      '市政工程': '🏢',
      '商业综合体': '🏬',
      '住宅小区': '🏘️',
      '工业项目': '🏭',
    };
    return typeMap[projectType] || '📋';
  };

  // 打开新建任务弹窗
  const handleAdd = (parentId: number | null = null) => {
    setEditingTask(null);
    setParentId(parentId);
    form.resetFields();
    if (selectedProjectId) {
      form.setFieldsValue({ project_id: selectedProjectId });
    }
    // Explicitly set parent_id in form
    if (parentId !== null) {
      form.setFieldsValue({ parent_id: parentId });
    }
    setModalOpen(true);
  };

  // 打开编辑任务弹窗
  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setParentId(task.parent_id || null);
    form.setFieldsValue({
      ...task,
      start_date: task.start_date ? dayjs(task.start_date) : null,
      end_date: task.end_date ? dayjs(task.end_date) : null,
    });
    setModalOpen(true);
  };

  // 删除任务
  const handleDelete = async (id: number) => {
    try {
      await deleteTask.mutateAsync(id);
      message.success('任务删除成功');
      refetch();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const taskData = {
        ...values,
        project_id: selectedProjectId!,
        parent_id: parentId,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
      };

      if (editingTask) {
        await updateTask.mutateAsync({ id: editingTask.task_id, data: taskData });
        message.success('任务更新成功');
      } else {
        await createTask.mutateAsync(taskData);
        message.success('任务创建成功');
      }

      setModalOpen(false);
      form.resetFields();
      refetch();

      // 如果创建了子任务，自动展开父任务
      if (!editingTask && parentId !== null) {
        setExpandedKeys(prev => [...new Set([...prev, parentId])]);
      }
    } catch (error: any) {
      console.error('操作失败：', error);
    }
  };

  // 计算项目进度
  const handleCalculateProjectProgress = async () => {
    try {
      console.log('计算所有项目进度');
      const response = await apiService.calculateAllProjectsProgress();
      console.log('计算所有项目进度响应:', response);
      if (response.success) {
        const { data } = response;
        const currentProjectProgress = data.find((item: any) => item.project_id === selectedProjectId);
        if (currentProjectProgress) {
          setCalculatedProjectProgress(currentProjectProgress.progress);
        }
        message.success(`已成功计算 ${data.length} 个项目的进度`);

        // 刷新项目列表以显示更新后的进度
        refetchProjects();

        // 如果启用了自动同步，直接同步到项目台账
        if (isAutoProgress && selectedProjectId) {
          await handleSyncProjectProgress();
        }
      }
    } catch (error: any) {
      console.error('计算项目进度错误:', error);
      message.error(error.response?.data?.message || '计算项目进度失败');
    }
  };

  // 同步项目进度到项目台账
  const handleSyncProjectProgress = async () => {
    if (!selectedProjectId) return;

    try {
      console.log('同步项目进度，projectId:', selectedProjectId);
      const response = await apiService.syncProjectProgress(selectedProjectId);
      console.log('同步项目进度响应:', response);
      if (response.success) {
        message.success(`项目进度已同步到项目台账: ${response.data.progress}%`);
        // 刷新项目列表以显示更新后的进度
        refetchProjects();
      }
    } catch (error: any) {
      console.error('同步项目进度错误:', error);
      message.error(error.response?.data?.message || '同步项目进度失败');
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string): { icon: string; color: string } => {
    switch (status) {
      case 'completed':
        return { icon: '✅', color: '#10B981' };
      case 'in_progress':
        return { icon: '🔄', color: '#3B82F6' };
      case 'pending':
        return { icon: '⏳', color: '#9CA3AF' };
      default:
        return { icon: '⏳', color: '#9CA3AF' };
    }
  };

  // 获取边框颜色（考虑延期情况）
  const getStatusBorderColor = (task: Task): string => {
    // 检查是否延期
    const isOverdue = task.end_date && new Date(task.end_date) < new Date() && task.status !== 'completed';
    if (isOverdue) {
      return '#EF4444'; // 红色边框：延期/紧急
    }
    // 根据状态返回边框颜色
    switch (task.status) {
      case 'completed':
        return '#10B981'; // 绿色：已完成
      case 'in_progress':
        return '#3B82F6'; // 蓝色：进行中
      case 'pending':
        return '#9CA3AF'; // 灰色：未开始
      default:
        return '#9CA3AF';
    }
  };

  // 判断任务是否有子任务
  const hasChildTasks = (task: Task): boolean => {
    return task.children && task.children.length > 0;
  };

  // 获取优先级标签
  const getPriorityBadge = (priority: string): { text: string; bgColor: string; textColor: string } => {
    switch (priority) {
      case 'high':
        return { text: '高优先级', bgColor: '#fee2e2', textColor: '#dc2626' };
      case 'medium':
        return { text: '中优先级', bgColor: '#fef3c7', textColor: '#d97706' };
      case 'low':
        return { text: '低优先级', bgColor: '#d1fae5', textColor: '#059669' };
      default:
        return { text: '中优先级', bgColor: '#fef3c7', textColor: '#d97706' };
    }
  };

  // ====================
  // 横向思维导图渲染
  // ====================

  // 思维导图缩放和平移处理
  const handleMindmapZoomIn = () => {
    setMindmapScale(prev => Math.min(prev + 0.1, 2));
  };

  const handleMindmapZoomOut = () => {
    setMindmapScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleMindmapWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setMindmapScale(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  const handleMindmapMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // 左键拖拽
      setIsDragging(true);
      setDragStart({ x: e.clientX - mindmapOffset.x, y: e.clientY - mindmapOffset.y });
    }
  };

  const handleMindmapMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setMindmapOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMindmapMouseUp = () => {
    setIsDragging(false);
  };

  const handleMindmapMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMindmapFit = () => {
    if (!mindmapContainerRef.current) return;

    const container = mindmapContainerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // 计算思维导图的实际尺寸
    const calculateMindMapBounds = (nodes: MindMapNode[]): { minX: number; minY: number; maxX: number; maxY: number } => {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      const traverse = (node: MindMapNode) => {
        minX = Math.min(minX, node.x);
        minY = Math.min(minY, node.y);
        maxX = Math.max(maxX, node.x + node.width);
        maxY = Math.max(maxY, node.y + node.height);

        if (node.children && node.children.length > 0) {
          node.children.forEach(traverse);
        }
      };

      nodes.forEach(traverse);
      return { minX, minY, maxX, maxY };
    };

    const bounds = calculateMindMapBounds(nodes);
    const mindmapWidth = bounds.maxX - bounds.minX;
    const mindmapHeight = bounds.maxY - bounds.minY;

    // 计算合适的缩放比例（基于容器尺寸）
    const padding = 100;
    const scaleX = (containerWidth - padding * 2) / mindmapWidth;
    const scaleY = (containerHeight - padding * 2) / mindmapHeight;
    const newScale = Math.min(Math.min(scaleX, scaleY), 1.5);
    const finalScale = Math.max(newScale, 0.5);

    // 计算思维导图在容器内的居中位置
    const offsetX = (containerWidth - mindmapWidth * finalScale) / 2 - bounds.minX * finalScale;
    const offsetY = (containerHeight - mindmapHeight * finalScale) / 2 - bounds.minY * finalScale;

    // 滚动页面，使容器居中显示在屏幕上
    const rect = container.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    // 计算需要滚动的位置，使容器中心对齐屏幕中心
    const targetScrollTop = scrollTop + rect.top - (window.innerHeight - containerHeight) / 2;
    const targetScrollLeft = scrollLeft + rect.left - (window.innerWidth - containerWidth) / 2;

    window.scrollTo({
      top: targetScrollTop,
      left: targetScrollLeft,
      behavior: 'smooth'
    });

    setMindmapScale(finalScale);
    setMindmapOffset({ x: offsetX, y: offsetY });
  };

  const handleMindmapReset = () => {
    setMindmapScale(1);
    setMindmapOffset({ x: 50, y: 50 });
  };

  // 计算任务树的布局尺寸
  interface MindMapNode {
    task: Task;
    x: number;
    y: number;
    width: number;
    height: number;
    children: MindMapNode[];
    level: number;
  }

  // 计算节点位置（根任务居中，子任务垂直向下布局）
  const calculateMindMapLayout = (tasks: Task[], containerWidth: number): MindMapNode[] => {
    const nodes: MindMapNode[] = [];
    const CARD_WIDTH = 280;
    const CARD_HEIGHT = 180;
    const LEVEL_SPACING = 60;
    const NODE_SPACING = 20;

    if (tasks.length === 0) return nodes;

    const rootTask = tasks[0];

    // 预先计算每个任务的子树高度（不包含该任务本身）
    const calculateRequiredHeight = (task: Task): number => {
      const hasChildren = task.children && task.children.length > 0 && expandedKeys.includes(task.task_id);
      if (!hasChildren) {
        return 0;
      }
      let totalHeight = 0;
      task.children.forEach((child) => {
        const childHeight = CARD_HEIGHT + calculateRequiredHeight(child);
        totalHeight += childHeight + NODE_SPACING;
      });
      return totalHeight - NODE_SPACING; // 减去最后一个间距
    };

    // 递归布局节点
    const layoutNode = (task: Task, level: number, startY: number): MindMapNode => {
      const hasChildren = task.children && task.children.length > 0 && expandedKeys.includes(task.task_id);
      const childNodes: MindMapNode[] = [];

      if (hasChildren) {
        // 第一步：递归布局所有子节点，从 startY 开始
        let currentY = startY;
        task.children.forEach((child) => {
          const childNode = layoutNode(child, level + 1, currentY);
          childNodes.push(childNode);
          // 子节点占据的总高度 = 卡片高度 + 子树高度
          const childTotalHeight = CARD_HEIGHT + calculateRequiredHeight(child);
          currentY += childTotalHeight + NODE_SPACING;
        });

        // 第二步：计算子节点组的实际范围
        const firstChildY = childNodes[0].y;
        const lastChild = childNodes[childNodes.length - 1];
        const lastChildBottom = lastChild.y + CARD_HEIGHT + calculateRequiredHeight(lastChild.task);
        const childrenTotalHeight = lastChildBottom - firstChildY;

        // 第三步：计算父节点的位置（垂直居中于子节点组）
        const parentY = firstChildY + (childrenTotalHeight - CARD_HEIGHT) / 2;

        return {
          task,
          x: 0,
          y: Math.max(startY, parentY),
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          children: childNodes,
          level,
        };
      }

      // 叶子节点
      return {
        task,
        x: 0,
        y: startY,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        children: childNodes,
        level,
      };
    };

    // 从 Y=80 开始布局
    const rootNode = layoutNode(rootTask, 0, 80);

    // 递归调整所有节点的x坐标
    const adjustXPositions = (node: MindMapNode, parentX: number) => {
      node.x = parentX;
      node.children.forEach((child) => {
        adjustXPositions(child, parentX + CARD_WIDTH + LEVEL_SPACING);
      });
    };

    adjustXPositions(rootNode, (containerWidth - CARD_WIDTH) / 2);

    nodes.push(rootNode);
    return nodes;
  };

  // 渲染思维导图节点
  const renderMindMapNode = (node: MindMapNode): React.ReactNode => {
    const { task, x, y, width, height, children, level } = node;
    const hasChildren = task.children && task.children.length > 0;
    const isExpanded = expandedKeys.includes(task.task_id);
    const statusIcon = getStatusIcon(task.status);
    const borderColor = getStatusBorderColor(task);
    const isOverdue = task.end_date && new Date(task.end_date) < new Date() && task.status !== 'completed';

    // 进度条颜色
    const getProgressColor = () => {
      if (isOverdue) return { from: '#EF4444', to: '#F87171' };
      if (task.progress >= 80) return { from: '#10B981', to: '#34D399' };
      if (task.progress >= 50) return { from: '#3B82F6', to: '#60A5FA' };
      if (task.progress >= 20) return { from: '#F59E0B', to: '#FBBF24' };
      return { from: '#EF4444', to: '#F87171' };
    };
    const progressColors = getProgressColor();

    return (
      <g key={task.task_id}>
        {/* Bezier curve connections */}
        {hasChildren && isExpanded && children.map((child) => {
          const startX = x + width;
          const startY = y + height / 2;
          const endX = child.x;
          const endY = child.y + child.height / 2;
          const midX = (startX + endX) / 2;

          // 判断连接线是否应该高亮
          const isHovered = hoveredNodeId === task.task_id || hoveredNodeId === child.task.task_id;
          const childMatches = nodeMatchesSearch(child.task.task_id);
          const shouldHighlight = isHovered || (searchKeyword && childMatches);

          return (
            <path
              key={`line-${child.task.task_id}`}
              d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
              stroke={shouldHighlight ? '#3B82F6' : '#d9d9d9'}
              strokeWidth={shouldHighlight ? '2.5' : '1.5'}
              fill="none"
              style={{
                transition: 'all 0.2s',
                opacity: searchKeyword && !childMatches ? 0.2 : 1,
              }}
            />
          );
        })}

        <foreignObject x={x} y={y} width={width} height={height}>
          <div
            {...({ xmlns: 'http://www.w3.org/1999/xhtml' } as any)}
            className={`mindmap-node-card ${searchKeyword && nodeMatchesSearch(task.task_id) ? 'node-highlighted' : ''} ${searchKeyword && !nodeMatchesSearch(task.task_id) ? 'node-dimmed' : ''}`}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '16px',
              border: `3px solid ${borderColor}`,
              background: '#FFFFFF',
              padding: '16px 14px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.12)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={() => {
              setHoveredNodeId(task.task_id);
            }}
            onMouseLeave={() => {
              setHoveredNodeId(null);
            }}
          >
            {/* 延期标签 */}
            {isOverdue && (
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                background: '#EF4444',
                color: '#fff',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)',
              }}>
                延期
              </div>
            )}

            {/* 标题区：剪贴板图标 + 任务名称 + 子节点数量 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '6px',
              paddingRight: isOverdue ? '50px' : '0',
            }}>
              {/* 剪贴板图标 */}
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(251, 146, 60, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                flexShrink: 0,
              }}>
                📋
              </div>
              {/* 任务名称 */}
              <span style={{
                flex: 1,
                fontSize: '16px',
                fontWeight: 600,
                color: '#1F2937',
                lineHeight: '1.4',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                borderBottom: '1px solid #E5E7EB',
                paddingBottom: '4px',
              }}>
                {task.task_name}
              </span>
              {/* 子节点数量 */}
              {hasChildren && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#9CA3AF',
                  backgroundColor: '#F3F4F6',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  flexShrink: 0,
                  marginLeft: '4px',
                }}>
                  {task.children?.length || 0} 个子任务
                </span>
              )}
            </div>

            {/* 分割线 */}
            <div style={{
              height: '2px',
              background: '#E5E7EB',
              marginBottom: '10px',
              marginTop: '10px',
            }} />

            {/* 负责人信息 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
            }}>
              {/* 人员图标 */}
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#6B46C1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                flexShrink: 0,
              }}>
                👤
              </div>
              <span style={{
                fontSize: '13px',
                fontWeight: 500,
                color: '#374151',
                letterSpacing: '0.02em',
              }}>
                {task.assignee_name || '未分配'}
              </span>
            </div>

            {/* 日期信息 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}>
              {/* 日历图标 */}
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '5px',
                background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                flexShrink: 0,
              }}>
                📅
              </div>
              <span style={{
                fontSize: '13px',
                fontWeight: 400,
                color: '#6B7280',
              }}>
                {task.start_date && task.end_date
                  ? `${dayjs(task.start_date).format('MM-DD')} ~ ${dayjs(task.end_date).format('MM-DD')}`
                  : '未设置日期'}
              </span>
            </div>

            {/* 进度条区域 */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: 'auto',
            }}>
              {/* 进度条容器 */}
              <div style={{
                height: '6px',
                background: '#E5E7EB',
                borderRadius: '3px',
                overflow: 'hidden',
                marginBottom: '8px',
              }}>
                <div
                  className="progress-fill shimmer"
                  style={{
                    width: `${task.progress || 0}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${progressColors.from}, ${progressColors.to})`,
                    borderRadius: '3px',
                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  } as React.CSSProperties}
                />
              </div>
              {/* 进度百分比 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '4px',
              }}>
                <span style={{
                  fontSize: '11px',
                  color: hasChildTasks(task) ? '#60A5FA' : '#9CA3AF',
                }}>
                  {hasChildTasks(task) ? '🔄 自动计算' : '✏️ 手动设置'}
                </span>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#9CA3AF',
                }}>
                  {task.progress}%
                </span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div
              className="wb-task-operations"
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                display: 'flex',
                gap: '6px',
                opacity: 0,
                transition: 'opacity 0.2s',
              }}
            >
              {hasChildren && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleExpand(task.task_id); }}
                  style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #d9d9d9', background: '#fff', cursor: 'pointer', fontSize: '14px', padding: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                  title={isExpanded ? '折叠' : '展开'}
                >
                  {isExpanded ? '−' : '+'}
                </button>
              )}
              <button onClick={(e) => { e.stopPropagation(); handleEdit(task); }} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #d9d9d9', background: '#fff', cursor: 'pointer', fontSize: '14px', padding: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} title="编辑">✏️</button>
              <button onClick={(e) => { e.stopPropagation(); handleAdd(task.task_id); }} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #d9d9d9', background: '#fff', cursor: 'pointer', fontSize: '14px', padding: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} title="新建子任务">➕</button>
              <Popconfirm
                title="确认删除"
                description="确定要删除这个任务吗？"
                onConfirm={(e) => { e?.stopPropagation(); handleDelete(task.task_id); }}
                okText="确定"
                cancelText="取消"
              >
                <button style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #d9d9d9', background: '#fff', cursor: 'pointer', fontSize: '14px', padding: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} title="删除">🗑️</button>
              </Popconfirm>
            </div>
          </div>
        </foreignObject>

        {/* Recursively render children */}
        {children.map((child) => renderMindMapNode(child))}
      </g>
    );
  };

  // 渲染横向思维导图
  const renderMindMapView = (): React.ReactNode => {
    // 获取容器实际宽度用于居中计算
    const containerWidth = mindmapContainerRef.current?.clientWidth || 1200;
    const nodes = calculateMindMapLayout(tasks, containerWidth);

    // 计算总尺寸
    let maxX = 0;
    let maxY = 0;
    const findMax = (nodeList: MindMapNode[]) => {
      nodeList.forEach((node) => {
        maxX = Math.max(maxX, node.x + node.width);
        maxY = Math.max(maxY, node.y + node.height);
        if (node.children.length > 0) {
          findMax(node.children);
        }
      });
    };
    findMax(nodes);

    const svgWidth = Math.max(maxX + 200, containerWidth);
    const svgHeight = Math.max(maxY + 100, 600);

    return (
      <div
        className="mindmap-grid-bg"
        ref={mindmapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          borderRadius: '8px',
          border: '1px solid #e8e8e8',
          position: 'relative',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
        onWheelCapture={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const delta = e.deltaY > 0 ? -0.1 : 0.1;
          setMindmapScale(prev => Math.max(0.5, Math.min(2, prev + delta)));
        }}
        onMouseDown={handleMindmapMouseDown}
        onMouseMove={handleMindmapMouseMove}
        onMouseUp={handleMindmapMouseUp}
        onMouseLeave={handleMindmapMouseLeave}
      >
        <div
          style={{
            transform: `translate(${mindmapOffset.x}px, ${mindmapOffset.y}px) scale(${mindmapScale})`,
            transformOrigin: 'top left',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          <svg
            width={svgWidth}
            height={svgHeight}
            style={{
              display: 'block',
            }}
          >
            {nodes.map((node) => renderMindMapNode(node))}
          </svg>
        </div>

        {/* 悬浮操作按钮 - 4按钮布局 */}
        <div style={{
          position: 'absolute',
          bottom: '24px',
          right: '24px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          zIndex: 10,
        }}>
          <Button
            icon={<ZoomInOutlined />}
            onClick={handleMindmapZoomIn}
            style={{
              borderRadius: '6px',
              width: '38px',
              height: '38px',
              background: '#4A90E2',
              border: 'none',
              color: '#fff',
            }}
            title="放大"
          />
          <Button
            icon={<ZoomOutOutlined />}
            onClick={handleMindmapZoomOut}
            style={{
              borderRadius: '6px',
              width: '38px',
              height: '38px',
              background: '#4A90E2',
              border: 'none',
              color: '#fff',
            }}
            title="缩小"
          />
          <Button
            icon={<FullscreenOutlined />}
            onClick={handleMindmapFit}
            style={{
              borderRadius: '6px',
              width: '38px',
              height: '38px',
              background: '#4A90E2',
              border: 'none',
              color: '#fff',
            }}
            title="适应屏幕"
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={handleMindmapReset}
            style={{
              borderRadius: '6px',
              width: '38px',
              height: '38px',
              background: '#4A90E2',
              border: 'none',
              color: '#fff',
            }}
            title="重置"
          />
        </div>
      </div>
    );
  };

  // 渲染任务卡片
  const renderTaskCard = (task: Task, level: number = 0, isLastChild: boolean = true): React.ReactNode => {
    const isExpanded = expandedKeys.includes(task.task_id);
    const hasChildren = task.children && task.children.length > 0;
    const statusIcon = getStatusIcon(task.status);
    const priorityBadge = getPriorityBadge(task.priority || 'medium');
    const isCompleted = task.status === 'completed';
    const isRoot = level === 0;

    return (
      <div key={task.task_id} className={`wb-task-node ${level > 0 ? 'wb-task-child' : ''}`} style={{ marginBottom: level > 0 ? '12px' : '16px' }}>
        {/* 任务卡片 */}
        <div
          className="wb-task-card"
          style={{
            border: '1px solid #e8e8e8',
            borderRadius: '8px',
            padding: '14px',
            background: '#fff',
            transition: 'all 0.2s',
            position: 'relative',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#4A90E2';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(74, 144, 226, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e8e8e8';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
          }}
        >
          {/* 任务头部 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
            {/* 展开/折叠按钮 */}
            {hasChildren ? (
              <button
                className="wb-expand-btn"
                onClick={() => toggleExpand(task.task_id)}
                style={{
                  width: '24px',
                  height: '24px',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '6px',
                  background: isExpanded
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : '#fff',
                  color: isExpanded ? '#fff' : '#6b7280',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  padding: '0',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  flexShrink: 0,
                  marginTop: '2px',
                  boxShadow: isExpanded
                    ? '0 2px 8px rgba(99, 102, 241, 0.3)'
                    : '0 1px 3px rgba(0, 0, 0, 0.05)',
                }}
                onMouseEnter={(e) => {
                  if (!isExpanded) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9, #e2e8f0)';
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isExpanded) {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                  }
                }}
              >
                {isExpanded ? '−' : '+'}
              </button>
            ) : (
              <div style={{ width: '24px', flexShrink: 0 }} />
            )}

            {/* 状态图标 */}
            <div
              className="wb-status-icon"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                background: `linear-gradient(135deg, ${statusIcon.color}, ${statusIcon.color}dd)`,
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              }}
            >
              {statusIcon.icon}
            </div>

            {/* 任务信息区 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* 任务标题 */}
              <div style={{ marginBottom: '6px' }}>
                <span style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#1e293b',
                  lineHeight: '1.4',
                }}>
                  {task.task_name}
                </span>
              </div>

              {/* 任务副标题/描述 */}
              {task.task_desc && (
                <div style={{ marginBottom: '8px' }}>
                  <span style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    lineHeight: '1.4',
                  }}>
                    {task.task_desc}
                  </span>
                </div>
              )}

              {/* 元数据网格 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '8px 16px',
                fontSize: '13px',
                color: '#6b7280',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>👤</span>
                  <span>{task.assignee_name || '未分配'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>📅</span>
                  <span>{formatDateRange(task)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>⏱</span>
                  <span>{task.estimated_hours || 0}小时</span>
                </div>
              </div>
            </div>

            {/* 右侧：进度圆圈和优先级 */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '8px',
              flexShrink: 0,
            }}>
              {/* 优先级标签 */}
              <span
                className="wb-priority-badge"
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: priorityBadge.bgColor,
                  color: priorityBadge.textColor,
                  whiteSpace: 'nowrap',
                }}
              >
                {priorityBadge.text}
              </span>

              {/* 进度圆圈 */}
              <div
                className="wb-progress-circle"
                style={{
                  '--progress': `${task.progress}%`,
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  position: 'relative',
                  background: `conic-gradient(
                    from 0deg,
                    ${task.progress >= 80 ? '#10b981' :
                      task.progress >= 50 ? '#6366f1' :
                      task.progress >= 20 ? '#8b5cf6' : '#f59e0b'} 0%,
                    ${task.progress >= 80 ? '#10b981' :
                      task.progress >= 50 ? '#6366f1' :
                      task.progress >= 20 ? '#8b5cf6' : '#f59e0b'} ${task.progress}%,
                    #e2e8f0 ${task.progress}%,
                    #e2e8f0 100%
                  )`,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                } as React.CSSProperties}
              >
                <div style={{
                  position: 'absolute',
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: '#fafbfc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{ position: 'relative', zIndex: 1, color: '#1e293b' }}>
                    {task.progress}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 操作按钮栏 */}
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
            paddingTop: '12px',
            borderTop: '1px solid rgba(99, 102, 241, 0.1)',
          }}>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(task)}
              style={{ padding: '0 8px', fontSize: '13px' }}
            >
              编辑
            </Button>
            <Popconfirm
              title="确定要删除这个任务吗？"
              onConfirm={() => handleDelete(task.task_id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                style={{ padding: '0 8px', fontSize: '13px' }}
              >
                删除
              </Button>
            </Popconfirm>
            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => handleAdd(task.task_id)}
              style={{ padding: '0 8px', fontSize: '13px', color: '#10b981' }}
            >
              新建子任务
            </Button>
          </div>
        </div>

        {/* 子任务 */}
        {hasChildren && isExpanded && (
          <div className="wb-task-children" style={{
            marginTop: '12px',
            position: 'relative',
          }}>
            {/* 连接线 */}
            <div style={{
              position: 'absolute',
              left: '28px',
              top: '0',
              bottom: '16px',
              width: '2px',
              background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.1))',
            }} />
            {task.children!.map((child, index) => (
              <div key={child.task_id} style={{ position: 'relative' }}>
                {/* 横向分支线 */}
                <div style={{
                  position: 'absolute',
                  left: '12px',
                  top: '24px',
                  width: '18px',
                  height: '2px',
                  background: 'rgba(99, 102, 241, 0.2)',
                }} />
                {renderTaskCard(child, level + 1, index === task.children!.length - 1)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      padding: '0 16px 16px 16px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      minHeight: '100vh'
    }}>
      {/* 面包屑导航栏 - 居中对齐，视图切换在右侧 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        background: '#fff',
        padding: '12px 20px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}>
        {/* 左侧：面包屑导航 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            style={{ paddingLeft: 0, color: '#4A90E2' }}
          >
            返回
          </Button>
          <span style={{ color: '#d9d9d9' }}>|</span>
          <span style={{ fontSize: '14px', color: '#262626', fontWeight: 500 }}>工作分解结构</span>
          {selectedProject && (
            <>
              <span style={{ color: '#d9d9d9' }}>›</span>
              <span style={{ fontSize: '14px', color: '#4A90E2', fontWeight: 500 }}>
                {selectedProject.contract_name}
              </span>
            </>
          )}
        </div>

        {/* 右侧：视图切换和项目详情 */}
        {selectedProjectId && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Segmented
              value={viewMode}
              onChange={(value) => setViewMode(value as 'mindmap' | 'tree')}
              options={[
                {
                  label: (
                    <span style={{ fontSize: '13px' }}>
                      <ApartmentOutlined style={{ marginRight: 4 }} />
                      思维导图
                    </span>
                  ),
                  value: 'mindmap',
                },
                {
                  label: (
                    <span style={{ fontSize: '13px' }}>
                      <TableOutlined style={{ marginRight: 4 }} />
                      表格视图
                    </span>
                  ),
                  value: 'tree',
                },
              ]}
              style={{
                backgroundColor: '#f5f5f5',
              }}
            />
            <Button
              icon={<SettingOutlined />}
              onClick={() => setShowProjectDetail(true)}
              style={{
                borderRadius: '8px',
                background: '#4A90E2',
                border: 'none',
                color: '#fff',
                fontWeight: 500,
              }}
            >
              项目详情
            </Button>
          </div>
        )}
      </div>

      {/* 主内容区域：左右分栏布局 */}
      <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 80px)' }}>

        {/* 左侧：项目列表 - 垂直列表布局 */}
        <div style={{
          width: '280px',
          background: '#fff',
          borderRadius: '12px',
          padding: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e8e8e8',
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '1px solid #f0f0f0',
            color: '#262626',
          }}>
            项目列表
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredProjectList.map((project: any) => {
              const isSelected = selectedProjectId === project.project_id;
              const typeIcon = getProjectTypeIcon(project.project_type);

              // 进度颜色
              const getProgressColor = (progress: number) => {
                if (progress >= 80) return '#52c41a';
                if (progress >= 50) return '#4A90E2';
                if (progress >= 20) return '#faad14';
                return '#f5222d';
              };

              return (
                <div
                  key={project.project_id}
                  className={`wb-project-card ${isSelected ? 'wb-project-card-selected' : ''}`}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: isSelected ? '#e6f7ff' : '#fff',
                    border: `1px solid ${isSelected ? '#4A90E2' : '#e8e8e8'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginBottom: '8px',
                  }}
                  onClick={() => setSelectedProjectId(project.project_id)}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#4A90E2';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(74, 144, 226, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#e8e8e8';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {/* 项目名称 + 进度百分比 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: isSelected ? 600 : 500,
                        color: isSelected ? '#4A90E2' : '#262626',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {project.contract_name}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: getProgressColor(project.progress),
                      marginLeft: '8px',
                    }}>
                      {project.progress}%
                    </span>
                  </div>

                  {/* 任务数量 + 负责人 */}
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#8c8c8c' }}>
                    <span>📊 {project.task_count ?? 0}个任务</span>
                    <span>👤 {project.leader_name || '未分配'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右侧：任务树区域 */}
        <div style={{
          flex: 1,
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e8e8e8',
        }}>
          {!selectedProjectId ? (
            <Empty
              description="请从左侧选择一个项目查看任务"
              style={{ marginTop: '80px' }}
            />
          ) : (
            <>
              {/* 操作按钮栏 */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px',
                paddingBottom: '16px',
                borderBottom: '1px solid #f0f0f0',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleAdd(null)}
                  style={{
                    background: '#4A90E2',
                    border: 'none',
                    borderRadius: '6px',
                  }}
                >
                  新建任务
                </Button>
                <Button
                  icon={<DownOutlined />}
                  onClick={() => setExpandedKeys(getAllKeys(tasks))}
                >
                  展开全部
                </Button>
                <Button
                  icon={<RightOutlined />}
                  onClick={() => setExpandedKeys([])}
                >
                  折叠全部
                </Button>
                <Input
                  placeholder="搜索任务..."
                  prefix={<SearchOutlined />}
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  allowClear
                  style={{
                    width: '200px',
                    borderRadius: '6px',
                  }}
                />

                {/* 项目进度计算和同步 */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginLeft: 'auto',
                  alignItems: 'center',
                }}>
                  <span style={{
                    fontSize: '13px',
                    color: '#666',
                    whiteSpace: 'nowrap',
                  }}>
                    计算进度:
                  </span>
                  <Button
                    icon={<ApartmentOutlined />}
                    onClick={handleCalculateProjectProgress}
                    style={{
                      borderRadius: '6px',
                      borderColor: '#4A90E2',
                      color: '#4A90E2',
                    }}
                  >
                    计算所有项目进度
                  </Button>
                  <Button
                    icon={<ExportOutlined />}
                    onClick={handleSyncProjectProgress}
                    style={{
                      borderRadius: '6px',
                      borderColor: '#52c41a',
                      color: '#52c41a',
                    }}
                  >
                    同步到台账
                  </Button>
                  {calculatedProjectProgress > 0 && (
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#4A90E2',
                      padding: '4px 12px',
                      background: '#e6f7ff',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                    }}>
                      计算值: {calculatedProjectProgress}%
                    </span>
                  )}
                </div>
              </div>

              {/* 任务列表 */}
              <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                {tasks && tasks.length > 0 ? (
                  <>
                    {viewMode === 'tree' ? (
                      <div>
                        {tasks.map(task => renderTaskCard(task))}
                      </div>
                    ) : (
                      renderMindMapView()
                    )}
                  </>
                ) : (
                  <Empty
                    description="该项目暂无任务，点击 &quot;新建任务&quot; 开始创建工作分解结构"
                    style={{ marginTop: '60px' }}
                  >
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd(null)}>
                      新建任务
                    </Button>
                  </Empty>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 任务表单弹窗 */}
      <Modal
        title={editingTask ? '编辑任务' : '新建任务'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        width={600}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="任务名称"
            name="task_name"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="请输入任务名称" />
          </Form.Item>

          <Form.Item label="任务描述" name="task_desc">
            <TextArea rows={3} placeholder="请输入任务描述" />
          </Form.Item>

          <Form.Item
            label="负责人"
            name="assigned_to"
            rules={[{ required: true, message: '请选择负责人' }]}
          >
            <Select placeholder="请选择负责人">
              {usersList.map((user: any) => (
                <Option key={user.user_id} value={user.user_id}>
                  {user.full_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="起止日期">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Form.Item name="start_date" noStyle>
                <DatePicker placeholder="开始日期" style={{ width: 200 }} />
              </Form.Item>
              <span>至</span>
              <Form.Item name="end_date" noStyle>
                <DatePicker placeholder="结束日期" style={{ width: 200 }} />
              </Form.Item>
            </div>
          </Form.Item>

          <Form.Item label="预计工时（小时）" name="estimated_hours">
            <InputNumber min={0} placeholder="请输入预计工时" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="优先级"
            name="priority"
            initialValue="medium"
          >
            <Select>
              <Option value="low">低</Option>
              <Option value="medium">中</Option>
              <Option value="high">高</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            initialValue="pending"
          >
            <Select>
              <Option value="pending">未开始</Option>
              <Option value="in_progress">进行中</Option>
              <Option value="completed">已完成</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="进度（%）"
            name="progress"
            initialValue={0}
            tooltip={editingTask && hasChildTasks(editingTask) ? "该任务有子任务，进度由子任务自动计算" : ""}
          >
            <InputNumber
              min={0}
              max={100}
              style={{ width: '100%' }}
              disabled={editingTask && hasChildTasks(editingTask)}
              placeholder={editingTask && hasChildTasks(editingTask) ? "自动计算" : "请输入进度"}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 内联样式 */}
      <style>{`
        .wb-task-node {
          position: relative;
        }

        .wb-task-card {
          position: relative;
          box-sizing: border-box;
        }

        .wb-expand-btn:hover {
          transform: scale(1.05);
        }

        .wb-status-icon {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .wb-priority-badge {
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .wb-progress-circle {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s ease;
        }

        .wb-progress-circle:hover {
          transform: scale(1.05);
        }

        .wb-task-children {
          box-sizing: border-box;
        }

        @keyframes wb-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .wb-status-icon[data-status="risk"] {
          animation: wb-pulse 2s infinite;
        }

        /* Mind map card styles */
        .wb-mindmap-card {
          transition: all 0.2s ease;
        }

        .wb-task-operations {
          pointer-events: auto;
        }

        .wb-task-operations button {
          pointer-events: auto;
        }

        .wb-task-operations button:hover {
          background: '#f0f0f0 !important';
          transform: scale(1.1);
        }

        /* Mind map node card hover shows operations */
        .mindmap-node-card:hover .wb-task-operations {
          opacity: 1 !important;
        }

        .mindmap-node-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12) !important;
          transform: translateY(-2px);
        }

        /* 进度条流光动画 */
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .progress-fill.shimmer::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
          animation: shimmer 2s infinite;
        }

        /* 网格背景 */
        .mindmap-grid-bg {
          background-image:
            linear-gradient(to right, #e8e8e8 1px, transparent 1px),
            linear-gradient(to bottom, #e8e8e8 1px, transparent 1px);
          background-size: 20px 20px;
          position: relative;
        }

        .mindmap-grid-bg::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(147, 197, 253, 0.02) 100%);
          pointer-events: none;
        }

        /* 高亮搜索结果 */
        .node-highlighted {
          filter: drop-shadow(0 0 8px rgba(255, 204, 0, 0.6));
        }

        .node-dimmed {
          opacity: 0.3;
        }
      `}</style>

      {/* 项目详情悬浮卡片 */}
      {showProjectDetail && selectedProject && (
        <>
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '480px',
            maxHeight: '80vh',
            background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.2), 0 2px 8px rgba(0, 0, 0, 0.05)',
            zIndex: 1000,
            overflow: 'hidden',
            border: '1px solid rgba(99, 102, 241, 0.1)',
          }}
        >
          {/* 标题栏 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.03), rgba(139, 92, 246, 0.03))',
          }}>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#262626' }}>
              📋 项目详情
            </span>
            <button
              onClick={() => setShowProjectDetail(false)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '20px',
                color: '#8c8c8c',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f5f5f5';
                e.currentTarget.style.color = '#262626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#8c8c8c';
              }}
            >
              ×
            </button>
          </div>

          {/* 内容区域 */}
          <div style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(80vh - 60px)' }}>
            {/* Project name and type */}
            <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(99, 102, 241, 0.1)' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#1e293b' }}>
                {getProjectTypeIcon(selectedProject.project_type)} {selectedProject.contract_name}
              </h3>
              <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
                  color: '#6366f1',
                  fontWeight: 500,
                }}>
                  {selectedProject.project_type}
                </span>
                <span style={{ color: '#666' }}>进度 {selectedProject.progress}%</span>
                <span style={{ color: '#666' }}>{selectedProject.status === 'active' ? '进行中' : '已归档'}</span>
              </div>
            </div>

            {/* Task statistics grid */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#262626' }}>
                📊 任务统计
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div style={{ textAlign: 'center', padding: '16px', background: 'linear-gradient(145deg, #ffffff, #f8fafc)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.1)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#6366f1' }}>
                    {getProjectTaskStats(selectedProject.project_id).total}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>总任务</div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', background: 'linear-gradient(145deg, #ffffff, #f8fafc)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.1)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#52c41a' }}>
                    {getProjectTaskStats(selectedProject.project_id).completed}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>已完成</div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', background: 'linear-gradient(145deg, #ffffff, #f8fafc)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.1)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#faad14' }}>
                    {getProjectTaskStats(selectedProject.project_id).inProgress}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>进行中</div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', background: 'linear-gradient(145deg, #ffffff, #f8fafc)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.1)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#8c8c8c' }}>
                    {getProjectTaskStats(selectedProject.project_id).pending}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>未开始</div>
                </div>
              </div>
            </div>

            {/* Project details: dates, budget, hours, manager */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#1e293b' }}>
                📅 项目信息
              </div>
              <div style={{ fontSize: '14px', color: '#595959', lineHeight: '2.2' }}>
                <div><strong style={{ color: '#1e293b', fontWeight: 600 }}>工期：</strong>{selectedProject.start_date && selectedProject.end_date
                  ? `${selectedProject.start_date} 至 ${selectedProject.end_date}`
                  : '未设置'}</div>
                <div><strong style={{ color: '#1e293b', fontWeight: 600 }}>预算：</strong>{selectedProject.budget ? `${Number(selectedProject.budget).toLocaleString()}万元` : '未设置'}</div>
                <div><strong style={{ color: '#1e293b', fontWeight: 600 }}>预计工时：</strong>{selectedProject.estimated_hours ? `${selectedProject.estimated_hours}小时` : '未设置'}</div>
                <div><strong style={{ color: '#1e293b', fontWeight: 600 }}>项目经理：</strong>{selectedProject.project_manager || '未分配'}</div>
              </div>
            </div>

            {/* Project notes */}
            {selectedProject.remark && (
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#1e293b' }}>
                  📝 项目备注
                </div>
                <div style={{
                  padding: '12px 16px',
                  background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#595959',
                  lineHeight: '1.8',
                  border: '1px solid rgba(99, 102, 241, 0.1)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                }}>
                  {selectedProject.remark}
                </div>
              </div>
            )}
          </div>
        </div>
        </>
      )}

      {/* 遮罩层 */}
      {showProjectDetail && (
        <div
          onClick={() => setShowProjectDetail(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            zIndex: 999,
          }}
        />
      )}
    </div>
  );
};

export default WorkBreakdown;
