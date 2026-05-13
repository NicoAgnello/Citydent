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
    type: String,     enum: ['user', 'admin', 'superAdmin'], 
    default: 'user' 
  }
}, {   timestamps: true
});
module.exports = mongoose.model('User', userSchema);