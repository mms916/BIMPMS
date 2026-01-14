-- ========================================
-- BIM 项目管理系统 - 任务管理表
-- 版本: v1.2.1
-- 创建日期: 2026-01-12
-- ========================================

USE bim_pms;

-- ========================================
-- 1. 创建任务表 (tasks)
-- ========================================
CREATE TABLE IF NOT EXISTS tasks (
  task_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '任务ID',
  project_id INT NOT NULL COMMENT '关联项目ID',
  parent_id INT DEFAULT NULL COMMENT '父任务ID，NULL表示根任务',
  task_name VARCHAR(200) NOT NULL COMMENT '任务名称',
  task_desc TEXT COMMENT '任务描述',
  assigned_to INT DEFAULT NULL COMMENT '负责人ID',
  start_date DATE DEFAULT NULL COMMENT '开始日期',
  end_date DATE DEFAULT NULL COMMENT '结束日期',
  estimated_hours DECIMAL(6,2) DEFAULT 0 COMMENT '预计工时(小时)',
  actual_hours DECIMAL(6,2) DEFAULT 0 COMMENT '实际工时(小时)',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium' COMMENT '优先级: low-低, medium-中, high-高',
  status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending' COMMENT '状态: pending-未开始, in_progress-进行中, completed-已完成',
  progress INT DEFAULT 0 COMMENT '进度百分比(0-100)',
  level INT DEFAULT 0 COMMENT '任务层级(0=根任务, 1=一级子任务...)',
  sort_order INT DEFAULT 0 COMMENT '排序序号',
  created_by INT NOT NULL COMMENT '创建人ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  -- 外键约束
  FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(user_id),

  -- 索引
  INDEX idx_project_id (project_id),
  INDEX idx_parent_id (parent_id),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_status (status),
  INDEX idx_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务表';

-- ========================================
-- 2. 创建任务更新记录表 (task_updates)
-- ========================================
CREATE TABLE IF NOT EXISTS task_updates (
  update_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '更新记录ID',
  task_id INT NOT NULL COMMENT '任务ID',
  user_id INT NOT NULL COMMENT '更新人ID',
  old_progress INT DEFAULT NULL COMMENT '更新前进度',
  new_progress INT DEFAULT NULL COMMENT '更新后进度',
  old_status ENUM('pending', 'in_progress', 'completed') DEFAULT NULL COMMENT '更新前状态',
  new_status ENUM('pending', 'in_progress', 'completed') DEFAULT NULL COMMENT '更新后状态',
  hours_spent DECIMAL(6,2) DEFAULT 0 COMMENT '本次消耗工时',
  note TEXT COMMENT '更新说明',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',

  -- 外键约束
  FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id),

  -- 索引
  INDEX idx_task_id (task_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务更新记录表';

-- ========================================
-- 注意：示例任务数据已移除
-- 可以通过系统界面创建任务数据
-- ========================================
