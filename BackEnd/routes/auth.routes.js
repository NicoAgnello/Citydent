const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');
const { registerUser } = require('../controllers/auth.controller.js');

router.post('/login', verifyToken, registerUser);

module.exports = router;