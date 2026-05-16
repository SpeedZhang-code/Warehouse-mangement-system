import React, { useState, useEffect } from 'react';

export default function Manager() {
  // 選單資料源狀態
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [inboundOrders, setInboundOrders] = useState([]);
  const [outboundOrders, setOutboundOrders] = useState([]);
  
  // 表單欄位狀態
  const [formData, setFormData] = useState({
    product_id: '',
    location_id: '',
    quantity_change: '', // 異動數量
    action_type: 'INBOUND', // INBOUND, OUTBOUND, ADJUST
    reference_id: '' // 這邊會存入選擇的單號 (order_number)
  });

  // UI 狀態
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // --- 初始化抓取資料 ---
  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      fetch('http://localhost:5000/api/products').then(res => res.json()),
      fetch('http://localhost:5000/api/locations').then(res => res.json()),
      fetch('http://localhost:5000/api/inbound_orders').then(res => res.json()),
      fetch('http://localhost:5000/api/outbound_orders').then(res => res.json())
    ])
      .then(([p, l, io, oo]) => {
        setProducts(Array.isArray(p) ? p : []);
        setLocations(Array.isArray(l) ? l : []);
        setInboundOrders(Array.isArray(io) ? io : []);
        setOutboundOrders(Array.isArray(oo) ? oo : []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('API 載入失敗:', err);
        setMessage('❌ 無法載入基礎選單資料，請檢查後端 API 連線。');
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 處理欄位變更
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      
      // 💡 防呆：如果使用者切換了「異動類型」，就自動清空舊的參考單號，避免入庫類型選到出庫單號
      if (name === 'action_type') {
        updated.reference_id = '';
      }
      return updated;
    });
  };

  // 處理表單送出
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    if (!formData.product_id || !formData.location_id || !formData.quantity_change) {
      setMessage('❌ 請填寫所有必填欄位！');
      setIsSubmitting(false);
      return;
    }
    
    const payload = {
      product_id: parseInt(formData.product_id),
      location_id: parseInt(formData.location_id),
      quantity_change: parseInt(formData.quantity_change),
      action_type: formData.action_type,
      reference_id: formData.reference_id || null, // 傳送選擇的單號或 null
    };

    try {
      // 💡 關鍵改動：將網址修正為對應後端的新網址 (移除 /inventory/manage)
      const response = await fetch('http://localhost:5000/api/manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();

      // 💡 同步優化：後端有回傳 success 屬性，前端直接用 result.success 來精準判斷
      if (response.ok && result.success) {
        setMessage(`✅ ${result.message || '庫存異動成功！已更新庫存與紀錄。'}`);
        setFormData({
          product_id: '',
          location_id: '',
          quantity_change: '',
          action_type: formData.action_type,
          reference_id: ''
        });
        fetchData(); // 重新整理下拉選單與庫存數
      } else {
        setMessage(`❌ 異動失敗: ${result.message || '未知錯誤'}`);
      }
    } catch (error) {
      console.error(error);
      setMessage('❌ 連線後端失敗，請稍後再試。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div style={styles.container}>⏳ 正在載入商品、儲位與單號清單...</div>;
  }

  return (
    <div style={styles.container}>
      <h2>📦 庫存與儲位管理中心 (Manager)</h2>
      <p style={styles.subtitle}>同時異動庫存狀態 (Stock Levels) 並寫入日誌 (Inventory Logs)</p>
      
      {message && <div style={styles.alert}>{message}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* 異動類型 */}
        <div style={styles.formGroup}>
          <label style={styles.label}>異動類型 (action_type)</label>
          <select 
            name="action_type" 
            value={formData.action_type} 
            onChange={handleChange}
            style={styles.input}
          >
            <option value="INBOUND">📥 廠商入庫 (INBOUND)</option>
            <option value="OUTBOUND">📤 出貨出庫 (OUTBOUND)</option>
            <option value="ADJUST">🔄 庫存盤點異動 (ADJUST)</option>
          </select>
        </div>

        {/* 商品選擇 */}
        <div style={styles.formGroup}>
          <label style={styles.label}>選擇商品 *</label>
          <select
            name="product_id"
            value={formData.product_id}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="">-- 請選擇商品 --</option>
            {products.map((prod) => (
              <option key={prod.id} value={prod.id}>
                [{prod.sku}] {prod.name} (庫存總數: {prod.current_stock})
              </option>
            ))}
          </select>
        </div>

        {/* 儲位選擇 */}
        <div style={styles.formGroup}>
          <label style={styles.label}>選擇儲位 *</label>
          <select
            name="location_id"
            value={formData.location_id}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="">-- 請選擇儲位 --</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                區域: {loc.zone_name} / 貨架號: {loc.shelf_number}
              </option>
            ))}
          </select>
        </div>

        {/* 動態單號關聯下拉選單 */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            {formData.action_type === 'INBOUND' && '關聯入庫單號 (reference_id)'}
            {formData.action_type === 'OUTBOUND' && '關聯出庫單號 (reference_id)'}
            {formData.action_type === 'ADJUST' && '盤點備註原因 (reference_id)'}
          </label>

          {/* 如果是入庫，顯示入庫單下拉選單 */}
          {formData.action_type === 'INBOUND' && (
            <select
              name="reference_id"
              value={formData.reference_id}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="">-- 請選擇相關入庫單號 (選填) --</option>
              {inboundOrders.map((order) => (
                <option key={order.id} value={order.order_number}>
                  {order.order_number} ({order.status})
                </option>
              ))}
            </select>
          )}

          {/* 如果是出庫，顯示出庫單下拉選單 */}
          {formData.action_type === 'OUTBOUND' && (
            <select
              name="reference_id"
              value={formData.reference_id}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="">-- 請選擇相關出庫單號 (選填) --</option>
              {outboundOrders.map((order) => (
                <option key={order.id} value={order.order_number}>
                  {order.order_number} ({order.status})
                </option>
              ))}
            </select>
          )}

          {/* 如果是無關單據的盤點調整，恢復成文字輸入讓人員填寫原因 */}
          {formData.action_type === 'ADJUST' && (
            <input
              type="text"
              name="reference_id"
              placeholder="例如: 週期盤點盈虧、定期報廢"
              value={formData.reference_id}
              onChange={handleChange}
              style={styles.input}
            />
          )}
        </div>

        {/* 5. 異動數量 */}
        <div style={styles.formGroup}>
          <label style={styles.label}>異動數量 (quantity_change) *</label>
          <input
            type="number"
            name="quantity_change"
            placeholder={formData.action_type === 'OUTBOUND' ? "請輸入負數，例如: -10" : "請輸入正數，例如: 10"}
            value={formData.quantity_change}
            onChange={handleChange}
            style={styles.input}
          />
        </div>

        {/* 送出按鈕 */}
        <button type="submit" disabled={isSubmitting} style={styles.button}>
          {isSubmitting ? '處理中...' : '確認送出異動'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { maxWidth: '550px', margin: '40px auto', padding: '25px', border: '1px solid #e0e0e0', borderRadius: '12px', fontFamily: 'system-ui, sans-serif', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  subtitle: { color: '#666', fontSize: '14px', marginBottom: '25px' },
  form: { display: 'flex', flexDirection: 'column' },
  formGroup: { marginBottom: '18px' },
  label: { display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '14px', color: '#333' },
  input: { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '14px' },
  button: { padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', marginTop: '10px' },
  alert: { padding: '12px', marginBottom: '20px', borderRadius: '6px', backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', fontSize: '14px' }
};