// Get the current date
const currentDate = new Date();
const pirSensorLocation = [
  [9626715, [14.067505, 100.601632]],
  [9626716, [14.069262, 100.601589]],
  [9626717, [14.070404, 100.601573]],
  [9626718, [14.072066, 100.601581]],
  [9626719, [14.073042, 100.601568]],
  [9626720, [14.074715, 100.601565]],
  [9626721, [14.075922, 100.601686]],
  [9626722, [14.075646, 100.603299]],
  [9626723, [14.075661, 100.607291]],
  [9626724, [14.075553, 100.610102]],
  [9626725, [14.07417, 100.61009]],
  [9626726, [14.0731, 100.610066]],
  [9626727, [14.0722, 100.610023]],
  [9626728, [14.070408, 100.609978]],
  [9626729, [14.068686, 100.609911]],
  [9626730, [14.067447, 100.6099]],
  [9626731, [14.067385, 100.608794]],
  [9626732, [14.067389, 100.60742]],
  [9626733, [14.067415, 100.605154]],
  [9626734, [14.065631, 100.605127]],
  [9626735, [14.067433, 100.603384]],
];
// Format the date as YYYY-MM-DD
formattedDate = currentDate.toISOString().split("T")[0];

// Set the value of the input field to the current date
document.getElementById("fromDate").value = formattedDate;
document.getElementById("toDate").value = formattedDate;

// Function to make an AJAX request using Axios
function fetchData() {
  // Get the date and time values from the input boxes
  const fromDateInput = document.getElementById("fromDate");
  const fromTimeInput = document.getElementById("fromTime");
  const toDateInput = document.getElementById("toDate");
  const toTimeInput = document.getElementById("toTime");

  // Format the date strings as "dd-mm-yyyy"
  const fromDate = formatDate(fromDateInput.value);
  const fromTime = fromTimeInput.value;
  const toDate = formatDate(toDateInput.value);
  const toTime = toTimeInput.value;

  // Update the apiUrl to exclude the sensor_id
  const apiUrl = `http://localhost:5000/sensors/?fromDate=${fromDate}&fromTime=${fromTime}&toDate=${toDate}&toTime=${toTime}`;
  clearAllLayers();
  // Make the GET request using Axios
  axios
    .get(apiUrl)
    .then((response) => {
      displayError("");
      mapsMain(pirSensorLocation, response.data);
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
      displayError("Error fetching data. Please try again.");
    });
}

// Function to display the data or error message in the HTML
function displayData(data) {
  const sensorDataDiv = document.getElementById("sensorData");

  if (!data || data.error) {
    // Display error message
    displayError("No sensor data found for the specified date and time range.");
    return;
  }

  const sensorList = data
    .map(
      (sensor) =>
        `<p>Sensor ID: ${sensor.sensor_id}, Value: ${
          sensor.value
        }, Created At: ${new Date(sensor.createdAt * 1000)}</p>`
    )
    .join("");

  // Display sensor data
  sensorDataDiv.innerHTML = sensorList;
}

// Function to display an error message
function displayError(message) {
  const sensorDataDiv = document.getElementById("sensorData");
  sensorDataDiv.innerHTML = `<p style="color: red;">${message}</p>`;
}

// Attach click event to the button
document.getElementById("fetchButton").addEventListener("click", fetchData);

// Helper function to format date as "dd-mm-yyyy"
function formatDate(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`;
}
// Create a map
const map = L.map("map", {
  maxZoom: 18,
  minZoom: 16,
  fullscreenControl: true,
}).setView([14.070453, 100.606089], 16);

// Add OpenStreetMap tiles
L.tileLayer(
  "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
  {
    attribution:
      '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }
).addTo(map);

let heat;

async function mapsMain(pirSensorLocation, sensorResponse) {
  // Wait for the map to be fully initialized
  map.whenReady(() => {
    // Calculate total count for each sensor
    const sensorTotals = pirSensorLocation.map((location, index) => {
      const sensorEntries = sensorResponse.filter(
        (entry) => entry.sensor_id === location[0]
      );
      const totalValue = sensorEntries.reduce(
        (total, entry) => total + entry.value,
        0
      );
      return { sensor_id: location[0], totalValue };
    });

    // Add markers for sensor locations
    pirSensorLocation.forEach((location, index) => {
      const entry = sensorTotals.find(
        (sensor) => sensor.sensor_id === location[0]
      );
      const marker = L.marker([location[1][0], location[1][1]]).addTo(map);
      marker.bindPopup(
        `Sensor ID: ${location[0]}<br>Total Value: ${entry.totalValue}`
      );
      marker.on("click", function () {
        this.openPopup();
      });
    });

    // Calculate total count
    const totalCount = sensorResponse.reduce(
      (total, entry) => total + entry.value,
      0
    );

    // Process response data to create heatmap data with percentages
    const heatmapData = sensorResponse.map((entry) => {
      const location = pirSensorLocation.find(
        (sensor) => sensor[0] === entry.sensor_id
      );
      const percentage = entry.value / totalCount;
      return [location[1][0], location[1][1], percentage];
    });

    // Add heatmap layer
    heatmapLayer = L.heatLayer(heatmapData, {
      radius: calculateHeatmapRadius(),
      gradient: {
        0.0: "blue",
        0.05: "cyan",
        0.1: "lime",
        0.15: "yellow",
        0.2: "red",
      },
      minOpacity: 0.0,
      maxZoom: 2,
      max: 0.5,
    }).addTo(map);
  });
  map.on("zoomend", () => {
    heatmapLayer.setOptions({ radius: calculateHeatmapRadius() });
  });
}

function calculateHeatmapRadius() {
  const currentZoomLevel = map.getZoom();
  const radiusFactor = 1; // Adjust this factor as needed
  return 18 * Math.pow(2, currentZoomLevel - 16) * radiusFactor;
}

function clearAllLayers() {
  if (map) {
    map.eachLayer((layer) => {
      if (layer !== "tileLayer") {
        // Exclude the tile layer if you want to keep the base map
        map.removeLayer(layer);
      }
    });
    L.tileLayer(
      "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(map);
  }
}

//Hide map when using Navbar
$(document).ready(function () {
  $("button.navbar-toggler").click(function () {
    $("#map").toggle();
  });
});
