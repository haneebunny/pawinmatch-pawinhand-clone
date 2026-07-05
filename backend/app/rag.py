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


def save_animals(animals_list: List[dict]) -> bool:
    """변경된 동물 정보를 animals.json에 쓰고 캐시를 비웁니다."""
    try:
        # 1. 백엔드 원본 데이터 갱신 (data/animals.json)
        with open(config.ANIMALS_FILE, "w", encoding="utf-8") as f:
            json.dump(animals_list, f, ensure_ascii=False, indent=2)
            
        # 2. 프론트엔드 정적 animals.js 모듈 실시간 동기화 (Next.js 핫리로드 및 리렌더링 감지용)
        frontend_js_path = config.BASE_DIR.parent / "frontend" / "app" / "data" / "animals.js"
        try:
            with open(frontend_js_path, "w", encoding="utf-8") as js_f:
                js_f.write("export const animals = ")
                json.dump(animals_list, js_f, ensure_ascii=False, indent=2)
                js_f.write(";\n")
        except Exception as fe_js_e:
            print(f"[rag] frontend animals.js 동기화 실패: {fe_js_e}")

        # 3. 프론트엔드 정적 animals.json 실시간 동기화 (JSON 임포트 폴백 감지용)
        frontend_json_path = config.BASE_DIR.parent / "frontend" / "app" / "data" / "animals.json"
        try:
            with open(frontend_json_path, "w", encoding="utf-8") as json_f:
                json.dump(animals_list, json_f, ensure_ascii=False, indent=2)
        except Exception as fe_json_e:
            print(f"[rag] frontend animals.json 동기화 실패: {fe_json_e}")

        load_animals.cache_clear()  # 캐시 무효화
        return True
    except Exception as e:
        print(f"[rag] animals.json 쓰기 실패: {e}")
        return False


# ---------- 이름 지어주기 투표 데이터 ----------
def load_votes() -> dict:
    """이름 투표 보관 파일(name_votes.json) 로드"""
    try:
        with open(config.VOTES_FILE, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        # 파일이 없으면 빈 딕셔너리로 시작
        return {}
    except Exception as e:
        print(f"[rag] name_votes.json 로딩 실패: {e}")
        return {}


def save_votes(votes_dict: dict) -> bool:
    """이름 투표 정보를 name_votes.json에 씁니다."""
    try:
        # 폴더 생성 보장
        config.VOTES_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(config.VOTES_FILE, "w", encoding="utf-8") as f:
            json.dump(votes_dict, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"[rag] name_votes.json 쓰기 실패: {e}")
        return False


@lru_cache(maxsize=1)
def load_screening_questions() -> List[dict]:
    """pre_adoption_screening.jsonl 질문지 룰 목록 캐시 로드"""
    return _load_jsonl(config.SCREENING_FILE)
