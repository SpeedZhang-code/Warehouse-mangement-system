# 倉儲管理系統 (WMS) 網頁前端功能需求清單

先設計表單
先實作新增修改刪除等功能，還有API



1.封裝通用 CRUD 函數
2.knex.js會自動根據javascript物件生成SQL語法

Angular框架



-- 建立索引以提升外鍵查詢效能
CREATE INDEX idx_inbound_orders_supplier_id ON inbound_orders(supplier_id);
CREATE INDEX idx_inbound_items_order_id ON inbound_items(inbound_order_id);
CREATE INDEX idx_inbound_items_product_id ON inbound_items(product_id);



## 1. 視覺化儀表板 (Dashboard)
*   **即時庫存統計**：以圖表（圓餅圖/長條圖）顯示各類別物料佔比。
*   **作業看板**：今日待收貨、待出貨、待盤點任務數量即時更新。
*   **異常預警**：
    *   低庫存/過期提醒。
    *   滯銷品（呆滯料）清單。
    *   訂單延遲出貨警示。

## 2. 入庫管理 (Inbound)
*   **入庫單維護**：手動新增或從 ERP 匯入採購訂單 (PO)。
*   **收貨清點**：核對到貨數量、批號錄入。
*   **儲位指引**：系統自動分配或人工指定上架儲位。
*   **標籤列印**：收貨後即時列印內部物料標籤 (Barcode/QR Code)。

## 3. 庫存管理 (Inventory)
*   **即時庫存查詢**：支援依品號、儲位、批號、序列號等多條件篩選。
*   **儲位視覺化**：以格狀圖模擬倉庫佈局，顯示儲位飽和度。
*   **庫存調整**：處理庫存凍結/解凍、報廢處理、手動增減。
*   **調撥管理**：不同儲位或不同廠區間的物料移位申請與審核。
*   **盤點任務**：
    *   建立循環盤點或年度全盤任務。
    *   盤點結果差異分析與帳務盈虧調整。

## 4. 出貨管理 (Outbound)
*   **訂單中心**：管理銷售訂單 (SO)，支援併單、分單作業。
*   **波次規劃 (Wave Picking)**：將多張單據整合成一個批次，優化揀貨路徑。
*   **揀貨狀態追蹤**：監控現場揀貨進度、缺貨處理。
*   **包裝與物流**：
    *   裝箱單 (Packing List) 與物流運單生成。
    *   串接快遞/貨運公司追蹤編號。

## 5. 基礎資料維護 (Master Data)
*   **物料主檔**：品名、規格、單位換算 (UOM)、包裝規格。
*   **倉庫配置**：定義倉庫、區域 (Zone)、儲位 (Bin) 的層級關係與屬性。
*   **往來廠商**：供應商與客戶的基本聯絡資訊。
*   **權限設定 (RBAC)**：角色定義（主管、作業員、觀看者）與菜單權限配置。

## 6. 報表分析 (Reporting)
*   **進銷存報表**：自動生成每日/每月進出貨結存報表。
*   **周轉率分析**：評估物料流動效率。
*   **操作日誌**：詳實記錄每一筆庫存變動的執行人與時間戳。

---
## 技術棧 (Technical Stack Suggestion)
*   **框架**：React.js / Vue.js (推薦使用 Ant Design 或 Element Plus 組件庫)。
*   **圖表**：ECharts / Highcharts。
*   **佈局**：側邊導航 (Sider) + 多頁籤 (Tabs) 管理，方便在不同單據間切換。
