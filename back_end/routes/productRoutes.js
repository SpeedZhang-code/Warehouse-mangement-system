const express = require('express');
const router = express.Router();
const db = require('../db/index');

// 取得所有產品
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM products ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 新增產品
router.post('/', async (req, res) => {
    const { sku, name, category_id, current_stock } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO products (sku, name, category_id, current_stock) VALUES ($1, $2, $3, $4) RETURNING *',
            [sku, name, category_id, current_stock]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 更新產品
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { sku, name, category_id, current_stock } = req.body;
    try {
        const result = await db.query(
            'UPDATE products SET sku=$1, name=$2, category_id=$3, current_stock=$4 WHERE id=$5 RETURNING *',
            [sku, name, category_id, current_stock, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 刪除產品
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM products WHERE id=$1', [id]);
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;