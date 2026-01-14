-- ========================================
-- 部门表树形结构升级
-- 添加 parent_id 字段支持部门层级关系
-- ========================================

USE bim_pms;

-- 添加 parent_id 字段
ALTER TABLE departments
ADD COLUMN parent_id INT DEFAULT NULL COMMENT '父部门ID' AFTER dept_code,
ADD INDEX idx_parent_id (parent_id);

-- 添加外键约束
ALTER TABLE departments
ADD CONSTRAINT fk_dept_parent
FOREIGN KEY (parent_id) REFERENCES departments(dept_id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- 更新现有数据(如果需要,可以设置某些部门为子部门)
-- 例如:将 'BIM中心' 作为根部门,其他部门作为其子部门
-- UPDATE departments SET parent_id = (SELECT dept_id FROM (SELECT dept_id FROM departments WHERE dept_code = 'BIM') AS tmp) WHERE dept_code IN ('JS', 'JD', 'YL', 'SZ');
