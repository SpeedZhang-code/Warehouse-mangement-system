import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Segmented, Skeleton, Typography } from 'antd';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const { Text } = Typography;

// ─── API ────────────────────────────────────────────────────────────────────────
const API = '/api/analyze';
const fetchJson = async (path) => {
  const r = await fetch(`${API}${path}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};

// ─── Constants ──────────────────────────────────────────────────────────────────
const PIE_COLORS = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#06b6d4'];

// ─── Custom Recharts Tooltip ────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1f2937', border: '1px solid #374151',
      borderRadius: 8, padding: '8px 14px', fontSize: 12,
    }}>
      <div style={{ color: '#9ca3af', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, lineHeight: '22px' }}>
          {p.name}　{Number(p.value).toLocaleString()}
        </div>
      ))}
    </div>
  );
};

// ─── Custom Pie Tooltip ─────────────────────────────────────────────────────────
const PieTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div style={{
      background: '#1f2937', border: '1px solid #374151',
      borderRadius: 8, padding: '8px 14px', fontSize: 12, color: '#f9fafb',
    }}>
      <div style={{ color: '#9ca3af', marginBottom: 2 }}>{name}</div>
      <div style={{ fontWeight: 600 }}>{Number(value).toLocaleString()} 件</div>
    </div>
  );
};

// ─── ChartWrapper：解決 antd Col 初始寬度 0 導致 recharts 警告 ──────────────────
const ChartWrapper = ({ height = 240, children }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div style={{ height }} />;
  return <div style={{ height, minWidth: 0 }}>{children}</div>;
};

// ─── Custom Legend ──────────────────────────────────────────────────────────────
const PieLegend = ({ data }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
    {data.map((d, i) => {
      const total = data.reduce((s, x) => s + x.value, 0);
      const pct   = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0.0';
      return (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 10, height: 10, borderRadius: 2, flexShrink: 0,
              background: PIE_COLORS[i % PIE_COLORS.length],
            }} />
            <Text style={{ fontSize: 13 }}>{d.name}</Text>
          </span>
          <span style={{ display: 'flex', gap: 12 }}>
            <Text type="secondary" style={{ fontSize: 12, minWidth: 36, textAlign: 'right' }}>{pct}%</Text>
            <Text strong style={{ fontSize: 12, minWidth: 52, textAlign: 'right' }}>{d.value.toLocaleString()}</Text>
          </span>
        </div>
      );
    })}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// AnalyzePage
// ═══════════════════════════════════════════════════════════════════════════════
export default function AnalyzePage() {
  const [trendDays, setTrendDays] = useState(7);
  const [trend,     setTrend]     = useState([]);
  const [catDist,   setCatDist]   = useState([]);
  const [loading,   setLoading]   = useState({ trend: false, catDist: false });

  const load = useCallback((key, path, setter) => {
    setLoading(l => ({ ...l, [key]: true }));
    fetchJson(path)
      .then(setter)
      .catch(console.error)
      .finally(() => setLoading(l => ({ ...l, [key]: false })));
  }, []);

  useEffect(() => {
    load('catDist', '/category-distribution', setCatDist);
  }, [load]);

  useEffect(() => {
    load('trend', `/trend?days=${trendDays}`, setTrend);
  }, [trendDays, load]);

  // 計算趨勢摘要（入庫總量、出庫總量）
  const trendSummary = {
    inbound:  trend.reduce((s, r) => s + (r.inbound  ?? 0), 0),
    outbound: trend.reduce((s, r) => s + (r.outbound ?? 0), 0),
  };

  return (
    <div style={{ padding: '24px', background: '#f5f5f4', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
          Warehouse Intelligence
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>倉儲數據分析</div>
      </div>

      <Row gutter={[20, 20]}>

        {/* ── 出入庫時間軸趨勢 ── */}
        <Col xs={24} lg={15}>
          <Card
            variant="outlined"
            style={{ borderRadius: 14 }}
            title="出入庫趨勢"
            extra={
              <Segmented
                size="small"
                options={[
                  { label: '7 日',  value: 7  },
                  { label: '14 日', value: 14 },
                  { label: '30 日', value: 30 },
                ]}
                value={trendDays}
                onChange={setTrendDays}
              />
            }
          >
            {/* 摘要小計 */}
            <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
              {[
                { label: `${trendDays} 日入庫`, value: trendSummary.inbound,  color: '#10b981' },
                { label: `${trendDays} 日出庫`, value: trendSummary.outbound, color: '#f97316' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color }}>{value.toLocaleString()}</div>
                </div>
              ))}
            </div>
            
            {/* 圖例 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
              {[['入庫', '#10b981'], ['出庫', '#f97316']].map(([n, c]) => (
                <span key={n} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}>
                  <span style={{ width: 20, height: 3, background: c, borderRadius: 2, display: 'inline-block' }} />
                  {n}
                </span>
              ))}
            </div>

            {loading.trend
              ? <Skeleton active paragraph={{ rows: 6 }} />
              : <ChartWrapper height={260}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0ef" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<ChartTip />} />
                      <Line
                        type="monotone"
                        dataKey="inbound"
                        name="入庫"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="outbound"
                        name="出庫"
                        stroke="#f97316"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartWrapper>
            }
          </Card>
        </Col>

        {/* ── 商品類別庫存佔比 ── */}
        <Col xs={24} lg={9}>
          <Card
            variant="outlined"
            style={{ borderRadius: 14, height: '100%' }}
            title="商品類別庫存佔比"
          >
            {loading.catDist
              ? <Skeleton active paragraph={{ rows: 8 }} />
              : <>
                  <ChartWrapper height={220}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={catDist}
                          cx="50%" cy="50%"
                          innerRadius={58}
                          outerRadius={92}
                          paddingAngle={3}
                          dataKey="value"
                          startAngle={90}
                          endAngle={-270}
                        >
                          {catDist.map((_, i) => (
                            <Cell
                              key={i}
                              fill={PIE_COLORS[i % PIE_COLORS.length]}
                              stroke="transparent"
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartWrapper>

                  {/* 自訂圖例 + 數值 */}
                  <PieLegend data={catDist} />
                </>
            }
          </Card>
        </Col>
            
      </Row>
    </div>
  );
}