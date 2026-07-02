"""
ai_matching.py — [개발자 B] 매칭 추천 LangChain 서비스.

흐름: 사용자 설문 + 동물 데이터(activity·sociability 등 척도) → LLM → 3~5마리 추천
      각 추천: animal_id + match_score(1~10) + recommend_reason(한 줄).

안전장치:
  1) 출력은 Structured Outputs(JSON) 강제.
  2) LLM이 없는/실패 시 로컬 점수 규칙으로 폴백(데모가 항상 3~5마리를 낸다).
  3) 응답은 가볍게: animal_id·점수·이유만. 나머지 표시정보는 프론트가 animals.json에서 찾음.
"""
from typing import List

from .. import config, rag
from ..schemas import MatchResponse, MatchResult, SurveyInput

try:
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_openai import ChatOpenAI

    _IMPORT_OK = True
except Exception:
    _IMPORT_OK = False

LLM_ENABLED = _IMPORT_OK and bool(config.OPENAI_API_KEY)

# 선호 → 목표 척도(1~5) 매핑
_ACTIVITY_TARGET = {"조용하고 차분한 아이": 2, "적당히 활발한 아이": 3, "활발하고 에너지 넘치는 아이": 5}
_SOC_TARGET = {"독립적인 편이 좋아요": 2, "적당히 붙어있는 게 좋아요": 3, "항상 곁에 있고 싶어요": 5}
_SMALL_HOUSING = {"원룸·오피스텔", "아파트", "빌라·다세대"}

SYSTEM_PROMPT = (
    "당신은 유기동물 매칭 추천가입니다. 사용자의 생활환경·선호와 각 동물의 특성(활동성 activity, "
    "사회성 sociability, 공격성 aggression, 건강 health_state 등 1~5 척도)과 성향 태그를 비교해 "
    "가장 잘 맞는 3~5마리를 고르세요.\n"
    "규칙:\n"
    "- 반드시 후보 목록에 있는 animal_id만 사용.\n"
    "- match_score는 1~10 정수. 낮은 점수도 정직하게(신중히 재고 상황이라도 매칭은 진행).\n"
    "- recommend_reason은 사용자 언어의 한 줄(예: '하루 30분 산책이면 충분해 지금 생활과 잘 맞아요').\n"
    "- '부적합/불가' 같은 단어 금지."
)


def _candidate_brief(animals: List[dict]) -> str:
    lines = []
    for a in animals:
        lines.append(
            f"- id={a.get('id')} | {a.get('name')} | {a.get('species')}/{a.get('breeds')} "
            f"| 크기 {a.get('size')} | 활동성 {a.get('activity')} | 사회성 {a.get('sociability')} "
            f"| 공격성 {a.get('aggression')} | 건강 {a.get('health_state')} "
            f"| 지역 {a.get('city')} | 태그 {', '.join(a.get('tags', []))}"
        )
    return "\n".join(lines)


def _llm_match(survey: SurveyInput) -> MatchResponse:
    animals = rag.load_animals()
    preferred_cities = survey.preferred_cities or []
    
    # 1차 필터링: 선호 지역 해당 동물
    filtered_animals = [a for a in animals if a.get("city") in preferred_cities]
    
    # 선호 지역 매칭 동물이 4마리 이상 넉넉하면 후보군을 해당 지역 동물로만 축소 전달,
    # 부족하면 전체 동물을 대상으로 하되 프롬프트에 선호지역 가중 지시
    candidates_to_send = filtered_animals if len(filtered_animals) >= 4 else animals

    llm = ChatOpenAI(model=config.OPENAI_MODEL, api_key=config.OPENAI_API_KEY, temperature=0.3)
    structured = llm.with_structured_output(MatchResponse)
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT),
            (
                "human",
                "[사용자 입력]\n주거 {housing} / 외출 {out_hours} / 산책 {walk_time} / 경험 {pet_experience} "
                "/ 예산 {budget} / 자녀 {child_plan}\n"
                "활동성 선호 {activity_pref} / 친화도 선호 {sociability_pref} / 키워드 {keywords} / 선호 지역 {preferred_cities}\n\n"
                "[후보 동물]\n{candidates}\n\n"
                "가장 잘 맞는 3~5마리를 JSON(results[])으로 주세요. 사용자의 선호 지역과 매칭되는 동물을 최우선적으로 골려주세요.",
            ),
        ]
    )
    chain = prompt | structured
    result: MatchResponse = chain.invoke(
        {
            "housing": survey.housing,
            "out_hours": survey.out_hours,
            "walk_time": survey.walk_time,
            "pet_experience": survey.pet_experience,
            "budget": survey.budget,
            "child_plan": survey.child_plan,
            "activity_pref": survey.activity_pref,
            "sociability_pref": survey.sociability_pref,
            "keywords": ", ".join(survey.keywords) if survey.keywords else "(없음)",
            "preferred_cities": ", ".join(preferred_cities) if preferred_cities else "(없음)",
            "candidates": _candidate_brief(candidates_to_send),
        }
    )
    # 존재하지 않는 id는 제거(환각 방지)
    valid_ids = {a.get("id") for a in animals}
    result.results = [r for r in result.results if r.animal_id in valid_ids][:5]
    if not result.results:
        raise ValueError("LLM이 유효한 매칭을 내지 못함 → 폴백")
    return result


def _fallback_match(survey: SurveyInput) -> MatchResponse:
    """LLM 없이도 항상 3~5마리를 내는 로컬 점수 규칙."""
    animals = rag.load_animals()
    t_act = _ACTIVITY_TARGET.get(survey.activity_pref, 3)
    t_soc = _SOC_TARGET.get(survey.sociability_pref, 3)
    kw = set(survey.keywords or [])
    preferred_cities = survey.preferred_cities or []

    # 선호 지역 조건 충족 리스트 필터링
    filtered_animals = [a for a in animals if a.get("city") in preferred_cities]
    use_strict_filter = len(filtered_animals) >= 4
    candidates = filtered_animals if use_strict_filter else animals

    scored = []
    for a in candidates:
        score = 10.0
        act = a.get("activity", 3)
        soc = a.get("sociability", 3)

        # 선호 지역 가점 시스템 (필터링 완화 상황에서 선호지역 동물이 우선 랭킹을 먹게 유도)
        is_preferred_city = a.get("city") in preferred_cities
        if not use_strict_filter and is_preferred_city:
            score += 5.0

        score -= abs(act - t_act) * 1.2      # 활동성 선호 차이
        score -= abs(soc - t_soc) * 1.2      # 사회성 선호 차이

        # 성향 키워드 ↔ 동물 태그 겹침 가점
        overlap = kw & set(a.get("tags", []))
        score += len(overlap) * 0.8

        # 주거가 좁은데 대형견이면 감점
        if survey.housing in _SMALL_HOUSING and a.get("size") == "대형":
            score -= 2.0
        # 산책 짧은데 활동성 높으면 감점
        if survey.walk_time == "30분 미만" and act >= 4:
            score -= 1.5
        # 초보인데 '초보자와 잘 맞아요' 태그면 가점
        if survey.pet_experience == "없음" and "초보자와 잘 맞아요" in a.get("tags", []):
            score += 1.0

        score = max(1, min(10, round(score)))

        # 동물 지칭어 결정
        raw_name = a.get("name", "").strip()
        is_nameless_animal = not raw_name or "지어주세요" in raw_name or "이름 짓는 중" in raw_name or "없음" in raw_name
        ref_word = "이 아이는" if is_nameless_animal else f"'{raw_name}' 친구는"

        # 추천 이유(더 매력적이고 길게)
        if overlap:
            reason = f"{ref_word} '{list(overlap)[0]}' 성격이 뚜렷하여 원하셨던 반려 생활 상에 아주 잘 맞고 깊은 애정 어린 교감을 이뤄내실 수 있어요."
        elif abs(act - t_act) <= 1:
            reason = f"{ref_word} 평소 차분하고 조화로운 활동량을 지녀 보호자님의 일상 생활 주기 및 산책 리듬과 어색함 없이 훌륭히 매칭됩니다."
        elif abs(soc - t_soc) <= 1:
            reason = f"{ref_word} 사람과의 교감 선호도가 보호자님께서 원하셨던 바와 매우 유사하여 서로 마주할 때 최고의 심리적 위안을 줄 수 있습니다."
        elif survey.housing in _SMALL_HOUSING and a.get("size") == "소형":
            reason = f"{ref_word} 아담한 체구의 소형견이라 현재 보호자님의 주거 공간 내에서도 답답함 없이 아늑하고 편안하게 지낼 수 있어 추천해 드립니다."
        else:
            reason = f"{ref_word} 전반적인 성격과 성향이 무난하고 모나지 않아 보호자님 가정에 새로운 활력과 따뜻한 행복을 선사해 줄 것입니다."

        scored.append((score, a.get("id"), reason))

    # 점수 높은 순 3~5마리
    scored.sort(key=lambda x: -x[0])
    top = scored[:5]
    results = [MatchResult(animal_id=i, match_score=s, recommend_reason=r) for s, i, r in top]
    return MatchResponse(results=results)


def run_match(survey: SurveyInput) -> MatchResponse:
    """매칭 실행 진입점. LLM 우선, 실패/불가 시 로컬 점수 규칙으로 폴백."""
    if LLM_ENABLED:
        for attempt in range(2):
            try:
                return _llm_match(survey)
            except Exception as e:
                print(f"[ai_matching] LLM 실패(attempt {attempt+1}): {e!r}")
    return _fallback_match(survey)
