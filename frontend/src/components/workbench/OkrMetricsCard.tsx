import React from 'react';
import { Tag } from 'antd';
import type { OkrMetric } from '../../types/tasks';
import '../../pages/Workbench.css';

interface OkrMetricsCardProps {
  data?: OkrMetric[];
}

const defaultData: OkrMetric[] = [
  { id: 1, name: '主承建鲁班奖，评优', type: 'actual', progress: 60 },
  { id: 2, name: '工程项目管理优秀奖', type: 'target', progress: 80 },
  { id: 3, name: '国家一级协会科技奖', type: 'completed', progress: 100 },
  { id: 4, name: '省部级课题立项', type: 'actual', progress: 45 },
  { id: 5, name: 'BIM技术应用示范项目', type: 'target', progress: 70 },
];

const OkrMetricsCard: React.FC<OkrMetricsCardProps> = ({ data = defaultData }) => {
  // 根据类型获取标签配置
  const getTagConfig = (type: OkrMetric['type']) => {
    switch (type) {
      case 'actual':
        return { text: '实际', color: '#3B82F6', bgColor: '#DBEAFE' };
      case 'target':
        return { text: '目标', color: '#8B5CF6', bgColor: '#EDE9FE' };
      case 'completed':
        return { text: '完成', color: '#10B981', bgColor: '#D1FAE5' };
      default:
        return { text: '实际', color: '#3B82F6', bgColor: '#DBEAFE' };
    }
  };

  return (
    <div className="wb-card wb-okr-metrics-card">
      <h3 className="wb-card-title">OKR任务完成指标</h3>

      <div className="wb-okr-metrics-list">
        {data.map((metric) => {
          const tagConfig = getTagConfig(metric.type);
          return (
            <div key={metric.id} className="wb-okr-metric-item">
              <div className="wb-okr-metric-header">
                <span className="wb-okr-metric-name">{metric.name}</span>
                <Tag
                  style={{
                    color: tagConfig.color,
                    backgroundColor: tagConfig.bgColor,
                    border: 'none',
                    padding: '4px 8px',
                    fontSize: '12px',
                  }}
                >
                  {tagConfig.text}
                </Tag>
              </div>
              <div className="wb-okr-metric-progress">
                <div
                  className="wb-okr-metric-progress-bar"
                  style={{
                    width: `${metric.progress}%`,
                    backgroundColor: tagConfig.color,
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OkrMetricsCard;
