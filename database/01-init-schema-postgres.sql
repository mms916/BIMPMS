-- ========================================
-- BIM项目管理系统 - PostgreSQL 数据库初始化脚本
-- 版本: V1.0 MVP
-- 创建日期: 2026-01-11
-- ========================================

-- ========================================
-- 1. 部门表 (departments) - 必须先创建，因为用户表引用它
-- ========================================
CREATE TABLE IF NOT EXISTS departments (
    dept_id SERIAL PRIMARY KEY,
    dept_name VARCHAR(50) NOT NULL,
    dept_code VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_dept_code ON departments(dept_code);

-- 添加注释
COMMENT ON TABLE departments IS '部门表';
COMMENT ON COLUMN departments.dept_id IS '部门ID';
COMMENT ON COLUMN departments.dept_name IS '部门名称';
COMMENT ON COLUMN departments.dept_code IS '部门缩写';
COMMENT ON COLUMN departments.created_at IS '创建时间';
COMMENT ON COLUMN departments.updated_at IS '最后修改时间';

-- ========================================
-- 2. 用户角色枚举类型
-- ========================================
CREATE TYPE user_role AS ENUM ('admin', 'dept_manager', 'project_manager', 'employee');

-- ========================================
-- 3. 用户表 (users)
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(50) NOT NULL,
    avatar VARCHAR(255),
    dept_id INTEGER NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dept FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_dept_id ON users(dept_id);
CREATE INDEX IF NOT EXISTS idx_role ON users(role);

-- 添加注释
COMMENT ON TABLE users IS '用户表';
COMMENT ON COLUMN users.user_id IS '用户ID';
COMMENT ON COLUMN users.username IS '用户名（唯一）';
COMMENT ON COLUMN users.password IS '密码（bcrypt加密）';
COMMENT ON COLUMN users.full_name IS '姓名';
COMMENT ON COLUMN users.avatar IS '头像URL';
COMMENT ON COLUMN users.dept_id IS '所属部门ID';
COMMENT ON COLUMN users.role IS '角色';
COMMENT ON COLUMN users.created_at IS '创建时间';
COMMENT ON COLUMN users.updated_at IS '最后修改时间';

-- ========================================
-- 4. 结算状态枚举类型
-- ========================================
CREATE TYPE settlement_status AS ENUM ('未结算', '部分结算', '结算完成');

-- ========================================
-- 5. 签订状态枚举类型
-- ========================================
CREATE TYPE sign_status AS ENUM ('已签订', '未签订');

-- ========================================
-- 6. 项目类型枚举类型
-- ========================================
CREATE TYPE project_type AS ENUM ('建筑施工', '室内设计', '园林景观', '市政工程', '其他');

-- ========================================
-- 7. 项目表 (projects)
-- ========================================
CREATE TABLE IF NOT EXISTS projects (
    project_id SERIAL PRIMARY KEY,
    contract_no VARCHAR(50) UNIQUE NOT NULL,
    contract_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    contract_amount DECIMAL(15,2) NOT NULL,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    leader_id INTEGER NOT NULL,
    settlement_status settlement_status DEFAULT '未结算',
    participants JSONB,
    is_signed sign_status DEFAULT '未签订',
    payment_amount DECIMAL(15,2) DEFAULT 0.00,
    dept_id INTEGER NOT NULL,
    project_type project_type NOT NULL,
    remark TEXT,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_leader FOREIGN KEY (leader_id) REFERENCES users(user_id),
    CONSTRAINT fk_project_dept FOREIGN KEY (dept_id) REFERENCES departments(dept_id),
    CONSTRAINT fk_creator FOREIGN KEY (created_by) REFERENCES users(user_id),
    CONSTRAINT fk_updater FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_contract_no ON projects(contract_no);
CREATE INDEX IF NOT EXISTS idx_leader_id ON projects(leader_id);
CREATE INDEX IF NOT EXISTS idx_projects_dept_id ON projects(dept_id);
CREATE INDEX IF NOT EXISTS idx_settlement_status ON projects(settlement_status);
CREATE INDEX IF NOT EXISTS idx_dates ON projects(start_date, end_date);

-- 添加注释
COMMENT ON TABLE projects IS '项目表';
COMMENT ON COLUMN projects.project_id IS '项目ID';
COMMENT ON COLUMN projects.contract_no IS '合同编号（唯一）';
COMMENT ON COLUMN projects.contract_name IS '合同名称';
COMMENT ON COLUMN projects.start_date IS '开始日期';
COMMENT ON COLUMN projects.end_date IS '结束日期';
COMMENT ON COLUMN projects.contract_amount IS '合同金额（万元）';
COMMENT ON COLUMN projects.progress IS '项目进度（0-100）';
COMMENT ON COLUMN projects.leader_id IS '项目负责人ID';
COMMENT ON COLUMN projects.settlement_status IS '结算状态';
COMMENT ON COLUMN projects.participants IS '参与人员ID数组（如[1,2,3]）';
COMMENT ON COLUMN projects.is_signed IS '是否签订';
COMMENT ON COLUMN projects.payment_amount IS '回款金额（万元）';
COMMENT ON COLUMN projects.dept_id IS '所属部门ID';
COMMENT ON COLUMN projects.project_type IS '项目类型';
COMMENT ON COLUMN projects.remark IS '项目备注（最多500字）';
COMMENT ON COLUMN projects.created_by IS '创建人ID';
COMMENT ON COLUMN projects.created_at IS '创建时间';
COMMENT ON COLUMN projects.updated_by IS '最后修改人ID';
COMMENT ON COLUMN projects.updated_at IS '最后修改时间';

-- ========================================
-- 8. 用户偏好设置表 (user_preferences)
-- ========================================
CREATE TABLE IF NOT EXISTS user_preferences (
    preference_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    module_name VARCHAR(50) NOT NULL,
    field_config JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, module_name),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 添加注释
COMMENT ON TABLE user_preferences IS '用户偏好设置表';
COMMENT ON COLUMN user_preferences.preference_id IS '偏好设置ID';
COMMENT ON COLUMN user_preferences.user_id IS '用户ID';
COMMENT ON COLUMN user_preferences.module_name IS '模块标识（project_ledger）';
COMMENT ON COLUMN user_preferences.field_config IS '字段显示配置';
COMMENT ON COLUMN user_preferences.created_at IS '创建时间';
COMMENT ON COLUMN user_preferences.updated_at IS '最后修改时间';

-- ========================================
-- 创建更新时间自动更新的触发器函数
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加触发器
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 完成数据库初始化
-- ========================================
SELECT '数据库表结构创建完成！' AS status;
