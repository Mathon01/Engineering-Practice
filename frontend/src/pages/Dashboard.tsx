import { ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Col, List, Row, Space, Spin, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ReactECharts from 'echarts-for-react';
import { useEffect, useMemo, useState } from 'react';
import { api, changeColor, formatCompact, formatNumber, formatTime } from '../api/client';
import MetricCard from '../components/MetricCard';
import PageHeader from '../components/PageHeader';
import PriceText from '../components/PriceText';
import RiskNotice from '../components/RiskNotice';
import SignalTag from '../components/SignalTag';
import StockLink from '../components/StockLink';
import type { Advice, CollectionJob, NewsItem, Snapshot, WatchItem } from '../types';

const rankColumns: ColumnsType<Snapshot> = [
  { title: '股票', render: (_: unknown, row: Snapshot) => <StockLink code={row.code} name={row.name} /> },
  { title: '价格', align: 'right', render: (_: unknown, row: Snapshot) => <span className="number-cell">{formatNumber(row.price, 2)}</span> },
  { title: '涨跌幅', align: 'right', render: (_: unknown, row: Snapshot) => <span style={{ color: changeColor(row.change_pct), fontVariantNumeric: 'tabular-nums' }}>{formatNumber(row.change_pct, 2)}%</span> },
  { title: '成交额', align: 'right', render: (_: unknown, row: Snapshot) => formatCompact(row.amount) },
];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [market, setMarket] = useState<Snapshot[]>([]);
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [advice, setAdvice] = useState<Advice[]>([]);
  const [jobs, setJobs] = useState<CollectionJob[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [marketRes, watchRes, newsRes, adviceRes, jobsRes] = await Promise.all([
        api.market(new URLSearchParams({ page_size: '200', sort_by: 'change_pct', sort_order: 'desc' })),
        api.watchlist(),
        api.news(new URLSearchParams({ limit: '6' })),
        api.advice(),
        api.jobs(5),
      ]);
      setMarket(marketRes.items);
      setWatchlist(watchRes.items);
      setNews(newsRes.items);
      setAdvice(adviceRes.items.slice(0, 6));
      setJobs(jobsRes.items);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const indices = market.filter((item) => item.security_type === 'index').slice(0, 5);
  const stocks = market.filter((item) => item.security_type === 'stock');
  const topGainers = stocks.slice(0, 8);
  const topLosers = [...stocks].sort((a, b) => (a.change_pct ?? 0) - (b.change_pct ?? 0)).slice(0, 8);
  const latestJob = jobs[0];
  const distribution = useMemo(() => {
    const grouped = advice.reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.signal]: (acc[item.signal] ?? 0) + 1 }), {});
    return { tooltip: { trigger: 'item' }, series: [{ type: 'pie', radius: ['48%', '72%'], label: { formatter: '{b}: {c}' }, data: Object.entries(grouped).map(([name, value]) => ({ name, value })) }] };
  }, [advice]);

  if (loading) return <Spin fullscreen tip="加载市场数据" />;

  return (
    <>
      <PageHeader title="Dashboard" description={`最近采集：${latestJob ? `${latestJob.job_type} · ${formatTime(latestJob.finished_at)}` : '-'}`} extra={<Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>} />
      <Row gutter={[16, 16]}>{indices.slice(0, 3).map((item) => <Col xs={24} md={8} key={item.code}><MetricCard title={`${item.name} ${item.code}`} value={item.price} change={item.change_pct} /></Col>)}</Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}><Card title="涨跌榜" className="table-card"><Row gutter={16}><Col xs={24} md={12}><Table<Snapshot> size="small" rowKey="code" pagination={false} dataSource={topGainers} columns={rankColumns} /></Col><Col xs={24} md={12}><Table<Snapshot> size="small" rowKey="code" pagination={false} dataSource={topLosers} columns={rankColumns} /></Col></Row></Card></Col>
        <Col xs={24} lg={8}><Card title="策略分布"><ReactECharts option={distribution} style={{ height: 280 }} /></Card></Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="自选股概览" className="table-card">
            <Table<WatchItem> size="small" rowKey={(row) => row.stock.code} pagination={false} dataSource={watchlist} columns={[
              { title: '股票', render: (_: unknown, row: WatchItem) => <StockLink code={row.stock.code} name={row.stock.name} /> },
              { title: '最新价', align: 'right', render: (_: unknown, row: WatchItem) => formatNumber(row.latest_snapshot?.price, 2) },
              { title: '涨跌幅', align: 'right', render: (_: unknown, row: WatchItem) => <PriceText value={row.latest_snapshot?.change_pct} suffix="%" /> },
              { title: '策略', render: (_: unknown, row: WatchItem) => <SignalTag signal={row.latest_advice?.signal} /> },
              { title: '置信度', align: 'right', render: (_: unknown, row: WatchItem) => row.latest_advice ? `${formatNumber(row.latest_advice.confidence, 0)}%` : '-' },
            ]} />
          </Card>
        </Col>
        <Col xs={24} lg={10}><Card title="最新资讯"><List className="compact-list" dataSource={news} renderItem={(item: NewsItem) => <List.Item><List.Item.Meta title={<Typography.Text>{item.title}</Typography.Text>} description={<Space direction="vertical" size={2}><Typography.Text type="secondary">{item.source} · {formatTime(item.published_at)}</Typography.Text><Typography.Text type="secondary">{item.summary}</Typography.Text></Space>} /></List.Item>} /></Card></Col>
      </Row>
      <div style={{ marginTop: 16 }}><RiskNotice /></div>
    </>
  );
}

