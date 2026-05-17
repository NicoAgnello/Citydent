const { getAuth } = require('@clerk/express');

const verifyTokenAndSetCookie = [
  // 1. Verifica el JWT de Clerk
  (req, res, next) => {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ error: 'No autorizado o token inválido' });
    }

    next();
  },

  // 2. Crea la cookie con el token
  (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token no encontrado en el header' });
    }

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 // 1 día
    });

    console.log('Pasó por el middleware de verify');
    next();
  }
];

module.exports = verifyTokenAndSetCookie;