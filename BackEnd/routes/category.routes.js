const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { verifyRole } = require('../middlewares/verifyRole');
const { getAll, create, remove } = require('../controllers/category.controller');

router.get('/', authMiddleware, getAll);
router.post('/', authMiddleware, verifyRole('admin', 'superAdmin'), create);
router.delete('/:id', authMiddleware, verifyRole('admin', 'superAdmin'), remove);

module.exports = router;