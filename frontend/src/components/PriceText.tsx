import { changeColor, formatNumber } from '../api/client';

export default function PriceText({ value, suffix = '' }: { value?: number | null; suffix?: string }) {
  return <span style={{ color: changeColor(value), fontVariantNumeric: 'tabular-nums' }}>{formatNumber(value, 2)}{suffix}</span>;
}

