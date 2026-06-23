const IncidentGroup = require('../models/incidentGroup');
const Status = require('../models/status');
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
    const { title, description, location } = req.body;

    let gruposCercanos = [];
    if (location?.lat && location?.lng) {
      const estadosFinales = await Status.find({
        name: { $in: ['rechazado', 'resuelto', 'cancelado'] }
      }).select('_id');

      const idsFinales = estadosFinales.map(s => s._id);

      const grupos = await IncidentGroup.find({
        status: { $nin: idsFinales }
      })
        .populate('representativeId', '_id title description location')
        .populate('incidents', 'title description');

      gruposCercanos = grupos.filter(grupo => {
        const rep = grupo.representativeId;
        if (!rep?.location?.lat || !rep?.location?.lng) return false;
        return calcularDistanciaMetros(
          location.lat, location.lng,
          rep.location.lat, rep.location.lng
        ) <= 20;
      }).map(grupo => ({
        _id: grupo._id,
        title: grupo.representativeId.title,
        description: grupo.representativeId.description,
        incidentes: grupo.incidents.map(inc => ({
          title: inc.title,
          description: inc.description
        }))
      }));
    }

    // Usamos let para poder mutar la evaluación en caso de falla de la API externa
    let evaluacionIA;
    
    try {
      evaluacionIA = await analizarIncidenteIA(title, description, gruposCercanos);
      
      req.aiData = {
        isAI: true,
        prioridad: evaluacionIA.prioridadSugerida ?? 0,
        categoriaSugerida: evaluacionIA.categoriaSugerida,
        justificacion: evaluacionIA.justificacion,
        esDuplicado: evaluacionIA.esDuplicado,
        idGrupoCandidato: evaluacionIA.idGrupoCandidato,
        confianza: evaluacionIA.confianza || 0.0,
        esRepresentanteMejor: evaluacionIA.esRepresentanteMejor || false,
        isEmergency: evaluacionIA.isEmergency || false,
        estadoSugerido: evaluacionIA.estadoSugerido
      };
    } catch (apiError) {
      // Si la API de Gemini falla, se ejecuta este bloque para no colapsar la app
      console.error("⚠️ Falló el análisis inmediato de la IA (Gemini Offline):", apiError);
      
      req.aiData = {
        isAI: false, // Indicamos al servicio que no fue procesado por IA
        prioridad: 0,
        categoriaSugerida: null,
        // Insertamos el mensaje limpio que solicitaste
        justificacion: "La IA no resolvió este incidente, utilice el botón Sincronizar IA",
        esDuplicado: false,
        idGrupoCandidato: null,
        confianza: 0.0,
        esRepresentanteMejor: false,
        isEmergency: false,
        estadoSugerido: null
      };
    }

    next();
  } catch (error) {
    console.error("Error crítico general en validación IA:", error);
    return res.status(500).json({ error: 'Error en servidor al validar incidente.' });
  }
};

module.exports = { aiIncidentValidation };
