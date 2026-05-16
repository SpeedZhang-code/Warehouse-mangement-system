const express = require('express');
const router = express.Router();
const db = require('../db/index'); 

//  取得所有儲位 (READ)
router.get('/', async (req, res) => {
  try {
    // pg 的查詢結果在 result.rows 中，不用加 [ ] 解構
    const result = await db.query('SELECT * FROM locations ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: '資料讀取失敗', details: err.message });
  }
});

//  新增儲位 (CREATE)
router.post('/', async (req, res) => {
  const { zone_name, shelf_number } = req.body;
  
  if (!zone_name || !shelf_number) {
    return res.status(400).json({ error: '請填寫區域名稱與貨架編號' });
  }

  try {
    // PostgreSQL 使用 $1, $2，並透過 RETURNING * 回傳新增的資料
    const result = await db.query(
      'INSERT INTO locations (zone_name, shelf_number) VALUES ($1, $2) RETURNING *',
      [zone_name, shelf_number]
    );
    res.status(201).json({ 
      message: '儲位新增成功', 
      data: result.rows[0] // PostgreSQL 的 ID 直接在回傳的 rows 中
    });
  } catch (err) {
    res.status(500).json({ error: '新增失敗', details: err.message });
  }
});

//  更新儲位 (UPDATE)
router.put('/:id', async (req, res) => {
  const { zone_name, shelf_number } = req.body;
  const { id } = req.params;

  try {
    const result = await db.query(
      'UPDATE locations SET zone_name = $1, shelf_number = $2 WHERE id = $3 RETURNING *',
      [zone_name, shelf_number, id]
    );
    
    // pg 使用 rowCount 來確認影響行數
    if (result.rowCount === 0) return res.status(404).json({ error: '找不到資料更新' });
    res.json({ message: '更新成功', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: '更新失敗', details: err.message });
  }
});

//  刪除儲位 (DELETE)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM locations WHERE id = $1', [id]);
    
    if (result.rowCount === 0) return res.status(404).json({ error: '找不到資料刪除' });
    res.json({ message: '刪除成功' });
  } catch (err) {
    // 如果有外鍵約束（例如 inventory_logs 還連接著此儲位），這裡會報錯
    res.status(500).json({ error: '刪除失敗，該儲位可能尚在使用中', details: err.message });
  }
});

module.exports = router;
