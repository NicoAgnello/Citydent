const Incident = require('../models/incident');

// Estas son las opciones exactas que tendrá tu menú desplegable (select) en el frontend.
// Nota: En el futuro, esto podría moverse a tu archivo src/utils/constants.js
const ESTADOS_PERMITIDOS = ['pendiente', 'en_proceso', 'resuelto'];

/**
 * Función auxiliar para validar los datos del incidente
 * @param {Object} data - Datos provenientes del body de la petición
 * @returns {Object} - Retorna un objeto con el estado de la validación y los errores
 */
const validateIncidentData = (data) => {
  const errors = [];

  // 1. Validar Título
  if (data.photos) {
    if (!Array.isArray(data.photos)) {
      errors.push('El formato de las fotos es inválido. Debe ser una lista (array).');
    } else {
      // Verificar que cada elemento de la lista sea un texto (URL)
      const allStrings = data.photos.every(item => typeof item === 'string');
      if (!allStrings) {
        errors.push('Las URLs de las fotos deben ser texto.');
      }
    }
  }

  if (!data.title || typeof data.title !== 'string') {
    errors.push('El título es obligatorio y debe ser un texto.');
  } else if (data.title.trim().length === 0) {
    errors.push('El título no puede estar vacío o contener solo espacios.');
  } else if (data.title.trim().length > 100) {
    errors.push('El título no puede exceder los 100 caracteres.');
  }

  // 2. Validar Descripción
  if (!data.description || typeof data.description !== 'string') {
    errors.push('La descripción es obligatoria y debe ser un texto.');
  } else if (data.description.trim().length === 0) {
    errors.push('La descripción no puede estar vacía o contener solo espacios.');
  } else if (data.description.trim().length > 1000) {
    errors.push('La descripción no puede exceder los 1000 caracteres.');
  }

  // 3. Validar Estado (Desplegable)
  // Si el usuario envía un estado desde el desplegable, verificamos que coincida exactamente con nuestras opciones.
  if (data.status) {
    if (typeof data.status !== 'string') {
      errors.push('El estado debe ser un formato de texto válido.');
    } else if (!ESTADOS_PERMITIDOS.includes(data.status)) {
      // Si envían algo que no está en la lista del desplegable, lo bloqueamos
      errors.push(`El estado '${data.status}' es inválido. Por favor selecciona una opción del menú: ${ESTADOS_PERMITIDOS.join(', ')}.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Servicio para crear un nuevo incidente
 * @param {Object} incidentData - Datos del incidente
 * @param {String} userId - ID del usuario de MongoDB (relacionado con Clerk)
 * @returns {Object} - Incidente creado
 */
const createIncident = async (incidentData, userId) => {
  // Ejecutar las validaciones
  const validation = validateIncidentData(incidentData);

  if (!validation.isValid) {
    // Si hay errores, lanzamos una excepción detallada
    const error = new Error('Error en los datos del formulario');
    error.status = 400;
    error.details = validation.errors;
    throw error;
  }

  // Si los datos son válidos, procedemos a crear la situación
  const newIncident = new Incident({
    title: incidentData.title.trim(),
    description: incidentData.description.trim(),
    // Asignamos el estado seleccionado en el desplegable, o 'pendiente' por defecto si el formulario no lo envía
    status: incidentData.status || 'pendiente',
    location: incidentData.location || {},
    photos: incidentData.photos || [],
    user: userId
  });

  // Guardar en la base de datos
  const savedIncident = await newIncident.save();
  return savedIncident;
};

module.exports = {
  ESTADOS_PERMITIDOS, // Exportamos la constante por si la necesitamos en el controlador
  validateIncidentData,
  createIncident
};