const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { verifyRole } = require('../middlewares/verifyRole');
const onlyActive = require('../middlewares/onlyActive');
const { getAll, create, update, toggle } = require('../controllers/category.controller');

router.get('/', authMiddleware, verifyRole('admin', 'superAdmin'), getAll);
router.get('/active', authMiddleware, onlyActive, getAll);
router.post('/', authMiddleware, verifyRole('admin', 'superAdmin'), create);
router.patch('/:id', authMiddleware, verifyRole('admin', 'superAdmin'), update);
router.patch('/:id/toggle', authMiddleware, verifyRole('admin', 'superAdmin'), toggle);

module.exports = router;