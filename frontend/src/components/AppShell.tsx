import { AlertOutlined, BarChartOutlined, BellOutlined, DashboardOutlined, FileTextOutlined, LineChartOutlined, SettingOutlined } from '@ant-design/icons';
import { Layout, Menu, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { Link, Outlet, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const menuItems: MenuProps['items'] = [
  { key: '/', icon: <DashboardOutlined />, label: <Link to="/">Dashboard</Link> },
  { key: '/market', icon: <BarChartOutlined />, label: <Link to="/market">Market</Link> },
  { key: '/news', icon: <FileTextOutlined />, label: <Link to="/news">News</Link> },
  { key: '/advice', icon: <AlertOutlined />, label: <Link to="/advice">Advice</Link> },
  { key: '/notifications', icon: <BellOutlined />, label: <Link to="/notifications">Notifications</Link> },
  { key: '/settings', icon: <SettingOutlined />, label: <Link to="/settings">Settings</Link> },
];

export default function AppShell() {
  const location = useLocation();
  const selected = menuItems?.some((item) => item?.key === location.pathname) ? location.pathname : location.pathname.startsWith('/stock') ? '/market' : '/';
  return (
    <Layout className="app-shell">
      <Sider width={224} className="app-sider">
        <div className="brand">
          <LineChartOutlined />
          <div><Typography.Text strong>Market Agent</Typography.Text><span>本地证券监控</span></div>
        </div>
        <Menu mode="inline" selectedKeys={[selected]} items={menuItems} />
      </Sider>
      <Layout>
        <Header className="app-header">
          <Typography.Text strong>智能证券市场监视、提醒与策略建议系统</Typography.Text>
          <Typography.Text type="secondary">HTTP 轮询 · 本地规则引擎 · OpenClaw 编排</Typography.Text>
        </Header>
        <Content className="app-content"><Outlet /></Content>
      </Layout>
    </Layout>
  );
}

