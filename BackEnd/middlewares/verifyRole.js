const User = require('../models/user');

const verifyRole = (...roles) => {
  return async (req, res, next) => {
    try {
      const clerkId = req.auth.sub;

      const dbUser = await User.findOne({ clerkId }).populate('role');
      if (!dbUser) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }

      if (!roles.includes(dbUser.role.name)) {
        return res.status(403).json({ error: 'No tenés permisos para realizar esta acción.' });
      }

      req.dbUser = dbUser;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Error interno del servidor.' });
    }
  };
};

module.exports = { verifyRole };