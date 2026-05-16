const express = require('express');
const router = express.Router();
const db = require('../db/index');

//  取得所有紀錄
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM inventory_logs ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//  新增紀錄 (修正了欄位名稱與參數)
router.post('/', async (req, res) => {
    // 根據你的 SQL Schema，需要 product_id, location_id, quantity_change, action_type
    const { product_id, location_id, quantity_change, action_type } = req.body;
    
    try {
        const result = await db.query(
            'INSERT INTO inventory_logs (product_id, location_id, quantity_change, action_type) VALUES ($1, $2, $3, $4) RETURNING *',
            [product_id, location_id, quantity_change, action_type]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        // 這裡會精準噴出為何失敗 (例如外鍵不存在或 action_type 寫錯)
        res.status(500).json({ error: err.message });
    }
});

//  更新紀錄
router.put('/:id', async (req, res) => {
    const { product_id, location_id, quantity_change, action_type } = req.body;
    try {
        const result = await db.query(
            'UPDATE inventory_logs SET product_id=$1, location_id=$2, quantity_change=$3, action_type=$4 WHERE id=$5 RETURNING *',
            [product_id, location_id, quantity_change, action_type, req.params.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: '找不到該筆紀錄' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//  刪除紀錄
router.delete('/:id', async (req, res) => {
    try {
        const result = await db.query('DELETE FROM inventory_logs WHERE id=$1', [req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ error: '找不到該筆紀錄' });
        res.json({ message: '紀錄已刪除' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
