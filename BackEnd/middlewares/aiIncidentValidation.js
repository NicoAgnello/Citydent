const Incident = require('../models/incident');
const Status = require('../models/status');
const User = require('../models/user');
const { analizarIncidenteIA } = require('../services/openai.service');

const calcularDistanciaMetros = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad; const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const aiIncidentValidation = async (req, res, next) => {
  try {
    const userId = req.dbUser._id;
    const { title, description, location } = req.body;

    const [pendienteStatus, dudosoStatus, rechazadoStatus, enProcesoStatus] = await Promise.all([
      Status.findOne({ name: 'pendiente' }), Status.findOne({ name: 'dudoso' }),
      Status.findOne({ name: 'rechazado' }), Status.findOne({ name: 'en_proceso' })
    ]);

    if (!pendienteStatus || !dudosoStatus || !rechazadoStatus) return res.status(500).json({ error: 'Faltan estados requeridos.' });

    const dudososCount = await Incident.countDocuments({ user: userId, status: dudosoStatus._id });
    if (dudososCount >= 5) {
      await User.findByIdAndUpdate(userId, { $set: { isBanned: true } });
      return res.status(403).json({ error: 'Tu cuenta ha sido suspendida.' });
    }

    let incidentesCercanos = [];
    if (location && location.lat && location.lng) {
      const statusActivos = [pendienteStatus._id];
      if (enProcesoStatus) statusActivos.push(enProcesoStatus._id);

      const activos = await Incident.find({ status: { $in: statusActivos } }).select('_id title description location');

      incidentesCercanos = activos.filter(inc => {
        if (!inc.location?.lat || !inc.location?.lng) return false;
        return calcularDistanciaMetros(location.lat, location.lng, inc.location.lat, inc.location.lng) <= 20;
      }).map(inc => ({ _id: inc._id, title: inc.title, description: inc.description }));
    }

    const evaluacionIA = await analizarIncidenteIA(title, description, incidentesCercanos);

    // NUEVA LÓGICA: En vez de bloquear, asignamos los booleanos y el estado
    let isEmergency = false;
    let finalStatusId = pendienteStatus._id;

    if (evaluacionIA.estadoSugerido === 'rechazado') {
      isEmergency = true;
      finalStatusId = rechazadoStatus._id;
    } else if (evaluacionIA.estadoSugerido === 'dudoso') {
      finalStatusId = dudosoStatus._id;
    }

    req.finalStatusId = finalStatusId;
    
    // Empaquetar TODOS los datos para que el servicio los guarde
    req.aiData = {
      isAI: true,
      prioridad: evaluacionIA.prioridadSugerida || 1,
      categoriaSugerida: evaluacionIA.categoriaSugerida,
      justificacion: evaluacionIA.justificacion,
      esDuplicado: evaluacionIA.esDuplicado,
      idIncidenteOriginal: evaluacionIA.idIncidenteOriginal,
      isEmergency: isEmergency // <-- Se lo pasamos al servicio
    };

    next();
  } catch (error) {
    console.error("Error validación IA:", error);
    return res.status(500).json({ error: 'Error en servidor al validar incidente.' });
  }
};

module.exports = { aiIncidentValidation };