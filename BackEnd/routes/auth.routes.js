const express = require('express');
const router = express.Router();
const verifyToken = require('../middelwares/verifyToken');
const { registerUser } = require('../controllers/auth.controller.js');
// El frontend manda el token + datos del usuario

router.post('/login',verifyToken,registerUser);

module.exports = router;