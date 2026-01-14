import React from 'react';
import ReactECharts from 'echarts-for-react';
import { createTaskCompletionChartOption } from '../../utils/chartUtils';
import type { TaskCompletionStats } from '../../types/tasks';
import '../../pages/Workbench.css';

interface TaskCompletionCardProps {
  data?: TaskCompletionStats;
}

const defaultData: TaskCompletionStats = {
  completed: 8,
  inProgress: 6,
  overdue: 2,
  notStarted: 5,
  total: 21,
  completionRate: 46,
};

const TaskCompletionCard: React.FC<TaskCompletionCardProps> = ({
  data = defaultData,
}) => {
  const chartOption = React.useMemo(() => {
    return createTaskCompletionChartOption(data);
  }, [data]);

  return (
    <div className="wb-card wb-task-completion-card">
      <h3 className="wb-card-title">任务完成情况</h3>

      {/* 环形图 */}
      <ReactECharts
        option={chartOption}
        style={{ height: '160px' }}
        opts={{ renderer: 'canvas' }}
      />

      {/* 统计信息 */}
      <div className="wb-completion-stats">
        <div className="wb-stat-item">
          <span className="wb-stat-dot wb-stat-blue"></span>
          <span className="wb-stat-label">已完成</span>
          <span className="wb-stat-value">{data.completed}</span>
        </div>
        <div className="wb-stat-item">
          <span className="wb-stat-dot wb-stat-purple"></span>
          <span className="wb-stat-label">进行中</span>
          <span className="wb-stat-value">{data.inProgress}</span>
        </div>
        <div className="wb-stat-item">
          <span className="wb-stat-dot wb-stat-orange"></span>
          <span className="wb-stat-label">已逾期</span>
          <span className="wb-stat-value">{data.overdue}</span>
        </div>
        <div className="wb-stat-item">
          <span className="wb-stat-dot wb-stat-green"></span>
          <span className="wb-stat-label">未开始</span>
          <span className="wb-stat-value">{data.notStarted}</span>
        </div>
      </div>
    </div>
  );
};

export default TaskCompletionCard;
