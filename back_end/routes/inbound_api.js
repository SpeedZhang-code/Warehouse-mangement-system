const express = require('express');
const router = express.Router();
const db = require('../db/index_knex');

//  建立進貨單 (強制為 pending)
router.post('/orders', async (req, res) => {
    // 這裡我們不從 req.body 拿 status，強制給它 'pending'
    const { order_number, supplier_id, expected_date, items } = req.body;
    
    try {
        await db.transaction(async (trx) => {
            // 寫入主檔 inbound_orders
            const [orderIdObj] = await trx('inbound_orders')
                .insert({
                    order_number,
                    supplier_id,
                    status: 'Completed', // 強制初始狀態
                    expected_date,
                    updated_at: db.fn.now()
                })
                .returning('id');
            
            const orderId = orderIdObj.id || orderIdObj; // 處理不同資料庫回傳格式
            
            // 處理明細 inbound_items
            const itemsToInsert = items.map(item => ({
                inbound_order_id: orderId,
                product_id: item.product_id,
                expected_quantity: item.expected_quantity,
                received_quantity: 0, // 因為是 pending，實收通常初始為 0
                unit_price: item.unit_price
            }));
            
            await trx('inbound_items').insert(itemsToInsert);
            
            // 注意：這裡移除了呼叫 processInventory 的邏輯
        });

        res.status(201).json({ message: '進貨單(草稿)建立成功' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '建立失敗', details: err.message });
    }
});

//  查詢特定單號 (維持不變)
router.get('/orders/:orderNumber', async (req, res) => {
    try {
        const order = await db('inbound_orders')
            .where({ order_number: req.params.orderNumber })
            .first();

        if (!order) return res.status(404).json({ error: '找不到該單據' });

        const items = await db('inbound_items')
            .join('products', 'inbound_items.product_id', 'products.id')
            .where({ inbound_order_id: order.id })
            .select('inbound_items.*', 'products.name', 'products.sku');

        res.json({ order, items });
    } catch (err) {
        res.status(500).json({ error: '查詢失敗' });
    }
});

//  更新單據 (僅允許修改基本資料，不涉及庫存轉換)
router.put('/orders/:id', async (req, res) => {
    const { expected_date, supplier_id } = req.body;
    const orderId = req.params.id;

    try {
        const order = await db('inbound_orders').where({ id: orderId }).first();
        if (order.status !== 'pending') {
            return res.status(400).json({ error: '只有 Pending 狀態的單據可以修改' });
        }

        await db('inbound_orders').where({ id: orderId }).update({ 
            supplier_id,
            expected_date, 
            updated_at: db.fn.now() 
        });

        res.json({ message: '單據修改成功' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;