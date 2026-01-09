-- ========================================
-- BIM项目管理系统 - 种子数据插入脚本
-- 版本: V1.0 MVP
-- 创建日期: 2026-01-09
-- ========================================

USE bim_pms;

-- ========================================
-- 1. 插入部门数据
-- ========================================
INSERT INTO departments (dept_name, dept_code) VALUES
('项目部', 'XM'),
('技术部', 'JS'),
('财务部', 'CW'),
('工程部', 'GC'),
('综合部', 'ZH');

-- ========================================
-- 2. 插入用户数据
-- 密码统一为: password123 (bcrypt加密后的值)
-- ========================================
INSERT INTO users (username, password, full_name, avatar, dept_id, role) VALUES
-- 管理员账号
('admin', '$2b$10$rOzJQvEzM7m4JJ8GKv2vOe5JJ8XhVvJJ8XhVvJJ8XhVvJJ8XhVvJJ8', '系统管理员', NULL, 1, 'admin'),
-- 部门负责人
('dept_manager_xm', '$2b$10$rOzJQvEzM7m4JJ8GKv2vOe5JJ8XhVvJJ8XhVvJJ8XhVvJJ8XhVvJJ8', '张经理', NULL, 1, 'dept_manager'),
('dept_manager_js', '$2b$10$rOzJQvEzM7m4JJ8GKv2vOe5JJ8XhVvJJ8XhVvJJ8XhVvJJ8XhVvJJ8', '李经理', NULL, 2, 'dept_manager'),
-- 项目负责人
('project_leader_1', '$2b$10$rOzJQvEzM7m4JJ8GKv2vOe5JJ8XhVvJJ8XhVvJJ8XhVvJJ8XhVvJJ8', '王工', NULL, 1, 'project_manager'),
('project_leader_2', '$2b$10$rOzJQvEzM7m4JJ8GKv2vOe5JJ8XhVvJJ8XhVvJJ8XhVvJJ8XhVvJJ8', '赵工', NULL, 1, 'project_manager'),
('project_leader_3', '$2b$10$rOzJQvEzM7m4JJ8GKv2vOe5JJ8XhVvJJ8XhVvJJ8XhVvJJ8XhVvJJ8', '刘工', NULL, 2, 'project_manager'),
-- 普通员工
('employee_1', '$2b$10$rOzJQvEzM7m4JJ8GKv2vOe5JJ8XhVvJJ8XhVvJJ8XhVvJJ8XhVvJJ8', '小陈', NULL, 1, 'employee'),
('employee_2', '$2b$10$rOzJQvEzM7m4JJ8GKv2vOe5JJ8XhVvJJ8XhVvJJ8XhVvJJ8XhVvJJ8', '小周', NULL, 1, 'employee'),
('employee_3', '$2b$10$rOzJQvEzM7m4JJ8GKv2vOe5JJ8XhVvJJ8XhVvJJ8XhVvJJ8XhVvJJ8', '小吴', NULL, 2, 'employee'),
('employee_4', '$2b$10$rOzJQvEzM7m4JJ8GKv2vOe5JJ8XhVvJJ8XhVvJJ8XhVvJJ8XhVvJJ8', '小郑', NULL, 2, 'employee');

-- ========================================
-- 3. 插入示例项目数据
-- ========================================
INSERT INTO projects (
    contract_no,
    contract_name,
    start_date,
    end_date,
    contract_amount,
    progress,
    leader_id,
    settlement_status,
    participants,
    is_signed,
    payment_amount,
    dept_id,
    project_type,
    remark,
    created_by
) VALUES
-- 项目1：已结算，进度100%
('局0113202601019001', 'XX大厦BIM项目', '2026-01-01', '2026-12-31', 120.50, 100, 4, '结算完成', '[4, 7, 8]', '已签订', 120.50, 1, '建筑施工', '项目已完成并结算', 1),
-- 项目2：部分结算，进度65%
('局0113202601019002', 'YY花园景观设计', '2026-02-15', '2026-08-31', 89.00, 65, 4, '部分结算', '[4, 7]', '已签订', 45.00, 1, '园林景观', '项目进行中，部分款项已回款', 1),
-- 项目3：未结算，进度45%
('局0113202601019003', 'ZZ广场市政工程', '2026-03-10', '2026-09-30', 256.80, 45, 5, '未结算', '[5, 8]', '已签订', 0.00, 1, '市政工程', '项目进行中', 1),
-- 项目4：未结算，进度85%（接近完成）
('局0113202601019004', 'AA办公楼室内设计', '2026-01-15', '2026-06-30', 78.50, 85, 5, '未结算', '[5, 7, 8]', '已签订', 0.00, 2, '室内设计', '项目接近完工', 1),
-- 项目5：未结算，进度30%（进度滞后）
('局0113202601019005', 'BB住宅小区施工', '2026-04-01', '2026-12-31', 450.00, 30, 6, '未结算', '[6, 9, 10]', '已签订', 100.00, 2, '建筑施工', '项目进度滞后', 1),
-- 项目6：未结算，进度0%（刚启动）
('局0113202601019006', 'CC商业中心设计', '2026-05-01', '2027-03-31', 320.00, 0, 6, '未结算', '[6]', '未签订', 0.00, 2, '室内设计', '项目刚启动，尚未签订合同', 1),
-- 项目7：已结算，进度100%
('局0113202601019007', 'DD公园景观改造', '2026-01-01', '2026-05-31', 56.80, 100, 4, '结算完成', '[4, 7]', '已签订', 56.80, 1, '园林景观', '项目已完成并结算', 1),
-- 项目8：部分结算，进度50%
('局0113202601019008', 'EE科技园区建设', '2026-02-01', '2026-10-31', 580.00, 50, 5, '部分结算', '[5, 8, 9]', '已签订', 200.00, 1, '建筑施工', '项目进行中，部分款项已回款', 1),
-- 项目9：逾期项目（假设今天是2026-01-09，项目已逾期）
('局0113202601019009', 'FF学校改造工程', '2025-06-01', '2025-12-31', 180.00, 75, 6, '未结算', '[6, 10]', '已签订', 80.00, 2, '市政工程', '项目已逾期，进度75%', 1),
-- 项目10：逾期项目（假设今天是2026-01-09，项目已逾期）
('局0113202601019010', 'GG商场装修工程', '2025-09-01', '2025-12-15', 95.00, 60, 4, '未结算', '[4, 7, 8]', '已签订', 50.00, 1, '室内设计', '项目已逾期，进度60%', 1);

-- ========================================
-- 4. 插入用户偏好设置数据（可选）
-- ========================================
-- 为管理员用户设置默认字段显示配置
INSERT INTO user_preferences (user_id, module_name, field_config) VALUES
(1, 'project_ledger', '{
  "visibleFields": [
    "contract_no",
    "contract_name",
    "start_date",
    "end_date",
    "contract_amount",
    "progress",
    "leader_name",
    "settlement_status",
    "is_signed",
    "payment_amount"
  ],
  "columnOrder": [
    "contract_no",
    "contract_name",
    "start_date",
    "end_date",
    "contract_amount",
    "progress",
    "leader_name",
    "settlement_status",
    "is_signed",
    "payment_amount"
  ]
}');

-- ========================================
-- 完成种子数据插入
-- ========================================
SELECT '种子数据插入完成！' AS status;
SELECT COUNT(*) AS '部门数量' FROM departments;
SELECT COUNT(*) AS '用户数量' FROM users;
SELECT COUNT(*) AS '项目数量' FROM projects;
