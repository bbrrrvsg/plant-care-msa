# 개발 환경 세팅 가이드

## 1. Docker Desktop 설치

1. [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop) 접속
2. **Windows용 다운로드** 클릭 후 설치
3. 설치 완료 후 **PC 재시작**
4. Docker Desktop 실행 — 트레이 아이콘에 고래 아이콘이 뜨면 정상

> Mac 사용자는 Apple Silicon / Intel 중 본인 칩에 맞는 버전 선택

설치 확인:
```bash
docker --version
docker compose version
```

---

## 2. Redis / MySQL 실행

프로젝트 루트 디렉토리에서 실행:

```bash
docker compose up -d
```

컨테이너 상태 확인:
```bash
docker compose ps
```

정상 출력 예시:
```
NAME                  STATUS
plant-care-redis      running
plant-care-mysql      running
```

---

## 3. 접속 정보

| 항목    | 값          |
|---------|-------------|
| Redis   | localhost:6379 |
| MySQL   | localhost:3306 |
| MySQL DB | plantcare  |
| MySQL PW | root       |

---

## 4. 컨테이너 종료 / 재시작

```bash
# 종료
docker compose down

# 재시작
docker compose restart
```

---

## 5. 자주 발생하는 문제

**포트 충돌 오류**
```
Error: Bind for 0.0.0.0:6379 failed: port is already allocated
```
이미 Redis가 로컬에 설치되어 있거나 다른 컨테이너가 포트를 사용 중입니다.
```bash
# 사용 중인 포트 확인 (Windows)
netstat -ano | findstr :6379

# 해당 PID 종료
taskkill /PID <PID번호> /F
```

**WSL2 관련 오류 (Windows)**

Docker Desktop 설치 중 WSL2 설치 요구 시:
1. PowerShell을 **관리자 권한**으로 실행
2. 아래 명령어 실행 후 재시작
```powershell
wsl --install
```
