import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';

/**
 * 权限检查中间件工厂函数
 * @param allowedRoles 允许访问的角色列表
 */
export const checkPermission = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: '未认证，请先登录',
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: '您无此操作权限，请联系管理员',
      });
      return;
    }

    next();
  };
};

/**
 * 检查是否是管理员
 */
export const isAdmin = checkPermission([UserRole.ADMIN]);

/**
 * 检查是否是管理员或部门负责人
 */
export const isAdminOrDeptManager = checkPermission([
  UserRole.ADMIN,
  UserRole.DEPT_MANAGER,
]);

/**
 * 检查是否是管理员、部门负责人或项目负责人
 */
export const isAdminOrManager = checkPermission([
  UserRole.ADMIN,
  UserRole.DEPT_MANAGER,
  UserRole.PROJECT_MANAGER,
]);

/**
 * 检查用户是否有编辑权限
 * 根据项目ID和用户角色判断
 */
export const canEditProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user;
  const projectId = parseInt(req.params.id);

  if (!user) {
    res.status(401).json({
      success: false,
      message: '未认证，请先登录',
    });
    return;
  }

  // 管理员可以编辑所有项目
  if (user.role === UserRole.ADMIN) {
    next();
    return;
  }

  // 这里需要查询数据库判断用户是否有权限编辑该项目
  // 为了简化，这里先允许所有已认证用户通过
  // 实际项目中应该在service层进行详细的权限判断
  next();
};

/**
 * 检查用户是否有删除权限（仅管理员）
 */
export const canDeleteProject = isAdmin;
