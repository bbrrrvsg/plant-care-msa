# plant-service 전체 정리

> 이 문서는 미래의 Claude에게 보여주기 위한 프로젝트 현황 정리입니다.
> plant-care-msa 프로젝트의 plant-service입니다.

---

## 프로젝트 기본 정보

- **포트:** (application.properties 확인 필요)
- **DB:** MySQL (`plantdb`)
- **서비스 디스커버리:** Eureka
- **MSA 통신:** OpenFeign (`sensor-service` 호출)

---

## 패키지 구조

```
com.sppkl.plant
├── PlantAppStart.java             (@SpringBootApplication, @EnableFeignClients, @EnableJpaAuditing)
├── client
│   └── SensorClient.java          (sensor-service Feign 클라이언트)
├── controller
│   ├── BookController.java        (식물 도감 API)
│   └── PlantController.java       (내 식물 API)
├── dto
│   ├── BookDto.java
│   ├── PlantRequestDto.java
│   ├── PlantResponseDto.java
│   └── PumpResponseDto.java       (threshold, duration - 향후 펌프 제어용)
├── Entity
│   ├── BaseTime.java              (@CreatedDate, @LastModifiedDate)
│   ├── BookEntity.java            (식물 도감)
│   └── PlantEntity.java           (내 식물)
├── repository
│   ├── BookRepository.java
│   └── PlantRepository.java
└── service
    ├── BookService.java           (농사로 공공 API 연동, 도감 조회)
    └── PlantService.java          (내 식물 CRUD + 센서 연결)
```

---

## 엔티티

### PlantEntity (테이블: plant)

| 필드 | 타입 | 설명 |
|------|------|------|
| myPlantId | Integer (PK, AUTO) | 내 식물 고유 ID |
| userId | String | 소유자 ID |
| speciesCode | Integer | 식물 종 코드 (plant_book 참조) |
| nickname | String | 내 식물 별명 |
| location | String | 위치 (거실, 베란다 등) |
| deviceId | String | 연결된 센서 기기 ID (없으면 null) |
| createdAt | LocalDateTime | (BaseTime) |
| updatedAt | LocalDateTime | (BaseTime) |

- `toDto(BookEntity book)` → PlantResponseDto 변환 (식물 이름, 이미지 book에서 가져옴)

### BookEntity (테이블: plant_book)

| 필드 | 타입 | 설명 |
|------|------|------|
| speciesCode | Integer (PK) | 식물 종 고유 코드 (농사로 API의 cntntsNo) |
| plantName | String | 식물 이름 (한국어) |
| watering | String | 물주기 정보 |
| sunlight | String | 햇빛 정보 |
| humidity | String | 습도 정보 |
| temperature | String | 온도 정보 |
| careLevel | String | 관리 난이도 |
| imageUrl | String(1000) | 식물 이미지 URL |

---

## API 목록

### 내 식물 (PlantController - /plant)

| 메서드 | URL | 설명 |
|--------|-----|------|
| GET | /plant?userId={userId} | 내 식물 전체 조회 |
| GET | /plant/{myPlantId} | 내 식물 단건 조회 |
| POST | /plant | 내 식물 등록 (기기 선택 시 센서 연결 포함) |
| PUT | /plant/{myPlantId} | 내 식물 수정 (nickname, location만) |
| DELETE | /plant/{myPlantId} | 내 식물 삭제 (연결 기기 있으면 자동 unlink) |

### 식물 도감 (BookController - /book)

| 메서드 | URL | 설명 |
|--------|-----|------|
| GET | /book | 도감 전체 조회 |
| GET | /book/{speciesCode} | 도감 단건 조회 (sensor-service Feign 호출용) |
| GET | /book/search?name={name} | 식물 이름 검색 (부분 일치) |

---

## 주요 흐름

### 식물 등록 흐름

```
앱 → POST /plant { userId, speciesCode, nickname, location, deviceId(선택), deviceName(선택) }

PlantService.addMyPlant()
1. PlantEntity DB 저장
2. dto.getDeviceId() != null 이면
   → Feign으로 PATCH /api/sensor/device/{deviceId}/link 호출
   → body: { plantId, userId, deviceName, speciesCode }
   → sensor-service에서 기기에 식물 정보 저장 + threshold/duration 계산
3. PlantResponseDto 반환 (plantName, imageUrl은 BookEntity에서 합쳐서 반환)
```

### 식물 삭제 흐름

```
DELETE /plant/{myPlantId}

PlantService.deleteMyPlant()
1. PlantEntity 조회
2. entity.getDeviceId() != null 이면
   → Feign으로 PATCH /api/sensor/device/{deviceId}/unlink 호출
   → sensor-service에서 기기의 plantId, userId, deviceName null 처리
3. DB에서 식물 삭제
```

---

## Feign 클라이언트

```java
// sensor-service 호출
@FeignClient(name = "sensor-service")
public interface SensorClient {

    // 식물 등록 시 기기 연결
    @PatchMapping("/api/sensor/device/{deviceId}/link")
    void linkDevice(@PathVariable String deviceId, @RequestBody Map<String, Object> body);

    // 식물 삭제 시 기기 연결 해제
    @PatchMapping("/api/sensor/device/{deviceId}/unlink")
    void unlinkDevice(@PathVariable String deviceId);
}
```

---

## 식물 도감 데이터 (BookService)

- 농사로 공공 API (`api.nongsaro.go.kr`)에서 데이터 가져와 DB 저장
- API 키는 `application.properties`의 `nongsaro.api.key`
- `DataLoader.java`에서 앱 시작 시 또는 수동으로 `fetchAndSave()` 호출
- speciesCode = 농사로 API의 `cntntsNo` 값

---

## DTO 구조

### PlantRequestDto

```java
String userId
Integer speciesCode
String nickname
String location
String deviceId      // 선택 (기기 연결 안 할 수도 있음)
String deviceName    // 선택
```

### PlantResponseDto

```java
Integer myPlantId
String userId
Integer speciesCode
String plantName     // BookEntity에서 가져옴
String imageUrl      // BookEntity에서 가져옴
String nickname
String location
String deviceId
LocalDateTime createdAt
LocalDateTime updatedAt
```

### PumpResponseDto

```java
int threshold   // 토양수분 임계값 (%) - 향후 활용 예정
int duration    // 펌프 가동 시간 (밀리초) - 향후 활용 예정
```

---

## 주의사항

- `PlantService.addMyPlant()`에서 `Map.of()` 대신 `HashMap` 사용 중 (Map.of는 null 허용 안 함)
- `speciesCode`는 AI 서비스 팀이 사진 분석 후 넘겨줄 예정 (현재는 앱에서 직접 입력)
- `updateMyPlant()`은 현재 nickname, location만 수정 가능 (기기 교체 로직 미구현)
