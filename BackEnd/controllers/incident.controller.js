const Incident = require('../models/incident');
const { uploadImageToCloudinary } = require('../services/cludinary.service');
const { getAddressFromCoordinates } = require('../services/osm.service');
const { createIncident, ESTADOS_PERMITIDOS } = require('../services/incident.service');

/**
 * CREAR UN NUEVO INCIDENTE
 * Maneja la subida de fotos, geocodificación de dirección y guardado en DB.
 */
const createIncidentController = async (req, res) => {
  try {
    // 1. Obtener ID de usuario desde Clerk (inyectado por verifyToken)
    const userId = req.auth?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // 2. Procesar coordenadas
    const lat = req.body.lat ? parseFloat(req.body.lat) : undefined;
    const lng = req.body.lng ? parseFloat(req.body.lng) : undefined;

    // 3. Obtener dirección mediante OpenStreetMap si no se proporcionó una
    let address = req.body.address;
    if (!address && lat && lng) {
      address = await getAddressFromCoordinates(lat, lng);
    }

    // 4. Subir fotos a Cloudinary (vienen por Multer en req.files)
    const photosUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadImageToCloudinary(file.buffer);
        photosUrls.push(url);
      }
    }

    // 5. Preparar objeto de datos
    const incidentData = {
      title: req.body.title,
      description: req.body.description,
      status: req.body.status || 'pendiente',
      photos: photosUrls,
      location: {
        lat,
        lng,
        address: address || 'Ubicación no especificada'
      }
    };

    // 6. Validar y guardar usando el servicio
    const newIncident = await createIncident(incidentData, userId);

    res.status(201).json({
      success: true,
      message: 'Incidente reportado con éxito',
      data: newIncident
    });

  } catch (error) {
    console.error('Error en createIncidentController:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Error interno del servidor',
      details: error.details || []
    });
  }
};

/**
 * OBTENER TODOS LOS INCIDENTES
 * Trae la lista completa, incluyendo datos básicos del usuario que reportó.
 */
const getAllIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find()
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 }); // Los más recientes primero

    res.status(200).json({ success: true, data: incidents });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los incidentes' });
  }
};

/**
 * OBTENER UN INCIDENTE POR ID
 */
const getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('user', 'firstName lastName email');
      
    if (!incident) {
      return res.status(404).json({ error: 'Incidente no encontrado' });
    }

    res.status(200).json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el incidente' });
  }
};

/**
 * ACTUALIZAR ESTADO DEL INCIDENTE (PARA EL ADMIN)
 * Valida que el estado pertenezca al "desplegable" permitido.
 */
const updateIncidentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!ESTADOS_PERMITIDOS.includes(status)) {
      return res.status(400).json({ 
        error: 'Estado inválido', 
        opciones: ESTADOS_PERMITIDOS 
      });
    }

    const updatedIncident = await Incident.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedIncident) {
      return res.status(404).json({ error: 'Incidente no encontrado' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Estado actualizado', 
      data: updatedIncident 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el estado' });
  }
};

/**
 * ELIMINAR INCIDENTE
 */
const deleteIncident = async (req, res) => {
  try {
    const deletedIncident = await Incident.findByIdAndDelete(req.params.id);
    
    if (!deletedIncident) {
      return res.status(404).json({ error: 'Incidente no encontrado' });
    }

    res.status(200).json({ success: true, message: 'Incidente eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el incidente' });
  }
};

module.exports = {
  createIncidentController,
  getAllIncidents,
  getIncidentById,
  updateIncidentStatus,
  deleteIncident
};