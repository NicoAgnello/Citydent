const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { verifyRole } = require('../middlewares/verifyRole');
const { externalAuth } = require('../middlewares/externalAuth');
const { requestOtp, getData } = require('../controllers/external.controller');

// superAdmin solicita el OTP desde la app
router.post('/request-otp', authMiddleware, verifyRole('superAdmin'), requestOtp);

// Power BI consume los datos con API Key + OTP
router.get('/data', externalAuth, getData);

module.exports = router;
