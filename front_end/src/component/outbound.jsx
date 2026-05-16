import React, { useState, useEffect } from 'react';

export default function OutboundManagement() {
  // --- 資料狀態 ---
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [outboundOrders, setOutboundOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- 表單狀態（對齊 ERD 欄位） ---
  const [newOrder, setNewOrder] = useState({
    order_number: '', // 可以手動輸入或由前端/後端生成
    customer_id: '',
    status: 'pending',
    actual_ship_date: '',
  });

  const [newItems, setNewItems] = useState([
    { product_id: '', quantity: 1, unit_price: 0 }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  // --- 初始化抓取資料 (使用通用 API 路徑) ---
  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      fetch('http://localhost:5000/api/customers').then(res => res.json()),
      fetch('http://localhost:5000/api/products').then(res => res.json()),
      fetch('http://localhost:5000/api/outbound_orders').then(res => res.json())
    ])
      .then(([c, p, o]) => {
        setCustomers(Array.isArray(c) ? c : []);
        setProducts(Array.isArray(p) ? p : []);
        setOutboundOrders(Array.isArray(o) ? o : []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('API 載入失敗:', err);
        setIsLoading(false);
      });
  };

  // --- 明細欄位變動處理 ---
  const handleItemChange = (index, field, value) => {
    const updated = [...newItems];
    
    if (field === 'product_id') {
      updated[index][field] = value;
      // 依據 ERD，尋找對應產品並嘗試帶入單價（如果產品表有單價的話，或由使用者自行輸入）
      const prod = products.find(p => Number(p.id) === Number(value));
      if (prod) {
        // 若 products 表沒定義 unit_price，這裡預設為 0
        updated[index].unit_price = prod.unit_price || 0; 
      }
    } else {
      updated[index][field] = field === 'quantity' ? parseInt(value || 0) : parseFloat(value || 0);
    }
    setNewItems(updated);
  };

  const addItem = () => {
    setNewItems([...newItems, { product_id: '', quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index) => {
    if (newItems.length > 1) {
      setNewItems(newItems.filter((_, i) => i !== index));
    }
  };

  // --- 核心：兩階段資料新增邏輯 ---
  const handleCreateOrder = async (e) => {
    e.preventDefault();

    // 表單前端檢查
    if (!newOrder.customer_id) return alert("請選擇客戶");
    if (newItems.some(item => !item.product_id || item.quantity <= 0)) {
      return alert("請確保所有明細品項都已選取商品且數量大於 0");
    }

    try {
      // 準備主檔 Payload (配合 ERD 格式)
      const orderPayload = {
        order_number: newOrder.order_number || `OUT-${Date.now()}`, // 若沒填則前端自動產一組編號
        customer_id: parseInt(newOrder.customer_id),
        status: newOrder.status,
        actual_ship_date: newOrder.status === 'shipped' 
          ? (newOrder.actual_ship_date || new Date().toISOString().split('T')[0]) 
          : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 階段 1：新增至主檔表 outbound_orders
      const orderResponse = await fetch('http://localhost:5000/api/outbound_orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      
      const savedOrderResult = await orderResponse.json();
      
      // 這裡處理回傳格式（有的通用 CRUD 回傳的是包在陣列裡如 [id] 或整個物件）
      const savedOrder = Array.isArray(savedOrderResult) ? savedOrderResult[0] : savedOrderResult;
      const orderId = savedOrder?.id || savedOrder; // 取得剛建立的主檔 ID

      if (!orderId) throw new Error("無法取得新建出貨單的 ID");

      // 階段 2：將主檔 ID 綁進所有明細，並集體新增至 outbound_items
      const itemPromises = newItems.map(item => {
        const itemPayload = {
          outbound_order_id: parseInt(orderId), // 關鍵連結點
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price),
          created_at: new Date().toISOString()
        };

        return fetch('http://localhost:5000/api/outbound_items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemPayload)
        }).then(res => res.json());
      });

      // 等待所有明細皆寫入完成
      await Promise.all(itemPromises);

      alert(`出貨單 ${orderPayload.order_number} 及其明細已成功建立！`);

      // 重置表單與重新刷新列表
      setNewOrder({ order_number: '', customer_id: '', status: 'pending', actual_ship_date: '' });
      setNewItems([{ product_id: '', quantity: 1, unit_price: 0 }]);
      fetchData(); 

    } catch (err) {
      console.error(err);
      alert("建立出貨單與明細失敗: " + err.message);
    }
  };

  if (isLoading) return <div style={{ padding: '50px', textAlign: 'center' }}>資料載入中...</div>;

  return (
    <div style={{ padding: '24px', backgroundColor: '#F3F4F6', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: '24px', color: '#111827', fontWeight: 'bold' }}>出貨管理系統</h2>

      <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '20px', color: '#374151', borderLeft: '4px solid #2563EB', paddingLeft: '12px' }}>
          建立新出貨單 (現有 {customers.length} 位客戶)
        </h3>
        
        <form onSubmit={handleCreateOrder}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            
            {/* 單號輸入 */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>出貨單號 (非必填)</label>
              <input 
                type="text"
                placeholder="自動生成 或 輸入單號"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box' }}
                value={newOrder.order_number}
                onChange={e => setNewOrder({...newOrder, order_number: e.target.value})}
              />
            </div>

            {/* 客戶下拉選單 */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>客戶名稱</label>
              <select 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
                value={newOrder.customer_id}
                onChange={e => setNewOrder({...newOrder, customer_id: e.target.value})}
                required
              >
                <option value="">請選擇客戶...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* 狀態下拉選單 */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>訂單狀態</label>
              <select 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
                value={newOrder.status}
                onChange={e => setNewOrder({...newOrder, status: e.target.value})}
              >
                <option value="pending">待處理 (Pending)</option>
                <option value="processing">處理中 (Processing)</option>
                <option value="shipped">已出貨 (Shipped)</option>
              </select>
            </div>

            {/* 實際出貨日期 (當狀態是已出貨時才顯示) */}
            {newOrder.status === 'shipped' && (
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>實際出貨日期</label>
                <input 
                  type="date"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box' }}
                  value={newOrder.actual_ship_date}
                  onChange={e => setNewOrder({...newOrder, actual_ship_date: e.target.value})}
                  required
                />
              </div>
            )}
          </div>

          {/* 出貨品項明細 (outbound_items) */}
          <div style={{ marginTop: '24px', backgroundColor: '#F9FAFB', padding: '16px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: '600', fontSize: '14px' }}>出貨品項明細 (對應 outbound_items)</span>
              <button type="button" onClick={addItem} style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #2563EB', color: '#2563EB', background: '#fff' }}>
                + 新增品項
              </button>
            </div>
            
            {newItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap', background: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #eee' }}>
                
                {/* 產品選擇 */}
                <select 
                  style={{ flex: '3 1 200px', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
                  value={item.product_id}
                  onChange={e => handleItemChange(idx, 'product_id', e.target.value)}
                  required
                >
                  <option value="">選擇產品...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - 當前庫存: {p.current_stock}
                    </option>
                  ))}
                </select>

                {/* 數量 */}
                <input 
                  type="number" 
                  placeholder="數量" 
                  style={{ flex: '1 1 80px', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
                  value={item.quantity}
                  onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                  min="1"
                  required
                />

                {/* 單價 */}
                <input 
                  type="number" 
                  placeholder="單價" 
                  style={{ flex: '1 1 100px', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
                  value={item.unit_price}
                  onChange={e => handleItemChange(idx, 'unit_price', e.target.value)}
                  min="0"
                  step="0.01"
                  required
                />

                {/* 刪除明細列按鈕 */}
                <button 
                  type="button" 
                  onClick={() => removeItem(idx)} 
                  disabled={newItems.length === 1} 
                  style={{ 
                    flex: '0 0 auto', padding: '8px 16px', color: '#EF4444', background: '#FEF2F2', 
                    border: '1px solid #FCA5A5', borderRadius: '6px', cursor: 'pointer', 
                    opacity: newItems.length === 1 ? 0.5 : 1 
                  }}
                >
                  刪除
                </button>
              </div>
            ))}
          </div>
          
          <button type="submit" style={{ marginTop: '20px', width: '100%', padding: '12px', backgroundColor: '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
            確認建立出貨單與所有明細
          </button>
        </form>
      </div>
    </div>
  );
}