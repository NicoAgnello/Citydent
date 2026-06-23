require('dotenv').config({ path: './config/.env' });
const http = require('http');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { clerkMiddleware } = require('@clerk/express');
const { Server } = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const mongoConnect = require('./config/mongoConnet');
const authRoutes = require('./routes/auth.routes');
const incidentRoutes = require('./routes/incident.routes');
const categoryRoutes = require('./routes/category.routes');
const statusRoutes = require('./routes/status.routes');
const userRoutes = require('./routes/user.routes');
const externalRoutes = require('./routes/external.routes');
const notificationRoutes = require('./routes/notification.routes');
const neighborhoodRoutes = require('./routes/neighborhood.routes');
const { setupSocket } = require('./services/socket.service');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);


mongoConnect();

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
});

setupSocket(io);

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(clerkMiddleware());

app.get('/', (req, res) => {
  res.json({ message: 'API CityDent corriendo' });
});

// Documentación interactiva de la API (Swagger UI)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/statuses', statusRoutes);
app.use('/api/users', userRoutes);
app.use('/api/external', externalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/neighborhoods', neighborhoodRoutes);

// 404 — ninguna ruta coincidió
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

// Manejador de errores global — última red de seguridad
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('🔴 Error no manejado:', err);
  const status = err.status || 500;
  const message = status === 500 ? 'Error interno del servidor.' : err.message;
  res.status(status).json({ error: message, ...(err.details && { details: err.details }) });
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = { io };
