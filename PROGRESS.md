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
├── backend/
│   ├── .agent/           # AI 에이전트용 개발 지침 (SKILL.md)
│   ├── data/             # RAG용 참고 자료 (rules, screening jsonl)
│   ├── main.py           # FastAPI 서버 코드
│   ├── pyproject.toml    # Poetry 설정
│   └── poetry.lock
├── AGENTS.md             # AI 에이전트 온보딩 및 협업/Git 규칙
├── ROADMAP.md            # 4일 일정 로드맵
└── PROGRESS.md           # 이 문서 (개발 진행 상황 기록)
```

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

---

## 🎯 Next Step (오늘의 개발 마무리 계획)
1. **백엔드 AI API 연동**: FastAPI에 `gpt-5.4-mini` 및 LangChain 기반의 `/api/diagnose`, `/api/match`, `/api/questions` 개발 완료.
2. **프론트엔드 API 호출 결합**: 로컬 시뮬레이션 기반에서 실제 백엔드 API 연동으로 전환하고 데이터 구조 정합성 검증.
3. **Railway 배포 및 통합 테스트**: 클라우드에 두 서비스를 배포하고 전체 흐름이 자연스럽게 연동되는지 최종 검증.
