const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const temperatureSchema = new Schema({
    temperature: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  });
  
  module.exports = mongoose.model('Temperature', temperatureSchema);