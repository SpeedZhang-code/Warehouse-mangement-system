# Categories API 路由文件技術統整

本 API 檔案是基於 **Node.js** 環境開發，負責處理系統中「分類（Categories）」資源的後端邏輯。

---

## 一、 功能 (Features)
此路由模組實作了完整的 **CRUD** 運算，確保對分類資料的全面管理：

*   **[GET] 取得分類列表**：從 `categories` 資料庫表中檢索所有資料，並依 `id` 升序排列。
*   **[POST] 新增分類**：接收用戶端的 `name` 與 `description` 並存入資料庫，隨即回傳包含新 ID 的完整物件。
*   **[PUT] 修改分類**：針對特定 `id` 更新其名稱與描述內容，採全欄位更新模式。
*   **[DELETE] 刪除分類**：移除指定 ID 的分類，並內建錯誤捕捉機制，防止因資料庫外鍵約束（如該分類下仍有產品）導致的系統崩潰。

---

## 二、 依賴庫 (Dependencies)
*   **Express.js (`express`)**：
    *   `express.Router()`：用於建立模組化、可掛載的路由處理程序。
    *   `req.body`：依賴 Express 內建解析器來讀取前端傳送的 JSON 格式資料。
*   **Database Module (`../db/index.js`)(`../db/index_knex.js`)**：
    *   自定義的資料庫連線模組（為 `pg` 或 `mysql2` 的封裝）。
    *   支援非同步 `query` 方法執行 SQL 指令。

---

## 三、 技術規格 (Technical Stack)

### 1. 核心開發語法
*   **非同步流程控制 (`Async/Await`)**：取代舊式的 Promise 鏈或 Callback，提高代碼的維護性與可讀性。
*   **物件解構 (`Object Destructuring`)**：例如 `const { name, description } = req.body`，直接提取特定屬性。

### 2. 資料庫安全與效能
*   **防止 SQL 注入 (`Parameterized Queries`)**：使用 `$1, $2` 等佔位符傳參，確保使用者輸入的資料不會被視為惡意指令執行。
*   **資料回傳優化 (`RETURNING *`)**：在寫入或修改 SQL 時直接回傳受影響的資料列，避免額外的 `SELECT` 查詢開銷。

### 3. API 設計標準
*   **RESTful 架構**：嚴格遵循 HTTP 語義（GET/查詢、POST/建立、PUT/修改、DELETE/刪除）。
*   **錯誤處理機制 (`Exception Handling`)**：
    *   使用 `try...catch` 捕捉所有非預期錯誤。
    *   **HTTP 狀態碼運用**：成功時回傳 `200/201`，失敗時回傳 `500` 並帶上錯誤 JSON 訊息。
*   **動態路由參數 (`URL Parameters`)**：透過 `req.params.id` 識別特定操作對象。


# Express API 路由語法解釋

這段程式碼是用於 **Node.js (Express)** 環境下，從資料庫讀取資料並回傳給客戶端的典型寫法。

### 1. 路由宣告
```javascript
router.get('/', async (req, res) => { ... });
```
*   **`router.get('/')`**: 定義一個處理 **GET** 請求的路由，路徑為根目錄。
*   **`async`**: 宣告這是一個非同步函式，允許在內部使用 `await`。
*   **`req, res`**: 
    *   `req` (Request): 客戶端發送過來的請求。
    *   `res` (Response): 伺服器要回傳的回應。

### 2. 安全處理結構
```javascript
try { ... } catch (err) { ... }
```
*   **`try`**: 放置主要邏輯。如果執行順利，就回傳資料。
*   **`catch (err)`**: 如果 SQL 語法錯誤或資料庫斷線，會捕獲錯誤，防止伺服器當掉。

### 3. 資料庫查詢邏輯
```javascript
const result = await db.query('SELECT * FROM categories ORDER BY id ASC');
```
*   **`await`**: 等待資料庫完成查詢，拿到資料後才執行下一行。
*   **`db.query`**: 執行 SQL 指令。
*   **SQL 內容**: 從 `categories` 資料表選取所有資料，並依 `id` 遞增排序 (`ASC`)。

### 4. 成功與錯誤回應
```javascript
res.json(result.rows);
res.status(500).json({ error: err.message });
```
*   **`res.json(...)`**: 將資料包裝成 **JSON 格式** 送出，這是 API 最常用的格式。
*   **`res.status(500)`**: 如果出錯，回傳狀態碼 **500**（伺服器內部錯誤），並附上錯誤原因。
