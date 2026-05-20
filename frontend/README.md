# PlantCare React Native

Expo 기반 React Native 프론트 프로젝트입니다.

## 실행 전 준비

백엔드가 먼저 실행돼 있어야 합니다.

- `discovery-service`
- `gateway-service`
- `user-service`
- MySQL

기본 포트:

- `8761` Eureka
- `8080` Gateway
- `8081` Auth

## API 주소 설정

이 프로젝트는 Expo 환경변수로 API 주소를 읽습니다.

1. `.env.example`을 복사해서 `.env` 파일을 만듭니다.
2. 본인 환경에 맞게 값을 수정합니다.

예시:

```env
EXPO_PUBLIC_API_BASE_URL_WEB=http://localhost:8080
EXPO_PUBLIC_API_BASE_URL_DEVICE=http://192.168.219.51:8080
```

설명:

- `EXPO_PUBLIC_API_BASE_URL_WEB`
  - 웹 브라우저에서 사용할 백엔드 주소
- `EXPO_PUBLIC_API_BASE_URL_DEVICE`
  - 휴대폰 또는 에뮬레이터에서 사용할 백엔드 주소

주의:

- 휴대폰 테스트 시 `localhost`는 사용할 수 없습니다.
- 같은 Wi-Fi에 연결된 백엔드 PC의 LAN IP를 사용해야 합니다.
- 현재 예시 IP는 `192.168.219.51`입니다. IP가 바뀌면 `.env`도 같이 수정해야 합니다.

## 설치 및 실행

```bash
npm install
npm run web
```

모바일 테스트:

```bash
npm start
```

## 팀원 테스트 방법

같은 네트워크에서 테스트하려면:

1. 백엔드 실행
2. 팀원이 같은 Wi-Fi 연결
3. `.env`의 `EXPO_PUBLIC_API_BASE_URL_DEVICE`를 백엔드 PC IP로 설정
4. Expo 앱 실행

## 현재 인증 동작

- 회원가입 시 아이디 중복 검사
- 회원가입 시 닉네임 중복 검사
- 로그인 시 닉네임까지 받아와 메인 화면 환영 문구에 사용
- 로그인/회원가입 유효성 검사 문구를 화면에 표시
