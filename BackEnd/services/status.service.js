const Status = require('../models/status');
const mongoose = require('mongoose');

const getAllStatuses = async () => {
  return await Status.find().sort({ name: 1 });
};

const createStatus = async ({ name, description }) => {
  const existing = await Status.findOne({ name: name.trim() });
  if (existing) {
    const error = new Error('Ya existe un estado con ese nombre.');
    error.status = 400;
    throw error;
  }

  const status = new Status({ name: name.trim(), description: description?.trim() || '' });
  return await status.save();
};

const deleteStatus = async (statusId) => {
  if (!mongoose.Types.ObjectId.isValid(statusId)) {
    const error = new Error('El estado enviado no es válido.');
    error.status = 400;
    throw error;
  }

  const deleted = await Status.findByIdAndDelete(statusId);
  if (!deleted) {
    const error = new Error('Estado no encontrado.');
    error.status = 404;
    throw error;
  }

  return deleted;
};

module.exports = { getAllStatuses, createStatus, deleteStatus };