import { PlayCircleOutlined, ReloadOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { Button, Card, Col, Descriptions, List, Row, Space, Spin, Timeline, Typography, message } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, formatCompact, formatNumber, formatTime } from '../api/client';
import PageHeader from '../components/PageHeader';
import PriceText from '../components/PriceText';
import RiskNotice from '../components/RiskNotice';
import SentimentTag from '../components/SentimentTag';
import SignalTag from '../components/SignalTag';
import type { Advice, Kline, NewsItem, Snapshot, Stock } from '../types';

type StockDetailData = Stock & { latest_snapshot?: Snapshot | null; latest_advice?: Advice | null; is_watched: boolean };

export default function StockDetail() {
  const { code = '' } = useParams();
  const [loading, setLoading] = useState(true);
  const [stock, setStock] = useState<StockDetailData | null>(null);
  const [kline, setKline] = useState<Kline[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [history, setHistory] = useState<Advice[]>([]);

  const load = async () => {
    if (!code) return;
    setLoading(true);
    try {
      const [stockRes, klineRes, snapshotRes, newsRes, historyRes] = await Promise.all([api.stock(code), api.kline(code, 90), api.stockSnapshots(code, 160), api.stockNews(code, 10), api.adviceHistory(code, 20)]);
      setStock(stockRes); setKline(klineRes.items); setSnapshots(snapshotRes.items); setNews(newsRes.items); setHistory(historyRes.items);
    } catch (error) { message.error(error instanceof Error ? error.message : '加载失败'); } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [code]);

  const analyze = async () => { try { await api.analyze(code); message.success('分析完成'); await load(); } catch (error) { message.error(error instanceof Error ? error.message : '分析失败'); } };
  const toggleWatch = async () => { if (!stock) return; try { stock.is_watched ? await api.removeWatch(stock.code) : await api.addWatch(stock.code); message.success(stock.is_watched ? '已移出自选股' : '已加入自选股'); await load(); } catch (error) { message.error(error instanceof Error ? error.message : '操作失败'); } };

  const klineOption = useMemo(() => {
    const dates = kline.map((item) => item.trade_date);
    const candle = kline.map((item) => [item.open, item.close, item.low, item.high]);
    const closes = kline.map((item) => item.close);
    const ma = (windowSize: number) => closes.map((_, index) => { const sample = closes.slice(Math.max(0, index - windowSize + 1), index + 1); return Number((sample.reduce((sum, value) => sum + value, 0) / sample.length).toFixed(2)); });
    return { animation: false, tooltip: { trigger: 'axis' }, legend: { data: ['K线', 'MA5', 'MA20', 'MA60'] }, grid: { left: 48, right: 24, top: 36, bottom: 42 }, xAxis: { type: 'category', data: dates, boundaryGap: true }, yAxis: { scale: true }, dataZoom: [{ type: 'inside' }, { type: 'slider', height: 18, bottom: 8 }], series: [{ name: 'K线', type: 'candlestick', data: candle }, { name: 'MA5', type: 'line', data: ma(5), smooth: true, symbol: 'none' }, { name: 'MA20', type: 'line', data: ma(20), smooth: true, symbol: 'none' }, { name: 'MA60', type: 'line', data: ma(60), smooth: true, symbol: 'none' }] };
  }, [kline]);
  const snapshotOption = useMemo(() => ({ tooltip: { trigger: 'axis' }, grid: { left: 48, right: 24, top: 28, bottom: 32 }, xAxis: { type: 'category', data: snapshots.map((item) => formatTime(item.snapshot_time).slice(5, 16)) }, yAxis: { type: 'value', scale: true }, series: [{ name: '最新价', type: 'line', data: snapshots.map((item) => item.price), smooth: true, areaStyle: {} }] }), [snapshots]);

  if (loading) return <Spin fullscreen tip="加载个股详情" />;
  if (!stock) return null;
  const snapshot = stock.latest_snapshot;
  const advice = history[0] ?? stock.latest_advice;
  const indicators = advice?.indicators ?? {};

  return (
    <>
      <PageHeader title={`${stock.name} ${stock.code}`} description={`${stock.market} · ${stock.industry ?? '未分类'}`} extra={<><Button icon={stock.is_watched ? <StarFilled /> : <StarOutlined />} onClick={toggleWatch}>{stock.is_watched ? '取消关注' : '加入关注'}</Button><Button icon={<PlayCircleOutlined />} type="primary" onClick={analyze}>触发分析</Button><Button icon={<ReloadOutlined />} onClick={load}>刷新</Button></>} />
      <Row gutter={[16, 16]}><Col xs={24} lg={16}><Card title="行情概览"><Descriptions column={{ xs: 1, sm: 2, md: 4 }} size="small"><Descriptions.Item label="最新价">{formatNumber(snapshot?.price, 2)}</Descriptions.Item><Descriptions.Item label="涨跌幅"><PriceText value={snapshot?.change_pct} suffix="%" /></Descriptions.Item><Descriptions.Item label="涨跌额"><PriceText value={snapshot?.change_amount} /></Descriptions.Item><Descriptions.Item label="成交量">{formatCompact(snapshot?.volume)}</Descriptions.Item><Descriptions.Item label="今开">{formatNumber(snapshot?.open, 2)}</Descriptions.Item><Descriptions.Item label="最高">{formatNumber(snapshot?.high, 2)}</Descriptions.Item><Descriptions.Item label="最低">{formatNumber(snapshot?.low, 2)}</Descriptions.Item><Descriptions.Item label="更新时间">{formatTime(snapshot?.snapshot_time)}</Descriptions.Item></Descriptions></Card></Col><Col xs={24} lg={8}><Card title="当前策略"><Space direction="vertical" size={10}><Space><SignalTag signal={advice?.signal} /><Typography.Text strong>{formatNumber(advice?.confidence, 0)}%</Typography.Text></Space><Typography.Text>{advice?.reasoning ?? '暂无策略'}</Typography.Text><Typography.Text type="secondary">{advice?.strategy}</Typography.Text></Space></Card></Col></Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}><Col xs={24} xl={15}><Card title="历史日 K 与均线"><ReactECharts option={klineOption} className="chart-panel" /></Card></Col><Col xs={24} xl={9}><Card title="关注股快照走势"><ReactECharts option={snapshotOption} className="chart-panel" /></Card></Col></Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}><Col xs={24} lg={8}><Card title="技术指标"><Descriptions column={1} size="small"><Descriptions.Item label="MA5 / MA20">{formatNumber(indicators.ma5, 2)} / {formatNumber(indicators.ma20, 2)}</Descriptions.Item><Descriptions.Item label="MA60">{formatNumber(indicators.ma60, 2)}</Descriptions.Item><Descriptions.Item label="MACD">{indicators.macd?.cross ?? '-'} · {formatNumber(indicators.macd?.histogram, 4)}</Descriptions.Item><Descriptions.Item label="RSI14">{formatNumber(indicators.rsi14, 2)}</Descriptions.Item><Descriptions.Item label="BOLL">{formatNumber(indicators.boll?.lower, 2)} - {formatNumber(indicators.boll?.upper, 2)}</Descriptions.Item><Descriptions.Item label="KDJ">{formatNumber(indicators.kdj?.k, 2)} / {formatNumber(indicators.kdj?.d, 2)} / {formatNumber(indicators.kdj?.j, 2)}</Descriptions.Item></Descriptions></Card></Col><Col xs={24} lg={8}><Card title="相关新闻"><List className="compact-list" dataSource={news} renderItem={(item: NewsItem) => <List.Item><List.Item.Meta title={<Space><SentimentTag sentiment={item.sentiment} /><Typography.Text>{item.title}</Typography.Text></Space>} description={<Typography.Text type="secondary">{item.source} · {formatTime(item.published_at)}</Typography.Text>} /></List.Item>} /></Card></Col><Col xs={24} lg={8}><Card title="历史建议"><Timeline items={history.map((item) => ({ children: <Space direction="vertical" size={2}><Space><SignalTag signal={item.signal} /><span>{formatNumber(item.confidence, 0)}%</span></Space><Typography.Text type="secondary">{formatTime(item.created_at)}</Typography.Text></Space> }))} /></Card></Col></Row>
      <div style={{ marginTop: 16 }}><RiskNotice /></div>
    </>
  );
}

