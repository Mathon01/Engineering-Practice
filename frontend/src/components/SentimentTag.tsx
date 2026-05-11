import { Tag } from 'antd';

export default function SentimentTag({ sentiment }: { sentiment?: string }) {
  if (sentiment === 'positive') return <Tag color="red">积极</Tag>;
  if (sentiment === 'negative') return <Tag color="green">负面</Tag>;
  return <Tag>中性</Tag>;
}

