const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { verifyRole } = require('../middlewares/verifyRole');
const { fetchUsers, fetchUserById, fetchMyProfile, patchProfile, createUser, patchUserProfile, fetchRoles, updateRole, updateBan } = require('../controllers/user.controller');

router.get('/me',              authMiddleware, verifyRole('user', 'admin', 'superAdmin'), fetchMyProfile);
router.patch('/me',            authMiddleware, verifyRole('user', 'admin', 'superAdmin'), patchProfile);
router.get('/',                authMiddleware, verifyRole('superAdmin'), fetchUsers);
router.post('/',               authMiddleware, verifyRole('superAdmin'), createUser);
router.get('/roles',           authMiddleware, verifyRole('superAdmin'), fetchRoles);
router.get('/:id',             authMiddleware, verifyRole('superAdmin'), fetchUserById);
router.patch('/:id/profile',   authMiddleware, verifyRole('superAdmin'), patchUserProfile);
router.patch('/:id/role',      authMiddleware, verifyRole('superAdmin'), updateRole);
router.patch('/:id/ban',       authMiddleware, verifyRole('superAdmin'), updateBan);

module.exports = router;