#include <WiFi.h>
#include <WiFiManager.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <Wire.h>
#include <BH1750.h>

// --- 설정 및 핀 정의 ---
#define DHTPIN 4
#define DHTTYPE DHT22
#define SOIL_PIN 35
#define PUMP_PIN 18

// 서버 주소 (ngrok 주소 확인 필수)
const char* serverName = "https://unparticularising-lukas-superlaboriously.ngrok-free.dev/api/sensor/data";

unsigned long lastSendTime = 0;
const unsigned long interval = 10000; // 10초 주기

DHT dht(DHTPIN, DHTTYPE);
BH1750 lightMeter;

void setup() {
  Serial.begin(115200);

  pinMode(PUMP_PIN, OUTPUT);
  digitalWrite(PUMP_PIN, LOW);

  WiFiManager wm;
  wm.autoConnect("SmartOuting_AP");

  Serial.println("\n=================================");
  Serial.println("✅ 와이파이 연결 성공!");
  Serial.print("📡 연결된 공유기 이름(SSID): ");
  Serial.println(WiFi.SSID());           // 현재 연결된 와이파이 이름 출력
  Serial.print("🌐 ESP32의 IP 주소: ");
  Serial.println(WiFi.localIP());        // 공유기가 부여한 IP 주소 출력
  Serial.println("=================================\n");

  Wire.begin();
  dht.begin();
  lightMeter.begin();
  analogReadResolution(12);
}

void loop() {
  unsigned long currentTime = millis();

  // 10초마다 실행
  if (currentTime - lastSendTime >= interval) {
    lastSendTime = currentTime;

    // 1. 센서 데이터 읽기 및 보정
    float h = dht.readHumidity();
    float t = dht.readTemperature();
    float lux = lightMeter.readLightLevel();
    int rawSoil = analogRead(SOIL_PIN);
    int soilPercent = map(rawSoil, 2420, 820, 0, 100);
    soilPercent = constrain(soilPercent, 0, 100);

    if (isnan(h)) h = 0.0;
    if (isnan(t)) t = 0.0;
    if (lux < 0) lux = 0.0;

    // 2. [자동 실행] 10초마다 펌프 무조건 가동
    Serial.println("----------------------------------------");
    Serial.println("💧 [자동 실행] 펌프 가동 시작 (2초)");
    digitalWrite(PUMP_PIN, HIGH);
    delay(2000); // 2초간 물 주기
    digitalWrite(PUMP_PIN, LOW);
    Serial.println("🛑 [자동 실행] 급수 완료");

    // 3. 서버로 데이터 전송 (펌프가 방금 돌았으므로 pumpStatus는 "ON"으로 전송)
    sendDataWithPumpStatus(t, h, lux, soilPercent, "ON");
  }
}

// 데이터 전송 함수 (펌프 상태 포함)
void sendDataWithPumpStatus(float t, float h, float lux, int soil, String pumpStatus) {
  if(WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");

    // JSON 데이터 구성 (pumpStatus 필드 추가)
    String json = "{\"temperature\":" + String(t, 1) +
                  ",\"humidity\":" + String(h, 1) +
                  ",\"lux\":" + String(lux, 1) +
                  ",\"soilMoisture\":" + String(soil) +
                  ",\"pumpStatus\":\"" + pumpStatus + "\"}";

    int httpCode = http.POST(json);

    if (httpCode > 0) {
      Serial.printf("📡 [전송 성공] 코드: %d | 보낸 데이터: %s\n", httpCode, json.c_str());
    } else {
      Serial.printf("❌ [전송 실패] 에러: %s\n", http.errorToString(httpCode).c_str());
    }
    http.end();
  }
}