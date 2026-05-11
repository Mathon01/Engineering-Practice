import { Link } from 'react-router-dom';

export default function StockLink({ code, name }: { code: string; name?: string }) {
  return <Link to={`/stock/${code}`} className="stock-link"><strong>{code}</strong>{name ? <span>{name}</span> : null}</Link>;
}

