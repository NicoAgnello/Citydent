// Validacion de JWT enviado por clerk
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

// Este middleware validará el token JWT que el frontend (Clerk) envíe en el header Authorization
const verifyToken = ClerkExpressRequireAuth({
  onError: (err, req, res) => {
    console.error('Error de autenticación:', err.message);
    res.status(401).json({ error: 'No autorizado o token inválido' });
  }
});

module.exports = verifyToken;