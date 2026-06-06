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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Status',
    required: true
  },
  statusHistory: [
    {
      status: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Status',
        required: true
      },
      changedAt: { type: Date, default: Date.now },
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      source: {
        type: String,
        enum: ['user', 'admin', 'ai'],
        required: true
      }
    }
  ],
  photos: {
    type: [String],
    default: []
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, trim: true }
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IncidentGroup',
    required: true
  },
  ai_justification: { type: String, trim: true },
  ai_suggested_category: { type: String, trim: true },
  is_emergency: { type: Boolean, default: false },
  is_dubious: { type: Boolean, default: false },
  is_cancelled: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('Incident', incidentSchema);