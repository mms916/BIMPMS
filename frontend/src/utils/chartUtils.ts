import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { TeamMemberStats, TaskCompletionStats } from '../types/tasks';

// 注册ECharts组件
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  CanvasRenderer,
]);

// 工作台专用颜色系统
export const WB_COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    light: '#9CA3AF',
  },
  bg: {
    card: '#FFFFFF',
    page: '#F5F7FA',
  },
};

/**
 * 创建团队工作统计图表配置（双Y轴：柱状图 + 折线图）
 * @param data 团队统计数据
 */
export const createTeamStatsChartOption = (data: TeamMemberStats[]) => {
  const xAxisData = data.map((item) => item.userName);
  const barData = data.map((item) => item.taskCount);
  const lineData = data.map((item) => item.hours);

  // 计算Y轴最大值
  const maxBarValue = Math.max(...barData, 0);
  const maxLineValue = Math.max(...lineData, 0);

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: WB_COLORS.text.secondary,
        },
      },
    },
    legend: {
      data: ['工作项数', '工时'],
      top: 0,
      right: 0,
      textStyle: {
        color: WB_COLORS.text.secondary,
        fontSize: 12,
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisPointer: {
        type: 'shadow',
      },
      axisLabel: {
        color: WB_COLORS.text.secondary,
        fontSize: 12,
        rotate: 15,
      },
      axisLine: {
        lineStyle: {
          color: '#E5E7EB',
        },
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '工作项数',
        min: 0,
        max: Math.ceil(maxBarValue * 1.2 / 5) * 5, // 向上取整到5的倍数
        interval: Math.ceil((Math.ceil(maxBarValue * 1.2 / 5) * 5) / 4),
        axisLabel: {
          formatter: '{value}',
          color: WB_COLORS.text.secondary,
          fontSize: 12,
        },
        axisLine: {
          lineStyle: {
            color: '#E5E7EB',
          },
        },
        splitLine: {
          lineStyle: {
            color: '#F3F4F6',
            type: 'dashed',
          },
        },
      },
      {
        type: 'value',
        name: '工时（天）',
        min: 0,
        max: Math.ceil(maxLineValue * 1.2 / 5) * 5,
        interval: Math.ceil((Math.ceil(maxLineValue * 1.2 / 5) * 5) / 4),
        axisLabel: {
          formatter: '{value}',
          color: WB_COLORS.text.secondary,
          fontSize: 12,
        },
        axisLine: {
          lineStyle: {
            color: '#E5E7EB',
          },
        },
        splitLine: {
          show: false,
        },
      },
    ],
    series: [
      {
        name: '工作项数',
        type: 'bar',
        data: barData,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#3B82F6' },
            { offset: 1, color: '#60A5FA' },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: 24,
      },
      {
        name: '工时',
        type: 'line',
        yAxisIndex: 1,
        data: lineData,
        smooth: true,
        lineStyle: {
          width: 2,
          color: WB_COLORS.success,
        },
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          borderColor: WB_COLORS.success,
          borderWidth: 2,
          color: '#FFFFFF',
        },
      },
    ],
  };
};

/**
 * 创建任务完成环形图配置
 * @param data 任务完成统计数据
 */
export const createTaskCompletionChartOption = (data: TaskCompletionStats) => {
  const chartData = [
    { value: data.completed, name: '已完成', color: WB_COLORS.primary },
    { value: data.inProgress, name: '进行中', color: WB_COLORS.purple },
    { value: data.overdue, name: '已逾期', color: WB_COLORS.warning },
    { value: data.notStarted, name: '未开始', color: WB_COLORS.success },
  ];

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    series: [
      {
        type: 'pie',
        radius: ['55%', '75%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#FFFFFF',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: false,
          },
        },
        labelLine: {
          show: false,
        },
        data: chartData,
      },
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: 'center',
        style: {
          text: `${data.completionRate}%`,
          textAlign: 'center',
          textBaseline: 'middle',
          fill: WB_COLORS.text.primary,
          fontSize: 32,
          fontWeight: 'bold',
        },
      },
    ],
  };
};

/**
 * 通用ECharts响应式配置
 * @param chart ECharts实例
 * @param container 容器元素
 */
export const setupChartResponsive = (
  chart: echarts.ECharts,
  container: HTMLElement
) => {
  // 监听容器大小变化
  const resizeObserver = new ResizeObserver(() => {
    chart.resize();
  });
  resizeObserver.observe(container);

  // 返回清理函数
  return () => {
    resizeObserver.disconnect();
  };
};
