import { PlusOutlined, ReloadOutlined, StarOutlined } from '@ant-design/icons';
import { Button, Card, Input, Select, Space, Table, Tag, message } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { api, formatCompact, formatNumber } from '../api/client';
import PageHeader from '../components/PageHeader';
import PriceText from '../components/PriceText';
import StockLink from '../components/StockLink';
import type { Snapshot } from '../types';

export default function Market() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Snapshot[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [market, setMarket] = useState<string | undefined>();
  const [watchCodes, setWatchCodes] = useState<Set<string>>(new Set());

  const load = async (nextPage = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(nextPage), page_size: '20', sort_by: 'change_pct', sort_order: 'desc' });
      if (q.trim()) params.set('q', q.trim());
      if (market) params.set('market', market);
      const [marketRes, watchRes] = await Promise.all([api.market(params), api.watchlist()]);
      setItems(marketRes.items); setTotal(marketRes.total); setPage(nextPage); setWatchCodes(new Set(watchRes.items.map((item) => item.stock.code)));
    } catch (error) { message.error(error instanceof Error ? error.message : '加载失败'); } finally { setLoading(false); }
  };
  useEffect(() => { void load(1); }, []);

  const addWatch = async (code: string) => {
    try { await api.addWatch(code); message.success('已加入自选股'); await load(page); } catch (error) { message.error(error instanceof Error ? error.message : '操作失败'); }
  };

  const columns: ColumnsType<Snapshot> = useMemo(() => [
    { title: '股票', fixed: 'left', render: (_: unknown, row: Snapshot) => <StockLink code={row.code} name={row.name} /> },
    { title: '市场', dataIndex: 'market', width: 80, render: (value: string) => <Tag>{value}</Tag> },
    { title: '行业', dataIndex: 'industry', width: 110, ellipsis: true },
    { title: '最新价', align: 'right', render: (_: unknown, row: Snapshot) => formatNumber(row.price, 2) },
    { title: '涨跌幅', align: 'right', render: (_: unknown, row: Snapshot) => <PriceText value={row.change_pct} suffix="%" /> },
    { title: '成交量', align: 'right', render: (_: unknown, row: Snapshot) => formatCompact(row.volume) },
    { title: '成交额', align: 'right', render: (_: unknown, row: Snapshot) => formatCompact(row.amount) },
    { title: '换手率', align: 'right', render: (_: unknown, row: Snapshot) => `${formatNumber(row.turnover_rate, 2)}%` },
    { title: '量比', align: 'right', render: (_: unknown, row: Snapshot) => formatNumber(row.volume_ratio, 2) },
    { title: 'PE', align: 'right', render: (_: unknown, row: Snapshot) => formatNumber(row.pe, 2) },
    { title: 'PB', align: 'right', render: (_: unknown, row: Snapshot) => formatNumber(row.pb, 2) },
    { title: '关注', width: 92, render: (_: unknown, row: Snapshot) => <Button size="small" icon={watchCodes.has(row.code) ? <StarOutlined /> : <PlusOutlined />} disabled={watchCodes.has(row.code)} onClick={() => addWatch(row.code)} /> },
  ], [watchCodes]);

  const pagination: TablePaginationConfig = { current: page, pageSize: 20, total, showSizeChanger: false, onChange: (next) => load(next) };

  return (
    <>
      <PageHeader title="Market" description="全市场行情快照、筛选和自选股管理" extra={<Button icon={<ReloadOutlined />} onClick={() => load(page)}>刷新</Button>} />
      <Card>
        <div className="toolbar"><Space wrap><Input.Search allowClear placeholder="代码、名称、行业" value={q} onChange={(event) => setQ(event.target.value)} onSearch={() => load(1)} style={{ width: 260 }} /><Select allowClear placeholder="市场" value={market} onChange={setMarket} style={{ width: 140 }} options={[{ label: '沪市', value: 'SH' }, { label: '深市', value: 'SZ' }, { label: '指数', value: 'INDEX' }]} /><Button onClick={() => load(1)}>应用筛选</Button></Space></div>
        <Table<Snapshot> rowKey="code" loading={loading} dataSource={items} columns={columns} pagination={pagination} scroll={{ x: 1180 }} size="middle" />
      </Card>
    </>
  );
}

