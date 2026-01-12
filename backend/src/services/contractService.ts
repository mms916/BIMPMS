import pool from '../config/database';
import { Project } from '../types';

/**
 * 生成合同编号
 * 格式：局0113(5个字符: 局+0113) + 日期YYYYMMDD(8位) + 序号(4位)
 * 基于历史最大合同编号递增（使用最后一个合同的日期和序号）
 */
export const generateContractNo = async (): Promise<string> => {
  const prefix = '局0113';
  const prefixLength = 5; // "局0113" 共5个字符

  try {
    // 查询所有合同中最大的合同编号
    const [rows] = await pool.query(
      `SELECT contract_no
       FROM projects
       WHERE contract_no LIKE ?
       ORDER BY contract_no DESC
       LIMIT 1`,
      [`${prefix}%`]
    ) as any[];

    if (rows.length > 0) {
      const lastContractNo = rows[0].contract_no;
      // 提取日期部分和序号
      // 前5位是前缀"局0113"
      // 接下来8位是日期
      // 最后4位是序号
      const datePart = lastContractNo.substring(prefixLength, prefixLength + 8); // 8位日期
      const lastSerial = parseInt(lastContractNo.slice(-4)); // 4位序号

      // 序号直接+1
      const nextSerial = lastSerial + 1;
      const serialStr = nextSerial.toString().padStart(4, '0');

      return `${prefix}${datePart}${serialStr}`;
    } else {
      // 没有任何合同，使用今天的日期，从0001开始
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `${prefix}${todayStr}0001`;
    }
  } catch (error) {
    console.error('生成合同编号失败：', error);
    throw new Error('生成合同编号失败');
  }
};

/**
 * 验证合同编号唯一性
 */
export const isContractNoUnique = async (
  contractNo: string,
  excludeProjectId?: number
): Promise<boolean> => {
  try {
    let query = 'SELECT COUNT(*) as count FROM projects WHERE contract_no = ?';
    const params: any[] = [contractNo];

    if (excludeProjectId) {
      query += ' AND project_id != ?';
      params.push(excludeProjectId);
    }

    const [rows] = await pool.query(query, params) as any[];
    const count = rows[0].count as number;

    return count === 0;
  } catch (error) {
    console.error('验证合同编号唯一性失败：', error);
    return false;
  }
};
