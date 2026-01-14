-- ========================================
-- BIM 项目管理系统 - 任务管理表
-- 版本: v1.2.1
-- 创建日期: 2026-01-12
-- ========================================

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
-- 3. 插入示例任务数据
-- ========================================
-- 为"XX大厦BIM项目"添加示例任务
INSERT INTO tasks (
    project_id, parent_id, task_name, task_desc, assigned_to,
    start_date, end_date, estimated_hours, priority, status, progress,
    level, sort_order, created_by
) VALUES
-- 根任务
(17, NULL, 'XX大厦BIM项目整体实施', 'XX大厦BIM项目的整体实施任务', 4,
 '2026-01-01', '2026-12-31', 2000, 'high', 'in_progress', 65,
 0, 1, 1),

-- 一级子任务 - 前期准备
(17, 1, '前期准备阶段', '项目前期准备工作', 4,
 '2026-01-01', '2026-02-28', 320, 'medium', 'completed', 100,
 1, 1, 1),

-- 一级子任务 - 施工阶段
(17, 1, '施工阶段', '主体施工工作', 4,
 '2026-03-01', '2026-10-31', 1200, 'high', 'in_progress', 45,
 1, 2, 1),

-- 一级子任务 - 验收交付
(17, 1, '验收与交付', '项目验收和交付工作', 6,
 '2026-11-01', '2026-12-31', 480, 'medium', 'pending', 0,
 1, 3, 1),

-- 二级子任务 - 前期准备下的任务
(17, 2, '现场勘察', '项目现场勘察和数据收集', 4,
 '2026-01-01', '2026-01-15', 80, 'medium', 'completed', 100,
 2, 1, 1),

(17, 2, '方案设计', 'BIM实施方案设计', 7,
 '2026-01-16', '2026-02-28', 160, 'high', 'completed', 100,
 2, 2, 1),

(17, 2, '团队组建', '项目团队组建和培训', 4,
 '2026-01-01', '2026-02-15', 80, 'low', 'completed', 100,
 2, 3, 1),

-- 二级子任务 - 施工阶段下的任务
(17, 3, '主体结构施工', '大楼主体结构BIM建模和施工指导', 4,
 '2026-03-01', '2026-06-30', 400, 'high', 'in_progress', 60,
 2, 1, 1),

(17, 3, '机电安装', '机电管线BIM设计和安装协调', 5,
 '2026-05-01', '2026-08-31', 320, 'high', 'pending', 0,
 2, 2, 1),

(17, 3, '装修工程', '装修设计和施工配合', 6,
 '2026-07-01', '2026-10-31', 280, 'medium', 'pending', 0,
 2, 3, 1),

-- 二级子任务 - 验收交付下的任务
(17, 4, '竣工验收', '项目竣工验收', 6,
 '2026-11-01', '2026-12-15', 160, 'high', 'pending', 0,
 2, 1, 1),

(17, 4, '资料交付', '项目资料整理和交付', 4,
 '2026-12-01', '2026-12-31', 80, 'medium', 'pending', 0,
 2, 2, 1);

-- 为"YY花园景观设计"添加示例任务
INSERT INTO tasks (
    project_id, parent_id, task_name, task_desc, assigned_to,
    start_date, end_date, estimated_hours, priority, status, progress,
    level, sort_order, created_by
) VALUES
(18, NULL, 'YY花园景观设计整体项目', '景观设计项目总任务', 4,
 '2026-02-15', '2026-08-31', 800, 'medium', 'in_progress', 65,
 0, 1, 1),

(18, 12, '方案设计', '景观方案设计', 7,
 '2026-02-15', '2026-04-15', 200, 'high', 'completed', 100,
 1, 1, 1),

(18, 12, '扩初设计', '扩大初步设计', 5,
 '2026-04-16', '2026-05-31', 180, 'medium', 'in_progress', 50,
 1, 2, 1),

(18, 12, '施工图设计', '施工图绘制', 8,
 '2026-06-01', '2026-07-31', 250, 'high', 'pending', 0,
 1, 3, 1),

(18, 12, '现场配合', '施工现场技术配合', 4,
 '2026-06-01', '2026-08-31', 170, 'low', 'pending', 0,
 1, 4, 1);

-- 插入一些任务更新记录
INSERT INTO task_updates (task_id, user_id, old_progress, new_progress, old_status, new_status, hours_spent, note) VALUES
(5, 4, 0, 50, 'pending', 'in_progress', 40, '完成主体结构二层施工'),
(5, 4, 50, 60, 'in_progress', 'in_progress', 8, '本周完成主体结构三层施工'),
(6, 4, NULL, NULL, NULL, NULL, 0, '任务已分配'),
(7, 4, NULL, NULL, NULL, NULL, 0, '任务已分配'),
(8, 4, NULL, NULL, NULL, NULL, 0, '任务已分配'),
(13, 7, 0, 100, 'pending', 'completed', 40, '方案设计已完成'),
(14, 5, 0, 50, 'pending', 'in_progress', 30, '完成景观方案设计初稿');
