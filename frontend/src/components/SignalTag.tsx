import { Tag } from 'antd';
import type { Signal } from '../types';

const signalColor: Record<Signal, string> = { 重点关注: 'blue', 谨慎买入: 'red', 持有: 'default', 减仓: 'orange', 回避: 'purple' };
export default function SignalTag({ signal }: { signal?: string }) {
  if (!signal) return <Tag>-</Tag>;
  return <Tag color={signalColor[signal as Signal] ?? 'default'}>{signal}</Tag>;
}

