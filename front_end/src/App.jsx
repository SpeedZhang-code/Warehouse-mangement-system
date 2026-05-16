import React, { useState } from 'react';
import { Layout, Menu, Tabs, Card, Row, Col, Statistic, ConfigProvider } from 'antd';
import {
  DashboardOutlined,
  ImportOutlined,
  DatabaseOutlined,
  ExportOutlined,
  SettingOutlined,
  BarChartOutlined,
  FormOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import zhTW from 'antd/locale/zh_TW';
import './App.css';

import Dashboard from './component/dashboard.jsx';
import UniversalCRUD from './component/crud.jsx';
import InboundManager from './component/inbound.jsx';
import InboundManager2 from './component/inbound2.jsx';
import Manager from './component/Manager.jsx';
import OutboundManager from './component/outbound.jsx';
import AnalyzePage from './component/analyze.jsx';

const { Header, Sider, Content } = Layout;



// --- 主佈局組件 ---
const App = () => {
  const [activeKey, setActiveKey] = useState('1');
  const [items, setItems] = useState([
    { label: '視覺化儀表板', children: <Dashboard />, key: '1', closable: false },
  ]);
  
  const menuItems = [
    { key: '1', icon: <DashboardOutlined />, label: '視覺化儀表板' },
    { key: '2', icon: <FormOutlined />, label: '資料增刪管理' }, // 新增的 CRUD 頁面
    { key: '3', icon: <ImportOutlined />, label: '入庫管理' },
    { key: '4', icon: <DatabaseOutlined />, label: '庫存管理' },
    { key: '5', icon: <ExportOutlined />, label: '出貨管理' },
    { key: '6', icon: <SettingOutlined />, label: '基礎資料維護' },
    { key: '7', icon: <BarChartOutlined />, label: '報表分析' },
  ];
  
  const onMenuClick = (e) => {
    const clickedItem = menuItems.find(item => item.key === e.key);
    if (!items.find(item => item.key === e.key)) {
      let component = <div className="page-placeholder">「{clickedItem.label}」模組開發中...</div>;
      
      switch(e.key) {
        case '1': component = <Dashboard />; break;
        case '2': component = <UniversalCRUD />; break;
        case '3': component = <InboundManager2 />; break;
        case '4': component = <Manager />; break;
        case '5': component = <OutboundManager />; break;
        case '7': component = <AnalyzePage />; break;
      }
      
      setItems([...items, { 
        label: clickedItem.label, 
        children: component, 
        key: clickedItem.key 
      }]);
    }
    setActiveKey(e.key);
  };
  
  const onEdit = (targetKey, action) => {
    if (action === 'remove') {
      const newItems = items.filter(item => item.key !== targetKey);
      setItems(newItems);
      if (activeKey === targetKey) setActiveKey(newItems[newItems.length - 1].key);
    }
  };

  return (
    <ConfigProvider locale={zhTW}>
      <Layout className="main-layout">
        <Sider breakpoint="lg" collapsedWidth="0" theme="dark">
          <div className="logo">WMS PRO</div>
          <Menu theme="dark" mode="inline" selectedKeys={[activeKey]} onClick={onMenuClick} items={menuItems} />
        </Sider>
        <Layout>
          <Header className="site-header">倉儲管理系統 v1.0</Header>
          <Content className="site-content">
            <Tabs
              type="editable-card"
              hideAdd
              activeKey={activeKey}
              onChange={setActiveKey}
              onEdit={onEdit}
              items={items}
            />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
