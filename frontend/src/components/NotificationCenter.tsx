import React, { useState } from 'react';
import { Badge, Dropdown, List, Button, Empty, Tag } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../hooks/useNotifications';
import type { Notification } from '../types/notifications';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const NotificationCenter: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { data: notifications, refetch } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const unreadCount = notifications?.data?.filter((n: Notification) => !n.isRead).length || 0;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead.mutateAsync(notification.id);
      refetch();
    }
    // TODO: 处理点击跳转逻辑（跳转到任务或项目详情）
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead.mutateAsync();
    refetch();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_overdue':
      case 'project_overdue':
        return '⚠️';
      case 'task_assigned':
        return '📋';
      case 'task_status_changed':
        return '🔄';
      case 'comment_mentioned':
        return '💬';
      default:
        return '🔔';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      default: return 'default';
    }
  };

  const notificationContent = (
    <div style={{ width: 380, maxHeight: 500 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>通知中心</strong>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={handleMarkAllRead}>
            全部已读
          </Button>
        )}
      </div>
      <List
        style={{ maxHeight: 400, overflow: 'auto' }}
        dataSource={notifications?.data || []}
        locale={{ emptyText: <Empty description="暂无通知" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        renderItem={(item: Notification) => (
          <List.Item
            key={item.id}
            style={{
              padding: '12px 16px',
              background: item.isRead ? 'transparent' : '#f0f7ff',
              cursor: 'pointer',
              borderBottom: '1px solid #f0f0f0'
            }}
            onClick={() => handleNotificationClick(item)}
          >
            <List.Item.Meta
              avatar={<span style={{ fontSize: 20 }}>{getNotificationIcon(item.type)}</span>}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: item.isRead ? 'normal' : 600 }}>{item.title}</span>
                  <Tag color={getPriorityColor(item.priority)} style={{ fontSize: 10, margin: 0 }}>
                    {item.priority === 'high' ? '重要' : item.priority === 'medium' ? '中等' : '普通'}
                  </Tag>
                </div>
              }
              description={
                <div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{item.message}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>{dayjs(item.createdAt).fromNow()}</div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      trigger={['click']}
      dropdownRender={() => notificationContent}
      placement="bottomRight"
    >
      <Badge count={unreadCount} overflowCount={99}>
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: 18 }} />}
          style={{ color: '#fff' }}
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationCenter;
