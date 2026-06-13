const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre de la categoría es obligatorio'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true,
    default: '',
    maxlength: [100, 'La descripción no puede exceder los 100 caracteres']
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);