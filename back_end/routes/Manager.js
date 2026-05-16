const express = require('express');
const router = express.Router();
const db = require('../db/index_knex'); // 引入你的 Knex 實例

// POST /api/manager
router.post('/', async (req, res) => {
    const { product_id, location_id, quantity_change, action_type, reference_id } = req.body;

    // 1. 基本後端欄位防呆驗證
    if (!product_id || !location_id || quantity_change === undefined || !action_type) {
        return res.status(400).json({ 
            success: false, 
            message: '缺少必要參數：product_id, location_id, quantity_change, action_type' 
        });
    }
    
    //  關鍵對應轉換：將前端的 'INBOUND' / 'OUTBOUND' 轉換為符合資料庫 CHECK 限制的 'IN' / 'OUT'
    let dbActionType = action_type;
    if (action_type === 'INBOUND') dbActionType = 'IN';
    if (action_type === 'OUTBOUND') dbActionType = 'OUT';

    // 2. 開始執行 Knex 資料庫交易 (Transaction)
    try {
        await db.transaction(async (trx) => {
            
            //  步驟一：寫入異動日誌 (inventory_logs)
            await trx('inventory_logs').insert({
                product_id: parseInt(product_id),
                location_id: parseInt(location_id),
                quantity_change: parseInt(quantity_change),
                action_type: dbActionType, // 👈 使用轉換後符合資料庫規定的字串 ('IN', 'OUT', 'ADJUST')
                reference_id: reference_id || null, 
                created_at: new Date() // 使用 JS Date 物件，避免部分驅動解析內建函數時錯位
            });

            //  步驟二：檢查該儲位上是否已經有該商品的庫存紀錄 (stock_levels)
            const existingStock = await trx('stock_levels')
                .where({ product_id, location_id })
                .first(); 

            if (existingStock) {
                // A 方案：已有紀錄，進行數量更新 (Update)
                const newQuantity = existingStock.quantity + parseInt(quantity_change);
                
                if (newQuantity < 0) {
                    throw new Error('庫存不足，無法完成扣量操作！');
                }

                await trx('stock_levels')
                    .where({ id: existingStock.id })
                    .update({
                        quantity: newQuantity,
                        updated_at: new Date()
                    });
            } else {
                // B 方案：全新商品進到此儲位，新增一筆紀錄 (Insert)
                if (parseInt(quantity_change) < 0) {
                    throw new Error('此儲位尚無庫存，無法進行扣量操作！');
                }

                await trx('stock_levels').insert({
                    product_id: parseInt(product_id),
                    location_id: parseInt(location_id),
                    quantity: parseInt(quantity_change),
                    last_counted_at: new Date(),
                    updated_at: new Date()
                });
            }

            //  步驟三：同步更新 products 主表的總庫存 (current_stock)
            const product = await trx('products').where({ id: product_id }).first();
            if (product) {
                await trx('products')
                    .where({ id: product_id })
                    .update({
                        current_stock: product.current_stock + parseInt(quantity_change),
                        updated_at: new Date()
                    });
            }
        });
        
        return res.status(200).json({ 
            success: true, 
            message: '庫存異動成功，已同步更新日誌與狀態！' 
        });

    } catch (error) {
        console.error('庫存交易操作失敗，已回滾：', error.message);
        return res.status(500).json({ 
            success: false, 
            message: error.message || '伺服器內部錯誤，庫存更新失敗。' 
        });
    }
});

module.exports = router;