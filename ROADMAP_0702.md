# ROADMAP_0702.md

> 이 문서는 **7월 2일 개발 마무리 날**을 위한 3인 개발자 역할 분배와 구체적인 구현 체크리스트를 담고 있습니다.
> 오늘 하루 동안 각 파트가 서로 블로킹(대기) 없이 병렬로 개발을 마친 후 배포하는 데 초점을 맞춥니다.

---

## 🎯 오늘의 최종 목표
- **"입양해도 될까? ➡️ 어떤 아이? ➡️ 이 아이로 결정"**의 진단형 단일 흐름이 실제 백엔드 AI(OpenAI `gpt-5.4-mini` + LangChain)와 수집된 포인핸드 107마리 데이터 기반으로 오차 없이 맞물려 돌아가고, **Railway를 통해 라이브 배포**되는 것.

---

## 👥 3인 역할 분배 및 브랜치 명명 규칙

| 이름 (역할) | 전담 파트 | 생성할 Git 브랜치 |
|---|---|---|
| **개발자 A (BE/AI)** | FastAPI API 서버 구축 + LangChain/OpenAI RAG 모델 구성 + BE 배포 | `feature/be-ai-apis` |
| **개발자 B (FE/연동)** | Next.js API Fetch 구현 + 데이터 포맷 매핑/동기화 + 로컬 폴백 + FE 배포 | `feature/fe-api-integration` |
| **사용자 본인 (FE/지도)** | SVG/지도 라이브러리 기반 보호소 핀 시각화 + 보호소 필터 연동 | `feature/fe-map-visualization` |

---

## 📝 개발자별 세부 구현 체크리스트 (TODOS)

### 💻 개발자 A (백엔드 & AI API 전담)

백엔드에서 데이터를 읽어와 LangChain과 OpenAI API를 조율해 적합도 진단 및 매칭 결과, 질문지를 반환하는 엔드포인트를 완성합니다.

- [ ] **LangChain 및 gpt-5.4-mini 단일 설정**:
  - `backend/config.py` 혹은 `backend/main.py` 상단에 OpenAI 클라이언트 및 모델 이름 선언.
  - `MODEL_NAME = "gpt-5.4-mini"` (시연 중 품질 이슈 발생 시 한 줄 교체로 `gpt-5.4` 등으로 바꿀 수 있도록 하드코딩 지양).
- [ ] **RAG 참조 데이터 파일 로드**:
  - 루트 디렉토리 `/data` 폴더에 위치한 `pet_adoption_rules.jsonl` (진단 규칙) 및 `pre_adoption_screening.jsonl` (질문지 규칙) 파일을 백엔드에서 안정적으로 읽어오는 유틸리티 코드 작성.
- [ ] **`POST /api/diagnose` (입양 적합도 진단 API) 구현**:
  - Pydantic 요청 스키마(`housing`, `out_hours`, `walk_time` 등 9개 입력 필드) 및 응답 스키마(`grade`, `good_points`, `check_points`, `monthly_cost`) 정의.
  - `pet_adoption_rules.jsonl` 내용 중 해당 사용자의 주택 유형, 외출 시간 등에 트리거되는 핵심 조항들을 프롬프트 상단에 RAG 형태로 주입.
  - LLM 응답을 Structured Output(JSON 형식 강제)으로 파싱하여 에러가 없도록 처리.
  - `grade` 결과값은 반드시 `"입양 가능"`, `"조건부 가능"`, `"신중히 재고"` 셋 중 하나만 나오도록 보장.
- [ ] **`POST /api/match` (나와 맞는 동물 매칭 API) 구현**:
  - 사용자 입력과 `backend/data/animals.json` 내 107마리 유기동물의 수치 척도(`activity`, `sociability` 등) 및 성향 태그(`tags`)를 읽어와 OpenAI LLM에 평가 요청.
  - 응답 데이터 크기를 최소화하기 위해 **`results: [{ animal_id, match_score, recommend_reason }]`** 형태로 3~5마리를 추천하도록 연동. (나머지 상세 정보는 프론트엔드가 가진 데이터에서 찾음).
- [ ] **`POST /api/questions` (보호소 질문지 API) 구현**:
  - `pre_adoption_screening.jsonl`을 활용한 공통 카테고리별 질문 목록 반환.
- [ ] **CORS 설정 및 배포**:
  - `allow_origins`에 배포될 프론트엔드 도메인 및 `http://localhost:3000`을 모두 허용하도록 설정.
  - **FastAPI 백엔드 Railway 배포** 및 환경변수(`OPENAI_API_KEY`) 입력.

---

### 🎨 개발자 B (프론트엔드 API 연동 & 데이터 정합성 전담)

화면 단의 연산 로직을 실제 백엔드 API 연결로 바꾸고, 크롤링된 실제 데이터가 정상 노출되게 동기화합니다.

- [ ] **Next.js API Fetch 전환 및 환경변수 적용**:
  - 백엔드 기본 URL을 `NEXT_PUBLIC_API_BASE_URL` 환경변수 처리.
  - `/diagnose/page.js`: 로컬 시뮬레이션 대신 `POST /api/diagnose` API 호출로 전환.
  - `/match/results/page.js`: `POST /api/match` API를 호출하고 반환받은 `animal_id`와 `match_score`, `recommend_reason`을 기준으로 카드 리스트 출력.
  - `/shelter-questionnaire/page.js`: `POST /api/questions` API 호출 연동.
- [ ] **로컬 폴백(Try/Catch) 안전장치 구성**:
  - 백엔드가 배포 단계이거나 일시적으로 서버 연결이 실패할 때 서비스가 뻗지 않도록, `try/catch` 에러 발생 시 기존 구현된 프론트엔드 로컬 연산 시뮬레이션 결과로 대체 렌더링되도록 구현.
- [ ] **크롤링 수집 데이터 포맷으로 UI 정합성 동기화**:
  - 기존 mock 데이터(`data/animals.js`) 규격과 실제 수집된 `backend/data/animals.json` 데이터의 필드명을 통일.
  - 특히 이미지 경로는 `photo` ➡️ `photos[0]`(첫 번째 사진)로 변경 적용.
  - 동물 무게 `animal_weight`, 나이 `animal_age`, 품종 `breeds`, 발견장소 `found_location` 등 필드 동기화 및 렌더링 깨짐 현상 디버깅.
- [ ] **상세 페이지 및 매칭 추천 멘트 조건부 노출**:
  - `/animals/[id]` 상세 페이지에서 `recommend=true` 파라미터가 들어왔을 때만 `localStorage` 또는 URL 파라미터로 매칭 점수와 AI 추천 사유 블록이 상단에 노출되도록 동적 분기 검증.
- [ ] **Next.js 프론트엔드 Railway 배포**:
  - `NEXT_PUBLIC_API_BASE_URL`을 배포된 백엔드 주소로 등록하여 빌드 및 배포 완료.

---

### 🗺 사용자 본인 (지도 시각화 & 필터 연동 전담)

크롤링된 위경도 좌표 정보를 지도 상에 가시화하고 상세 필터 조회를 연계합니다.

- [ ] **SVG/지도 라이브러리 핀 시각화**:
  - `/map/page.js`: `frontend/app/data/shelters.js`에 정의된 12개 고정 보호소 데이터의 위도/경도(`lat`, `lng`) 좌표 정보를 기반으로 지도 위에 마커 핀을 렌더링.
  - 지도의 줌 상태와 지역별 마커 클러스터링(가까운 핀 뭉쳐 보기) 기능 검증.
- [ ] **지도와 동물 목록의 유기적 결합**:
  - 지도 위의 특정 보호소 핀을 클릭했을 때 하단 또는 모달에 해당 보호소의 이름, 연락처, 운영 시간 표시.
  - **"이 보호소 동물 보기"** 버튼 클릭 시, 동물 목록 페이지로 이동하며 주소창에 `?shelter_id=shelter-X` 파라미터 전달.
  - 동물 목록 페이지(`/animals/page.js`)가 해당 `shelter_id` 쿼리를 감지해 수집된 전체 동물 중 해당 보호소 소속의 동물들만 동적으로 필터링해 보여주는지 연동 확인.

---

## 🚦 Git 협업 및 커밋 컨벤션 리마인더

### 1. 브랜치 흐름
- 각자 작업 시작 전, `main` 브랜치에서 최신 버전을 가져옵니다:
  ```bash
  git checkout main
  git pull origin main
  ```
- 이후 자신의 브랜치를 생성하여 이동합니다 (예: `git checkout -b feature/fe-api-integration`).
- 작업 완료 후 Github에 푸시하고, PR(Pull Request) 리뷰어를 조장 또는 팀원(`haneebunny`)으로 지정한 뒤 승인을 거쳐 `main`에 머지합니다.
- **`main` 브랜치에 직접 Push는 절대로 금지합니다.**

### 2. 커밋 메시지 규칙
- 작업별 성격에 맞춰 prefix를 명시합니다:
  - `feat`: 신규 기능 개발
  - `fix`: 버그 수정 및 예외 처리
  - `refactor`: 구조 개선 및 데이터 동기화
  - `chore`: 설정 세팅 및 라이브러리 의존성 추가
- 예시: `feat: 백엔드 매칭 추천 API 엔드포인트 구현` / `fix: 상세페이지 이미지 경로 매핑 깨짐 해결`

---

## 🧪 통합 테스트 및 검증 체크리스트

모든 작업이 배포된 후 다음의 최종 시나리오를 팀원들과 직접 테스트합니다.

- [ ] **전체 흐름 테스트**: 홈 화면 ➡️ 적합도 진단 2단계 입력 ➡️ 진단 결과 등급 확인 ➡️ 추천 유기동물 목록 확인 ➡️ 유기동물 상세(추천사유 노출) ➡️ 보호소 질문지 복사 및 체크리스트 확인까지 매끄럽게 연결되는가?
- [ ] **엣지 케이스 테스트**: 진단 질문에서 지나치게 외출 시간이 길고 준비가 부족한 상태를 입력했을 때 "신중히 재고" 등급이 정상적으로 뜨며, 문구가 사용자 언어(부드럽고 긍정적인 개선 제안 톤)로 잘 출력되는가?
- [ ] **지도 필터 테스트**: 지도의 핀을 클릭하여 보호소 상세 동물을 클릭했을 때, 해당 보호소 소속의 유기동물들만 온전히 필터링되어 목록에 나타나는가?
