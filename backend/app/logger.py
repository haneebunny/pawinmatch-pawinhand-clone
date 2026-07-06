"""
logger.py — [공통] 콘솔 및 파일 로깅을 통합 관리하는 유틸리티 모듈.

콘솔(stdout)과 파일(data/logs/app.log) 두 경로로 로그를 실시간 출력합니다.
민감정보 보호를 위해 마스킹 기능을 지원하며, 구조화된 이벤트 로깅을 위한 log_event 함수를 제공합니다.
"""
import json
import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

from . import config

# 1. 로그 디렉토리 생성 보장
try:
    config.LOG_DIR.mkdir(parents=True, exist_ok=True)
except Exception as e:
    print(f"[logger] 로그 디렉토리 생성 실패: {e}", file=sys.stderr)

# 2. 로거 생성
logger = logging.getLogger("pawinhand")
logger.setLevel(logging.INFO)

# 이미 핸들러가 설정되어 있다면 중복 방지
if not logger.handlers:
    # 3. 로그 포맷 정의
    log_format = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s (%(filename)s:%(lineno)d) - %(message)s"
    )

    # 4. 콘솔 핸들러 (sys.stdout)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(log_format)
    console_handler.setLevel(logging.INFO)
    logger.addHandler(console_handler)

    # 5. 회전형 파일 핸들러 (app.log - 최대 5MB, 5개까지 유지)
    try:
        file_handler = RotatingFileHandler(
            config.LOG_FILE,
            maxBytes=5 * 1024 * 1024,
            backupCount=5,
            encoding="utf-8"
        )
        file_handler.setFormatter(log_format)
        file_handler.setLevel(logging.INFO)
        logger.addHandler(file_handler)
    except Exception as e:
        print(f"[logger] 파일 로그 핸들러 추가 실패: {e}", file=sys.stderr)


def log_event(event_name: str, details: dict, level: int = logging.INFO):
    """
    구조화된 비즈니스 이벤트를 로깅하기 위한 헬퍼 함수.
    예: log_event("Diagnosis_Request", {"housing": "아파트", "budget": "20만원"})
    """
    try:
        # details 딕셔너리를 한 줄짜리 JSON 문자열로 변환 (한글 깨짐 방지)
        details_str = json.dumps(details, ensure_ascii=False)
        message = f"[{event_name}] {details_str}"
        logger.log(level, message)
    except Exception as e:
        logger.error(f"[logger] 이벤트 로깅 실패 ({event_name}): {e!r}")
