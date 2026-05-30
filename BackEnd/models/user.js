const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  dni: {
    type: String,
    required: true,
    match: /^\d{8}$/
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'superAdmin', 'ai'],
    default: 'user'
  },
  isBanned: {
    type: Boolean,
    default: false,
    index: true
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);