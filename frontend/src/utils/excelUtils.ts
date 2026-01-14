import * as XLSX from 'xlsx';

// 导出列配置接口
export interface ExportColumnConfig {
  key: string;
  title: string;
  width: number;
  formatter?: (value: any, row: any) => any;
}

// 项目数据接口
interface ProjectData {
  project_id: number;
  contract_no: string;
  contract_name: string;
  start_date: string;
  end_date: string;
  contract_amount: string;
  progress: number;
  leader_name: string;
  settlement_status: string;
  is_signed: string;
  payment_amount: string;
  dept_name: string;
  project_type: string;
  remark?: string;
  is_overdue: number;
}

// 导出配置接口
export interface ExportConfig {
  columns: string[];
}

// 可导出的字段配置
export const EXPORT_COLUMNS: ExportColumnConfig[] = [
  { key: 'contract_no', title: '合同编号', width: 18 },
  { key: 'contract_name', title: '合同名称', width: 30 },
  { key: 'dates', title: '起止日期', width: 25, formatter: (_v: any, row: ProjectData) => {
    const start = formatDate(row.start_date);
    const end = formatDate(row.end_date);
    return `${start} ~ ${end}`;
  }},
  { key: 'contract_amount', title: '合同金额(万元)', width: 18 },
  { key: 'progress', title: '项目进度(%)', width: 15, formatter: (v: number) => `${v}%` },
  { key: 'leader_name', title: '项目负责人', width: 15 },
  { key: 'settlement_status', title: '结算状态', width: 12 },
  { key: 'is_signed', title: '签订状态', width: 12, formatter: (v: string) => v === '已签订' ? '已签订' : '未签订' },
  { key: 'payment_amount', title: '回款金额(万元)', width: 18 },
  { key: 'dept_name', title: '所属部门', width: 15 },
  { key: 'project_type', title: '项目类型', width: 15 },
  { key: 'is_overdue', title: '是否逾期', width: 12, formatter: (v: number) => v ? '是' : '否' },
  { key: 'remark', title: '备注', width: 40 },
];

// 格式化日期
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 导出项目数据到 Excel
 * @param data 项目数据数组
 * @param config 导出配置
 * @param options 导出选项
 */
export const exportProjectsToExcel = (
  data: ProjectData[],
  config: ExportConfig,
  options?: { filename?: string }
): void => {
  if (!data || data.length === 0) {
    throw new Error('没有可导出的数据');
  }

  // 筛选需要导出的列配置
  const selectedColumns = EXPORT_COLUMNS.filter(col => config.columns.includes(col.key));

  if (selectedColumns.length === 0) {
    throw new Error('请至少选择一个导出字段');
  }

  // 构建表头
  const headers = selectedColumns.map(col => col.title);

  // 构建数据行
  const rows = data.map((project, index) => {
    return selectedColumns.map(col => {
      if (col.formatter) {
        return col.formatter((project as any)[col.key], project);
      }
      return (project as any)[col.key] || '';
    });
  });

  // 添加序号列
  const dataWithIndex = rows.map((row, index) => [index + 1, ...row]);
  const finalHeaders = ['序号', ...headers];

  // 创建工作表
  const worksheet = XLSX.utils.aoa_to_sheet([finalHeaders, ...dataWithIndex]);

  // 设置列宽
  const colWidths = [{ wch: 6 }, ...selectedColumns.map(col => ({ wch: col.width }))];
  worksheet['!cols'] = colWidths;

  // 创建工作簿
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '项目台账');

  // 生成文件名
  const now = new Date();
  const timestamp = now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') + '_' +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  const filename = options?.filename || `项目台账_export_${timestamp}.xlsx`;

  // 导出文件
  XLSX.writeFile(workbook, filename);
};

/**
 * 获取默认导出字段
 */
export const getDefaultExportColumns = (): string[] => {
  return [
    'contract_no',
    'contract_name',
    'dates',
    'contract_amount',
    'progress',
    'leader_name',
    'settlement_status',
    'is_signed',
    'payment_amount',
    'dept_name',
    'project_type'
  ];
};
