const express = require('express');
const cors = require('cors');
const app = express();

// 允許來自 Vite (5173) 的請求
// app.use(cors({
//     origin: 'http://localhost:5173',
//     methods: ['GET', 'POST', 'PUT', 'DELETE'],
//     credentials: true
// }));
app.use(cors()); //  允許跨域請求
app.use(express.json());

// --- 引入特殊邏輯路由 ---
// const inboundApi = require('./routes/inbound_api');
const inboundApi2 = require('./routes/inbound_api2')

const outboundApi = require('./routes/outbound_api'); 

const ManagerApi = require('./routes/Manager')

const AnalyzeApi = require('./routes/analyze')

const dashboard = require('./routes/dashboard')

// --- 掛載路由 (特殊邏輯務必放在通用路由之前) ---
app.use('/api/inbound', inboundApi2);
app.use('/api/outbound', outboundApi); 
app.use('/api/manager', ManagerApi)
app.use('/api/analyze', AnalyzeApi)
app.use('/api/dashboard',dashboard)

// --- 通用 CRUD 路由 ---
const createCrudRouter = require('./routes/crudFactory');
const routerCache = {};

app.use('/api/:tableName', (req, res, next) => {
    const { tableName } = req.params;
    
    // 但為了保險，可以在這裡做個排除檢查，或者維持現狀（因為前面沒對上才會到這）。
    if (!routerCache[tableName]) {
        routerCache[tableName] = createCrudRouter(tableName);
    }
    return routerCache[tableName](req, res, next);
});

app.listen(5000, () => console.log('🚀 Server is running on port 5000'));