const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Sensor = require('../models/sensor_data.js');

router.use(express.json());

// Helper function to parse date and time to Unix timestamp
function parseDateTimeToTimestamp(dateString, timeString = '00:00', endOfDay = false) {
    const [day, month, year] = dateString.split('-').map(Number);
    const [hour, minute] = timeString.split(':').map(Number);

    const date = new Date(year, month - 1, day, hour, minute);

    if (endOfDay) {
        date.setHours(23, 59, 59, 999);
    }

    return Math.floor(date.getTime() / 1000);
}

// Helper function to build date-time query
function buildDateTimeQuery(fromDate, fromTime, toDate, toTime) {
    const query = {};

    if (fromDate && toDate) {
        const fromTimestamp = parseDateTimeToTimestamp(fromDate, fromTime);
        const toTimestamp = parseDateTimeToTimestamp(toDate, toTime);

        // Add createdAt range to the query
        query.createdAt = { $gte: fromTimestamp, $lte: toTimestamp };
    }

    return query;
}

// Common handler for both "get by ID" and "get all"
async function getAllSensorData(query, res) {
    try {
        const sensorData = await Sensor.find(query).select('-_id -__v').exec();

        if (!sensorData || sensorData.length === 0) {
            return res.status(404).json({ error: 'Sensor data not found for the specified ID and date-time range.' });
        }

        res.json(sensorData);
    } catch (err) {
        throw err;
    }
}

// get by ID with date and time range
router.get('/:sensor_id', async (req, res, next) => {
    try {
        const { sensor_id } = req.params;
        const { fromDate, fromTime, toDate, toTime } = req.query;

        if (!sensor_id) {
            return res.status(400).json({ error: 'Sensor ID is required.' });
        }

        // Create a query object with sensor_id and optional createdAt range
        const query = { sensor_id, ...buildDateTimeQuery(fromDate, fromTime, toDate, toTime) };

        await getAllSensorData(query, res);
    } catch (err) {
        next(err);
    }
});

// get all with date and time range
router.get('/', async (req, res, next) => {
    try {
        const { fromDate, fromTime, toDate, toTime } = req.query;

        const query = buildDateTimeQuery(fromDate, fromTime, toDate, toTime);

        await getAllSensorData(query, res);
    } catch (err) {
        next(err);
    }
});


//sample : http://localhost:5000/sensors/?fromDate=01-12-2023&fromTime=16:00:01&toDate=01-12-2023&toTime=23:59:59

//add 
router.post('/', async (req, res, next) => {
    try {
        const { sensor_id, value } = req.body;
        if (!sensor_id || !value) {
            return res.status(400).json({ error: 'Sensor ID and value are required.' });
        }
        const newSensor = new Sensor({
            sensor_id,
            value,
            createdAt: Math.floor(Date.now() / 1000)
        });

        const savedSensor = await newSensor.save();
        res.status(201).json(savedSensor);
    } catch (err) {
        next(err);
    }
});

module.exports = router;