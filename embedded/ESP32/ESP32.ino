#include <WiFi.h>
#include <WiFiManager.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <Wire.h>
#include <BH1750.h>

// --- 핀 정의 ---
#define DHTPIN 4
#define DHTTYPE DHT22
#define SOIL_PIN 35
#define PUMP_PIN 18

// --- 서버 주소 ---
const char* BASE_URL = "https://mazelike-disposingly-zander.ngrok-free.dev";

// --- 기기 ID (MAC 주소 자동 설정) ---
String deviceId = "";

// --- 센서 영점(캘리브레이션) 값 설정 ---
int dryValue = 2200;  // 대기 중일 때
int wetValue = 680;   // 물에 담갔을 때

// --- 펌프 설정 (서버에서 받아올 값, 기본값) ---
int threshold = 30;     // 토양수분 임계값 (%)
int duration = 3000;    // 펌프 가동 시간 (ms)

unsigned long lastSendTime = 0;
const unsigned long interval = 10000;

DHT dht(DHTPIN, DHTTYPE);
BH1750 lightMeter;

// MAC 주소를 deviceId로 사용
String getMacAddress() {
  uint8_t mac[6];
  WiFi.macAddress(mac);
  char macStr[18];
  snprintf(macStr, sizeof(macStr), "%02X-%02X-%02X-%02X-%02X-%02X",
         mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  return String(macStr);
}

// 기기 등록
void registerDevice() {
  HTTPClient http;
  String url = String(BASE_URL) + "/api/sensor/device/register";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  String json = "{\"deviceId\":\"" + deviceId + "\"}";
  int code = http.POST(json);
  Serial.printf("기기 등록: %d\n", code);
  http.end();
}

// 서버에서 threshold/duration 받아오기
void fetchDeviceConfig() {
  HTTPClient http;
  String url = String(BASE_URL) + "/api/sensor/device/" + deviceId;
  http.begin(url);

  int code = http.GET();
  if (code == 200) {
    String body = http.getString();
    // 간단 파싱 (ArduinoJson 없이)
    int tIdx = body.indexOf("\"threshold\":") + 12;
    int dIdx = body.indexOf("\"duration\":") + 11;
    threshold = body.substring(tIdx, body.indexOf(",", tIdx)).toInt();
    duration  = body.substring(dIdx, body.indexOf(",", dIdx)).toInt();
    Serial.printf("threshold=%d, duration=%d\n", threshold, duration);
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(PUMP_PIN, OUTPUT);
  digitalWrite(PUMP_PIN, LOW);

  WiFiManager wm;
  //wm.resetSettings(); // 👈 [추가] 와이파이 기억을 전부 지워버리는 코드!
  wm.autoConnect("SmartOuting_AP");

  deviceId = getMacAddress();
// ---------------------------------------------------------
  // 💡 와이파이 연결 성공 후 정보 출력 (여기를 추가하세요!)
  Serial.println("\n=================================");
  Serial.println("✅ 와이파이 연결 성공!");
  Serial.print("📡 연결된 공유기 이름(SSID): ");
  Serial.println(WiFi.SSID());         // 👈 현재 연결된 와이파이 이름
  Serial.print("🌐 ESP32의 IP 주소: ");
  Serial.println(WiFi.localIP());      // 👈 공유기가 부여한 IP 주소
  Serial.println("🔑 내 기기 ID(MAC): " + deviceId);
  Serial.println("=================================\n");
  // ---------------------------------------------------------

  Wire.begin();
  dht.begin();
  lightMeter.begin();
  analogReadResolution(12);

  registerDevice();      // 전원 켜면 자동 등록
  fetchDeviceConfig();   // threshold/duration 받아오기
}

void loop() {
  unsigned long currentTime = millis();

  if (currentTime - lastSendTime >= interval) {
    lastSendTime = currentTime;

    // 센서 읽기
    float h = dht.readHumidity();
    float t = dht.readTemperature();
    float lux = lightMeter.readLightLevel();
    int rawSoil = analogRead(SOIL_PIN);
    int soilPercent = map(rawSoil, dryValue, wetValue, 0, 100);
    soilPercent = constrain(soilPercent, 0, 100);

    if (isnan(h)) h = 0.0;
    if (isnan(t)) t = 0.0;
    if (lux < 0) lux = 0.0;

    // 펌프 제어 (threshold 기반)
    if (soilPercent < threshold) {
      Serial.printf("토양 %d%% < 임계값 %d%% → 펌프 가동 %dms\n", soilPercent, threshold, duration);
      digitalWrite(PUMP_PIN, HIGH);
      delay(duration);
      digitalWrite(PUMP_PIN, LOW);
    }

    // 서버 전송
    sendData(t, h, lux, soilPercent);
  }
}

void sendData(float t, float h, float lux, int soil) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(BASE_URL) + "/api/sensor/data";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // 필드명 백엔드 DTO와 일치: illuminance (lux 아님)
  String json = "{\"deviceId\":\"" + deviceId + "\""
               // + ",\"plantId\":1"  // 👈 이 줄을 꼭 다시 넣어주세요!
                + ",\"temperature\":" + String(t, 1)
                + ",\"humidity\":" + String(h, 1)
                + ",\"illuminance\":" + String(lux, 1)
                + ",\"soilMoisture\":" + String(soil)
                + "}";

  int code = http.POST(json);
  if (code > 0) {
    Serial.printf("전송 성공: %d | %s\n", code, json.c_str());
  } else {
    Serial.printf("전송 실패: %s\n", http.errorToString(code).c_str());
  }
  http.end();
}