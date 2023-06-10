const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RfidSchema = new Schema({
    value: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  });
  module.exports = mongoose.model('Rfid', RfidSchema);
