-- ========================================
-- BIM项目管理系统 - 数据库初始化脚本
-- 版本: V1.0 MVP
-- 创建日期: 2026-01-09
-- ========================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS bim_pms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bim_pms;

-- ========================================
-- 1. 部门表 (departments) - 必须先创建，因为用户表引用它
-- ========================================
CREATE TABLE IF NOT EXISTS departments (
    dept_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '部门ID',
    dept_name VARCHAR(50) NOT NULL COMMENT '部门名称',
    dept_code VARCHAR(10) NOT NULL UNIQUE COMMENT '部门缩写',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后修改时间',
    INDEX idx_dept_code (dept_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='部门表';

-- ========================================
-- 2. 用户表 (users)
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名（唯一）',
    password VARCHAR(255) NOT NULL COMMENT '密码（bcrypt加密）',
    full_name VARCHAR(50) NOT NULL COMMENT '姓名',
    avatar VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
    dept_id INT NOT NULL COMMENT '所属部门ID',
    role ENUM('admin', 'dept_manager', 'project_manager', 'employee') NOT NULL COMMENT '角色',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后修改时间',
    INDEX idx_username (username),
    INDEX idx_dept_id (dept_id),
    INDEX idx_role (role),
    FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ========================================
-- 3. 项目表 (projects)
-- ========================================
CREATE TABLE IF NOT EXISTS projects (
    project_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '项目ID',
    contract_no VARCHAR(50) UNIQUE NOT NULL COMMENT '合同编号（唯一）',
    contract_name VARCHAR(100) NOT NULL COMMENT '合同名称',
    start_date DATE NOT NULL COMMENT '开始日期',
    end_date DATE NOT NULL COMMENT '结束日期',
    contract_amount DECIMAL(15,2) NOT NULL COMMENT '合同金额（万元）',
    progress INT DEFAULT 0 COMMENT '项目进度（0-100）',
    leader_id INT NOT NULL COMMENT '项目负责人ID',
    settlement_status ENUM('未结算', '部分结算', '结算完成') DEFAULT '未结算' COMMENT '结算状态',
    participants JSON DEFAULT NULL COMMENT '参与人员ID数组（如[1,2,3]）',
    is_signed ENUM('已签订', '未签订') DEFAULT '未签订' COMMENT '是否签订',
    payment_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT '回款金额（万元）',
    dept_id INT NOT NULL COMMENT '所属部门ID',
    project_type ENUM('建筑施工', '室内设计', '园林景观', '市政工程', '其他') NOT NULL COMMENT '项目类型',
    remark TEXT DEFAULT NULL COMMENT '项目备注（最多500字）',
    created_by INT NOT NULL COMMENT '创建人ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by INT DEFAULT NULL COMMENT '最后修改人ID',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后修改时间',
    INDEX idx_contract_no (contract_no),
    INDEX idx_leader_id (leader_id),
    INDEX idx_dept_id (dept_id),
    INDEX idx_settlement_status (settlement_status),
    INDEX idx_dates (start_date, end_date),
    FOREIGN KEY (leader_id) REFERENCES users(user_id),
    FOREIGN KEY (dept_id) REFERENCES departments(dept_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目表';

-- ========================================
-- 4. 用户偏好设置表 (user_preferences)
-- ========================================
CREATE TABLE IF NOT EXISTS user_preferences (
    preference_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '偏好设置ID',
    user_id INT NOT NULL COMMENT '用户ID',
    module_name VARCHAR(50) NOT NULL COMMENT '模块标识（project_ledger）',
    field_config JSON NOT NULL COMMENT '字段显示配置',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后修改时间',
    UNIQUE KEY unique_user_module (user_id, module_name),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户偏好设置表';

-- ========================================
-- 完成数据库初始化
-- ========================================
SELECT '数据库表结构创建完成！' AS status;
