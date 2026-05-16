const express = require('express');
const router = express.Router();
const db = require('../db/index_knex');

// ───  出入庫趨勢 API ──────────────────────────────────────────────────
router.get('/trend', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;

    const sql = `
      WITH date_range AS (
        -- 產生最近 N 天的日期序列
        SELECT (current_date - (n || ' days')::interval)::date AS d
        FROM generate_series(0, ? - 1) AS n
      )
      SELECT 
        to_char(dr.d, 'MM/DD') AS "date",
        -- 這裡對應你資料庫定義的 'IN'
        COALESCE(SUM(CASE WHEN log.action_type = 'IN' THEN log.quantity_change ELSE 0 END), 0)::int AS "inbound",
        -- 這裡對應你資料庫定義的 'OUT'，並取絕對值顯示
        COALESCE(SUM(CASE WHEN log.action_type = 'OUT' THEN ABS(log.quantity_change) ELSE 0 END), 0)::int AS "outbound"
      FROM date_range dr
      LEFT JOIN inventory_logs log ON dr.d = log.created_at::date
      GROUP BY dr.d
      ORDER BY dr.d ASC;
    `;
    
    const result = await db.raw(sql, [days]);
    res.json(result.rows);
  } catch (error) {
    console.error('Trend API Error:', error);
    res.status(500).json({ error: '取得趨勢數據失敗' });
  }
});

// ───  商品類別庫存佔比 API ─────────────────────────────────────────────
router.get('/category-distribution', async (req, res) => {
  try {
    /**
     * 關聯 products 與 categories 表
     * 統計各類別的 current_stock 總和
     */
    const data = await db('products as p')
      .join('categories as c', 'p.category_id', 'c.id')
      .select('c.name')
      .sum('p.current_stock as value')
      .groupBy('c.name')
      .where('p.current_stock', '>', 0)
      .orderBy('value', 'desc');

    // 確保 value 是數字格式，符合前端 Recharts 需求
    const formattedData = data.map(item => ({
      name: item.name,
      value: Number(item.value)
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Category Distribution API Error:', error);
    res.status(500).json({ error: '取得分類佔比失敗' });
  }
});

module.exports = router;