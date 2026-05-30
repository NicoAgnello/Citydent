const Incident = require('../models/incident');
const Status = require('../models/status');
const mongoose = require('mongoose');

// ==========================================
// 1. VALIDACIONES
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
// 2. CREACIÓN (Por usuario o admin)
// ==========================================

const createIncident = async (incidentData, userId, finalStatusId, aiData, userRole = 'user') => {
  const validation = validateIncidentData(incidentData);
  if (!validation.isValid) {
    const error = new Error('Error en los datos del formulario');
    error.status = 400;
    error.details = validation.errors;
    throw error;
  }

  const isAI = aiData?.isAI === true;
  const changedBy = isAI ? process.env.AI_USER_ID : userId;
  const source = isAI ? 'ai' : userRole === 'admin' ? 'admin' : 'user';

  const newIncident = new Incident({
    title: incidentData.title.trim(),
    description: incidentData.description.trim(),
    status: finalStatusId,
    category: incidentData.category,
    location: incidentData.location,
    photos: incidentData.photos,
    user: userId,
    priority: aiData?.prioridad || 1,
    ai_justification: aiData?.justificacion || 'No justificado',
    ai_suggested_category: aiData?.categoriaSugerida || 'No sugerida',
    statusHistory: [{ status: finalStatusId, changedBy, source }]
  });

  return await newIncident.save();
};

// ==========================================
// 3. LECTURA / CONSULTAS
// ==========================================

const getIncidentsByUser = async (userId) => {
  const incidents = await Incident.find({ user: userId })
    .populate('category')
    .populate('status')
    .sort({ createdAt: -1 });

  return incidents.map(incident => {
    if (incident.status?.name === 'dudoso') {
      incident.status = { ...incident.status.toObject(), name: 'pendiente' };
    }
    return incident;
  });
};

const getAllIncidents = async () => {
  return await Incident.find()
    .populate('category')
    .populate('status')
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

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

// ==========================================
// 4. ACTUALIZACIÓN (Solo Admin)
// ==========================================

const updateIncidentStatus = async (incidentId, newStatusId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(newStatusId)) {
    const error = new Error('El estado enviado no es válido.');
    error.status = 400;
    throw error;
  }

  const updated = await Incident.findByIdAndUpdate(
    incidentId,
    {
      $set: { status: newStatusId },
      $push: { statusHistory: { status: newStatusId, changedBy: userId, source: 'admin' } }
    },
    { returnDocument: 'after' }
  );

  if (!updated) {
    const error = new Error('Incidente no encontrado');
    error.status = 404;
    throw error;
  }

  return updated;
};

const updateIncidentCategory = async (incidentId, newCategory) => {
  if (!mongoose.Types.ObjectId.isValid(newCategory)) {
    const error = new Error('La categoría enviada no es válida.');
    error.status = 400;
    throw error;
  }

  const updated = await Incident.findByIdAndUpdate(
    incidentId,
    { $set: { category: newCategory } },
    { returnDocument: 'after' }
  );

  if (!updated) {
    const error = new Error('Incidente no encontrado');
    error.status = 404;
    throw error;
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
  getAllIncidents,
  getIncidentHistory,
  updateIncidentStatus,
  updateIncidentCategory
};