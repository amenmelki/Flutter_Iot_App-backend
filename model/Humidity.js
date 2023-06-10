const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const humiditySchema = new Schema({
    humidity: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  });
  
  module.exports = mongoose.model('Humidity', humiditySchema);