const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { verifyRole } = require('../middlewares/verifyRole');
const { aiIncidentValidation } = require('../middlewares/aiIncidentValidation');
const middleClaudinary = require('../middlewares/claudinary');

// IMPORTANTE: Asegúrate de tener syncAIFallbacks exportado en tu controlador y sumarlo aquí
const { create, getMyIncidents, getAll, getHistory, getGroupHistory, getGroupIncidents, updateStatus, updateCategory, updatePriority, cancel, syncAIFallbacks, countAIFallbacks } = require('../controllers/incident.controller');

const { validateUserReputation } = require('../middlewares/validateUserReputation');
const { validateLocation } = require('../middlewares/validateLocation');
const { requireProfileComplete } = require('../middlewares/requireProfileComplete');

// ==========================================
// RUTA EXCLUSIVA PARA CRON-JOB.ORG
// ==========================================
/**
 * @openapi
 * /api/incidents/cron/sync-ai:
 *   post:
 *     summary: Reprocesar incidentes con IA fallida (cron)
 *     description: >
 *       Ruta exclusiva para el cron externo. Requiere el header
 *       `Authorization: Bearer <CRON_SECRET>`.
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Sincronización ejecutada }
 *       401: { description: Secreto de cron inválido }
 */
router.post('/cron/sync-ai', (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Verificamos que el cron envíe el secreto exacto configurado en Render
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Acceso denegado. Secreto de cron inválido.' });
  }
  next();
}, syncAIFallbacks);

// ==========================================
// RUTA MANUAL PARA EL BOTÓN DEL ADMIN
// ==========================================
/**
 * @openapi
 * /api/incidents/sync-ai:
 *   post:
 *     summary: Reprocesar incidentes con IA fallida (admin)
 *     tags: [Incidents]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Sincronización ejecutada }
 *       403: { description: Sin permisos }
 */
router.get('/sync-ai/count', authMiddleware, verifyRole('admin', 'superAdmin'), countAIFallbacks);
router.post('/sync-ai', authMiddleware, verifyRole('admin', 'superAdmin'), syncAIFallbacks);

// ==========================================
// RUTAS RESTANTES DE LA APP
// ==========================================
/**
 * @openapi
 * /api/incidents:
 *   post:
 *     summary: Crear un incidente
 *     description: >
 *       Crea un reporte. Pasa por validación de reputación, subida de fotos a
 *       Cloudinary, validación de ubicación y análisis de IA, que decide su
 *       agrupamiento automático (ver docs/arquitectura.md).
 *     tags: [Incidents]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, description, photos, location, category]
 *             properties:
 *               title:       { type: string, maxLength: 100 }
 *               description: { type: string, maxLength: 1000 }
 *               photos:
 *                 type: array
 *                 items: { type: string, format: binary }
 *               location:
 *                 $ref: '#/components/schemas/Location'
 *               category:    { type: string, description: 'ObjectId de la categoría' }
 *     responses:
 *       201:
 *         description: Incidente creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean }
 *                 incident: { $ref: '#/components/schemas/Incident' }
 *       400: { description: Datos inválidos }
 *       401: { description: No autenticado }
 *       403: { description: Sin permisos / reputación insuficiente }
 *   get:
 *     summary: Listar grupos de incidentes (admin)
 *     description: Devuelve todos los IncidentGroup con su representante poblado.
 *     tags: [Incidents]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lista de grupos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/IncidentGroup' }
 *       403: { description: Sin permisos }
 */
router.post('/', authMiddleware, verifyRole('user', 'admin', 'superAdmin'), requireProfileComplete, validateUserReputation, middleClaudinary, validateLocation, aiIncidentValidation, create);
router.get('/', authMiddleware, verifyRole('admin', 'superAdmin'), getAll);
/**
 * @openapi
 * /api/incidents/my-incidents:
 *   get:
 *     summary: Incidentes del usuario autenticado
 *     tags: [Incidents]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de incidentes del usuario }
 */
router.get('/my-incidents', authMiddleware, verifyRole('user', 'admin', 'superAdmin'), requireProfileComplete, getMyIncidents);
/**
 * @openapi
 * /api/incidents/{id}/history:
 *   get:
 *     summary: Historial de estados de un incidente
 *     tags: [Incidents]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Historial del incidente }
 *       404: { description: Incidente no encontrado }
 */
router.get('/:id/history', authMiddleware, verifyRole('user', 'admin', 'superAdmin'), getHistory);
/**
 * @openapi
 * /api/incidents/{id}/group-history:
 *   get:
 *     summary: Historial de estados de un grupo (admin)
 *     tags: [Incidents]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, description: 'ObjectId del grupo' }
 *     responses:
 *       200: { description: Historial del grupo }
 *       404: { description: Grupo no encontrado }
 */
router.get('/:id/group-history', authMiddleware, verifyRole('admin', 'superAdmin'), getGroupHistory);
/**
 * @openapi
 * /api/incidents/{id}/incidents:
 *   get:
 *     summary: Incidentes individuales de un grupo (admin)
 *     tags: [Incidents]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, description: 'ObjectId del grupo' }
 *     responses:
 *       200: { description: Incidentes del grupo }
 */
router.get('/:id/incidents', authMiddleware, verifyRole('admin', 'superAdmin'), getGroupIncidents);
/**
 * @openapi
 * /api/incidents/{id}/status:
 *   patch:
 *     summary: Cambiar estado de un grupo (admin)
 *     description: El estado se propaga a los incidentes del grupo que no estén cancelados.
 *     tags: [Incidents]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, description: 'ObjectId del grupo' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, description: 'ObjectId del nuevo estado' }
 *     responses:
 *       200: { description: Estado actualizado }
 *       403: { description: Sin permisos }
 */
router.patch('/:id/status', authMiddleware, verifyRole('admin', 'superAdmin'), updateStatus);
/**
 * @openapi
 * /api/incidents/{id}/category:
 *   patch:
 *     summary: Cambiar categoría de un grupo (admin)
 *     tags: [Incidents]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, description: 'ObjectId del grupo' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category]
 *             properties:
 *               category: { type: string, description: 'ObjectId de la categoría' }
 *     responses:
 *       200: { description: Categoría actualizada }
 */
router.patch('/:id/category', authMiddleware, verifyRole('admin', 'superAdmin'), updateCategory);
/**
 * @openapi
 * /api/incidents/{id}/priority:
 *   patch:
 *     summary: Cambiar prioridad de un grupo (admin)
 *     tags: [Incidents]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, description: 'ObjectId del grupo' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [priority]
 *             properties:
 *               priority: { type: integer, minimum: 0, maximum: 10 }
 *     responses:
 *       200: { description: Prioridad actualizada }
 */
router.patch('/:id/priority', authMiddleware, verifyRole('admin', 'superAdmin'), updatePriority);
/**
 * @openapi
 * /api/incidents/{id}/cancel:
 *   patch:
 *     summary: Cancelar un incidente propio
 *     description: >
 *       Marca el incidente como cancelado, baja la prioridad del grupo y reasigna
 *       el representante si correspondía.
 *     tags: [Incidents]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, description: 'ObjectId del incidente' }
 *     responses:
 *       200: { description: Incidente cancelado }
 *       404: { description: Incidente no encontrado }
 */
router.patch('/:id/cancel', authMiddleware, verifyRole('user', 'admin', 'superAdmin'), requireProfileComplete, cancel);

module.exports = router;
