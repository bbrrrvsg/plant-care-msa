# CLAUDE.md

이 파일은 Claude Code가 이 레포에서 작업할 때 가장 먼저 읽는 컨텍스트 문서입니다.

## 프로젝트 개요

**PlantCare** — 식물 관리 앱.
ESP32 센서로 식물 환경 모니터링 + Gemini AI 진단 + 성장 일지 기록.

- **팀:** SPPKL (5인, Java/Spring + RN)
- **목적:** 학교 프로젝트 (시연 + 보고서)

## 기술 스택

### 백엔드 (Java 17, Spring Boot 3.4.5, Spring Cloud 2024.0.1)
MSA 구조. 6개 서비스 + 1개 공통 모듈.

| 서비스 | 포트 | 역할 |
|---|---|---|
| discovery-service | 8761 | Eureka 서버 |
| gateway-service | 8080 | Spring Cloud Gateway (라우팅, CORS) |
| user-service (auth-service) | 8081 | 회원가입/로그인, JWT 발급 |
| plant-service | 8082 | 내 식물 CRUD, 식물 도감(농사로 API), 성장 일지 |
| sensor-service | 8083 | ESP32 기기 등록, 센서 데이터(Redis), 시간별 평균(MySQL), 펌프 임계값 |
| ai-service | 8084 | Gemini API 진단, 이미지로 식물 종 식별 |

- **DB:** MySQL 8 (`plantcare` 스키마, 모든 서비스 공유)
- **캐시:** Redis 7 (sensor-service 실시간 데이터)
- **서비스 간 통신:** OpenFeign (Eureka 기반 로드밸런싱)
- **인프라:** `docker-compose.yml` (Redis + MySQL만)

### 프론트엔드 (Expo 54, React Native 0.81, TypeScript)
`frontend/` 디렉토리.

- **라우팅:** React Navigation 7 (native-stack + bottom-tabs)
- **HTTP:** axios + Bearer 토큰 자동 주입
- **인증 저장소:** expo-secure-store
- **아이콘:** lucide-react-native, @expo/vector-icons

## 디렉토리 구조

```
plant-care-msa/
├── build.gradle              # 루트 (Spring Boot 3.4.5, Spring Cloud 2024.0.1)
├── settings.gradle           # 7개 모듈 포함
├── docker-compose.yml        # Redis + MySQL
├── docs/setup.md             # 환경 세팅 가이드
├── common/                   # 공유 DTO (BookDto, SensorDataDto, AIDiagnosisDto 등)
├── discovery-service/
├── gateway-service/
├── user-service/             # spring.application.name=auth-service 라우팅 주의
├── plant-service/
├── sensor-service/
├── ai-service/
└── frontend/                 # Expo 앱
    ├── App.tsx               # 루트 네비게이터 (RootStackParamList, MainTabParamList)
    ├── services/api.ts       # 모든 API 호출 + 토큰 관리
    ├── theme.ts              # Colors, Spacing, BorderRadius, FontSize
    ├── components/
    │   ├── screens/          # 16개 화면
    │   └── shared/           # PlantCard, SensorWidget, StatusChip 등
    ├── lib/                  # diaryStore, sensorStore (메모리 저장소, TODO: API화)
    └── types/index.ts
```

## 실행 방법

### 백엔드
```bash
# 1. 인프라
docker compose up -d        # Redis, MySQL

# 2. 환경변수 설정 (필수): DB_PASSWORD, GEMINI_API_KEY, NONGSARO_API_KEY, OPENWEATHER_API_KEY, JWT_SECRET
#    application.properties 는 팀 공유 설정으로 추적됨 (`${VAR:default}` 패턴).
#    개인 환경 오버라이드가 필요하면 application-secret.properties 로.

# 3. 순서대로 실행 (IntelliJ Gradle Run, 또는 ./gradlew :discovery-service:bootRun)
discovery-service -> gateway-service -> user/plant/sensor/ai
```

### 프론트엔드
```bash
cd frontend
cp .env.example .env        # EXPO_PUBLIC_API_BASE_URL_DEVICE에 PC LAN IP 입력
npm install
npm run web                 # 또는 npm start (모바일)
```

## 코딩 컨벤션

### 커밋 메시지
- `feat : 짧은 설명` — 새 기능
- `fix : 짧은 설명` — 버그
- 형식: `타입 : 설명` (콜론 앞뒤 공백)

### Java
- Lombok 사용 (`@Data`, `@Builder`, `@RequiredArgsConstructor`)
- Entity는 `toDto()` 메서드로 변환
- Feign 클라이언트는 `client/` 패키지
- 예외는 `RuntimeException` 사용 중 (user-service만 커스텀 예외 + `@RestControllerAdvice`)

### TypeScript / React Native
- 화면 컴포넌트는 `function ComponentName()` named export
- StyleSheet.create로 분리, 변수명은 `styles` 또는 `s` (혼용 중)
- 네비게이션 타입은 `App.tsx`의 `RootStackParamList`, `MainTabParamList` 참조
- API는 `services/api.ts`의 `authApi`, `plantApi`, `bookApi`, `sensorApi`, `aiApi` 통해서만 호출

### 색상 / 디자인
- 기본 초록: `#3a7d44` (primary)
- 라이트 그린: `#7CCB8A`
- 다크 그린: `#2d5a27` (버튼)
- 배경: `#f5f5f0` (메인), `#F9FAFB` (서브)
- `theme.ts`의 토큰 우선 사용 권장 (일부 화면은 하드코딩 중)

## 데이터 흐름 핵심

### 식물 등록 (멀티파트)
```
앱 POST /plant (image, userId, nickname, deviceId?)
 → plant-service: image 있으면 ai-service로 식물 종 자동 식별 → speciesCode 매핑
 → PlantEntity 저장
 → deviceId 있으면 sensor-service에 PATCH /device/{id}/link (plantId, speciesCode 포함)
 → sensor-service: watering 텍스트로 threshold/duration 계산해서 저장
```

### 센서 데이터
```
ESP32 → POST /api/sensor/data (deviceId, 측정값)
 → Redis sensor:latest:{plantId} (TTL 10분)
 → Redis sensor:list:{plantId} (TTL 70분, 평균 계산용)

매시간 정각 스케줄러 → list 평균 → MySQL sensor_data 저장 (AI 진단 히스토리)
5분마다 → TTL 만료 기기는 active=false 자동 전환
```

### AI 진단
```
앱 POST /ai/gemini (image, plantId)
 → ai-service: plant-service에서 센서 데이터 조회 (Feign)
 → Gemini 2.5 Flash 호출, 이미지+센서 함께 프롬프트
 → 제목/소제목/내용 파싱
 → ai_diagnosis 테이블 저장 후 DTO 반환
```

## 건드리지 말 것 (or 주의)

- `**/src/main/resources/application.properties` — **팀 공유 설정으로 추적 중**. 환경별 차이는 `${VAR:default}` 환경변수로 처리. 시크릿/개인 오버라이드가 필요하면 `application-secret.properties`(gitignore됨) 사용.
- `frontend/.env` — gitignore됨. 팀원 IP는 자기 PC 기준으로.
- `discovery-service` — 손댈 일 거의 없음.
- `BaseTime` 엔티티 — 각 서비스마다 따로 정의되어 있음 (공유 안 함). 그대로 두는 게 안전.

## 남은 작업 TODO

### P2 — 지금 (보안/품질)

- [ ] **Gateway에 JWT 검증 필터 추가** — 현재 모든 요청 통과. 게이트웨이에서 토큰 검증 + 헤더(`X-User-Id`)로 사용자 식별 정보 다운스트림 전달
- [ ] **user-service SecurityConfig `permitAll` 축소** — [SecurityConfig.java:30](user-service/src/main/java/com/sppkl/user/security/SecurityConfig.java#L30)에서 `/auth/user/**` 전부 permitAll 상태. `/auth/login`, `/auth/signup`만 열고 나머지는 인증 요구
- [ ] **`userId`를 신뢰 입력으로 받는 패턴 제거** — 현재 plant/sensor/ai API가 query/body의 `userId`를 그대로 사용. Gateway가 주입한 헤더 또는 토큰 subject 기준으로 통일

### P3 — 배포 시 (보안 강화, 운영 전 필수)

- [ ] **입력값 검증 (Bean Validation)** — 현재 DTO에 `@NotBlank`, `@Size`, `@Pattern` 등 검증 어노테이션 없음. 컨트롤러에 `@Valid` 적용 + DTO에 제약 추가 (닉네임 길이/문자, 비밀번호 정책, 일지 본문 길이 등). XSS/스팸 필터링 포함
- [ ] **이미지 업로드 검증 + 저장 경로 외부화** — `ai-service ImageService.save()`, `plant-service` 식물 등록 multipart 모두 확장자/MIME/매직 넘버/최대 크기 검사 없음. `MultipartFile.getContentType()` 화이트리스트 + 매직 넘버 체크 + 크기 제한. 또한 [ai-service application.properties:11](ai-service/src/main/resources/application.properties#L11)의 `C:/images/` 하드코딩 저장 경로를 환경변수화
- [ ] **전역 에러 핸들러 + 메시지 마스킹** — `user-service`만 `@RestControllerAdvice`(UserExceptionHandler) 있고 나머지 4개 서비스(plant/sensor/ai/gateway)는 `RuntimeException` 그대로 던져 스택트레이스/JPA/Feign 내부 정보 노출. 각 서비스에 공통 `@RestControllerAdvice` 추가, 운영 환경에서는 일반 메시지만 응답, 상세는 서버 로그로만
- [ ] **운영 프로파일 분리 + DB 마이그레이션 도입** — 현재 plant/sensor 등에서 `ddl-auto=update`, `show-sql=true` 사용. `application-local.properties`, `application-prod.properties` 분리 → 운영은 `ddl-auto=validate`, SQL 로그 off, `server.error.include-stacktrace/include-message` off. 스키마는 Flyway 또는 Liquibase로 관리
- [ ] **Feign 안정성 설정** — timeout, retry, circuit breaker(Resilience4j) 미설정. [PlantService.java:79](plant-service/src/main/java/com/sppkl/plant/service/PlantService.java#L79) 식물 등록이 트랜잭션 안에서 ai/sensor를 동기 호출 → 원격 장애 전파, 긴 트랜잭션, 부분 성공 위험. 원격 호출은 트랜잭션 바깥 또는 보상 로직으로 분리
- [ ] **센서 스케줄러 안정화** — [SensorDataService.java:109](sensor-service/src/main/java/com/sppkl/sensor/service/SensorDataService.java#L109)의 시간 평균 스케줄러가 인스턴스별 실행 → 다중 인스턴스 시 중복 적재. ShedLock 등 분산락 도입. 평균 계산에서 null을 0으로 더하는 부분도 null 제외로 수정
- [ ] **테스트/CI 기본기** — `rg` 기준 백엔드/프론트 테스트 파일 없음. 서비스별 핵심 유스케이스 단위 테스트, Controller slice 테스트, 센서 Redis 로직 테스트, 프론트 API 클라이언트 타입/에러 처리 테스트부터 추가

## Claude Code 작업 팁

- 코드 수정 전에 관련 파일 전부 읽고 시작할 것 (특히 `services/api.ts`, `App.tsx`, 해당 화면)
- API 호출 추가할 때는 `services/api.ts`에 함수 먼저 만들고 화면에서 import
- 에러 처리는 `try/catch` + `Alert.alert` 또는 화면 내 errorState 사용 (Home.tsx 참고)
- 네비게이션 타입 추가 시 `App.tsx`의 `RootStackParamList`도 같이 수정
- 백엔드 수정 시 빌드 확인: `./gradlew :해당서비스:build`
