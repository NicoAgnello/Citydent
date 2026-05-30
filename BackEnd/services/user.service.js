const User = require('../models/user');
const Role = require('../models/role');
const mongoose = require('mongoose');

// ==========================================
// 1. CAMBIAR ROL
// ==========================================

const changeUserRole = async (targetUserId, newRoleId, requesterId) => {
  const BLOCKED_ROLE_NAMES = ['superAdmin', 'ai'];

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    const error = new Error('El usuario enviado no es válido.');
    error.status = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(newRoleId)) {
    const error = new Error('El rol enviado no es válido.');
    error.status = 400;
    throw error;
  }

  if (targetUserId.toString() === requesterId.toString()) {
    const error = new Error('No podés modificar tu propio rol.');
    error.status = 403;
    throw error;
  }

  const newRole = await Role.findById(newRoleId);
  if (!newRole) {
    const error = new Error('Rol no encontrado.');
    error.status = 404;
    throw error;
  }

  if (BLOCKED_ROLE_NAMES.includes(newRole.name)) {
    const error = new Error('No podés asignar el rol superAdmin ni ai.');
    error.status = 403;
    throw error;
  }

  const targetUser = await User.findById(targetUserId).populate('role');
  if (!targetUser) {
    const error = new Error('Usuario no encontrado.');
    error.status = 404;
    throw error;
  }

  if (targetUser.role.name === 'superAdmin') {
    const error = new Error('No podés modificar el rol de un superAdmin.');
    error.status = 403;
    throw error;
  }

  if (targetUser.role._id.toString() === newRoleId.toString()) {
    const error = new Error(`El usuario ya tiene el rol ${newRole.name}.`);
    error.status = 400;
    throw error;
  }

  return await User.findByIdAndUpdate(
    targetUserId,
    { $set: { role: newRoleId } },
    { returnDocument: 'after' }
  ).populate('role');
};

// ==========================================
// 2. BANEAR / DESBANEAR
// ==========================================

const banUser = async (targetUserId, isBanned, requesterId) => {
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    const error = new Error('El usuario enviado no es válido.');
    error.status = 400;
    throw error;
  }

  if (typeof isBanned !== 'boolean') {
    const error = new Error('El campo isBanned debe ser un booleano.');
    error.status = 400;
    throw error;
  }

  if (targetUserId.toString() === requesterId.toString()) {
    const error = new Error('No podés banearte a vos mismo.');
    error.status = 403;
    throw error;
  }

  const targetUser = await User.findById(targetUserId).populate('role');
  if (!targetUser) {
    const error = new Error('Usuario no encontrado.');
    error.status = 404;
    throw error;
  }

  if (targetUser.role.name === 'superAdmin') {
    const error = new Error('No podés banear a un superAdmin.');
    error.status = 403;
    throw error;
  }

  if (targetUser.isBanned === isBanned) {
    const error = new Error(`El usuario ya se encuentra ${isBanned ? 'baneado' : 'activo'}.`);
    error.status = 400;
    throw error;
  }

  return await User.findByIdAndUpdate(
    targetUserId,
    { $set: { isBanned } },
    { returnDocument: 'after' }
  ).populate('role');
};

// ==========================================
// EXPORTACIONES
// ==========================================

module.exports = {
  changeUserRole,
  banUser
};