#include <WiFi.h>
#include <WiFiClient.h>
#include <WiFiClientSecure.h>
#include <WiFiManager.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>
#include <BH1750.h>

// Pin configuration
#define DHTPIN 4
#define DHTTYPE DHT22
#define SOIL_PIN 35
#define PUMP_PIN 18

// Expose gateway-service:8080 through ngrok and paste the HTTPS URL here.
const char* BASE_URL = "https://mazelike-disposingly-zander.ngrok-free.dev";

const int DEFAULT_THRESHOLD = 30;
const int DEFAULT_DURATION = 3000;

String deviceId = "";

// Soil moisture calibration values.
int dryValue = 2200;
int wetValue = 680;

// Server-provided pump configuration.
int threshold = DEFAULT_THRESHOLD;
int duration = DEFAULT_DURATION;

unsigned long lastSendTime = 0;
unsigned long lastConfigFetchTime = 0;
const unsigned long SENSOR_SEND_INTERVAL_MS = 10000;
const unsigned long CONFIG_FETCH_INTERVAL_MS = 60000;

DHT dht(DHTPIN, DHTTYPE);
BH1750 lightMeter;

String getMacAddress() {
  uint8_t mac[6];
  WiFi.macAddress(mac);

  char macStr[18];
  snprintf(
    macStr,
    sizeof(macStr),
    "%02X-%02X-%02X-%02X-%02X-%02X",
    mac[0],
    mac[1],
    mac[2],
    mac[3],
    mac[4],
    mac[5]
  );

  return String(macStr);
}

bool beginHttp(HTTPClient& http, WiFiClient& plainClient, WiFiClientSecure& secureClient, const String& url) {
  if (url.startsWith("https://")) {
    // ngrok uses HTTPS. For demos, skip certificate validation on the ESP32.
    secureClient.setInsecure();
    return http.begin(secureClient, url);
  }

  return http.begin(plainClient, url);
}

String buildUrl(const String& path) {
  String base = String(BASE_URL);
  if (base.endsWith("/")) {
    base.remove(base.length() - 1);
  }
  return base + path;
}

void logHttpResult(const char* label, int code, const String& body) {
  if (code >= 200 && code < 300) {
    Serial.printf("[OK] %s: HTTP %d\n", label, code);
    return;
  }

  if (code == 404) {
    Serial.printf("[WARN] %s: HTTP 404. Device is not registered on the server.\n", label);
  } else if (code >= 400 && code < 500) {
    Serial.printf("[WARN] %s: HTTP %d. Request rejected by server.\n", label, code);
  } else if (code >= 500) {
    Serial.printf("[ERROR] %s: HTTP %d. Server error or device not linked/active.\n", label, code);
  } else if (code <= 0) {
    Serial.printf("[ERROR] %s: request failed: %s\n", label, HTTPClient::errorToString(code).c_str());
  } else {
    Serial.printf("[WARN] %s: unexpected HTTP %d\n", label, code);
  }

  if (body.length() > 0) {
    Serial.println(body);
  }
}

void registerDevice() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WARN] device register skipped: WiFi is disconnected.");
    return;
  }

  WiFiClient plainClient;
  WiFiClientSecure secureClient;
  HTTPClient http;

  String url = buildUrl("/api/sensor/device/register");
  if (!beginHttp(http, plainClient, secureClient, url)) {
    Serial.println("[ERROR] device register failed: invalid URL.");
    return;
  }

  http.addHeader("Content-Type", "application/json");

  String json = "{\"deviceId\":\"" + deviceId + "\"}";
  int code = http.POST(json);
  String body = http.getString();
  logHttpResult("device register", code, body);

  http.end();
}

void fetchDeviceConfig() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WARN] config fetch skipped: WiFi is disconnected.");
    return;
  }

  WiFiClient plainClient;
  WiFiClientSecure secureClient;
  HTTPClient http;

  String url = buildUrl("/api/sensor/device/" + deviceId);
  if (!beginHttp(http, plainClient, secureClient, url)) {
    Serial.println("[ERROR] config fetch failed: invalid URL.");
    return;
  }

  int code = http.GET();
  String body = http.getString();

  if (code == 200) {
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, body);

    if (error) {
      Serial.print("[WARN] config parse failed. Keeping previous values: ");
      Serial.println(error.c_str());
    } else {
      int nextThreshold = doc["threshold"] | threshold;
      int nextDuration = doc["duration"] | duration;

      if (nextThreshold > 0) {
        threshold = nextThreshold;
      } else {
        Serial.println("[WARN] invalid threshold from server. Keeping previous value.");
      }

      if (nextDuration > 0) {
        duration = nextDuration;
      } else {
        Serial.println("[WARN] invalid duration from server. Keeping previous value.");
      }

      Serial.printf("[OK] config applied: threshold=%d%%, duration=%dms\n", threshold, duration);
    }
  } else {
    logHttpResult("config fetch", code, body);
    Serial.printf("[INFO] keeping config: threshold=%d%%, duration=%dms\n", threshold, duration);
  }

  http.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(PUMP_PIN, OUTPUT);
  digitalWrite(PUMP_PIN, LOW);

  WiFiManager wm;
  // wm.resetSettings(); // Uncomment only when WiFi credentials must be cleared.
  wm.autoConnect("SmartOuting_AP");

  deviceId = getMacAddress();

  Serial.println();
  Serial.println("=================================");
  Serial.println("WiFi connected");
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());
  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());
  Serial.println("Device ID: " + deviceId);
  Serial.println("API base URL: " + String(BASE_URL));
  Serial.println("=================================");
  Serial.println();

  Wire.begin();
  dht.begin();
  lightMeter.begin();
  analogReadResolution(12);

  registerDevice();
  fetchDeviceConfig();
  lastConfigFetchTime = millis();
}

void loop() {
  unsigned long currentTime = millis();

  if (currentTime - lastConfigFetchTime >= CONFIG_FETCH_INTERVAL_MS) {
    lastConfigFetchTime = currentTime;
    fetchDeviceConfig();
  }

  if (currentTime - lastSendTime >= SENSOR_SEND_INTERVAL_MS) {
    lastSendTime = currentTime;

    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature();
    float illuminance = lightMeter.readLightLevel();
    int rawSoil = analogRead(SOIL_PIN);
    int soilPercent = map(rawSoil, dryValue, wetValue, 0, 100);
    soilPercent = constrain(soilPercent, 0, 100);

    if (isnan(humidity)) humidity = 0.0;
    if (isnan(temperature)) temperature = 0.0;
    if (illuminance < 0) illuminance = 0.0;

    if (soilPercent < threshold) {
      Serial.printf(
        "[PUMP] soil=%d%% < threshold=%d%%. Running pump for %dms.\n",
        soilPercent,
        threshold,
        duration
      );
      digitalWrite(PUMP_PIN, HIGH);
      delay(duration);
      digitalWrite(PUMP_PIN, LOW);
    }

    sendData(temperature, humidity, illuminance, soilPercent);
  }
}

void sendData(float temperature, float humidity, float illuminance, int soilMoisture) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WARN] data send skipped: WiFi is disconnected.");
    return;
  }

  WiFiClient plainClient;
  WiFiClientSecure secureClient;
  HTTPClient http;

  String url = buildUrl("/api/sensor/data");
  if (!beginHttp(http, plainClient, secureClient, url)) {
    Serial.println("[ERROR] data send failed: invalid URL.");
    return;
  }

  http.addHeader("Content-Type", "application/json");

  String json = "{\"deviceId\":\"" + deviceId + "\""
                + ",\"temperature\":" + String(temperature, 1)
                + ",\"humidity\":" + String(humidity, 1)
                + ",\"illuminance\":" + String(illuminance, 1)
                + ",\"soilMoisture\":" + String(soilMoisture)
                + "}";

  int code = http.POST(json);
  String body = http.getString();
  logHttpResult("sensor data send", code, body);

  if (code >= 200 && code < 300) {
    Serial.println(json);
  }

  http.end();
}
