const mongoose = require('mongoose');

const updateRequestSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const UpdateRequest = mongoose.model('UpdateRequest', updateRequestSchema);

module.exports = UpdateRequest;
