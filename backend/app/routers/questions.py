"""
routers/questions.py — [개발자 A] 보호소 질문지 및 사전 검진 질문 조회 API.
"""
from typing import List
from fastapi import APIRouter, HTTPException

from ..schemas import QuestionInput, QuestionResponse
from .. import rag

router = APIRouter(prefix="/api", tags=["questions"])


@router.post("/questions", response_model=List[QuestionResponse])
def get_questions(payload: QuestionInput):
    """
    지정된 축종(dog 또는 cat)에 맞는 사전 입양 자가점검 및 심사 질문지 목록을 반환합니다.
    """
    # 1. 입력받은 축종 문자열의 공백을 제거하고 소문자로 변환합니다.
    species_lower = payload.species.strip().lower()
    
    # 2. 유효성 검증: 'dog' 또는 'cat'만 허용합니다. (잘못된 인입 시 400 에러 처리)
    if species_lower not in ("dog", "cat"):
        raise HTTPException(
            status_code=400, 
            detail="요청하신 축종 형식이 올바르지 않습니다. 'dog' 또는 'cat'을 입력해주세요."
        )
        
    try:
        # 3. RAG 모듈을 통해 캐싱된 사전 질문 데이터(pre_adoption_screening.jsonl)를 로드합니다.
        all_questions = rag.load_screening_questions()
    except Exception as e:
        # 예외 안전망: 데이터 로드 예외 시 500 에러 대신 빈 리스트를 리턴해 클라이언트 오동작을 예방합니다.
        print(f"[questions] 질문 데이터 로드 오류: {e}")
        return []
    
    # 4. 사용자가 요청한 축종(species)에 맞는 질문만 필터링합니다.
    filtered = [
        q for q in all_questions
        if q.get("species", "").strip().lower() == species_lower
    ]
    
    return filtered
