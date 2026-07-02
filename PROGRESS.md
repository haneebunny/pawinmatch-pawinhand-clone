# PROGRESS.md

이 문서는 **포인핸드 클론 + AI 매칭 + 지도 시각화** 서비스의 전체 개발 진행 상황과 로드맵, 개발 히스토리를 한눈에 관리하는 통합 문서입니다.

---

## 📌 프로젝트 개요 및 목표

- **목표**: 4일 동안 유기동물 입양 희망자가 AI 입양 적합도를 진단하고, 맞춤 동물을 매칭받으며, 보호소 질문지를 작성하여 입양을 준비하는 일련의 흐름(진단형 단일 흐름)을 구현한 MVP 데모 구축.
- **최종 타겟**: "입양해도 될까? ➡️ 어떤 아이? ➡️ 이 아이로 결정"의 흐름이 백엔드 AI 및 포인핸드 107마리 데이터와 오차 없이 연동되어 배포되는 것.
- **배포 환경**: Railway (FastAPI 백엔드 + Next.js 프론트엔드)

---

## ⚙️ 기술 스택 및 개발 규칙

### 1. 프론트엔드 (Frontend)
- **Framework**: Next.js (npm 패키지 관리, yarn 사용 금지)
- **Styling**: Vanilla CSS + Tailwind CSS (커스텀 둥근 모서리 `rounded-xl` 통일)
- **컨벤션**: Flex 및 Gap 위주의 레이아웃, 따뜻한 오렌지 틴트(`#FFF1EC`) 테마색 중심의 일관성 있는 브랜딩 적용.

### 2. 백엔드 (Backend)
- **Framework**: FastAPI (Python 3.12)
- **가상환경**: Poetry (`.venv` 가상환경 폴더 통일)
- **핵심 데이터**: APMS/포인핸드 수동 수집 데이터 및 RAG jsonl (저장소 루트 `data/`에 위치)

### 3. AI / LLM 오케스트레이션
- **Model**: OpenAI `gpt-5.4-mini` (모델명 `config.py`에서 단일 관리)
- **RAG 방식**: 벡터 DB 없이 프롬프트 내에 참고자료 텍스트를 직접 삽입하여 추론 속도 및 비용 최적화.

---

## 📁 통합 디렉토리 구조

```
project-root/
├── frontend/
│   ├── app/              # Next.js App 라우터 구조
│   │   ├── animals/      # [FE] 유기동물 전체 목록 및 상세 (/animals)
│   │   ├── care/         # [FE] 입양 후 케어 가이드 및 펫보험 (/care)
│   │   ├── diagnose/     # [FE] AI 입양 적합도 진단 설문 (/diagnose)
│   │   ├── map/          # [FE] 지도 시각화 (/map)
│   │   ├── icon.png      # Next.js 자동 파비콘 파일 (주황색 손잡기 로고)
│   │   └── layout.js     # 공통 메타데이터 및 레이아웃 설정
│   ├── public/           # 정적 파일 에셋
│   │   ├── data/         # 지도 SVG, 준비물/펫보험 static JSON 저장소
│   │   └── img/          # 상품 실물 썸네일 이미지 저장소 (/img/care_1.png ~ care_12.png)
│   └── package.json
├── data/                 # RAG 참고자료 + 매칭용 동물 데이터
│   ├── pet_adoption_rules.jsonl      # RAG: 입양 판단 기준 (진단 프롬프트에 삽입)
│   ├── pre_adoption_screening.jsonl  # RAG: 자가점검(A)+매칭축(B) (질문지 구성)
│   └── animals.json                  # 매칭 후보 동물 정보 (107마리)
├── backend/
│   ├── app/              # FastAPI 앱 패키지
│   │   ├── config.py     # 환경변수·경로·모델명 단일 관리
│   │   ├── schemas.py    # 공통 Pydantic schemas (개발자 A/B 스펙 통합)
│   │   ├── rag.py        # RAG 캐싱 및 데이터 로더
│   │   ├── services/
│   │   │   ├── ai_diagnose_B.py   # [개발자 B] AI 적합도 진단 서비스
│   │   │   └── ai_matching_B.py   # [개발자 B] AI 맞춤 동물 매칭 서비스
│   │   └── routers/
│   │       ├── animals.py     # [개발자 A] GET /api/animals (지역/축종 필터 조회)
│   │       ├── questions.py   # [개발자 A] POST /api/questions (보호소 질문지 조회)
│   │       ├── diagnose_B.py  # [개발자 B] POST /api/diagnose
│   │       └── match_B.py     # [개발자 B] POST /api/match
│   ├── main.py           # FastAPI CORS 설정, 라우터 전역 등록 및 통합 실행
│   ├── pyproject.toml    # Poetry 설정
│   └── poetry.lock
├── AGENTS.md             # AI 에이전트 온보딩 및 협업/Git 규칙
└── PROGRESS.md           # 이 문서 (통합 진행 상황 및 히스토리)
```

---

## 🗓 개발 진행 상황 및 마일스톤

### 🏁 Day 1 — 기반 세팅 + 화면 뼈대 (완료)
- **백엔드**: FastAPI 프로젝트 초기화, CORS 미들웨어 설정 및 기본 헬스체크 엔드포인트 완비.
- **프론트엔드**: Next.js 프로젝트 생성, 8대 화면 프로토타입 HTML 기반 구조화 및 반응형 웹 여백(`max-w-[1024px]`) 공통화 적용.

### 🏁 Day 2 — Next.js 라우팅 전환 및 크롤링 (완료)
- **프론트엔드**: Next.js App Router로 컴포넌트 전환 완료. `localStorage` 기반 survey wizard 다단 설문 구축 및 로컬 시뮬레이션 폴백 마련.
- **데이터 크롤링**: 포인핸드 API 연동 Python 크롤러 작성 및 오프라인 시연용 고정 107마리 동물 데이터([animals.json](file:///Users/hani/Desktop/sasac_pjt/pawinhand-clone/data/animals.json)) 및 위경도 보정 보호소 데이터 구축 완료.

### 🏁 Day 3 — 백엔드 AI 진단 및 매칭 API (완료)
- **AI 오케스트레이션**: `gpt-5.4-mini` Structured Output 기반 적합도 진단(`POST /api/diagnose`) 및 동물 매칭(`POST /api/match`) 체인 구현.
- **안전성 고도화**: LLM 장애나 API 키 부재 시에도 데모가 자연스럽게 동작하도록 프론트엔드/백엔드 이중 로컬 폴백 시스템 마련.

### 🏁 Day 4 — 백엔드 API 통합, 케어 탭 신설 및 헤더/파비콘 디자인 완성 (완료)
- **백엔드 기능 통합**:
  - [개발자 A] 시/도 필터 유기동물 조회 API (`GET /api/animals`) 개발 완료.
  - [개발자 A] 축종(개/고양이) 사전 체크리스트 반환 API (`POST /api/questions`) 개발 완료.
  - [animals.py](file:///Users/hani/Desktop/sasac_pjt/pawinhand-clone/backend/app/routers/animals.py) 및 [questions.py](file:///Users/hani/Desktop/sasac_pjt/pawinhand-clone/backend/app/routers/questions.py)를 [main.py](file:///Users/hani/Desktop/sasac_pjt/pawinhand-clone/backend/main.py)에 무결하게 라우팅 연동 완료.
- **입양 후 케어 탭 신규 런칭 (`/care`)**:
  - 준비물 체크리스트(`care_products.json` 연동) 및 월 보험료 기반 맞춤 펫보험(`care_insurance.json` 연동) 화면 구현.
  - 고양이 맞춤형 준비물 2종(11. 캣타워, 12. 스크래쳐) 추가 및 상단 `🐱 고양이 입양` 필터 칩 토글 상태 결합.
  - 여러 조건 부합 시 뱃지들이 누적 표시되는 다중 뱃지 판단 파이프라인(`getItemBadges`) 완성.
  - 이미지 잘림 방지 `object-contain` 렌더링 및 쇼핑몰 카탈로그식 스튜디오 화이트 배경 처리.
- **디자인 통일성 및 파비콘 완성**:
  - `유기동물 보호 목록` 및 `AI 입양 적합도 진단` 화면의 헤더 디자인을 입양 후 케어 탭 스타일(주황색 미세 캡션 뱃지 + h1 볼드 + 웜 브라운 서브텍스트 + 구분선)로 전격 통합하여 브랜드 일체성 확립.
  - 브라우저 탭 파비콘을 Pawinhand 주황색 손잡기 공식 로고([icon.png](file:///Users/hani/Desktop/sasac_pjt/pawinhand-clone/frontend/app/icon.png))로 교체 완료.

---

## 🧪 로컬 API 및 예외 처리 검증 결과

백엔드 로컬 서버 환경에서 직접 통신을 테스트하여 아래와 같이 무결성을 증명했습니다.

1. **시/도 지역 필터링 통신 (`GET /api/animals?city=경상남도`)**
   - `경상남도` 필터 파라미터를 수신하여 데이터셋 내의 경남 밀양 소속 동물 등 부합하는 목록만을 정상 필터링하여 JSON 규격으로 반환.
2. **질문지 축종 필터링 통신 (`POST /api/questions`, species=dog)**
   - 축종 `dog` 파라미터를 정상 감수하여, 사전 자가점검 질문 데이터(총 15개 문항)를 완벽한 Pydantic 응답 모델에 맞추어 송신.
3. **잘못된 입력 예외 대응 (`POST /api/questions`, species=rabbit)**
   - 축종 규칙에 어긋나는 비정상 요청 인입 시 서버 붕괴 대신 `400 Bad Request` 에러와 함께 `"요청하신 축종 형식이 올바르지 않습니다..."` 안내 메시지를 응답하여 안전망 동작 증명.

---

## 🚦 Git 협업 및 커밋 컨벤션 리마인더

- **브랜치 규칙**: `main` 브랜치 직접 Push 절대 금지. `feature/fe-...` 및 `feature/be-...` 브랜치 파이프라인을 활용한 PR 승인 병합 진행.
- **리뷰어 지정**: PR 승인 요청 대상은 항상 조장(`haneebunny`)으로 고정.
