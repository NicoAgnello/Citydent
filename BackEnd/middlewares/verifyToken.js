const { getAuth } = require('@clerk/express');
const jwt = require('jsonwebtoken');

const verifyTokenAndSetCookie = [
  // 1. Verifica el token de Clerk (solo en el login)
  (req, res, next) => {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado o token inválido' });
    }
    req.clerkUserId = userId;
    next();
  },

  // 2. Genera el JWT propio del back y lo guarda en cookie
  (req, res, next) => {
    const sessionToken = jwt.sign(
      { sub: req.clerkUserId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('auth_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 días
    });

    next();
  }
];

module.exports = verifyTokenAndSetCookie;