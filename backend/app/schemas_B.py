"""
schemas_B.py — [개발자 B] 진단·매칭 API의 요청/응답 '형태'(Pydantic).

FastAPI가 이 틀에 맞는지 자동 검사해줘서, 값이 빠지거나 타입이 틀리면 바로 알려줍니다.
LLM 출력도 이 모델로 강제(Structured Outputs)해서 JSON 파싱이 깨지지 않게 합니다.
"""
from typing import List, Optional

from pydantic import BaseModel, Field


# ========== 공통 사용자 설문 입력 (진단·매칭 공용) ==========
class SurveyInput(BaseModel):
    # 1단계: 나의 생활환경 (6개)
    housing: str = Field(..., description="아파트 / 빌라·다세대 / 단독주택 / 원룸·오피스텔")
    out_hours: str = Field(..., description="4시간 미만 / 4~8시간 / 8시간 이상")
    walk_time: str = Field(..., description="30분 미만 / 30분~1시간 / 1시간 이상")
    pet_experience: str = Field(..., description="없음 / 있음(현재는 없음) / 있음(현재도 있음)")
    budget: str = Field(..., description="10만원 미만 / 10~20만원 / 20~30만원 / 30만원 이상")
    child_plan: str = Field(..., description="자녀 없음·계획 없음 / 자녀 있음 / 계획 있음")
    # 2단계: 원하는 아이 성향 (3개)
    activity_pref: str = Field(..., description="조용하고 차분한 아이 / 적당히 활발한 아이 / 활발하고 에너지 넘치는 아이")
    sociability_pref: str = Field(..., description="독립적인 편이 좋아요 / 적당히 붙어있는 게 좋아요 / 항상 곁에 있고 싶어요")
    keywords: List[str] = Field(default_factory=list, description='성향 키워드(다중)')


# ========== 진단 응답 (POST /api/diagnose) ==========
class MonthlyCost(BaseModel):
    min: int = Field(..., description="예상 월 양육비 하한(만원)")
    max: int = Field(..., description="예상 월 양육비 상한(만원)")
    gov_support: Optional[int] = Field(None, description="정부 입양 지원(만원, 있으면)")


class DiagnoseResponse(BaseModel):
    grade: str = Field(..., description='"입양 가능" / "조건부 가능" / "신중히 재고" 중 하나')
    good_points: List[str] = Field(..., description="잘 맞는 점(사용자 언어)")
    check_points: List[str] = Field(..., description="보완·확인이 필요한 점(사용자 언어)")
    monthly_cost: MonthlyCost


# ========== 매칭 응답 (POST /api/match) ==========
class MatchResult(BaseModel):
    animal_id: str
    match_score: int = Field(..., ge=1, le=10, description="매칭 점수 1~10")
    recommend_reason: str = Field(..., description="추천 이유 한 줄(사용자 언어)")


class MatchResponse(BaseModel):
    results: List[MatchResult]
