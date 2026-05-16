import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const InboundManager = () => {
  // ---  基礎選單資料 ---
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  
  // ---  新增單據狀態 ---
  const [orderInfo, setOrderInfo] = useState({
    order_number: `IN${Date.now()}`,
    supplier_id: '',
    status: 'completed', // 初始狀態改為已完成
    expected_date: new Date().toISOString().split('T')[0]
  });
  const [items, setItems] = useState([
    { product_id: '', location_id: '', expected_quantity: 0, received_quantity: 0, unit_price: 0 }
  ]);
  
  // 初始化讀取選單
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [s, p, l] = await Promise.all([
          axios.get(`${API_BASE}/suppliers`),
          axios.get(`${API_BASE}/products`),
          axios.get(`${API_BASE}/locations`)
        ]);
        setSuppliers(s.data);
        setProducts(p.data);
        setLocations(l.data);
      } catch (err) {
        console.error("基礎資料讀取失敗", err);
      }
    };
    loadOptions();
  }, []);

  // --- 功能邏輯：新增表單處理 ---
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([...items, { product_id: '', location_id: '', expected_quantity: 0, received_quantity: 0, unit_price: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = items.every(i => i.product_id && i.location_id && i.received_quantity > 0);
    if (!isValid) return alert("請確認商品、儲位已選擇，且實收數量大於 0");
    try {
      const payload = { ...orderInfo, items };
      await axios.post(`${API_BASE}/inbound/orders`, payload);
      alert("入庫單據建立並提交成功！");
      
      // 重置表單
      setOrderInfo({
        order_number: `IN${Date.now()}`,
        supplier_id: '',
        status: 'completed', // 重置時保持已完成狀態
        expected_date: new Date().toISOString().split('T')[0]
      });
      setItems([{ product_id: '', location_id: '', expected_quantity: 0, received_quantity: 0, unit_price: 0 }]);
    } catch (err) {
      alert(err.response?.data?.error || "提交失敗");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
        
        {/* ================= 建立新單據區塊 ================= */}
        <section className="bg-white p-6 rounded-xl shadow-md border-t-4 border-green-500"> {/* 邊框改為綠色代表完成 */}
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold flex items-center text-green-700">
            ➕ 建立新進貨單 (直接入庫)
            </h3>
            <p className="text-sm text-gray-500 font-mono">新單號：{orderInfo.order_number}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            {/* --- 表頭區塊 --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-gray-100">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">供應商</label>
                <select 
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-400 outline-none bg-white"
                  value={orderInfo.supplier_id}
                  onChange={e => setOrderInfo({...orderInfo, supplier_id: e.target.value})}
                  required
                >
                  <option value="">請選擇供應商</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* 狀態顯示修改：改為已入庫 */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">單據狀態</label>
                <div className="w-full border border-green-200 rounded-md p-2 bg-green-50 text-green-700 font-bold cursor-not-allowed">
                  ✅ 已入庫 (Completed)
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">入庫日期</label>
                <input 
                  type="date" 
                  className="w-full border border-gray-300 rounded-md p-2 outline-none"
                  value={orderInfo.expected_date}
                  onChange={e => setOrderInfo({...orderInfo, expected_date: e.target.value})}
                />
              </div>
            </div>

            {/* --- 表身表格 --- */}
            <div className="w-full overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                <tr className="bg-gray-50 text-gray-600 uppercase text-xs font-bold tracking-wider border-b border-gray-200">
                    <th className="py-3 px-4" style={{ width: '30%' }}>商品名稱</th>
                    <th className="py-3 px-4" style={{ width: '25%' }}>存放儲位</th>
                    <th className="py-3 px-2 text-center" style={{ width: '10%' }}>預計</th>
                    <th className="py-3 px-2 text-center" style={{ width: '10%' }}>實收</th>
                    <th className="py-3 px-4 text-right" style={{ width: '15%' }}>進貨單價</th>
                    <th className="py-3 px-4 text-center" style={{ width: '10%' }}>操作</th>
                </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-200">
                {items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                        <select 
                        className="w-full p-2 border border-gray-300 rounded text-sm bg-white focus:ring-2 focus:ring-blue-400"
                        value={item.product_id}
                        onChange={e => handleItemChange(index, 'product_id', e.target.value)}
                        required
                        >
                        <option value="">請選擇商品</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                        ))}
                        </select>
                    </td>
                    <td className="py-3 px-4">
                        <select 
                        className="w-full p-2 border border-gray-300 rounded text-sm bg-white focus:ring-2 focus:ring-blue-400"
                        value={item.location_id}
                        onChange={e => handleItemChange(index, 'location_id', e.target.value)}
                        required
                        >
                        <option value="">選擇儲位</option>
                        {locations.map(l => (
                            <option key={l.id} value={l.id}>{l.zone_name} - {l.shelf_number}</option>
                        ))}
                        </select>
                    </td>
                    <td className="py-3 px-2">
                        <input 
                        type="number" 
                        className="w-full p-2 border border-gray-300 rounded text-center outline-none" 
                        placeholder="0"
                        value={item.expected_quantity === 0 ? '' : item.expected_quantity} 
                        onChange={e => handleItemChange(index, 'expected_quantity', parseInt(e.target.value) || 0)} 
                        />
                    </td>
                    <td className="py-3 px-2">
                        <input 
                        type="number" 
                        className="w-full p-2 border border-green-300 rounded text-center font-bold text-green-600 bg-green-50 outline-none" 
                        placeholder="0"
                        value={item.received_quantity === 0 ? '' : item.received_quantity} 
                        onChange={e => handleItemChange(index, 'received_quantity', parseInt(e.target.value) || 0)} 
                        />
                    </td>
                    <td className="py-3 px-4">
                        <input 
                        type="number" 
                        step="0.01" 
                        className="w-full p-2 border border-gray-300 rounded text-right outline-none" 
                        placeholder="0.00"
                        value={item.unit_price === 0 ? '' : item.unit_price} 
                        onChange={e => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)} 
                        />
                    </td>
                    <td className="py-3 px-4 text-center">
                        <button 
                        type="button" 
                        onClick={() => removeItem(index)} 
                        className="text-red-500 hover:text-red-700 transition-colors font-medium"
                        >
                        移除
                        </button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
                
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <button 
                type="button" 
                onClick={addItem} 
                className="flex items-center text-blue-600 hover:text-blue-800 font-bold"
            >
                <span className="text-xl mr-1">+</span> 新增一列商品
            </button>
            
            <button 
                type="submit" 
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-10 rounded-full shadow-lg transition duration-300"
            >
                確認提交單據
            </button>
            </div>
        </form>
        </section>
    </div>
  );
};

export default InboundManager;