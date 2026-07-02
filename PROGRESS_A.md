# PROGRESS_A.md

이 문서는 **개발자 A**의 오늘 개발 진행 상황과 히스토리를 상세하게 실시간으로 기록하는 파일입니다.
작업 세션 간 흐름이 끊기지 않도록 각 단계의 진행 상황을 시간별로 업데이트합니다.

---

## 📌 프로젝트 및 역할 개요
- **목표**: 4일 안에 유기동물 매칭 데모 MVP 백엔드 구축 완료.
- **개발자 A 역할**: 
  - 유기동물 전체/필터 조회 API (`GET /api/animals`)
  - 보호소 사전 질문지 조회 API (`POST /api/questions`)
  - [main.py](file:///d:/sesac_pjt/pawinhand-clone/backend/main.py)에 라우터 연동 및 Railway 최종 배포

---

## 🗓 실시간 개발 진행 상황 (Day 4)

### 🏁 브랜치 초기 설정 및 준비 (10:40)
- [x] **로컬 작업 영역 초기화**: 롤백 (`git reset --hard` 및 `git clean -fd`) 진행하여 `main` 브랜치를 완전한 원격 최신 상태로 동기화 완료.
- [x] **개발 전용 브랜치 생성**: `feature/be-ai-apis` 브랜치를 최신 `main` 기준으로 새로 생성하고 이동 완료.
- [x] **개발자 A 전 전용 문서 생성**: [ROADMAP_A.md](file:///d:/sesac_pjt/pawinhand-clone/ROADMAP_A.md) 및 [PROGRESS_A.md](file:///d:/sesac_pjt/pawinhand-clone/PROGRESS_A.md) 추가 완료.

### 🏁 1~2단계: RAG 로더 추가 및 공통 스키마 설계 완료 (11:13)
- [x] **RAG 로더 추가**: [rag.py](file:///d:/sesac_pjt/pawinhand-clone/backend/app/rag.py)에 질문지 데이터 파싱용 `load_screening_questions` 캐싱 함수 구현 완료.
- [x] **공통 스키마 업데이트**: [schemas.py](file:///d:/sesac_pjt/pawinhand-clone/backend/app/schemas.py) 기존 스키마를 유지하면서 개발자 A 전담 API용 Pydantic 모델(`CommentSchema`, `AnimalResponse`, `QuestionInput`, `QuestionResponse`) 추가 완료.

### 🏁 신규 마일스톤: 프론트 선호 지역 체크박스 추가 및 백엔드 스키마 연동 완료 (11:31)
- [x] **백엔드 스키마 확장**: [schemas.py](file:///d:/sesac_pjt/pawinhand-clone/backend/app/schemas.py)의 `SurveyInput` 모델에 `preferred_cities` 필드 정의 추가 완료.
- [x] **프론트 UI 구성**: [diagnose/page.js](file:///d:/sesac_pjt/pawinhand-clone/frontend/app/diagnose/page.js) 설문 2단계 단에 **"선호 지역 (다중 선택)"** 체크박스 영역 신설 및 API 전송 바디(`preferred_cities`) 연동 완료.

### 🏁 3단계: 유기동물 조회 API (`animals.py`) 구현 완료 (11:31)
- [x] **API 신설**: `backend/app/routers/animals.py` 파일을 생성하고 `GET /api/animals` 엔드포인트를 구현 완료했습니다.
- [x] **지역 필터 연동**: `city` 쿼리 파라미터를 받아 부분 일치(`in`) 방식의 지역 필터링 및 예외 발생 시 빈 리스트(`[]`)를 리턴하도록 처리했습니다.

### 🏁 4단계: 보호소 사전 질문지 API (`questions.py`) 구현 완료 (11:36)
- [x] **API 신설**: `backend/app/routers/questions.py` 파일을 생성하고 `POST /api/questions` 엔드포인트를 구현 완료했습니다.
- [x] **유효성 및 필터 검증**: 요청 축종이 `dog` 또는 `cat`이 아닐 경우 400 에러를 반환하며, 축종에 매핑되는 질문 데이터만 필터링하도록 RAG 캐싱 함수와 연동 완료했습니다.

### 🏁 5단계: 백엔드 메인 통합 완료 (11:37)
- [x] **라우터 등록**: [main.py](file:///d:/sesac_pjt/pawinhand-clone/backend/main.py)의 상단 import를 통합하고, `animals` 및 `questions` 라우터를 탑재하여 API 엔드포인트를 전역 활성화 완료했습니다.

### 🏁 6단계: 로컬 API 통신 및 예외 유효성 검증 완료 (11:45)
- [x] **API 연동 테스트**: 로컬 uvicorn 서버 상에서 `GET /api/animals?city=경상남도` 호출 시 필터링된 유기동물 데이터가 정상 반환됨을 확인했습니다.
- [x] **질문지 API 검증**: `POST /api/questions` 호출 시 개(dog)에 매핑되는 사전 질문 리스트가 정확한 스펙으로 응답되는지 검증했습니다.
- [x] **비정상 입력 검증**: 축종에 `'rabbit'` 등의 오염된 데이터를 보냈을 때 `400 Bad Request` 에러와 함께 사전 차단 메커니즘이 올바르게 동작하는 것을 확인했습니다.

---

## 📋 현재 개발 타임라인 및 마일스톤 현황

| 단계 | 작업 내용 | 타겟 파일 | 상태 |
|---|---|---|---|
| **준비** | 브랜치 동기화 및 전용 로드맵 생성 | `ROADMAP_A.md`, `PROGRESS_A.md` | **완료 (10:40)** |
| **1단계** | RAG 로더 사전 질문지 캐싱 함수 추가 | `backend/app/rag.py` | **완료 (11:13)** |
| **2단계** | Pydantic 스키마 정의 (개발자 A 스키마 추가) | `backend/app/schemas.py` | **완료 (11:13)** |
| **추가** | 프론트 선호 지역 체크박스 UI & schemas 연동 | `diagnose/page.js`, `schemas.py` | **완료 (11:31)** |
| **3단계** | 유기동물 조회 API 구현 (`GET /api/animals`) | `backend/app/routers/animals.py` | **완료 (11:31)** |
| **4단계** | 질문지 조회 API 구현 (`POST /api/questions`) | `backend/app/routers/questions.py` | **완료 (11:36)** |
| **5단계** | 백엔드 메인 통합 완료 | `backend/main.py` | **완료 (11:37)** |
| **6단계** | 로컬 API 통신 및 예외 유효성 검증 | 로컬 서버 | **완료 (11:45)** |
| **7단계** | Railway 배포 및 프론트 연동 테스트 | 배포 서버 | 대기 중 |
