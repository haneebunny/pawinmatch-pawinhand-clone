"""
rag.py — [개발자 B] RAG 참고자료 로더 + 매칭용 동물 데이터 로더.

이 프로젝트의 RAG는 벡터DB를 쓰지 않습니다. (분량이 A4 1~2장이라 불필요)
대신 참고자료(jsonl)를 읽어 '텍스트 한 덩어리'로 만들어 프롬프트 앞에 그대로 붙입니다.

- load_reference_text(): pet_adoption_rules.jsonl → 진단 프롬프트에 넣을 참고 텍스트
- load_animals(): animals.json → 매칭 후보 동물 목록(개발자 A가 만든 고정 데이터)
"""
import json
from functools import lru_cache
from typing import List, Optional

from . import config


# ---------- 저수준 로더 ----------
def _load_jsonl(path) -> List[dict]:
    rows: List[dict] = []
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    rows.append(json.loads(line))
    except FileNotFoundError:
        print(f"[rag] 파일 없음: {path}")
    except json.JSONDecodeError as e:
        print(f"[rag] JSONL 형식 오류({path}): {e}")
    return rows


def _load_json(path) -> list:
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else [data]
    except FileNotFoundError:
        print(f"[rag] 파일 없음: {path}")
        return []
    except json.JSONDecodeError as e:
        print(f"[rag] JSON 형식 오류({path}): {e}")
        return []


# ---------- RAG 참고자료 ----------
@lru_cache(maxsize=1)
def _rules_cache() -> List[dict]:
    return _load_jsonl(config.RULES_FILE)


def load_rules(bundle: Optional[str] = None) -> List[dict]:
    """pet_adoption_rules.jsonl 룰 목록. bundle('A'·'B'…)로 필터 가능."""
    rows = _rules_cache()
    if bundle:
        rows = [r for r in rows if r.get("bundle") == bundle]
    return rows


def load_reference_text(bundle: Optional[str] = "A", limit: int = 20) -> str:
    """
    룰들을 'title + explanation' 형태의 텍스트로 이어붙여 반환.
    → 진단 체인에서 프롬프트 앞에 통째로 삽입하는 RAG 참고자료.
    """
    rows = load_rules(bundle)[:limit]
    blocks = []
    for r in rows:
        title = r.get("title", "")
        exp = r.get("explanation", "")
        guide = r.get("guide", "")
        blocks.append(f"- [{r.get('uid','')}] {title}\n  설명: {exp}\n  가이드: {guide}")
    return "\n".join(blocks)


# ---------- 매칭용 동물 데이터 ----------
@lru_cache(maxsize=1)
def load_animals() -> List[dict]:
    """animals.json 전체(매칭 후보). 개발자 A가 제공하는 고정 데이터."""
    return _load_json(config.ANIMALS_FILE)


@lru_cache(maxsize=1)
def load_screening_questions() -> List[dict]:
    """pre_adoption_screening.jsonl 질문지 룰 목록 캐시 로드"""
    return _load_jsonl(config.SCREENING_FILE)
