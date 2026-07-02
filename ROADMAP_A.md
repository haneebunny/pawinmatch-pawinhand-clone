# ROADMAP_A.md

> 이 문서는 **개발자 A**의 전담 백엔드 태스크(유기동물 조회 및 보호소 질문지 API) 개발을 위한 구체적인 단계별 실행 로드맵입니다.
> 다른 팀원들과 충돌 없이 깔끔하게 병렬 개발할 수 있도록 작업을 단계화하였습니다.

---

## 🎯 개발자 A의 최종 목표
- [x] **Git 브랜치 구축**: `main`에서 pull 받아 깨끗한 상태에서 `feature/be-ai-apis` 생성 및 이동.
- [ ] **동물 조회 API 구현**: `GET /api/animals` 엔드포인트를 구현하여 전체 및 지역(city)별 동물 데이터 제공.
- [ ] **사전 검진 질문지 API 구현**: `POST /api/questions` 엔드포인트를 구현하여 축종별 질문 리스트 제공.
- [ ] **메인 어플리케이션 통합**: `backend/main.py`에 라우터를 등록하여 엔드포인트를 노출.
- [ ] **백엔드 라이브 배포 및 연동 검증**: Railway 배포 및 프론트엔드 연동 테스트 완료.

---

## 👥 병렬 개발 및 충돌 방지 전략
- **독립적인 파일 구조**: `animals.py`, `questions.py` 파일명을 사용합니다. 단, 개발자 B의 기존 코드와 직접 겹치지 않도록 공통 스키마 파일인 [schemas.py](file:///d:/sesac_pjt/pawinhand-clone/backend/app/schemas.py)의 맨 뒷부분에 개발자 A 전용 스키마 구조를 덧붙여 작업합니다.
- **메인 통합 최소화**: [main.py](file:///d:/sesac_pjt/pawinhand-clone/backend/main.py)를 수정할 때는 최소한의 라우터 등록 코드만 한 번에 추가하여 타 팀원 머지 시 충돌 가능성을 줄입니다.
- **실행 계획 공유**: 코드 수정 전, 에이전트가 먼저 사용자에게 수정 계획을 상세히 보고하고 확인받은 후 작업을 개시합니다.

---

## 📅 오늘(Day 4)의 구체적인 로드맵 및 단계

### 1단계: 데이터 분석 및 스키마 설계 (마일스톤 1)
- [data/animals.json](file:///d:/sesac_pjt/pawinhand-clone/data/animals.json)의 실제 필드 구성과 형태 분석.
- [data/pre_adoption_screening.jsonl](file:///d:/sesac_pjt/pawinhand-clone/data/pet_adoption_rules.jsonl)의 JSON Lines 구조 분석.
- [schemas.py](file:///d:/sesac_pjt/pawinhand-clone/backend/app/schemas.py) 하단에 `AnimalResponse`, `QuestionInput`, `QuestionResponse` Pydantic 스키마 정의 추가.
- **결과물**: [schemas.py](file:///d:/sesac_pjt/pawinhand-clone/backend/app/schemas.py)

### 2단계: 유기동물 조회 API 구현 (마일스톤 2)
- `backend/app/routers/animals.py` 신설.
- `GET /api/animals` 엔드포인트 구현 (지역 필터링 기능 `city` 추가).
- **결과물**: [animals.py](file:///d:/sesac_pjt/pawinhand-clone/backend/app/routers/animals.py)

### 3단계: 보호소 사전 질문지 API 구현 (마일스톤 3)
- `backend/app/routers/questions.py` 신설.
- `POST /api/questions` 엔드포인트 구현 (입력받은 `species`에 따른 필터링).
- **결과물**: [questions.py](file:///d:/sesac_pjt/pawinhand-clone/backend/app/routers/questions.py)

### 4단계: 메인 통합 및 로컬 테스트 (마일스톤 4)
- [main.py](file:///d:/sesac_pjt/pawinhand-clone/backend/main.py)에 `animals` 및 `questions` 라우터 등록.
- local uvicorn 서버 실행 및 Swagger UI(`/docs`)를 통한 응답값 검증.

### 5단계: 배포 및 CORS 연동 테스트 (마일스톤 5)
- Railway 배포 진행.
- 로컬 및 배포된 프론트엔드가 백엔드 API를 호출할 때 CORS 에러가 발생하지 않도록 최종 검증.
