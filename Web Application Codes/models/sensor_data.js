const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sensorSchema = new Schema({
  sensor_id: {
    type: Number,
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Number,
    default: Math.floor(Date.now() / 1000)
  }
});

const Sensor = mongoose.model('sensor', sensorSchema, 'Sensor');

module.exports = Sensor;
