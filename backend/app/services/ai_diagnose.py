"""
ai_diagnose.py — [개발자 B] 적합도 진단 LangChain 서비스.

흐름: 사용자 설문(2단계) + RAG 참고자료(pet_adoption_rules) → LLM → JSON 강제 → DiagnoseResponse

핵심 안전장치(AGENTS/SKILL 규칙):
  1) 출력은 Structured Outputs(JSON)로 강제해 파싱 에러를 막는다.
  2) LLM 호출/파싱 실패 시 1회 재시도 → 그래도 실패하면 '안전한 기본값(로컬 규칙)'으로 응답.
  3) API 키가 없거나 LangChain 미설치면 자동으로 로컬 규칙 결과를 준다(데모가 항상 돌아가게).
  4) 결과 문장은 사용자 언어로. "부적합/불가" 같은 단어는 쓰지 않는다.
"""
from typing import List

from .. import config, rag
from ..logger import logger, log_event
from ..schemas import DiagnoseResponse, MonthlyCost, SurveyInput

# LangChain은 설치·키가 있을 때만 사용. 없으면 로컬 규칙으로 폴백.
try:
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_openai import ChatOpenAI

    _IMPORT_OK = True
except Exception:  # 미설치 등
    _IMPORT_OK = False

LLM_ENABLED = _IMPORT_OK and bool(config.OPENAI_API_KEY)

GRADES = ["입양 가능", "조건부 가능", "신중히 재고"]

SYSTEM_PROMPT = (
    "당신은 유기동물 입양 적합도를 진단하는 상담가입니다. "
    "아래 참고자료와 사용자의 생활환경·선호를 바탕으로 3단계 등급과 근거를 제시하세요.\n"
    "규칙:\n"
    "- grade는 반드시 '입양 가능' / '조건부 가능' / '신중히 재고' 중 하나.\n"
    "- '부적합' '불가' 같은 단어는 절대 쓰지 말고, 거절이 아니라 준비를 돕는 따뜻한 말투로.\n"
    "- 문장은 기술 지표가 아니라 사용자 언어로(예: '하루 30분 산책이면 충분해요').\n"
    "- good_points(잘 맞는 점)와 check_points(보완·확인할 점)는 각각 2~4개.\n"
    "- monthly_cost는 예상 월 양육비 범위(만원)와 정부지원(있으면)을 숫자로."
)


def _build_prompt():
    return ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT),
            (
                "human",
                "[참고자료]\n{reference}\n\n"
                "[사용자 입력]\n"
                "주거형태: {housing}\n하루 외출시간: {out_hours}\n산책 가능 시간: {walk_time}\n"
                "반려 경험: {pet_experience}\n월 예산: {budget}\n자녀 계획: {child_plan}\n"
                "활동성 선호: {activity_pref}\n사람 친화도 선호: {sociability_pref}\n"
                "성향 키워드: {keywords}\n\n"
                "위 정보를 근거로 진단 결과를 JSON으로 주세요.",
            ),
        ]
    )


def _llm_diagnose(survey: SurveyInput) -> DiagnoseResponse:
    llm = ChatOpenAI(model=config.OPENAI_MODEL, api_key=config.OPENAI_API_KEY, temperature=0.3)
    structured = llm.with_structured_output(DiagnoseResponse)  # JSON 강제
    chain = _build_prompt() | structured
    result: DiagnoseResponse = chain.invoke(
        {
            "reference": rag.load_reference_text(bundle="A"),
            "housing": survey.housing,
            "out_hours": survey.out_hours,
            "walk_time": survey.walk_time,
            "pet_experience": survey.pet_experience,
            "budget": survey.budget,
            "child_plan": survey.child_plan,
            "activity_pref": survey.activity_pref,
            "sociability_pref": survey.sociability_pref,
            "keywords": ", ".join(survey.keywords) if survey.keywords else "(없음)",
        }
    )
    # 안전장치: 혹시 등급이 세 값이 아니면 조건부로 보정
    if result.grade not in GRADES:
        result.grade = "조건부 가능"
    return result


def _fallback_diagnose(survey: SurveyInput) -> DiagnoseResponse:
    """LLM 없이도 항상 동작하는 로컬 규칙 진단(데모 안전판)."""
    good: List[str] = []
    check: List[str] = []

    # 시간·산책
    if survey.out_hours == "4시간 미만":
        good.append("집에 있는 시간이 있어 아이가 혼자 있는 시간이 짧아요")
    if survey.out_hours == "8시간 이상" and survey.walk_time == "30분 미만":
        check.append("집을 비우는 시간이 길고 산책 시간이 짧아, 혼자 있는 시간을 채워줄 방법(펫시터·산책 서비스)을 준비하면 좋아요")
    if survey.walk_time == "1시간 이상":
        good.append("매일 산책 시간을 넉넉히 낼 수 있어요")

    # 예산
    if survey.budget in ("20~30만원", "30만원 이상"):
        good.append("양육비를 안정적으로 준비하고 있어요")
    if survey.budget == "10만원 미만":
        check.append("월 예산이 빠듯할 수 있어, 사료·병원비 같은 고정비를 미리 계획해두면 안심돼요")

    # 경험
    if survey.pet_experience == "있음(현재도 있음)":
        good.append("반려 경험이 있어 돌봄에 익숙해요")
    if survey.pet_experience == "없음":
        check.append("첫 반려라면 입양 전 교육을 듣거나 초보자와 잘 맞는 아이부터 시작하는 걸 추천해요")

    # 주거
    if survey.housing == "원룸·오피스텔":
        check.append("공간이 넓지 않아, 소형견·소형묘가 더 편하게 지낼 수 있어요")
    if survey.housing in ("아파트", "단독주택"):
        good.append("아이가 지낼 생활 공간을 마련할 수 있어요")

    # 자녀
    if survey.child_plan in ("자녀 있음", "계획 있음"):
        check.append("아이와 함께 지내기 좋도록 온순한 성향의 아이를 함께 고려해보세요")

    # 최소 1개씩은 채워 화면이 비지 않게
    if not good:
        good.append("입양을 진지하게 준비하고 있다는 점이 가장 큰 강점이에요")
    if not check:
        check.append("입양 전 기본 용품과 병원 정보를 미리 챙겨두면 더 든든해요")

    # 등급: 보완점 개수로 판단(거절이 아니라 준비 정도)
    n = len(check)
    grade = "입양 가능" if n <= 1 else ("조건부 가능" if n <= 3 else "신중히 재고")

    return DiagnoseResponse(
        grade=grade,
        good_points=good,
        check_points=check,
        monthly_cost=MonthlyCost(min=12, max=19, gov_support=25),
    )


def run_diagnose(survey: SurveyInput) -> DiagnoseResponse:
    """진단 실행 진입점. LLM 우선, 실패/불가 시 로컬 규칙으로 안전하게 폴백."""
    request_details = {
        "housing": survey.housing,
        "out_hours": survey.out_hours,
        "walk_time": survey.walk_time,
        "pet_experience": survey.pet_experience,
        "budget": survey.budget,
        "child_plan": survey.child_plan,
        "activity_pref": survey.activity_pref,
        "sociability_pref": survey.sociability_pref,
        "keywords": survey.keywords
    }
    log_event("Diagnosis_Request", request_details)

    result = None
    is_llm = False

    if LLM_ENABLED:
        for attempt in range(2):  # 최초 1회 + 재시도 1회
            try:
                result = _llm_diagnose(survey)
                is_llm = True
                break
            except Exception as e:
                logger.warning(f"[ai_diagnose] LLM 실패(attempt {attempt+1}): {e!r}")

    if result is None:
        result = _fallback_diagnose(survey)

    response_details = {
        "grade": result.grade,
        "good_points_count": len(result.good_points),
        "check_points_count": len(result.check_points),
        "monthly_cost": {
            "min": result.monthly_cost.min,
            "max": result.monthly_cost.max,
            "gov_support": result.monthly_cost.gov_support
        },
        "method": "LLM" if is_llm else "Fallback"
    }
    log_event("Diagnosis_Success", response_details)
    return result
