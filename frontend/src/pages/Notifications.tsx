import { ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { api, formatTime } from '../api/client';
import PageHeader from '../components/PageHeader';
import type { NotificationItem } from '../types';

export default function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [status, setStatus] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const load = async () => { setLoading(true); try { setItems((await api.notifications(status)).items); } catch (error) { message.error(error instanceof Error ? error.message : '加载失败'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const columns: ColumnsType<NotificationItem> = [
    { title: '类型', dataIndex: 'notification_type', width: 150, render: (value: string) => <Tag>{value}</Tag> },
    { title: '内容', render: (_: unknown, row: NotificationItem) => <Space direction="vertical" size={2}><Typography.Text strong>{row.title}</Typography.Text><Typography.Text type="secondary">{row.content}</Typography.Text></Space> },
    { title: '目标', dataIndex: 'target_channel', width: 180 },
    { title: '状态', dataIndex: 'status', width: 110, render: (value: string) => <Tag color={value === 'sent' ? 'green' : value === 'failed' ? 'red' : 'orange'}>{value}</Tag> },
    { title: '重试', dataIndex: 'retry_count', width: 80 },
    { title: '创建时间', width: 180, render: (_: unknown, row: NotificationItem) => formatTime(row.created_at) },
    { title: '发送时间', width: 180, render: (_: unknown, row: NotificationItem) => formatTime(row.sent_at) },
  ];
  return (
    <>
      <PageHeader title="Notifications" description="QQBot 推送任务、发送结果和失败重试记录" extra={<Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>} />
      <Card><div className="toolbar"><Space><Select allowClear placeholder="状态" value={status} onChange={setStatus} style={{ width: 150 }} options={[{ label: 'pending', value: 'pending' }, { label: 'sent', value: 'sent' }, { label: 'failed', value: 'failed' }]} /><Button onClick={load}>应用筛选</Button></Space></div><Table<NotificationItem> rowKey="id" loading={loading} dataSource={items} columns={columns} pagination={{ pageSize: 10 }} /></Card>
    </>
  );
}

