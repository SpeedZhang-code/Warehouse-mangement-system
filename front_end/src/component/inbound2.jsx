import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// ─── 小元件：狀態徽章 ────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    pending:   { label: '待入庫', bg: '#FFF8E1', color: '#B45309', border: '#FCD34D' },
    completed: { label: '已入庫', bg: '#F0FDF4', color: '#166534', border: '#86EFAC' },
  }[status] ?? { label: status, bg: '#F3F4F6', color: '#374151', border: '#D1D5DB' };
  return (
    <span style={{
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 600,
    }}>
      {cfg.label}
    </span>
  );
};

// ─── 上區塊：建立新進貨單 ────────────────────────────────────
const CreateOrderSection = ({ suppliers, products, locations, onCreated }) => {
  const [orderInfo, setOrderInfo] = useState({
    order_number: `IN${Date.now()}`,
    supplier_id: '',
    status: 'pending',
    expected_date: new Date().toISOString().split('T')[0],
  });
  const [items, setItems] = useState([
    { product_id: '', location_id: '', expected_quantity: '', received_quantity: '', unit_price: '' },
  ]);
  const [loading, setLoading] = useState(false);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addItem = () => setItems([
    ...items,
    { product_id: '', location_id: '', expected_quantity: '', received_quantity: '', unit_price: '' },
  ]);

  const removeItem = (index) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isCompleted = orderInfo.status === 'completed';
    const isValid = items.every(i =>
      i.product_id && i.location_id &&
      (!isCompleted || parseInt(i.received_quantity) > 0)
    );
    if (!isValid) {
      return alert(isCompleted
        ? '請確認商品、儲位已選擇，且實收數量大於 0'
        : '請確認商品與儲位已選擇');
    }
    setLoading(true);
    try {
      const payload = {
        ...orderInfo,
        items: items.map(i => ({
          ...i,
          expected_quantity: parseInt(i.expected_quantity) || 0,
          received_quantity: parseInt(i.received_quantity) || 0,
          unit_price: parseFloat(i.unit_price) || 0,
        })),
      };
      await axios.post(`${API_BASE}/inbound/orders`, payload);
      alert(`進貨單建立成功！(${orderInfo.status === 'completed' ? '直接入庫' : '待入庫'})`);
      setOrderInfo({
        order_number: `IN${Date.now()}`,
        supplier_id: '',
        status: 'pending',
        expected_date: new Date().toISOString().split('T')[0],
      });
      setItems([{ product_id: '', location_id: '', expected_quantity: '', received_quantity: '', unit_price: '' }]);
      onCreated();
    } catch (err) {
      alert(err.response?.data?.error || '提交失敗');
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = orderInfo.status === 'completed';
  const accentColor = isCompleted ? '#16A34A' : '#D97706';
  const accentBorder = isCompleted ? '#16A34A' : '#D97706';

  return (
    <section style={{
      background: '#fff', borderRadius: 14, border: `1px solid #E5E7EB`,
      borderTop: `4px solid ${accentBorder}`, padding: '1.5rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: accentColor }}>
          ➕ 建立新進貨單
        </h3>
        <span style={{ fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}>
          {orderInfo.order_number}
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        {/* 表頭 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, paddingBottom: '1rem', borderBottom: '1px solid #F3F4F6', marginBottom: '1rem' }}>
          <div>
            <label style={labelStyle}>供應商</label>
            <select
              style={selectStyle}
              value={orderInfo.supplier_id}
              onChange={e => setOrderInfo({ ...orderInfo, supplier_id: e.target.value })}
              required
            >
              <option value="">請選擇供應商</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>單據狀態</label>
            <select
              style={{ ...selectStyle, fontWeight: 600, color: isCompleted ? '#16A34A' : '#D97706' }}
              value={orderInfo.status}
              onChange={e => setOrderInfo({ ...orderInfo, status: e.target.value })}
            >
              <option value="pending">📋 待入庫 (Pending)</option>
              <option value="completed">✅ 直接入庫 (Completed)</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>{isCompleted ? '入庫日期' : '預計到貨日'}</label>
            <input
              type="date"
              style={inputStyle}
              value={orderInfo.expected_date}
              onChange={e => setOrderInfo({ ...orderInfo, expected_date: e.target.value })}
            />
          </div>
        </div>

        {/* 明細表格 */}
        <div style={{ overflowX: 'auto', border: '1px solid #E5E7EB', borderRadius: 8, marginBottom: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['商品名稱', '存放儲位', '預計數量', '實收數量', '進貨單價', ''].map((h, i) => (
                  <th key={i} style={{ padding: '10px 12px', textAlign: i >= 2 ? 'center' : 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '8px 12px', width: '28%' }}>
                    <select
                      style={selectStyle}
                      value={item.product_id}
                      onChange={e => handleItemChange(index, 'product_id', e.target.value)}
                      required
                    >
                      <option value="">請選擇商品</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '8px 12px', width: '22%' }}>
                    <select
                      style={selectStyle}
                      value={item.location_id}
                      onChange={e => handleItemChange(index, 'location_id', e.target.value)}
                      required
                    >
                      <option value="">選擇儲位</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.zone_name} - {l.shelf_number}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '8px 6px', width: '12%' }}>
                    <input
                      type="number" style={{ ...inputStyle, textAlign: 'center' }} placeholder="0"
                      value={item.expected_quantity}
                      onChange={e => handleItemChange(index, 'expected_quantity', e.target.value)}
                    />
                  </td>
                  <td style={{ padding: '8px 6px', width: '12%' }}>
                    <input
                      type="number"
                      style={{
                        ...inputStyle, textAlign: 'center', fontWeight: 600,
                        color: isCompleted ? '#16A34A' : '#374151',
                        background: isCompleted ? '#F0FDF4' : '#fff',
                        borderColor: isCompleted ? '#86EFAC' : '#D1D5DB',
                      }}
                      placeholder="0"
                      value={item.received_quantity}
                      onChange={e => handleItemChange(index, 'received_quantity', e.target.value)}
                      required={isCompleted}
                    />
                  </td>
                  <td style={{ padding: '8px 12px', width: '14%' }}>
                    <input
                      type="number" step="0.01" style={{ ...inputStyle, textAlign: 'right' }} placeholder="0.00"
                      value={item.unit_price}
                      onChange={e => handleItemChange(index, 'unit_price', e.target.value)}
                    />
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', width: '10%' }}>
                    <button
                      type="button" onClick={() => removeItem(index)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
                    >
                      移除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" onClick={addItem} style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            + 新增一列商品
          </button>
          <button
            type="submit" disabled={loading}
            style={{
              background: isCompleted ? '#16A34A' : '#D97706',
              color: '#fff', border: 'none', borderRadius: 999,
              padding: '10px 32px', fontWeight: 700, fontSize: 14,
              cursor: 'pointer', opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '提交中…' : isCompleted ? '確認入庫並提交' : '建立待入庫單'}
          </button>
        </div>
      </form>
    </section>
  );
};

// ─── 下區塊：訂單列表 & 更改訂單狀態 ────────────────────────────
const OrderListSection = ({ suppliers, products, locations, refreshKey }) => {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 儲存所有進貨單單號的清單
  const [allOrderNumbers, setAllOrderNumbers] = useState([]);
  const [statusChangingId, setStatusChangingId] = useState(null); // 用於阻擋重複點擊或顯示載入中

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/inbound/orders`, {
        params: { page, limit: 10, search, status: filterStatus },
      });
      setOrders(res.data.orders);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, refreshKey]);

  const fetchAllOrderNumbers = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/inbound/orders`, {
        params: { page: 1, limit: 1000 } 
      });
      if (res.data?.orders) {
        const numbers = res.data.orders.map(o => o.order_number);
        setAllOrderNumbers(numbers);
      }
    } catch (err) {
      console.error("無法獲取單號清單", err);
    }
  }, [refreshKey]);

  useEffect(() => { 
    fetchOrders(); 
  }, [fetchOrders]);

  useEffect(() => {
    fetchAllOrderNumbers();
  }, [fetchAllOrderNumbers, refreshKey, total]);

  // 🛠️ 核心修改：處理變更訂單狀態的函式
  const handleStatusChange = async (order, nextStatus) => {
    if (order.status === nextStatus) return;
    
    // 如果是要入庫，跳出確認視窗提示使用者
    if (nextStatus === 'completed') {
      if (!window.confirm(`確認要將單號 [${order.order_number}] 轉為已入庫並更新庫存嗎？`)) return;
    }

    setStatusChangingId(order.id);
    try {
      // 呼叫新重構的後端通用狀態 API
      await axios.patch(`${API_BASE}/inbound/orders/${order.id}/status`, { status: nextStatus });
      alert(`✅ 進貨單狀態已成功更新為：${nextStatus === 'completed' ? '已入庫' : '待入庫'}`);
      fetchOrders(); // 重新載入列表
    } catch (err) {
      alert(err.response?.data?.error || '狀態變更失敗');
    } finally {
      setStatusChangingId(null);
    }
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <section style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', borderTop: '4px solid #6366F1', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#4F46E5' }}>
          📋 進貨單管理
        </h3>
        <span style={{ fontSize: 12, color: '#6B7280' }}>共 {total} 筆</span>
      </div>

      {/* 篩選列 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: '1rem' }}>
        <select
          style={{ ...selectStyle, width: 220, fontFamily: 'monospace' }}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        >
          <option value="">🔍 全部單號 (不限)</option>
          {allOrderNumbers.map((num) => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>

        <select
          style={{ ...selectStyle, width: 160 }}
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
        >
          <option value="">全部狀態</option>
          <option value="pending">待入庫</option>
          <option value="completed">已入庫</option>
        </select>
        <button
          onClick={() => { fetchOrders(); fetchAllOrderNumbers(); }}
          style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}
        >
          🔄 重新整理
        </button>
      </div>

      {/* 列表內容 */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem 0' }}>載入中…</p>
      ) : orders.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem 0' }}>目前沒有符合條件的單據</p>
      ) : (
        <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['單號', '供應商', '目前狀態', '預計日期', '建立時間', '快速變更狀態'].map((h, i) => (
                  <th key={i} style={{ padding: '10px 14px', textAlign: i === 2 ? 'center' : 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, fontWeight: 600 }}>{order.order_number}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13 }}>{order.supplier_name}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <StatusBadge status={order.status} />
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#6B7280' }}>
                    {order.expected_date ? new Date(order.expected_date).toLocaleDateString('zh-TW') : '—'}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#9CA3AF' }}>
                    {new Date(order.created_at).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  
                  {/* 🛠️ 修改此處的操作欄位：直接選取下拉式選單來更改狀態 */}
                  <td style={{ padding: '10px 14px' }}>
                    <select
                      style={{ 
                        ...selectStyle, 
                        width: 140, 
                        padding: '4px 8px',
                        borderColor: order.status === 'completed' ? '#86EFAC' : '#FCD34D',
                        background: order.status === 'completed' ? '#F0FDF4' : '#FFF8E1',
                        color: order.status === 'completed' ? '#166534' : '#B45309',
                        fontWeight: 600
                      }}
                      value={order.status}
                      disabled={statusChangingId === order.id}
                      onChange={e => handleStatusChange(order, e.target.value)}
                    >
                      <option value="pending">📋 待入庫</option>
                      <option value="completed">✅ 已入庫</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 分頁 */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: '1rem' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pageBtn}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{ ...pageBtn, background: p === page ? '#6366F1' : 'transparent', color: p === page ? '#fff' : 'inherit' }}>
              {p}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={pageBtn}>›</button>
        </div>
      )}
    </section>
  );
};

// ─── 主元件 ──────────────────────────────────────────────────
const InboundManager2 = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [s, p, l] = await Promise.all([
          axios.get(`${API_BASE}/suppliers`),
          axios.get(`${API_BASE}/products`),
          axios.get(`${API_BASE}/locations`),
        ]);
        setSuppliers(s.data);
        setProducts(p.data);
        setLocations(l.data);
      } catch (err) {
        console.error('基礎資料讀取失敗', err);
      }
    };
    loadOptions();
  }, []);

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 上區塊 */}
      <CreateOrderSection
        suppliers={suppliers}
        products={products}
        locations={locations}
        onCreated={() => setRefreshKey(k => k + 1)}
      />
      {/* 下區塊 */}
      <OrderListSection
        suppliers={suppliers}
        products={products}
        locations={locations}
        refreshKey={refreshKey}
      />
    </div>
  );
};

// ─── 共用樣式 ─────────────────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '7px 10px', border: '1px solid #D1D5DB',
  borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box',
};
const selectStyle = {
  width: '100%', padding: '7px 10px', border: '1px solid #D1D5DB',
  borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff',
};
const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6,
};
const pageBtn = {
  minWidth: 32, height: 32, border: '1px solid #E5E7EB', borderRadius: 6,
  background: 'transparent', cursor: 'pointer', fontSize: 13,
};

export default InboundManager2;
