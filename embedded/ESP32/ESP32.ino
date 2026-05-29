/* =============================================================================
 *  스마트 화분 (Smart Pot) - ESP32 펌웨어
 * =============================================================================
 *  하드웨어: ESP32-WROOM-32E + DHT22 + BH1750(I2C) + 정전식 토양수분센서 + 릴레이 + DC펌프
 *  기능: 센서 측정 -> 서버 전송 / 서버 설정 수신 / 자동·수동 급수
 *
 *  [모듈 구성]   (파일은 하나지만 아래 섹션으로 논리 분리)
 *    0) CONFIG        - 핀, 상수, 캘리브레이션, 릴레이 트리거 설정
 *    1) GLOBALS       - 전역 상태 변수, 객체
 *    2) NETWORK/HTTP  - WiFi, HTTP 헬퍼 (http/https 분기, URL 빌드)
 *    3) DEVICE        - MAC 기반 deviceId, 서버 등록
 *    4) PUMP          - 비블로킹 펌프 제어 + 급수 쿨다운
 *    5) SERVER SYNC   - 설정 수신(fetchDeviceConfig) / 센서 전송(sendData)
 *    6) SENSORS       - 센서 읽기 + 토양수분 환산
 *    7) SETUP / LOOP  - 초기화 및 메인 루프
 * ============================================================================= */

#include <WiFi.h>
#include <WiFiClient.h>
#include <WiFiClientSecure.h>
#include <WiFiManager.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>
#include <BH1750.h>

/* =============================================================================
 *  [0] CONFIG  - 여기만 바꾸면 대부분의 동작을 조정할 수 있습니다.
 * ============================================================================= */

// --- 핀 배치 ---
#define DHTPIN        4      // DHT22 데이터
#define DHTTYPE       DHT22
#define SOIL_PIN      35     // 토양수분 AOUT (ADC1, 입력전용 핀)
#define PUMP_PIN      18     // 릴레이 IN

// --- 릴레이 트리거 설정 ---
// SRD-05VDC 계열은 LOW 트리거인 경우가 많습니다.
// 펌프가 평소 켜져 있고 신호를 주면 꺼진다면, 아래를 false로 바꾸세요.
#define RELAY_ACTIVE_HIGH  true

// --- 서버 주소 ---
// gateway-service:8080 을 ngrok으로 노출한 HTTPS 주소를 붙여넣으세요.
const char* BASE_URL = "https://defacing-ion-reliance.ngrok-free.dev";

// --- 펌프 기본값 (서버 설정이 우선 적용됨) ---
const int DEFAULT_THRESHOLD = 30;     // 자동 급수 기준 토양수분(%)
const int DEFAULT_DURATION  = 3000;   // 급수 시간(ms)

// --- 토양수분 캘리브레이션 (12bit ADC: 0~4095) ---
// dryValue = 공기 중(가장 건조) 측정값, wetValue = 물에 담갔을 때 값.
int dryValue = 2200;
int wetValue = 680;

// --- 주기 설정 ---
const unsigned long SENSOR_SEND_INTERVAL_MS = 10000;  // 센서 전송 주기
const unsigned long CONFIG_FETCH_INTERVAL_MS = 5000;  // 설정 폴링 주기(수동 급수 반응성)

// --- 급수 쿨다운 (과습 방지) ---
// 한 번 급수하면 이 시간 동안은 자동 재급수를 막습니다.
// 흙이 젖어 센서값에 반영되기까지의 지연을 흡수합니다.
const unsigned long PUMP_COOLDOWN_MS = 60000;  // 60초

/* =============================================================================
 *  [1] GLOBALS  - 전역 상태
 * ============================================================================= */

String deviceId = "";

// 서버에서 받아오는 펌프 설정
int threshold = DEFAULT_THRESHOLD;
int duration  = DEFAULT_DURATION;

// 주기 타이머
unsigned long lastSendTime        = 0;
unsigned long lastConfigFetchTime = 0;

// 펌프 비블로킹 상태
bool          pumpRunning  = false;  // 현재 펌프 가동 중인지
unsigned long pumpEndTime  = 0;      // 펌프를 꺼야 할 시각(millis)
unsigned long lastWaterTime = 0;     // 마지막 급수 시각(쿨다운 계산용)
bool          wateredBefore = false; // 한 번이라도 급수했는지(쿨다운 최초 동작 보정)
bool          ackPending    = false; // 수동 급수 후 서버에 ack 보낼지

DHT dht(DHTPIN, DHTTYPE);
BH1750 lightMeter;

/* =============================================================================
 *  [2] NETWORK / HTTP  - WiFi 및 HTTP 공통 헬퍼
 * ============================================================================= */

// http/https URL에 따라 적절한 클라이언트로 연결을 시작합니다.
bool beginHttp(HTTPClient& http, WiFiClient& plainClient, WiFiClientSecure& secureClient, const String& url) {
  if (url.startsWith("https://")) {
    // ngrok은 HTTPS. 데모용으로 ESP32에서는 인증서 검증을 생략합니다.
    secureClient.setInsecure();
    return http.begin(secureClient, url);
  }
  return http.begin(plainClient, url);
}

// BASE_URL 끝의 슬래시를 정리하고 path를 붙여 완전한 URL을 만듭니다.
String buildUrl(const String& path) {
  String base = String(BASE_URL);
  if (base.endsWith("/")) {
    base.remove(base.length() - 1);
  }
  return base + path;
}

// HTTP 결과를 사람이 읽기 쉽게 시리얼에 출력합니다.
void logHttpResult(const char* label, int code, const String& body) {
  if (code >= 200 && code < 300) {
    Serial.printf("[OK] %s: HTTP %d\n", label, code);
    return;
  }
  if (code == 404) {
    Serial.printf("[WARN] %s: HTTP 404. 서버에 디바이스가 등록되지 않았습니다.\n", label);
  } else if (code >= 400 && code < 500) {
    Serial.printf("[WARN] %s: HTTP %d. 서버가 요청을 거부했습니다.\n", label, code);
  } else if (code >= 500) {
    Serial.printf("[ERROR] %s: HTTP %d. 서버 오류 또는 디바이스 미연동/비활성.\n", label, code);
  } else if (code <= 0) {
    Serial.printf("[ERROR] %s: 요청 실패: %s\n", label, HTTPClient::errorToString(code).c_str());
  } else {
    Serial.printf("[WARN] %s: 예상치 못한 HTTP %d\n", label, code);
  }
  if (body.length() > 0) {
    Serial.println(body);
  }
}

/* =============================================================================
 *  [3] DEVICE  - 디바이스 식별 및 등록
 * ============================================================================= */

// MAC 주소를 XX-XX-XX-XX-XX-XX 형식의 고유 deviceId로 변환합니다.
String getMacAddress() {
  uint8_t mac[6];
  WiFi.macAddress(mac);
  char macStr[18];
  snprintf(macStr, sizeof(macStr), "%02X-%02X-%02X-%02X-%02X-%02X",
           mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  return String(macStr);
}

// 서버에 이 디바이스를 등록합니다.
void registerDevice() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WARN] 디바이스 등록 건너뜀: WiFi 연결 끊김.");
    return;
  }

  WiFiClient plainClient;
  WiFiClientSecure secureClient;
  HTTPClient http;

  String url = buildUrl("/api/sensor/device/register");
  if (!beginHttp(http, plainClient, secureClient, url)) {
    Serial.println("[ERROR] 디바이스 등록 실패: 잘못된 URL.");
    return;
  }

  http.addHeader("Content-Type", "application/json");
  String json = "{\"deviceId\":\"" + deviceId + "\"}";
  int code = http.POST(json);
  String body = http.getString();
  logHttpResult("device register", code, body);
  http.end();
}

/* =============================================================================
 *  [4] PUMP  - 비블로킹 펌프 제어 + 급수 쿨다운
 * ----------------------------------------------------------------------------
 *  핵심: delay()를 쓰지 않습니다. startPump()로 켜고, updatePump()가 loop에서
 *  시간을 보고 끕니다. 그래서 펌프가 도는 동안에도 WiFi·폴링이 멈추지 않습니다.
 * ============================================================================= */

// 릴레이 트리거 방향을 반영해 펌프를 켜고 끕니다.
void setPumpOutput(bool on) {
  bool level = RELAY_ACTIVE_HIGH ? on : !on;
  digitalWrite(PUMP_PIN, level ? HIGH : LOW);
}

// 쿨다운 중인지 확인합니다. (한 번도 급수 안 했으면 쿨다운 아님)
bool inCooldown() {
  if (!wateredBefore) return false;
  return (millis() - lastWaterTime) < PUMP_COOLDOWN_MS;
}

// 급수를 시작합니다(비블로킹). 이미 가동 중이거나 쿨다운이면 무시.
// force=true(수동 급수)는 쿨다운을 무시하고 강제 급수합니다.
void startPump(int durationMs, const char* reason, bool force) {
  if (pumpRunning) {
    Serial.println("[PUMP] 이미 가동 중이라 요청 무시.");
    return;
  }
  if (!force && inCooldown()) {
    unsigned long remain = (PUMP_COOLDOWN_MS - (millis() - lastWaterTime)) / 1000;
    Serial.printf("[PUMP] 쿨다운 중(%lus 남음). 자동 급수 보류.\n", remain);
    return;
  }

  Serial.printf("[PUMP] %s. %dms 동안 급수 시작.\n", reason, durationMs);
  pumpRunning  = true;
  pumpEndTime  = millis() + durationMs;
  setPumpOutput(true);
}

// loop마다 호출. 급수 시간이 끝났으면 펌프를 끕니다.
void updatePump() {
  if (pumpRunning && millis() >= pumpEndTime) {
    setPumpOutput(false);
    pumpRunning   = false;
    lastWaterTime = millis();
    wateredBefore = true;
    Serial.println("[PUMP] 급수 종료.");
  }
}

/* =============================================================================
 *  [5] SERVER SYNC  - 설정 수신 / 센서 전송
 * ============================================================================= */

// 수동 급수 완료를 서버에 알립니다.
void ackPump() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WARN] pump ack 건너뜀: WiFi 연결 끊김.");
    return;
  }

  WiFiClient plainClient;
  WiFiClientSecure secureClient;
  HTTPClient http;

  String url = buildUrl("/api/sensor/device/" + deviceId + "/pump/ack");
  if (!beginHttp(http, plainClient, secureClient, url)) {
    Serial.println("[ERROR] pump ack 실패: 잘못된 URL.");
    return;
  }

  http.addHeader("Content-Type", "application/json");
  int code = http.POST("");
  String body = http.getString();
  logHttpResult("pump ack", code, body);
  http.end();
}

// 서버에서 threshold/duration/pumpRequested 설정을 받아옵니다.
void fetchDeviceConfig() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WARN] 설정 수신 건너뜀: WiFi 연결 끊김.");
    return;
  }

  WiFiClient plainClient;
  WiFiClientSecure secureClient;
  HTTPClient http;

  String url = buildUrl("/api/sensor/device/" + deviceId);
  if (!beginHttp(http, plainClient, secureClient, url)) {
    Serial.println("[ERROR] 설정 수신 실패: 잘못된 URL.");
    return;
  }

  int code = http.GET();
  String body = http.getString();

  if (code == 200) {
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, body);

    if (error) {
      Serial.print("[WARN] 설정 파싱 실패. 이전 값 유지: ");
      Serial.println(error.c_str());
    } else {
      int  nextThreshold = doc["threshold"] | threshold;
      int  nextDuration  = doc["duration"]  | duration;
      bool pumpRequested = doc["pumpRequested"] | false;

      if (nextThreshold > 0) threshold = nextThreshold;
      else Serial.println("[WARN] 서버 threshold 비정상. 이전 값 유지.");

      if (nextDuration > 0) duration = nextDuration;
      else Serial.println("[WARN] 서버 duration 비정상. 이전 값 유지.");

      Serial.printf("[OK] 설정 적용: threshold=%d%%, duration=%dms, pumpRequested=%d\n",
                    threshold, duration, pumpRequested ? 1 : 0);

      // 수동 급수 요청: 쿨다운 무시(force), 완료되면 ack는 updatePump 종료 후 처리.
      if (pumpRequested && !pumpRunning) {
        startPump(duration, "앱에서 수동 급수 요청", true);
        ackPending = true;
      }
    }
  } else {
    logHttpResult("config fetch", code, body);
    Serial.printf("[INFO] 설정 유지: threshold=%d%%, duration=%dms\n", threshold, duration);
  }

  http.end();
}

// 측정한 센서값을 서버로 전송합니다.
void sendData(float temperature, float humidity, float illuminance, int soilMoisture) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WARN] 데이터 전송 건너뜀: WiFi 연결 끊김.");
    return;
  }

  WiFiClient plainClient;
  WiFiClientSecure secureClient;
  HTTPClient http;

  String url = buildUrl("/api/sensor/data");
  if (!beginHttp(http, plainClient, secureClient, url)) {
    Serial.println("[ERROR] 데이터 전송 실패: 잘못된 URL.");
    return;
  }

  http.addHeader("Content-Type", "application/json");
  String json = "{\"deviceId\":\"" + deviceId + "\""
                + ",\"temperature\":" + String(temperature, 1)
                + ",\"humidity\":"    + String(humidity, 1)
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

/* =============================================================================
 *  [6] SENSORS  - 센서 읽기
 * ============================================================================= */

// 토양수분 ADC 원시값을 0~100%로 환산합니다.
int readSoilPercent() {
  int raw = analogRead(SOIL_PIN);
  int pct = map(raw, dryValue, wetValue, 0, 100);
  return constrain(pct, 0, 100);
}

/* =============================================================================
 *  [7] SETUP / LOOP
 * ============================================================================= */

void setup() {
  Serial.begin(115200);

  // 펌프 출력 초기화 (시작 시 OFF)
  pinMode(PUMP_PIN, OUTPUT);
  setPumpOutput(false);

  // WiFi: 최초엔 SmartOuting_AP 로 설정, 이후 자동 접속
  WiFiManager wm;
  // wm.resetSettings(); // WiFi 정보를 지워야 할 때만 주석 해제
  wm.autoConnect("SmartOuting_AP");

  deviceId = getMacAddress();

  Serial.println();
  Serial.println("=================================");
  Serial.println("WiFi connected");
  Serial.print("SSID: ");      Serial.println(WiFi.SSID());
  Serial.print("ESP32 IP: ");  Serial.println(WiFi.localIP());
  Serial.println("Device ID: " + deviceId);
  Serial.println("API base URL: " + String(BASE_URL));
  Serial.println("=================================");
  Serial.println();

  // 센서 초기화
  Wire.begin();          // I2C (SDA=21, SCL=22)
  dht.begin();
  lightMeter.begin();
  analogReadResolution(12);

  // 서버 등록 및 최초 설정 수신
  registerDevice();
  fetchDeviceConfig();
  lastConfigFetchTime = millis();
}

void loop() {
  unsigned long now = millis();

  // (A) 펌프 상태 갱신 - 매 루프 확인 (비블로킹의 핵심)
  updatePump();

  // 수동 급수가 끝났으면 서버에 ack 전송
  if (ackPending && !pumpRunning) {
    ackPending = false;
    ackPump();
  }

  // (B) 설정 폴링 - 수동 급수 버튼 반응성 확보
  if (now - lastConfigFetchTime >= CONFIG_FETCH_INTERVAL_MS) {
    lastConfigFetchTime = now;
    fetchDeviceConfig();
  }

  // (C) 센서 측정 + 전송 + 자동 급수 판단
  if (now - lastSendTime >= SENSOR_SEND_INTERVAL_MS) {
    lastSendTime = now;

    float humidity    = dht.readHumidity();
    float temperature = dht.readTemperature();
    float illuminance = lightMeter.readLightLevel();
    int   soilPercent = readSoilPercent();

    // 읽기 실패 보정
    if (isnan(humidity))    humidity = 0.0;
    if (isnan(temperature)) temperature = 0.0;
    if (illuminance < 0)    illuminance = 0.0;

    // 자동 급수: 임계값 미만이고, 가동 중 아니고, 쿨다운 아닐 때만
    if (soilPercent < threshold) {
      char reason[64];
      snprintf(reason, sizeof(reason), "soil=%d%% < threshold=%d%%", soilPercent, threshold);
      startPump(duration, reason, false);  // force=false -> 쿨다운 적용
    }

    sendData(temperature, humidity, illuminance, soilPercent);
  }
}
