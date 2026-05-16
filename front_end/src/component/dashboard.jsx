import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Statistic, Table, Tag, Progress, 
  Spin, Typography, Badge, Space, Tooltip 
} from 'antd';
import ReactECharts from 'echarts-for-react';
import { 
  BoxPlotOutlined, 
  HistoryOutlined, 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  InfoCircleOutlined,
  EnvironmentOutlined,
  ContainerOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Text, Title } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
        stats: {
        total_inventory_value: 0,
        turnover_rate: '0x',
        pending_inbound_orders: 0,      // 對應 pending_orders
        overdue_inbound_count: 0,      // 對應 overdue_inbound_count (逾期)
        today_expected_qty: 0,         // 對應 today_expected_qty (今日預計)
        remaining_inbound_qty: 0,      // 對應 remaining_qty (總殘餘)
        inbound_completion_rate: 0,    // 對應 completion_rate
        // -----------------
        pending_outbound_count: 0,
        urgent_outbound_count: 0,
        today_shipment: 0,
        storage_utilization: 0
    },
    trends: [],
    distribution: [],
    logs: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resStats, resTrends, resDist, resLogs] = await Promise.all([
          axios.get('/api/dashboard/stats'),
          axios.get('/api/dashboard/trends'),
          axios.get('/api/dashboard/location-distribution'),
          axios.get('/api/dashboard/recent-logs')
        ]);

        setData({
          stats: resStats.data,
          trends: resTrends.data,
          distribution: resDist.data,
          logs: resLogs.data
        });
      } catch (error) {
        console.error("Dashboard data fetch failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- 統一卡片樣式 ---
  const cardStyle = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '8px'
  };

  const trendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['入庫金額', '出庫金額'], bottom: 0 },
    grid: { left: '3%', right: '4%', top: '10%', bottom: '15%', containLabel: true },
    xAxis: { type: 'category', data: data.trends.map(item => item.date) },
    yAxis: { type: 'value' },
    series: [
      { name: '入庫金額', type: 'bar', data: data.trends.map(item => item.inbound_total), itemStyle: { color: '#52c41a' } },
      { name: '出庫金額', type: 'line', smooth: true, data: data.trends.map(item => item.outbound_total), itemStyle: { color: '#1890ff' } }
    ]
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>;

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Title level={3} style={{ marginBottom: '24px' }}>
        <BoxPlotOutlined /> 智能倉儲管理系統 (WMS Dashboard)
      </Title>

      {/* 第一層：統計卡片 (使用 gutter 確保間距，並在 Col 開啟高度 100%) */}
      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable style={cardStyle} bodyStyle={{ flex: 1 }}>
            <Statistic 
              title="總庫存資產價值"
              value={data.stats.total_inventory_value} 
              precision={2}
              prefix="$" 
              valueStyle={{ color: '#1a337e', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: 20 }}>
              <Tag color="blue">存貨週轉率: {data.stats.turnover_rate}</Tag>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} hoverable style={cardStyle} bodyStyle={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Statistic 
                title={
                <Space>
                    <ArrowDownOutlined style={{ color: '#52c41a' }} />
                    <span>待收貨餘量</span>
                    <Tooltip title="所有未完成單據的剩餘件數總計">
                    <InfoCircleOutlined style={{ fontSize: '12px' }} />
                    </Tooltip>
                </Space>
                }
                value={data.stats.remaining_inbound_qty} 
                valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                suffix={<span style={{ fontSize: '14px', color: '#8c8c8c' }}>件</span>}
            />
            <Space direction="vertical" align="end" size={0}>
                <Badge 
                count={`${data.stats.pending_inbound_orders} 單`} 
                style={{ backgroundColor: '#52c41a' }} 
                />
                {/* 如果有逾期單，顯示紅色的 Tag */}
                {data.stats.overdue_inbound_count > 0 && (
                <Tag color="error" style={{ margin: '4px 0 0 0' }}>
                    逾期 {data.stats.overdue_inbound_count}
                </Tag>
                )}
            </Space>
            </div>

            <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                今日預計: <b>{data.stats.today_expected_qty}</b>
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                達成率 {data.stats.inbound_completion_rate}%
                </Text>
            </div>
            <Progress 
                percent={data.stats.inbound_completion_rate} 
                strokeColor={data.stats.inbound_completion_rate < 100 ? "#52c41a" : "#1890ff"} 
                size="small" 
                status={data.stats.inbound_completion_rate >= 100 ? "success" : "active"}
            />
            </div>
        </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable style={cardStyle} bodyStyle={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Statistic 
                title={<span><ArrowUpOutlined style={{ color: '#ff4d4f' }} /> 待處理出庫</span>}
                value={data.stats.pending_outbound_count} 
                valueStyle={{ color: '#cf1322', fontWeight: 'bold' }}
              />
              <Tooltip title="包含逾期訂單"><InfoCircleOutlined style={{ color: '#bfbfbf' }} /></Tooltip>
            </div>
            <Row gutter={8} style={{ marginTop: 12 }}>
              <Col span={12}>
                <div style={{ background: '#fff1f0', padding: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid #ffccc7' }}>
                  <Text type="danger" strong>{data.stats.urgent_outbound_count}</Text>
                  <div style={{ fontSize: '10px' }}>緊急單</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ background: '#e6f7ff', padding: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid #91d5ff' }}>
                  <Text type="primary" strong>{data.stats.today_shipment}</Text>
                  <div style={{ fontSize: '10px' }}>今日預計</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable style={cardStyle} bodyStyle={{ flex: 1 }}>
            <Statistic 
              title="空間利用率"
              value={data.stats.storage_utilization} 
              suffix="%" 
            />
            <div style={{ marginTop: 20 }}>
              <Progress percent={data.stats.storage_utilization} steps={8} strokeColor="#1890ff" size="small" />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 第二層：分析圖表 */}
      <Row gutter={[16, 16]} style={{ marginTop: '16px' }} align="stretch">
        <Col xs={24} lg={16}>
          <Card title="進出庫金額流向趨勢" bordered={false} style={cardStyle}>
            <ReactECharts option={trendOption} style={{ height: '350px' }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="儲位分佈狀態" bordered={false} style={cardStyle}>
             <ReactECharts 
               option={{
                 tooltip: { trigger: 'item' },
                 series: [{
                   type: 'pie',
                   radius: ['40%', '70%'],
                   data: data.distribution,
                   itemStyle: { borderRadius: 5 }
                 }]
               }} 
               style={{ height: '350px' }} 
             />
          </Card>
        </Col>
      </Row>

      {/* 第三層：最近異動紀錄 */}
      <Row style={{ marginTop: '16px' }}>
        <Col span={24}>
          <Card title={<span><HistoryOutlined /> 最近異動紀錄</span>} bordered={false}>
            <Table 
              pagination={{ pageSize: 6 }}
              dataSource={data.logs} 
              rowKey="id"
              columns={[
                { title: '時間', key: 'time', render: (_, r) => new Date(r.created_at).toLocaleString() },
                { title: '產品', dataIndex: 'product_name', key: 'product' },
                { title: '位置', key: 'loc', render: (_, r) => `${r.zone_name} / ${r.shelf_number}` },
                { 
                  title: '類型', 
                  dataIndex: 'action_type', 
                  render: (t) => <Tag color={t === 'INBOUND' ? 'green' : 'blue'}>{t}</Tag> 
                },
                { 
                  title: '數量', 
                  dataIndex: 'quantity_change', 
                  align: 'right',
                  render: (q) => <Text strong style={{ color: q > 0 ? '#52c41a' : '#ff4d4f' }}>{q > 0 ? `+${q}` : q}</Text>
                }
              ]} 
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;