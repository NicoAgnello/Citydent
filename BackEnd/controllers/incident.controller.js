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
  cancelIncident,
  queueFailedAIIncidents,
  countFailedAIIncidents
} = require('../services/incident.service');
const { respondError, logError } = require('../utils/logger');

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
    // Endpoint crítico: dejamos en consola los datos que entraron para poder reproducir el fallo.
    if (error.status === 200) {
      logError('incidents.create', error, { inputs: req.body, aiData: req.aiData });
      return res.status(200).json({ success: false, message: error.message });
    }
    respondError(res, error, { context: 'incidents.create', inputs: { body: req.body, aiData: req.aiData } });
  }
};

const getMyIncidents = async (req, res) => {
  try {
    const incidents = await getIncidentsByUser(req.dbUser._id);
    res.status(200).json({ success: true, incidents });
  } catch (error) {
    respondError(res, error, { context: 'incidents.getMyIncidents', inputs: { userId: req.dbUser._id } });
  }
};

const getAll = async (req, res) => {
  try {
    const groups = await getAllGroups();
    res.status(200).json({ success: true, groups });
  } catch (error) {
    respondError(res, error, { context: 'incidents.getAll' });
  }
};

const getHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const requester = { id: req.dbUser._id, role: req.dbUser.role?.name };
    const incident = await getIncidentHistory(id, requester);
    res.status(200).json({ success: true, incident });
  } catch (error) {
    respondError(res, error, { context: 'incidents.getHistory', inputs: { incidentId: req.params.id, requesterId: req.dbUser._id } });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statusId } = req.body;
    const group = await updateGroupStatus(id, statusId, req.dbUser._id);
    res.status(200).json({ success: true, group });
  } catch (error) {
    respondError(res, error, { context: 'incidents.updateStatus', inputs: { groupId: req.params.id, statusId: req.body.statusId, adminId: req.dbUser._id } });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId } = req.body;
    const group = await updateGroupCategory(id, categoryId);
    res.status(200).json({ success: true, group });
  } catch (error) {
    respondError(res, error, { context: 'incidents.updateCategory', inputs: { groupId: req.params.id, categoryId: req.body.categoryId } });
  }
};

const updatePriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    const group = await updateGroupPriority(id, priority);
    res.status(200).json({ success: true, group });
  } catch (error) {
    respondError(res, error, { context: 'incidents.updatePriority', inputs: { groupId: req.params.id, priority: req.body.priority } });
  }
};

const getGroupIncidents = async (req, res) => {
  try {
    const { id } = req.params;
    const incidents = await getGroupIncidentsService(id);
    res.status(200).json({ success: true, incidents });
  } catch (error) {
    respondError(res, error, { context: 'incidents.getGroupIncidents', inputs: { groupId: req.params.id } });
  }
};

const getGroupHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await getGroupHistoryService(id);
    res.status(200).json({ success: true, group });
  } catch (error) {
    respondError(res, error, { context: 'incidents.getGroupHistory', inputs: { groupId: req.params.id } });
  }
};

const cancel = async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await cancelIncident(id, req.dbUser._id);
    res.status(200).json({ success: true, incident });
  } catch (error) {
    respondError(res, error, { context: 'incidents.cancel', inputs: { incidentId: req.params.id, userId: req.dbUser._id } });
  }
};

const syncAIFallbacks = async (req, res) => {
  try {
    const result = await queueFailedAIIncidents();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("🔴 Error interno encolando la IA:", error);
    res.status(500).json({ error: 'Error interno al intentar encolar incidentes con Gemini.' });
  }
};

const countAIFallbacks = async (req, res) => {
  try {
    const count = await countFailedAIIncidents();
    res.status(200).json({ success: true, count });
  } catch (error) {
    respondError(res, error, { context: 'incidents.countAIFallbacks' });
  }
};

module.exports = { create, getMyIncidents, getAll, getHistory, getGroupHistory, getGroupIncidents, updateStatus, updateCategory, updatePriority, cancel, syncAIFallbacks, countAIFallbacks };
