const {
  createIncident,
  getIncidentsByUser,
  getAllIncidents,
  updateIncidentStatus,
  updateIncidentCategory
} = require('../services/incident.service');

const create = async (req, res) => {
    console.log('Llegó a create');
  console.log('dbUser:', req.dbUser);
  try {
    const incident = await createIncident(req.body, req.dbUser._id);
    res.status(201).json({ success: true, incident });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ error: error.message, details: error.details });
    }
    res.status(500).json({ error: 'Error interno del servidor.' });
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
    const incidents = await getAllIncidents();
    res.status(200).json({ success: true, incidents });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statusId } = req.body;

    const incident = await updateIncidentStatus(id, statusId);
    res.status(200).json({ success: true, incident });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ error: error.message });
    }
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId } = req.body;

    const incident = await updateIncidentCategory(id, categoryId);
    res.status(200).json({ success: true, incident });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ error: error.message });
    }
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

module.exports = { create, getMyIncidents, getAll, updateStatus, updateCategory };