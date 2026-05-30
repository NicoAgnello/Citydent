const Incident = require('../models/incident');
const Status = require('../models/status');

const validateUserReputation = async (req, res, next) => {
  try {
    const userId = req.dbUser._id;

    const dudosoStatus = await Status.findOne({ name: 'dudoso' });

    if (!dudosoStatus) {
      return res.status(500).json({ error: 'Falta el estado requerido en el "registro maestro".' });
    }

    const dudososCount = await Incident.countDocuments({
      user: userId,
      status: dudosoStatus._id
    });

    if (dudososCount >= 5) {
      return res.status(200).json({
        success: false,
        message: 'No es posible subir el incidente. Tinenes muchos incidentes en revision'
        });
    }

    next();
  } catch (error) {
    console.error('Error en validateUserReputation:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

module.exports = { validateUserReputation };