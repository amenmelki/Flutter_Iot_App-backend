const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const motionDetectorSchema = new Schema({
    value: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  });
  module.exports = mongoose.model('MotionDetector', motionDetectorSchema);
