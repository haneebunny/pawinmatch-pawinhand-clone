"""
main.py — [공통] FastAPI 서버의 '입구' 파일 (개발자 B 백엔드).
  1) FastAPI 앱 생성 2) CORS 설정 3) 공통 에러 핸들러 4) 진단·매칭 라우터 등록
실행: backend/ 에서  uvicorn main:app --reload   (문서: http://localhost:8000/docs)
"""
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import config
from app.routers import diagnose, match, animals, questions

app = FastAPI(
    title="Pawinhand Clone API (B: AI 진단·매칭)",
    description="유기동물 입양 적합도 진단·매칭 데모 백엔드 (개발자 B)",
    version="0.1.0",
)

# CORS 허용 주소는 config 한 곳에서 관리
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 입력값 형식 오류(422): 어디가 틀렸는지 알기 쉽게 반환
@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"error": "입력값 형식이 올바르지 않습니다.", "detail": exc.errors()},
    )


# 예상 못 한 서버 오류(500): 서버가 죽지 않고 안전한 메시지 반환
@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception):
    print(f"[main] 처리되지 않은 에러: {exc!r}")
    return JSONResponse(
        status_code=500,
        content={"error": "서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요."},
    )


# 라우터 등록 (진단, 매칭, 동물조회, 질문지)
app.include_router(diagnose.router)   # POST /api/diagnose
app.include_router(match.router)      # POST /api/match
app.include_router(animals.router)    # GET /api/animals
app.include_router(questions.router)  # POST /api/questions


@app.get("/", tags=["health"])
def health_check():
    """서버가 살아있는지 확인하는 창구."""
    return {"status": "ok", "message": "백엔드 서버 정상 작동 중 (B)", "llm_enabled": bool(config.OPENAI_API_KEY)}
