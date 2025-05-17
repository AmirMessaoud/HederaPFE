const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  type: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'UpdateRequest' },
  read: { type: Boolean, default: false },
});

module.exports = mongoose.model('Notification', notificationSchema);
