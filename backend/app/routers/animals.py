"""
routers/animals.py — [개발자 A] 유기동물 조회 및 시/도(city)별 필터링 API.
"""
from typing import List, Optional
from fastapi import APIRouter, Query

from ..schemas import AnimalResponse
from .. import rag

router = APIRouter(prefix="/api", tags=["animals"])


@router.get("/animals", response_model=List[AnimalResponse])
def get_animals(
    city: Optional[str] = Query(None, description="시/도 필터 (예: 경상남도)")
):
    """
    유기동물 전체 목록 또는 특정 시/도(city) 소속의 유기동물 목록을 반환합니다.
    """
    try:
        # RAG 모듈에서 107마리 동물 고정 JSON 데이터를 로드합니다.
        animals = rag.load_animals()
    except Exception as e:
        # 데이터 누락이나 읽기 오류 발생 시, 500 에러 대신 빈 리스트를 리턴해 안전을 보장합니다.
        print(f"[animals] 데이터 로드 실패: {e}")
        return []

    # city 파라미터가 유입될 경우 필터링을 수행합니다.
    if city:
        target_city = city.strip()
        # 데이터에 city 필드가 존재하고, 검색어가 포함되는 경우 부분 일치(in) 필터링
        animals = [
            animal for animal in animals
            if animal.get("city") and target_city in animal.get("city")
        ]

    return animals
