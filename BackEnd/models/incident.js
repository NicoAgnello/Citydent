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
    required: [true, 'El estado es obligatorio']
  },
  statusHistory: [
    {
      status: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Status',
        required: true
      },
      changedAt: {
        type: Date,
        default: Date.now
      },
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'La categoría es obligatoria']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 1
  },
  ai_justification: {
    type: String,
    trim: true
  },
  ai_suggested_category: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Incident', incidentSchema);