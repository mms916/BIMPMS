import React from 'react';
import { FileTextOutlined, PlusOutlined, BarChartOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../../pages/Workbench.css';

interface QuickFunction {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  path?: string;
}

const quickFunctions: QuickFunction[] = [
  {
    id: '1',
    name: '我的工作',
    icon: <FileTextOutlined />,
    color: '#3B82F6',
    path: '/workbench',
  },
  {
    id: '2',
    name: '新建任务',
    icon: <PlusOutlined />,
    color: '#10B981',
    path: '/work-breakdown',
  },
  {
    id: '3',
    name: '数据大屏',
    icon: <BarChartOutlined />,
    color: '#F59E0B',
  },
  {
    id: '4',
    name: '新建会议',
    icon: <CalendarOutlined />,
    color: '#3B82F6',
  },
];

const QuickFunctionsCard: React.FC = () => {
  const navigate = useNavigate();

  const handleFunctionClick = (func: QuickFunction) => {
    if (func.path) {
      navigate(func.path);
    }
  };

  return (
    <div className="wb-card wb-quick-functions-card">
      <h3 className="wb-card-title">常用功能</h3>

      <div className="wb-functions-grid">
        {quickFunctions.map((func) => (
          <button
            key={func.id}
            className="wb-function-btn"
            style={{ backgroundColor: func.color }}
            onClick={() => handleFunctionClick(func)}
          >
            <div className="wb-function-icon">{func.icon}</div>
            <div className="wb-function-name">{func.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickFunctionsCard;
