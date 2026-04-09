const express = require('express');
const cors = require('cors');
require('dotenv').config();

const transactionRoutes = require('./routes/transactions');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.json({ status: 'RailLoad Pro API running' });
});

app.use('/api', transactionRoutes);

app.listen(PORT, () => {
  console.log(`RailLoad Pro API running on port ${PORT}`);
});