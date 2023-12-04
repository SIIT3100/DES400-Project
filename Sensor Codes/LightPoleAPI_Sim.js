// Endpoint for API Call (Simulation)

exports = async function({ query, headers, body}, response) {
    const data = JSON.parse(body.text());
    const info = {
        sensorID: data.sensorID,
        timestamp: Math.floor(new Date().getTime() / 1000)
    }
    
    // Adjust light value codes here

    return "Light adjusted to 100%";
};

