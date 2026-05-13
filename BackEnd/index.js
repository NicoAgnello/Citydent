require('dotenv').config({ path: './config/.env' });
const express = require('express');
const cors = require('cors');
const mongoConnect = require('./config/mongoConnet');
const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 3000;

mongoConnect();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

// Parsear body JSON
app.use(express.json());

// Rutas
app.use('/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});