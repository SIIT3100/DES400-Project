#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>

// Use with CH340, NodeMCU 1.0 ESP12-E Module

// Please refer to the link below if you cannot connect to CH340 to board (Driver issue with latest driver)
// https://forum.arduino.cc/t/port-monitor-error-command-open-failed-invalid-serial-port-could-not-connect-to-com-serial-port/1127713/15

const char* ssid = ""; // WIFI SSID (Name)
const char* password = ""; // WIFI Password

const char* DB = // DB HTTP Path
const char* APITest = // API Test HTTP Path
// e.g., "https://ap-southeast-1.aws.data.mongodb-api.com/app/.../endpoint/..."; 

int SensorPin = D0;
int motionCount = 0;

unsigned long lastTime = 0;
unsigned long timerDelay = 15000; // Change delay time here (def 15s, in MS)

void setup() {
  pinMode(SensorPin, INPUT);
  Serial.begin(115200);

  Serial.print("ESP8266 Chip ID: ");
  Serial.println(chipId);

  WiFi.begin(ssid, password);
  Serial.println("Connecting");
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("Connected to WiFi network with IP Address: ");
  Serial.println(WiFi.localIP());
 
  Serial.println("Timer set to 5 seconds (timerDelay variable), it will take 5 seconds before publishing the first reading.");
}

void loop() {
  int value = digitalRead(SensorPin);

  if (value == HIGH) {
    // Motion detected
    delay(1000);
    motionCount++;
    // Serial.println("1");
    if(WiFi.status() == WL_CONNECTED) {
      WiFiClientSecure client;
      HTTPClient http;
      client.setInsecure();

      // API LightPole Call if Motion found
      http.begin(client, APITest);
      http.addHeader("Content-Type", "application/json");
      String additionalData = "{\"sensorID\":" + String(chipId) + "}";
      // Serial.println(additionalData);
      int additionalResponseCode = http.POST(additionalData.c_str());
      Serial.print("API HTTP Response code: ");
      Serial.println(additionalResponseCode);
      http.end();
      
    Serial.println("Total count: " +String(motionCount));
  }

  // Send an HTTP POST request every 10 minutes
  if ((millis() - lastTime) > timerDelay) {

    if(WiFi.status() == WL_CONNECTED) {
      WiFiClientSecure client;
      HTTPClient http;

      client.setInsecure();

      // DB Data Save
      http.begin(client, DB);
      http.addHeader("Content-Type", "application/json");
      String httpRequestData = "{\"sensorID\":" + String(chipId) + ",\"motionCount\":" + String(motionCount) + "}";           
      int httpResponseCode = http.POST(httpRequestData.c_str());
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);

      motionCount = 0;
      http.end(); 

    } else {
      Serial.println("WiFi Disconnected");
    }

    lastTime = millis();
  }
}
