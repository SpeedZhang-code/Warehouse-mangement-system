## 📊 組件詳細對照表

本文件維護 `APP.jsx` 所引用的主要組件、檔案路徑與功能說明。

| 物件名稱 | 檔案路徑 | 功能說明 |
| :--- | :--- | :--- |
| **Dashboard** | `./component/dashboard.jsx` | 視覺化儀表板 |
| **UniversalCRUD** | `./component/crud.jsx` | 資料增刪管理 |
| **InboundManager2** | `./component/inbound2.jsx` | 入庫管理 |
| **Manager** | `./component/Manager.jsx` | 庫存管理 |
| **OutboundManager** | `./component/outbound.jsx` | 出貨管理 |
| **AnalyzePage** | `./component/analyze.jsx` | 報表分析 |

<hr style="height: 5px; background-color: #000000; border: none;">

## 📦 核心框架與生態系 (Framework & Ecosystem)

本專案採用現代前端主流的開發工具與響應式框架，建立高效能的單頁應用程式（SPA）。

* **Vite**
  * **說明**：前端建置工具（Build Tool）。利用瀏覽器原生 ES Modules 特性，提供極快的熱模組替換（HMR）與開發啟動速度，並在生產環境使用 Rollup 進行高效能打包。

---

* **React**
  * **說明**：由 Meta 開發的宣告式、高效能 JavaScript 函式庫，專注於建立使用者介面（UI）。核心採用組件化（Component-based）開發與虛擬 DOM（Virtual DOM）技術，大幅提升畫面渲染效率與程式碼複用性。

* **ReactDOM**
  * **說明**：React 的瀏覽器 DOM 渲染器，專門負責將 React 元件轉換並渲染至實際的網頁節點上。
  * **程式進入點**：`ReactDOM.createRoot(document.getElementById('root')).render`
    * **運作機制**：這是 React 18+ 的新一代初始化方法。它先透過 `createRoot` 指定 HTML 中的 `<div id="root"></div>` 作為整個應用的掛載根節點，接著呼叫 `.render()` 將 React 組件樹正式注入並渲染至瀏覽器畫面上。

<hr style="height: 5px; background-color: #000000; border: none;">

## 🎨 介面與圖表套件 (UI & Visualization)

本專案整合企業級組件庫與強大的數據視覺化引擎，打造直觀、美觀且高互動性的使用者介面。

* **@ant-design / antd**
  * **說明**：由阿里巴巴團隊開發的企業級 UI 設計語言與 React 元件庫（Ant Design）。
  * **特色**：
    * 提供豐富的開箱即用組件（如表格、表單、導覽列、彈窗等）。
    * 內建高質感的設計規範，大幅縮短前端介面刻劃與適應性版面的開發時間。
    * 支援完整的主題客製化（Design Tokens）與國際化設定。

---

* **echarts (Apache ECharts)**
  * **說明**：由 Apache 基金會維護的開源非同步資料視覺化圖表庫。
  * **特色**：
    * 具備極佳的渲染效能，能流暢處理大數據量的圖表展現。
    * 提供豐富的圖表類型（折線圖、柱狀圖、圓餅圖、雷達圖及地圖等）。
    * 支援高度自由的客製化設定、動態數據更新與豐富的滑鼠互動特效。

<hr style="height: 5px; background-color: #000000; border: none;">

## 🧮 JavaScript 核心語法 (JavaScript Core)

本專案運用現代 JavaScript (ES6+) 的核心特性，處理高效的資料結構操作、非同步流與狀態更新。

* **Object Destructuring & Spread Operator (解構賦值與展開運算子)**
  * **說明**：
    * **解構賦值**：允許從物件或陣列中快速提取屬性，直接賦值給獨立變數，大幅減少重複程式碼（例如：`const { name, value } = e.target`）。
    * **展開運算子 (`...`)**：用於複製、合併物件或陣列。在 React 狀態更新中至關重要，可確保資料的「不可變性（Immutability）」，避免直接修改原始狀態。

* **Promise**
  * **說明**：JavaScript 處理非同步操作（Asynchronous Operations）的核心物件。它代表一個尚未完成但預期未來會結束的操作，共有三種狀態：等待中（Pending）、已成功（Fulfilled）、已失敗（Rejected）。常與 `fetch` 或 `async/await` 搭配使用，用來優雅地處理 API 請求與錯誤。

* **Date**
  * **說明**：JavaScript 內建的時間日期處理物件。用於擷取系統當前時間、格式化日期戳記（如轉換為 `YYYY-MM-DD` 格式），並廣泛應用於入出庫管理、報表篩選與時間戳記的記錄。

---

* **Callback Function (回呼函式)**
  * **說明**：將一個函式作為參數傳遞給另一個函式，並在特定事件觸發或特定程序完成後才被執行。常用於事件監聽（如點擊事件）、陣列處理（如 `.map()`、`.filter()`）以及非同步流程控制。

* **setFormData((prev) => { ... }) (函數式狀態更新)**
  * **說明**：
    * **運作機制**：這是 React 中 `useState` 的進階用法，向狀態更新器傳入一個回呼函式。
    * **核心優勢**：該回呼函式會自動接收到「最新、最即時的舊狀態（`prev`）」。在處理表單多欄位輸入時，透過 `return { ...prev, [name]: value }` 可以安全地保留其他欄位數值，並精準更新當前異動的欄位，徹底避免因 React 非同步渲染而導致的資料覆蓋問題。

<hr style="height: 5px; background-color: #000000; border: none;">

## 🎣 React 核心 Hook (React Hooks)

本專案利用 React Hook 函數式元件特性，優雅地管理組件內部的生命週期與資料狀態。

* **useState**
  * **說明**：React 最基礎且核心的狀態管理 Hook。
  * **功能**：允許在函數式元件中宣告與追蹤內部狀態變數。當透過它提供的更新函式（如 `setFormData`）修改數值時，React 會自動觸發元件重新渲染（Re-render），確保使用者介面（UI）與底層資料即時同步。

* **useEffect**
  * **說明**：專門用來處理元件「副作用（Side Effects）」的 Hook。
  * **功能**：用於處理與 UI 渲染無關的操作，最常見的應用場景包括：在頁面初始化時透過 `fetch` 向後端請求 API 資料、手動操作瀏覽器 DOM、設定或清除定時器等。透過傳入不同的「相依性陣列（Dependency Array）」，可以精準控制這些副作用程式碼要在什麼時機點被執行。

<hr style="height: 5px; background-color: #000000; border: none;">

## 📑 表單與狀態處理 (Form & State Management)

本專案透過結構化的事件監聽與狀態變更方法，實現前端表單資料的即時雙向綁定與後端 API 的資料互動。

* **fetch**
  * **說明**：瀏覽器內建的原生 Web API，用於發送網路請求（HTTP Request）。專案中主要配合 `useEffect` 或提交事件，以非同步（Asynchronous）方式與後端伺服器進行通訊，執行資料的取得（GET）或傳送（POST/PUT/DELETE）。

---

* **handleChange**
  * **說明**：自訂的輸入欄位監聽函式（Event Handler）。當使用者在表單輸入框（Input/Select）輸入資料時，該函式會即時捕捉變更事件（`e.target`），並將使用者輸入的最新數值同步更新至狀態（State）中，達成資料的雙向綁定。

* **handleSubmit**
  * **說明**：自訂的表單提交處理函式。當使用者點擊提交按鈕時觸發，通常會在函式內部呼叫 `e.preventDefault()` 來阻止瀏覽器的預設重新整理行為，接著對表單欄位進行前端驗證，最終透過 `fetch` 將完整資料發送給後端 API。

<hr style="height: 5px; background-color: #000000; border: none;">

### ⚙️ 狀態變更方法 (State Setters)

由 `useState` 解構出來的專用更新函式，負責精準控制畫面的重新渲染（Re-render）。

* **setMessage**
  * **說明**：用於管理與變更系統提示訊息（例如：成功提示、錯誤警告、連線失敗等）。通常配合 UI 組件（如 Ant Design 的 Message 或是 Alert），在 API 請求完成後將處理結果即時回饋給使用者。

* **setFormData**
  * **說明**：負責維護整張表單的資料狀態物件（Object State）。透過集中管理所有輸入欄位的數值，確保在提交（`handleSubmit`）時能一次拿取最新且完整的欄位結構。

<hr style="height: 5px; background-color: #000000; border: none;">

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
