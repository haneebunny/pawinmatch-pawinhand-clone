"""
routers/match_B.py — [개발자 B] 매칭 추천 API.

POST /api/match : 진단과 동일한 사용자 설문을 받아, 잘 맞는 동물 3~5마리를
                  animal_id + match_score + recommend_reason 로만 가볍게 반환.
프론트는 animal_id 로 animals.json 에서 나머지 표시 정보를 찾아 카드를 그립니다.
"""
from fastapi import APIRouter

from ..schemas_B import MatchResponse, SurveyInput
from ..services import ai_matching_B

router = APIRouter(prefix="/api", tags=["match"])


@router.post("/match", response_model=MatchResponse)
def match(survey: SurveyInput):
    """매칭 결과(화면 #6용) 3~5마리를 반환합니다."""
    return ai_matching_B.run_match(survey)
