import React from 'react';
import { FolderOutlined, DownOutlined } from '@ant-design/icons';
import { Dropdown, Button } from 'antd';
import type { MenuProps } from 'antd';
import '../../pages/Workbench.css';

interface Project {
  project_id: number;
  contract_name: string;
  start_date: string;
  end_date: string;
  contract_amount: string;
  progress: number;
}

interface ProjectHeaderCardProps {
  currentProject?: Project;
  allProjects?: Project[];
  onProjectChange?: (projectId: number) => void;
}

// 计算两个日期之间的天数
const calculateDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// 格式化合同金额（万元）
const formatContractAmount = (amount: string): string => {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0';
  return num.toLocaleString();
};

const ProjectHeaderCard: React.FC<ProjectHeaderCardProps> = ({
  currentProject,
  allProjects = [],
  onProjectChange,
}) => {
  // 如果没有当前项目且有项目列表，默认选择第一个
  const project = currentProject || (allProjects.length > 0 ? allProjects[0] : undefined);

  // 创建项目切换菜单
  const projectMenuItems: MenuProps['items'] = allProjects.map((p) => ({
    key: p.project_id.toString(),
    label: p.contract_name,
    onClick: () => onProjectChange?.(p.project_id),
  }));

  const totalDays = project ? calculateDays(project.start_date, project.end_date) : 0;
  const contractAmount = project ? formatContractAmount(project.contract_amount) : '0';
  const progress = project?.progress || 0;

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="wb-card wb-project-header-card">
      {/* 项目标题区 + 统计信息 */}
      <div className="wb-project-header-title-row">
        <div className="wb-project-header-left">
          <FolderOutlined className="wb-project-icon" />
          <h3 className="wb-project-name">{project?.contract_name || '请选择项目'}</h3>
        </div>

        <div className="wb-project-header-stats">
          {/* 总工期 */}
          <div className="wb-project-header-stat">
            <span className="wb-project-stat-label">总工期</span>
            <span className="wb-project-stat-value">{totalDays}</span>
            <span className="wb-project-stat-unit">天</span>
          </div>

          {/* 合同额 */}
          <div className="wb-project-header-stat">
            <span className="wb-project-stat-label">合同额</span>
            <span className="wb-project-stat-value">{contractAmount}</span>
            <span className="wb-project-stat-unit">万元</span>
          </div>

          {/* 切换项目按钮 */}
          <Dropdown menu={{ items: projectMenuItems }} trigger={['click']}>
            <Button className="wb-switch-project-btn">
              切换项目 <DownOutlined />
            </Button>
          </Dropdown>
        </div>
      </div>

      {/* 项目进度信息 */}
      <div className="wb-project-progress-info">
        {/* 第一行：进度标签 + 百分比 */}
        <div className="wb-progress-row-first">
          <span className="wb-progress-label">项目进度</span>
          <div className="wb-progress-percent">{progress}%</div>
        </div>

        {/* 第二行：日期范围 */}
        {project && (
          <div className="wb-progress-row-second">
            <span className="wb-date-range">
              {formatDate(project.start_date)} 至 {formatDate(project.end_date)}
            </span>
          </div>
        )}

        {/* 进度条 */}
        <div className="wb-progress-bar-container">
          <div className="wb-progress-bar-wrapper">
            <div
              className="wb-progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectHeaderCard;
