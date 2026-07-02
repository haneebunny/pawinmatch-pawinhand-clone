# ROADMAP.md

> 이 문서는 **4일 안에 무엇을, 어떤 순서로, 누가 만드는지**를 정리한 실행 로드맵입니다.
> 프로젝트 배경·기능 정의는 `AGENTS.md`, 코드 작성 규칙은 `SKILL.md`를 함께 참고하세요.
> **이 문서는 "언제 무엇을"에 집중합니다.**

---

## 🎯 4일 목표 한 줄

> **"입양해도 될까? → 어떤 아이? → 이 아이로 결정"** 이 흐름이 실제로 클릭되며 돌아가는 데모를 Railway에 올린다.

완벽한 제품이 아니라 **핵심 흐름이 동작하는 데모**가 목표입니다.

---

## 📁 폴더 구조 (합의된 것)

```
project-root/
├── frontend/
│   └── src/              # 페이지 외관 HTML들 (화면 8개)
├── data/                 # ✅ RAG jsonl + 매칭용 동물 데이터 (루트에 위치)
│   ├── pet_adoption_rules.jsonl
│   ├── pre_adoption_screening.jsonl
│   ├── post_adoption_guide.jsonl
│   └── animals.json          # 매칭 후보(개발자 A 제공, B가 읽음)
├── backend/
│   ├── app/              # ✅ FastAPI 앱 — [B] config·schemas_B·rag_B·services·routers(diagnose_B·match_B)
│   └── main.py           # 앱 생성·CORS·에러핸들러·라우터 등록
├── AGENTS.md             # 프로젝트 정의 + 협업/Git 규칙 (상시 규칙)
├── backend/.agent/SKILL.md   # 코드 작성 지침 — 3-4에 백엔드 구조 확정본(파일명 _A/_B)
└── ROADMAP.md            # 이 문서 (일정·작업 순서)
```

> ✅ **(Day 3 갱신)** 데이터 폴더는 **루트 `data/`** 로 확정(초안의 `backend/data/`에서 정정). 백엔드는 `backend/app/` 패키지로 확정하고 **파일명 접미사로 담당 표시(A=`_A`, B=`_B`)**. 현재 **개발자 B 파트(진단·매칭)만** 구현됨. 자세한 구조·엔드포인트는 SKILL.md 3-4 참고.

> **`frontend/src`** = 페이지 외관 HTML이 담기는 곳. 화면별 파일을 여기에 둡니다.
> **`backend/data`** = RAG 참고자료 jsonl이 담기는 곳. 진단/매칭 AI가 프롬프트에 붙여 쓸 근거 데이터입니다.
> 그 외 세부 폴더 구조(컴포넌트·라우팅 등)는 확정 전이니 임의로 단정하지 말고 필요 시 사용자에게 확인합니다.

---

## 🧾 RAG 데이터 사용 방식 (backend/data)

`backend/data`의 jsonl은 **벡터DB 없이 프롬프트에 텍스트로 붙여 쓰는** 참고자료입니다.

- **`pet_adoption_rules.jsonl`** — 입양 적합 판단 기준(자가 점검 항목). 각 줄은 `uid` / `bundle`(A·B…) / `title` / `keywords` / `trigger_signals` / `explanation` 구조.
- **`pre_adoption_screening.jsonl`** — 입양 전 확인 질문(보호소 질문지 기반 데이터).

**쓰는 법**: 진단/질문지 체인에서, 관련 `bundle`의 항목들을 읽어 `title + explanation`을 프롬프트에 통째로 삽입 → LLM이 그 근거로 판단·질문을 생성.
> 분량이 작으므로 임베딩·유사도 검색을 만들지 않습니다. 필요하면 `bundle`이나 `keywords`로 단순 필터링만 합니다.

---

## 🗓 🗓 개발 진행 상황 & 마무리 계획 (Day별)

각 단계별 완료 여부를 확인하고, 남은 작업을 프론트/백엔드 역할별로 나누어 마무리합니다.

### 🏁 Day 1 — 기반 세팅 + 화면 뼈대 (완료)
- **FE**: Next.js 프로젝트 생성, 8개 화면 HTML 기반 컴포넌트 구조화 및 전역 레이아웃/스타일 세팅.
- **BE**: FastAPI 프로젝트 생성, CORS 미들웨어 및 기본 헬스체크 엔드포인트 `/` 추가.

### 🏁 Day 2 — Next.js 라우터 전환 및 데이터 크롤링 (완료)
- **FE**: Next.js App Router 전환, localStorage 기반 survey wizard (`/diagnose`) 흐름 구현 및 로컬 시뮬레이션 폴백 구축. 배너 캐러셀 슬라이더 구현 완료.
- **BE**: 포인핸드 API 연동 데이터 수집 스크립트 작성 및 실행 완료 (`animals.json` 107마리 및 보호소 매핑 완료).

### 🚀 Day 3 & 4 (오늘) — 핵심 AI 연동 및 개발 마무리 (진행 중)
**목표: 로컬 시뮬레이션을 실제 백엔드 AI API와 연결하고 배포를 완료하여 MVP를 완성한다.**

#### 💻 백엔드 (FastAPI) 개발 항목
- [ ] **LangChain & LLM 설정**: OpenAI `gpt-5.4-mini` 설정 단일화 (`config.py` 또는 `main.py` 상단 상수).
- [ ] **RAG 규칙 데이터 연동**: 루트 디렉토리 `data/`에 있는 `pet_adoption_rules.jsonl`과 `pre_adoption_screening.jsonl`를 백엔드에서 읽어오도록 경로 설정.
- [ ] **`POST /api/diagnose` API 구현**:
  - 사용자 입력값(2단계) 수신.
  - `pet_adoption_rules.jsonl`을 프롬프트에 RAG 형태로 주입하여 "입양 가능 / 조건부 가능 / 신중히 재고" 판정.
  - 잘 맞는 점, 보완점, 월 예상 비용 구조화된 JSON(Pydantic Schema)으로 응답.
- [ ] **`POST /api/match` API 구현**:
  - 사용자 입력 및 `backend/data/animals.json` 데이터 로드.
  - OpenAI LLM을 통해 유기동물 매칭 점수(1~10) 및 맞춤 추천 이유 산출.
  - 가벼운 응답 형태(`results: [{ animal_id, match_score, recommend_reason }]` 3~5개) 반환.
- [ ] **`POST /api/questions` API 구현**:
  - `pre_adoption_screening.jsonl` 공통 템플릿 반환.
  - (여유 시) 동물의 특징을 반영한 맞춤 AI 질문 생성 기능 추가.

#### 🎨 프론트엔드 (Next.js) 개발 항목
- [ ] **AI API 연동**:
  - `/diagnose` 결과 페이지: 로컬 시뮬레이션 대신 백엔드 `POST /api/diagnose` 호출하도록 fetch 연동.
  - `/match/results` 결과 페이지: 로컬 시뮬레이션 대신 백엔드 `POST /api/match` 호출하도록 fetch 연동.
  - `/shelter-questionnaire` 질문지 페이지: 로컬 시뮬레이션 대신 백엔드 `POST /api/questions` 호출하도록 fetch 연동.
- [ ] **실제 데이터 정합성 맞추기**:
  - 프론트엔드 `data/animals.js` 대신 백엔드 크롤링 데이터 규격(`animals.json` 포맷 - 예: 이미지 경로 `photos[0]`, 체중 `animal_weight` 등)에 맞추어 카드 및 상세 페이지 컴포넌트 렌더링 수정.
  - `/animals/[id]` 상세 페이지 및 매칭 상세 페이지(`?recommend=true`) 데이터 바인딩 오류 수정.
- [ ] **예외 처리 및 폴백**:
  - 백엔드 서버 오프라인 또는 API 에러 시, 기존에 구현된 로컬 시뮬레이션 폴백 로직이 자연스럽게 작동하도록 `try/catch` 구성.
  - API Base URL을 환경변수 `NEXT_PUBLIC_API_BASE_URL`로 분리.

#### 🌐 배포 및 검증 (최종 마무리)
- [ ] **Railway 배포**:
  - FastAPI 백엔드 배포 및 CORS 설정에 프론트엔드 배포 주소 추가.
  - Next.js 프론트엔드 배포.
  - Railway 환경변수(`OPENAI_API_KEY`, `NEXT_PUBLIC_API_BASE_URL` 등) 등록.
- [ ] **통합 테스트**:
  - 배포된 라이브 서버에서 홈 ➡️ 진단 ➡️ 결과 ➡️ 매칭 ➡️ 상세 ➡️ 질문지로 이어지는 1차 흐름 전체 검증.
  - "신중히 재고" 등의 엣지 케이스에서 UI 문구가 '사용자 언어(부드러운 톤)'로 자연스럽게 표시되는지 팀 전원 교차 검증.
## 🗓 4일 일정 (Day별)

각 Day 끝에는 **"직접 눌러서 되는지" 확인**을 넣습니다. 안 되는 걸 쌓아두지 않는 게 4일 MVP의 핵심입니다.

### Day 1 — 기반 세팅 + 화면 뼈대
**목표: 빈 껍데기라도 8개 화면이 열리고, 서버가 응답한다.**

- (공통) 저장소 세팅: `main` 보호, `feature/` 브랜치 규칙 공유(→ AGENTS.md)
- (FE) Next.js 프로젝트 생성, `frontend/src`에 화면 8개 HTML 뼈대 배치
  - 홈 / 목록 / 상세 / 지도(후순위) / 진단결과 / 매칭목록 / 매칭상세 / 질문지
- (BE) FastAPI 프로젝트 생성(Poetry), `backend/data`에 jsonl 배치, 헬스체크 엔드포인트
- (기획/디자인) Stitch로 화면 시안 확정, 문구 톤(사용자 언어) 정리
- ✅ **확인**: 8개 화면이 각각 열린다 / 서버가 켜지고 응답한다

### Day 2 — 핵심 AI 2개 (진단 + 매칭)
**목표: 입력하면 진단 결과와 매칭 결과가 실제로 나온다. (Must의 심장)**

- (BE) 동물·보호소 고정 데이터 수동 수집 → JSON 저장
- ✅ (BE) LangChain 진단 체인 + `POST /api/diagnose` (RAG: `pet_adoption_rules.jsonl` 삽입) **완료** — [개발자 B]
- ✅ (BE) LangChain 매칭 체인 + `POST /api/match` (응답은 `animal_id`+점수+이유만) **완료** — [개발자 B] / LLM 실패·키 없음 시 로컬 폴백
- (FE) 진단 입력 폼(2단계: 생활환경 6개 + 성향 3항목) → 진단결과 화면 연결
- ✅ **확인**: 폼을 채우면 3단계 등급이 뜨고, "매칭 보기"를 누르면 3~5마리가 나온다

### Day 3 — 상세 · 목록 · 질문지 연결
**목표: 카드 클릭 → 상세 → 질문지까지 흐름이 끊김 없이 이어진다.**

- (FE) 목록(#2) ↔ 상세(#3) 연결, 매칭 카드 → 매칭상세(#7, 추천 이유 블록 추가)
- (BE) `POST /api/questions` (공통 템플릿 고정) + `GET /api/animals`·`/api/shelters` 조회 API, `shelters.json` 적재 — [개발자 A] 담당(예정, `_A` 접미사)
- (FE) 질문지 화면(#8): 카테고리 탭 + 질문 리스트 + 체크리스트 + 보호소 연락처
- (FE) 문구를 사용자 언어로 다듬기(척도 숫자 → 자연어, "부적합"류 제거)
- ✅ **확인**: 홈 → 진단 → 매칭 → 상세 → 질문지까지 한 번에 클릭으로 이어진다

### Day 4 — 배포 · 다듬기 · 후순위
**목표: Railway에 올라가고, 팀 전체가 실제로 눌러본다.**

- (BE/FE) Railway 배포, 환경변수(OpenAI 키·API 주소) 등록, CORS 정리
- (전체) 버그 픽스, 엣지 케이스 확인(특히 "신중히 재고" 등급)
- (여유 시) Should: 체크리스트·입양 문의 안내·AI 커스텀 질문
- (여유 시) Could: 검색/필터, **지도(#4) + 클러스터링**
- ✅ **확인**: 배포된 주소에서 팀 4명이 각자 흐름을 끝까지 눌러본다

---

## ✅ 우선순위 원칙 (막히면 이 기준으로 판단)

**Must가 다 돌아가기 전에는 Could(지도·검색)에 손대지 않습니다.**

| 순위 | 항목 |
|---|---|
| Must | 진단 API·매칭 API / 화면 #1·2·3·5·6·7·8 / 배포 |
| Should | 체크리스트, 입양 문의 안내, AI 커스텀 질문 |
| Could | 검색·필터, 지도(#4)+클러스터링, 가이드북 |
| Won't | RAG 챗봇, 펫보험 BM, 가족 공유 카드 |

---

## 👥 역할 분담 가이드 (참고)

4인 팀 = 비개발자 + 약간의 개발 경험자 혼합. 아래는 제안이며 팀 상황에 맞게 조정하세요.

- **개발 경험자**: FastAPI 엔드포인트, LangChain 체인, Next.js 화면 연결(실제 구현)
- **비개발자**: Stitch 시안, 문구(사용자 언어) 작성, 데이터 수동 수집, 배포 후 테스트/버그 리포트

---

## 🚦 매일 체크리스트 (하루 끝 공통)

- [ ] 오늘 작업을 `feature/` 브랜치에 커밋했는가 (`main` 직접 푸시 금지)
- [ ] 패키지 추가 시 lock 파일(`package-lock.json` / `poetry.lock`) 함께 커밋했는가
- [ ] 오늘 만든 화면/기능을 **실제로 눌러서** 확인했는가
- [ ] 내일 막힐 것 같은 부분을 팀에 미리 공유했는가

---

*이 로드맵은 AGENTS.md(정의)·SKILL.md(구현 규칙)와 함께 봅니다. 일정은 진행 상황에 따라 유연하게 조정하되, "매일 끝에 눌러서 확인"과 "Must 우선" 원칙은 지킵니다.*
