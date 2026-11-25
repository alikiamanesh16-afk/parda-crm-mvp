# ─── FastAPI سرور بک‌اند پردا CRM ──────────────────────────────────────────────
# اجرا:  uvicorn main:app --reload --port 8000
# مستندات خودکار:  http://localhost:8000/docs
#
# Endpoints (قرارداد DATABASE_REQUIREMENTS.md):
#   GET  /api/contacts
#   GET  /api/contacts/{contact_id}
#   GET  /api/contacts/{contact_id}/messages
#   GET  /api/updates?since=
#   POST /api/sms/send                ← ارسال پیامک (فقط با کلید CRM)
#   POST /api/webhook/events          ← گیرنده وب‌هوک دیتابیس (فاز ۳)
#
# تا وقتی .env پر نشده، MOCK_MODE=True است و دیتای نمونه برمی‌گرداند.

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from models import (
    ContactDetail,
    MessagesResponse,
    SendSmsRequest,
    SendSmsResponse,
    UpdatesResponse,
)
from parda_db import db

IRAN_TZ = timezone(timedelta(hours=3, minutes=30))


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    # وضعیت شروع را لاگ کن
    mode = "MOCK (دیتای نمونه)" if settings.mock_mode else f"REAL → {settings.parda_api_base_url}"
    print(f"پردا CRM بک‌اند — حالت: {mode}")
    yield


app = FastAPI(
    title="پردا CRM Backend",
    description="بک‌اند اتصال CRM به دیتابیس پردا — قرارداد در DATABASE_REQUIREMENTS.md",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── احراز هویت فرانت ─────────────────────────────────────────────────────────


def require_crm_key(x_api_key: str) -> None:
    if settings.crm_api_key and x_api_key != settings.crm_api_key:
        raise HTTPException(status_code=401, detail="کلید API نامعتبر است")


# ─── Endpoints برای فرانت ─────────────────────────────────────────────────────


@app.get("/api/contacts")
async def api_contacts(x_api_key: str = Header(default="")) -> dict:
    require_crm_key(x_api_key)
    try:
        contacts = await db.get_contacts()
        return {"items": [c.model_dump() for c in contacts]}
    except RuntimeError:
        raise HTTPException(status_code=503, detail="حالت MOCK — دیتای نمونه") from None


@app.get("/api/contacts/{contact_id}")
async def api_contact_detail(contact_id: str, x_api_key: str = Header(default="")) -> dict:
    require_crm_key(x_api_key)
    detail = await db.get_contact(contact_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="غرفه‌دار پیدا نشد")
    return detail.model_dump()


@app.get("/api/contacts/{contact_id}/messages")
async def api_messages(
    contact_id: str,
    cursor: Optional[str] = Query(default=None),
    x_api_key: str = Header(default=""),
) -> dict:
    require_crm_key(x_api_key)
    msgs: MessagesResponse = await db.get_messages(contact_id, cursor)
    return msgs.model_dump()


@app.get("/api/updates")
async def api_updates(
    since: str = Query(..., description="ISO datetime آخرین بررسی"),
    x_api_key: str = Header(default=""),
) -> dict:
    require_crm_key(x_api_key)
    updates: UpdatesResponse = await db.get_updates(since)
    return updates.model_dump()


@app.post("/api/sms/send")
async def api_sms_send(
    body: dict,
    x_api_key: str = Header(default=""),
) -> dict:
    """ارسال پیامک — فعلاً فقط ثبت می‌شود؛ ارسال واقعی بعد از تأیید کاربر وصل می‌شود."""
    require_crm_key(x_api_key)
    to = (body.get("to") or "").strip()
    text = (body.get("text") or "").strip()
    if not to or not text:
        raise HTTPException(status_code=400, detail="to و text الزامی‌اند")

    # نکته: ارسال واقعی به وب‌ربا اینجا وصل می‌شود (webroba.send_sms).
    # فعلاً ثبت و تأیید ساختاری برمی‌گردانیم — بدون هیچ ارسال واقعی.
    return SendSmsResponse(ok=True, message_id=f"pending-{int(datetime.now().timestamp())}").model_dump()


# ─── وب‌هوک دیتابیس (فاز ۳) ───────────────────────────────────────────────────


@app.post("/api/webhook/events")
async def api_webhook_events(
    body: dict,
    x_webhook_secret: str = Header(default=""),
) -> dict:
    if settings.webhook_secret and x_webhook_secret != settings.webhook_secret:
        raise HTTPException(status_code=401, detail="امضای وب‌هوک نامعتبر است")
    event = body.get("event", "")
    contact_id = body.get("contact_id", "")
    # فعلاً فقط ثبت؛ در فاز ۳ اینجا صف به‌روزرسانی پر می‌شود
    print(f"WEBHOOK: {event} contact={contact_id}")
    return {"received": True}


@app.get("/health")
async def health() -> dict:
    return {
        "ok": True,
        "mock": settings.mock_mode,
        "db_configured": bool(settings.parda_api_base_url and settings.parda_api_key),
    }
