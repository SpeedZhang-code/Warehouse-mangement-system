const express = require('express');
const knex = require('../db/index_knex'); // 👈 確保路徑指向你的新 db 檔

const createCrudRouter = (tableName) => {
  const router = express.Router();
    
  // 查詢全部
  router.get('/', async (req, res) => {
    try {
      const data = await knex(tableName).orderBy('id', 'desc');
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 新增 (Postgres 專用優化)
  router.post('/', async (req, res) => {
    try {
      const [newItem] = await knex(tableName).insert(req.body).returning('*');
      res.status(201).json(newItem);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 更新
  router.put('/:id', async (req, res) => {
    try {
      const [updatedItem] = await knex(tableName)
        .where({ id: req.params.id })
        .update(req.body)
        .returning('*');
      res.json(updatedItem);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 刪除
  router.delete('/:id', async (req, res) => {
    try {
      await knex(tableName).where({ id: req.params.id }).del();
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};

module.exports = createCrudRouter;