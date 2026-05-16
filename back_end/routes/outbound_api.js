const express = require('express');
const router = express.Router();
const db = require('../db/index_knex');

// =========================================================================
//  取得客戶下拉選單資料 (GET /api/outbound/customers)
// =========================================================================
router.get('/customers', async (req, res) => {
  try {
    // 從 customers 資料表撈取 id 與 name
    const customers = await db('customers').select('id', 'name');
    res.json(customers);
  } catch (error) {
    console.error('Fetch customers error:', error);
    res.status(500).json({ error: '無法取得客戶資料' });
  }
});

// =========================================================================
//  取得商品下拉選單資料 (GET /api/outbound/products)
// =========================================================================
router.get('/products', async (req, res) => {
  try {
    // 從 products 資料表撈取 id, name, sku
    const products = await db('products').select('id', 'name', 'sku');
    res.json(products);
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ error: '無法取得商品資料' });
  }
});

// =========================================================================
//  建立出庫單與明細 (POST /api/outbound)
//  對應前端的 handleSubmit 送出的 Payload
// =========================================================================
router.post('/', async (req, res) => {
  const { customer_id, status, items } = req.body;

  // 基礎欄位驗證
  if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: '缺少必要欄位或明細項目為空' });
  }

  // 自動生成單號，格式如：OB-20260514-隨機碼 (可依業務需求調整)
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const order_number = `OB-${dateStr}-${randomSuffix}`;

  // 使用 Knex Transaction 確保 Atomicity (原子性)
  const trx = await db.transaction();

  try {
    // 步驟 A: 寫入主檔 outbound_orders
    const [insertedOrder] = await trx('outbound_orders')
      .insert({
        order_number,
        customer_id: parseInt(customer_id),
        status: status || 'pending',
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      })
      .returning('id'); // 回傳新增的訂單 ID (相容 PostgreSQL / MySQL 可用引數或回傳陣列處理)

    // 處理不同資料表回傳 ID 的型態差異
    const outbound_order_id = typeof insertedOrder === 'object' ? insertedOrder.id : insertedOrder;

    // 步驟 B: 準備明細檔 outbound_items 資料
    const itemsToInsert = items.map(item => ({
      outbound_order_id: outbound_order_id, // 綁定剛生成的主檔 ID
      product_id: parseInt(item.product_id),
      quantity: parseInt(item.quantity),
      unit_price: parseFloat(item.unit_price),
      created_at: db.fn.now()
    }));

    // 步驟 C: 批量寫入明細檔 outbound_items
    await trx('outbound_items').insert(itemsToInsert);

    // 步驟 D: 提交交易
    await trx.commit();

    res.status(201).json({
      success: true,
      message: '出庫單建立成功',
      order_id: outbound_order_id,
      order_number: order_number
    });

  } catch (error) {
    // 發生任何錯誤，全部回滾
    await trx.rollback();
    console.error('Create outbound order transaction error:', error);
    res.status(500).json({ error: '建立出庫單失敗，資料已安全回滾' });
  }
});

module.exports = router;