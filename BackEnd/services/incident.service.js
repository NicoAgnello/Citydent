const Incident = require('../models/incident');
const IncidentGroup = require('../models/incidentGroup');
const Status = require('../models/status');
const mongoose = require('mongoose');

const CONFIANZA_UMBRAL = 0.85;

// ==========================================
// VALIDACIONES
// ==========================================

const validateIncidentData = (data) => {
  const errors = [];

  if (!data.title || typeof data.title !== 'string') {
    errors.push('El título es obligatorio y debe ser un texto.');
  } else if (data.title.trim().length === 0) {
    errors.push('El título no puede estar vacío o contener solo espacios.');
  } else if (data.title.trim().length > 100) {
    errors.push('El título no puede exceder los 100 caracteres.');
  }

  if (!data.description || typeof data.description !== 'string') {
    errors.push('La descripción es obligatoria y debe ser un texto.');
  } else if (data.description.trim().length === 0) {
    errors.push('La descripción no puede estar vacía o contener solo espacios.');
  } else if (data.description.trim().length > 1000) {
    errors.push('La descripción no puede exceder los 1000 caracteres.');
  }

  if (!data.category) {
    errors.push('La categoría es obligatoria.');
  } else if (!mongoose.Types.ObjectId.isValid(data.category)) {
    errors.push('La categoría enviada no es válida.');
  }

  if (!Array.isArray(data.photos) || data.photos.length < 1 || data.photos.length > 3) {
    errors.push('Se requiere entre 1 y 3 fotos.');
  }

  if (!data.location?.lat || !data.location?.lng) {
    errors.push('La ubicación es obligatoria.');
  }

  return { isValid: errors.length === 0, errors };
};

// ==========================================
// HELPER: puntaje para elegir representante
// ==========================================

const calcularScoreRepresentante = (incident) => {
  const largoTitulo = incident.title?.trim().length || 0;
  const largoDescripcion = incident.description?.trim().length || 0;
  return (largoTitulo * 0.4) + (largoDescripcion * 0.6);
};

// ==========================================
// CREACIÓN
// ==========================================

const createIncident = async (incidentData, userId, aiData, userRole = 'user') => {
  const validation = validateIncidentData(incidentData);
  if (!validation.isValid) {
    const error = new Error('Error en los datos del formulario');
    error.status = 400;
    error.details = validation.errors;
    throw error;
  }

  const [pendienteStatus, rechazadoStatus] = await Promise.all([
    Status.findOne({ name: 'pendiente' }),
    Status.findOne({ name: 'rechazado' })
  ]);

  if (!pendienteStatus || !rechazadoStatus) {
    const error = new Error('Faltan estados requeridos en el sistema.');
    error.status = 500;
    throw error;
  }

  const isDubious = aiData?.estadoSugerido === 'dudoso';
  const isRechazado = aiData?.estadoSugerido === 'rechazado';
  const incidentStatusId = isRechazado ? rechazadoStatus._id : pendienteStatus._id;
  const grupoStatusId = isRechazado ? rechazadoStatus._id : pendienteStatus._id;
  const changedBy = process.env.AI_USER_ID;
  const source = 'ai';

  const newIncident = new Incident({
    title: incidentData.title.trim(),
    description: incidentData.description.trim(),
    status: incidentStatusId,
    category: incidentData.category,
    location: incidentData.location,
    photos: incidentData.photos,
    user: userId,
    ai_justification: aiData?.justificacion || 'No justificado',
    ai_suggested_category: aiData?.categoriaSugerida || 'No sugerida',
    is_emergency: aiData?.isEmergency || false,
    is_dubious: isDubious,
    statusHistory: [{ status: incidentStatusId, changedBy, source }]
  });

  const puedeAgruparse =
    aiData?.esDuplicado &&
    aiData?.idGrupoCandidato &&
    mongoose.Types.ObjectId.isValid(aiData.idGrupoCandidato) &&
    (aiData?.confianza || 0) >= CONFIANZA_UMBRAL &&
    !isDubious &&
    !isRechazado;

  if (puedeAgruparse) {
    const grupoExistente = await IncidentGroup.findById(aiData.idGrupoCandidato);

    if (grupoExistente) {
      newIncident.group = grupoExistente._id;
      const savedIncident = await newIncident.save();

      grupoExistente.incidents.push(savedIncident._id);
      grupoExistente.priority = Math.min(grupoExistente.priority + 1, 10);

      if (aiData.esRepresentanteMejor) {
        grupoExistente.representativeId = savedIncident._id;
      }

      if (savedIncident.is_emergency) grupoExistente.is_emergency = true;

      await grupoExistente.save();
      return savedIncident;
    }
  }

  const hasCandidatoConfiable =
    aiData?.idGrupoCandidato &&
    mongoose.Types.ObjectId.isValid(aiData.idGrupoCandidato) &&
    (aiData?.confianza || 0) >= CONFIANZA_UMBRAL;

  const aiSuggestion = (isDubious || isRechazado) && hasCandidatoConfiable
    ? { confianza: aiData.confianza, razon: aiData.justificacion, idGrupoCandidato: aiData.idGrupoCandidato, estado: 'pendiente' }
    : { confianza: null, razon: null, idGrupoCandidato: null, estado: null };

  const incidentId = new mongoose.Types.ObjectId();

  const nuevoGrupo = new IncidentGroup({
    status: grupoStatusId,
    statusHistory: [{ status: grupoStatusId, changedBy, source }],
    category: incidentData.category,
    priority: 1,
    representativeId: incidentId,
    incidents: [incidentId],
    is_emergency: aiData?.isEmergency || false,
    ai_suggestion: aiSuggestion
  });

  const savedGrupo = await nuevoGrupo.save();

  newIncident._id = incidentId;
  newIncident.group = savedGrupo._id;
  const savedIncident = await newIncident.save();

  return savedIncident;
};

// ==========================================
// LECTURA - USUARIO
// ==========================================

const getIncidentsByUser = async (userId) => {
  const incidents = await Incident.find({ user: userId })
    .populate('category')
    .populate('status')
    .populate({
      path: 'group',
      select: 'status category priority',
      populate: [
        { path: 'status', select: 'name description' },
        { path: 'category', select: 'name' }
      ]
    })
    .sort({ createdAt: -1 });

  return incidents.map(incident => {
    const obj = incident.toObject();
    if (!obj.is_cancelled) {
      obj.status = obj.group?.status || obj.status;
      obj.category = obj.group?.category || obj.category;
      if (obj.is_dubious) {
        obj.status = { ...obj.status, name: 'pendiente' };
      }
    }
    return obj;
  });
};

// ==========================================
// LECTURA - ADMIN
// ==========================================

const getAllGroups = async () => {
  return await IncidentGroup.find()
    .populate({
      path: 'representativeId',
      populate: [
        { path: 'user', select: 'firstName lastName email' },
        { path: 'status', select: 'name description' },
        { path: 'category', select: 'name description' }
      ]
    })
    .populate('status', 'name description')
    .populate('category', 'name description')
    .populate('statusHistory.status', 'name description')
    .populate('statusHistory.changedBy', 'firstName lastName email')
    .sort({ priority: -1, createdAt: -1 });
};

// ==========================================
// HISTORIAL
// ==========================================

const getIncidentHistory = async (incidentId) => {
  const incident = await Incident.findById(incidentId)
    .select('title statusHistory')
    .populate('statusHistory.status', 'name description')
    .populate('statusHistory.changedBy', 'firstName lastName email role');

  if (!incident) {
    const error = new Error('Incidente no encontrado');
    error.status = 404;
    throw error;
  }

  return incident;
};

const getGroupHistory = async (groupId) => {
  const group = await IncidentGroup.findById(groupId)
    .select('statusHistory')
    .populate('statusHistory.status', 'name description')
    .populate('statusHistory.changedBy', 'firstName lastName email role');

  if (!group) {
    const error = new Error('Grupo no encontrado');
    error.status = 404;
    throw error;
  }

  return group;
};

// ==========================================
// ACTUALIZACIÓN - ADMIN (sobre el grupo)
// ==========================================

const updateGroupStatus = async (groupId, newStatusId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(newStatusId)) {
    const error = new Error('El estado enviado no es válido.');
    error.status = 400;
    throw error;
  }

  const group = await IncidentGroup.findById(groupId);
  if (!group) {
    const error = new Error('Grupo no encontrado.');
    error.status = 404;
    throw error;
  }

  const hasDubious = await Incident.exists({
    _id: { $in: group.incidents },
    is_dubious: true,
    is_cancelled: { $ne: true }
  });

  if (hasDubious) {
    const newStatus = await Status.findById(newStatusId);
    if (!newStatus || !['aceptado', 'rechazado'].includes(newStatus.name)) {
      const error = new Error('Un grupo con incidente dudoso solo puede cambiar a "aceptado" o "rechazado".');
      error.status = 400;
      throw error;
    }
  }

  group.status = newStatusId;
  group.statusHistory.push({ status: newStatusId, changedBy: userId, source: 'admin' });
  await group.save();

  await Incident.updateMany(
    { _id: { $in: group.incidents }, is_cancelled: { $ne: true } },
    {
      $set: { status: newStatusId, ...(hasDubious && { is_dubious: false }) },
      $push: { statusHistory: { status: newStatusId, changedBy: userId, source: 'admin' } }
    }
  );

  return group;
};

const updateGroupCategory = async (groupId, newCategoryId) => {
  if (!mongoose.Types.ObjectId.isValid(newCategoryId)) {
    const error = new Error('La categoría enviada no es válida.');
    error.status = 400;
    throw error;
  }

  const group = await IncidentGroup.findByIdAndUpdate(
    groupId,
    { $set: { category: newCategoryId } },
    { returnDocument: 'after' }
  );

  if (!group) {
    const error = new Error('Grupo no encontrado.');
    error.status = 404;
    throw error;
  }

  return group;
};

const updateGroupPriority = async (groupId, priority) => {
  const value = Number(priority);
  if (!Number.isInteger(value) || value < 1 || value > 10) {
    const error = new Error('La prioridad debe ser un número entero entre 1 y 10.');
    error.status = 400;
    throw error;
  }

  const group = await IncidentGroup.findByIdAndUpdate(
    groupId,
    { $set: { priority: value } },
    { returnDocument: 'after' }
  );

  if (!group) {
    const error = new Error('Grupo no encontrado.');
    error.status = 404;
    throw error;
  }

  return group;
};

// ==========================================
// RESOLUCIÓN DE DUDOSOS - ADMIN (sin ruta activa, lógica lista para merge futuro)
// ==========================================

const resolveDubious = async (groupId, action, adminId) => {
  if (!['accept', 'reject'].includes(action)) {
    const error = new Error('La acción debe ser "accept" o "reject".');
    error.status = 400;
    throw error;
  }

  const group = await IncidentGroup.findById(groupId);
  if (!group) {
    const error = new Error('Grupo no encontrado.');
    error.status = 404;
    throw error;
  }

  const incident = await Incident.findOne({
    _id: { $in: group.incidents },
    is_dubious: true,
    is_cancelled: { $ne: true }
  });

  if (!incident) {
    const error = new Error('Este grupo no tiene incidentes dudosos activos.');
    error.status = 400;
    throw error;
  }

  if (action === 'reject') {
    const rechazadoStatus = await Status.findOne({ name: 'rechazado' });
    if (!rechazadoStatus) {
      const error = new Error('Estado "rechazado" no encontrado.');
      error.status = 500;
      throw error;
    }

    group.status = rechazadoStatus._id;
    group.statusHistory.push({ status: rechazadoStatus._id, changedBy: adminId, source: 'admin' });
    group.ai_suggestion.estado = 'rechazado';

    await Incident.updateMany(
      { _id: { $in: group.incidents }, is_cancelled: { $ne: true } },
      {
        $set: { status: rechazadoStatus._id, is_dubious: false },
        $push: { statusHistory: { status: rechazadoStatus._id, changedBy: adminId, source: 'admin' } }
      }
    );

    await group.save();
    return group;
  }

  // action === 'accept'
  const candidateGroupId = group.ai_suggestion?.idGrupoCandidato;

  if (candidateGroupId) {
    const candidateGroup = await IncidentGroup.findById(candidateGroupId);

    if (candidateGroup) {
      candidateGroup.incidents.push(incident._id);
      candidateGroup.priority = Math.min(candidateGroup.priority + 1, 10);

      const repActual = await Incident.findById(candidateGroup.representativeId).select('title description');
      if (repActual) {
        if (calcularScoreRepresentante(incident) > calcularScoreRepresentante(repActual)) {
          candidateGroup.representativeId = incident._id;
        }
      }

      if (incident.is_emergency) candidateGroup.is_emergency = true;
      await candidateGroup.save();

      const cancelledStatus = await Status.findOne({ name: 'cancelado' });
      if (cancelledStatus) {
        group.status = cancelledStatus._id;
        group.statusHistory.push({ status: cancelledStatus._id, changedBy: adminId, source: 'admin' });
      }
      group.ai_suggestion.estado = 'aprobado';
      await group.save();

      await Incident.findByIdAndUpdate(incident._id, {
        $set: {
          is_dubious: false,
          group: candidateGroup._id,
          status: candidateGroup.status
        },
        $push: { statusHistory: { status: candidateGroup.status, changedBy: adminId, source: 'admin' } }
      });

      return candidateGroup;
    }
  }

  // Sin candidato o candidato no encontrado → validar en grupo propio
  await Incident.findByIdAndUpdate(incident._id, { $set: { is_dubious: false } });
  group.ai_suggestion.estado = 'aprobado';
  await group.save();

  return group;
};

// ==========================================
// INCIDENTES DE UN GRUPO - ADMIN
// ==========================================

const getGroupIncidents = async (groupId) => {
  const group = await IncidentGroup.findById(groupId).select('incidents');
  if (!group) {
    const error = new Error('Grupo no encontrado.');
    error.status = 404;
    throw error;
  }

  return await Incident.find({ _id: { $in: group.incidents } })
    .populate('user', 'firstName lastName email')
    .populate('status', 'name description')
    .populate('category', 'name description')
    .sort({ createdAt: -1 });
};

// ==========================================
// CANCELACIÓN - USUARIO
// ==========================================

const CANCELLABLE_STATUSES = ['pendiente', 'aceptado'];

const cancelIncident = async (incidentId, userId) => {
  const incident = await Incident.findById(incidentId).populate('status');

  if (!incident) {
    const error = new Error('Incidente no encontrado.');
    error.status = 404;
    throw error;
  }

  if (incident.user.toString() !== userId.toString()) {
    const error = new Error('No tenés permiso para cancelar este incidente.');
    error.status = 403;
    throw error;
  }

  const currentStatusName = incident.status?.name?.toLowerCase();
  if (!CANCELLABLE_STATUSES.includes(currentStatusName)) {
    const error = new Error('El incidente no puede cancelarse en su estado actual.');
    error.status = 409;
    throw error;
  }

  const cancelledStatus = await Status.findOne({ name: 'cancelado' });
  if (!cancelledStatus) {
    const error = new Error('Estado "cancelado" no encontrado en el sistema.');
    error.status = 500;
    throw error;
  }

  const updated = await Incident.findByIdAndUpdate(
    incidentId,
    {
      $set: { status: cancelledStatus._id, is_cancelled: true },
      $push: { statusHistory: { status: cancelledStatus._id, changedBy: userId, source: 'user' } }
    },
    { returnDocument: 'after' }
  );

  const group = await IncidentGroup.findById(incident.group);
  if (group) {
    group.priority = Math.max(group.priority - 1, 1);

    const remainingCount = await Incident.countDocuments({
      _id: { $in: group.incidents },
      is_cancelled: { $ne: true }
    });

    if (remainingCount === 0) {
      group.status = cancelledStatus._id;
      group.statusHistory.push({ status: cancelledStatus._id, changedBy: userId, source: 'user' });
    } else if (group.representativeId.toString() === incidentId.toString()) {
      const remaining = await Incident.find({
        _id: { $in: group.incidents },
        is_cancelled: { $ne: true }
      }).select('title description');

      const newRep = remaining.reduce((best, inc) =>
        calcularScoreRepresentante(inc) > calcularScoreRepresentante(best) ? inc : best
      );
      group.representativeId = newRep._id;
    }

    await group.save();
  }

  return updated;
};

// ==========================================
// EXPORTACIONES
// ==========================================

module.exports = {
  validateIncidentData,
  createIncident,
  getIncidentsByUser,
  getAllGroups,
  getIncidentHistory,
  getGroupHistory,
  getGroupIncidents,
  updateGroupStatus,
  updateGroupCategory,
  updateGroupPriority,
  resolveDubious,
  cancelIncident
};