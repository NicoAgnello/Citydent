const { getUsers, getUsersPage, getUserById, getMyProfile, sendVerification, updateProfile, createUserByAdmin, updateUserProfileByAdmin, getRoles, changeUserRole, banUser } = require('../services/user.service');
const { respondError } = require('../utils/logger');

const fetchUsers = async (req, res) => {
  try {
    if (req.query.page) {
      const q = req.query;
      const result = await getUsersPage({
        page: q.page,
        limit: q.limit,
        search: q.search || '',
        role: q.role || '',
      });
      return res.status(200).json({ success: true, ...result });
    }

    const users = await getUsers();
    res.status(200).json({ success: true, users });
  } catch (error) {
    respondError(res, error, { context: 'users.fetchUsers' });
  }
};

const fetchUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserById(id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    respondError(res, error, { context: 'users.fetchUserById', inputs: { userId: req.params.id } });
  }
};

const fetchRoles = async (req, res) => {
  try {
    const roles = await getRoles();
    res.status(200).json({ success: true, roles });
  } catch (error) {
    respondError(res, error, { context: 'users.fetchRoles' });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await changeUserRole(id, role, req.dbUser._id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    respondError(res, error, { context: 'users.updateRole', inputs: { targetUserId: req.params.id, newRoleId: req.body.role, requesterId: req.dbUser._id } });
  }
};

const updateBan = async (req, res) => {
  try {
    const { id } = req.params;
    const { isBanned } = req.body;

    const user = await banUser(id, isBanned, req.dbUser._id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    respondError(res, error, { context: 'users.updateBan', inputs: { targetUserId: req.params.id, isBanned: req.body.isBanned, requesterId: req.dbUser._id } });
  }
};

const sendVerificationCode = async (req, res) => {
  try {
    await sendVerification(req.dbUser._id);
    res.status(200).json({ success: true, message: 'Código de verificación enviado al correo.' });
  } catch (error) {
    respondError(res, error, { context: 'users.sendVerificationCode', inputs: { userId: req.dbUser._id } });
  }
};

const fetchMyProfile = async (req, res) => {
  try {
    const user = await getMyProfile(req.dbUser._id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    respondError(res, error, { context: 'users.fetchMyProfile', inputs: { userId: req.dbUser._id } });
  }
};

const patchProfile = async (req, res) => {
  try {
    const user = await updateProfile(req.dbUser._id, req.body);
    res.status(200).json({ success: true, user });
  } catch (error) {
    respondError(res, error, { context: 'users.patchProfile', inputs: { userId: req.dbUser._id, body: req.body } });
  }
};

const createUser = async (req, res) => {
  try {
    const user = await createUserByAdmin(req.body);
    res.status(201).json({ success: true, user });
  } catch (error) {
    respondError(res, error, { context: 'users.createUser', inputs: { body: req.body } });
  }
};

const patchUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await updateUserProfileByAdmin(id, req.body);
    res.status(200).json({ success: true, user });
  } catch (error) {
    respondError(res, error, { context: 'users.patchUserProfile', inputs: { targetUserId: req.params.id, body: req.body } });
  }
};

module.exports = { fetchUsers, fetchUserById, fetchMyProfile, sendVerificationCode, patchProfile, createUser, patchUserProfile, fetchRoles, updateRole, updateBan };
