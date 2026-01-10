import { Request, Response } from 'express';
import pool from '../config/database';
import {
  Project,
  ProjectExtended,
  PaginationParams,
  PaginatedResult,
  ProjectStats,
  UserRole,
  SettlementStatus,
} from '../types';
import { generateContractNo, isContractNoUnique } from '../services/contractService';

/**
 * 获取项目列表（支持筛选、分页、排序）
 */
export const getProjects = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const {
      page = '1',
      pageSize = '20',
      search = '',
      projectType,
      settlementStatus,
      leaderId,
      isOverdue,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = req.query;

    const pageNum = parseInt(page as string);
    const size = parseInt(pageSize as string);
    const offset = (pageNum - 1) * size;

    // 构建WHERE条件
    const conditions: string[] = [];
    const params: any[] = [];

    // 根据用户角色添加权限过滤条件
    if (user.role === UserRole.DEPT_MANAGER) {
      conditions.push(`p.dept_id = ?`);
      params.push(user.dept_id);
    } else if (user.role === UserRole.PROJECT_MANAGER) {
      conditions.push(`p.leader_id = ?`);
      params.push(user.user_id);
    } else if (user.role === UserRole.EMPLOYEE) {
      conditions.push(`JSON_CONTAINS(p.participants, ?)`);
      params.push(JSON.stringify([user.user_id]));
    }

    // 搜索条件
    if (search) {
      conditions.push(
        `(p.contract_no LIKE ? OR p.contract_name LIKE ? OR u.full_name LIKE ?)`
      );
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // 项目类型筛选
    if (projectType) {
      conditions.push(`p.project_type = ?`);
      params.push(projectType);
    }

    // 结算状态筛选
    if (settlementStatus) {
      conditions.push(`p.settlement_status = ?`);
      params.push(settlementStatus);
    }

    // 项目负责人筛选
    if (leaderId) {
      conditions.push(`p.leader_id = ?`);
      params.push(leaderId);
    }

    // 是否逾期筛选
    if (isOverdue === 'true') {
      conditions.push('(p.end_date < CURDATE() AND p.progress < 100)');
    } else if (isOverdue === 'false') {
      conditions.push('(p.end_date >= CURDATE() OR p.progress >= 100)');
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 查询总数
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total
       FROM projects p
       LEFT JOIN users u ON p.leader_id = u.user_id
       ${whereClause}`,
      params
    );
    const total = countRows[0].total as number;

    // 查询项目列表
    const [projectsRows] = await pool.query(
      `SELECT p.*,
              u.full_name as leader_name,
              d.dept_name,
              CASE
                WHEN p.end_date < CURDATE() AND p.progress < 100 THEN 1
                ELSE 0
              END as is_overdue
       FROM projects p
       LEFT JOIN users u ON p.leader_id = u.user_id
       LEFT JOIN departments d ON p.dept_id = d.dept_id
       ${whereClause}
       ORDER BY p.${sortBy} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [...params, size, offset]
    );

    // 处理参与人员字段
    const projectList = (projectsRows as any[]).map((project) => {
      // 参与人员字段可能已经是数组或需要解析
      let participants = [];
      if (project.participants) {
        try {
          if (typeof project.participants === 'string') {
            participants = JSON.parse(project.participants);
          } else if (Array.isArray(project.participants)) {
            participants = project.participants;
          } else {
            participants = [project.participants];
          }
        } catch (e) {
          participants = [];
        }
      }

      return {
        ...project,
        participants,
      };
    });

    const result: PaginatedResult<ProjectExtended> = {
      data: projectList,
      pagination: {
        total,
        page: pageNum,
        pageSize: size,
        totalPages: Math.ceil(total / size),
      },
    };

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('获取项目列表失败：', error);
    res.status(500).json({
      success: false,
      message: '获取项目列表失败',
    });
  }
};

/**
 * 获取项目详情
 */
export const getProjectById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const [rows] = await pool.query<any>(
      `SELECT p.*,
              u.full_name as leader_name,
              d.dept_name
       FROM projects p
       LEFT JOIN users u ON p.leader_id = u.user_id
       LEFT JOIN departments d ON p.dept_id = d.dept_id
       WHERE p.project_id = ?`,
      [id]
    );

    const projects = rows as any[];

    if (!Array.isArray(projects) || projects.length === 0) {
      res.status(404).json({
        success: false,
        message: '项目不存在',
      });
      return;
    }

    const project = projects[0];
    project.participants = project.participants
      ? JSON.parse(project.participants)
      : [];

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('获取项目详情失败：', error);
    res.status(500).json({
      success: false,
      message: '获取项目详情失败',
    });
  }
};

/**
 * 创建项目
 */
export const createProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const projectData = req.body;

    // 如果提供了 leader_name，查找对应的 user_id
    let leaderId = projectData.leader_id;
    let deptId = projectData.dept_id;

    if (projectData.leader_name && !projectData.leader_id) {
      const [userRows] = await pool.query<any>(
        'SELECT user_id, dept_id FROM users WHERE full_name = ?',
        [projectData.leader_name]
      );

      const users = userRows as any[];

      if (Array.isArray(users) && users.length > 0) {
        leaderId = users[0].user_id;
        deptId = deptId || users[0].dept_id;
      } else {
        // 如果找不到用户，自动创建新用户
        const bcrypt = require('bcrypt');
        const defaultPassword = await bcrypt.hash('password123', 10);

        const [insertResult] = await pool.query<any>(
          'INSERT INTO users (username, full_name, password, role, dept_id) VALUES (?, ?, ?, ?, ?)',
          [
            projectData.leader_name, // 使用姓名作为用户名
            projectData.leader_name,
            defaultPassword,
            'employee', // 默认为普通员工
            deptId || user.dept_id || 1 // 使用当前用户部门或默认部门
          ]
        );

        leaderId = insertResult.insertId;
        deptId = deptId || user.dept_id || 1;
      }
    }

    // 如果没有提供 dept_id，使用当前用户的部门
    if (!deptId) {
      deptId = user.dept_id;
    }

    // 验证必填字段
    const requiredFields = [
      'contract_no',
      'contract_name',
      'start_date',
      'end_date',
      'contract_amount',
      'project_type',
    ];

    for (const field of requiredFields) {
      if (!projectData[field]) {
        res.status(400).json({
          success: false,
          message: `${field}字段不能为空`,
        });
        return;
      }
    }

    // 验证负责人
    if (!leaderId) {
      res.status(400).json({
        success: false,
        message: '项目负责人不能为空',
      });
      return;
    }

    // 验证合同编号唯一性
    const isUnique = await isContractNoUnique(projectData.contract_no);
    if (!isUnique) {
      res.status(400).json({
        success: false,
        message: '该合同编号已存在，请重新输入',
      });
      return;
    }

    // 日期逻辑验证
    if (new Date(projectData.end_date) <= new Date(projectData.start_date)) {
      res.status(400).json({
        success: false,
        message: '结束日期不能早于开始日期',
      });
      return;
    }

    // 金额验证
    if (projectData.contract_amount <= 0) {
      res.status(400).json({
        success: false,
        message: '合同金额必须大于0',
      });
      return;
    }

    // 回款金额验证
    if (
      projectData.payment_amount &&
      projectData.payment_amount > projectData.contract_amount
    ) {
      res.status(400).json({
        success: false,
        message: '回款金额不能大于合同金额',
      });
      return;
    }

    // 插入项目数据
    const [result] = await pool.query(
      `INSERT INTO projects (
        contract_no, contract_name, start_date, end_date,
        contract_amount, progress, leader_id, settlement_status,
        participants, is_signed, payment_amount, dept_id,
        project_type, remark, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectData.contract_no,
        projectData.contract_name,
        projectData.start_date,
        projectData.end_date,
        projectData.contract_amount,
        projectData.progress || 0,
        leaderId,
        projectData.settlement_status || SettlementStatus.UNSETTLED,
        projectData.participants ? JSON.stringify(projectData.participants) : null,
        projectData.is_signed || '未签订',
        projectData.payment_amount || 0,
        deptId,
        projectData.project_type,
        projectData.remark || null,
        user.user_id,
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        project_id: result.insertId,
        message: '项目创建成功',
      },
    });
  } catch (error) {
    console.error('创建项目失败：', error);
    res.status(500).json({
      success: false,
      message: '创建项目失败',
    });
  }
};

/**
 * 更新项目
 */
export const updateProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const projectData = req.body;

    // 如果提供了 leader_name，查找对应的 user_id
    let leaderId = projectData.leader_id;

    if (projectData.leader_name && !projectData.leader_id) {
      const [userRows] = await pool.query<any>(
        'SELECT user_id, dept_id FROM users WHERE full_name = ?',
        [projectData.leader_name]
      );

      const users = userRows as any[];

      if (Array.isArray(users) && users.length > 0) {
        leaderId = users[0].user_id;
        // 如果有 dept_id 也一起更新
        if (!projectData.dept_id) {
          projectData.dept_id = users[0].dept_id;
        }
      } else {
        // 如果找不到用户，自动创建新用户
        const bcrypt = require('bcrypt');
        const defaultPassword = await bcrypt.hash('password123', 10);

        const insertResult = await pool.query<any>(
          'INSERT INTO users (username, full_name, password, role, dept_id) VALUES ($1, $2, $3, $4, $5) RETURNING user_id',
          [
            projectData.leader_name,
            projectData.leader_name,
            defaultPassword,
            'employee',
            projectData.dept_id || user.dept_id || 1
          ]
        );

        leaderId = insertResult.rows[0].user_id;
        if (!projectData.dept_id) {
          projectData.dept_id = user.dept_id || 1;
        }
      }
    }

    // 更新 leader_id
    if (leaderId) {
      projectData.leader_id = leaderId;
    }

    // 验证合同编号唯一性（排除当前项目）
    if (projectData.contract_no) {
      const isUnique = await isContractNoUnique(
        projectData.contract_no,
        parseInt(id)
      );
      if (!isUnique) {
        res.status(400).json({
          success: false,
          message: '该合同编号已存在，请重新输入',
        });
        return;
      }
    }

    // 日期逻辑验证
    if (
      projectData.start_date &&
      projectData.end_date &&
      new Date(projectData.end_date) <= new Date(projectData.start_date)
    ) {
      res.status(400).json({
        success: false,
        message: '结束日期不能早于开始日期',
      });
      return;
    }

    // 构建更新字段
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    const allowedFields = [
      'contract_no',
      'contract_name',
      'start_date',
      'end_date',
      'contract_amount',
      'progress',
      'leader_id',
      'settlement_status',
      'participants',
      'is_signed',
      'payment_amount',
      'dept_id',
      'project_type',
      'remark',
    ];

    for (const field of allowedFields) {
      if (projectData[field] !== undefined) {
        if (field === 'participants') {
          updateFields.push(`${field} = ?`);
          updateValues.push(
            projectData[field] ? JSON.stringify(projectData[field]) : null
          );
        } else {
          updateFields.push(`${field} = ?`);
          updateValues.push(projectData[field]);
        }
      }
    }

    if (updateFields.length === 0) {
      res.status(400).json({
        success: false,
        message: '没有要更新的字段',
      });
      return;
    }

    // 添加更新人和更新时间
    updateFields.push(`updated_by = ?`);
    updateValues.push(user.user_id);

    updateValues.push(id);

    await pool.query(
      `UPDATE projects SET ${updateFields.join(', ')} WHERE project_id = ?`,
      updateValues
    );

    res.json({
      success: true,
      data: {
        message: '项目更新成功',
      },
    });
  } catch (error) {
    console.error('更新项目失败：', error);
    res.status(500).json({
      success: false,
      message: '更新项目失败',
    });
  }
};

/**
 * 删除项目
 */
export const deleteProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM projects WHERE project_id = ?', [id]);

    res.json({
      success: true,
      data: {
        message: '项目删除成功',
      },
    });
  } catch (error) {
    console.error('删除项目失败：', error);
    res.status(500).json({
      success: false,
      message: '删除项目失败',
    });
  }
};

/**
 * 获取统计数据
 */
export const getProjectStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;

    // 从查询参数中获取筛选条件
    const {
      projectType,      // 项目类型筛选
      settlementStatus, // 结算状态筛选
      isOverdue,        // 是否逾期筛选
      search,           // 搜索关键词
    } = req.query;

    // 构建WHERE条件
    let whereClause = '';
    const params: any[] = [];

    // 1. 权限过滤条件（保持原有逻辑）
    if (user.role === UserRole.DEPT_MANAGER) {
      whereClause = `WHERE dept_id = ?`;
      params.push(user.dept_id);
    } else if (user.role === UserRole.PROJECT_MANAGER) {
      whereClause = `WHERE leader_id = ?`;
      params.push(user.user_id);
    } else if (user.role === UserRole.EMPLOYEE) {
      whereClause = `WHERE JSON_CONTAINS(participants, ?)`;
      params.push(JSON.stringify([user.user_id]));
    }

    // 2. 筛选条件（在权限过滤基础上添加）
    const conditions: string[] = [];

    if (search) {
      conditions.push(`(p.contract_no LIKE ? OR p.contract_name LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`);
    }

    if (projectType) {
      conditions.push(`p.project_type = ?`);
      params.push(projectType);
    }

    if (settlementStatus) {
      conditions.push(`p.settlement_status = ?`);
      params.push(settlementStatus);
    }

    if (isOverdue !== undefined) {
      if (isOverdue === 'true') {
        conditions.push('p.end_date < CURDATE() AND p.progress < 100');
      } else {
        conditions.push('(p.end_date >= CURDATE() OR p.progress >= 100)');
      }
    }

    // 3. 组合完整的WHERE子句
    if (conditions.length > 0) {
      const filterClause = conditions.join(' AND ');
      whereClause = whereClause
        ? `${whereClause} AND ${filterClause}`
        : `WHERE ${filterClause}`;
    }

    // 查询统计数据
    const [statsRows] = await pool.query<any>(
      `SELECT
        COUNT(*) as totalProjects,
        SUM(CASE WHEN p.end_date < CURDATE() AND p.progress < 100 THEN 1 ELSE 0 END) as overdueProjects,
        SUM(p.contract_amount) as totalAmount,
        SUM(CASE WHEN p.settlement_status = '结算完成' THEN 1 ELSE 0 END) as settledProjects,
        AVG(p.progress) as avgProgress
       FROM projects p
       ${whereClause}`,
      params
    );

    const stat = statsRows[0];
    const settledRatio =
      stat.totalProjects > 0
        ? (stat.settledProjects / stat.totalProjects) * 100
        : 0;

    const result: ProjectStats = {
      totalProjects: stat.totalProjects,
      overdueProjects: stat.overdueProjects,
      totalAmount: stat.totalAmount || 0,
      settledProjects: stat.settledProjects,
      settledRatio: Math.round(settledRatio * 10) / 10,
      avgProgress: Math.round(stat.avgProgress || 0),
    };

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('获取统计数据失败：', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
    });
  }
};

/**
 * 生成合同编号
 */
export const generateContractNoHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const contractNo = await generateContractNo();

    res.json({
      success: true,
      data: {
        contract_no: contractNo,
      },
    });
  } catch (error) {
    console.error('生成合同编号失败：', error);
    res.status(500).json({
      success: false,
      message: '生成合同编号失败',
    });
  }
};
