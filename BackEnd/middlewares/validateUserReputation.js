const Incident = require('../models/incident');

const validateUserReputation = async (req, res, next) => {
  try {
    const userId = req.dbUser._id;

    const dudososCount = await Incident.countDocuments({
      user: userId,
      is_dubious: true,
      is_cancelled: { $ne: true }
    });

    if (dudososCount >= 5) {
      return res.status(200).json({
        success: false,
        message: 'No es posible subir el incidente. Tenés muchos incidentes en revisión.'
      });
    }

    next();
  } catch (error) {
    console.error('Error en validateUserReputation:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

module.exports = { validateUserReputation };