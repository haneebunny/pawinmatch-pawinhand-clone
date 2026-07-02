# PROGRESS.md

이 문서는 **포인핸드 클론 + AI 매칭 + 지도 시각화** 서비스의 개발 진행 상황과 히스토리를 기록하는 파일입니다. 새로운 채팅 세션을 시작하더라도 이어서 개발할 수 있도록 히스토리를 상세히 기술합니다.

---

## 📌 프로젝트 개요 및 목표

- **목표**: 4일 동안 유기동물 입양 희망자가 AI 입양 적합도를 진단하고, 맞춤 동물을 매칭받으며, 보호소 질문지를 작성하여 입양을 준비하는 일련의 흐름(진단형 단일 흐름)을 구현한 MVP 데모 구축.
- **배포 타겟**: Railway (FastAPI 백엔드 + Next.js 프론트엔드)

---

## ⚙️ 기술 스택 및 개발 규칙

### 1. 프론트엔드 (Frontend)
- **Framework**: Next.js
- **Styling**: Tailwind CSS (CDN 사용 및 커스텀 설정)
- **컨벤션**: Flex 및 Gap 위주의 정렬 레이아웃 적용, 자연스럽고 사용자 친화적인 표현 지향.

### 2. 백엔드 (Backend)
- **Framework**: FastAPI (Python 3.12)
- **가상환경**: Poetry (`.venv` 가상환경 폴더 통일)
- **핵심 데이터**: APMS/포인핸드 수동 수집 JSON 데이터 사용 (자동 배치/스케줄러 없음)
- **요청/응답**: Pydantic 스키마 정의 및 무저장(Stateless) API 설계

### 3. AI / LLM 오케스트레이션
- **Model**: OpenAI `gpt-5.4-mini` (모델명 상수화)
- **Orchestration**: LangChain
- **RAG 방식**: 벡터 DB 없이 프롬프트 내에 A4 1~2장 분량의 가이드라인 텍스트 직접 삽입

---

## 📁 디렉토리 구조

```
project-root/
├── frontend/
│   ├── app/              # Next.js App 라우터 구조 (layout.js, page.js 등)
│   ├── src/              # 퍼블리싱된 9개의 화면 HTML 파일들 (Day 1 프로토타입)
│   └── package.json
├── data/                 # ✅ RAG 참고자료 + 매칭용 동물 데이터 (저장소 루트)
│   ├── pet_adoption_rules.jsonl      # RAG: 입양 판단 기준(진단 프롬프트에 삽입)
│   ├── pre_adoption_screening.jsonl  # RAG: 자가점검(A)+매칭축(B)
│   ├── post_adoption_guide.jsonl     # RAG: 입양 후 가이드
│   └── animals.json                  # 매칭 후보 동물(개발자 A 제공, B가 읽음)
├── backend/
│   ├── .agent/           # AI 에이전트용 개발 지침 (SKILL.md)
│   ├── app/              # ✅ FastAPI 앱 패키지 — 현재 [개발자 B] 진단·매칭만 존재
│   │   ├── config.py     # [공통] 환경변수·경로·모델명(gpt-5.4-mini) 단일 관리
│   │   ├── schemas_B.py  # [B] SurveyInput·DiagnoseResponse·MatchResponse
│   │   ├── rag_B.py      # [B] pet_adoption_rules 로더 + animals 로더
│   │   ├── services/
│   │   │   ├── ai_diagnose_B.py   # [B] 진단 체인 + 안전 폴백
│   │   │   └── ai_matching_B.py   # [B] 매칭 체인 + 로컬 점수 폴백
│   │   └── routers/
│   │       ├── diagnose_B.py  # [B] POST /api/diagnose
│   │       └── match_B.py     # [B] POST /api/match
│   ├── main.py           # [공통] FastAPI 인스턴스·CORS·에러핸들러·라우터 등록
│   ├── pyproject.toml    # Poetry 설정
│   └── poetry.lock
├── AGENTS.md             # AI 에이전트 온보딩 및 협업/Git 규칙
├── ROADMAP.md            # 4일 일정 로드맵
└── PROGRESS.md           # 이 문서 (개발 진행 상황 기록)
```

> ⚠️ **데이터 폴더 위치 정정**: 초기 문서(dev_plan·ROADMAP)에는 `backend/data/`로 적혀 있었으나, 실제 저장소는 **루트 `data/`** 에 jsonl·animals.json이 존재합니다. `backend/app/config.py`의 `DATA_DIR`이 이 경로를 가리킵니다. (환경변수 `DATA_DIR`로 변경 가능)
>
> ℹ️ **개발자 파트 구분**: 파일명 접미사로 담당을 표시합니다 — 개발자 A 파일은 `_A`, 개발자 B 파일은 `_B`. 현재 백엔드에는 **개발자 B 파트(진단·매칭)만** 구현되어 있고, 개발자 A 파트(조회·질문지 `_A`)는 담당자가 이어서 추가합니다.

---

## 🗓 개발 진행 상황

### 🏁 Day 1 — 기반 세팅 + 화면 뼈대 (완료)
- **백엔드**:
  - FastAPI 프로젝트 생성 완료.
  - CORS 미들웨어 설정 완료 (`http://localhost:3000` 허용).
  - 헬스체크 엔드포인트 `/` 추가 완료 (`{"status": "ok"}`).
- **프론트엔드**:
  - Next.js 프로젝트 초기화 완료.
  - 기획 단계에서 도출된 8대 화면 프로토타입 HTML을 `frontend/src/` 폴더에 배치 완료.
  - **헤더/푸터 공통화 및 반응형 웹 여백 확보**: 모든 페이지의 가로폭을 보편적인 사이트 사이즈인 `max-w-[1024px]`로 맞춤으로써 가로 레이아웃 균형을 극대화함. 네비게이션바 디자인을 그레이/블랙 색상으로 변경하고 로고에 홈 링크를 연결함.
  - **목록 페이지 추가 및 연동**: 전체 목록 페이지인 `list.html`을 신규 생성하고 4x3의 정사각형 카드 그리드 구성. 홈 화면의 "전체보기"는 `list.html`로, "지도로 보기"는 `8.html`로 완벽히 분리 연결함.
  - **상세 페이지 AI 추천 멘트 조건부 노출**: `1.html` 내에 URL 파라미터(`?recommend=true`) 감지 스크립트를 내장하여, 매칭 결과 목록(`3.html`)에서 넘어올 때만 추천 박스가 나타나고 홈/목록/지도 등 일반 동물 링크로 진입할 때는 숨겨지도록 구현함.
  - **전체 이동 경로 연결 완료**: 홈 ➡️ 진단 ➡️ 결과 ➡️ 매칭 ➡️ 상세 ➡️ 질문지 흐름 연동 완료.

### 🏁 Day 2 — Next.js 라우터 전환 및 배너 슬라이더 구현 (완료)
- **프론트엔드 Next.js 전환 완료**:
  - `frontend/src` 내에 존재하던 모든 HTML 화면들을 Next.js App Router 구조(`frontend/app`)로 완벽히 전환 완료.
  - 전역 테마 스타일(`globals.css`) 및 레이아웃(`layout.js`), 공통 `Header`/`Footer` 컴포넌트 구현 완료.
  - 경로 이동 시 질문 답변 상태를 잃지 않도록 `localStorage`와 리액트 상태 기반의 단일 survey wizard(`/diagnose`) 흐름 구축.
  - `/animals/[id]` 상세 페이지에서 `recommend=true` 파라미터가 있을 때만 AI 추천 사유 블록이 노출되는 조건부 렌더링 유지.
  - `/map`에서 특정 보호소를 클릭하고 "이 보호소 동물 보기"를 누르면 `/animals?shelter_id=...`로 연결되어 해당 보호소의 동물만 필터링되어 나타나도록 동적 결합도 강화.
  - `useSearchParams`를 사용하는 페이지들을 `<Suspense>`로 랩핑하여 Next.js 정적 빌드 오류 해결.
- **홈 화면 콤팩트 배너 슬라이더 구현 완료**:
  - 기존의 지나치게 컸던 배너 높이를 300px 수준으로 줄여 화면 비중을 최적화.
  - React State와 Autoplay(4초 간격)를 탑재한 캐러셀 슬라이더를 수동 조작 화살표 및 인디케이터와 함께 구현.
  - 나중에 실제 이미지를 쉽게 넣을 수 있도록 깔끔한 아이콘과 배경 그라데이션이 적용된 3종 디자인 템플릿 형태로 퍼블리싱.
- **동물 및 보호소 데이터 수동/자동 수집 크롤링 완료**:
  - 포인핸드 API(`/bridge/shelter/animal/recommended/condition`, `/bridge/animal/tag`, `/bridge/animal`)를 연동하여 107마리의 풍부한 유기동물 정보와 18개의 보호소 데이터를 일괄 수집하는 Python 스크립트([crawl_pawinhand.py](file:///Users/hani/Desktop/sasac_pjt/pawinhand-clone/backend/scripts/crawl_pawinhand.py)) 구현 및 수동 실행 완료.
  - 수집된 정보를 프로젝트 데이터 규격(`Animal`, `Shelter` 스키마)에 맞춰 정규화 매핑 완료.
  - 지도 핀 및 클러스터링을 위한 보호소 위도/경도(`lat`/`lng`) 정보를 OSM Nominatim API와 중복 방지 지역별 오프셋(jitter)을 가미한 폴백 알고리즘을 사용해 성공적으로 생성 완료.
  - 결과 파일 [animals.json](file:///Users/hani/Desktop/sasac_pjt/pawinhand-clone/backend/data/animals.json) 및 [shelters.json](file:///Users/hani/Desktop/sasac_pjt/pawinhand-clone/backend/data/shelters.json)을 생성하여 `backend/data/` 폴더에 저장 완료.

### 🏁 Day 3 — 백엔드 [개발자 B] AI 진단·매칭 API (완료)
> `feature/be_ai_matching` 브랜치. 개발자 B 담당(진단·매칭 체인)을 구현. 파일명은 `_B` 접미사로 담당 표시.
> (앞서 실험적으로 만들었던 개발자 A 코드는 제거하고 B 파트만 남김. 조회·질문지 `_A`는 담당자가 이어서 추가.)

- **FastAPI 앱 구조화**: `main.py`에 CORS(config 기반), **공통 에러 핸들러**(422 입력 검증 / 500 안전 응답), 진단·매칭 라우터 등록. 헬스체크에 `llm_enabled` 노출.
- **OpenAI/LangChain 설정(`config.py`)**: 모델명(`gpt-5.4-mini`)·API 키·데이터 경로·CORS를 **한 곳에서만** 관리. 모델 교체는 이 한 줄만 바꾸면 됨.
- **RAG 로더(`rag_B.py`)**: `pet_adoption_rules.jsonl`을 `title+설명` 텍스트로 이어붙여 진단 프롬프트에 삽입(벡터DB 없음). 매칭용 `animals.json`도 여기서 로드(캐시).
- **진단 체인(`ai_diagnose_B.py` → `POST /api/diagnose`)**: `SurveyInput`(9필드)을 받아 **Structured Outputs로 JSON 강제**해 `grade`(3단계)·`good_points`·`check_points`·`monthly_cost` 반환. 등급은 "입양 가능/조건부 가능/신중히 재고"로 제한, "부적합/불가" 금지.
- **매칭 체인(`ai_matching_B.py` → `POST /api/match`)**: 사용자 입력 + 동물의 활동성·사회성·태그를 비교해 3~5마리를 `animal_id·match_score(1~10)·recommend_reason`으로 반환. 응답은 가볍게(표시정보는 프론트가 animals.json에서 조회).
- **예외 처리(Fallback)**: LLM 호출/파싱 실패 시 **1회 재시도**, 그래도 실패하거나 **API 키가 없으면 로컬 규칙 결과**로 폴백. → 키가 없어도 데모가 항상 3~5마리·3단계 등급을 낸다.
- **검증**: 오프라인이라 실제 LLM 호출 대신 **폴백 경로**를 검증. 원룸·바쁨·초보 케이스→"신중히 재고"+차분한 소형 위주 추천, 단독·여유·경험 케이스→"입양 가능"+활발한 강아지 위주 추천으로 합리적 동작 확인. 신규 의존성 없음(langchain·openai는 기존 pyproject에 이미 포함) → `poetry.lock` 변경 없음.

---

## 📋 화면(페이지) 현황 및 연결 경로

현재 구현된 HTML 파일 및 향후 Next.js 라우팅 연결 맵:

| 파일명 | 화면명 | 설명 | 비고 |
|---|---|---|---|
| `9.html` | **홈 화면** | 서비스 소개 + 진단 시작 CTA | `홈` 링크, 가로폭 `1024px` |
| `6.html` | **진단 1단계** | 나의 생활환경 6가지 질문 (주거형태, 외출시간 등) | `AI진단` 시작점 |
| `7.html` | **진단 1단계 (복사본)** | 로고 명이 `PAWINHAND`인 버전 (6.html과 동일) | 예비용 |
| `5.html` | **진단 2단계** | 원하는 아이 성향 3가지 질문 (활동성, 친화도 등) | - |
| `4.html` | **적합도 결과** | AI 진단 3단계 등급 + 양육 보완점 + 월 예상비용 | - |
| `3.html` | **매칭 결과 목록** | 나와 어울리는 유기동물 3~5마리 추천 리스트 | - |
| `list.html` | **전체 목록** | 수집한 보호동물을 정사각형 카드로 나열 (신규 생성) | `보호동물 보기` 링크, 클릭 시 `1.html`로 연결 (AI 멘트 미노출) |
| `1.html` | **동물 상세** | 유기동물 개별 상세 정보 (추천 파라미터 유무에 따라 AI 박스 노출 분기) | - |
| `2.html` | **보호소 질문지** | 입양 상담 질문 리스트 + 준비 체크리스트 + 보호소 안내 | - |
| `8.html` | **지도 보기** | 보호소 위치 시각화 (Could 단계, 홈 화면 지도로 보기 연결) | - |

### 🏁 Day 4 — [사용자 FE/지도] 환경 통합 및 상세페이지 UI 정밀화 (진행 중)
- **프론트엔드 및 데이터 일원화 완료**:
  * **폴더 및 빌드 동기화**: `animals.json` 데이터를 프로젝트 최상위 루트 `data/` 폴더로 일원화하고, Next.js의 프로젝트 외 파일 빌드 차단 문제를 방지하기 위해 `frontend/package.json` 스크립트에 실행 시 루트 데이터를 빌드 폴더 내로 자동 복사(`cp`)하는 명령어를 이식 완료.
  * **상세 페이지 UI 하이브리드 리팩토링**:
    - 동물 상세 페이지([page.js](file:///Users/hani/Desktop/sasac_pjt/pawinhand-clone/frontend/app/animals/[id]/page.js))를 **1:1 비율 정사각형 이미지 캐러셀**과 **좌우 2단 그리드 레이아웃**으로 재구성. (동물 사진 잘림 현상을 완벽히 해결하고 데스크톱 가로 공간 밸런스 극대화).
    - 6대 프로필 인포(품종, 나이, 성별, 체중, 중성화 여부, 공고기한)를 2열 카드 그리드로 정밀화하고 우측 열에 전화/신청 CTA 버튼과 나란히 정렬.
    - AI 추천 의견(주황색 말풍선)을 가로폭이 넓은 하단에 배치하여 긴 피드백 텍스트도 쾌적하게 읽을 수 있도록 가독성 개선.
    - 입양 절차 순서도(1, 2, 3 단계 시각화) 및 크롤링 댓글 목록의 타임라인형 카드 렌더링 구현 완료.
  * **독립 브랜치 및 FE 전용 문서 구축**:
    - 다른 조원들과의 Git 충돌을 전면 차단하기 위해 `feature/fe-map-visualization` 독립 개발 브랜치를 새로 팠으며, [ROADMAP_FE.md](file:///Users/hani/Desktop/sasac_pjt/pawinhand-clone/ROADMAP_FE.md) 및 [PROGRESS_FE.md](file:///Users/hani/Desktop/sasac_pjt/pawinhand-clone/PROGRESS_FE.md)를 생성하여 FE 지도 개발 로드맵만 분리 트래킹 시작.
- **백엔드 서버 구동 및 AI 매칭 상황**:
  * 사용자가 백엔드 가상환경(`.venv`)을 켜고 FastAPI 서버(`uvicorn main:app --reload`)를 로컬에서 구동하는 데 성공함.
  * **AI 매칭 연동 상태**: 백엔드에 기본 AI 매칭 API 및 LangChain 체인, 그리고 OpenAI 미작동 시 수식 기반으로 폴백하는 핵심 로직은 구현 및 통합된 상태임.
  * **⚠️ 매칭 고도화 미완성**: 사용자와 동물의 특성을 대조하는 핵심 뼈대는 동작하지만, **정교한 매칭 가중치 세부 조정 및 고도화는 아직 진행되지 않은 상황**으로 오늘의 고도화 단계에서 다듬어질 예정임.

---

