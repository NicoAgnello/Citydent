const express = require('express');
const router = express.Router();

// Importación de controladores
const {
  createIncidentController,
  getAllIncidents,
  getIncidentById,
  updateIncidentStatus,
  deleteIncident
} = require('../controllers/incident.controller');

// Importación de middlewares
// Nota: Se utiliza la ortografía 'middelwares' para coincidir con tu estructura de carpetas
const verifyToken = require('../middelwares/verifyToken');
const verifyAdmin = require('../middelwares/verifyAdmin');

/**
 * RUTAS DE INCIDENTES
 * Prefijo: /api/incidents (configurado en app.js o index.js)
 */

// 1. Crear un incidente
// Solo usuarios autenticados. El frontend envía JSON con URLs de Cloudinary ya listas.
router.post('/', verifyToken, createIncidentController);

// 2. Obtener todos los incidentes
// Generalmente público para que los vecinos vean el mapa de situaciones.
router.get('/', getAllIncidents);

// 3. Obtener un incidente específico por ID
router.get('/:id', getIncidentById);

// 4. Actualizar el estado de un incidente (pendiente, en proceso, resuelto)
// Ruta protegida: requiere estar autenticado y tener rol de administrador.
router.patch('/:id/status', verifyToken, verifyAdmin, updateIncidentStatus);

// 5. Eliminar un incidente
// Ruta protegida: solo administradores pueden borrar reportes.
router.delete('/:id', verifyToken, verifyAdmin, deleteIncident);

module.exports = router;