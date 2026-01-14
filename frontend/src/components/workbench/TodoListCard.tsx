import React, { useEffect, useState } from 'react';
import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { useProjectTasks } from '../../hooks/useTasks';
import '../../pages/Workbench.css';

interface TodoItem {
  key: string;
  taskName: string;
  taskType: string;
  deadline: string;
  initiator: string;
  status: 'normal' | 'urgent';
  priority: string;
  taskStatus: string;
}

interface TodoListCardProps {
  projectId?: number;
  onHandle?: (record: TodoItem) => void;
}

// 将工作分解的任务转换为待办列表格式
const convertTasksToTodoItems = (tasks: any[]): TodoItem[] => {
  if (!tasks) return [];

  return tasks.map((task) => {
    const endDate = new Date(task.end_date);
    const now = new Date();
    const isOverdue = endDate < now;
    const isUrgent = task.priority === 'high' || isOverdue;

    return {
      key: task.task_id.toString(),
      taskName: task.task_name,
      taskType: task.task_type || '任务',
      deadline: task.end_date,
      initiator: task.assignee_name || '系统',
      status: isUrgent ? 'urgent' : 'normal',
      priority: task.priority || 'medium',
      taskStatus: task.status || 'not_started',
    };
  });
};

const TodoListCard: React.FC<TodoListCardProps> = ({
  projectId,
  onHandle,
}) => {
  const navigate = useNavigate();
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);

  // 获取项目任务数据
  const { data: projectTasks } = useProjectTasks(projectId || 0);

  // 当任务数据更新时，转换数据格式
  useEffect(() => {
    if (projectTasks?.data) {
      const items = convertTasksToTodoItems(projectTasks.data);
      // 只显示未完成的任务
      const incompleteTasks = items.filter(
        (item) => item.taskStatus !== 'completed'
      );
      setTodoItems(incompleteTasks.slice(0, 5)); // 只显示前5条
    }
  }, [projectTasks]);

  const columns: ColumnsType<TodoItem> = [
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 200,
    },
    {
      title: '任务类型',
      dataIndex: 'taskType',
      key: 'taskType',
      width: 120,
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: '截止时间',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 180,
      render: (date: string) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      },
    },
    {
      title: '负责人',
      dataIndex: 'initiator',
      key: 'initiator',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        if (status === 'urgent') {
          return <Tag color="error">紧急</Tag>;
        }
        return <Tag color="success">正常</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <a
          className="wb-handle-link"
          onClick={() => onHandle?.(record)}
        >
          办理
        </a>
      ),
    },
  ];

  const handleViewMore = () => {
    navigate('/work-breakdown');
  };

  return (
    <div className="wb-card wb-todo-list-card">
      <div className="wb-todo-list-header">
        <h3 className="wb-card-title">待办列表</h3>
        <a className="wb-view-more-link" onClick={handleViewMore}>
          查看更多 &gt;
        </a>
      </div>

      <Table
        columns={columns}
        dataSource={todoItems}
        pagination={false}
        size="small"
        className="wb-todo-table"
        rowClassName="wb-todo-table-row"
        locale={{ emptyText: '暂无待办任务' }}
      />
    </div>
  );
};

export default TodoListCard;
