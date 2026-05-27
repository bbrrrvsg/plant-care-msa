# 🌱 PlantCare

> ESP32 센서로 식물 환경을 모니터링하고, Gemini AI가 진단해주며, 성장 일지를 기록할 수 있는 **스마트 식물 관리 앱**

학교 프로젝트로 개발한 MSA(Microservice Architecture) 기반 풀스택 애플리케이션입니다.
백엔드는 Spring Cloud로 6개의 마이크로서비스를 구성했고, 프론트엔드는 Expo + React Native로 모바일/웹을 동시에 지원합니다.

-----

## 👥 팀 SPPKL

|역할           |이름 |
|-------------|---|
|팀장 / Frontend|박효준|
|Backend      |이한승|
|Backend      |심준현|
|Backend      |김용성|
|IoT          |박태성|

-----

## ✨ 주요 기능

- **🪴 내 식물 관리** — 사진과 함께 식물 등록, 도감과 자동 매핑, 떠나보내기(소프트 삭제) + 추억 보관함
- **📚 식물 도감** — 농사로 API 기반 식물 정보, 5개 카테고리 필터(초보자용/다육식물/관엽식물/꽃·열매/전체)
- **📡 ESP32 센서 연동** — 토양 수분·온습도·조도 실시간 모니터링, 시간별 평균 자동 집계
- **🤖 AI 진단** — Gemini 2.5 Flash로 식물 사진 + 센서 데이터를 함께 분석해 진단/권장사항 제공
- **📖 성장 일지** — 사진과 메모로 식물의 변화 기록, AI 진단 결과 자동 연동
- **💧 자동 급수 임계값** — 식물 종에 맞는 토양 수분 기준값으로 펌프 작동 트리거
- **🔔 알림** — 물주기 시점, 센서 이상 감지 (구현 예정)

-----

## 🏗️ 아키텍처

### 백엔드 (Java 17, Spring Boot 3.4.5, Spring Cloud 2024.0.1)

```
                            ┌─────────────────┐
                            │  Frontend (RN)  │
                            └────────┬────────┘
                                     │
                            ┌────────▼────────┐
                            │ gateway-service │  :8080
                            └────────┬────────┘
                                     │
                            ┌────────▼────────┐
                            │discovery-service│  :8761 (Eureka)
                            └────────┬────────┘
                ┌────────────┬───────┴───────┬────────────┐
                │            │               │            │
        ┌───────▼──────┐ ┌───▼─────────┐ ┌──▼──────────┐ ┌▼──────────┐
        │ user-service │ │plant-service│ │sensor-service│ │ai-service │
        │    :8081     │ │    :8082    │ │    :8083    │ │   :8084   │
        └───────┬──────┘ └──────┬──────┘ └──────┬──────┘ └─────┬─────┘
                │               │                │              │
                └───────────────┴────────────────┴──────────────┘
                                     │
                       ┌─────────────┴──────────────┐
                       │                            │
                  ┌────▼─────┐                 ┌────▼─────┐
                  │ MySQL 8  │                 │ Redis 7  │
                  └──────────┘                 └──────────┘
```

|서비스                |포트  |역할                                                  |
|-------------------|----|----------------------------------------------------|
|`discovery-service`|8761|Eureka 서비스 디스커버리 서버                                 |
|`gateway-service`  |8080|Spring Cloud Gateway (라우팅, CORS)                    |
|`user-service`     |8081|회원가입/로그인, JWT 발급, 프로필 이미지                           |
|`plant-service`    |8082|내 식물 CRUD, 식물 도감(농사로 API 연동), 성장 일지                 |
|`sensor-service`   |8083|ESP32 기기 등록, 센서 데이터(Redis), 시간별 평균(MySQL), 펌프 임계값   |
|`ai-service`       |8084|Gemini API 진단, 이미지로 식물 종 식별                         |
|`common`           |-   |공유 DTO 모듈 (BookDto, SensorDataDto, AIDiagnosisDto 등)|

- **DB**: MySQL 8 (`plantcare` 스키마, 서비스 간 공유)
- **캐시**: Redis 7 (sensor-service의 실시간 데이터)
- **서비스 간 통신**: OpenFeign + Eureka 기반 로드밸런싱
- **인프라**: `docker-compose.yml` (Redis + MySQL)

### 프론트엔드 (Expo 54, React Native 0.81, TypeScript)

- **라우팅**: React Navigation 7 (native-stack + bottom-tabs)
- **HTTP**: axios + Bearer 토큰 자동 주입
- **인증 저장소**: expo-secure-store
- **아이콘**: lucide-react-native, @expo/vector-icons

-----

## 📁 디렉토리 구조

```
plant-care-msa/
├── build.gradle              # 루트 빌드 설정
├── settings.gradle           # 7개 모듈 포함
├── docker-compose.yml        # Redis + MySQL 인프라
├── docs/                     # setup.md (환경 세팅), schema.sql / plant_db.sql (DB 스키마 참고)
├── embedded/ESP32/           # ESP32 펌웨어 (.ino)
│
├── common/                   # 공유 DTO 모듈
├── discovery-service/        # Eureka 서버
├── gateway-service/          # API 게이트웨이
├── user-service/             # 인증/사용자
├── plant-service/            # 식물/도감/일지
├── sensor-service/           # 센서/기기
├── ai-service/               # AI 진단
│
└── frontend/                 # Expo 앱
    ├── App.tsx               # 루트 네비게이터
    ├── services/api.ts       # 모든 API 호출 + 토큰 관리
    ├── theme.ts              # 디자인 토큰
    ├── components/
    │   ├── screens/          # 20개 화면
    │   └── shared/           # 공통 컴포넌트 (PlantCard, SensorWidget, StatusChip 등)
    └── lib/                  # 클라이언트 상태 (sensorStore, favoritesStore, sensorHelpers)
```

-----

## 🚀 실행 방법

### 사전 요구사항

- Java 17+
- Node.js 18+ & npm
- Docker & Docker Compose
- 외부 API 키: **Gemini API**, **농사로 API**, **OpenWeather API**

### 백엔드

```bash
# 1. 인프라 컨테이너 실행 (Redis + MySQL)
docker compose up -d

# 2. 환경변수 설정 (application.properties 는 팀 공유 설정으로 git에 추적됨,
#    각 키는 ${VAR:default} 패턴으로 환경변수 오버라이드 가능)
#   - DB_PASSWORD
#   - GEMINI_API_KEY
#   - NONGSARO_API_KEY
#   - OPENWEATHER_API_KEY
#   - JWT_SECRET (운영 환경 필수)

# 3. 서비스 실행 (순서 중요)
./gradlew :discovery-service:bootRun   # 가장 먼저
./gradlew :gateway-service:bootRun
./gradlew :user-service:bootRun
./gradlew :plant-service:bootRun
./gradlew :sensor-service:bootRun
./gradlew :ai-service:bootRun
```

> IntelliJ에서는 각 서비스를 Gradle Run으로 실행해도 됩니다.

### 프론트엔드

```bash
cd frontend
cp .env.example .env
# .env 의 EXPO_PUBLIC_API_BASE_URL_DEVICE 에 PC의 LAN IP 입력

npm install
npm run web      # 웹 브라우저
# 또는
npm start        # 모바일 (Expo Go)
```

-----

## 🔄 핵심 데이터 흐름

### 식물 등록 (멀티파트 업로드)

```
앱 ─POST /plant (image, userId, nickname, deviceId?)─→ plant-service
                                                          │
                                                          ├─ image → ai-service: 식물 종 자동 식별 → speciesCode 매핑
                                                          ├─ PlantEntity 저장
                                                          └─ deviceId → sensor-service PATCH /device/{id}/link
                                                                          └─ watering 텍스트 → threshold/duration 계산 저장
```

### 센서 데이터 수집

```
ESP32 ─POST /api/sensor/data─→ sensor-service
                                  │
                                  ├─ Redis: sensor:latest:{plantId} (TTL 10분)
                                  └─ Redis: sensor:list:{plantId}   (TTL 70분, 평균 계산용)

[매시간 정각] 스케줄러 → list 평균 → MySQL sensor_data 테이블 (AI 진단 히스토리)
[5분마다]     스케줄러 → TTL 만료 기기 → active=false 자동 전환
```

### AI 진단

```
앱 ─POST /ai/gemini (image, plantId)─→ ai-service
                                          │
                                          ├─ plant-service에서 센서 데이터 조회 (Feign)
                                          ├─ Gemini 2.5 Flash: 이미지 + 센서 데이터 함께 프롬프트
                                          ├─ 제목 / 소제목 / 내용 파싱
                                          └─ ai_diagnosis 테이블 저장 후 DTO 반환
```

-----

## 📝 커밋 메시지 컨벤션

```
타입 : 짧은 설명
```

|타입    |의미    |
|------|------|
|`feat`|새로운 기능|
|`fix` |버그 수정 |

예) `feat : AddPlant() 함수 추가` (식물 추가 기능)

-----

## 📌 개발 현황

### ✅ 완료된 주요 기능

- 식물 등록/조회/삭제, 멀티파트 이미지 업로드
- 식물 도감 + 카테고리 필터 (농사로 API)
- ESP32 센서 등록 및 실시간 데이터 수집/평균
- Gemini AI 진단 + 일지 자동 연동
- 성장 일지 작성/상세 조회/삭제
- 식물 “떠나보내기” + 추억 보관함 (소프트 삭제 + 감성 플로우)
- 사용자 프로필 이미지

-----

## ⚠️ 주의사항

- `**/src/main/resources/application.properties` 는 **팀 공유 설정으로 git에 추적**됩니다. 환경별 차이는 `${VAR:default}` 환경변수로 처리하세요. 시크릿/개인 오버라이드가 필요하면 `application-secret.properties` (gitignore됨) 사용.
- `frontend/.env` 도 **gitignore** 되어 있고, 팀원 각자의 PC LAN IP로 설정해야 합니다.
- 각 서비스의 `BaseTime` 엔티티는 서비스별로 따로 정의되어 있습니다 (의도된 분리).
- `discovery-service` 는 일반적으로 수정할 일이 없습니다.

-----

## 📄 라이선스

학교 프로젝트용으로 개발되었습니다.

-----

<p align="center">
  Made with 🌿 by <b>SPPKL</b>
</p>