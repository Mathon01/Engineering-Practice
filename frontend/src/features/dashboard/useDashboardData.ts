import { useEffect, useState } from 'react';
import { message } from 'antd';
import { api } from '../../api/client';
import type { Advice, CollectionJob, NewsItem, Snapshot, WatchItem } from '../../types';

type DashboardCache = {
  market: Snapshot[];
  watchlist: WatchItem[];
  news: NewsItem[];
  advice: Advice[];
  jobs: CollectionJob[];
};

let dashboardCache: DashboardCache | null = null;

export function useDashboardData() {
  const [loading, setLoading] = useState(!dashboardCache);
  const [market, setMarket] = useState<Snapshot[]>(dashboardCache?.market ?? []);
  const [watchlist, setWatchlist] = useState<WatchItem[]>(dashboardCache?.watchlist ?? []);
  const [news, setNews] = useState<NewsItem[]>(dashboardCache?.news ?? []);
  const [advice, setAdvice] = useState<Advice[]>(dashboardCache?.advice ?? []);
  const [jobs, setJobs] = useState<CollectionJob[]>(dashboardCache?.jobs ?? []);

  const load = async (showSpinner = !dashboardCache) => {
    setLoading(showSpinner);
    try {
      const [marketRes, watchRes, newsRes, adviceRes, jobsRes] = await Promise.all([
        api.market(new URLSearchParams({ page_size: '200', sort_by: 'change_pct', sort_order: 'desc' })),
        api.watchlist(),
        api.news(new URLSearchParams({ limit: '6' })),
        api.advice(),
        api.jobs(5),
      ]);
      const next = {
        market: marketRes.items,
        watchlist: watchRes.items,
        news: newsRes.items,
        advice: adviceRes.items.slice(0, 6),
        jobs: jobsRes.items,
      };
      dashboardCache = next;
      setMarket(next.market);
      setWatchlist(next.watchlist);
      setNews(next.news);
      setAdvice(next.advice);
      setJobs(next.jobs);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(!dashboardCache); }, []);

  return { loading, market, watchlist, news, advice, jobs, load };
}
