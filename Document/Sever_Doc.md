# WMS 倉儲管理系統 - 後端 API 說明文件

這份文件記錄了 WMS (Warehouse Management System) 系統的後端入口配置資訊，包含技術架構、核心功能與 API 路由設定。

## 🛠 技術棧 (Technology Stack)

- **Runtime**: Node.js
- **Framework**: Express.js (v4.x)
- **Middleware**: 
  - `cors`: 處理跨來源資源共享問題。
  - `express.json()`: 解析 JSON 格式的請求主體 (Request Body)。

## 📦 依賴庫 (Dependencies)


| 庫名稱 | 類型 | 說明 |
| :--- | :--- | :--- |
| `express` | 核心框架 | 構建 RESTful API 的基礎 Web 框架。 |
| `cors` | 中間件 | 允許前端跨網域存取後端 API。 |
| `dotenv` (預設) | 環境管理 | 透過 `process.env.PORT` 靈活配置伺服器埠號。 |

## 🏗 系統核心功能 (Core Features)

本系統主要負責倉儲物流中的四大核心管理維度：

1.  **商品管理 (Products)**: 維護產品基本資訊、規格與屬性。
2.  **分類管理 (Categories)**: 將產品進行層級化分類，方便檢索與統計。
3.  **儲位管理 (Locations)**: 管理倉庫空間，定義貨架、儲位與區域。
4.  **庫存日誌 (Inventory Logs)**: 完整記錄每一筆入庫、出庫與移動的歷史紀錄，確保數據可追溯性。

## 🚀 API 路由配置 (Route Mappings)

所有的 API 基礎路徑皆以 `/api` 開頭：


| 基礎路徑 | 負責路由文件 | 功能描述 |
| :--- | :--- | :--- |
| `/api/inbound` | `inboundApi2` | 處理進庫與入庫相關的特殊業務邏輯。 |
| `/api/outbound` | `outboundApi` | 處理出庫與出貨相關的特殊業務邏輯。 |
| `/api/manager` | `ManagerApi` | 管理員專屬操作功能與權限管理。 |
| `/api/analyze` | `AnalyzeApi` | 庫存數據分析與相關報表生成。 |
| `/api/dashboard` | `dashboard` | 儀表板統計數據與即時狀態監控。 |
| `/api/:tableName` | `crudFactory.js` (動態工廠) | 依據資料表名稱，動態生成通用的增刪改查 (CRUD) 路由並快取。 |

## ⚙️ 執行環境配置

- **預設埠號**: `5000`
- **啟動指令**: 
  - 開發模式：`npm run dev` (建議搭配 nodemon)
  - 正式模式：`node server.js`
