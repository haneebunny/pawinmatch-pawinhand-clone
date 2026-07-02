"""
routers/questions.py — [개발자 A/B 공통] 보호소 질문지 및 자가점검 체크리스트 API.

1) questions: 입양 희망자가 보호소 담당자에게 동물에 대해 여쭤보는 진짜 질문 리스트 (정적 공통 템플릿)
2) checklist: 입양 희망자가 본인을 체크하는 자가점검 리스트 (RAG 자가진단 자료 기반)
"""
from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel

from .. import rag

router = APIRouter(prefix="/api", tags=["questions"])

class QuestionRequest(BaseModel):
    species: Optional[str] = "dog"
    housing: Optional[str] = None
    out_hours: Optional[str] = None
    walk_time: Optional[str] = None
    pet_experience: Optional[str] = None
    budget: Optional[str] = None
    child_plan: Optional[str] = None

# --- 보호소 담당자에게 물어볼 진짜 질문 목록 (정적 공통 템플릿 - AGENTS.md 지침 반영) ---
SHELTER_QUESTIONS_DOG = [
    # 건강상태
    {"category": "건강상태", "text": "현재까지 완료된 예방접종 카드와 심장사상충 등 구충 약력을 볼 수 있나요?"},
    {"category": "건강상태", "text": "기본 건강 검진 외에 보호소에서 특별히 앓았던 질병이나 매일 챙겨줘야 하는 약이 있나요?"},
    {"category": "건강상태", "text": "중성화 수술이 이미 완료된 상태인가요? 미완료 시 수술 지원이나 연계가 가능한가요?"},
    # 행동/성격
    {"category": "행동/성격", "text": "보호소에 처음 입소했을 때와 비교해 성격이나 낯가림이 많이 밝아졌는지 궁금해요."},
    {"category": "행동/성격", "text": "특정 소음(초인종, 천둥 등)이나 갑작스러운 만짐에 으르렁거리거나 예민하게 반응하나요?"},
    {"category": "행동/성격", "text": "사료나 간식을 먹을 때 그릇 주변을 지키려고 짖거나 으르렁거리는 식탐 입질이 있나요?"},
    # 산책/활동
    {"category": "산책/활동", "text": "야외 산책할 때 보호자의 보폭에 맞춰 걷는 편인가요, 아니면 줄당김이 심한 편인가요?"},
    {"category": "산책/활동", "text": "야외 배변만 고집하는 아이인가요? 보호소 실내에서 배변 패드를 사용하는지 궁금합니다."},
    {"category": "산책/활동", "text": "평소 장난감 물어오기나 터그 놀이 같은 사냥 본능 놀이에 적극적인 편인가요?"},
    # 사회성
    {"category": "사회성", "text": "보호소 내의 다른 강아지 친구들과 마찰 없이 친화적으로 잘 어울려 노는 편인가요?"},
    {"category": "사회성", "text": "성별(남성/여성)이나 어린이 등 특정 연령대 사람을 유독 두려워하거나 경계하지는 않나요?"},
    {"category": "사회성", "text": "사람이 쓰다듬어 주거나 안아줄 때 거부감 없이 얌전하게 스킨십을 잘 받아들이나요?"},
    # 입양절차
    {"category": "입양절차", "text": "이 아이의 입양을 최종 결정하게 되면 당일에 즉시 데려갈 수 있나요? 필수 서류가 무엇인가요?"},
    {"category": "입양절차", "text": "지자체에서 지원하는 유기동물 입양 진료비 지원금 혜택을 신청하는 절차가 어떻게 되나요?"},
    {"category": "입양절차", "text": "입양 확정 후 가정으로 데려가기 전 보호소에서 연계해 주는 기본 위생 미용이나 목욕 서비스가 있나요?"}
]

SHELTER_QUESTIONS_CAT = [
    # 건강상태
    {"category": "건강상태", "text": "기초 예방접종(종합백신 등)과 구충은 몇 차까지 완료되었고 증빙 서류를 받을 수 있나요?"},
    {"category": "건강상태", "text": "고양이에게 흔한 허피스, 칼리시 등 호흡기 질환이나 결막염 등을 앓은 적이 있나요?"},
    {"category": "건강상태", "text": "중성화 수술 여부와 전염성 복막염(FIP)이나 귓진드기 등 기초 질병 검사를 완료했나요?"},
    # 행동/성격
    {"category": "행동/성격", "text": "보호소 방 안에서 주로 구석에 숨어 지내는지, 아니면 사람에게 먼저 다가와 부비적거리나요?"},
    {"category": "행동/성격", "text": "손길을 내밀었을 때 하악질을 하거나 발톱을 세우는 등 방어적 공격 성향이 남아있나요?"},
    {"category": "행동/성격", "text": "특정 만짐(등, 배, 꼬리 등)에 예민하여 갑자기 물려고 하는 행동(터치 오버)이 있나요?"},
    # 산책/활동
    {"category": "산책/활동", "text": "보호소 실내에서 낚싯대나 레이저 포인터 같은 사냥 놀이를 할 때 반응이 빠른 편인가요?"},
    {"category": "산책/활동", "text": "화장실 모래(벤토나이트/두부 모래 등) 종류에 관계없이 배변 실수를 하지 않고 잘 가리나요?"},
    {"category": "산책/활동", "text": "보호소 내 캣타워나 수직 공간을 활발하게 오르내리는 활발한 에너지를 지녔나요?"},
    # 사회성
    {"category": "사회성", "text": "보호소 내 다른 고양이들과 한 방에서 마찰 없이 평화롭게 다묘 합사 생활을 잘하나요?"},
    {"category": "사회성", "text": "사람 곁을 맴돌며 골골송을 부르거나 무릎에 올라앉는 개냥이 성향을 가졌는지 궁금해요?"},
    {"category": "사회성", "text": "낯선 사람이나 낯선 환경에 노출되었을 때 적응하고 숨는 시간이 평균 어느 정도 걸리나요?"},
    # 입양절차
    {"category": "입양절차", "text": "입양 신청서 제출 후 심사를 거쳐 최종 데려갈 때까지의 평균 대기 기간이 며칠인가요?"},
    {"category": "입양절차", "text": "지자체 유기묘 입양 의료비 지원사업 혜택을 받기 위해 영수증이나 청구서를 어떻게 발급받나요?"},
    {"category": "입양절차", "text": "입양 당일 고양이를 안전하게 데려가기 위해 켄넬(이동장) 외에 별도로 필수 준비해야 할 물품이 있나요?"}
]

def format_to_friendly_question(text: str) -> str:
    text = text.strip()
    # 통계 및 자가진단 질문에 대한 매끄러운 존댓말 가공
    if "월평균 양육비" in text:
        return "월평균 약 18만 원 수준의 예상 양육비를 매달 안정적으로 지출할 준비가 되셨나요?"
    if "초기비용" in text or "초기 입양" in text:
        return "첫 용품 마련 및 초기 입양 비용(약 50~100만 원)을 지출할 예산이 준비되어 있나요?"
    if "보험 또는 적금 권장" in text:
        return "반려동물의 갑작스러운 부상이나 질병 치료비에 대비해 보험이나 비상 적금을 고려하고 계신가요?"
    if "방묘창" in text and "방묘문" in text:
        return "고양이의 안전을 위한 방묘창 및 방묘문(150cm 이상) 설치 계획이 있으신가요?"
    
    if text.endswith("는가"):
        text = text[:-2] + "나요?"
    elif text.endswith("인가"):
        text = text[:-2] + "인가요?"
    elif text.endswith("가"):
        text = text[:-1] + "나요?"
    elif text.endswith("다"):
        text = text[:-1] + "나요?"
    
    if not text.endswith("?"):
        text += "?"
    return text

@router.post("/questions")
def get_questions(payload: QuestionRequest):
    """
    지정된 축종(dog 또는 cat)에 맞춰 보호소에 물어볼 질문 목록(category별)과
    신청자가 본인을 되돌아보는 자가점검 체크리스트(checklist)를 반환합니다.
    """
    species_lower = (payload.species or "dog").strip().lower()
    if species_lower not in ("dog", "cat"):
        species_lower = "dog"
        
    # 1. 보호소 추천 질문 (true inquiries to shelter) - species에 맞추어 완전 정적 반환
    questions_list = SHELTER_QUESTIONS_CAT if species_lower == "cat" else SHELTER_QUESTIONS_DOG
    
    # 2. 입양 자가점검 체크리스트 (RAG 자가진단 항목 기반)
    checklist_set = set()
    try:
        all_questions = rag.load_screening_questions()
        # species가 일치하고 bundle이 "A"(자가점검)인 항목의 criteria들만 추출
        filtered_raw = [
            q for q in all_questions
            if q.get("species", "").strip().lower() == species_lower and q.get("bundle") == "A"
        ]
        for q in filtered_raw:
            criteria = q.get("criteria", [])
            if criteria:
                for c in criteria[:1]: # 항목당 1개 대표 기준 수집
                    checklist_set.add(format_to_friendly_question(c))
    except Exception as e:
        print(f"[questions] 자가점검 RAG 데이터 로드 오류 (기본값 폴백): {e}")
        
    default_checklist = [
        "가족 구성원 전원이 입양에 확실하게 동의하셨나요?",
        "동물을 평생 책임지고 키울 수 있는 안정적인 경제적 준비가 되셨나요?",
        "거주 공간 내에 반려동물 사육 금지 규약이나 임대인 갈등 요인은 없나요?",
        "매일 산책과 사냥놀이, 교감을 위한 전용 시간(최소 1~2시간)을 내어줄 수 있나요?",
        "가족 구성원 중 동물 털이나 침에 대한 알레르기 반응이 없는지 사전 확인하셨나요?"
    ]
    
    checklist_list = list(checklist_set)
    # 개수가 너무 적거나 로드 실패 시 디폴트 탑재
    if len(checklist_list) < 4:
        # 고양이용 기본 체크리스트 보완
        if species_lower == "cat":
            checklist_list = [
                "가족 구성원 전원이 고양이 입양에 확실하게 합의하셨나요?",
                "사료, 모래, 정기 검진 및 비상 의료비를 매달 지출할 재정적 준비가 되셨나요?",
                "베란다, 창문 등 낙상 위험 구역에 방묘창과 방묘문 설치를 완료하셨나요?",
                "고양이에게 치명적인 독성 식물(백합, 튤립 등)이나 세제 등을 안전하게 정리하셨나요?",
                "가족 중 고양이 알레르기(Fel d1) 반응자가 없는지 피부/혈액 검사로 확인하셨나요?"
            ]
        else:
            checklist_list = default_checklist
            
    return {
        "questions": questions_list,
        "checklist": checklist_list[:5]
    }
