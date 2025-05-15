const express = require('express');
const cors = require('cors');
const configRoutes = require('./routes/config');
const responseHandler = require('./middleware/responseHandler');
const auth = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

// 应用统一响应格式中间件
app.use(responseHandler());

app.use('config', configRoutes);

// Product Category Routes
const productCategoryRoutes = require('./routes/productCategoryRoutes');
app.use('/api/admin/product-categories', auth, productCategoryRoutes);

// Product Routes
const productRoutes = require('./routes/productRoutes');
app.use('/api/admin/products', productRoutes);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});