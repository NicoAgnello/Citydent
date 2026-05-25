const Incident = require('../models/incident');
const Status = require('../models/status');
const { verificarCoherenciaIncidente } = require('../services/openai.service');

const aiIncidentValidation = async (req, res, next) => {
  try {
    const userId = req.dbUser._id;
    const { title, description } = req.body;

    // 1. Buscar los estados en el "registro maestro"
    const [defaultStatus, dudosoStatus] = await Promise.all([
      Status.findOne({ name: 'pendiente' }),
      Status.findOne({ name: 'dudoso' })
    ]);

    if (!defaultStatus || !dudosoStatus) {
      return res.status(500).json({ error: 'Los estados requeridos no se encontraron en el "registro maestro".' });
    }

    // 2. Validar límite de incidentes dudosos
    const dudososCount = await Incident.countDocuments({
      user: userId,
      status: dudosoStatus._id
    });

    if (dudososCount >= 5) {
      // Bloqueamos la petición respondiendo con 200
      return res.status(200).json({
        success: false,
        message: 'No es posible subir el incidente. Tienes demasiados reportes dudosos pendientes de revisión.'
      });
    }

    // 3. Validar coherencia con IA
    const evaluacionIA = await verificarCoherenciaIncidente(title, description);

    // 4. Inyectar el ID del estado final en el objeto req
    req.finalStatusId = evaluacionIA.coherente ? defaultStatus._id : dudosoStatus._id;
    
    // Pasar el control al siguiente middleware o controlador
    next();
  } catch (error) {
    console.error("Error en el middleware de validación IA:", error);
    return res.status(500).json({ error: 'Error interno al validar el incidente con IA.' });
  }
};

module.exports = { aiIncidentValidation };