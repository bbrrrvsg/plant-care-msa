# 펌프 제어 로직

## 개요

펌프 제어 판단은 ESP32가 로컬에서 수행합니다.

백엔드는 `sensor_device` 테이블에 펌프 제어 설정값을 저장합니다.

- `threshold`: 토양 수분 임계값(%)
- `duration`: 펌프 작동 시간(ms)

식물과 기기가 연결되면 `sensor-service`가 식물 도감의 물주기 문구를 기준으로 `threshold`와 `duration`을 계산해 저장합니다. ESP32는 주기적으로 기기 상세 API를 호출해 최신 설정값을 받아 적용합니다.

## 펌웨어 위치

```text
sensor-service/src/main/java/com/sppkl/sensor/embedded/ESP32/ESP32.ino
```

펌웨어는 `ArduinoJson`을 사용하므로 Arduino IDE 또는 PlatformIO 환경에 `ArduinoJson` 라이브러리를 설치해야 합니다.

## 외부 연결

Gateway를 ngrok으로 노출합니다.

```bash
ngrok http 8080
```

ngrok이 발급한 HTTPS 주소를 `ESP32.ino`의 `BASE_URL`에 넣습니다.

ESP32는 다음 API를 호출합니다.

```text
POST /api/sensor/device/register
GET  /api/sensor/device/{deviceId}
POST /api/sensor/data
```

## 실행 흐름

```text
ESP32 부팅
  -> WiFiManager로 Wi-Fi 연결
  -> MAC 주소 기반 deviceId 생성
  -> POST /api/sensor/device/register
  -> GET /api/sensor/device/{deviceId}
       threshold, duration 수신
  -> 10초마다 DHT22, BH1750, 토양수분 센서 측정
  -> soilMoisture < threshold 이면
       ESP32가 펌프를 duration ms 동안 직접 작동
  -> POST /api/sensor/data
  -> 60초마다 threshold/duration 재조회
```

## 물주기 규칙 매핑

| 도감 물주기 문구 | Threshold | Duration | 의미 |
| --- | ---: | ---: | --- |
| 표면이 말랐을 때 | 30% | 3000 ms | 일반적인 급수 |
| 대부분 말랐을 때 | 15% | 5000 ms | 덜 자주, 더 충분한 급수 |
| 그 외 또는 알 수 없음 | 50% | 1000 ms | 보수적인 기본값 |

현재 이 값들은 `SensorDeviceService.watering()`에서 계산합니다.

## 주의사항

- 백엔드는 `POST /api/sensor/data` 응답으로 `{ "pump": true }`를 반환하지 않습니다.
- 백엔드는 센서 데이터를 수신하고 최신값/이력 저장만 담당합니다.
- ESP32가 최신 `threshold/duration` 설정값을 기준으로 펌프 작동 여부를 판단합니다.
- 기기는 등록됐지만 식물과 연결되지 않은 상태라면 센서 데이터 전송은 백엔드에서 거절됩니다. 펌웨어는 HTTP 응답을 로그로 출력하고 다음 주기에 다시 시도합니다.
