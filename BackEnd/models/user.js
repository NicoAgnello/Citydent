/// Metadata local del usuario sync con clerk COOKIE GENERATOR
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
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  }
}, { 
  timestamps: true // Crea automáticamente createdAt y updatedAt
});

module.exports = mongoose.model('User', userSchema);