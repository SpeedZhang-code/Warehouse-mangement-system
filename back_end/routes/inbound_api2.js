const express = require('express');
const router = express.Router();
const db = require('../db/index_knex');

// ============================================================
//  建立進貨單 (支援 pending / completed 兩種狀態)
// ============================================================
router.post('/orders', async (req, res) => {
    const { order_number, supplier_id, expected_date, status, items } = req.body;

    // 僅允許這兩種狀態
    const allowedStatus = ['pending', 'completed'];
    const finalStatus = allowedStatus.includes(status) ? status : 'pending';

    try {
        await db.transaction(async (trx) => {

            // --- 寫入主檔 ---
            const [orderIdObj] = await trx('inbound_orders')
                .insert({
                    order_number,
                    supplier_id,
                    status: finalStatus,
                    expected_date,
                    updated_at: db.fn.now()
                })
                .returning('id');

            const orderId = orderIdObj.id ?? orderIdObj;
            
            // --- 寫入明細 ---
            // completed 時 received_quantity 以 expected_quantity 為準
            const itemsToInsert = items.map(item => ({
                inbound_order_id: orderId,
                product_id:        item.product_id,
                expected_quantity: item.expected_quantity,
                received_quantity: finalStatus === 'completed' ? item.expected_quantity : 0,
                unit_price:        item.unit_price
            }));

            await trx('inbound_items').insert(itemsToInsert);

            // --- 若直接 completed：連動庫存 ---
            if (finalStatus === 'completed') {
                await processInventory(trx, items, 'inbound');
            }
        });

        res.status(201).json({ message: `進貨單建立成功 (${finalStatus})` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '建立失敗', details: err.message });
    }
});

// ============================================================
//  查詢全部進貨單 (含分頁 + 關鍵字搜尋)
// ============================================================
router.get('/orders', async (req, res) => {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    try {
        let query = db('inbound_orders')
            .join('suppliers', 'inbound_orders.supplier_id', 'suppliers.id')
            .select(
                'inbound_orders.*',
                'suppliers.name as supplier_name'
            )
            .orderBy('inbound_orders.created_at', 'desc');

        if (search) {
            query = query.where('inbound_orders.order_number', 'ilike', `%${search}%`);
        }
        if (status) {
            query = query.andWhere('inbound_orders.status', status);
        }

        const [{ count }] = await query.clone().count('inbound_orders.id as count');
        const orders = await query.limit(limit).offset(offset);

        res.json({ orders, total: parseInt(count), page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '查詢失敗', details: err.message });
    }
});

// ============================================================
//  查詢特定單號 (含明細)
// ============================================================
router.get('/orders/:orderNumber', async (req, res) => {
    try {
        const order = await db('inbound_orders')
            .join('suppliers', 'inbound_orders.supplier_id', 'suppliers.id')
            .where('inbound_orders.order_number', req.params.orderNumber)
            .select('inbound_orders.*', 'suppliers.name as supplier_name')
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

// ============================================================
//  更新 pending 單據基本資料
// ============================================================
router.put('/orders/:id', async (req, res) => {
    const { expected_date, supplier_id } = req.body;
    const orderId = req.params.id;

    try {
        const order = await db('inbound_orders').where({ id: orderId }).first();
        if (!order) return res.status(404).json({ error: '找不到單據' });
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

// ============================================================
//  確認入庫：pending → completed (核心：連動庫存)
// ============================================================
// ============================================================
//  更改訂單狀態 (支援 pending -> completed 且連動庫存)
// ============================================================
router.patch('/orders/:id/status', async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body; // 從前端傳入想要變更的目標狀態

    // 限制允許變更的目標狀態
    const allowedStatus = ['pending', 'completed'];
    if (!allowedStatus.includes(status)) {
        return res.status(400).json({ error: '不支援的訂單狀態變更' });
    }

    try {
        await db.transaction(async (trx) => {

            // --- 確認單據存在 ---
            const order = await trx('inbound_orders').where({ id: orderId }).first();
            if (!order) throw new Error('找不到單據');

            // 如果目標狀態與當前狀態相同，不處理直接跳出
            if (order.status === status) return;

            // 核心邏輯：如果是從 pending 轉為 completed，才需要執行入庫與庫存連動
            if (order.status === 'pending' && status === 'completed') {
                
                // 1. 讀取該單所有明細
                const dbItems = await trx('inbound_items')
                    .where({ inbound_order_id: orderId })
                    .select('id', 'product_id', 'expected_quantity', 'location_id');

                if (!dbItems.length) throw new Error('此單據沒有任何明細，無法完成入庫');

                // 2. 將實收數量 (received_quantity) 同步為預計數量 (expected_quantity)
                for (const item of dbItems) {
                    await trx('inbound_items')
                        .where({ id: item.id })
                        .update({ received_quantity: item.expected_quantity });
                }

                // 3. 連動庫存：更新 products.current_stock & 寫入 inventory_logs
                await processInventory(trx, dbItems, 'inbound');
            } 
            // 💡 提示：如果未來需要「從 completed 扣回庫存變成 pending」或「取消訂單」，可以在這裡擴充 else if
            else if (order.status === 'completed' && status === 'pending') {
                throw new Error('已完成入庫的單據，不允許改回待入庫狀態');
            }

            // --- 統一更新主檔狀態 ---
            await trx('inbound_orders').where({ id: orderId }).update({
                status: status,
                updated_at: db.fn.now()
            });
        });

        res.json({ message: `進貨單狀態已更新為：${status}` });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
});

// ============================================================
// 共用：處理庫存連動
// items 格式：[{ product_id, expected_quantity, location_id }]
// 以 expected_quantity 為準更新庫存
// ============================================================
async function processInventory(trx, items, actionType = 'inbound') {
    for (const item of items) {
        const qty = parseInt(item.expected_quantity) || 0;
        if (qty <= 0) continue;

        // 更新 products.current_stock
        await trx('products')
            .where({ id: item.product_id })
            .increment('current_stock', qty)
            .update({ updated_at: trx.fn.now() });

        // 寫入 inventory_logs
        await trx('inventory_logs').insert({
            product_id:      item.product_id,
            location_id:     item.location_id,
            quantity_change: qty,
            action_type:     actionType,
            created_at:      trx.fn.now()
        });
    }
}

module.exports = router;