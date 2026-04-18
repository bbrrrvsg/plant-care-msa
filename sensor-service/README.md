# Sensor Service

## 개요
ESP32 센서 기기 등록 및 실시간 센서 데이터 수신을 담당하는 서비스

- 포트: `8083`
- DB: MySQL (`plantdb`)
- 실시간 데이터: Redis (TTL 10분)
- 히스토리 데이터: 매 시간 정각 평균값 DB 저장

---

## 데이터 흐름

```
ESP32 전원 켬 → /device/register 자동 호출 → DB 등록
사용자가 앱에서 기기 별명 설정 → /device/{id}/name
식물 등록 시 기기 선택 → /device/{id}/link (plant-service에서 호출)

ESP32 센서 데이터 전송 → /data → Redis 저장
매 시간 정각 스케줄러 → Redis 최신값 → DB 평균값 저장
```

---

## API 목록

### 기기 관련

| Method | URL | 설명 |
|--------|-----|------|
| POST | `/api/sensor/device/register` | ESP32 기기 자동 등록 |
| PATCH | `/api/sensor/device/{deviceId}/name` | 기기 별명 설정 |
| PATCH | `/api/sensor/device/{deviceId}/link` | 식물 연결 |
| GET | `/api/sensor/device/unlinked?userId=` | 미연결 기기 목록 조회 |
| PATCH | `/api/sensor/device/{deviceId}/deactivate` | 기기 비활성화 |

### 센서 데이터 관련

| Method | URL | 설명 |
|--------|-----|------|
| POST | `/api/sensor/data` | ESP32 센서 데이터 수신 |
| GET | `/api/sensor/data/{plantId}` | 식물 최신 센서값 조회 (Redis) |

---

## 샘플 요청

### 1. 기기 등록 (ESP32 자동 호출)
```json
POST /api/sensor/device/register

{
  "deviceId": "AA:BB:CC:DD:EE:FF",
  "userId": "user1"
}
```

### 2. 기기 별명 설정
```json
PATCH /api/sensor/device/AA:BB:CC:DD:EE:FF/name

{
  "deviceName": "거실 센서"
}
```

### 3. 식물 연결 (plant-service에서 호출)
```json
PATCH /api/sensor/device/AA:BB:CC:DD:EE:FF/link

{
  "plantId": 1
}
```

### 4. 미연결 기기 목록 조회
```
GET /api/sensor/device/unlinked?userId=user1

응답:
[
  {
    "deviceId": "AA:BB:CC:DD:EE:FF",
    "deviceName": "거실 센서",
    "plantId": null,
    "userId": "user1",
    "active": true
  }
]
```

### 5. 센서 데이터 수신 (ESP32 호출)
```json
POST /api/sensor/data

{
  "deviceId": "AA:BB:CC:DD:EE:FF",
  "temperature": 25.30,
  "humidity": 60.50,
  "soilMoisture": 45.20,
  "illuminance": 1200.00
}
```

### 6. 최신 센서값 조회
```
GET /api/sensor/data/1

응답:
{
  "plantId": 1,
  "temperature": 25.30,
  "humidity": 60.50,
  "soilMoisture": 45.20,
  "illuminance": 1200.00,
  "recordTime": "2026-04-16T14:00:00"
}
```

---

## 테스트 방법

### 환경 준비
1. MySQL 실행 후 `plantdb` 데이터베이스 생성
2. Redis 실행 (`localhost:6379`)
3. `discovery-service` 먼저 실행
4. `sensor-service` 실행

### Postman 테스트 순서
1. 기기 등록 → `POST /api/sensor/device/register`
2. 별명 설정 → `PATCH /api/sensor/device/{deviceId}/name`
3. 식물 연결 → `PATCH /api/sensor/device/{deviceId}/link`
4. 센서 데이터 전송 → `POST /api/sensor/data`
5. 최신값 조회 → `GET /api/sensor/data/{plantId}`

### 에러 케이스 확인
- 미등록 기기로 데이터 전송 시 → `RuntimeException: 등록되지 않은 기기입니다.`
- 비활성화된 기기로 데이터 전송 시 → `RuntimeException: 비활성화된 기기입니다.`
- 식물 미연결 기기로 데이터 전송 시 → `RuntimeException: 식물과 연결되지 않은 기기입니다.`
- Redis에 데이터 없는 식물 조회 시 → `204 No Content`
