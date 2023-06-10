const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: false,
  },
  time: {
    type: Date,
    default: Date.now,
  },
});
module.exports = Notification = mongoose.model('Notification', notificationSchema);
