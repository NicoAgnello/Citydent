const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del estado es obligatorio'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Status', statusSchema);