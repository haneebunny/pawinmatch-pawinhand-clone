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
    "당신은 유기동물 매칭 추천가입니다. 사용자의 생활환경(주거 housing, 외출 out_hours, 산책 walk_time, 경험 pet_experience, 예산 budget, 자녀 child_plan, 선호 지역 preferred_cities)과 "
    "사용자가 바라는 성향(활동성 선호 activity_pref, 친화도 선호 sociability_pref, 키워드 keywords) 총 10가지 조건을 아주 꼼꼼하게 전부 종합하여, 각 동물의 특성(활동성, 사회성, 공격성, 건강상태 등 1~5 척도)과 비교 분석하세요.\n"
    "규칙:\n"
    "- 반드시 후보 목록에 있는 animal_id만 사용.\n"
    "- match_score는 1~10 정수.\n"
    "- recommend_reason은 사용자가 선택한 주거 형태, 활동성 선호, 외출 시간, 예산 등 10가지 조건 중 왜 이 아이를 추천하는지 설득력 있고 풍부한 판단 근거를 2~3문장 분량의 매력적인 한글 문장으로 자세히 적어주세요.\n"
    "- 이때, 이 아이를 매칭한 핵심적인 판단 근거(예: '사람 손길을 좋아해요', '얌전하고 온순한 성격', '하루 30분 산책이면 충분해요' 등)에 해당하는 주요 구절은 반드시 양 끝에 '=='를 붙여 ==핵심근거== 형태로 감싸서 작성해 주세요. (예: '==사람 손길을 좋아하고 온순한 성향==을 지녀 원룸 공간에서도 보호자님을 졸졸 따르며 최고의 위로를 안겨줄 것입니다.')\n"
    "- 이름이 미정인 동물이면 반드시 이름 대신 '이 아이' 혹은 '이 아이는'이라는 대명사를 사용해 주세요.\n"
    "- '부적합/불가' 같은 거절 단어는 사용 금지."
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
    raw_animals = rag.load_animals()
    exclude_ids = survey.exclude_ids or []
    
    # Exclude already recommended animals to prevent duplication
    animals = [a for a in raw_animals if a.get("id") not in exclude_ids]
    
    preferred_cities = survey.preferred_cities or []
    is_all_region = not preferred_cities or "전체" in preferred_cities or "전국" in preferred_cities
    display_cities = "(지역 제한 없음)" if is_all_region else ", ".join(preferred_cities)
    
    # [최적화] 107마리를 모두 LLM에 던지면 토큰이 너무 비대해져서 15초 이상 지연됩니다.
    # 로컬 간단 점수 매김을 통해 가장 어울리는 상위 15마리만 1차로 엄선하여 LLM 심사에 부칩니다. (응답 1.5초대 달성)
    scored = []
    t_act = _ACTIVITY_TARGET.get(survey.activity_pref, 3)
    t_soc = _SOC_TARGET.get(survey.sociability_pref, 3)
    kw = set(survey.keywords or [])
    
    for a in animals:
        score = 10.0
        act = a.get("activity", 3)
        soc = a.get("sociability", 3)

        # 선호 지역 가점
        if not is_all_region and a.get("city") in preferred_cities:
            score += 5.0

        score -= abs(act - t_act) * 1.2
        score -= abs(soc - t_soc) * 1.2
        
        # 키워드 가점
        overlap = kw & set(a.get("tags", []))
        score += len(overlap) * 0.8
        
        # 좁은 주택 대형견 감점
        if survey.housing in _SMALL_HOUSING and a.get("size") == "대형":
            score -= 2.0
            
        scored.append((score, a))
        
    scored.sort(key=lambda x: -x[0])
    candidates_to_send = [item[1] for item in scored[:15]]

    llm = ChatOpenAI(model=config.OPENAI_MODEL, api_key=config.OPENAI_API_KEY, temperature=0.3)
    structured = llm.with_structured_output(MatchResponse)
    
    matching_instruction = "사용자의 선호 지역과 매칭되는 동물을 최우선적으로 골라주세요." if not is_all_region else "사용자가 지정한 선호 지역 조건이 없으므로(지역 무관), 전국 보호소에 있는 아이들 중에서 오직 성향과 라이프스타일 궁합이 최고인 아이들을 최우선적으로 골라주세요. 추천 평에 사용자가 특정 지역을 선호한다는 등의 억지 설명은 절대 적지 마세요."
    
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT),
            (
                "human",
                "[사용자 입력]\n주거 {housing} / 외출 {out_hours} / 산책 {walk_time} / 경험 {pet_experience} "
                "/ 예산 {budget} / 자녀 {child_plan}\n"
                "활동성 선호 {activity_pref} / 친화도 선호 {sociability_pref} / 키워드 {keywords} / 선호 지역 {preferred_cities}\n\n"
                "[후보 동물]\n{candidates}\n\n"
                f"가장 잘 맞는 3~5마리를 JSON(results[])으로 주세요. {matching_instruction}",
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
            "preferred_cities": display_cities,
            "candidates": _candidate_brief(candidates_to_send),
        }
    )
    # 존재하지 않는 id는 제거(환각 방지)
    valid_ids = {a.get("id") for a in raw_animals}
    result.results = [r for r in result.results if r.animal_id in valid_ids][:5]
    if not result.results:
        raise ValueError("LLM이 유효한 매칭을 내지 못함 → 폴백")
    return result


def _fallback_match(survey: SurveyInput) -> MatchResponse:
    """LLM 없이도 항상 3~5마리를 내는 로컬 점수 규칙."""
    raw_animals = rag.load_animals()
    exclude_ids = survey.exclude_ids or []
    animals = [a for a in raw_animals if a.get("id") not in exclude_ids]
    
    t_act = _ACTIVITY_TARGET.get(survey.activity_pref, 3)
    t_soc = _SOC_TARGET.get(survey.sociability_pref, 3)
    kw = set(survey.keywords or [])
    preferred_cities = survey.preferred_cities or []
    
    is_all_region = not preferred_cities or "전체" in preferred_cities or "전국" in preferred_cities

    # 선호 지역 조건 충족 리스트 필터링
    if not is_all_region:
        filtered_animals = [a for a in animals if a.get("city") in preferred_cities]
        use_strict_filter = len(filtered_animals) >= 4
        candidates = filtered_animals if use_strict_filter else animals
    else:
        use_strict_filter = False
        candidates = animals

    scored = []
    for a in candidates:
        score = 10.0
        act = a.get("activity", 3)
        soc = a.get("sociability", 3)

        # 선호 지역 가점 시스템 (필터링 완화 상황에서 선호지역 동물이 우선 랭킹을 먹게 유도)
        is_preferred_city = not is_all_region and a.get("city") in preferred_cities
        if not is_all_region and not use_strict_filter and is_preferred_city:
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

        # 추천 이유(사용자 10가지 조건을 상세 고려하여 길고 따뜻한 텍스트로 보완)
        if overlap:
            reason = f"{ref_word} =='{list(overlap)[0]}' 성향==을 뚜렷하게 지니고 있어, 보호자님이 평소 원하셨던 반려견의 성격 키워드 및 생활 지표와 가장 조화롭게 매칭됩니다. 외출 시간({survey.out_hours}) 동안에도 혼자서 의젓하고 훌륭하게 시간을 보낼 수 있는 든든하고 영특함을 보여줍니다."
        elif abs(act - t_act) <= 1:
            reason = f"{ref_word} ==평소 차분하고 온화한 활동량==을 품고 있어, 하루에 {survey.walk_time} 내외로 산책을 즐기시는 보호자님의 라이프 리듬과 가장 잘 맞습니다. 좁은 주거 형태({survey.housing}) 공간에서도 큰 스트레스 없이 무난히 융화될 수 있는 최상의 파트너입니다."
        elif abs(soc - t_soc) <= 1:
            reason = f"{ref_word} ==사람과의 깊은 교감과 따뜻한 정을 갈구==하여, 반려 동물 경험 유무({survey.pet_experience})와 관계없이 언제나 곁에서 든든하게 보호자님을 믿고 의지해 줄 것입니다. 자녀 계획이나 가족 구성 환경({survey.child_plan}) 속에서도 최고의 심리적 안정감을 선물해 주는 다정한 존재입니다."
        elif survey.housing in _SMALL_HOUSING and a.get("size") == "소형":
            reason = f"{ref_word} ==아담하고 얌전한 소형 크기==로, 주택이나 아파트({survey.housing}) 환경에 최적화된 편안한 매칭 상태를 보입니다. 예산 계획({survey.budget})에 맞춰 부담 없이 안정적으로 보살필 수 있어 첫 반려 생활을 시작하기에 가장 든든한 강추 친구입니다."
        else:
            reason = f"{ref_word} ==전반적인 성격이 모나지 않고 매우 무난==하여, 보호자님의 생활 패턴이나 선호도 조건에 자연스럽게 녹아듭니다. 새로운 가족을 신중히 검토하시는 보호자님 가정에 든든한 활력과 따뜻한 위안을 가득 안겨줄 아이입니다."

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
