const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { verifyRole } = require('../middlewares/verifyRole');
const { updateRole, updateBan } = require('../controllers/user.controller');

router.patch('/:id/role', authMiddleware, verifyRole('superAdmin'), updateRole);
router.patch('/:id/ban',  authMiddleware, verifyRole('superAdmin'), updateBan);

module.exports = router;