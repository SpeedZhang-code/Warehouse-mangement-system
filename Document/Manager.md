# 📦 庫存與儲位管理中心 (Manager Component) 開發說明文件

本文件旨在說明 `Manager` 前端元件的技術實現、設計架構與核心邏輯。該元件主要負責處理 WMS (倉儲管理系統) 中的**庫存狀態異動 (Stock Levels)** 與**日誌寫入 (Inventory Logs)**。

---

## 🛠️ 技術棧與依賴庫 (Tech Stack & Dependencies)

本元件採用輕量、原生且無外部 UI 框架依賴的架構設計：

* **前端核心框架**：`React` (v16.8+)
    * 完整使用 **React Hooks** 進行狀態管理與生命週期控制，無類別元件 (Class Component)。
* **非同步請求 (HTTP Client)**：原生 `Fetch API`
    * 未使用 `axios` 等外部庫，降低專案打包體積。
    * 利用 `Promise.all` 進行多支 API 的併發請求 (Concurrent Requests) 優化載入速度。
* **樣式處理 (Styling)**：`CSS-in-JS` (Inline Styles)
    * 使用純 JavaScript 物件宣告樣式，確保元件的獨立性與高可移植性，不需額外配置 CSS 載入器。

---

## 🗂️ 核心狀態管理 (State Management)

元件內部狀態分為三大類：**選單資料源**、**表單欄位**以及 **UI 互動狀態**。

### 1. 選單資料源狀態 (Data Source States)
用於快取從後端 API 取得的基礎下拉選單資料：
* `products` (Array): 商品列表，內含 SKU、名稱及當前庫存數。
* `locations` (Array): 儲位列表，內含區域名稱 (Zone) 與貨架號 (Shelf Number)。
* `inboundOrders` (Array): 歷史/進行中的廠商入庫單清單。
* `outboundOrders` (Array): 歷史/進行中的出貨出庫單清單。

### 2. 表單欄位狀態 (Form Content State)
單一物件狀態 `formData`，便於收集與包裝要送出至後端的 Payload：
```javascript
{
  product_id: '',        // 商品 ID (對應後端 Integer)
  location_id: '',       // 儲位 ID (對應後端 Integer)
  quantity_change: '',   // 異動數量 (正數為入庫/盤盈，負數為出庫/盤虧)
  action_type: 'INBOUND', // 異動類型：INBOUND | OUTBOUND | ADJUST
  reference_id: ''       // 關聯單號或盤點原因備註
}

# 系統流程圖

## 系統流程架構

```mermaid
graph TD
    %% 頁面初始化流程
    Init[頁面初始化] --> Fetch[Fetch API Promise.all]
    Fetch --> WriteState[寫入 products / locations / orders 狀態]
    WriteState --> Render[渲染 UI]

    %% 使用者操作循環
    Render -->|期待使用者操作| UserAction[使用者操作]
    UserAction -->|循環回操作界面| Render

    %% 操作分支 1：切換類型
    UserAction --> SwitchType[切換 action_type]
    SwitchType --> ClearRef[自動清空舊的 reference_id 防呆]

    %% 操作分支 2：表單提交
    UserAction --> Submit[填寫完畢點擊送出]
    Submit --> Validate[表單驗證]
    Validate --> PostApi[POST /api/manager]
    PostApi -->|成功| Refresh[重新整理選單與庫存 fetchData]