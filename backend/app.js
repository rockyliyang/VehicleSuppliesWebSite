const express = require('express');
const cors = require('cors');
const configRoutes = require('./routes/config');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/config', configRoutes);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
}); 