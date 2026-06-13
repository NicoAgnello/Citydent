const {
  createIncident,
  getIncidentsByUser,
  getAllGroups,
  getIncidentHistory,
  getGroupHistory: getGroupHistoryService,
  getGroupIncidents: getGroupIncidentsService,
  updateGroupStatus,
  updateGroupCategory,
  updateGroupPriority,
  cancelIncident
} = require('../services/incident.service');

const create = async (req, res) => {
  try {
    const incident = await createIncident(req.body, req.dbUser._id, req.aiData, req.dbUser.role);
    
    if (req.aiData.isEmergency) {
       return res.status(201).json({ 
         success: true, 
         incident, 
         isEmergency: true,
         message: 'Atención: Tu reporte fue registrado en el municipio, pero parece ser una emergencia vital. La plataforma no despacha servicios de urgencia. Por favor, comunícate de inmediato con el 100 (Bomberos), 101 (Policía) o 107 (Ambulancia).'
       });
    }

    res.status(201).json({ success: true, incident });
  } catch (error) {
    console.error("🔴 Error interno en el controlador al crear incidente:", error); 
    
    // 👇 Inyectamos el req.body en todos los posibles retornos de error
    const errorResponse = {
      bodyRecibido: req.body
    };

    if (error.status === 400) {
      return res.status(400).json({ error: error.message, details: error.details, ...errorResponse });
    }
    if (error.status === 200) {
      return res.status(200).json({ success: false, message: error.message, ...errorResponse });
    }
    res.status(500).json({ error: 'Error interno del servidor.', ...errorResponse });
  }
};
const getMyIncidents = async (req, res) => {
  try {
    const incidents = await getIncidentsByUser(req.dbUser._id);
    res.status(200).json({ success: true, incidents });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

const getAll = async (req, res) => {
  try {
    const groups = await getAllGroups();
    res.status(200).json({ success: true, groups });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

const getHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await getIncidentHistory(id);
    res.status(200).json({ success: true, incident });
  } catch (error) {
    if (error.status === 404) return res.status(404).json({ error: error.message });
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statusId } = req.body;
    const group = await updateGroupStatus(id, statusId, req.dbUser._id);
    res.status(200).json({ success: true, group });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ error: error.message });
    if (error.status === 404) return res.status(404).json({ error: error.message });
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId } = req.body;
    const group = await updateGroupCategory(id, categoryId);
    res.status(200).json({ success: true, group });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ error: error.message });
    if (error.status === 404) return res.status(404).json({ error: error.message });
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

const updatePriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    const group = await updateGroupPriority(id, priority);
    res.status(200).json({ success: true, group });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ error: error.message });
    if (error.status === 404) return res.status(404).json({ error: error.message });
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

const getGroupIncidents = async (req, res) => {
  try {
    const { id } = req.params;
    const incidents = await getGroupIncidentsService(id);
    res.status(200).json({ success: true, incidents });
  } catch (error) {
    if (error.status === 404) return res.status(404).json({ error: error.message });
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

const getGroupHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await getGroupHistoryService(id);
    res.status(200).json({ success: true, group });
  } catch (error) {
    if (error.status === 404) return res.status(404).json({ error: error.message });
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

const cancel = async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await cancelIncident(id, req.dbUser._id);
    res.status(200).json({ success: true, incident });
  } catch (error) {
    if (error.status === 403) return res.status(403).json({ error: error.message });
    if (error.status === 404) return res.status(404).json({ error: error.message });
    if (error.status === 409) return res.status(409).json({ error: error.message });
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

module.exports = { create, getMyIncidents, getAll, getHistory, getGroupHistory, getGroupIncidents, updateStatus, updateCategory, updatePriority, cancel };