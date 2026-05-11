import { DatabaseOutlined, FileSearchOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Descriptions, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { api, formatTime } from '../api/client';
import PageHeader from '../components/PageHeader';
import type { CollectionJob } from '../types';

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, any> | null>(null);
  const [jobs, setJobs] = useState<CollectionJob[]>([]);
  const [loading, setLoading] = useState(false);
  const load = async () => { setLoading(true); try { const [s, j] = await Promise.all([api.settings(), api.jobs(20)]); setSettings(s); setJobs(j.items); } catch (error) { message.error(error instanceof Error ? error.message : '加载失败'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const runTask = async (task: 'market' | 'watch' | 'news' | 'kline') => { setLoading(true); try { if (task === 'market') await api.collectMarket(); if (task === 'watch') await api.collectWatch(); if (task === 'news') await api.collectNews(); if (task === 'kline') await api.collectKline(); message.success('任务执行完成'); await load(); } catch (error) { message.error(error instanceof Error ? error.message : '执行失败'); } finally { setLoading(false); } };
  const columns: ColumnsType<CollectionJob> = [
    { title: '任务', dataIndex: 'job_type', width: 150 },
    { title: '状态', dataIndex: 'status', width: 100, render: (value: string) => <Tag color={value === 'success' ? 'green' : 'orange'}>{value}</Tag> },
    { title: '来源', dataIndex: 'source', width: 100 },
    { title: '结果', render: (_: unknown, row: CollectionJob) => <Typography.Text code>{JSON.stringify(row.result_summary ?? {})}</Typography.Text> },
    { title: '开始时间', width: 180, render: (_: unknown, row: CollectionJob) => formatTime(row.started_at) },
  ];
  return (
    <>
      <PageHeader title="Settings" description="采集间隔、风控参数、OpenClaw 任务状态和演示任务触发" extra={<Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>} />
      <div className="settings-grid"><Card title={<Space><DatabaseOutlined />运行环境</Space>}><Descriptions column={1} size="small"><Descriptions.Item label="环境">{settings?.app_env}</Descriptions.Item><Descriptions.Item label="数据库">{settings?.database}</Descriptions.Item><Descriptions.Item label="自动演示数据">{String(settings?.auto_seed_demo_data)}</Descriptions.Item><Descriptions.Item label="分析引擎">{settings?.analysis_engine}</Descriptions.Item></Descriptions></Card><Card title={<Space><FileSearchOutlined />采集间隔</Space>}><Descriptions column={1} size="small"><Descriptions.Item label="全市场">{settings?.collector_intervals?.market_snapshot_seconds}s</Descriptions.Item><Descriptions.Item label="关注股">{settings?.collector_intervals?.watch_snapshot_seconds}s</Descriptions.Item><Descriptions.Item label="资讯">{settings?.collector_intervals?.news_seconds}s</Descriptions.Item><Descriptions.Item label="策略">{settings?.collector_intervals?.advice_seconds}s</Descriptions.Item></Descriptions></Card><Card title="风控与推送"><Descriptions column={1} size="small"><Descriptions.Item label="最小请求间隔">{settings?.risk_control?.request_min_interval_seconds}s</Descriptions.Item><Descriptions.Item label="失败降频阈值">{settings?.risk_control?.fetch_failure_downgrade_threshold}</Descriptions.Item><Descriptions.Item label="自选股上限">{settings?.risk_control?.max_watchlist_size}</Descriptions.Item><Descriptions.Item label="QQBot">{settings?.qqbot?.target}</Descriptions.Item></Descriptions></Card></div>
      <Card title="OpenClaw 演示任务" style={{ marginTop: 16 }}><Space wrap><Button icon={<PlayCircleOutlined />} loading={loading} onClick={() => runTask('market')}>采集全市场快照</Button><Button icon={<PlayCircleOutlined />} loading={loading} onClick={() => runTask('watch')}>采集关注股快照</Button><Button icon={<PlayCircleOutlined />} loading={loading} onClick={() => runTask('news')}>采集资讯</Button><Button icon={<PlayCircleOutlined />} loading={loading} onClick={() => runTask('kline')}>同步日 K</Button></Space></Card>
      <Card title="任务记录" className="table-card" style={{ marginTop: 16 }}><Table<CollectionJob> rowKey="id" loading={loading} dataSource={jobs} columns={columns} pagination={{ pageSize: 8 }} /></Card>
    </>
  );
}

