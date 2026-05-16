const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
// 補上其餘兩個路由引入
const locationRoutes = require('./routes/locationRoutes');
const inventory_logsRoutes = require('./routes/inventory_logsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// 中間件
app.use(cors());
app.use(express.json()); // 讓後端能解析 JSON 格式的 Body

// 路由設定
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/inventory_logs', inventory_logsRoutes);

app.get('/', (req, res) => {
  res.send('WMS API 運行中');
});

app.listen(PORT, () => {
  console.log(`伺服器啟動於 http://localhost:${PORT}`);
});



