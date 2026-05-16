import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const UniversalCRUD = () => {
  const [activeTable, setActiveTable] = useState('products');
  const [dataList, setDataList] = useState([]);
  
  const [addFormData, setAddFormData] = useState({});
  const [editFormData, setEditFormData] = useState({});
  const [targetUpdateId, setTargetUpdateId] = useState('');
  const [targetDeleteId, setTargetDeleteId] = useState('');
  
  // 1. 擴充欄位定義，包含時間戳記
  const tableConfigs = {
    products: ['category_id', 'sku', 'name', 'current_stock', 'updated_at'],
    categories: ['name', 'description'],
    locations: ['zone_name', 'shelf_number'],
    inventory_logs: ['product_id', 'location_id', 'reference_id', 'quantity_change', 'action_type', ,'created_at'],

    // 用於追蹤特定產品在特定儲位的實際數量
    stock_levels: ['product_id', 'location_id', 'quantity', 'last_counted_at', 'updated_at'],

    // --- 新增入庫管理表 ---
    suppliers: ['name', 'contact_person', 'phone', 'address', 'created_at'],
    inbound_orders: ['order_number', 'supplier_id', 'status', 'expected_date', 'created_at', 'updated_at'],
    inbound_items: ['inbound_order_id', 'product_id', 'expected_quantity', 'received_quantity', 'unit_price', 'created_at'],
    
    // --- 新增出庫管理表 ---
    customers: ['name', 'contact_person', 'phone', 'address'],
    outbound_orders: ['order_number', 'customer_id', 'status', 'actual_ship_date', 'created_at', 'updated_at'],
    outbound_items: ['outbound_order_id', 'product_id', 'quantity', 'unit_price']
  };
  
  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE}/${activeTable}`);
      setDataList(response.data);
    } catch (err) {
      console.error("讀取失敗:", err);
    }
  };
  
  useEffect(() => {
    fetchData();
    setAddFormData({});
    setEditFormData({});
    setTargetUpdateId('');
    setTargetDeleteId('');
  }, [activeTable]);
  
  // 格式化時間的輔助函式
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return date.toLocaleString('zh-TW', { 
      year: 'numeric', month: '2-digit', day: '2-digit', 
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false 
    });
  };
  
  const loadItemToEdit = () => {
    const item = dataList.find(d => String(d.id) === String(targetUpdateId));
    if (item) {
      setEditFormData(item);
    } else {
      alert('找不到該 ID 的資料');
    }
  };
  
  const handleCreate = async () => {
    try {
      console.log("準備送出的資料:", addFormData); // <--- 加這行看前端抓到了什麼
      await axios.post(`${API_BASE}/${activeTable}`, addFormData);
      alert('新增成功！');
      setAddFormData({});
      fetchData();
    } catch (err) {
      alert('新增失敗: ' + (err.response?.data?.error || err.message));
    }
  };
  
  const handleUpdate = async () => {
    if (!targetUpdateId) return alert('請輸入要修改的 ID');
    try {
      await axios.put(`${API_BASE}/${activeTable}/${targetUpdateId}`, editFormData);
      alert('更新成功！');
      fetchData();
    } catch (err) {
      alert('更新失敗: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async () => {
    if (!targetDeleteId) return alert('請輸入要刪除的 ID');
    if (!window.confirm(`⚠️ 警告：確定要永久刪除 ID: ${targetDeleteId} 嗎？`)) return;
    try {
      await axios.delete(`${API_BASE}/${activeTable}/${targetDeleteId}`);
      alert('刪除成功！');
      setTargetDeleteId('');
      fetchData();
    } catch (err) {
      alert('刪除失敗: ' + (err.response?.data?.error || err.message));
    }
  };
  
  const cardStyle = { background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' };
  const inputStyle = { display: 'block', margin: '10px 0', padding: '10px', width: '95%', borderRadius: '6px', border: '1px solid #ddd' };
  const btnStyle = (color) => ({ background: color, color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' });
  
  // 1. 定義分類清單

  const baseTables = ['categories', 'locations', 'suppliers', 'customers'];
  const businessTables = ['products', 'inbound_orders', 'inbound_items', 'inventory_logs', 'outbound_orders', 'outbound_items','stock_levels'];
  
  return (
  <div style={{ maxWidth: '1100px', margin: '20px auto', fontFamily: 'system-ui', padding: '20px', backgroundColor: '#f0f2f5' }}>
    <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>📦 WMS 數據管理中心</h1>

    {/* 分群按鈕區域 */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
      
      {/* 基礎資料區 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#f39c12', minWidth: '80px' }}>⚙️ 基礎維護</span>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
          {baseTables.map(table => (
            <button 
              key={table} 
              onClick={() => setActiveTable(table)}
              style={{ 
                ...btnStyle(activeTable === table ? '#007bff' : '#f39c12'), 
                opacity: activeTable === table ? 1 : 0.7,
                fontSize: '13px', padding: '8px 16px'
              }}
            >
              {table.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 業務流程區 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#6c757d', minWidth: '80px' }}>📋 業務管理</span>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
          {businessTables.map(table => (
            <button 
              key={table} 
              onClick={() => setActiveTable(table)}
              style={{ 
                ...btnStyle(activeTable === table ? '#007bff' : '#6c757d'), 
                opacity: activeTable === table ? 1 : 0.7,
                fontSize: '13px', padding: '8px 16px'
              }}
            >
              {table.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

    </div>
      
      {/* --- 區塊 1: 查詢 --- */}
      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>🔍 1. 數據瀏覽 ({activeTable})</h2>
        <div style={{ maxHeight: '350px', overflowY: 'auto', overflowX: 'auto', border: '1px solid #eee' }}>
          <table width="100%" border="0" style={{ borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa' }}>
              <tr align="left">
                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>ID</th>
                {tableConfigs[activeTable].map(col => <th key={col} style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {dataList.map(item => (
                <tr key={item.id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.id}</td>
                  {tableConfigs[activeTable].map(col => (
                    <td key={col} style={{ padding: '12px' }}>
                      {/* 如果欄位名稱包含 _at，則進行時間格式化 */}
                      {col.endsWith('_at') ? formatTime(item[col]) : item[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        
        {/* --- 區塊 2: 新增 --- */}
        <section style={cardStyle}>
          <h2 style={{ color: '#28a745', display: 'flex', alignItems: 'center', gap: '10px' }}><span>➕</span> 2. 新增資料</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {/* 新增時過濾掉時間戳記欄位，因為那是資料庫自動生成的 */}
            {tableConfigs[activeTable].filter(col => !col.endsWith('_at')).map(col => (
              <input 
                key={`add-${col}`}
                placeholder={`輸入 ${col}`} 
                value={addFormData[col] || ''}
                style={{ ...inputStyle, width: 'auto' }}
                onChange={(e) => setAddFormData({...addFormData, [col]: e.target.value})}
              />
            ))}
          </div>
          <button onClick={handleCreate} style={{ ...btnStyle('#28a745'), width: '100%', marginTop: '10px' }}>確認新增</button>
        </section>
        
        {/* --- 區塊 3: 修改 --- */}
        <section style={cardStyle}>
          <h2 style={{ color: '#ffc107', display: 'flex', alignItems: 'center', gap: '10px' }}><span>📝</span> 3. 編輯修改</h2>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
            <input 
              type="number" 
              placeholder="目標 ID" 
              value={targetUpdateId}
              onChange={(e) => setTargetUpdateId(e.target.value)}
              style={{ padding: '10px', width: '100px', borderRadius: '6px', border: '1px solid #ddd' }} 
            />
            <button onClick={loadItemToEdit} style={{ padding: '10px', cursor: 'pointer', background: '#eee', border: '1px solid #ccc', borderRadius: '6px' }}>載入原資料</button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {tableConfigs[activeTable].filter(col => !col.endsWith('_at')).map(col => (
              <div key={`edit-group-${col}`}>
                <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>{col}</label>
                <input 
                  value={editFormData[col] || ''}
                  style={{ ...inputStyle, width: 'auto', margin: 0 }}
                  onChange={(e) => setEditFormData({...editFormData, [col]: e.target.value})}
                />
              </div>
            ))}
          </div>
          <button onClick={handleUpdate} style={{ ...btnStyle('#ffc107'), color: '#000', width: '100%', marginTop: '15px' }}>更新存檔</button>
        </section>
        
        {/* --- 區塊 4: 刪除 --- */}
        <section style={{ ...cardStyle, borderLeft: '10px solid #dc3545' }}>
          <h2 style={{ color: '#dc3545', display: 'flex', alignItems: 'center', gap: '10px' }}><span>🗑</span> 4. 危險操作：刪除</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input 
              type="number" 
              placeholder="輸入要刪除的 ID" 
              value={targetDeleteId}
              onChange={(e) => setTargetDeleteId(e.target.value)}
              style={{ ...inputStyle, width: '200px', border: '1px solid #dc3545' }} 
            />
            <button onClick={handleDelete} style={{ ...btnStyle('#dc3545'), flex: 1 }}>確認刪除資料</button>
          </div>
          <p style={{ color: '#721c24', fontSize: '12px', marginTop: '10px', background: '#fff3f3', padding: '8px', borderRadius: '4px' }}>
            ※ 注意：刪除後無法復原，請務必確認 ID 正確。
          </p>
        </section>

      </div>
    </div>
  );
};

export default UniversalCRUD;