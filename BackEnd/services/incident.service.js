const Incident = require('../models/incident');
const Status = require('../models/status');
const mongoose = require('mongoose');

// ==========================================
// 1. VALIDACIONES
// ==========================================

const validateIncidentData = (data) => {
  const errors = [];

  // Título
  if (!data.title || typeof data.title !== 'string') {
    errors.push('El título es obligatorio y debe ser un texto.');
  } else if (data.title.trim().length === 0) {
    errors.push('El título no puede estar vacío o contener solo espacios.');
  } else if (data.title.trim().length > 100) {
    errors.push('El título no puede exceder los 100 caracteres.');
  }

  // Descripción
  if (!data.description || typeof data.description !== 'string') {
    errors.push('La descripción es obligatoria y debe ser un texto.');
  } else if (data.description.trim().length === 0) {
    errors.push('La descripción no puede estar vacía o contener solo espacios.');
  } else if (data.description.trim().length > 1000) {
    errors.push('La descripción no puede exceder los 1000 caracteres.');
  }

  // Categoría
  if (!data.category) {
    errors.push('La categoría es obligatoria.');
  } else if (!mongoose.Types.ObjectId.isValid(data.category)) {
    errors.push('La categoría enviada no es válida.');
  }

  // Fotos
  if (!Array.isArray(data.photos) || data.photos.length < 1 || data.photos.length > 3) {
    errors.push('Se requiere entre 1 y 3 fotos.');
  }

  // Ubicación
  if (!data.location?.lat || !data.location?.lng) {
    errors.push('La ubicación es obligatoria.');
  }

  return { isValid: errors.length === 0, errors };
};

// ==========================================
// 2. CREACIÓN (Usuario)
// ==========================================

const createIncident = async (incidentData, userId, finalStatusId) => {
  // Primero validar
  const validation = validateIncidentData(incidentData);
  if (!validation.isValid) {
    const error = new Error('Error en los datos del formulario');
    error.status = 400;
    error.details = validation.errors;
    throw error;
  }

  // Creación directa utilizando el estado determinado por el middleware
  const newIncident = new Incident({
    title: incidentData.title.trim(),
    description: incidentData.description.trim(),
    status: finalStatusId,
    category: incidentData.category,
    location: incidentData.location,
    photos: incidentData.photos,
    user: userId
  });

  return await newIncident.save();
};

// ==========================================
// 3. LECTURA / CONSULTAS
// ==========================================

const getIncidentsByUser = async (userId) => {
  return await Incident.find({ user: userId })
    .populate('category')
    .populate('status')
    .sort({ createdAt: -1 });
};

const getAllIncidents = async () => {
  return await Incident.find()
    .populate('category')
    .populate('status')
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

// ==========================================
// 4. ACTUALIZACIÓN (Solo Admin)
// ==========================================

const updateIncidentStatus = async (incidentId, newStatusId) => {
  if (!mongoose.Types.ObjectId.isValid(newStatusId)) {
    const error = new Error('El estado enviado no es válido.');
    error.status = 400;
    throw error;
  }

  const updated = await Incident.findByIdAndUpdate(
    incidentId,
    { $set: { status: newStatusId } },
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
  updateIncidentStatus,
  updateIncidentCategory
};