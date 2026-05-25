const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { verifyRole } = require('../middlewares/verifyRole');
const { aiIncidentValidation } = require('../middlewares/aiIncidentValidation');
const middleClaudinary = require('../middlewares/claudinary')
const { create, getMyIncidents, getAll, updateStatus, updateCategory } = require('../controllers/incident.controller');

router.post('/', authMiddleware, verifyRole('user', 'admin', 'superAdmin'), middleClaudinary, aiIncidentValidation, create);
router.get('/my-incidents', authMiddleware, verifyRole('user', 'admin', 'superAdmin'), getMyIncidents);
router.get('/', authMiddleware, verifyRole('admin', 'superAdmin'), getAll);
router.patch('/:id/status', authMiddleware, verifyRole('admin', 'superAdmin'), updateStatus);
router.patch('/:id/category', authMiddleware, verifyRole('admin', 'superAdmin'), updateCategory);
module.exports = router;