// Rutas de autenticaion
const express = require('express');
const router = express.Router();
const { clerkWebhook } = require('../controllers/auth.controller');

// Importante: El webhook de Clerk necesita leer el body crudo (raw)
router.post(
  '/webhook', 
  express.raw({ type: 'application/json' }), 
  clerkWebhook
);

module.exports = router;