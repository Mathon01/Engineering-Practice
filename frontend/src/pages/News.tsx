import { ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Select, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { api, formatTime } from '../api/client';
import PageHeader from '../components/PageHeader';
import SentimentTag from '../components/SentimentTag';
import StockLink from '../components/StockLink';
import type { NewsItem } from '../types';

export default function News() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [scope, setScope] = useState<string | undefined>();
  const [sentiment, setSentiment] = useState<string | undefined>();
  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (scope) params.set('scope', scope);
      if (sentiment) params.set('sentiment', sentiment);
      setItems((await api.news(params)).items);
    } catch (error) { message.error(error instanceof Error ? error.message : '加载失败'); } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const columns: ColumnsType<NewsItem> = [
    { title: '标题', render: (_: unknown, row: NewsItem) => <Space direction="vertical" size={2}><span>{row.title}</span><span className="muted">{row.summary}</span></Space> },
    { title: '标的', width: 150, render: (_: unknown, row: NewsItem) => row.code ? <StockLink code={row.code} name={row.name} /> : <Tag>市场</Tag> },
    { title: '范围', width: 90, dataIndex: 'scope', render: (value: string) => <Tag>{value}</Tag> },
    { title: '情绪', width: 90, dataIndex: 'sentiment', render: (value: string) => <SentimentTag sentiment={value} /> },
    { title: '重要性', width: 90, dataIndex: 'importance', render: (value: number) => <Tag color={value >= 4 ? 'orange' : 'default'}>{value}</Tag> },
    { title: '来源', width: 130, dataIndex: 'source' },
    { title: '发布时间', width: 180, render: (_: unknown, row: NewsItem) => formatTime(row.published_at) },
  ];
  return (
    <>
      <PageHeader title="News" description="市场资讯、个股新闻和本地情绪标注" extra={<Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>} />
      <Card><div className="toolbar"><Space wrap><Select allowClear placeholder="范围" value={scope} onChange={setScope} style={{ width: 140 }} options={[{ label: '市场', value: 'market' }, { label: '个股', value: 'stock' }]} /><Select allowClear placeholder="情绪" value={sentiment} onChange={setSentiment} style={{ width: 140 }} options={[{ label: '积极', value: 'positive' }, { label: '中性', value: 'neutral' }, { label: '负面', value: 'negative' }]} /><Button onClick={load}>应用筛选</Button></Space></div><Table<NewsItem> rowKey="id" loading={loading} columns={columns} dataSource={items} pagination={{ pageSize: 12 }} /></Card>
    </>
  );
}

