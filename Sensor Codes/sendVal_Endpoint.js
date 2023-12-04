// Endpoint for backup data to DB

exports = async function({ query, headers, body}, response) {
    const data = JSON.parse(body.text());

    const info = {
        sensorID: data.sensorID,
        value: data.motionCount,
        timestamp: Math.floor(new Date().getTime() / 1000)
    }

    const collection = await context.services.get("<DATA SOURCE NAME>").db("<DATABASE NAME>").collection("<DB COLLECTION NAME>")
    
    const result = await collection.insertOne(info);

    return result;
};