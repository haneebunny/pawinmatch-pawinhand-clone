import json
import urllib.request
import os
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.logger import logger, log_event

def mask_name(name: str) -> str:
    if not name:
        return ""
    name = name.strip()
    if len(name) <= 1:
        return "*"
    elif len(name) == 2:
        return name[0] + "*"
    else:
        return name[0] + "*" * (len(name) - 2) + name[-1]

def mask_phone(phone: str) -> str:
    if not phone:
        return ""
    phone = phone.strip()
    clean = phone.replace("-", "")
    if len(clean) >= 10:
        masked = clean[:3] + "****" + clean[7:]
        if "-" in phone:
            parts = phone.split("-")
            if len(parts) == 3:
                return f"{parts[0]}-****-{parts[2]}"
        return f"{masked[:3]}-{masked[3:7]}-{masked[7:]}"
    return phone[:3] + "****" + phone[7:] if len(phone) > 7 else "***-****"

router = APIRouter(prefix="/api", tags=["application"])

class ApplicationInput(BaseModel):
    name: str
    phone: str
    questions: Optional[str] = ""
    message: Optional[str] = ""
    animal_id: Optional[str] = None
    animal_name: Optional[str] = None
    shelter_name: Optional[str] = None
    match_score: Optional[int] = None
    recommend_reason: Optional[str] = None
    checked_items: Optional[List[str]] = []

@router.post("/submit-application")
def submit_application(data: ApplicationInput):
    # Mask PII for logger safety
    m_name = mask_name(data.name)
    m_phone = mask_phone(data.phone)
    
    log_event("Application_Submitted", {
        "name": m_name,
        "phone": m_phone,
        "animal_id": data.animal_id,
        "animal_name": data.animal_name,
        "shelter_name": data.shelter_name,
        "match_score": data.match_score,
        "has_questions": bool(data.questions),
        "has_message": bool(data.message),
        "checked_items_count": len(data.checked_items) if data.checked_items else 0
    })

    # Retrieve Webhook URL from environment variables
    slack_webhook_url = os.getenv("SLACK_WEBHOOK_URL")
    
    if not slack_webhook_url:
        logger.info("[Slack Notification] SLACK_WEBHOOK_URL is not set. Simulating local submission.")
        log_event("Application_Slack_Success", {
            "animal_id": data.animal_id,
            "mode": "local_simulation"
        })
        return {"status": "success", "message": "제출 완료 (로컬 데모 제출)"}

    # Build Slack Message Payload in Markdown Blocks
    title = f"📢 *[포인핸드 AI 매칭] 신규 입양 신청서 접수!*"
    
    # Build AI match info if available
    match_info = ""
    if data.match_score is not None:
        match_info = f"\n• *AI 매칭 점수*: `{data.match_score}점 / 10점`"
        if data.recommend_reason:
            clean_reason = data.recommend_reason.replace("==", "")
            match_info += f"\n• *매칭 추천 사유*: {clean_reason}"

    details = (
        f"• *신청인*: {data.name}\n"
        f"• *연락처*: {data.phone}\n"
        f"• *신청 대상 동물*: {data.animal_name or '이름 짓는 중'} ({data.animal_id or '정보 없음'})\n"
        f"• *상담 대상 보호소*: {data.shelter_name or '정보 없음'}"
        f"{match_info}"
    )
    
    # Parse default checklist items check status
    default_items = [
        "동물을 평생 책임지고 키울 수 있는 경제적 여건이 마련되었나요?",
        "가족 구성원 전원이 입양에 동의했나요?",
        "소음이나 알레르기 등으로 인한 이웃과의 마찰 대비책이 있나요?",
        "동물이 혼자 지낼 시간의 한계를 알고 있으며, 이에 대비하셨나요?",
        "반려동물이 거주할 공간 내 위험 물질 및 탈출 경로를 차단하셨나요?"
    ]
    
    checklist_lines = []
    for item in default_items:
        is_checked = any(item[:15] in checked for checked in (data.checked_items or []))
        marker = "✅" if is_checked else "❌"
        checklist_lines.append(f"{marker} {item}")
    
    checklist_section = "📋 *사전 입양 준비 체크리스트 현황*:\n" + "\n".join(checklist_lines)
    q_section = f"❓ *보호소에 물어보고 싶은 점*:\n>{data.questions or '(없음)'}"
    msg_section = f"💬 *입양 다짐 한마디*:\n>{data.message or '(없음)'}"

    payload = {
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": title
                }
            },
            {
                "type": "divider"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": details
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": checklist_section
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": q_section
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": msg_section
                }
            }
        ]
    }

    try:
        req = urllib.request.Request(
            slack_webhook_url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as res:
            response_code = res.getcode()
            if response_code == 200 or response_code == 204:
                log_event("Application_Slack_Success", {
                    "animal_id": data.animal_id,
                    "mode": "slack_webhook"
                })
                return {"status": "success", "message": "신청서가 성공적으로 제출되었으며 Slack 알림이 전송되었습니다."}
            else:
                raise HTTPException(status_code=500, detail="Slack Webhook returned error code")
    except Exception as e:
        logger.error(f"[Slack Notification Error] Failed to send message: {e}")
        log_event("Application_Slack_Failure", {
            "animal_id": data.animal_id,
            "error": str(e)
        }, level=logging.ERROR)
        raise HTTPException(
            status_code=500,
            detail=f"Slack 전송 도중 에러가 발생했습니다: {str(e)}"
        )
