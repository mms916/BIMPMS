import React, { useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { createTeamStatsChartOption } from '../../utils/chartUtils';
import type { TeamMemberStats } from '../../types/tasks';
import '../../pages/Workbench.css';

interface TeamStatsChartProps {
  data?: TeamMemberStats[];
  period?: string;
  onPeriodChange?: (period: string) => void;
}

const periods = ['今天', '本周', '本月', '自定义'];

const TeamStatsChart: React.FC<TeamStatsChartProps> = ({
  data = [],
  period = '本周',
  onPeriodChange,
}) => {
  const chartRef = useRef<ReactECharts>(null);

  const chartOption = React.useMemo(() => {
    return createTeamStatsChartOption(data);
  }, [data]);

  const handlePeriodClick = (newPeriod: string) => {
    onPeriodChange?.(newPeriod);
  };

  return (
    <div className="wb-card wb-team-stats-card">
      {/* 标题栏 */}
      <div className="wb-team-stats-header">
        <h3 className="wb-card-title">团队工作项数及工时统计</h3>

        {/* 时间筛选器 */}
        <div className="wb-period-filter">
          {periods.map((p) => (
            <button
              key={p}
              className={`wb-period-filter-btn ${period === p ? 'wb-period-filter-active' : ''}`}
              onClick={() => handlePeriodClick(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* 图表 */}
      <ReactECharts
        ref={chartRef}
        option={chartOption}
        style={{ height: '300px' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
};

export default TeamStatsChart;
