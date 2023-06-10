const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const flameSensorSchema = new Schema({
    value: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  });
  
  module.exports = mongoose.model('FlameSensor', flameSensorSchema);