const Status = require('../models/status');
const { analizarIncidenteIA } = require('../services/openai.service');

const aiIncidentValidation = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    const [pendienteStatus, dudosoStatus, rechazadoStatus] = await Promise.all([
      Status.findOne({ name: 'pendiente' }),
      Status.findOne({ name: 'dudoso' }),
      Status.findOne({ name: 'rechazado' })
    ]);

    if (!pendienteStatus || !dudosoStatus || !rechazadoStatus) {
      return res.status(500).json({ error: 'Faltan estados requeridos en el "registro maestro".' });
    }

    const evaluacionIA = await analizarIncidenteIA(title, description);

    if (evaluacionIA.estadoSugerido === 'rechazado') {
      return res.status(200).json({
        success: false,
        isEmergency: true,
        message: 'Este reporte describe una situación de emergencia médica o de seguridad vital. Por favor, comunícate de inmediato con el 100 (Bomberos), 101 (Policía) o 107 (Ambulancia). La plataforma no procesa urgencias en tiempo real.',
        justificacion: evaluacionIA.justificacion
      });
    }

    req.finalStatusId = evaluacionIA.estadoSugerido === 'dudoso' ? dudosoStatus._id : pendienteStatus._id;

    req.aiData = {
      prioridad: evaluacionIA.prioridadSugerida,
      categoriaSugerida: evaluacionIA.categoriaSugerida,
      justificacion: evaluacionIA.justificacion
    };

    next();
  } catch (error) {
    console.error('Error en aiIncidentValidation:', error);
    return res.status(500).json({ error: 'Error interno en el servidor al validar el incidente con Inteligencia Artificial.' });
  }
};

module.exports = { aiIncidentValidation };