const express = require('express');
const router = express.Router();
const db = require('../db/index');

router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM categories ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 修改這裡：新增時加入 description ---
router.post('/', async (req, res) => {
    const { name, description } = req.body; //  從 body 拿出 description
    try {
        //  SQL 加入 description 欄位與 $2 參數
        const result = await db.query(
            'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *', 
            [name, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 修改這裡：更新時加入 description ---
router.put('/:id', async (req, res) => {
    const { name, description } = req.body; //  拿出 description
    try {
        //  SQL 更新語句加入 description=$2
        const result = await db.query(
            'UPDATE categories SET name=$1, description=$2 WHERE id=$3 RETURNING *', 
            [name, description, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM categories WHERE id=$1', [req.params.id]);
        res.json({ message: '分類已刪除' });
    } catch (err) {
        res.status(500).json({ error: "刪除失敗，該分類可能仍有產品關聯" });
    }
});

module.exports = router;