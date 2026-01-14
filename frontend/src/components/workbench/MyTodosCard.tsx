import React from 'react';
import { CheckCircleOutlined, SyncOutlined, CheckSquareOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import '../../pages/Workbench.css';

interface MyTodosCardProps {
  totalCount?: number;
  inProgressCount?: number;
  completedCount?: number;
  notStartedCount?: number;
  overdueCount?: number;
}

const MyTodosCard: React.FC<MyTodosCardProps> = ({
  totalCount = 0,
  inProgressCount = 0,
  completedCount = 0,
  notStartedCount = 0,
  overdueCount = 0,
}) => {
  return (
    <div className="wb-card wb-my-todos-card">
      <h3 className="wb-card-title">我的待办</h3>

      <div className="wb-todos-grid wb-todos-grid-5">
        {/* 待办项1：任务总数 */}
        <div className="wb-todo-item">
          <div className="wb-todo-icon-wrapper wb-todo-icon-blue">
            <CheckCircleOutlined className="wb-todo-icon" />
          </div>
          <div className="wb-todo-label">任务总数</div>
          <div className="wb-todo-count">{totalCount}</div>
        </div>

        {/* 待办项2：进行中 */}
        <div className="wb-todo-item">
          <div className="wb-todo-icon-wrapper wb-todo-icon-cyan">
            <SyncOutlined className="wb-todo-icon" />
          </div>
          <div className="wb-todo-label">进行中</div>
          <div className="wb-todo-count">{inProgressCount}</div>
        </div>

        {/* 待办项3：已完成 */}
        <div className="wb-todo-item">
          <div className="wb-todo-icon-wrapper wb-todo-icon-green">
            <CheckSquareOutlined className="wb-todo-icon" />
          </div>
          <div className="wb-todo-label">已完成</div>
          <div className="wb-todo-count">{completedCount}</div>
        </div>

        {/* 待办项4：未开始 */}
        <div className="wb-todo-item">
          <div className="wb-todo-icon-wrapper wb-todo-icon-gray">
            <ClockCircleOutlined className="wb-todo-icon" />
          </div>
          <div className="wb-todo-label">未开始</div>
          <div className="wb-todo-count">{notStartedCount}</div>
        </div>

        {/* 待办项5：已逾期 */}
        <div className="wb-todo-item">
          <div className="wb-todo-icon-wrapper wb-todo-icon-red">
            <ExclamationCircleOutlined className="wb-todo-icon" />
          </div>
          <div className="wb-todo-label">已逾期</div>
          <div className="wb-todo-count wb-todo-count-urgent">{overdueCount}</div>
        </div>
      </div>
    </div>
  );
};

export default MyTodosCard;
