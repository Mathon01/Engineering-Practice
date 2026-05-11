import { Alert } from 'antd';

export default function RiskNotice() {
  return <Alert showIcon type="warning" message="本系统生成的交易建议仅用于课程项目、学习研究和辅助分析，不构成任何投资建议，不承诺收益，也不替代用户独立判断。" />;
}

