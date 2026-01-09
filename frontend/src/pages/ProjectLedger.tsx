import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  DatePicker,
  InputNumber,
  message,
  Popconfirm,
  Progress,
  Dropdown,
  Checkbox,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  ExportOutlined,
  FilterOutlined,
  SettingOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';
import { useProjects, useProjectStats, useCreateProject, useUpdateProject, useDeleteProject, useGenerateContractNo } from '../hooks/useProjects';
import { ProjectExtended, SettlementStatus, IsSigned, ProjectType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';
import './ProjectLedger.css';

const { Option } = Select;
const { TextArea } = Input;

const ProjectLedger: React.FC = () => {
  const { user } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [settlementStatus, setSettlementStatus] = useState<string | undefined>();
  const [leaderId, setLeaderId] = useState<number | undefined>();
  const [isOverdue, setIsOverdue] = useState<boolean | undefined>();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectExtended | null>(null);
  const [viewingProject, setViewingProject] = useState<ProjectExtended | null>(null);
  const [form] = Form.useForm();
  const [columnSettingsVisible, setColumnSettingsVisible] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'contract_no', 'contract_name', 'start_date', 'end_date',
    'contract_amount', 'progress', 'leader_name', 'settlement_status',
    'is_signed', 'payment_amount', 'action'
  ]);

  // 查询数据
  const { data: projectsData, isLoading, refetch } = useProjects({
    page: pagination.current,
    pageSize: pagination.pageSize,
    search: searchText,
    settlementStatus,
    leaderId,
    isOverdue,
  });

  const { data: statsData } = useProjectStats();
  const { data: contractNoData } = useGenerateContractNo();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const isAdmin = user?.role === 'admin';

  // 处理表格变化
  const handleTableChange: TableProps['onChange'] = (pagination) => {
    setPagination({
      current: pagination.current || 1,
      pageSize: pagination.pageSize || 20,
    });
  };

  // 打开新增项目弹窗
  const handleAdd = () => {
    setEditingProject(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  // 打开编辑项目弹窗
  const handleEdit = (record: ProjectExtended) => {
    setEditingProject(record);
    form.setFieldsValue({
      ...record,
      start_date: dayjs(record.start_date),
      end_date: dayjs(record.end_date),
    });
    setIsModalOpen(true);
  };

  // 查看项目详情
  const handleView = (record: ProjectExtended) => {
    setViewingProject(record);
  };

  // 删除项目
  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      message.success('删除成功');
      refetch();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const projectData = {
        ...values,
        start_date: values.start_date.format('YYYY-MM-DD'),
        end_date: values.end_date.format('YYYY-MM-DD'),
      };

      if (editingProject) {
        await updateMutation.mutateAsync({ id: editingProject.project_id, data: projectData });
        message.success('更新成功');
      } else {
        await createMutation.mutateAsync(projectData);
        message.success('创建成功');
      }

      setIsModalOpen(false);
      refetch();
    } catch (error) {
      console.error('提交失败：', error);
    }
  };

  // 渲染进度条
  const renderProgress = (progress: number) => {
    let color = '#52c41a';
    if (progress < 30) color = '#ef4444';
    else if (progress < 70) color = '#f59e0b';

    return <Progress percent={progress} strokeColor={color} size="small" />;
  };

  // 渲染结算状态
  const renderSettlementStatus = (status: SettlementStatus) => {
    const colorMap = {
      [SettlementStatus.UNSETTLED]: 'default',
      [SettlementStatus.PARTIAL]: 'processing',
      [SettlementStatus.COMPLETED]: 'success',
    };
    return <Tag color={colorMap[status]}>{status}</Tag>;
  };

  // 渲染是否签订
  const renderIsSigned = (signed: IsSigned) => {
    return signed === IsSigned.SIGNED ? '✅' : '❌';
  };

  // 表格列配置
  const allColumns: ColumnsType<ProjectExtended> = [
    {
      title: '合同编号',
      dataIndex: 'contract_no',
      key: 'contract_no',
      width: 150,
      fixed: 'left',
    },
    {
      title: '合同名称',
      dataIndex: 'contract_name',
      key: 'contract_name',
      width: 200,
      fixed: 'left',
    },
    {
      title: '起止日期',
      key: 'dates',
      width: 180,
      render: (_, record) => `${record.start_date} ~ ${record.end_date}`,
    },
    {
      title: '合同金额(万)',
      dataIndex: 'contract_amount',
      key: 'contract_amount',
      width: 120,
      align: 'right',
    },
    {
      title: '项目进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 150,
      render: renderProgress,
    },
    {
      title: '项目负责人',
      dataIndex: 'leader_name',
      key: 'leader_name',
      width: 100,
    },
    {
      title: '结算情况',
      dataIndex: 'settlement_status',
      key: 'settlement_status',
      width: 100,
      render: renderSettlementStatus,
    },
    {
      title: '签订',
      dataIndex: 'is_signed',
      key: 'is_signed',
      width: 80,
      align: 'center',
      render: renderIsSigned,
    },
    {
      title: '回款金额(万)',
      dataIndex: 'payment_amount',
      key: 'payment_amount',
      width: 120,
      align: 'right',
    },
    {
      title: '所属部门',
      dataIndex: 'dept_name',
      key: 'dept_name',
      width: 100,
    },
    {
      title: '项目类型',
      dataIndex: 'project_type',
      key: 'project_type',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {isAdmin && (
            <Popconfirm
              title="确定要删除这个项目吗？"
              onConfirm={() => handleDelete(record.project_id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              >
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // 根据列设置过滤列
  const columns = allColumns.filter(col => col.key && visibleColumns.includes(col.key as string));

  return (
    <div className="project-ledger-container">
      {/* 统计看板 */}
      <div className="stats-cards">
        <Card className="stat-card">
          <div className="stat-value">{statsData?.data.totalProjects || 0}</div>
          <div className="stat-label">项目总数</div>
        </Card>
        <Card className="stat-card stat-card-warning">
          <div className="stat-value">{statsData?.data.overdueProjects || 0}</div>
          <div className="stat-label">逾期项目数</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-value">{statsData?.data.totalAmount || 0}</div>
          <div className="stat-label">总合同金额(万)</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-value">
            {statsData?.data.settledProjects || 0}/{statsData?.data.settledRatio || 0}%
          </div>
          <div className="stat-label">已结算项目数/占比</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-value">{statsData?.data.avgProgress || 0}%</div>
          <div className="stat-label">平均项目进度</div>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card className="search-card">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="搜索合同编号、名称、负责人..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ width: 300 }}
          />
          <Space>
            <Select
              placeholder="结算状态"
              value={settlementStatus}
              onChange={setSettlementStatus}
              allowClear
              style={{ width: 120 }}
            >
              <Option value={SettlementStatus.UNSETTLED}>未结算</Option>
              <Option value={SettlementStatus.PARTIAL}>部分结算</Option>
              <Option value={SettlementStatus.COMPLETED}>结算完成</Option>
            </Select>
            <Select
              placeholder="是否逾期"
              value={isOverdue}
              onChange={setIsOverdue}
              allowClear
              style={{ width: 120 }}
            >
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              刷新
            </Button>
            <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>
              新增项目
            </Button>
            <Dropdown.Button
              icon={<SettingOutlined />}
              onClick={() => setColumnSettingsVisible(true)}
              overlay={
                <div style={{ padding: 16, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                  <Checkbox.Group
                    value={visibleColumns}
                    onChange={(values) => setVisibleColumns(values as string[])}
                  >
                    <Space direction="vertical">
                      {allColumns.map(col => (
                        <Checkbox key={col.key as string} value={col.key}>
                          {col.title as string}
                        </Checkbox>
                      ))}
                    </Space>
                  </Checkbox.Group>
                </div>
              }
            >
              列设置
            </Dropdown.Button>
          </Space>
        </Space>
      </Card>

      {/* 项目表格 */}
      <Card className="table-card">
        <Table
          columns={columns}
          dataSource={projectsData?.data.data || []}
          rowKey="project_id"
          loading={isLoading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: projectsData?.data.pagination.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1500 }}
          rowClassName={(record) => record.is_overdue ? 'overdue-row' : ''}
        />
      </Card>

      {/* 新增/编辑项目弹窗 */}
      <Modal
        title={editingProject ? '编辑项目' : '新增项目'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        width={800}
        okText="确定"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            settlement_status: SettlementStatus.UNSETTLED,
            is_signed: IsSigned.UNSIGNED,
            progress: 0,
            payment_amount: 0,
          }}
        >
          <Form.Item label="合同编号" name="contract_no" initialValue={contractNoData?.data.contract_no}>
            <Input disabled />
          </Form.Item>

          <Form.Item
            label="合同名称"
            name="contract_name"
            rules={[{ required: true, message: '请输入合同名称' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="起止日期" required>
            <Space>
              <Form.Item
                name="start_date"
                rules={[{ required: true, message: '请选择开始日期' }]}
                style={{ margin: 0 }}
              >
                <DatePicker style={{ width: 200 }} />
              </Form.Item>
              <Form.Item
                name="end_date"
                rules={[{ required: true, message: '请选择结束日期' }]}
                style={{ margin: 0 }}
              >
                <DatePicker style={{ width: 200 }} />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item
            label="合同金额(万元)"
            name="contract_amount"
            rules={[{ required: true, message: '请输入合同金额' }]}
          >
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="项目进度(%)"
            name="progress"
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="结算状态"
            name="settlement_status"
          >
            <Select>
              <Option value={SettlementStatus.UNSETTLED}>未结算</Option>
              <Option value={SettlementStatus.PARTIAL}>部分结算</Option>
              <Option value={SettlementStatus.COMPLETED}>结算完成</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="是否签订"
            name="is_signed"
          >
            <Select>
              <Option value={IsSigned.SIGNED}>已签订</Option>
              <Option value={IsSigned.UNSIGNED}>未签订</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="回款金额(万元)"
            name="payment_amount"
          >
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="项目类型"
            name="project_type"
            rules={[{ required: true, message: '请选择项目类型' }]}
          >
            <Select>
              <Option value={ProjectType.CONSTRUCTION}>建筑施工</Option>
              <Option value={ProjectType.INTERIOR}>室内设计</Option>
              <Option value={ProjectType.LANDSCAPE}>园林景观</Option>
              <Option value={ProjectType.MUNICIPAL}>市政工程</Option>
              <Option value={ProjectType.OTHER}>其他</Option>
            </Select>
          </Form.Item>

          <Form.Item label="项目备注" name="remark">
            <TextArea rows={4} maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 项目详情弹窗 */}
      <Modal
        title="项目详情"
        open={!!viewingProject}
        onCancel={() => setViewingProject(null)}
        footer={[
          <Button key="close" onClick={() => setViewingProject(null)}>
            关闭
          </Button>,
        ]}
      >
        {viewingProject && (
          <div className="project-detail">
            <p><strong>合同编号：</strong>{viewingProject.contract_no}</p>
            <p><strong>合同名称：</strong>{viewingProject.contract_name}</p>
            <p><strong>起止日期：</strong>{viewingProject.start_date} ~ {viewingProject.end_date}</p>
            <p><strong>合同金额：</strong>{viewingProject.contract_amount} 万元</p>
            <p><strong>项目进度：</strong>{viewingProject.progress}%</p>
            <p><strong>项目负责人：</strong>{viewingProject.leader_name}</p>
            <p><strong>结算情况：</strong>{viewingProject.settlement_status}</p>
            <p><strong>是否签订：</strong>{viewingProject.is_signed}</p>
            <p><strong>回款金额：</strong>{viewingProject.payment_amount} 万元</p>
            <p><strong>所属部门：</strong>{viewingProject.dept_name}</p>
            <p><strong>项目类型：</strong>{viewingProject.project_type}</p>
            {viewingProject.remark && <p><strong>项目备注：</strong>{viewingProject.remark}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProjectLedger;
