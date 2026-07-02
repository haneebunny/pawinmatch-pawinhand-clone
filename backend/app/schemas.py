"""
schemas.py — [개발자 B] 진단·매칭 API의 요청/응답 '형태'(Pydantic).

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
    preferred_cities: List[str] = Field(default_factory=list, description="선호 지역 (시/도) 리스트 (중복 가능)")


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


# ========== 유기동물 조회용 스펙 (GET /api/animals) ==========
class CommentSchema(BaseModel):
    user_id: Optional[str] = Field(None, description="댓글 작성자 ID")
    content: Optional[str] = Field(None, description="댓글 내용")
    update_time: Optional[str] = Field(None, description="작성/수정 시간 (YYYY-MM-DD HH:MM:SS)")


class AnimalResponse(BaseModel):
    id: str = Field(..., description="동물 고유 ID")
    name: str = Field(..., description="이름")
    photos: List[str] = Field(default_factory=list, description="이미지 URL 리스트")
    species: str = Field(..., description="축종 (개/고양이 등)")
    breeds: str = Field(..., description="품종")
    animal_age: str = Field(..., description="나이 정보")
    animal_sex: str = Field(..., description="성별 (암컷/수컷 등)")
    animal_weight: Optional[float] = Field(None, description="몸무게 (Kg)")
    size: str = Field(..., description="크기 구분 (소형/중형/대형)")
    neutered: str = Field(..., description="중성화 여부")
    health_state: int = Field(..., description="건강 상태 점수 (1~5)")
    activity: int = Field(..., description="활동성 점수 (1~5)")
    aggression: int = Field(..., description="공격성 점수 (1~5)")
    sociability: int = Field(..., description="사회성 점수 (1~5)")
    personality_comment: Optional[str] = Field(None, description="성격 설명 코멘트")
    tags: List[str] = Field(default_factory=list, description="성향 태그 목록")
    notice_no: Optional[str] = Field(None, description="공고 번호")
    notice_start: Optional[str] = Field(None, description="공고 시작일")
    notice_end: Optional[str] = Field(None, description="공고 종료일")
    found_location: Optional[str] = Field(None, description="발견 장소")
    shelter_id: str = Field(..., description="소속 보호소 ID")
    adoption_support: bool = Field(False, description="입양 지원비 대상 여부")
    adoption_support_detail: Optional[str] = Field(None, description="입양 지원비 상세 정보")
    city: Optional[str] = Field(None, description="지역 정보 (시도)")
    bell_count: Optional[int] = Field(0, description="알림 설정 수")
    comments: List[CommentSchema] = Field(default_factory=list, description="댓글 목록")

    class Config:
        from_attributes = True


# ========== 질문지 조회용 스펙 (POST /api/questions) ==========
class QuestionInput(BaseModel):
    species: str = Field(..., description="대상 축종 ('dog' 또는 'cat')")


class QuestionResponse(BaseModel):
    uid: str = Field(..., description="질문 항목 고유 ID (예: dog-A01)")
    species: str = Field(..., description="대상 축종 ('dog' 또는 'cat')")
    bundle: str = Field(..., description="카테고리 번들 (A, B 등)")
    bundle_name: str = Field(..., description="번들 카테고리명")
    title: str = Field(..., description="질문 제목")
    section: Optional[str] = Field(None, description="해당 문서 섹션명")
    explanation: str = Field(..., description="설명 문구")
    guide: str = Field(..., description="행동 가이드라인")
    criteria: List[str] = Field(default_factory=list, description="체크리스트 판단 기준")
    red_flags: List[str] = Field(default_factory=list, description="위험 신호(Red Flags)")
    source: Optional[str] = Field(None, description="출처")

    class Config:
        from_attributes = True
