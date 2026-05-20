const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ error: 'No autorizado, sesión no encontrada.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = { sub: decoded.sub };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Sesión inválida o expirada.' });
  }
};

module.exports = authMiddleware;