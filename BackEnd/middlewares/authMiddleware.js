const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ error: 'No autorizado, cookie no encontrada.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.CLERK_JWT_KEY, {
      algorithms: ['RS256']
    });
    req.auth = decoded;
    next();
  } catch (error) {
    console.error('JWT error:', error.message); // para ver qué error tira exactamente
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};

module.exports = authMiddleware; 

/* const authMiddleware = (req, res, next) => {
  req.auth = { sub: 'user_3D2caIJDAlcnNYsQtFyMlRp9RMV' }; // tu clerkId
  next();
};

module.exports = authMiddleware; */