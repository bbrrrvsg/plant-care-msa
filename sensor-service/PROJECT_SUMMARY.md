# sensor-service 전체 정리

> 이 문서는 미래의 Claude에게 보여주기 위한 프로젝트 현황 정리입니다.
> plant-care-msa 프로젝트의 sensor-service입니다.

---

## 프로젝트 기본 정보

- **포트:** 8083
- **DB:** MySQL (`plantdb`)
- **캐시:** Redis (localhost:6379, Docker로 실행)
- **서비스 디스커버리:** Eureka (localhost:8761)
- **MSA 통신:** OpenFeign (`plant-service` 호출)

---

## 패키지 구조

```
com.sppkl.sensor
├── SersorAppStart.java           (@SpringBootApplication, @EnableJpaAuditing, @EnableScheduling, @EnableFeignClients)
├── client
│   └── PlantClient.java          (plant-service Feign 클라이언트)
├── controller
│   └── SensorController.java
├── dto
│   ├── BookDto.java               (plant-service에서 받아오는 식물 도감 DTO)
│   ├── SensorDataDto.java
│   └── SensorDeviceDto.java
├── entity
│   ├── BaseTime.java              (@CreatedDate, @LastModifiedDate)
│   ├── SensorDataEntity.java      (시간별 평균 데이터 DB 저장용)
│   └── SensorDeviceEntity.java    (ESP32 기기 등록용)
├── repository
│   ├── SensorDataRepository.java
│   └── SensorDeviceRepository.java
└── service
    ├── SensorDataService.java     (Redis 저장, 시간별 평균, 기기 상태 체크 스케줄러)
    └── SensorDeviceService.java   (기기 등록/연결/해제/비활성화)
```

---

## 엔티티

### SensorDeviceEntity (테이블: sensor_device)

| 필드 | 타입 | 설명 |
|------|------|------|
| deviceId | String (PK) | ESP32 MAC주소 또는 UUID |
| deviceName | String | 사용자가 지정한 기기 별명 (연결 전 null) |
| plantId | Integer | 연결된 식물 ID (연결 전 null) |
| userId | String | 기기 소유자 ID (연결 전 null) |
| active | boolean | 기기 활성 여부 |
| threshold | int | 토양수분 임계값 (%) - 펌프 가동 기준 |
| duration | int | 펌프 가동 시간 (밀리초) |
| createdAt | LocalDateTime | (BaseTime) |
| updatedAt | LocalDateTime | (BaseTime) |

### SensorDataEntity (테이블: sensor_data)

| 필드 | 타입 | 설명 |
|------|------|------|
| sensorDataId | Long (PK, AUTO) | |
| plantId | Integer | 측정 대상 식물 ID |
| temperature | BigDecimal(5,2) | 온도 평균 (°C) |
| humidity | BigDecimal(5,2) | 공기 습도 평균 (%) |
| soilMoisture | BigDecimal(5,2) | 토양 수분 평균 (%) |
| illuminance | BigDecimal(7,2) | 조도 평균 (lux) |
| recordTime | LocalDateTime | 저장 기준 시각 (시간 단위) |

---

## API 목록

### 기기 관련

| 메서드 | URL | 설명 |
|--------|-----|------|
| POST | /api/sensor/device/register | ESP32 전원 켜면 자동 호출, deviceId만 등록 |
| PATCH | /api/sensor/device/{deviceId}/name | 기기 별명 설정 |
| PATCH | /api/sensor/device/{deviceId}/link | 식물 연결 (앱에서 기기 선택 시 호출) |
| PATCH | /api/sensor/device/{deviceId}/unlink | 식물 연결 해제 |
| PATCH | /api/sensor/device/{deviceId}/deactivate | 기기 비활성화 |
| GET | /api/sensor/device/{deviceId} | 기기 상세 조회 (ESP32가 threshold/duration 받아가는 용도) |
| GET | /api/sensor/device/unlinked | 미연결 + 활성 기기 목록 (앱에서 기기 선택 목록) |

### 센서 데이터 관련

| 메서드 | URL | 설명 |
|--------|-----|------|
| POST | /api/sensor/data | ESP32 센서 데이터 수신 → Redis 저장 |
| GET | /api/sensor/data/{plantId} | 식물의 최신 센서값 조회 (Redis) |

---

## 주요 흐름

### 기기 등록 ~ 식물 연결 흐름

```
1. ESP32 전원 ON
   → POST /api/sensor/device/register { "deviceId": "AA:BB:CC:DD:EE:FF" }
   → DB에 deviceId만 저장, active=true, 나머지 null

2. 앱에서 미연결 기기 목록 조회
   → GET /api/sensor/device/unlinked
   → plantId=null && active=true 인 기기 목록 반환

3. 사용자가 식물 등록 시 기기 선택
   → plant-service POST /plant { userId, speciesCode, nickname, location, deviceId, deviceName }
   → plant-service 내부에서 Feign으로 PATCH /api/sensor/device/{deviceId}/link 호출
   → sensor-service: plantId, userId, deviceName 저장 + watering() 실행

4. watering() 로직
   → plant-service의 GET /book/{speciesCode} 호출 (Feign)
   → watering 텍스트 분석:
      "표면이 말랐을때" → threshold=30, duration=3000ms
      "대부분 말랐을때" → threshold=15, duration=5000ms
      그 외               → threshold=50, duration=1000ms
```

### 센서 데이터 흐름

```
1. ESP32가 주기적으로 데이터 전송
   → POST /api/sensor/data { deviceId, temperature, humidity, soilMoisture, illuminance }
   → Redis sensor:latest:{plantId} 저장 (TTL 10분)
   → Redis sensor:list:{plantId} 리스트에 누적 (TTL 70분)

2. 앱에서 실시간 조회
   → GET /api/sensor/data/{plantId}
   → Redis sensor:latest:{plantId} 반환

3. 매 시간 정각 스케줄러 (@Scheduled cron="0 0 * * * *")
   → sensor:list:{plantId} 에서 1시간치 평균 계산
   → SensorDataEntity DB 저장 (AI 진단 히스토리용)
   → 리스트 초기화

4. 5분마다 기기 상태 체크 (@Scheduled cron="0 */5 * * * *")
   → active=true && plantId!=null 인 기기 조회
   → sensor:latest:{plantId} 없으면 (TTL 만료) → active=false
   → ESP32 꺼진 것으로 판단
```

### 식물 삭제 시

```
plant-service deleteMyPlant()
→ entity.getDeviceId() != null 이면
→ Feign으로 PATCH /api/sensor/device/{deviceId}/unlink 호출
→ sensor-service: plantId, userId, deviceName null, threshold/duration 0으로 초기화
```

---

## Redis 키 구조

| 키 | 타입 | TTL | 용도 |
|----|------|-----|------|
| sensor:latest:{plantId} | String (JSON) | 10분 | 앱 실시간 조회용 |
| sensor:list:{plantId} | List (JSON[]) | 70분 | 시간별 평균 계산용 |

---

## Feign 클라이언트

```java
// plant-service의 식물 도감 조회
@FeignClient(name = "plant-service")
public interface PlantClient {
    @GetMapping("/book/{speciesCode}")
    BookDto getBook(@PathVariable Integer speciesCode);
}
```

---

## 의존성 (build.gradle)

```
spring-boot-starter-data-jpa
spring-boot-starter-webmvc
spring-cloud-starter-netflix-eureka-client
spring-cloud-starter-openfeign
spring-boot-starter-data-redis
lombok
mysql-connector-j
```

---

## application.properties

```properties
server.port=8083
spring.application.name=sensor-service
eureka.client.service-url.defaultZone=http://localhost:8761/eureka/
spring.datasource.url=jdbc:mysql://localhost:3306/plantdb
spring.datasource.username=root
spring.datasource.password=1234
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.data.redis.host=localhost
spring.data.redis.port=6379
```

---

## 미구현 / 추후 고려사항

- ESP32가 갑자기 꺼질 경우 deactivate는 TTL 만료로 5분 후 자동 처리됨 (즉시 감지 아님)
- ESP32 코드에서 전원 ON 시 GET /api/sensor/device/{deviceId} 로 threshold/duration 받아가야 함
- 식물 교체 시 프론트에서 연결 해제 버튼 필요
