const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { verifyRole } = require('../middlewares/verifyRole');
const { aiIncidentValidation } = require('../middlewares/aiIncidentValidation');
const middleClaudinary = require('../middlewares/claudinary');
const { create, getMyIncidents, getAll, getHistory, getGroupHistory, getGroupIncidents, updateStatus, updateCategory, updatePriority, cancel, syncAIFallbacks, countAIFallbacks } = require('../controllers/incident.controller');
const { validateUserReputation } = require('../middlewares/validateUserReputation');
const { validateLocation } = require('../middlewares/validateLocation');
const { requireProfileComplete } = require('../middlewares/requireProfileComplete');

router.post('/', authMiddleware, verifyRole('user', 'admin', 'superAdmin'), requireProfileComplete, validateUserReputation, middleClaudinary, validateLocation, aiIncidentValidation, create);
router.get('/', authMiddleware, verifyRole('admin', 'superAdmin'), getAll);
router.get('/my-incidents', authMiddleware, verifyRole('user', 'admin', 'superAdmin'), requireProfileComplete, getMyIncidents);
router.get('/:id/history', authMiddleware, verifyRole('user', 'admin', 'superAdmin'), getHistory);
router.get('/:id/group-history', authMiddleware, verifyRole('admin', 'superAdmin'), getGroupHistory);
router.get('/:id/incidents', authMiddleware, verifyRole('admin', 'superAdmin'), getGroupIncidents);
router.patch('/:id/status', authMiddleware, verifyRole('admin', 'superAdmin'), updateStatus);
router.patch('/:id/category', authMiddleware, verifyRole('admin', 'superAdmin'), updateCategory);
router.patch('/:id/priority', authMiddleware, verifyRole('admin', 'superAdmin'), updatePriority);
router.patch('/:id/cancel', authMiddleware, verifyRole('user', 'admin', 'superAdmin'), requireProfileComplete, cancel);
router.get('/sync-ai/count', authMiddleware, verifyRole('admin', 'superAdmin'), countAIFallbacks);
router.post('/sync-ai', authMiddleware, verifyRole('admin', 'superAdmin'), syncAIFallbacks);

module.exports = router;
