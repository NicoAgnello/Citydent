
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const verifyTokenAndSetCookie = [
  // 1. Primero valida el token con Clerk
  ClerkExpressRequireAuth({
    onError: (err, req, res) => {
      console.error('Error de autenticación:', err.message);
      res.status(401).json({ error: 'No autorizado o token inválido' });
    }
  }),

  // 2. Si pasó la validación, genera la cookie
  (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Saca el Bearer token

    res.cookie('auth_token', token, {
      httpOnly: true,      // No accesible desde JS del browser
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en prod
      sameSite: 'strict',  // Protección CSRF
      maxAge: 1000 * 60 * 60 * 24, // 1 día en ms
    });
    console.log(`paso por el middelware de verify`)
    next();
  }];
  module.exports = verifyTokenAndSetCookie;