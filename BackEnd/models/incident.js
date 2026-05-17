const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
    maxlength: [100, 'El título no puede exceder los 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    trim: true,
    maxlength: [1000, 'La descripción no puede exceder los 1000 caracteres']
  },
  status: {
    type: mongoose.Schema.Types.ObjectId, //MongoId de estado
    ref: 'Status',
    required: [true, 'El estado es obligatorio']
  },
  photos: { 
    type: [String], 
    default: [] 
  },
  location: {
    lat: {
      type: Number,
      required: [true, 'La ubicación es obligatoria'],
    },
    lng: {
      type: Number,
      required: [true, 'La ubicación es obligatoria'],
    },
    address: {
      type: String,
      required: false,
      trim: true
    }
  },
  category: {
    type: mongoose.Schema.Types.ObjectId, ///MongoId de categoria
    ref: 'Category',
    required: [true, 'La categoría es obligatoria']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId, //MongoId de usuario
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Incident', incidentSchema);