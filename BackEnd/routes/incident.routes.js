const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { verifyRole } = require('../middlewares/verifyRole');
const { aiIncidentValidation } = require('../middlewares/aiIncidentValidation');
const middleClaudinary = require('../middlewares/claudinary');
const { create, getMyIncidents, getAll, getHistory, updateStatus, updateCategory } = require('../controllers/incident.controller');
const { validateUserReputation } = require('../middlewares/validateUserReputation');

router.post('/', authMiddleware, verifyRole('user', 'admin', 'superAdmin'), validateUserReputation,  aiIncidentValidation, middleClaudinary, create);
router.get('/', authMiddleware, verifyRole('admin', 'superAdmin'), getAll);
router.get('/my-incidents', authMiddleware, verifyRole('user', 'admin', 'superAdmin'), getMyIncidents);
router.get('/:id/history', authMiddleware, verifyRole('user', 'admin', 'superAdmin'), getHistory);
router.patch('/:id/status',   authMiddleware, verifyRole('admin', 'superAdmin'), updateStatus);
router.patch('/:id/category', authMiddleware, verifyRole('admin', 'superAdmin'), updateCategory);

module.exports = router;