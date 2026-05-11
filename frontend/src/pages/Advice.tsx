import { PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Progress, Select, Space, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { api, formatTime } from '../api/client';
import PageHeader from '../components/PageHeader';
import RiskNotice from '../components/RiskNotice';
import SignalTag from '../components/SignalTag';
import StockLink from '../components/StockLink';
import type { Advice as AdviceType } from '../types';

export default function Advice() {
  const [loading, setLoading] = useState(false);
  const [signal, setSignal] = useState<string | undefined>();
  const [items, setItems] = useState<AdviceType[]>([]);
  const load = async () => { setLoading(true); try { setItems((await api.advice(signal)).items); } catch (error) { message.error(error instanceof Error ? error.message : '加载失败'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const analyzeWatchlist = async () => { try { await api.analyzeWatchlist(); message.success('自选股分析完成'); await load(); } catch (error) { message.error(error instanceof Error ? error.message : '分析失败'); } };
  const columns: ColumnsType<AdviceType> = [
    { title: '股票', width: 150, render: (_: unknown, row: AdviceType) => row.code ? <StockLink code={row.code} name={row.name} /> : '-' },
    { title: '策略', width: 110, dataIndex: 'signal', render: (value: string) => <SignalTag signal={value} /> },
    { title: '置信度', width: 160, dataIndex: 'confidence', render: (value: number) => <Progress percent={Math.round(value)} size="small" /> },
    { title: '理由', render: (_: unknown, row: AdviceType) => <Space direction="vertical" size={2}><Typography.Text>{row.reasoning}</Typography.Text><Typography.Text type="secondary">{row.strategy}</Typography.Text></Space> },
    { title: '生成时间', width: 180, render: (_: unknown, row: AdviceType) => formatTime(row.created_at) },
  ];
  return (
    <>
      <PageHeader title="Advice" description="关注股和全市场股票的最新策略建议" extra={<><Button icon={<PlayCircleOutlined />} type="primary" onClick={analyzeWatchlist}>分析自选股</Button><Button icon={<ReloadOutlined />} onClick={load}>刷新</Button></>} />
      <Card><div className="toolbar"><Space><Select allowClear placeholder="策略类型" value={signal} onChange={setSignal} style={{ width: 160 }} options={['重点关注', '谨慎买入', '持有', '减仓', '回避'].map((value) => ({ label: value, value }))} /><Button onClick={load}>应用筛选</Button></Space></div><Table<AdviceType> rowKey="id" loading={loading} columns={columns} dataSource={items} pagination={{ pageSize: 10 }} /></Card>
      <div style={{ marginTop: 16 }}><RiskNotice /></div>
    </>
  );
}

