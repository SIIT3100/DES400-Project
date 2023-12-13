const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Sensor = require('./routes/sensors')

const url = // MongoDB Connection string
// e.g. "mongodb+srv://<USER>:<PASSWORD>@cluster...mongodb.net/<DBName>..."

const app = express();

async function connect_mongo(){
    try {
        await mongoose.connect(url)
        console.log("Connected to MongoDB");
    } catch (error) {
        console.log(error);
    }
}

connect_mongo()

app.use('/sensors', Sensor)

// Set static
app.use(express.static(path.join(__dirname, 'client')));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`server is running on port ${PORT}`));