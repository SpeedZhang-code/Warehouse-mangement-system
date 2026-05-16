## 🌐 環境建置與相依套件 (Environment & Dependencies)

本專案後端基於 Node.js 環境開發，透過結構化的設定檔與環境變數管理，確保開發環境與生產環境的安全性與彈性。

---

* **package.json**
  * **說明**：Node.js 專案的核心設定檔（Manifest File）。
  * **功能**：負責記錄專案的基本資訊（如名稱、版本、啟動腳本命令 `scripts`），並精準定義與管理專案內部所有引用的第三方相依套件與版本範圍。

* **"dependencies" (運行相依套件)**
  * **說明**：記錄應用程式在「生產環境（Production）」下正常運行所必須安裝的套件清單。
  * **核心套件清單**：
    * `express`：輕量級的 Node.js 網頁應用程式框架，用於建置 RESTful API 路由。
    * `knex`：靈活的 SQL 查詢建立器（Query Builder），負責以 JavaScript 語法操作資料庫。
    * `pg`：PostgreSQL 資料庫的節點驅動程式，讓 Knex 能夠與 Postgres 資料庫進行連線。
    * `cors`：跨來源資源共用（CORS）中間件，負責解鎖前後端分離架構下的跨網域請求限制。
    * `dotenv`：環境變數載入工具，負責將外部設定值安全地匯入至應用程式中。

* **.env (環境變數檔案)**
  * **說明**：專門用來存放私密或機密資訊的純文字設定檔。
  * **功能**：將機密資料（如：資料庫密碼、API 金鑰、伺服器連接埠 `PORT`）與主程式原始碼徹底分離。此檔案**絕對不能**上傳至 Git 版本控制系統（必須加入 `.gitignore`），以防原始碼外洩時造成資安漏洞。

* **require('dotenv').config()**
  * **說明**：啟動環境變數的初始化語法。
  * **運作機制**：在後端程式（如 `server_kenx.js`）的進入點最上方呼叫此函式。它會自動讀取同目錄下的 `.env` 檔案，並將內部定義的鍵值對（Key-Value Pairs）全部注入到 Node.js 全域物件 `process.env` 當中，讓後續的程式碼（如資料庫連線設定）可以透過 `process.env.DB_PASSWORD` 安全地存取。

<hr style="height: 5px; background-color: #000000; border: none;">

## 🚀 Express 應用程式與路由管理 (Express Application & Routing)

本專案後端採用 Express 框架，透過中間件（Middleware）與模組化路由（Routing）機制，建立起高效、安全且具備高擴充性的 RESTful API 服務。

---

* **app.use**
  * **說明**：Express 中用來註冊「中間件（Middleware）」的核心方法。
  * **運作機制**：當 HTTP 請求進入伺服器時，會依序通過由 `app.use` 註冊的函式。它可以用來外套全域功能（例如：解析 JSON 資料的 `express.json()`、跨域存取的 `cors()`），也可以針對特定路徑進行層層把關（如：權限驗證）。

* **app.use('/api/:tableName', (req, res, next) => {})**
  * **說明**：具備「動態參數」的萬用型路由中間件。
  * **運作機制**：
    * 網址中的 `:tableName` 是一個動態變數（路徑參數），可以匹配任何傳入的名稱（例如：`/api/inbound` 或 `/api/outbound`）。
    * 程式內部可以透過 `req.params.tableName` 完美捕捉該資料表名稱。
    * 這種設計極具擴充性，能將捕捉到的名稱傳遞給後續的通用 CRUD 邏輯，避免為每個資料表重複撰寫相同的 API 程式碼。

* **app.listen**
  * **說明**：負責正式啟動 Express 伺服器並與作業系統網路層對接的方法。
  * **功能**：指定伺服器要在哪一個特定的網路連接埠（Port，例如：`3000`）進行監聽。一旦啟動成功，便會持續等待並接收來自前端（Vite / fetch）發送過來的網路請求。

* **express.Router**
  * **說明**：Express 提供的模組化、隔離式路由處理容器（俗稱路由懶人包）。
  * **功能**：當專案規模變大時，將所有 API 擠在 `server.js` 會變得難以維護。透過 `express.Router()` 可以將特定模組（如：使用者管理、庫存管理）的路由單獨抽離到獨立檔案中，最後再併入主程式，達成程式碼結構「解耦（Decoupling）」的目的。

* **router.get / router.post / router.put / router.delete**
  * **說明**：專門用來監聽特定 HTTP 動詞（HTTP Methods）的路由監聽器。
  * **對應功能 (CRUD)**：
    * `router.get`：對應 **Read (讀取)**，用於獲取資料（如：查詢庫存清單）。
    * `router.post`：對應 **Create (新增)**，用於新建資料（如：提交入庫單）。
    * `router.put`：對應 **Update (更新)**，用於修改現有資料（如：更改空位狀態）。
    * `router.delete`：對應 **Delete (刪除)**，用於移除指定資料（如：刪除錯誤紀錄）。

<hr style="height: 5px; background-color: #000000; border: none;">

## 🔁 請求與回應處理 (Request & Response)

在 Express 路由內部，處理程序負責解析前端發送過來的請求（Request）資料，並在運算結束後回傳對應的結果與 HTTP 狀態（Response）給前端。

---

* **parseInt**
  * **說明**：JavaScript 內建的字串轉整數解析函式。
  * **應用場景**：前端透過網址傳遞的參數（例如：`/api/users/:id` 中的 `req.params.id`）在預設情況下皆為「字串（String）」型態。為了避免在資料庫（PostgreSQL）中進行比對時發生型態錯誤，通常會先使用 `parseInt(id, 10)` 將其強制轉換為「十進位整數」，以確保資料庫查詢與比對時的精準度。

* **res.status**
  * **說明**：用於設定 HTTP 回應狀態碼（HTTP Status Code）的方法。
  * **常見狀態碼**：
    * `200` (OK)：請求成功，順利回傳資料。
    * `201` (Created)：新增成功（常伴隨 POST 請求）。
    * `400` (Bad Request)：前端輸入的資料有誤（參數缺失或格式不符）。
    * `404` (Not Found)：找不到請求的資源（如：資料表中查無此 ID）。
    * `500` (Internal Server Error)：後端伺服器或資料庫執行發生未預期的異常錯誤。

* **res.json**
  * **說明**：將資料轉換為 JSON 格式並回傳給用戶端的連線終結方法。
  * **運作機制**：它是 Express 最常用的回應管道。它會自動將傳入的 JavaScript 物件或陣列轉換為符合標準的 JSON 格式字串，同時自動在 HTTP 標頭（Headers）中加入 `Content-Type: application/json`，並隨即結束該次網路請求（結束與前端的連線）。

<hr style="height: 5px; background-color: #000000; border: none;">

## 🗄️ 資料庫連線配置 (Database Connection)

本專案後端採用關聯式資料庫，並透過查詢建立器（Query Builder）建立高效且安全的資料庫連線與操作管道。

---

* **PostgreSQL (Postgres)**
  * **說明**：本專案所採用的開源、企業級關聯式資料庫管理系統（RDBMS）。
  * **特色**：以強大的資料完整性（ACID 特性）、豐富的資料型態支援以及優異的併發處理能力著稱。在本專案中負責結構化儲存庫存、入出庫紀錄與空位狀態等核心商務資料。

* **"pg" (Node-Postgres)**
  * **說明**：PostgreSQL 官方認證的 Node.js 非阻塞（Non-blocking）底層驅動程式（Driver）。
  * **功能**：扮演 Node.js 執行環境與 PostgreSQL 資料庫伺服器之間的橋樑，負責處理底層的網路 Socket 連線、協定通訊，並將 JavaScript 資料型態與資料庫欄位型態進行互相轉換。

* **const knex = require('knex')**
  * **說明**：引入 Knex.js 核心套件的語法。
  * **核心價值**：Knex 是一個針對 JavaScript 設計的「SQL 查詢建立器（Query Builder）」。它允許開發者使用乾淨的 JavaScript 鏈式語法（例如：`knex('users').where('id', 1).select()`）來操作資料庫，免去手寫原生 SQL 字串的麻煩，並具備優異的預防 SQL 注入（SQL Injection）安全機制。

* **pool (資料庫連線池)**
  * **說明**：由 `pg` 與 `knex` 在底層共同維護的高效能連線管理技術。
  * **運作機制**：在傳統架構中，每次前端發送請求，後端都要跟資料庫重新進行「握手連線」，這會消耗大量的 CPU 與網路資源。
  * **核心優勢**：連線池會在程式啟動時，預先建立好數條保持啟用狀態的連線（Connections）。當有 API 請求進來時，系統會直接從池中「借用」一條現成連線，查詢完畢後立即「歸還」池中。這種設計免除了反覆建立與摧毀連線的效能消耗，大幅提升系統在高併發環境下的回應速度。

<hr style="height: 5px; background-color: #000000; border: none;">

## 🧠 查詢建立器與業務邏輯 (Query Builder & Logic)

本專案後端利用 Knex.js 建立流暢的鏈式查詢，並結合現代 JavaScript 的非同步錯誤處理機制，確保資料庫操作的穩定性與資料正確性。

---

* **try...catch**
  * **說明**：JavaScript 的標準異常（錯誤）處理機制。
  * **核心功能**：資料庫操作屬於外部連線，極易因網路波動、語法錯誤或違反資料庫約束（如主鍵重複）而發生異常。將資料庫操作包覆在 `try` 區塊中，一旦出錯便會立即跳轉至 `catch` 區塊，不僅能防止後端伺服器因此崩潰（Crash），還能讓系統優雅地透過 `res.status(500)` 回傳錯誤訊息給前端。

* **await / async**
  * **說明**：現代 JavaScript 處理非同步流程的語法糖。
  * **運作機制**：凡是涉及資料庫查詢的路由函式，都必須宣告為 `async` 函式。在呼叫 Knex 查詢語句時加上 `await` 關鍵字，程式便會以「非阻塞」的方式，暫停等待資料庫回傳結果，收到資料後再繼續執行下一行程式碼，使非同步程式碼讀起來就像同步程式碼一樣直觀。

<hr style="height: 5px; background-color: #000000; border: none;">

### 🔍 基礎與進階查詢鏈 (Knex Query Chain)

透過呼叫資料庫執行個體（如 `db('tableName')`），可以自由組合以下鏈式方法來動態生成高效的 SQL 語句：

* **.select()**
  * **功能**：指定要從資料表中篩選並讀取的欄位（例如：`.select('id', 'name')`）。若留空則預設為選取所有欄位（`*`）。

* **.where()**
  * **功能**：設定資料篩選的條件。常用於精準定位特定資料（例如：`.where('id', userId)`）或進行範圍過濾。

* **.join()**
  * **功能**：進行跨資料表的關聯查詢（SQL JOIN）。透過指定外部鍵（Foreign Key）將多張關聯表（如：出庫單與商品表）合併，一次撈取完整的複合式資料。

* **.groupBy()**
  * **功能**：將查詢結果依照指定的欄位進行「群組化」分組，通常與聚合函數（如加總、平均）搭配使用。

* **.sum()**
  * **功能**：對指定欄位的數值進行加總計算（聚合函數）。在專案中常用於計算特定商品的總庫存量或出庫總數。

* **.orderBy()**
  * **功能**：設定回傳資料的排序規則。可以指定依據時間、ID 或金額進行升冪（`asc`）或降冪（`desc`）排列，確保前端分頁或列表呈現的順序符合預期。

* **.first()**
  * **功能**：限制查詢結果僅取出符合條件的「第一筆」資料，並將其以單一「JavaScript 物件（Object）」的形式回傳，而非預設的物件陣列（Array），常用於依據唯一 ID 查詢單一資料的場景。

* **.update()**
  * **功能**：執行資料更新操作（SQL UPDATE）。傳入一個包含新欄位數值的物件，用來修改資料庫中現有的記錄，常搭配 `.where()` 鎖定特定範圍以防誤更動全表。

<hr style="height: 5px; background-color: #000000; border: none;">

## 🔒 資料庫交易機制 (Database Transaction)

本專案在處理涉及多張資料表的連續寫入或敏感商務邏輯（如：入庫時同時更新商品庫存與寫入異動紀錄）時，採用嚴格的資料庫交易機制，以確保資料的「原子性（Atomicity）」與最終一致性。

---

* **db.transaction**
  * **說明**：啟動資料庫交易（Transaction）的核心機制。
  * **核心價值**：在處理複合式商務邏輯時，若某個步驟成功、另一個步驟卻失敗，將會導致資料庫出現嚴重的不一致或髒資料（例如：扣了庫存，卻沒有產生出庫單）。透過 `db.transaction` 可以建立一個安全的交易範圍。在這個範圍內的「一連串資料庫操作」，必須要**全部成功**才會正式寫入資料庫（Commit）；只要其中任何一個步驟出錯，整個交易就會立即觸發**完全回滾（Rollback）**，讓資料恢復到完全沒動過的初始狀態。

* **trx('inventory_logs').insert({})**
  * **說明**：在特定交易範圍（常命名為 `trx`）內執行的資料插入操作（SQL INSERT）。
  * **運作機制**：
    * 必須呼叫交易物件 `trx` 而非全域的 `db` 來操作資料表（例如：向 `inventory_logs` 庫存異動紀錄表插入新資料）。
    * 當執行 `trx(...).insert()` 時，資料庫只會將資料寫入暫存的交易狀態。
    * 唯有整個路由邏輯順利執行完畢並呼叫 `await trx.commit()` 後，這筆新插入的庫存紀錄才會真正被外界看見，藉此阻絕多個程序同時操作時可能產生的併發衝突。

