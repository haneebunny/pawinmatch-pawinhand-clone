"""
routers/diagnose_B.py — [개발자 B] 적합도 진단 API.

POST /api/diagnose : 사용자 설문(2단계)을 받아 3단계 등급 + 근거 + 예상 양육비를 반환.
실제 판단은 services/ai_diagnose_B.run_diagnose 가 담당(LLM 또는 안전 폴백).
요청·응답은 서버에 저장하지 않습니다(Stateless).
"""
from fastapi import APIRouter

from ..schemas_B import DiagnoseResponse, SurveyInput
from ..services import ai_diagnose_B

router = APIRouter(prefix="/api", tags=["diagnose"])


@router.post("/diagnose", response_model=DiagnoseResponse)
def diagnose(survey: SurveyInput):
    """입양 적합도 진단 결과(화면 #5용)를 반환합니다."""
    return ai_diagnose_B.run_diagnose(survey)
