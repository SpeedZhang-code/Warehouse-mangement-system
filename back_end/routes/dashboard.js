const express = require('express');
const router = express.Router();
const db = require('../db/index_knex'); 

// 核心指標 (Stats) - 對應前端四個卡片
router.get('/stats', async (req, res) => {
    try {
        const stats = await db.transaction(async trx => {
            // A. 總庫存資產估值 (基於 products 當前庫存與最後一次進貨價)
            const inventoryValue = await trx('products')
                .select(trx.raw('SUM(current_stock * COALESCE((SELECT unit_price FROM inbound_items WHERE product_id = products.id ORDER BY created_at DESC LIMIT 1), 0)) as total_value'))
                .first();

            // B. 入庫指標 (Inbound Stats) 優化版
            const today = new Date().toISOString().split('T')[0];

            const inboundData = await trx('inbound_orders as io')
                .select(
                    // 總計待處理 (PENDING/PROCESSING)
                    trx.raw("COUNT(DISTINCT CASE WHEN io.status IN ('PENDING', 'PROCESSING') THEN io.id END) as pending_orders"),
                    // 逾期未收貨單數 (狀態未完成且預計日期早於今日)
                    trx.raw("COUNT(DISTINCT CASE WHEN io.status != 'COMPLETED' AND io.expected_date < ? THEN io.id END)", [today]),
                    // 今日預計到貨品項數
                    trx.raw("COALESCE(SUM(CASE WHEN io.expected_date = ? THEN ii.expected_quantity ELSE 0 END), 0) as today_expected_qty", [today]),
                    // 總體待收貨殘餘數量
                    trx.raw("COALESCE(SUM(ii.expected_quantity - ii.received_quantity), 0) as remaining_qty"),
                    // 達成率計算
                    trx.raw("ROUND(COALESCE(SUM(ii.received_quantity)::numeric / NULLIF(SUM(ii.expected_quantity), 0), 0) * 100, 1) as completion_rate")
                )
                .join('inbound_items as ii', 'io.id', 'ii.inbound_order_id')
                .first();

            // C. 出庫指標 (Outbound Stats) - 基於 outbound_orders (包含緊急程度)
            const outboundData = await trx('outbound_orders')
                .select(
                    trx.raw("COUNT(*) as total_count"),
                    trx.raw("COUNT(*) FILTER (WHERE status = 'PENDING' AND created_at < NOW() - INTERVAL '2 days') as urgent_count"),
                    trx.raw("COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today_count")
                )
                .whereNot('status', 'SHIPPED')
                .first();

            // D. 儲位利用率 (百分比)
            const storageUsage = await trx.raw(`
                SELECT 
                    ROUND((COUNT(DISTINCT location_id)::numeric / NULLIF((SELECT COUNT(*) FROM locations), 0)) * 100, 1) as utilization
                FROM stock_levels 
                WHERE quantity > 0
            `);

            return {
                total_inventory_value: parseFloat(inventoryValue.total_value || 0),
                turnover_rate: "4.2x", // 這裡需要更複雜的年度計算，暫給定值
                pending_inbound_qty: parseInt(inboundData.pending_qty || 0),
                pending_inbound_orders: parseInt(inboundData.pending_orders || 0),
                inbound_completion_rate: parseFloat(inboundData.completion_rate || 0),
                pending_outbound_count: parseInt(outboundData.total_count || 0),
                urgent_outbound_count: parseInt(outboundData.urgent_count || 0),
                today_shipment: parseInt(outboundData.today_count || 0),
                storage_utilization: parseFloat(storageUsage.rows[0]?.utilization || 0)
            };
        });
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// 進出庫金額趨勢 (Trends - 過去 30 日)
router.get('/trends', async (req, res) => {
    try {
        const trends = await db.raw(`
            WITH date_range AS (
                SELECT generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, '1 day')::date AS date
            )
            SELECT 
                dr.date,
                COALESCE(SUM(ii.received_quantity * ii.unit_price), 0) as inbound_total,
                COALESCE(SUM(oi.quantity * oi.unit_price), 0) as outbound_total
            FROM date_range dr
            LEFT JOIN inbound_items ii ON dr.date = DATE(ii.created_at)
            LEFT JOIN outbound_items oi ON dr.date = DATE(oi.created_at)
            GROUP BY dr.date
            ORDER BY dr.date ASC
        `);
        res.json(trends.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 儲位分布 (Location Distribution)
router.get('/location-distribution', async (req, res) => {
    try {
        const dist = await db('locations as l')
            .join('stock_levels as sl', 'l.id', 'sl.location_id')
            .select('l.zone_name as name')
            .sum('sl.quantity as value')
            .groupBy('l.zone_name')
            .having(db.raw('SUM(sl.quantity) > 0'));
        
        res.json(dist);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 即時異動日誌 (Recent Logs) - 強化關聯性
router.get('/recent-logs', async (req, res) => {
    try {
        const logs = await db('inventory_logs as il')
            .join('products as p', 'il.product_id', 'p.id')
            .leftJoin('locations as l', 'il.location_id', 'l.id') // 使用 left join 預防位置被刪除
            .select(
                'il.id',
                'il.created_at',
                'p.sku',
                'p.name as product_name',
                'l.zone_name',
                'l.shelf_number',
                'il.action_type',
                'il.quantity_change',
                'il.reference_id'
            )
            .orderBy('il.created_at', 'desc')
            .limit(10);
            
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;