# UniversalCRUD.jsx 技術說明文件

這是一個基於 **React** 開發的通用型後台管理組件，設計核心在於「**配置驅動 (Configuration-Driven)**」，使其能夠以單一組件處理多個數據表的 **C (Create)**、**R (Read)**、**U (Update)**、**D (Delete)** 操作。

---

## 1. 核心功能 (Features)

### 📊 多表動態管理
* **導覽切換**：透過頂部 Tab 快速切換當前操作的資料表（如：`products`, `categories`, `locations`, `inventory_logs`）。
* **同步狀態管理**：切換表格時，組件會自動重置所有表單狀態（Add/Edit/Delete ID），確保資料不發生跨表混淆。

### 🔎 數據瀏覽與格式化
* **智慧時間轉換**：內建 `formatTime` 函式，自動偵測欄位名稱是否以 `_at` 結尾（如 `updated_at`），並將 ISO 字串轉為台灣本地格式（`YYYY/MM/DD HH:mm:ss`）。
* **固定表頭設計**：數據表格支援 `Sticky Header` 與內部捲軸，在處理大量數據時仍能保持標題可見。

### 📝 智慧表單生成
* **欄位過濾**：在「新增」與「編輯」模式下，會自動過濾掉 `_at` 結尾的欄位，防止使用者手動修改由資料庫自動產生的時間戳記。
* **預載資料 (Load-to-Edit)**：支援輸入 ID 後載入原始數據到編輯表單中，避免盲目修改。

### 🛡️ 安全機制
* **二次確認**：執行刪除（Delete）操作前會觸發 `window.confirm` 警告，防止誤刪。
* **錯誤處理**：針對 API 請求建立 `try...catch` 機制，並將後端回傳的錯誤訊息（Error Response）即時反饋給使用者。

---

## 2. 依賴庫 (Dependencies)

| 依賴項目 | 版本需求 | 用途說明 |
| :--- | :--- | :--- |
| **React** | v16.8+ | 使用 `useState` 管理 UI 狀態，`useEffect` 處理 API Side Effects。 |
| **Axios** | 建議最新版 | 負責與後端 RESTful API 進行非同步連線。 |

---

## 3. 核心技術與架構 (Technical Architecture)

### ⚙️ 配置驅動 UI (Table Configuration)
組件透過 `tableConfigs` 物件來定義各表的 schema。這種設計讓擴充功能變得極其簡單，只需修改配置，UI 就會自動生成對應的欄位。

### 🛠️ 非同步狀態控制
* **Fetch Pattern**：利用 `async/await` 封裝 `fetchData` 函式，並在 `useEffect` 中與 `activeTable` 綁定，實現切換表格即自動重新讀取。
* **Computed Props**：透過陣列的 `filter()` 與 `map()` 方法，動態決定哪些欄位該顯示、哪些該轉換為輸入框。

### 🎨 樣式與佈局技術
* **CSS-in-JS**：使用 JavaScript 物件管理樣式，提升樣式維護性與動態渲染能力。
* **Responsive Grid**：
    * **Grid Layout**：表單部分使用 `auto-fit` 佈局，確保在不同解析度下，輸入欄位能自動排列。
    * **Flexbox**：導覽列與操作區塊使用彈性佈局處理間距。

---

## 4. API 端點規範
該檔案預設對接以下格式的 RESTful API：
* `GET /api/{tableName}` - 取得列表
* `POST /api/{tableName}` - 新增資料
* `PUT /api/{tableName}/{id}` - 更新資料
* `DELETE /api/{tableName}/{id}` - 刪除資料