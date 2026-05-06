require('dotenv').config({ path: './config/.env' });
const express = require('express');
const mongoConnect = require('./config/mongoConnet'); 
const app = express();
const PORT = process.env.PORT || 3000;

mongoConnect();

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});