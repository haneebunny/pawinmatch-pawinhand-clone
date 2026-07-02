"""
config.py — [개발자 B / 공통] 환경변수·경로·OpenAI 모델명을 '한 곳'에서만 관리.

쉽게 말하면: 서버가 쓰는 값(AI 모델명, API 키, 데이터 파일 위치, 허용할 프론트 주소)을
이 파일 한 곳에만 적어두고 나머지 코드가 가져다 씁니다.
→ AI 품질이 아쉬우면 OPENAI_MODEL 한 줄만 gpt-5.4 로 바꾸면 됩니다. (SKILL.md 규칙)
"""
import os
from pathlib import Path

from dotenv import load_dotenv

# .env(로컬)를 읽어 환경변수로 올립니다. 배포(Railway)에서는 환경변수를 직접 씁니다.
load_dotenv()

# --- 경로 ---
BASE_DIR = Path(__file__).resolve().parent.parent   # .../backend
# 하이브리드 경로 감지: 배포(Root가 /backend) 시에는 BASE_DIR/data를, 그 외에는 REPO_ROOT/data를 감지합니다.
DEPLOY_DATA_DIR = BASE_DIR / "data"
DEFAULT_DATA_PATH = DEPLOY_DATA_DIR if DEPLOY_DATA_DIR.exists() else REPO_ROOT / "data"
DATA_DIR = Path(os.getenv("DATA_DIR", str(DEFAULT_DATA_PATH)))

# 매칭에 쓰는 동물 고정 데이터 (개발자 A가 제공, B는 읽기만)
ANIMALS_FILE = DATA_DIR / "animals.json"
# 이름 지어주기 투표 보관용 임시 파일
VOTES_FILE = DATA_DIR / "name_votes.json"
# RAG 참고자료 (프롬프트에 텍스트로 붙임)
RULES_FILE = DATA_DIR / "pet_adoption_rules.jsonl"
SCREENING_FILE = DATA_DIR / "pre_adoption_screening.jsonl"

# --- CORS (프론트가 API를 부를 수 있게 허용) ---
CORS_ORIGINS = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
]

# --- OpenAI / LLM (모델명은 여기 '한 곳'에서만 정의) ---
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.4-mini")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
